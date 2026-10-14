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
    <div className="flex flex-col gap-6 text-left max-w-6xl mx-auto">
      {/* 1. TOP COVER BANNER (Matching Reference Screen 11) */}
      <div className="relative rounded-3xl overflow-hidden aspect-[21/9] min-h-[200px] max-h-[340px] w-full bg-text shadow-float">
        <img
          src={story.coverImageUrl}
          alt={story.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        
        {/* Back link floating on banner */}
        <Link
          to="/explore"
          className="absolute top-5 left-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-semibold backdrop-blur-md transition-all border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </Link>
      </div>

      {/* 2. MAIN STORY CONTENT & SIDEBAR (2-Column Grid matching Reference Screen 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left 2 Columns: Story Body Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-card space-y-6">
          {/* Story Title below banner (Matching Reference Screen 11) */}
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-text leading-tight">
            {story.title}
          </h1>

          {/* Author & Meta Row */}
          <div className="flex items-center justify-between gap-4 py-2 border-b border-border/80">
            <div className="flex items-center gap-3">
              <Avatar src={story.author.avatarUrl} name={story.author.name} size="md" />
              <div>
                <h4 className="font-semibold text-sm sm:text-base text-text">{story.author.name}</h4>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-text-subtle" />
                    {story.dates}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-text-subtle" />
                    {story.readTimeMins} min read
                  </span>
                </div>
              </div>
            </div>

            {/* Follow Button & Share (Matching Reference Screen 11) */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsFollowing(!isFollowing);
                  success(isFollowing ? `Unfollowed ${story.author.name}` : `Following ${story.author.name}!`);
                }}
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  isFollowing
                    ? 'bg-accent/35 text-primary border-accent'
                    : 'bg-white text-primary border-primary hover:bg-accent-light'
                }`}
              >
                {isFollowing ? 'Following ✓' : 'Follow'}
              </button>
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

          {/* Narrative Intro Paragraph */}
          <p className="text-sm sm:text-base text-text-muted leading-relaxed">
            {story.summary}
          </p>

          {/* 3-Photo Gallery Grid (Matching Reference Screen 11) */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {(story.galleryImages || [
              story.coverImageUrl,
              'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80',
              'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=600&q=80',
            ]).map((imgUrl, i) => (
              <div
                key={i}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-border group shadow-xs"
              >
                <img
                  src={imgUrl}
                  alt={`Gallery view ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>

          {/* Inline Expanded Full Story */}
          {isFullStoryExpanded && story.fullContent && (
            <div className="pt-4 space-y-4 border-t border-border animate-in fade-in duration-300">
              <h4 className="font-heading font-bold text-lg text-text">
                The Complete Experience
              </h4>
              {story.fullContent.map((paragraph, index) => (
                <p key={index} className="text-sm sm:text-base text-text-muted leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {/* Bottom Stats & Read Full Story CTA Row (Matching Reference Screen 11) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border">
            {/* Interaction Icons (Likes, Comments, Views) */}
            <div className="flex items-center gap-5 text-xs sm:text-sm text-text-muted">
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
                <span>{(story.views / 1000).toFixed(1)}K</span>
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
              className="font-semibold px-6 py-2.5 rounded-xl shadow-subtle hover:shadow-hover"
            >
              {isFullStoryExpanded ? 'Collapse Story' : 'Read Full Story'}
            </Button>
          </div>
        </div>

        {/* Right Sidebar: Related Stories (Matching Reference Screen 11) */}
        <div className="space-y-4 text-left">
          <div className="bg-white rounded-3xl border border-border p-5 shadow-card">
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
