import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Search,
  X,
  ChevronDown,
  Mountain,
  Waves,
  Building2,
  Landmark,
  Trees,
  Compass,
  Plus,
  Filter,
  SlidersHorizontal,
  MapPin,
  Star,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useDestinations } from '../context/DestinationsContext';
import { useAuth } from '../context/AuthContext';
import { DestinationCard } from '../components/feature/DestinationCard';
import { Destination } from '../types';
import { SEO } from '../components/common/SEO';

const CATEGORY_ITEMS = [
  { id: 'All', label: 'All', icon: null },
  { id: 'Mountains', label: 'Mountains', icon: Mountain },
  { id: 'Beaches', label: 'Beaches', icon: Waves },
  { id: 'Cities', label: 'Cities', icon: Building2 },
  { id: 'Culture', label: 'Culture', icon: Landmark },
  { id: 'Nature', label: 'Nature', icon: Trees },
  { id: 'Hidden Spots', label: 'Hidden Spots', icon: Compass },
] as const;

export const ExplorePage: React.FC = () => {
  const { destinations } = useDestinations();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const isInApp = location.pathname.startsWith('/app');

  const handleAddPlace = () => {
    if (!isLoggedIn) {
      navigate('/login?redirect=/explore/create');
    } else {
      navigate(isInApp ? '/app/explore/create' : '/explore/create');
    }
  };

  // Category & Query State
  const initialCategory = params.get('category') || 'All';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [minRating, setMinRating] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setVisibleCount(8);
    const next = new URLSearchParams(params);
    if (catId === 'All') {
      next.delete('category');
    } else {
      next.set('category', catId);
    }
    setParams(next, { replace: true, preventScrollReset: true });
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: destinations.length };
    CATEGORY_ITEMS.forEach((item) => {
      if (item.id === 'All') return;
      if (item.id === 'Hidden Spots') {
        counts[item.id] = destinations.filter((d) => d.isHiddenSpot || d.category === 'Hidden Spots').length;
      } else {
        counts[item.id] = destinations.filter((d) => d.category === item.id).length;
      }
    });
    return counts;
  }, [destinations]);

  // Available unique states
  const availableStates = useMemo(() => {
    const states = Array.from(new Set(destinations.map((d) => d.state).filter(Boolean))).sort();
    return ['All States', ...states];
  }, [destinations]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedState !== 'All States') count++;
    if (minRating > 0) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCategory, selectedState, minRating, searchQuery]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedState('All States');
    setMinRating(0);
    setSearchQuery('');
    setSortBy('popular');
    setVisibleCount(8);
    const next = new URLSearchParams(params);
    next.delete('category');
    setParams(next, { replace: true, preventScrollReset: true });
  };

  // Filtered destinations
  const filteredDestinations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return destinations.filter((dest) => {
      // Category filter
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Hidden Spots') {
          if (!dest.isHiddenSpot && dest.category !== 'Hidden Spots') return false;
        } else if (dest.category !== selectedCategory) {
          return false;
        }
      }

      // State / Region filter
      if (selectedState !== 'All States' && dest.state !== selectedState) {
        return false;
      }

      // Rating filter
      if (minRating > 0 && (dest.rating || 0) < minRating) {
        return false;
      }

      // Search query (name, state, shortDescription, tags)
      if (q) {
        const tagsString = (dest.tags || []).join(' ').toLowerCase();
        const fullString = `${dest.name} ${dest.state} ${dest.shortDescription} ${tagsString}`.toLowerCase();
        if (!fullString.includes(q)) return false;
      }

      return true;
    });
  }, [destinations, selectedCategory, selectedState, minRating, searchQuery]);

  // Sorted destinations
  const sortedDestinations = useMemo(() => {
    const list = [...filteredDestinations];
    if (sortBy === 'rating') {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (sortBy === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Default popular: keep curated sequence
    return list;
  }, [filteredDestinations, sortBy]);

  const displayedDestinations = sortedDestinations.slice(0, visibleCount);
  const hasMore = visibleCount < sortedDestinations.length;

  const handleSelectDestination = (dest: Destination) => {
    navigate(`/explore/${dest.slug}`);
  };

  const renderSidebarFilters = (isMobile = false) => (
    <div className="space-y-6">
      {/* Header with Title & Reset Button */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-bold text-sm text-gray-900">
            Filters & Categories
          </h3>
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Section 1: Categories Vertical List (The core requested feature!) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
          Category
        </label>
        <div className="space-y-1">
          {CATEGORY_ITEMS.map((item) => {
            const isSelected = selectedCategory === item.id;
            const Icon = item.icon;
            const count = categoryCounts[item.id] ?? 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  handleSelectCategory(item.id);
                  if (isMobile) setIsMobileFilterOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 shadow-2xs font-bold pl-2.5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {Icon ? (
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                  ) : (
                    <Compass className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-emerald-200/60 text-emerald-900' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Region / State Filter */}
      <div className="space-y-2 pt-4 border-t border-gray-100">
        <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span>State / Region</span>
        </label>
        <div className="relative">
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setVisibleCount(8);
            }}
            className="w-full appearance-none bg-white border border-gray-200/90 rounded-xl px-3 py-2 pr-8 text-xs font-medium text-gray-800 shadow-2xs hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {availableStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Section 3: Rating Filter */}
      <div className="space-y-2 pt-4 border-t border-gray-100">
        <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-gray-400" />
          <span>Minimum Rating</span>
        </label>
        <div className="flex flex-col gap-1.5">
          {[
            { label: 'All Ratings', value: 0 },
            { label: '4.5 ★ & above', value: 4.5 },
            { label: '4.0 ★ & above', value: 4.0 },
          ].map((rt) => (
            <label
              key={rt.value}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                minRating === rt.value ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`rating-filter-${isMobile ? 'mobile' : 'desktop'}`}
                checked={minRating === rt.value}
                onChange={() => {
                  setMinRating(rt.value);
                  setVisibleCount(8);
                }}
                className="accent-primary"
              />
              <span>{rt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full text-left bg-light-bg min-h-screen">
      <SEO
        title="Explore Hidden Destinations & Secret Travel Spots"
        description="Discover uncrowded hill stations, secret beaches, scenic mountain passes, and authentic local guides curated by the TripzoBox community."
      />
      {/* ========================================================================= */}
      {/* 1. PANORAMIC HERO BANNER WITH DOODLE & SEARCH BOX */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden border-b border-gray-200/80 bg-[#E8F4EE]">
        {/* Mountain Vista Background with Hiker on Right */}
        <div
          className="absolute inset-0 bg-cover bg-right"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85')`,
            backgroundPosition: 'right 20% center',
          }}
        />

        {/* Soft Multi-stop Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F4FAF7] via-[#F4FAF7]/95 via-45% to-transparent" />

        <div className="relative max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left Content Area */}
            <div className="max-w-2xl text-left z-10">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1.5">
                FIND YOUR NEXT FAVOURITE PLACE
              </p>
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-gray-900 tracking-tight">
                Explore <span className="text-primary">destinations</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed max-w-lg">
                Discover beautiful places, hidden gems, and real travel experiences shared by
                our community.
              </p>

              {/* Embedded Search Input with Action Button */}
              <div className="mt-6 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full p-1.5 sm:p-2 shadow-sm border border-gray-200/90 flex items-center gap-3 max-w-xl">
                <Search className="w-5 h-5 text-gray-400 shrink-0 ml-3" />
                <input
                  type="text"
                  aria-label="Search destinations"
                  placeholder="Search destinations, states, or keywords..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(8);
                  }}
                  className="w-full min-w-0 bg-transparent outline-none text-xs sm:text-sm text-gray-800 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setVisibleCount(8);
                  }}
                  className="bg-[#0D5A46] hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-xl sm:rounded-full transition-all shadow-xs cursor-pointer shrink-0"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Center-Right Calligraphy Script Doodle */}
            <div className="hidden lg:flex items-center gap-2 select-none -rotate-6 text-[#0A6044] pr-10 xl:pr-24">
              <div
                className="text-xl xl:text-2xl font-bold tracking-tight leading-snug drop-shadow-xs"
                style={{
                  fontFamily: '"Caveat", "Segoe Script", "Brush Script MT", cursive, sans-serif',
                }}
              >
                New places
                <br />
                Real people
                <br />
                Better journeys.
              </div>
              <div className="text-emerald-700 font-bold text-lg mt-2 -ml-0.5">彡</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. EXPLORE DESTINATIONS: SIDEBAR FILTERS & DESTINATIONS GRID             */}
      {/* ========================================================================= */}
      <main className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* DESKTOP FILTER SIDEBAR */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <div className="sticky top-20 bg-white rounded-3xl border border-gray-200/90 p-5 shadow-xs space-y-6">
              {renderSidebarFilters(false)}
            </div>
          </aside>

          {/* MAIN DESTINATIONS CONTENT */}
          <div className="flex-1 min-w-0 w-full space-y-5">
            {/* Toolbar Row */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/90 shadow-2xs space-y-2.5 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                {/* Left side on Desktop / Top Row on Mobile: Filter Trigger & Count */}
                <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
                  {/* Mobile Filter Trigger Button (hidden on desktop where sidebar is always visible) */}
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Results count text */}
                  <span className="text-xs text-gray-500 font-medium ml-auto sm:ml-0">
                    Showing <strong className="text-gray-900">{displayedDestinations.length}</strong> of{' '}
                    <strong className="text-gray-900">{sortedDestinations.length}</strong> places
                  </span>
                </div>

                {/* Right side on Desktop / Bottom Row on Mobile: Add Place & Sort by */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAddPlace}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#0D5A46] hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-bold h-9 px-3.5 sm:px-4 rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Place</span>
                  </button>

                  {/* Sort by Dropdown */}
                  <div className="relative flex-1 sm:flex-initial">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Sort destinations by"
                      className="w-full sm:w-auto appearance-none bg-white border border-gray-200/90 rounded-xl h-9 px-3 pr-7 text-xs font-semibold text-gray-800 shadow-2xs hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-left"
                    >
                      <option value="popular">Popular</option>
                      <option value="rating">Highest Rated</option>
                      <option value="name">Name (A-Z)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Active Filter Chips Row */}
              {(selectedCategory !== 'All' || selectedState !== 'All States' || minRating > 0) && (
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 mr-1">Active filters:</span>
                  {selectedCategory !== 'All' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-semibold border border-emerald-300">
                      <span>{selectedCategory}</span>
                      <button
                        type="button"
                        onClick={() => handleSelectCategory('All')}
                        className="hover:text-emerald-950 p-0.5"
                        aria-label="Remove category filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedState !== 'All States' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-semibold border border-emerald-300">
                      <span>{selectedState}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedState('All States')}
                        className="hover:text-emerald-950 p-0.5"
                        aria-label="Remove state filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {minRating > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-semibold border border-emerald-300">
                      <span>{minRating}+ ★</span>
                      <button
                        type="button"
                        onClick={() => setMinRating(0)}
                        className="hover:text-emerald-950 p-0.5"
                        aria-label="Remove rating filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] text-red-600 hover:text-red-700 font-semibold ml-auto hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Destination Cards Grid */}
            {displayedDestinations.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-5">
                  {displayedDestinations.map((destination) => (
                    <DestinationCard
                      key={destination.id}
                      destination={destination}
                      onSelect={handleSelectDestination}
                    />
                  ))}
                </div>

                {/* Centered Load More Button */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 6)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-300 bg-white text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
                    >
                      <span>Load More</span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-3xl border border-gray-200/90 bg-white p-10 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-lg text-gray-900">
                  No destinations match your filters
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Try exploring all categories, choosing a different region, or resetting filters.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. MOBILE FILTER SLIDE-OUT DRAWER                                         */}
      {/* ========================================================================= */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Drawer container (slides from left) */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl z-50 flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-bold text-base text-gray-900">
                  Filter Destinations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable filters) */}
            <div className="p-5 overflow-y-auto flex-1">
              {renderSidebarFilters(true)}
            </div>

            {/* Drawer Footer: Apply & Reset */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ExplorePage;
