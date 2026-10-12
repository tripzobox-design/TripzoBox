import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, Frown } from 'lucide-react';
import { useTrips } from '../context/TripsContext';
import { TripCard } from '../components/feature/TripCard';
import { TripFilterBar } from '../components/ui/SearchBar';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';

export const FindTripPage: React.FC = () => {
  const { trips } = useTrips();
  const [searchParams] = useSearchParams();

  // Search Filters
  const initialQuery = searchParams.get('q') || '';
  const [destinationQuery, setDestinationQuery] = useState(initialQuery);
  const [dateQuery, setDateQuery] = useState('');
  const [budgetQuery, setBudgetQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'popular' | 'upcoming' | 'nearby'>('popular');

  const filterTabs = [
    { id: 'popular', label: 'Popular Trips' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'nearby', label: 'Nearby' },
  ];

  // Filtered trips logic
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // Destination filter
      if (
        destinationQuery &&
        !trip.destination.toLowerCase().includes(destinationQuery.toLowerCase()) &&
        !trip.name.toLowerCase().includes(destinationQuery.toLowerCase())
      ) {
        return false;
      }

      // Date filter
      if (dateQuery && !trip.startDate.toLowerCase().includes(dateQuery.toLowerCase())) {
        return false;
      }

      // Budget filter
      if (budgetQuery) {
        const numericBudget = parseInt(budgetQuery.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(numericBudget) && trip.budgetPerPerson > numericBudget) {
          return false;
        }
      }

      // Tab filter
      if (activeTab === 'nearby') {
        return trip.destination.includes('Kerala') || trip.destination.includes('Tamil Nadu');
      }

      return true;
    });
  }, [trips, destinationQuery, dateQuery, budgetQuery, activeTab]);

  const handleClearFilters = () => {
    setDestinationQuery('');
    setDateQuery('');
    setBudgetQuery('');
    setActiveTab('popular');
  };

  return (
    <div className="flex flex-col gap-8 text-left max-w-6xl mx-auto">
      {/* 1. HERO SEARCH BANNER (Matching Screen 5) */}
      <div className="relative rounded-3xl overflow-hidden shadow-float min-h-[220px] sm:min-h-[260px] flex flex-col justify-center p-6 sm:p-10 bg-text text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85"
            alt="Hikers on green mountain crest"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-white">
            Find Your Next Trip
          </h1>
          <p className="text-xs sm:text-sm text-gray-200 mt-2 max-w-xl font-medium">
            Discover amazing trips, meet new people and explore the world together.
          </p>
        </div>

        {/* 4-Field Integrated Search Bar */}
        <div className="relative z-10 mt-6">
          <TripFilterBar
            destination={destinationQuery}
            onDestinationChange={setDestinationQuery}
            date={dateQuery}
            onDateChange={setDateQuery}
            budget={budgetQuery}
            onBudgetChange={setBudgetQuery}
            onSearch={() => {}}
          />
        </div>
      </div>

      {/* 2. SUB-TABS ROW (Popular Trips, Upcoming, Nearby) */}
      <div className="flex items-center justify-between border-b border-border pb-1">
        <Tabs
          tabs={filterTabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          variant="underline"
        />

        <span className="text-xs text-text-muted font-medium hidden sm:inline">
          Showing {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}
        </span>
      </div>

      {/* 3. RESPONSIVE TRIP CARDS GRID (3-Col Desktop -> 1-Col Mobile) */}
      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Frown className="w-8 h-8" />}
          title="No trips match your filters"
          description="We couldn't find any trips matching your destination, dates or budget. Try broadening your criteria or create a new trip!"
          actionLabel="Clear all filters"
          onAction={handleClearFilters}
        />
      )}
    </div>
  );
};
