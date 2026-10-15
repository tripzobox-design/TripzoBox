import React, { useState, useMemo, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Frown,
  Search,
  MapPin,
  Calendar,
  Wallet,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  RotateCcw,
  Sparkles,
  Mountain,
  Palmtree,
  Utensils,
  Camera,
  Users,
  Flame,
  Check,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Globe,
  Lock,
  Crown,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrips } from '../context/TripsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TripCard } from '../components/feature/TripCard';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

// Quick destination shortcuts
const QUICK_DESTINATIONS = [
  'All',
  'Munnar',
  'Varkala',
  'Goa',
  'Kochi',
  'Coorg',
  'Ooty',
  'Alleppey',
  'Hampi',
];

// Quick departure hub cities
const DEPARTURE_CITIES = [
  { value: 'all', label: 'All Departure Hubs' },
  { value: 'Kochi', label: 'Kochi, Kerala' },
  { value: 'Bengaluru', label: 'Bengaluru, Karnataka' },
  { value: 'Panaji', label: 'Goa (Panaji)' },
  { value: 'Coimbatore', label: 'Coimbatore, Tamil Nadu' },
  { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram' },
  { value: 'Mumbai', label: 'Mumbai, Maharashtra' },
  { value: 'Delhi', label: 'Delhi NCR' },
];

// Budget options
const BUDGET_PRESETS = [
  { label: 'Any Budget', max: undefined },
  { label: '< ₹5,000', max: 5000 },
  { label: '₹5k – ₹8k', max: 8000 },
  { label: '₹8k – ₹15k', max: 15000 },
];

// Travel theme filter chips
const THEME_OPTIONS = [
  { id: 'Hiking', label: 'Mountains & Trekking', icon: Mountain },
  { id: 'Beaches', label: 'Beaches & Coastal', icon: Palmtree },
  { id: 'Nature', label: 'Nature & Wildlife', icon: Sparkles },
  { id: 'Food', label: 'Culinary & Local Food', icon: Utensils },
  { id: 'Culture', label: 'Heritage & Culture', icon: Compass },
  { id: 'Photography', label: 'Scenic Photography', icon: Camera },
  { id: 'Adventure', label: 'Adventure & Sports', icon: Flame },
];

// Cover photo presets
const COVER_PRESETS = [
  {
    label: 'Munnar Mist',
    url: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Varkala Beach',
    url: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Goa Coastal',
    url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Kochi Heritage',
    url: 'https://images.unsplash.com/photo-1558025638-565ae7710b3f?auto=format&fit=crop&w=1600&q=85',
  },
  {
    label: 'Coorg Coffee',
    url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Ooty Hills',
    url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
  },
];

// Sort options
type SortOption =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'date_asc'
  | 'duration_asc'
  | 'duration_desc'
  | 'popularity';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended (Best Match)' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'date_asc', label: 'Date: Soonest Upcoming' },
  { value: 'duration_asc', label: 'Duration: Short to Long' },
  { value: 'duration_desc', label: 'Duration: Long to Short' },
  { value: 'popularity', label: 'Most Popular / Members' },
];

