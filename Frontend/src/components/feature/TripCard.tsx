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
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { Trip } from '../../types';
import { useTrips } from '../../context/TripsContext';

export interface TripCardProps {
  trip: Trip;
  showSaveButton?: boolean;
  variant?: 'vertical' | 'horizontal';
}

export const formatTripDate = (dateStr?: string) => {
  if (!dateStr) return 'Dates Flexible';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
};

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  showSaveButton = true,
  variant = 'vertical',
}) => {
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
  const spotsLeftText = spotsLeftCount === 1 ? '1 spot left' : `${spotsLeftCount} spots left`;
  const organizerDisplay = trip.organizerName || trip.leader.name;
  const tagsList = trip.tags || trip.preferences.slice(0, 3);
  const formattedDate = formatTripDate(trip.startDate);

  // Compact Mobile Card: Matches Travel Diary layout (Thumbnail on left, details on right, zero empty space)
  const mobileDiaryStyleCard = (
    <div
      onClick={() => navigate(targetPath)}
      className="sm:hidden group relative flex items-start gap-3 p-3 bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-card hover:border-emerald-500/40 transition-all duration-200 text-left cursor-pointer w-full overflow-hidden"
    >
      {/* Left: Thumbnail matching Trip Diary */}
      <div className="relative w-28 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200 shadow-2xs">
        <img
          src={trip.coverImageUrl}
          alt={trip.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Mini Type Badge */}
        <div className="absolute bottom-1 left-1 bg-[#0D5A46]/90 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-2xs max-w-[90%] truncate">
          {badgeText}
        </div>

        {/* Heart Bookmark */}
        {showSaveButton && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveTrip(trip.id);
            }}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all cursor-pointer z-10"
            aria-label={saved ? 'Remove from saved trips' : 'Save trip'}
          >
            <Heart
              className={`w-2.5 h-2.5 transition-colors ${
                saved ? 'fill-red-500 text-red-500' : 'text-white'
              }`}
            />
          </button>
        )}
      </div>

      {/* Right: Info Stack (All details packed cleanly, no empty space) */}
      <div className="min-w-0 flex-1 flex flex-col justify-between self-stretch">
        <div>
          {/* Row 1: Title & Rating */}
          <div className="flex items-start justify-between gap-1.5">
            <h4 className="font-heading font-bold text-xs text-gray-900 group-hover:text-primary transition-colors line-clamp-1 flex-1">
              {trip.name}
            </h4>
            <div className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0 border border-emerald-200">
              <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
              <span>{ratingValue.toFixed(1)}</span>
            </div>
          </div>

          {/* Row 2: Destination */}
          <div className="flex items-center gap-1 text-[11px] text-gray-600 mt-0.5">
            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="font-medium text-gray-800 truncate">{trip.destination}</span>
            {trip.startCity && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400 text-[10px] truncate">From {trip.startCity}</span>
              </>
            )}
          </div>

          {/* Row 3: Date & Spots Left */}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1">
            <span className="flex items-center gap-0.5 text-gray-700 font-medium truncate">
              <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{formattedDate}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="text-emerald-700 font-semibold shrink-0">
              {spotsLeftText}
            </span>
          </div>

          {/* Row 4: Member Avatars & Organizer */}
          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-gray-100">
            {trip.members.length > 0 && (
              <div className="flex -space-x-1 overflow-hidden shrink-0">
                {trip.members.slice(0, 3).map((member, idx) => (
                  <img
                    key={member.id || idx}
                    className="inline-block h-4 w-4 rounded-full ring-1 ring-white object-cover"
                    src={member.avatarUrl}
                    alt={member.name}
                  />
                ))}
              </div>
            )}
            <span className="text-[10px] text-gray-500 truncate">
              by <span className="font-medium text-gray-700">{organizerDisplay}</span>
            </span>
          </div>
        </div>

        {/* Row 5: Price & Compact Action Button */}
        <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-gray-100">
          <div className="flex items-baseline gap-0.5">
            <span className="font-heading font-extrabold text-xs text-gray-900">
              ₹{trip.budgetPerPerson.toLocaleString()}
            </span>
            <span className="text-[9px] text-gray-400 font-normal">/person</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(targetPath);
            }}
            className="inline-flex items-center gap-1 bg-[#0D5A46] hover:bg-emerald-800 text-white font-semibold text-[10px] py-1 px-2.5 rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <span>View Trip</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );

  // Horizontal / Diary-style layout (matching Travel Diary entry cards with full clarity)
  if (variant === 'horizontal') {
    return (
      <>
        {/* Mobile View: Render compact diary-style horizontal card */}
        {mobileDiaryStyleCard}

        {/* Tablet / Desktop View: Full horizontal wide card */}
        <div
          onClick={() => navigate(targetPath)}
          className="hidden sm:flex group relative flex-row items-center justify-between p-3.5 sm:p-5 bg-white rounded-2xl border border-gray-200/90 shadow-subtle hover:shadow-card hover:border-emerald-500/40 transition-all duration-200 gap-3.5 sm:gap-5 text-left cursor-pointer w-full"
        >
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1 w-full">
          {/* Landscape Thumbnail (Matching Diary Screen) */}
          <div className="relative w-28 h-24 sm:w-40 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-gray-100 border border-border shadow-xs">
            <img
              src={trip.coverImageUrl}
              alt={trip.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            {/* Type Mini Badge */}
            <div className="absolute bottom-1 left-1 bg-[#0D5A46]/90 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 max-w-[90%] truncate shadow-2xs">
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
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all cursor-pointer z-10"
                aria-label={saved ? 'Remove from saved trips' : 'Save trip'}
              >
                <Heart
                  className={`w-3 h-3 transition-colors ${
                    saved ? 'fill-red-500 text-red-500' : 'text-white'
                  }`}
                />
              </button>
            )}
          </div>

          {/* Content Stack (All information clearly visible) */}
          <div className="min-w-0 flex-1">
            {/* Row 1: Title & Rating */}
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-heading font-bold text-sm sm:text-base text-gray-900 group-hover:text-primary transition-colors line-clamp-1 flex-1">
                {trip.name}
              </h4>

              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-700 shrink-0 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                <span>{ratingValue.toFixed(1)}</span>
                <span className="text-gray-400 font-normal hidden sm:inline">({reviewsCount})</span>
              </div>
            </div>

            {/* Row 2: Destination & Departure */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-medium text-gray-800 truncate">{trip.destination}</span>
              {trip.startCity && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500 truncate text-[11px]">From {trip.startCity}</span>
                </>
              )}
            </div>

            {/* Row 3: Human-Readable Dates & Spots Left */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-1.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium text-gray-800">{formattedDate}</span>
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>{spotsLeftText}</span>
              </span>
            </div>

            {/* Row 4: Member Avatars & Organizer */}
            <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-gray-100">
              {trip.members.length > 0 && (
                <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                  {trip.members.slice(0, 3).map((member, idx) => (
                    <img
                      key={member.id || idx}
                      className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover"
                      src={member.avatarUrl}
                      alt={member.name}
                    />
                  ))}
                </div>
              )}
              <span className="text-[11px] text-gray-500 truncate">
                by <span className="font-semibold text-gray-800">{organizerDisplay}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center Highlights & Inclusions (Desktop View - prevents empty space) */}
        <div className="hidden lg:flex flex-col justify-center px-4 sm:px-6 py-1 border-t lg:border-t-0 lg:border-l lg:border-r border-gray-100 shrink-0 min-w-[220px] max-w-xs space-y-2 text-left">
          {/* Key Inclusions */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Trip Inclusions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(trip.inclusions && trip.inclusions.length > 0
                ? trip.inclusions.slice(0, 3)
                : (trip.preferences || ['Stay', 'Transport', 'Meals']).slice(0, 3)
              ).map((inc) => (
                <span
                  key={inc}
                  className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  <span>{inc}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
              <span>Spots Filled</span>
              <span className="text-emerald-700 font-bold">
                {Math.min(trip.members.length, trip.maxMembers)} / {trip.maxMembers}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round(((trip.members.length || 1) / Math.max(1, trip.maxMembers)) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Duration & Difficulty */}
          <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-0.5">
            <span className="capitalize font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[10px]">
              {trip.durationDays || 3} Days
            </span>
            <span className="text-gray-300">•</span>
            <span className="capitalize font-medium text-emerald-800 bg-emerald-50/70 border border-emerald-100 px-2 py-0.5 rounded text-[10px]">
              {trip.difficulty || 'Moderate'} Pace
            </span>
          </div>
        </div>

        {/* Action & Price Footer (Desktop: Right column, Mobile: Bottom row) */}
        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0 sm:min-w-[130px]">
          <div className="flex items-baseline gap-1">
            <span className="font-heading font-extrabold text-sm sm:text-base text-gray-900">
              ₹{trip.budgetPerPerson.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 font-normal">/person</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(targetPath);
            }}
            className="inline-flex items-center justify-center gap-1.5 bg-[#0D5A46] hover:bg-emerald-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <span>View Trip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile View: Render compact diary-style horizontal card */}
      {mobileDiaryStyleCard}

      {/* Desktop View: Keep 3-column vertical grid card */}
      <div
        onClick={() => navigate(targetPath)}
        className="hidden sm:flex group bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-500/40 hover:shadow-card hover:-translate-y-1 transition-all duration-300 cursor-pointer flex-col text-left overflow-hidden"
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
                {formattedDate}
              </span>
            </span>

            <span className="flex items-center gap-1 shrink-0 text-emerald-700 font-medium">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
              <span>{spotsLeftText}</span>
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
    </>
  );
};
export default TripCard;
