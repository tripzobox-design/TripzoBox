import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Calendar,
  Camera,
  Navigation,
  MapPin,
  Star,
  Flame,
} from 'lucide-react';
import { Story } from '../../types';
import { Avatar } from '../ui/Avatar';

export interface StoryCardProps {
  story: Story;
  variant?: 'standard' | 'compact';
  isBookmarked?: boolean;
  onToggleBookmark?: (storyId: string) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  variant = 'standard',
  isBookmarked: externalBookmarked,
  onToggleBookmark,
}) => {
  const navigate = useNavigate();

  const [internalBookmarked, setInternalBookmarked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tripzobox_bookmarked_stories');
      if (saved) {
        const list = JSON.parse(saved);
        return Array.isArray(list) && list.includes(story.id);
      }
    } catch {
      // ignore
    }
    return false;
  });

  const isBookmarked =
    externalBookmarked !== undefined ? externalBookmarked : internalBookmarked;

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isBookmarked;
    setInternalBookmarked(nextState);

    try {
      const saved = localStorage.getItem('tripzobox_bookmarked_stories');
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];
      if (nextState) {
        if (!list.includes(story.id)) list.push(story.id);
      } else {
        list = list.filter((id) => id !== story.id);
      }
      localStorage.setItem('tripzobox_bookmarked_stories', JSON.stringify(list));
    } catch {
      // ignore
    }

    if (onToggleBookmark) {
      onToggleBookmark(story.id);
    }
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={() => navigate(`/stories/${story.slug}`)}
        className="group flex items-center gap-3 p-2.5 rounded-xl bg-white border border-border/80 hover:border-primary/40 hover:shadow-subtle transition-all cursor-pointer text-left"
      >
        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
          <img
            src={story.coverImageUrl}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h5 className="font-heading font-medium text-xs sm:text-sm text-text line-clamp-1 group-hover:text-primary transition-colors">
            {story.title}
          </h5>
          <p className="text-[11px] text-text-muted mt-0.5 truncate">
            by {story.author.name}
          </p>
        </div>
      </div>
    );
  }

  const isFlameBadge = story.badge?.toLowerCase().includes('popular');

  return (
    <div
      onClick={() => navigate(`/stories/${story.slug}`)}
      className="group bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-500/30 overflow-hidden shadow-xs hover:shadow-card hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col text-left"
    >
      {/* Top Image Container */}
      <div className="relative w-full h-32 sm:h-48 md:h-52 overflow-hidden bg-gray-100">
        <img
          src={story.coverImageUrl}
          alt={story.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top-Left Badge */}
        {story.badge && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/95 backdrop-blur-xs text-gray-800 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 sm:gap-1.5 shadow-2xs border border-gray-200/60 z-10 select-none">
            {isFlameBadge ? (
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
            ) : (
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 fill-emerald-600" />
            )}
            <span>{story.badge}</span>
          </div>
        )}

        {/* Top-Right Bookmark Button */}
        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 rounded-lg backdrop-blur-xs transition-all z-10 cursor-pointer ${
            isBookmarked
              ? 'bg-primary text-white shadow-xs'
              : 'bg-black/40 hover:bg-black/60 text-white'
          }`}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
        >
          <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-2.5 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Story Title */}
          <h3 className="font-heading font-bold text-xs sm:text-base text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
            {story.title}
          </h3>

          {/* Location Row */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{story.destination}</span>
          </div>

          {/* Metadata Row (Days, Photos, Places) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3.5 text-[10px] sm:text-xs text-gray-600 mt-2 sm:mt-3 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
              {story.days || 3}d
            </span>
            <span className="flex items-center gap-1">
              <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
              {story.photosCount || 28} photos
            </span>
          </div>

          {/* Summary / Excerpt */}
          <p className="hidden sm:block text-xs text-gray-500 mt-2.5 line-clamp-2 leading-relaxed">
            {story.summary}
          </p>
        </div>

        {/* Footer Row (Author Info & Rating Badge) */}
        <div className="flex items-center justify-between pt-2 sm:pt-3.5 mt-2.5 sm:mt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Avatar src={story.author.avatarUrl} name={story.author.name} size="xs" />
            <div className="min-w-0 text-left">
              <p className="text-[11px] sm:text-xs font-semibold text-gray-900 truncate">
                {story.author.name}
              </p>
              <p className="text-[9px] sm:text-[11px] text-gray-400 leading-tight hidden sm:block">
                {story.timeAgo || '3 days ago'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-300 bg-emerald-50/70 text-emerald-800 text-xs font-semibold shrink-0">
            <Star className="w-3 h-3 text-emerald-600 fill-emerald-600" />
            <span>{story.rating ? story.rating.toFixed(1) : '4.8'}</span>
            <span className="text-emerald-700/70 font-normal">
              ({story.reviewCount || 120})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
