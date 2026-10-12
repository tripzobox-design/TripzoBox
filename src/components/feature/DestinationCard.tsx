import React from 'react';
import { useNavigate } from 'react-router-dom';
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
      className="group relative rounded-2xl overflow-hidden shadow-card border border-border/80 cursor-pointer aspect-[4/3] bg-gray-100 text-left transition-all duration-300 hover:shadow-hover hover:-translate-y-1"
    >
      <img
        src={destination.imageUrl}
        alt={destination.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <h4 className="font-heading font-bold text-lg sm:text-xl text-white group-hover:text-accent transition-colors">
          {destination.name}
        </h4>
        <p className="text-xs sm:text-sm text-gray-200 font-medium mt-0.5">
          {destination.state}
        </p>
      </div>
    </div>
  );
};
