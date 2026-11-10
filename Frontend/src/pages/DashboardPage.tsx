import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Compass,
  BookOpen,
  ArrowRight,
  Search,
  Sparkles,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripsContext';
import { useDestinations } from '../context/DestinationsContext';
import { useDiary } from '../context/DiaryContext';
import { Button } from '../components/ui/Button';
import { TripCard } from '../components/feature/TripCard';
import { StoryCard } from '../components/feature/StoryCard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { trips } = useTrips();
  const { destinations } = useDestinations();
  const { stories } = useDiary();
  const navigate = useNavigate();

  const [searchDestination, setSearchDestination] = useState('');
  const [tripsViewMode, setTripsViewMode] = useState<'grid' | 'list'>('grid');

  // Time-sensitive greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchDestination.trim()) {
      navigate(`/app/trips?q=${encodeURIComponent(searchDestination)}`);
    } else {
      navigate('/app/trips');
    }
  };

  const recentTrips = trips.slice(0, 3);
  const communityStories = stories.slice(0, 3);
  const hiddenSpots = destinations.filter(
    (d) => d.category === 'Hidden Spots' || d.isHiddenSpot
  ).slice(0, 3);

  return (
    <div className="flex flex-col gap-5 sm:gap-7 text-left w-full max-w-7xl 2xl:max-w-[1536px] mx-auto">
      {/* 1. GREETING (Above Banner, matching Screen 3) */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-xl sm:text-3xl text-text">
            {getGreeting()}, {user.name}! 👏
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5 font-medium">
            Where would you like to go next?
          </p>
        </div>
        {/* Avatar — mobile only for quick profile access */}
        <div className="sm:hidden shrink-0">
          <img
            src={user.avatarUrl}
            alt={user.name}
            onClick={() => navigate('/app/profile')}
            className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shadow-subtle cursor-pointer"
          />
        </div>
      </div>

      {/* HERO SEARCH BANNER (Matching Screen 3) */}
      <div className="relative rounded-3xl overflow-hidden shadow-card h-[140px] sm:h-[200px] flex items-center justify-center p-4 sm:p-6 text-white">
        {/* Background Landscape Photo */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1600&q=85"
            alt="Misty tea gardens and mountains"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/25" />
        </div>

        {/* Integrated Search Bar on Hero */}
        <form
          onSubmit={handleHeroSearch}
          className="relative z-10 w-full max-w-xl flex items-center bg-white rounded-2xl p-1 sm:p-1.5 shadow-float border border-white/60"
        >
          <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 flex-1">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            <input
              type="text"
              value={searchDestination}
              onChange={(e) => setSearchDestination(e.target.value)}
              placeholder="Search destinations, trips..."
              className="w-full text-sm font-medium text-text bg-transparent outline-none placeholder:text-text-subtle"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold shadow-none text-xs sm:text-sm min-h-[36px]"
          >
            Search
          </Button>
        </form>
      </div>

      {/* 2. THREE QUICK-ACTION CARDS — horizontal row on mobile, 3-col on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-5">
        {/* Quick Card 1: Travel Vault */}
        <div
          onClick={() => navigate('/app/vault')}
          className="bg-white rounded-2xl border border-border/80 shadow-card hover:shadow-hover hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer flex sm:flex-col flex-row items-center sm:items-start gap-3 sm:gap-0 p-3 sm:p-5 lg:p-6"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-accent/40 text-primary flex items-center justify-center shrink-0 sm:mb-4">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
          </div>
          <div className="flex-1 min-w-0 sm:flex-none">
            <h3 className="font-heading font-bold text-sm sm:text-lg text-text leading-tight">
              Travel Vault
            </h3>
            <p className="text-[11px] sm:text-sm text-text-muted mt-0.5 sm:mt-1 leading-snug">
              Your important information, safe &amp; secure.
            </p>
          </div>
          <div className="sm:mt-5 sm:pt-4 sm:border-t sm:border-border/60 sm:w-full shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate('/app/vault'); }}
              className="bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold py-2 px-3 sm:w-full sm:py-2.5 sm:px-4 rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer text-center min-h-[36px]"
            >
              Open Vault
            </button>
          </div>
        </div>

        {/* Quick Card 2: Find a Trip */}
        <div
          onClick={() => navigate('/app/trips')}
          className="bg-white rounded-2xl border border-border/80 shadow-card hover:shadow-hover hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer flex sm:flex-col flex-row items-center sm:items-start gap-3 sm:gap-0 p-3 sm:p-5 lg:p-6"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-accent/40 text-primary flex items-center justify-center shrink-0 sm:mb-4">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
          </div>
          <div className="flex-1 min-w-0 sm:flex-none">
            <h3 className="font-heading font-bold text-sm sm:text-lg text-text leading-tight">
              Find a Trip
            </h3>
            <p className="text-[11px] sm:text-sm text-text-muted mt-0.5 sm:mt-1 leading-snug">
              Meet people, join trips, share the adventure.
            </p>
          </div>
          <div className="sm:mt-5 sm:pt-4 sm:border-t sm:border-border/60 sm:w-full shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate('/app/trips'); }}
              className="bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold py-2 px-3 sm:w-full sm:py-2.5 sm:px-4 rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer text-center min-h-[36px]"
            >
              Explore
            </button>
          </div>
        </div>

        {/* Quick Card 3: Travel Diary */}
        <div
          onClick={() => navigate('/app/diary')}
          className="bg-white rounded-2xl border border-border/80 shadow-card hover:shadow-hover hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer flex sm:flex-col flex-row items-center sm:items-start gap-3 sm:gap-0 p-3 sm:p-5 lg:p-6"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-accent/40 text-primary flex items-center justify-center shrink-0 sm:mb-4">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
          </div>
          <div className="flex-1 min-w-0 sm:flex-none">
            <h3 className="font-heading font-bold text-sm sm:text-lg text-text leading-tight">
              Travel Diary
            </h3>
            <p className="text-[11px] sm:text-sm text-text-muted mt-0.5 sm:mt-1 leading-snug">
              Record, share and inspire others.
            </p>
          </div>
          <div className="sm:mt-5 sm:pt-4 sm:border-t sm:border-border/60 sm:w-full shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate('/app/diary'); }}
              className="bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold py-2 px-3 sm:w-full sm:py-2.5 sm:px-4 rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer text-center min-h-[36px]"
            >
              Open Diary
            </button>
          </div>
        </div>
      </div>

      {/* 3. RECENT TRIPS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h3 className="font-heading font-bold text-lg sm:text-2xl text-text">
              Recent Trips
            </h3>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Discover newly scheduled trips and join fellow travellers.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Switcher (Grid / List) */}
            <div className="hidden sm:flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setTripsViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  tripsViewMode === 'grid'
                    ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTripsViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  tripsViewMode === 'list'
                    ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="List view"
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Link
              to="/app/trips"
              className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1 group shrink-0"
            >
              <span>View all</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Trips Layout: Compact horizontal list matching Trip Diary on mobile, responsive grid/list on tablet & desktop */}
        <div
          className={
            tripsViewMode === 'grid'
              ? 'space-y-3.5 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 lg:gap-6'
              : 'space-y-3 sm:space-y-3.5'
          }
        >
          {recentTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              variant={tripsViewMode === 'grid' ? 'vertical' : 'horizontal'}
            />
          ))}
        </div>
      </div>

      {/* 4. EXPLORE OTHERS' TRAVEL STORIES SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h3 className="font-heading font-bold text-lg sm:text-2xl text-text">
              Explore Others' Travel Stories
            </h3>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Real adventures, hidden spots, and inspiring itineraries written by fellow travellers.
            </p>
          </div>
          <Link
            to="/stories"
            className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1 group shrink-0 ml-3"
          >
            <span>Explore all</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3-column responsive story cards on tablet & desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {communityStories.map((story) => (
            <StoryCard key={story.id} story={story} variant="standard" />
          ))}
        </div>
      </div>

      {/* 5. HIDDEN SPOTS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h3 className="font-heading font-bold text-lg sm:text-2xl text-text">
              Hidden Spots to Explore
            </h3>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Offbeat destinations and secret escapes recommended by fellow travellers.
            </p>
          </div>
          <Link
            to="/explore?category=Hidden+Spots"
            className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1 group shrink-0 ml-3"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3-column responsive destination cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
          {hiddenSpots.map((dest) => (
            <div
              key={dest.id}
              onClick={() => navigate(`/explore/${dest.slug}`)}
              className="bg-white rounded-2xl p-3 border border-border/80 shadow-subtle hover:shadow-card hover:border-primary/40 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={dest.imageUrl}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span>Hidden Spot</span>
                  </div>
                </div>
                <div className="pt-3 px-1">
                  <h4 className="font-heading font-bold text-base text-text group-hover:text-primary transition-colors">
                    {dest.name}
                  </h4>
                  <p className="text-xs text-text-muted font-medium mt-0.5">
                    {dest.state}
                  </p>
                  <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                    {dest.shortDescription}
                  </p>
                </div>
              </div>
              <div className="pt-3 px-1 mt-2 border-t border-gray-100 flex items-center justify-between text-xs text-primary font-semibold group-hover:text-primary-hover">
                <span>View destination</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
