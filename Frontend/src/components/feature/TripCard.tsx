import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Calendar, Users } from 'lucide-react';
import { Trip } from '../../types';
import { useTrips } from '../../context/TripsContext';
import { Badge } from '../ui/Badge';

export interface TripCardProps {
  trip: Trip;
  showSaveButton?: boolean;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, showSaveButton = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTripSaved, toggleSaveTrip } = useTrips();
  const saved = isTripSaved(trip.id);
  const isInApp = location.pathname.startsWith('/app');
  const targetPath = isInApp ? `/app/trips/${trip.id}` : `/trips/${trip.id}`;

  return (
    <div
      onClick={() => navigate(targetPath)}
      className="group bg-white rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col text-left"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={trip.coverImageUrl}
          alt={trip.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

        {/* Save / Bookmark heart toggle */}
        {showSaveButton && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveTrip(trip.id);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-text hover:text-red-500 hover:scale-110 transition-all shadow-sm"
            aria-label={saved ? 'Remove from saved trips' : 'Save trip'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                saved ? 'fill-red-500 text-red-500' : 'text-text-muted'
              }`}
            />
          </button>
        )}

        {/* Trip type badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="primary" size="sm" className="capitalize backdrop-blur-md bg-primary/90 font-medium">
            {trip.tripType} Trip
          </Badge>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-heading font-semibold text-base sm:text-lg text-text group-hover:text-primary transition-colors line-clamp-1">
            {trip.name}
          </h3>

          <div className="flex items-center gap-3 text-xs text-text-muted mt-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-subtle" />
              {trip.startDate}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-text-subtle" />
              {trip.members.length} members
            </span>
          </div>
        </div>

        {/* Price Row */}
        <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-border">
          <div>
            <span className="text-xs text-text-subtle block">Starts from</span>
            <span className="text-sm sm:text-base font-bold text-primary">
              ₹{trip.budgetPerPerson.toLocaleString()}
            </span>
            <span className="text-xs text-text-muted"> / person</span>
          </div>
          <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
};
