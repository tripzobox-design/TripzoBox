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
} from 'lucide-react';
import { useDestinations } from '../context/DestinationsContext';
import { useAuth } from '../context/AuthContext';
import { DestinationCard } from '../components/feature/DestinationCard';
import { Destination } from '../types';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [visibleCount, setVisibleCount] = useState<number>(8);

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

      // Search query (name, state, shortDescription, tags)
      if (q) {
        const tagsString = (dest.tags || []).join(' ').toLowerCase();
        const fullString = `${dest.name} ${dest.state} ${dest.shortDescription} ${tagsString}`.toLowerCase();
        if (!fullString.includes(q)) return false;
      }

      return true;
    });
  }, [destinations, selectedCategory, searchQuery]);

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

  return (
    <div className="w-full text-left bg-light-bg min-h-screen">
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
      {/* 2. SUB-HEADER TOOLBAR (Category Pills with Icons & Sort Dropdown) */}
      {/* ========================================================================= */}
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
            {CATEGORY_ITEMS.map((item) => {
              const isSelected = selectedCategory === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectCategory(item.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0D5A46] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200/90 hover:bg-gray-50'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Actions (Add Place Button + Sort by Dropdown) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleAddPlace}
              className="inline-flex items-center gap-1.5 bg-[#0D5A46] hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-bold py-2 px-4 rounded-full transition-all shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Place</span>
            </button>

            {/* Sort by Dropdown */}
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="text-gray-500 font-medium">Sort by</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort destinations by"
                  className="appearance-none bg-white border border-gray-200/90 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-semibold text-gray-800 shadow-2xs hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="popular">Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Name (A-Z)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DESTINATIONS GRID (4 COLS X 2 ROWS = 8 CARDS) */}
      {/* ========================================================================= */}
      <main className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {displayedDestinations.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
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
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 4)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-300 bg-white text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
                >
                  <span>Load More</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-gray-200/90 bg-white p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-gray-900">
              No destinations match your search
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Try exploring all categories or search for a different place.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                handleSelectCategory('All');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
export default ExplorePage;
