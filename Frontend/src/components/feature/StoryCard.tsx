import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Clock } from 'lucide-react';
import { Story } from '../../types';
import { Avatar } from '../ui/Avatar';

export interface StoryCardProps {
  story: Story;
  variant?: 'standard' | 'compact';
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, variant = 'standard' }) => {
  const navigate = useNavigate();

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

  return (
    <div
      onClick={() => navigate(`/stories/${story.slug}`)}
      className="group bg-white rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col text-left"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={story.coverImageUrl}
          alt={story.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {story.readTimeMins} min read
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-primary">{story.destination}</span>
          <h3 className="font-heading font-semibold text-base sm:text-lg text-text mt-1 line-clamp-2 group-hover:text-primary transition-colors">
            {story.title}
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mt-2 line-clamp-2 leading-relaxed">
            {story.summary}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Avatar src={story.author.avatarUrl} name={story.author.name} size="xs" />
            <span className="text-xs font-medium text-text">{story.author.name}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-text-subtle" />
              {story.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-text-subtle" />
              {story.comments}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
