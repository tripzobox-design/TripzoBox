import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2, BookOpen, Lock, Globe } from 'lucide-react';
import { DiaryEntry } from '../../types';
import { Badge } from '../ui/Badge';

export interface DiaryEntryCardProps {
  entry: DiaryEntry;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
  onAddToStory: (entry: DiaryEntry) => void;
}

export const DiaryEntryCard: React.FC<DiaryEntryCardProps> = ({
  entry,
  onEdit,
  onDelete,
  onAddToStory,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-2xl border border-border/80 shadow-subtle hover:shadow-card hover:border-primary/40 transition-all duration-200 gap-4 text-left">
      <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 w-full sm:w-auto">
        {/* Thumbnail */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-border">
          {entry.photos.length > 0 ? (
            <img
              src={entry.photos[0]}
              alt={entry.place}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-accent/20 text-primary font-bold">
              {entry.place[0]}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-heading font-semibold text-base sm:text-lg text-text truncate">
              {entry.place}
            </h4>
            <Badge variant="accent" size="sm">
              {entry.category}
            </Badge>
            {entry.isPublished ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                <Globe className="w-3 h-3" />
                Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted bg-gray-100 px-2 py-0.5 rounded-md">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
          </div>

          <p className="text-xs text-text-subtle mt-0.5">{entry.date}</p>

          <p className="text-xs sm:text-sm text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
            {entry.text}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={() => onEdit(entry)}
          className="text-xs font-semibold text-primary hover:text-primary-hover px-2.5 py-1.5 rounded-lg hover:bg-accent-light transition-colors"
        >
          Edit
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-text-subtle hover:text-text hover:bg-light-bg transition-colors"
            aria-label="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-float border border-border py-1.5 z-30">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(entry);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-light-bg hover:text-primary transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Entry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onAddToStory(entry);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-light-bg hover:text-primary transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Add to Story
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(entry.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Entry
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
