import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Heart,
  Calendar,
  Users,
  MapPin,
  Star,
  Wallet,
  Navigation,
  ArrowRight,
} from 'lucide-react';
import { Trip } from '../../types';
import { useTrips } from '../../context/TripsContext';

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

  const badgeText = trip.badge || (trip.tripType === 'solo' ? 'Solo Friendly' : trip.tripType === 'couple' ? 'Couple Friendly' : 'Group Trip');
  const ratingValue = trip.rating || 4.8;
  const reviewsCount = trip.reviewCount || 24;
  const spotsLeftCount = trip.spotsLeft ?? Math.max(1, trip.maxMembers - trip.members.length);
  const organizerDisplay = trip.organizerName || trip.leader.name;
  const tagsList = trip.tags || trip.preferences.slice(0, 3);

  return (
    <div
      onClick={() => navigate(targetPath)}
      className="group bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-500/40 hover:shadow-card hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col text-left overflow-hidden"
    >
      {/* 1. Cover Image with Badge & Bookmark */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={trip.coverImageUrl}
          alt={trip.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top-Left Category Badge */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#0D5A46]/90 backdrop-blur-xs text-white text-[9px] sm:text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 shadow-2xs border border-white/20 select-none max-w-[70%] truncate">
          <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-200 shrink-0" />
          <span className="truncate">{badgeText}</span>
        </div>

        {/* Top-Right Heart Bookmark Button */}
        {showSaveButton && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveTrip(trip.id);
            }}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs flex items-center justify-center text-white hover:scale-105 transition-all shadow-xs cursor-pointer z-10"
            aria-label={saved ? 'Remove from saved trips' : 'Save trip'}
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                saved ? 'fill-red-500 text-red-500' : 'text-white'
              }`}
            />
          </button>
        )}
      </div>

      {/* 2. Card Content Body */}
      <div className="p-2.5 sm:p-4 lg:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        <div>
          {/* Row 1: Title & Rating */}
          <div className="flex items-start justify-between gap-1.5 sm:gap-2">
            <h3 className="font-heading font-bold text-xs sm:text-base text-gray-900 group-hover:text-primary transition-colors line-clamp-1 flex-1">
              {trip.name}
            </h3>

            <div className="flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-xs font-semibold text-emerald-700 shrink-0">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-emerald-600 text-emerald-600" />
              <span>{ratingValue.toFixed(1)}</span>
              <span className="text-gray-400 font-normal hidden sm:inline">({reviewsCount})</span>
            </div>
          </div>

          {/* Row 2: Destination with MapPin */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{trip.destination}</span>
          </div>

          {/* Row 3: Dates & Spots Left */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-xs text-gray-600 mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-gray-100 gap-0.5 sm:gap-1">
            <span className="flex items-center gap-1 truncate">
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">
                {trip.startDate}
              </span>
            </span>

            <span className="flex items-center gap-1 shrink-0 text-emerald-700 font-medium">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
              <span>{spotsLeftCount} spots left</span>
            </span>
          </div>

          {/* Row 4: Member Avatars & Organizer */}
          <div className="flex items-center justify-between gap-1.5 mt-1.5 sm:mt-2.5 pt-1.5 sm:pt-2 border-t border-gray-100">
            <div className="flex -space-x-1 sm:-space-x-1.5 overflow-hidden">
              {trip.members.slice(0, 3).map((member, idx) => (
                <img
                  key={member.id || idx}
                  className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-full ring-2 ring-white object-cover"
                  src={member.avatarUrl}
                  alt={member.name}
                />
              ))}
            </div>

            <span className="text-[10px] sm:text-xs text-gray-500 truncate">
              by <span className="font-semibold text-gray-700">{organizerDisplay}</span>
            </span>
          </div>

          {/* Row 5: Pricing & Departure */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-1.5 sm:mt-2.5 pt-1.5 sm:pt-2 border-t border-gray-100">
            <div className="flex items-baseline gap-1 text-xs sm:text-sm font-bold text-gray-900">
              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
              <span>₹{trip.budgetPerPerson.toLocaleString()}</span>
              <span className="text-[9px] sm:text-[11px] font-normal text-gray-400">/person</span>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 truncate">
              <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">From {trip.startCity}</span>
            </div>
          </div>
        </div>

        {/* Row 6: Tags & View Trip CTA */}
        <div className="flex items-center justify-between gap-1.5 pt-2 sm:pt-3 border-t border-gray-100 mt-auto">
          <div className="hidden sm:flex flex-wrap gap-1.5 min-w-0">
            {tagsList.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] sm:text-[11px] font-medium text-emerald-800 bg-emerald-50/80 px-1.5 py-0.5 rounded-md border border-emerald-200/50 truncate"
              >
                {tag}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(targetPath);
            }}
            className="bg-[#0D5A46] hover:bg-emerald-800 text-white font-semibold text-[11px] sm:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs w-full sm:w-auto shrink-0 cursor-pointer"
          >
            <span>View Trip</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default TripCard;
