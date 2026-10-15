import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Calendar, Users } from 'lucide-react';
import { Trip } from '../../types';
import { useTrips } from '../../context/TripsContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export interface TripCardProps {
  trip: Trip;
  showSaveButton?: boolean;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, showSaveButton = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTripSaved, toggleSaveTrip } = useTrips();
  const { user } = useAuth();
  const isLeader = user && trip.leader.id === user.id;
  const saved = isTripSaved(trip.id);
  const isInApp = location.pathname.startsWith('/app');
  const targetPath = isInApp ? `/app/trips/${trip.id}` : `/trips/${trip.id}`;

  return (
    <div
      onClick={() => navigate(targetPath)}
      className="group bg-white rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-row sm:flex-col text-left"
    >
      {/* Cover Image */}
      <div className="relative w-[105px] shrink-0 sm:w-full sm:aspect-[16/10] overflow-hidden bg-gray-100">
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

        {/* Badges: Trip Leader & Room Type */}
        <div className="absolute bottom-3 left-3 hidden sm:flex flex flex-wrap items-center gap-1.5">
          {isLeader ? (
            <span className="backdrop-blur-md bg-emerald-700/95 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/50 shadow-xs flex items-center gap-1">
              👑 Trip Leader
            </span>
          ) : (
            <Badge variant="primary" size="sm" className="capitalize backdrop-blur-md bg-primary/90 font-medium">
              {trip.tripType} Trip
            </Badge>
          )}

          {trip.roomType === 'public' && (
            <span className="backdrop-blur-md bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1">
              🌐 Public Space
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="min-w-0 p-3 sm:p-4 lg:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-heading font-semibold text-base sm:text-lg text-text group-hover:text-primary transition-colors line-clamp-1">
            {trip.name}
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-text-muted mt-1.5">
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
        <div className="flex items-center justify-between pt-2 mt-2 lg:pt-3.5 lg:mt-3.5 border-t border-border">
          <div>
            <span className="text-xs text-text-subtle block">Starts from</span>
            <span className="text-sm sm:text-base font-bold text-primary">
              ₹{trip.budgetPerPerson.toLocaleString()}
            </span>
            <span className="text-xs text-text-muted"> / person</span>
          </div>
          <span className="hidden sm:inline-flex text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
};
