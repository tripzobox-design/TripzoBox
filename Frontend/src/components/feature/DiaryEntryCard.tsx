import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2, BookOpen, Calendar, Compass, Globe, Lock } from 'lucide-react';
import { DiaryEntry } from '../../types';

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
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-border shadow-subtle hover:shadow-card hover:border-primary/40 transition-all duration-200 gap-4 text-left">
      <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
        {/* Landscape Thumbnail (Matching Reference Screen 8) */}
        <div className="w-28 h-20 sm:w-36 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-gray-100 border border-border shadow-xs">
          {entry.photos.length > 0 ? (
            <img
              src={entry.photos[0]}
              alt={entry.place}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-accent/20 text-primary font-bold text-xl">
              {entry.place[0]}
            </div>
          )}
        </div>

        {/* Content (Title, Date · Category, Snippet) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-heading font-bold text-base sm:text-lg text-text truncate">
              {entry.place}
            </h4>
            {entry.isPublished && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Globe className="w-3 h-3" />
                Published
              </span>
            )}
          </div>

          {/* Metadata line with icons (Matching Reference Screen 8) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-text-subtle" />
              {entry.date}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1 text-primary font-medium">
              <Compass className="w-3.5 h-3.5" />
              {entry.category}
            </span>
          </div>

          {/* Description snippet */}
          <p className="text-xs sm:text-sm text-text-muted mt-2 line-clamp-2 leading-relaxed">
            {entry.text}
          </p>
        </div>
      </div>

      {/* Actions (Pill Edit button + 3 dots matching Reference Screen 8) */}
      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={() => onEdit(entry)}
          className="border border-border hover:border-primary/60 px-4 py-1.5 rounded-full text-xs font-semibold text-text hover:text-primary hover:bg-light-bg transition-all shadow-xs"
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
