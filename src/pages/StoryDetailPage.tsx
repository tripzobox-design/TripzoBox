import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Eye,
  Share2,
  Clock,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDiary } from '../context/DiaryContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { StoryCard } from '../components/feature/StoryCard';

export const StoryDetailPage: React.FC = () => {
  const { storySlug } = useParams<{ storySlug: string }>();
  const navigate = useNavigate();
  const { stories, getStoryBySlug } = useDiary();
  const { success } = useToast();

  const story = getStoryBySlug(storySlug || 'exploring-gods-own-country') || stories[0];

  const [isFollowing, setIsFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState(story?.likes || 482);
  const [hasLiked, setHasLiked] = useState(false);
  const [isFullStoryExpanded, setIsFullStoryExpanded] = useState(false);

  if (!story) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-heading font-bold text-2xl text-text">Story not found</h2>
        <Button variant="primary" onClick={() => navigate('/stories')} className="mt-4">
          Browse All Stories
        </Button>
      </div>
    );
  }

  const handleLike = () => {
    if (!hasLiked) {
      setLikesCount(likesCount + 1);
      setHasLiked(true);
      success('Liked this travel story!');
    } else {
      setLikesCount(likesCount - 1);
      setHasLiked(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    success('Story link copied to clipboard!');
  };

  const otherStories = stories.filter((s) => s.id !== story.id).slice(0, 4);

  return (
    <div className="flex flex-col gap-8 text-left max-w-6xl mx-auto">
      {/* Back Link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* 1. HERO COVER WITH OVERLAID TITLE (Matching Screen 11) */}
        <div className="relative rounded-3xl overflow-hidden aspect-[21/9] min-h-[260px] max-h-[420px] w-full bg-text shadow-float">
          <img
            src={story.coverImageUrl}
            alt={story.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

          {/* Overlaid details */}
          <div className="absolute bottom-6 left-6 sm:left-10 right-6 text-white max-w-3xl">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider block mb-1">
              {story.destination}
            </span>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl lg:text-5xl text-white leading-tight">
              {story.title}
            </h1>
          </div>
        </div>
      </div>

      {/* 2. MAIN STORY CONTENT & SIDEBAR (Matching Screen 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Author Bar, Narrative, Gallery, Full Story */}
        <div className="lg:col-span-2 space-y-6">
          {/* Author Bar */}
          <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-subtle flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar src={story.author.avatarUrl} name={story.author.name} size="md" />
              <div>
                <h4 className="font-semibold text-sm sm:text-base text-text">{story.author.name}</h4>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {story.dates}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {story.readTimeMins} min read
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => {
                  setIsFollowing(!isFollowing);
                  success(isFollowing ? `Unfollowed ${story.author.name}` : `Following ${story.author.name}!`);
                }}
                className="text-xs px-4"
              >
                {isFollowing ? 'Following ✓' : 'Follow'}
              </Button>
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-xl text-text-subtle hover:text-primary hover:bg-light-bg transition-colors"
                aria-label="Share Story"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Narrative Summary Paragraph */}
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card space-y-6">
            <p className="text-base sm:text-lg text-text font-medium leading-relaxed font-heading border-l-4 border-primary pl-4">
              "{story.summary}"
            </p>

            {/* Photo Gallery Grid (3 Photos in a row matching Screen 11) */}
            <div>
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 font-heading">
                Photo Gallery
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(story.galleryImages || [
                  story.coverImageUrl,
                  'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80',
                  'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=600&q=80',
                ]).map((imgUrl, i) => (
                  <div
                    key={i}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-border group"
                  >
                    <img
                      src={imgUrl}
                      alt={`Gallery view ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Inline Full Story Accordion Expansion */}
            {isFullStoryExpanded && story.fullContent && (
              <div className="pt-4 space-y-4 border-t border-border animate-in fade-in duration-300">
                <h4 className="font-heading font-bold text-lg text-text">
                  The Full Travel Journey
                </h4>
                {story.fullContent.map((paragraph, index) => (
                  <p key={index} className="text-sm sm:text-base text-text-muted leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {/* Stats Row + Read Full Story Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border">
              {/* Interaction Icons */}
              <div className="flex items-center gap-5 text-sm text-text-muted">
                <button
                  type="button"
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 transition-colors ${
                    hasLiked ? 'text-red-500 font-semibold' : 'hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{likesCount}</span>
                </button>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-text-subtle" />
                  <span>{story.comments}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-text-subtle" />
                  <span>{story.views.toLocaleString()}</span>
                </span>
              </div>

              {/* Read Full Story Button */}
              <Button
                variant="primary"
                onClick={() => setIsFullStoryExpanded(!isFullStoryExpanded)}
                iconRight={
                  isFullStoryExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )
                }
                className="font-semibold px-6 shadow-subtle"
              >
                {isFullStoryExpanded ? 'Collapse Story' : 'Read Full Story'}
              </Button>
            </div>
          </div>

          {/* Safety & Moderation Disclaimer Note */}
          <div className="p-4 rounded-xl bg-light-bg border border-border text-xs text-text-muted">
            <span className="font-semibold text-text">Community Story Guidelines:</span> Published stories represent individual traveller impressions and tips. Before setting out on similar trekking routes, always check local weather advisories and verify trail accessibility.
          </div>
        </div>

        {/* Right Sidebar: Related Stories Mini Cards (Matching Screen 11) */}
        <div className="space-y-4 text-left">
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
            <h4 className="font-heading font-bold text-base text-text mb-4">
              Related Stories
            </h4>
            <div className="space-y-3">
              {otherStories.map((s) => (
                <StoryCard key={s.id} story={s} variant="compact" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
