import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Wallet, Calendar, Heart } from 'lucide-react';
import { Destination } from '../../types';

export interface DestinationCardProps {
  destination: Destination;
  linkPrefix?: string;
  onSelect?: (destination: Destination) => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  linkPrefix = '/explore',
  onSelect,
  isSaved: externalSaved,
  onToggleSave,
}) => {
  const navigate = useNavigate();

  const [internalSaved, setInternalSaved] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tripzobox_saved_destinations');
      if (saved) {
        const list = JSON.parse(saved);
        return Array.isArray(list) && list.includes(destination.id);
      }
    } catch {
      // ignore
    }
    return false;
  });

  const isSaved = externalSaved !== undefined ? externalSaved : internalSaved;

  const handleToggleHeart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isSaved;
    setInternalSaved(next);
    try {
      const saved = localStorage.getItem('tripzobox_saved_destinations');
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];
      if (next) {
        if (!list.includes(destination.id)) list.push(destination.id);
      } else {
        list = list.filter((id) => id !== destination.id);
      }
      localStorage.setItem('tripzobox_saved_destinations', JSON.stringify(list));
    } catch {
      // ignore
    }
    if (onToggleSave) onToggleSave(destination.id);
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(destination);
    } else {
      navigate(`${linkPrefix}/${destination.slug}`);
    }
  };

  const ratingValue = destination.rating || 4.7;
  const reviewCountDisplay = destination.reviewCount || '1.1k';
  const costDisplay = destination.estimatedCostPerDay || '₹1,500 - ₹2,500';
  const bestTimeDisplay = destination.bestTimeToVisit || 'Oct - Mar';
  const tagsList = destination.tags || ['Nature', 'Photo Spots', 'Culture'];

  return (
    <div
      onClick={handleClick}
      className="group bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-500/40 hover:shadow-card hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col text-left overflow-hidden"
    >
      {/* 1. Cover Image with Badge and Heart */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={destination.imageUrl}
          alt={destination.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top-Left Category Badge */}
        <div className="absolute top-3 left-3 bg-[#0D5A46]/85 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs border border-white/20 select-none">
          <span>{destination.badge || 'Popular'}</span>
        </div>

        {/* Top-Right Heart Bookmark Button */}
        <button
          type="button"
          onClick={handleToggleHeart}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs flex items-center justify-center text-white hover:scale-105 transition-all shadow-xs cursor-pointer z-10"
          aria-label={isSaved ? 'Remove from saved' : 'Save destination'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isSaved ? 'fill-red-500 text-red-500' : 'text-white'
            }`}
          />
        </button>
      </div>

      {/* 2. Card Content Body */}
      <div className="p-2.5 sm:p-5 flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-2.5">
        <div>
          {/* Row 1: Title & Rating */}
          <div className="flex items-start justify-between gap-1 sm:gap-2">
            <h3 className="font-heading font-bold text-xs sm:text-base text-gray-900 group-hover:text-primary transition-colors line-clamp-1 flex-1">
              {destination.name}
            </h3>

            <div className="flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-xs font-semibold text-emerald-700 shrink-0">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-emerald-600 text-emerald-600" />
              <span>{ratingValue.toFixed(1)}</span>
              <span className="text-gray-400 font-normal hidden sm:inline">({reviewCountDisplay})</span>
            </div>
          </div>

          {/* Row 2: Location with Pin */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{destination.state}</span>
          </div>

          {/* Row 3: Meta (Cost & Best time) - stacked on mobile so cost is never cut off */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] sm:text-xs text-gray-600 mt-1.5 sm:mt-2.5 pt-1.5 sm:pt-2 border-t border-gray-100 gap-1 sm:gap-2">
            <div className="flex items-center gap-1 text-gray-800 font-semibold truncate">
              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{costDisplay}</span>
              <span className="text-[9px] sm:text-[10px] text-gray-400 font-normal shrink-0">/day</span>
            </div>

            <div className="flex items-center gap-1 text-gray-500 truncate">
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Best time {bestTimeDisplay}</span>
            </div>
          </div>

          {/* Row 4: Short Description */}
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2 line-clamp-1 sm:line-clamp-2 leading-relaxed">
            {destination.shortDescription}
          </p>
        </div>

        {/* Row 5: Tags */}
        <div className="flex flex-wrap gap-1 pt-1.5 sm:pt-2">
          {tagsList.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] sm:text-[11px] font-medium text-emerald-800 bg-emerald-50/80 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-200/50 truncate"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
export default DestinationCard;