export const FindTripPage: React.FC = () => {
  const { trips, createTrip } = useTrips();
  const { user, isLoggedIn } = useAuth();
  const { success, info } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const isMyTripsRoute = location.pathname.includes('/my');
  const isInApp = location.pathname.startsWith('/app');

  const [searchParams] = useSearchParams();

  // Core Search State
  const initialQuery = searchParams.get('q') || '';
  const [destinationQuery, setDestinationQuery] = useState(initialQuery);
  const [selectedCity, setSelectedCity] = useState('all');
  const [startDateQuery, setStartDateQuery] = useState('');
  const [endDateQuery, setEndDateQuery] = useState('');
  const [selectedBudgetMax, setSelectedBudgetMax] = useState<number | undefined>(undefined);
  const [customBudgetInput, setCustomBudgetInput] = useState('');

  // Date input refs for opening native picker on any click
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  const openStartDatePicker = () => {
    try {
      startDateInputRef.current?.showPicker?.();
    } catch {
      startDateInputRef.current?.focus();
    }
  };

  const openEndDatePicker = () => {
    try {
      endDateInputRef.current?.showPicker?.();
    } catch {
      endDateInputRef.current?.focus();
    }
  };

  // Extended Filters State
  const [tripTypeFilter, setTripTypeFilter] = useState<'all' | 'group' | 'solo' | 'couple'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [openOnlyFilter, setOpenOnlyFilter] = useState(false);

  // Filter Drawer visibility
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Sorting and Tabs
  const [activeTab, setActiveTab] = useState<'popular' | 'upcoming' | 'nearby'>('popular');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  // Create Room Modal State
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('Munnar Misty Peaks Trek');
  const [newDestination, setNewDestination] = useState('Munnar, Kerala');
  const [newStartCity, setNewStartCity] = useState('Kochi');
  const [newStartDate, setNewStartDate] = useState('2025-06-12');
  const [newEndDate, setNewEndDate] = useState('2025-06-18');
  const [newBudget, setNewBudget] = useState(5500);
  const [newMaxMembers, setNewMaxMembers] = useState(8);
  const [newTripType, setNewTripType] = useState<'group' | 'solo' | 'couple'>('group');
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [newRoomType, setNewRoomType] = useState<'public' | 'private'>('public');
  const [newPreferences, setNewPreferences] = useState<string[]>([
    'Hiking',
    'Nature',
    'Photography',
  ]);
  const [newDescription, setNewDescription] = useState(
    'Weekend getaway to explore tea hills, hidden waterfalls, and misty viewpoints with great company. Open to all friendly travellers!'
  );
  const [newCoverUrl, setNewCoverUrl] = useState(COVER_PRESETS[0].url);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedCover, setUploadedCover] = useState<{ url: string; name: string } | null>(null);
  const [coverUploadError, setCoverUploadError] = useState('');
  const [isReadingCover, setIsReadingCover] = useState(false);
  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setCoverUploadError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setCoverUploadError('Please choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setCoverUploadError('Please choose an image smaller than 2 MB.');
      return;
    }
    setIsReadingCover(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setCoverUploadError('This image could not be read. Please try another file.');
      setIsReadingCover(false);
    };
    reader.onload = () => {
      const url = reader.result;
      if (typeof url !== 'string') {
        setCoverUploadError('This image could not be read. Please try another file.');
        setIsReadingCover(false);
        return;
      }
      const image = new Image();
      image.onerror = () => {
        setCoverUploadError('This image could not be opened. Please try another file.');
        setIsReadingCover(false);
      };
      image.onload = () => {
        setUploadedCover({ url, name: file.name });
        setNewCoverUrl(url);
        setIsReadingCover(false);
      };
      image.src = url;
    };
    reader.readAsDataURL(file);
  };
  const [formError, setFormError] = useState('');

  const filterTabs = [
    { id: 'popular', label: 'Popular Trips' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'nearby', label: 'Nearby' },
  ];

  // Helper date parser
  const parseTripDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Toggle theme chip
  const toggleTheme = (themeId: string) => {
    setSelectedThemes((prev) =>
      prev.includes(themeId) ? prev.filter((t) => t !== themeId) : [...prev, themeId]
    );
  };

  const toggleNewPref = (prefId: string) => {
    setNewPreferences((prev) =>
      prev.includes(prefId) ? prev.filter((t) => t !== prefId) : [...prev, prefId]
    );
  };

  // Open Room Modal
  const handleOpenCreateRoom = () => {
    if (!isLoggedIn) {
      info('Please log in or sign up to host a trip room as leader!');
      navigate('/login', { state: { from: location } });
      return;
    }
    setFormError('');
    setIsCreateRoomOpen(true);
  };

  // Create Room Submit
  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadingCover) return;
    if (!newRoomName.trim()) {
      setFormError('Please enter a trip room title');
      return;
    }
    if (!newDestination.trim()) {
      setFormError('Please enter a destination');
      return;
    }

    const created = createTrip({
      name: newRoomName.trim(),
      destination: newDestination.trim(),
      startCity: newStartCity.trim() || 'Kochi',
      startDate: newStartDate,
      endDate: newEndDate,
      durationDays: 5,
      budgetPerPerson: newBudget,
      tripType: newTripType,
      roomType: newRoomType,
      difficulty: newDifficulty,
      maxMembers: newTripType === 'solo' ? 1 : newMaxMembers,
      preferences: newPreferences,
      description: newDescription.trim(),
      highlights: ['Scenic Trails', 'Local Food', 'Photography Spots'],
      coverImageUrl: newCoverUrl || COVER_PRESETS[0].url,
    });

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {}

    success(
      `Trip Room "${newRoomName}" created! You are the Trip Leader. Your ${
        newRoomType === 'public' ? 'Public Space' : 'Private Room'
      } is now open for travellers!`,
      'Room Created 🎉'
    );

    setIsCreateRoomOpen(false);
    navigate(isInApp ? `/app/trips/${created.id}` : `/trips/${created.id}`);
  };

  // Count active filters (for badge)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (destinationQuery) count++;
    if (selectedCity !== 'all') count++;
    if (startDateQuery || endDateQuery) count++;
    if (selectedBudgetMax !== undefined || customBudgetInput) count++;
    if (tripTypeFilter !== 'all') count++;
    if (difficultyFilter !== 'all') count++;
    if (durationFilter !== 'all') count++;
    if (selectedThemes.length > 0) count += selectedThemes.length;
    if (openOnlyFilter) count++;
    return count;
  }, [
    destinationQuery,
    selectedCity,
    startDateQuery,
    endDateQuery,
    selectedBudgetMax,
    customBudgetInput,
    tripTypeFilter,
    difficultyFilter,
    durationFilter,
    selectedThemes,
    openOnlyFilter,
  ]);

  // Reset all filters
  const handleClearAllFilters = () => {
    setDestinationQuery('');
    setSelectedCity('all');
    setStartDateQuery('');
    setEndDateQuery('');
    setSelectedBudgetMax(undefined);
    setCustomBudgetInput('');
    setTripTypeFilter('all');
    setDifficultyFilter('all');
    setDurationFilter('all');
    setSelectedThemes([]);
    setOpenOnlyFilter(false);
    setActiveTab('popular');
    setSortBy('recommended');
  };

  // Base list of trips
  const baseTrips = useMemo(() => {
    if (isMyTripsRoute) {
      return trips.filter((t) => t.leader.id === user.id || t.members.some((m) => m.id === user.id));
    }
    return trips;
  }, [trips, isMyTripsRoute, user.id]);

  // Filtered trips logic
  const filteredTrips = useMemo(() => {
    return baseTrips.filter((trip) => {
      // 1. Destination / name query
      if (destinationQuery) {
        const queryLower = destinationQuery.toLowerCase().trim();
        const matchesDest = trip.destination.toLowerCase().includes(queryLower);
        const matchesName = trip.name.toLowerCase().includes(queryLower);
        if (!matchesDest && !matchesName) return false;
      }

      // 2. Starting departure city
      if (selectedCity !== 'all') {
        const tripCity = (trip.startCity || '').toLowerCase();
        if (!tripCity.includes(selectedCity.toLowerCase())) return false;
      }

      // 3. Date range filter
      if (startDateQuery || endDateQuery) {
        const tripStart = parseTripDate(trip.startDate);
        const tripEnd = parseTripDate(trip.endDate || trip.startDate);

        if (tripStart && tripEnd) {
          if (startDateQuery) {
            const userFrom = new Date(startDateQuery);
            if (tripEnd < userFrom) return false;
          }
          if (endDateQuery) {
            const userTo = new Date(endDateQuery);
            userTo.setHours(23, 59, 59, 999);
            if (tripStart > userTo) return false;
          }
        }
      }

      // 4. Budget filter (preset or custom input)
      const effectiveMaxBudget =
        customBudgetInput && !isNaN(parseInt(customBudgetInput, 10))
          ? parseInt(customBudgetInput, 10)
          : selectedBudgetMax;

      if (effectiveMaxBudget !== undefined && trip.budgetPerPerson > effectiveMaxBudget) {
        return false;
      }

      // 5. Trip Type filter
      if (tripTypeFilter !== 'all' && trip.tripType !== tripTypeFilter) {
        return false;
      }

      // 6. Difficulty filter
      if (difficultyFilter !== 'all' && trip.difficulty !== difficultyFilter) {
        return false;
      }

      // 7. Duration filter
      if (durationFilter === 'short' && (trip.durationDays < 1 || trip.durationDays > 3)) {
        return false;
      }
      if (durationFilter === 'medium' && (trip.durationDays < 4 || trip.durationDays > 6)) {
        return false;
      }
      if (durationFilter === 'long' && trip.durationDays < 7) {
        return false;
      }

      // 8. Theme / Preferences filter (must match at least one selected theme)
      if (selectedThemes.length > 0) {
        const hasThemeMatch = selectedThemes.some((theme) => {
          const tLower = theme.toLowerCase();
          return trip.preferences.some((p) => {
            const pLower = p.toLowerCase();
            return (
              pLower === tLower ||
              (tLower === 'hiking' && (pLower.includes('mountain') || pLower.includes('hiking'))) ||
              (tLower === 'beaches' && (pLower.includes('beach') || pLower.includes('coastal')))
            );
          });
        });
        if (!hasThemeMatch) return false;
      }

      // 9. Open spots only
      if (openOnlyFilter && trip.status !== 'open') {
        return false;
      }

      // 10. Sub-tabs logic
      if (!isMyTripsRoute) {
        if (activeTab === 'nearby') {
          const dest = trip.destination.toLowerCase();
          return dest.includes('kerala') || dest.includes('tamil nadu') || dest.includes('karnataka');
        }
      }

      return true;
    });
  }, [
    baseTrips,
    destinationQuery,
    selectedCity,
    startDateQuery,
    endDateQuery,
    selectedBudgetMax,
    customBudgetInput,
    tripTypeFilter,
    difficultyFilter,
    durationFilter,
    selectedThemes,
    openOnlyFilter,
    activeTab,
    isMyTripsRoute,
  ]);

  // Sorted trips logic
  const sortedAndFilteredTrips = useMemo(() => {
    const list = [...filteredTrips];
    switch (sortBy) {
      case 'price_asc':
        return list.sort((a, b) => a.budgetPerPerson - b.budgetPerPerson);
      case 'price_desc':
        return list.sort((a, b) => b.budgetPerPerson - a.budgetPerPerson);
      case 'date_asc':
        return list.sort((a, b) => {
          const da = parseTripDate(a.startDate)?.getTime() || 0;
          const db = parseTripDate(b.startDate)?.getTime() || 0;
          return da - db;
        });
      case 'duration_asc':
        return list.sort((a, b) => a.durationDays - b.durationDays);
      case 'duration_desc':
        return list.sort((a, b) => b.durationDays - a.durationDays);
      case 'popularity':
        return list.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));
      case 'recommended':
      default:
        return list.sort((a, b) => (b.compatibilityScore || 85) - (a.compatibilityScore || 85));
    }
  }, [filteredTrips, sortBy]);

  return (
    <div
      className={`flex flex-col gap-8 text-left w-full max-w-[1536px] mx-auto ${
        isInApp ? '' : 'px-4 sm:px-6 lg:px-8 py-8 sm:py-10'
      }`}
    >
      {/* 1. HERO & DISCOVERY SEARCH CONSOLE */}
      <div className="relative rounded-3xl overflow-hidden border border-border/70 bg-white shadow-card text-white">
        {/* Scenic Background with Gradient */}
        <div className="absolute inset-x-0 top-0 h-[340px] sm:h-[320px] z-0">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85"
            alt="Scenic mountain ridge travellers"
            className="w-full h-full object-cover object-[center_45%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/65 to-emerald-950/30" />
        </div>

        <div className="relative z-10 p-5 sm:p-8 lg:p-10">
          {/* Header Title & Create Room CTA Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 sm:mb-10 text-left">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-accent text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Your next adventure starts here</span>
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                {isMyTripsRoute ? 'My Adventures' : 'Find Your Next Trip'}
              </h1>
              <p className="text-xs sm:text-base text-gray-200 mt-2 max-w-xl font-medium leading-relaxed">
                {isMyTripsRoute
                  ? 'All trips you have organized or joined with fellow explorers.'
                  : 'Discover beautiful places and find travel companions who share your pace, plans, and budget.'}
              </p>
            </div>

            {/* "+ Create Trip Room / Host Space" button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={handleOpenCreateRoom}
                className="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-white/95 hover:bg-white text-primary font-heading font-bold text-sm shadow-lg motion-safe:hover:-translate-y-0.5 active:scale-[0.98] transition-all border border-white/70 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Create a trip</span>
              </button>
            </div>
          </div>

          {/* Elevated Search & Filter Console Card */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-text border border-border/70">
            {/* Primary Search Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-stretch">
              {/* Destination Search */}
              <div className="lg:col-span-3 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-light-bg border border-border/80 focus-within:bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all min-h-[50px]">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <div className="flex flex-col text-left w-full min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Destination
                  </span>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={destinationQuery}
                      onChange={(e) => setDestinationQuery(e.target.value)}
                      placeholder="Where to?"
                      className="w-full text-xs sm:text-sm font-semibold text-text bg-transparent outline-none placeholder:text-text-subtle truncate"
                    />
                    {destinationQuery && (
                      <button
                        type="button"
                        onClick={() => setDestinationQuery('')}
                        className="text-text-muted hover:text-text p-0.5 ml-1"
                        aria-label="Clear destination"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Departure Hub / From City */}
              <div className="lg:col-span-3 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-light-bg border border-border/80 focus-within:bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all min-h-[50px]">
                <Compass className="w-5 h-5 text-primary shrink-0" />
                <div className="flex flex-col text-left w-full min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Departure Hub
                  </span>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full text-xs sm:text-sm font-semibold text-text bg-transparent outline-none cursor-pointer"
                  >
                    {DEPARTURE_CITIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates Range */}
              <div
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.tagName !== 'BUTTON' && target.tagName !== 'INPUT') {
                    if (!startDateQuery) openStartDatePicker();
                    else openEndDatePicker();
                  }
                }}
                className="lg:col-span-3 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-light-bg border border-border/80 focus-within:bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all min-h-[50px] cursor-pointer"
              >
                <Calendar
                  className="w-5 h-5 text-primary shrink-0 hover:scale-110 transition-transform cursor-pointer"
                  onClick={() => {
                    if (!startDateQuery) openStartDatePicker();
                    else openEndDatePicker();
                  }}
                />
                <div className="flex flex-col text-left w-full min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      onClick={() => (!startDateQuery ? openStartDatePicker() : openEndDatePicker())}
                      className="text-[10px] font-bold uppercase tracking-wider text-text-muted cursor-pointer hover:text-primary transition-colors"
                    >
                      Travel Dates
                    </span>
                    {(startDateQuery || endDateQuery) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStartDateQuery('');
                          setEndDateQuery('');
                        }}
                        className="text-[10px] text-primary hover:underline font-semibold"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      ref={startDateInputRef}
                      type="date"
                      value={startDateQuery}
                      onChange={(e) => setStartDateQuery(e.target.value)}
                      onClick={(e) => {
                        e.stopPropagation();
                        openStartDatePicker();
                      }}
                      aria-label="Trip start date"
                      className="w-full text-xs font-semibold text-text bg-transparent outline-none cursor-pointer"
                    />
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        openEndDatePicker();
                      }}
                      className="text-text-muted text-xs font-bold shrink-0 cursor-pointer hover:text-primary"
                    >
                      →
                    </span>
                    <input
                      ref={endDateInputRef}
                      type="date"
                      value={endDateQuery}
                      min={startDateQuery || undefined}
                      onChange={(e) => setEndDateQuery(e.target.value)}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEndDatePicker();
                      }}
                      aria-label="Trip end date"
                      className="w-full text-xs font-semibold text-text bg-transparent outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Filter Toggle & Search */}
              <div className="lg:col-span-3 flex items-center gap-2.5 min-h-[50px]">
                <button
                  type="button"
                  onClick={() => setShowMoreFilters((prev) => !prev)}
                  className={`flex-1 h-full min-h-[50px] flex items-center justify-center gap-2 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    showMoreFilters || activeFiltersCount > 0
                      ? 'bg-primary/10 text-primary border-primary shadow-xs'
                      : 'bg-light-bg hover:bg-gray-100 text-text border-border'
                  }`}
                  aria-expanded={showMoreFilters}
                >
                  <SlidersHorizontal className="w-4 h-4 text-primary shrink-0" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {activeFiltersCount}
                    </span>
                  )}
                  {showMoreFilters ? (
                    <ChevronUp className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = document.getElementById('trips-catalog-view');
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="h-full min-h-[50px] px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-bold text-sm shadow-subtle hover:shadow-hover hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Search className="w-4 h-4 shrink-0 stroke-[2.5]" />
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Quick Destination Chips Row */}
            <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-text-muted mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Trending:</span>
              </span>
              {QUICK_DESTINATIONS.map((dest) => {
                const isActive =
                  (dest === 'All' && !destinationQuery) ||
                  destinationQuery.toLowerCase() === dest.toLowerCase();
                return (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setDestinationQuery(dest === 'All' ? '' : dest)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-light-bg hover:bg-gray-200 text-text border border-border/80'
                    }`}
                  >
                    {dest}
                  </button>
                );
              })}
            </div>

            {/* EXPANDABLE EXTENDED FILTERS DRAWER */}
            {showMoreFilters && (
              <div className="mt-6 pt-6 border-t border-border/70 space-y-6">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="font-heading font-bold text-sm text-text flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    <span>Make it your kind of trip</span>
                  </h4>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset All Filters</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {/* Filter 1: Budget Range */}
                  <div className="space-y-3 rounded-2xl border border-border/70 bg-light-bg/60 p-4">
                    <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-primary" />
                      <span>Max Budget / Person</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {BUDGET_PRESETS.map((preset) => {
                        const isSelected = selectedBudgetMax === preset.max && !customBudgetInput;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setSelectedBudgetMax(preset.max);
                              setCustomBudgetInput('');
                            }}
                            className={`text-xs min-h-[38px] py-2 px-2 rounded-lg border text-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                              isSelected
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-white hover:bg-emerald-50 hover:border-primary/40 text-text border-border/80'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    {/* Custom budget input */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-text-muted font-medium shrink-0">Custom ₹</span>
                      <input
                        type="number"
                        placeholder="e.g. 7500"
                        value={customBudgetInput}
                        onChange={(e) => {
                          setCustomBudgetInput(e.target.value);
                          setSelectedBudgetMax(undefined);
                        }}
                        aria-label="Custom maximum budget per person"
                        className="w-full min-w-0 text-xs rounded-lg border border-border px-3 py-2 text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  </div>

                  {/* Filter 2: Trip Type */}
                  <div className="space-y-3 rounded-2xl border border-border/70 bg-light-bg/60 p-4">
                    <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span>Travel Group Type</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'all', label: 'All Types' },
                        { value: 'group', label: '👥 Group Trips' },
                        { value: 'solo', label: '🧭 Solo Explorers' },
                        { value: 'couple', label: '💑 Couple Friendly' },
                      ].map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setTripTypeFilter(t.value as any)}
                          className={`text-xs min-h-[38px] py-2 px-2 rounded-lg border text-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                            tripTypeFilter === t.value
                              ? 'bg-primary text-white border-primary shadow-xs'
                              : 'bg-white hover:bg-emerald-50 hover:border-primary/40 text-text border-border/80'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter 3: Difficulty */}
                  <div className="space-y-3 rounded-2xl border border-border/70 bg-light-bg/60 p-4">
                    <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-primary" />
                      <span>Trek & Route Difficulty</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'all', label: 'All Levels' },
                        { value: 'easy', label: '🟢 Easy / Relaxed' },
                        { value: 'medium', label: '🟡 Moderate' },
                        { value: 'hard', label: '🔴 Challenging' },
                      ].map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setDifficultyFilter(d.value as any)}
                          className={`text-xs min-h-[38px] py-2 px-2 rounded-lg border text-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                            difficultyFilter === d.value
                              ? 'bg-primary text-white border-primary shadow-xs'
                              : 'bg-white hover:bg-emerald-50 hover:border-primary/40 text-text border-border/80'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter 4: Duration */}
                  <div className="space-y-3 rounded-2xl border border-border/70 bg-light-bg/60 p-4">
                    <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-primary" />
                      <span>Trip Duration</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'all', label: 'Any Days' },
                        { value: 'short', label: '1–3 Days (Weekend)' },
                        { value: 'medium', label: '4–6 Days (Week)' },
                        { value: 'long', label: '7+ Days (Expedition)' },
                      ].map((dur) => (
                        <button
                          key={dur.value}
                          type="button"
                          onClick={() => setDurationFilter(dur.value as any)}
                          className={`text-xs min-h-[38px] py-2 px-2 rounded-lg border text-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                            durationFilter === dur.value
                              ? 'bg-primary text-white border-primary shadow-xs'
                              : 'bg-white hover:bg-emerald-50 hover:border-primary/40 text-text border-border/80'
                          }`}
                        >
                          {dur.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filter 5: Trip Categories & Themes (Multi-select) */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Trip Category & Travel Interests</span>
                    </label>
                    {selectedThemes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedThemes([])}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        Clear interests
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {THEME_OPTIONS.map((theme) => {
                      const isSelected = selectedThemes.includes(theme.id);
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => toggleTheme(theme.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-xs'
                              : 'bg-white hover:bg-emerald-50 hover:border-primary/40 text-text border-border/80'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{theme.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 ml-0.5 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter 6: Availability Checkbox */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-text select-none">
                    <input
                      type="checkbox"
                      checked={openOnlyFilter}
                      onChange={(e) => setOpenOnlyFilter(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <span>Only show trips with open spots for joining</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. ACTIVE FILTERS CHIPS (Summary bar if any active filters) */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-light-bg/70 p-3 rounded-2xl border border-border">
          <span className="text-xs font-bold text-text-muted flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Active Filters ({activeFiltersCount}):</span>
          </span>

          {destinationQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-primary border border-primary/30 text-xs font-semibold shadow-xs">
              Destination: {destinationQuery}
              <button
                type="button"
                onClick={() => setDestinationQuery('')}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCity !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-primary border border-primary/30 text-xs font-semibold shadow-xs">
              From: {selectedCity}
              <button
                type="button"
                onClick={() => setSelectedCity('all')}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(startDateQuery || endDateQuery) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-primary border border-primary/30 text-xs font-semibold shadow-xs">
              Dates: {startDateQuery || 'Any'} → {endDateQuery || 'Any'}
              <button
                type="button"
                onClick={() => {
                  setStartDateQuery('');
                  setEndDateQuery('');
                }}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(selectedBudgetMax !== undefined || customBudgetInput) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-primary border border-primary/30 text-xs font-semibold shadow-xs">
              Max ₹{customBudgetInput || selectedBudgetMax?.toLocaleString('en-IN')}
              <button
                type="button"
                onClick={() => {
                  setSelectedBudgetMax(undefined);
                  setCustomBudgetInput('');
                }}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {tripTypeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-primary border border-primary/30 text-xs font-semibold shadow-xs capitalize">
              Type: {tripTypeFilter}
              <button
                type="button"
                onClick={() => setTripTypeFilter('all')}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {difficultyFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-primary border border-primary/30 text-xs font-semibold shadow-xs capitalize">
              Difficulty: {difficultyFilter}
              <button
                type="button"
                onClick={() => setDifficultyFilter('all')}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {durationFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-primary border border-primary/30 text-xs font-semibold shadow-xs capitalize">
              Duration: {durationFilter}
              <button
                type="button"
                onClick={() => setDurationFilter('all')}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedThemes.map((theme) => (
            <span
              key={theme}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-primary border border-primary/30 text-xs font-semibold shadow-xs"
            >
              {theme}
              <button
                type="button"
                onClick={() => toggleTheme(theme)}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {openOnlyFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-primary border border-primary/30 text-xs font-semibold shadow-xs">
              Open spots only
              <button
                type="button"
                onClick={() => setOpenOnlyFilter(false)}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-xs text-primary font-bold hover:underline ml-auto"
          >
            Clear all
          </button>
        </div>
      )}

      {/* 3. SUB-TABS & SORT CONTROL ROW */}
      <div id="trips-catalog-view" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border pb-3 scroll-mt-24">
        {/* Left: Filter Tabs */}
        {!isMyTripsRoute ? (
          <Tabs
            tabs={filterTabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            variant="underline"
          />
        ) : (
          <div className="text-sm font-semibold text-text">
            Showing your registered and created itineraries
          </div>
        )}

        {/* Right: Results Count, Sort Dropdown & Host Button */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-xs text-text-muted font-semibold">
            {sortedAndFilteredTrips.length}{' '}
            {sortedAndFilteredTrips.length === 1 ? 'trip found' : 'trips found'}
          </span>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-border shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-semibold text-text-muted hidden md:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-bold text-text bg-transparent outline-none cursor-pointer pr-1"
              aria-label="Sort trips by"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. RESPONSIVE TRIP CARDS GRID */}
      {sortedAndFilteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedAndFilteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Frown className="w-8 h-8" />}
          title={isMyTripsRoute ? 'No trips found in your account' : 'No trips match your filters'}
          description={
            isMyTripsRoute
              ? "You haven't joined or created any trips yet. Explore popular open trips or host your own public room!"
              : "We couldn't find any trips matching your selected destination, dates, budget or preferences. Try broadening your criteria or reset filters."
          }
          actionLabel={isMyTripsRoute ? 'Explore All Trips' : 'Reset all filters'}
          onAction={
            isMyTripsRoute
              ? () => navigate(isInApp ? '/app/trips' : '/trips')
              : handleClearAllFilters
          }
        />
      )}

      {/* 5. CREATE TRIP ROOM & PUBLIC SPACE MODAL */}
      {isCreateRoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div role="dialog" aria-modal="true" aria-labelledby="create-trip-room-title" className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-border overflow-hidden text-left my-auto max-h-[94dvh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-8 bg-gradient-to-r from-emerald-900 via-primary-dark to-emerald-800 text-white flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-7 h-7 rounded-lg bg-amber-400 text-text font-bold text-sm flex items-center justify-center">
                    👑
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Host a Space · Trip Leader
                  </span>
                </div>
                <h3 id="create-trip-room-title" className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
                  Create a Trip Room & Public Space
                </h3>
                <p className="text-xs text-gray-200 mt-1 max-w-md">
                  Set the itinerary, choose who travels with you, and become the Trip Leader for this adventure.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateRoomOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 ml-2"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleCreateRoomSubmit} className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1 min-h-0">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Step A: Space Visibility / Room Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <span>Choose Room Space Visibility *</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewRoomType('public')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      newRoomType === 'public'
                        ? 'bg-primary/10 text-primary border-primary ring-2 ring-primary/30 shadow-xs'
                        : 'bg-white hover:bg-light-bg text-text border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between font-heading font-bold text-sm">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-primary" />
                        <span>Public Space</span>
                      </span>
                      <span className="text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1 leading-snug">
                      Listed on the public trips board. Travellers across Tripzobox can discover and request to join.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRoomType('private')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      newRoomType === 'private'
                        ? 'bg-primary/10 text-primary border-primary ring-2 ring-primary/30 shadow-xs'
                        : 'bg-white hover:bg-light-bg text-text border-border'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-heading font-bold text-sm">
                      <Lock className="w-4 h-4 text-primary" />
                      <span>Private Room</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1 leading-snug">
                      Hidden from public search. Only companions with your secret Room Code can join.
                    </p>
                  </button>
                </div>
              </div>

              {/* Step B: Room Title & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Trip Room Title *
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g. Munnar Misty Morning Treks"
                    className="w-full text-xs sm:text-sm rounded-xl border border-border bg-white px-3.5 py-2.5 text-text outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Destination *
                  </label>
                  <input
                    type="text"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    placeholder="e.g. Munnar, Kerala"
                    className="w-full text-xs sm:text-sm rounded-xl border border-border bg-white px-3.5 py-2.5 text-text outline-none focus:border-primary"
                    required
                  />
                  {/* Quick destination suggestion pills */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Munnar', 'Varkala', 'Goa', 'Kochi', 'Coorg', 'Ooty'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setNewDestination(`${d}, South India`)}
                        className="text-[10px] bg-light-bg hover:bg-gray-200 text-text px-2 py-0.5 rounded-md border border-border"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step C: Departure Hub & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Starting Hub
                  </label>
                  <select
                    value={newStartCity}
                    onChange={(e) => setNewStartCity(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-xl border border-border bg-white px-3 py-2.5 text-text outline-none focus:border-primary"
                  >
                    <option value="Kochi">Kochi, Kerala</option>
                    <option value="Bengaluru">Bengaluru, Karnataka</option>
                    <option value="Panaji">Goa (Panaji)</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-xl border border-border bg-white px-3 py-2.5 text-text outline-none focus:border-primary cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    min={newStartDate}
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-xl border border-border bg-white px-3 py-2.5 text-text outline-none focus:border-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Step D: Budget & Max Room Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-text">
                      Budget / Person
                    </label>
                    <span className="text-xs font-bold text-primary">
                      ₹{newBudget.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1500"
                    max="20000"
                    step="500"
                    value={newBudget}
                    onChange={(e) => setNewBudget(parseInt(e.target.value, 10))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
                    <span>₹1,500</span>
                    <span>₹10,000</span>
                    <span>₹20,000+</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="trip-room-capacity" className="block text-xs font-semibold text-text mb-1">
                    Room Capacity (Max Travellers)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="trip-room-capacity"
                      type="number"
                      min={newTripType === 'solo' ? 1 : 2}
                      max="20"
                      value={newTripType === 'solo' ? 1 : newMaxMembers}
                      disabled={newTripType === 'solo'}
                      aria-describedby={newTripType === 'solo' ? 'solo-capacity-explanation' : undefined}
                      onChange={(e) => setNewMaxMembers(parseInt(e.target.value, 10) || 6)}
                      className="w-full text-xs sm:text-sm rounded-xl border border-border bg-white px-3.5 py-2.5 text-text outline-none focus:border-primary disabled:bg-gray-100 disabled:text-text-muted disabled:cursor-not-allowed"
                    />
                    <span className="text-xs text-text-muted shrink-0">travellers</span>
                  </div>
                  {newTripType === 'solo' && (
                    <p id="solo-capacity-explanation" role="status" className="mt-2 flex items-start gap-1.5 text-xs text-text-muted leading-relaxed">
                      <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      Solo trips are for one traveller, so room capacity is fixed at 1. Choose Group or Couple to change it.
                    </p>
                  )}
                </div>
              </div>

              {/* Step E: Group Type & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">
                    Travel Group Type
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { value: 'group', label: '👥 Group' },
                      { value: 'solo', label: '🧭 Solo' },
                      { value: 'couple', label: '💑 Couple' },
                    ].map((gt) => (
                      <button
                        key={gt.value}
                        type="button"
                        onClick={() => setNewTripType(gt.value as any)}
                        className={`text-xs py-2 rounded-xl border font-semibold transition-all ${
                          newTripType === gt.value
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-white hover:bg-light-bg text-text border-border'
                        }`}
                      >
                        {gt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { value: 'easy', label: '🟢 Easy' },
                      { value: 'medium', label: '🟡 Med' },
                      { value: 'hard', label: '🔴 Hard' },
                    ].map((df) => (
                      <button
                        key={df.value}
                        type="button"
                        onClick={() => setNewDifficulty(df.value as any)}
                        className={`text-xs py-2 rounded-xl border font-semibold transition-all ${
                          newDifficulty === df.value
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-white hover:bg-light-bg text-text border-border'
                        }`}
                      >
                        {df.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step F: Travel Preferences Chips */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  Trip Themes & Preferences
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {THEME_OPTIONS.map((th) => {
                    const isSelected = newPreferences.includes(th.id);
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => toggleNewPref(th.id)}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-white hover:bg-light-bg text-text border-border'
                        }`}
                      >
                        {th.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step G: Description & Note */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Trip Room Description & Companion Note
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Share your travel vision, itinerary thoughts, and what kind of travel buddies you'd love to join..."
                  className="w-full text-xs sm:text-sm rounded-xl border border-border bg-white px-3.5 py-2.5 text-text outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Step H: Cover Photo Preset */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-primary" />
                  <span>Choose Cover Photo</span>
                </span>
                <input ref={coverFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverUpload} className="hidden" aria-label="Upload trip cover image" />
                <Button type="button" variant="secondary" size="sm" onClick={() => coverFileInputRef.current?.click()} disabled={isReadingCover} icon={<Upload className="w-4 h-4" />}>
                  {isReadingCover ? 'Reading image...' : 'Upload Image'}
                </Button>
                </div>
                <p className="text-xs text-text-muted mb-3">Choose a cover below or upload your own JPG, PNG, or WebP (up to 2 MB).</p>
                {coverUploadError && <p role="alert" className="text-xs text-red-600 mb-3">{coverUploadError}</p>}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {COVER_PRESETS.map((cov) => (
                    <button
                      key={cov.label}
                      type="button"
                      onClick={() => setNewCoverUrl(cov.url)}
                      aria-pressed={newCoverUrl === cov.url}
                      className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all ${
                        newCoverUrl === cov.url
                          ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-sm'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={cov.url} alt={cov.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 right-1 text-[9px] font-bold text-white bg-black/60 px-1 rounded truncate">
                        {cov.label}
                      </span>
                    </button>
                  ))}
                </div>
                {uploadedCover && <button type="button" aria-pressed={newCoverUrl === uploadedCover.url} onClick={() => setNewCoverUrl(uploadedCover.url)} className={`mt-3 flex w-full items-center gap-3 rounded-xl border-2 p-2 text-left ${newCoverUrl === uploadedCover.url ? 'border-primary bg-emerald-50' : 'border-border bg-white'}`}>
                  <img src={uploadedCover.url} alt="Uploaded trip cover preview" className="h-16 w-24 rounded-lg object-cover shrink-0" />
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-text">{uploadedCover.name}</span><span className="block text-xs text-primary mt-1">{newCoverUrl === uploadedCover.url ? 'Selected cover image' : 'Use uploaded image'}</span></span>
                  {newCoverUrl === uploadedCover.url && <Check className="w-5 h-5 text-primary ml-auto shrink-0" />}
                </button>}
              </div>

              {/* Leader Reminder Footer */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-900 leading-snug">
                  <strong>You are the Trip Leader:</strong> You will be the host of this {newRoomType === 'public' ? 'Public Space' : 'Private Room'}. You can approve join requests, manage group chat, and coordinate trip details anytime.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto min-h-[48px]"
                  onClick={() => setIsCreateRoomOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isReadingCover}
                  iconRight={<Crown className="w-4 h-4 text-amber-300" />}
                  className="w-full sm:w-auto px-6 font-bold shadow-hover min-h-[48px]"
                >
                  <span>Create Room & Open {newRoomType === 'public' ? 'Public Space' : 'Private Room'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
