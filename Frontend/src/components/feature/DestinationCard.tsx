import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Sparkles } from 'lucide-react';
import { Destination } from '../../types';

export interface DestinationCardProps {
  destination: Destination;
  linkPrefix?: string;
  onSelect?: (destination: Destination) => void;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  linkPrefix = '/explore',
  onSelect,
}) => {
  const navigate = useNavigate();
  const photoCount = destination.galleryImages?.length || 1;

  return (
    <button
      type="button"
      onClick={() => onSelect ? onSelect(destination) : navigate(`${linkPrefix}/${destination.slug}`)}
      className="group w-full cursor-pointer text-left transition-all duration-200 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
    >
      {/* Landscape Image with rounded-2xl corners matching Reference Screen 10 */}
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 shadow-subtle group-hover:shadow-card transition-all duration-300">
        <img
          src={destination.imageUrl}
          alt={destination.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Hidden Spot badge top left */}
        {(destination.isHiddenSpot || destination.category === 'Hidden Spots') && (
          <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-accent text-[11px] font-bold flex items-center gap-1 shadow-sm">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Hidden Spot</span>
          </div>
        )}

        {/* Subtle camera icon badge top right with photo count if > 1 */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/45 backdrop-blur-sm text-white text-[11px] font-semibold flex items-center gap-1 group-hover:bg-primary transition-colors shadow-sm">
          <Camera className="w-3.5 h-3.5" />
          {photoCount > 1 && <span>{photoCount}</span>}
        </div>
      </div>

      {/* Text below the image matching Reference Screen 10 */}
      <div className="pt-2.5 px-0.5">
        <h4 className="font-heading font-bold text-base sm:text-lg text-text group-hover:text-primary transition-colors">
          {destination.name}
        </h4>
        <p className="text-xs text-text-muted font-medium mt-0.5">
          {destination.state}
        </p>
      </div>
    </button>
  );
};
