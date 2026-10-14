import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { Destination } from '../../types';

export interface DestinationCardProps {
  destination: Destination;
  linkPrefix?: string;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  linkPrefix = '/explore',
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`${linkPrefix}/${destination.slug}`)}
      className="group cursor-pointer text-left transition-all duration-200"
    >
      {/* Landscape Image with rounded-2xl corners matching Reference Screen 10 */}
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 shadow-subtle group-hover:shadow-card transition-all duration-300">
        <img
          src={destination.imageUrl}
          alt={destination.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Subtle camera icon badge top right matching reference */}
        <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/35 backdrop-blur-sm text-white/90 group-hover:bg-primary transition-colors">
          <Camera className="w-3.5 h-3.5" />
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
    </div>
  );
};
