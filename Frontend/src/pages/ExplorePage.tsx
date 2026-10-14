import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { mockDestinations } from '../data/mockDestinations';
import { DestinationCard } from '../components/feature/DestinationCard';
import { Destination } from '../types';

export const ExplorePage: React.FC = () => {
  const location = useLocation();
  const isInApp = location.pathname.startsWith('/app');
  const linkPrefix = isInApp ? '/explore' : '/explore';

  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Mountains', 'Beaches', 'Cities', 'Culture', 'Nature'];

  const filteredDestinations = useMemo(() => {
    if (selectedCategory === 'All') return mockDestinations;
    return mockDestinations.filter((d) => d.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className={`flex flex-col gap-6 text-left w-full max-w-[1536px] mx-auto ${isInApp ? '' : 'px-4 sm:px-6 lg:px-8 py-8 sm:py-10'}`}>
      {/* 1. HEADER (Matching Screen 10) */}
      <div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-text">
          Explore Destinations
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-xl">
          Discover amazing places, hidden gems and real travel stories.
        </p>
      </div>

      {/* 2. CATEGORY FILTER PILL ROW (Matching Screen 10) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs sm:text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white shadow-subtle'
                  : 'bg-white text-text-muted hover:text-text border border-border'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 3. RESPONSIVE DESTINATION GRID (4-Col on XL -> 3-Col LG -> 2-Col SM -> 1-Col Mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDestinations.map((dest) => (
          <DestinationCard
            key={dest.id}
            destination={dest}
            linkPrefix={linkPrefix}
          />
        ))}
      </div>
    </div>
  );
};
