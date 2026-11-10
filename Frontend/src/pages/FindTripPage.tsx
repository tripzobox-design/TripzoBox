import React, { useState, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  Navigation,
  ChevronDown,
  RotateCcw,
  Check,
  X,
  Compass,
  Star,
  Users,
  ShieldCheck,
  Sparkles,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { useTrips } from '../context/TripsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TripCard } from '../components/feature/TripCard';
import { SEO } from '../components/common/SEO';

const TRIP_TYPES = ['All', 'Group Trip', 'Solo Friendly', 'Couple', 'Family', 'Women Only'] as const;

const DURATION_OPTIONS = [
  { id: '1-2', label: '1–2 days', desc: 'Weekend Escape', min: 1, max: 2 },
  { id: '3-5', label: '3–5 days', desc: 'Short Trip', min: 3, max: 5 },
  { id: '6-10', label: '6–10 days', desc: 'Week Journey', min: 6, max: 10 },
  { id: '10+', label: '10+ days', desc: 'Extended Expedition', min: 10, max: 999 },
];

const TRAVEL_STYLES = [
  'Adventure',
  'Nature',
  'Mountains',
  'Trekking',
  'Beaches',
  'Culture',
  'Food',
  'Relaxation',
  'Photography',
  'Backpacking',
  'Camping',
  'Road Trip',
] as const;

const LANGUAGES = [
  'Hindi',
  'English',
  'Tamil',
  'Malayalam',
  'Kannada',
  'Telugu',
  'Punjabi',
  'Others',
] as const;

const GROUP_SIZE_OPTIONS = [
  { id: 'intimate', label: 'Intimate (2–4 travelers)', min: 1, max: 4 },
  { id: 'standard', label: 'Standard (5–8 travelers)', min: 5, max: 8 },
  { id: 'large', label: 'Large Group (8+ travelers)', min: 9, max: 99 },
];

const INCLUSION_OPTIONS = [
  { id: 'transport', label: 'Transport Included' },
  { id: 'accommodation', label: 'Stay / Accommodation' },
  { id: 'meals', label: 'Meals Included' },
  { id: 'gear', label: 'Equipment & Guide' },
];

const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Easy / Relaxed', desc: 'Leisurely pace, all fitness levels' },
  { id: 'medium', label: 'Moderate / Active', desc: 'Walking & moderate trails' },
  { id: 'hard', label: 'Challenging / Trek', desc: 'High altitude, rugged routes' },
];

const START_CITIES = [
  'All Cities',
  'Bengaluru',
  'Delhi',
  'Kochi',
  'Chandigarh',
  'Thiruvananthapuram',
] as const;

const CATEGORY_TABS = ['Popular', 'Upcoming', 'Nearby', 'My Interests'] as const;

export const FindTripPage: React.FC = () => {
  const { trips } = useTrips();
  const { user, isLoggedIn } = useAuth();
  const { success } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const isMyTripsRoute = location.pathname.includes('/my');

  const [searchParams, setSearchParams] = useSearchParams();

  // Search State
  const initialDestination = searchParams.get('destination') || searchParams.get('q') || '';
  const [destinationInput, setDestinationInput] = useState(initialDestination);
  const [departureDateInput, setDepartureDateInput] = useState('');
  const [fromCityInput, setFromCityInput] = useState('');

  // Category & Sort State
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('Popular');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Sidebar Filter State — ALL BLANK BY DEFAULT ON PAGE VISIT
  const [selectedTripType, setSelectedTripType] = useState<string>('All');
  const [budgetMax, setBudgetMax] = useState<number>(10000);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]); // BLANK by default
  const [selectedTravelStyles, setSelectedTravelStyles] = useState<string[]>([]); // BLANK by default
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]); // BLANK by default
  const [selectedGroupSizes, setSelectedGroupSizes] = useState<string[]>([]); // BLANK by default
  const [selectedInclusions, setSelectedInclusions] = useState<string[]>([]); // BLANK by default
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]); // BLANK by default
  const [onlyAvailableSpots, setOnlyAvailableSpots] = useState<boolean>(false); // BLANK by default
  const [minRating, setMinRating] = useState<number>(0); // BLANK by default
  const [startCityFilter, setStartCityFilter] = useState<string>('All Cities'); // BLANK by default
  const [showAllStyles, setShowAllStyles] = useState(false);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Pagination / Load More
  const [visibleCount, setVisibleCount] = useState<number>(6);

  // Filter Toggle Handlers
  const toggleDuration = (id: string) => {
    setSelectedDurations((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleTravelStyle = (style: string) => {
    setSelectedTravelStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleGroupSize = (id: string) => {
    setSelectedGroupSizes((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleInclusion = (id: string) => {
    setSelectedInclusions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleDifficulty = (id: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  // Complete Reset Handler: clears ALL filters to completely blank & default
  const handleResetFilters = () => {
    setDestinationInput('');
    setDepartureDateInput('');
    setFromCityInput('');
    setSelectedTripType('All');
    setBudgetMax(10000);
    setSelectedDurations([]);
    setSelectedTravelStyles([]);
    setSelectedLanguages([]);
    setSelectedGroupSizes([]);
    setSelectedInclusions([]);
    setSelectedDifficulties([]);
    setOnlyAvailableSpots(false);
    setMinRating(0);
    setStartCityFilter('All Cities');
    setIsMoreFiltersOpen(false);
    setSortBy('newest');
    setActiveCategoryTab('Popular');
    setVisibleCount(6);
    setSearchParams({}, { replace: true });
    success('All filters have been reset');
  };

  const handleCreateTrip = () => {
    const targetPath = isLoggedIn ? '/app/trips/create' : '/trips/create';
    navigate(targetPath);
  };

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (destinationInput.trim()) count++;
    if (departureDateInput.trim()) count++;
    if (fromCityInput.trim()) count++;
    if (selectedTripType !== 'All') count++;
    if (budgetMax < 10000) count++;
    count += selectedDurations.length;
    count += selectedTravelStyles.length;
    count += selectedLanguages.length;
    count += selectedGroupSizes.length;
    count += selectedInclusions.length;
    count += selectedDifficulties.length;
    if (onlyAvailableSpots) count++;
    if (minRating > 0) count++;
    if (startCityFilter !== 'All Cities') count++;
    return count;
  }, [
    destinationInput,
    departureDateInput,
    fromCityInput,
    selectedTripType,
    budgetMax,
    selectedDurations,
    selectedTravelStyles,
    selectedLanguages,
    selectedGroupSizes,
    selectedInclusions,
    selectedDifficulties,
    onlyAvailableSpots,
    minRating,
    startCityFilter,
  ]);

  // Filter Logic
  const filteredTrips = useMemo(() => {
    const dest = destinationInput.trim().toLowerCase();
    const fromCity = fromCityInput.trim().toLowerCase();
    const depDate = departureDateInput.trim().toLowerCase();

    return trips.filter((trip) => {
      // If on My Trips route, only show trips user is member of or leader
      if (isMyTripsRoute) {
        if (!isLoggedIn) return false;
        const isMember = trip.members.some((m) => m.id === user?.id);
        const isLeader = trip.leader.id === user?.id;
        if (!isMember && !isLeader) return false;
      }

      // Destination filter
      if (dest) {
        const matchesDest =
          trip.destination.toLowerCase().includes(dest) ||
          trip.name.toLowerCase().includes(dest) ||
          (trip.highlights && trip.highlights.some((h) => h.toLowerCase().includes(dest)));
        if (!matchesDest) return false;
      }

      // From city filter (hero search input)
      if (fromCity) {
        if (!trip.startCity.toLowerCase().includes(fromCity)) return false;
      }

      // Starting City dropdown filter
      if (startCityFilter !== 'All Cities') {
        if (trip.startCity.toLowerCase() !== startCityFilter.toLowerCase()) return false;
      }

      // Departure Date filter
      if (departureDateInput.trim()) {
        const inputD = new Date(departureDateInput + 'T00:00:00');
        let matchesDate = false;

        if (!isNaN(inputD.getTime())) {
          const tripStart = new Date(trip.startDate);
          const tripEnd = new Date(trip.endDate);

          if (!isNaN(tripStart.getTime())) {
            const isSameDay =
              tripStart.getFullYear() === inputD.getFullYear() &&
              tripStart.getMonth() === inputD.getMonth() &&
              tripStart.getDate() === inputD.getDate();

            const isWithinTrip =
              !isNaN(tripEnd.getTime()) &&
              tripStart.getTime() <= inputD.getTime() &&
              inputD.getTime() <= tripEnd.getTime();

            const isUpcomingInMonth =
              tripStart.getFullYear() === inputD.getFullYear() &&
              tripStart.getMonth() === inputD.getMonth() &&
              tripStart.getDate() >= inputD.getDate();

            matchesDate = isSameDay || isWithinTrip || isUpcomingInMonth;
          }
        }

        if (!matchesDate) {
          const depRaw = departureDateInput.trim().toLowerCase();
          matchesDate =
            trip.startDate.toLowerCase().includes(depRaw) ||
            trip.endDate.toLowerCase().includes(depRaw);
        }

        if (!matchesDate) return false;
      }

      // Trip Type
      if (selectedTripType !== 'All') {
        const badge = trip.badge?.toLowerCase() || '';
        const tType = trip.tripType?.toLowerCase() || '';
        const style = trip.travelStyle?.toLowerCase() || '';
        const tags = (trip.tags || []).map((t) => t.toLowerCase());
        const target = selectedTripType.toLowerCase();

        if (target.includes('group') && !badge.includes('group') && tType !== 'group' && style !== 'group')
          return false;
        if (target.includes('solo') && !badge.includes('solo') && tType !== 'solo' && style !== 'solo')
          return false;
        if (target.includes('couple') && !badge.includes('couple') && tType !== 'couple' && style !== 'couple')
          return false;
        if (target.includes('family') && !badge.includes('family') && tType !== 'family' && style !== 'family' && !tags.includes('family'))
          return false;
        if (target.includes('women') && !badge.includes('women') && !tType.includes('women') && !style.includes('women') && !tags.includes('women'))
          return false;
      }

      // Budget Max
      if (budgetMax < 10000) {
        if (trip.budgetPerPerson > budgetMax) return false;
      }

      // Duration Checkboxes (if empty, matches all)
      if (selectedDurations.length > 0) {
        const days = trip.durationDays;
        const matchesAnyDuration = selectedDurations.some((durId) => {
          const opt = DURATION_OPTIONS.find((o) => o.id === durId);
          if (!opt) return false;
          return days >= opt.min && days <= opt.max;
        });
        if (!matchesAnyDuration) return false;
      }

      // Travel Styles (if empty, matches all)
      if (selectedTravelStyles.length > 0) {
        const tags = trip.tags || [];
        const prefs = trip.preferences || [];
        const combined = [...tags, ...prefs].map((s) => s.toLowerCase());
        const matchesStyle = selectedTravelStyles.some((s) => {
          const query = s.toLowerCase();
          return combined.some((item) => item.includes(query) || query.includes(item));
        });
        if (!matchesStyle) return false;
      }

      // Languages (if empty, matches all)
      if (selectedLanguages.length > 0) {
        const tripLangs = (trip.languages || []).map((l) => l.toLowerCase());
        const matchesLang = selectedLanguages.some((l) =>
          tripLangs.includes(l.toLowerCase())
        );
        if (!matchesLang) return false;
      }

      // Group Size (if empty, matches all)
      if (selectedGroupSizes.length > 0) {
        const size = trip.maxMembers;
        const matchesGroup = selectedGroupSizes.some((gs) => {
          if (gs === 'intimate') return size <= 4;
          if (gs === 'standard') return size >= 5 && size <= 8;
          if (gs === 'large') return size > 8;
          return true;
        });
        if (!matchesGroup) return false;
      }

      // Inclusions (if empty, matches all)
      if (selectedInclusions.length > 0) {
        const allInc = (trip.inclusions || []).join(' ').toLowerCase();
        const matchesAllInclusions = selectedInclusions.every((incId) => {
          if (incId === 'transport') {
            return (
              allInc.includes('transport') ||
              allInc.includes('volvo') ||
              allInc.includes('suv') ||
              allInc.includes('bus') ||
              allInc.includes('scooter') ||
              allInc.includes('ferry') ||
              allInc.includes('bike')
            );
          }
          if (incId === 'accommodation') {
            return (
              allInc.includes('stay') ||
              allInc.includes('accommodation') ||
              allInc.includes('hostel') ||
              allInc.includes('hotel') ||
              allInc.includes('homestay') ||
              allInc.includes('tent') ||
              allInc.includes('cottage') ||
              allInc.includes('camp')
            );
          }
          if (incId === 'meals') {
            return (
              allInc.includes('meal') ||
              allInc.includes('breakfast') ||
              allInc.includes('dinner') ||
              allInc.includes('food')
            );
          }
          if (incId === 'gear') {
            return (
              allInc.includes('gear') ||
              allInc.includes('guide') ||
              allInc.includes('equipment') ||
              allInc.includes('tour') ||
              allInc.includes('support') ||
              allInc.includes('rafting')
            );
          }
          return true;
        });
        if (!matchesAllInclusions) return false;
      }

      // Difficulty Level (if empty, matches all)
      if (selectedDifficulties.length > 0) {
        if (!selectedDifficulties.includes(trip.difficulty)) return false;
      }

      // Open Spots Available Only (if false, matches all)
      if (onlyAvailableSpots) {
        const spots = trip.spotsLeft ?? Math.max(0, trip.maxMembers - trip.members.length);
        if (spots <= 0) return false;
      }

      // Minimum Rating (if 0, matches all)
      if (minRating > 0) {
        if ((trip.rating || 4.5) < minRating) return false;
      }

      // Category Tabs Logic
      if (activeCategoryTab === 'Popular') {
        // Shown by default
      } else if (activeCategoryTab === 'Upcoming') {
        // Priority to upcoming departure dates
      } else if (activeCategoryTab === 'Nearby') {
        // Priority to South India / regional trips
      } else if (activeCategoryTab === 'My Interests') {
        if (user?.travelInterests && user.travelInterests.length > 0) {
          const uInterests = user.travelInterests.map((i) => i.toLowerCase());
          const tripTags = [...(trip.tags || []), ...(trip.preferences || [])].map((t) =>
            t.toLowerCase()
          );
          const sharesInterest = uInterests.some((ui) =>
            tripTags.some((tt) => tt.includes(ui) || ui.includes(tt))
          );
          if (!sharesInterest) return false;
        }
      }

      return true;
    });
  }, [
    trips,
    isMyTripsRoute,
    isLoggedIn,
    user?.id,
    user?.travelInterests,
    destinationInput,
    fromCityInput,
    startCityFilter,
    departureDateInput,
    selectedTripType,
    budgetMax,
    selectedDurations,
    selectedTravelStyles,
    selectedLanguages,
    selectedGroupSizes,
    selectedInclusions,
    selectedDifficulties,
    onlyAvailableSpots,
    minRating,
    activeCategoryTab,
  ]);

  // Sort Logic
  const sortedTrips = useMemo(() => {
    const list = [...filteredTrips];
    if (sortBy === 'price_asc') {
      return list.sort((a, b) => a.budgetPerPerson - b.budgetPerPerson);
    }
    if (sortBy === 'price_desc') {
      return list.sort((a, b) => b.budgetPerPerson - a.budgetPerPerson);
    }
    if (sortBy === 'rating') {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (sortBy === 'duration') {
      return list.sort((a, b) => a.durationDays - b.durationDays);
    }
    return list;
  }, [filteredTrips, sortBy]);

  const renderFilterSections = (isDrawer = false) => (
    <>
      {!isDrawer && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 sticky top-0 bg-white z-10 pt-0.5">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-base text-gray-900">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-emerald-700 hover:text-emerald-950 font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer group"
                title="Reset all filters to blank"
              >
                <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform duration-300" />
                <span>Reset</span>
              </button>
            </div>

            
      )}

{/* 1. Trip Type (Pills) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800">Trip Type</label>
                {selectedTripType !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setSelectedTripType('All')}
                    className="text-[11px] text-gray-400 hover:text-gray-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TRIP_TYPES.map((type) => {
                  const isSelected = selectedTripType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedTripType(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0D5A46] text-white font-semibold shadow-2xs'
                          : 'border border-gray-200 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Budget (per person) Range Slider + Quick Presets */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-800 mb-1.5">
                <span>Budget (per person)</span>
                <span className="text-emerald-700 font-semibold">
                  {budgetMax >= 10000 ? '₹10,000+' : `Up to ₹${budgetMax.toLocaleString()}`}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                className="w-full accent-[#0D5A46] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
              />
              <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                <span>₹1,000</span>
                <span>₹10,000+</span>
              </div>

              {/* Quick Budget Chips */}
              <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                <button
                  type="button"
                  onClick={() => setBudgetMax(4000)}
                  className={`text-[11px] py-1 px-1.5 rounded-lg border text-center transition-colors cursor-pointer ${
                    budgetMax === 4000
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  &lt; ₹4,000
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetMax(7000)}
                  className={`text-[11px] py-1 px-1.5 rounded-lg border text-center transition-colors cursor-pointer ${
                    budgetMax === 7000
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  &le; ₹7,000
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetMax(10000)}
                  className={`text-[11px] py-1 px-1.5 rounded-lg border text-center transition-colors cursor-pointer ${
                    budgetMax === 10000
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Any Budget
                </button>
              </div>
            </div>

            {/* 3. Trip Duration Checkboxes (BLANK BY DEFAULT) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800">Trip Duration</label>
                {selectedDurations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDurations([])}
                    className="text-[11px] text-gray-400 hover:text-gray-700 font-medium"
                  >
                    Clear ({selectedDurations.length})
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {DURATION_OPTIONS.map((dur) => {
                  const isChecked = selectedDurations.includes(dur.id);
                  return (
                    <label
                      key={dur.id}
                      onClick={() => toggleDuration(dur.id)}
                      className="flex items-center justify-between text-xs text-gray-700 hover:text-gray-900 cursor-pointer select-none py-1 px-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-[#0D5A46] border-[#0D5A46] text-white shadow-2xs'
                              : 'border-gray-300 bg-white group-hover:border-emerald-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-medium text-xs text-gray-800">{dur.label}</span>
                      </div>
                      <span className="text-[11px] text-gray-400">{dur.desc}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 4. Travel Style (2-column checkboxes, BLANK BY DEFAULT) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800">Travel Style & Vibe</label>
                {selectedTravelStyles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTravelStyles([])}
                    className="text-[11px] text-gray-400 hover:text-gray-700 font-medium"
                  >
                    Clear ({selectedTravelStyles.length})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                {(showAllStyles ? TRAVEL_STYLES : TRAVEL_STYLES.slice(0, 8)).map((style) => {
                  const isChecked = selectedTravelStyles.includes(style);
                  return (
                    <label
                      key={style}
                      onClick={() => toggleTravelStyle(style)}
                      className="flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900 cursor-pointer select-none py-0.5 group"
                    >
                      <div
                        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-[#0D5A46] border-[#0D5A46] text-white'
                            : 'border-gray-300 bg-white group-hover:border-emerald-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-medium text-xs text-gray-700 truncate">{style}</span>
                    </label>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowAllStyles(!showAllStyles)}
                className="mt-2 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <span>{showAllStyles ? 'Show Less' : `+ Show ${TRAVEL_STYLES.length - 8} More Styles`}</span>
              </button>
            </div>

            {/* 5. Languages (BLANK BY DEFAULT) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800">Languages</label>
                {selectedLanguages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedLanguages([])}
                    className="text-[11px] text-gray-400 hover:text-gray-700 font-medium"
                  >
                    Clear ({selectedLanguages.length})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                {LANGUAGES.map((lang) => {
                  const isChecked = selectedLanguages.includes(lang);
                  return (
                    <label
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className="flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900 cursor-pointer select-none py-0.5 group"
                    >
                      <div
                        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-[#0D5A46] border-[#0D5A46] text-white'
                            : 'border-gray-300 bg-white group-hover:border-emerald-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-medium text-xs text-gray-700">{lang}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 6. Group Size (NEW FILTER OPTION) */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Group Size</span>
                </label>
                {selectedGroupSizes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedGroupSizes([])}
                    className="text-[11px] text-gray-400 hover:text-gray-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {GROUP_SIZE_OPTIONS.map((gs) => {
                  const isChecked = selectedGroupSizes.includes(gs.id);
                  return (
                    <label
                      key={gs.id}
                      onClick={() => toggleGroupSize(gs.id)}
                      className="flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900 cursor-pointer select-none py-0.5 group"
                    >
                      <div
                        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-[#0D5A46] border-[#0D5A46] text-white'
                            : 'border-gray-300 bg-white group-hover:border-emerald-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-medium text-xs text-gray-700">{gs.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 7. Trip Inclusions (NEW FILTER OPTION) */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Trip Inclusions</span>
                </label>
                {selectedInclusions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedInclusions([])}
                    className="text-[11px] text-gray-400 hover:text-gray-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {INCLUSION_OPTIONS.map((inc) => {
                  const isChecked = selectedInclusions.includes(inc.id);
                  return (
                    <label
                      key={inc.id}
                      onClick={() => toggleInclusion(inc.id)}
                      className="flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900 cursor-pointer select-none py-0.5 group"
                    >
                      <div
                        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-[#0D5A46] border-[#0D5A46] text-white'
                            : 'border-gray-300 bg-white group-hover:border-emerald-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-medium text-xs text-gray-700">{inc.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 8. Activity & Difficulty Level (NEW FILTER OPTION) */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800">Difficulty Level</label>
                {selectedDifficulties.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDifficulties([])}
                    className="text-[11px] text-gray-400 hover:text-gray-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {DIFFICULTY_OPTIONS.map((diff) => {
                  const isChecked = selectedDifficulties.includes(diff.id);
                  return (
                    <label
                      key={diff.id}
                      onClick={() => toggleDifficulty(diff.id)}
                      className="flex items-center justify-between text-xs text-gray-700 hover:text-gray-900 cursor-pointer select-none py-1 px-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-[#0D5A46] border-[#0D5A46] text-white'
                              : 'border-gray-300 bg-white group-hover:border-emerald-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-medium text-xs text-gray-800">{diff.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 9. Availability & Rating (NEW FILTER OPTIONS) */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <label className="text-xs font-bold text-gray-800 block">Preferences & Trust</label>

              {/* Instant Open Spots Only Toggle */}
              <label
                onClick={() => setOnlyAvailableSpots(!onlyAvailableSpots)}
                className="flex items-center justify-between text-xs text-gray-700 hover:text-gray-900 cursor-pointer select-none py-1 px-1.5 rounded-lg hover:bg-gray-50 group"
              >
                <span className="font-medium text-xs text-gray-800">Open Spots Available Only</span>
                <div
                  className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                    onlyAvailableSpots ? 'bg-[#0D5A46]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-white transition-transform ${
                      onlyAvailableSpots ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>

              {/* 4.5+ Star Rating Chip */}
              <label
                onClick={() => setMinRating(minRating > 0 ? 0 : 4.5)}
                className="flex items-center justify-between text-xs text-gray-700 hover:text-gray-900 cursor-pointer select-none py-1 px-1.5 rounded-lg hover:bg-gray-50 group"
              >
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-medium text-xs text-gray-800">Top Rated (4.5★ &amp; above)</span>
                </div>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    minRating >= 4.5
                      ? 'bg-[#0D5A46] border-[#0D5A46] text-white'
                      : 'border-gray-300 bg-white group-hover:border-emerald-600'
                  }`}
                >
                  {minRating >= 4.5 && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </label>

              {/* Departure City Quick Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Starting City
                </label>
                <div className="relative">
                  <select
                    value={startCityFilter}
                    onChange={(e) => setStartCityFilter(e.target.value)}
                    className="w-full appearance-none px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white focus:outline-none focus:border-primary pr-7 cursor-pointer"
                  >
                    {START_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            

      {!isDrawer && (
        <div className="pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-emerald-500/60 text-xs font-semibold text-gray-700 hover:text-emerald-800 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          
      )}
    </>
  );

  const displayedTrips = sortedTrips.slice(0, visibleCount);
  const hasMore = visibleCount < sortedTrips.length;

  return (
    <div className="w-full text-left bg-light-bg min-h-screen">
      <SEO
        title="Find Trips & Group Travel Expeditions"
        description="Browse confirmed upcoming group trips, weekend treks, and road trips. Connect with verified leaders and travel companions."
      />
      {/* ========================================================================= */}
      {/* 1. PANORAMIC HERO BANNER WITH DOODLE & EMBEDDED SEARCH BAR */}
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
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                FIND YOUR NEXT ADVENTURE
              </p>
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-gray-900 tracking-tight">
                Join Amazing Trips
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed max-w-lg">
                Meet like-minded travellers, explore new places and create unforgettable memories
                together.
              </p>
            </div>

            {/* Center-Right Calligraphy Script Doodle */}
            <div className="hidden lg:flex items-center gap-2 select-none -rotate-6 text-[#0A6044] pr-10 xl:pr-24">
              <div
                className="text-xl xl:text-2xl font-bold tracking-tight leading-snug drop-shadow-xs"
                style={{
                  fontFamily: '"Caveat", "Segoe Script", "Brush Script MT", cursive, sans-serif',
                }}
              >
                New people
                <br />
                New places
                <br />
                Better journeys.
              </div>
              <div className="text-emerald-700 font-bold text-lg mt-2 -ml-0.5">彡</div>
            </div>
          </div>

          {/* Unified Horizontal Search Bar inside Hero */}
          <div className="mt-8 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-md border border-gray-200/90 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-center">
            {/* Field 1: Destination */}
            <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl hover:bg-gray-50/80 transition-colors border-b sm:border-b-0 sm:border-r border-gray-200/60">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-gray-900 leading-tight">
                  Destination
                </span>
                <input
                  type="text"
                  placeholder="Where do you want to go?"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none truncate"
                />
              </div>
              {destinationInput && (
                <button
                  type="button"
                  onClick={() => setDestinationInput('')}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Field 2: Departure Date */}
            <div
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest('button')) {
                  const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                  input?.showPicker?.();
                }
              }}
              className="flex items-center gap-3 px-3.5 py-2 rounded-2xl hover:bg-gray-50/80 transition-colors border-b sm:border-b-0 sm:border-r border-gray-200/60 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-emerald-700 shrink-0 pointer-events-none" />
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-gray-900 leading-tight pointer-events-none">
                  Departure Date
                </span>
                <input
                  type="date"
                  value={departureDateInput}
                  onChange={(e) => setDepartureDateInput(e.target.value)}
                  onClick={(e) => (e.target as any).showPicker?.()}
                  className="w-full bg-transparent text-xs font-medium text-gray-700 outline-none truncate cursor-pointer"
                />
              </div>
              {departureDateInput && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDepartureDateInput('');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  title="Clear date"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Field 3: From City */}
            <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl hover:bg-gray-50/80 transition-colors border-b sm:border-b-0 lg:border-r border-gray-200/60">
              <Navigation className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-gray-900 leading-tight">
                  From
                </span>
                <input
                  type="text"
                  placeholder="Your departure city"
                  value={fromCityInput}
                  onChange={(e) => setFromCityInput(e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none truncate"
                />
              </div>
              {fromCityInput && (
                <button
                  type="button"
                  onClick={() => setFromCityInput('')}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Field 4: Search Trips Button */}
            <button
              type="button"
              onClick={() => {
                success('Applied search filters');
              }}
              className="bg-[#0D5A46] hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm py-3 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer w-full"
            >
              <span>Search Trips</span>
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SUB-HEADER TOOLBAR (Category Pills & Sort Dropdown) */}
      {/* ========================================================================= */}
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Category Tab Pills */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
            {CATEGORY_TABS.map((tab) => {
              const isSelected = activeCategoryTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveCategoryTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-[#0D5A46] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200/90 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Right: Actions (Mobile Filter Toggle + Create Trip Button + Sort by Dropdown) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 active:scale-95 text-gray-700 border border-gray-200/90 text-xs font-bold py-2 px-3 sm:px-3.5 rounded-full transition-all shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Create Trip Button matching red circle in screenshot */}
            <button
              type="button"
              onClick={handleCreateTrip}
              className="inline-flex items-center gap-1.5 bg-[#0D5A46] hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-bold py-2 px-3 sm:px-4 rounded-full transition-all shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden xs:inline">Create Trip</span>
              <span className="xs:hidden">Create</span>
            </button>

            {/* Sort by Dropdown */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
              <span className="text-gray-500 font-medium hidden sm:inline">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort trips by"
                  className="appearance-none bg-white border border-gray-200/90 rounded-xl px-2.5 sm:px-3.5 py-1.5 pr-7 sm:pr-8 text-xs font-semibold text-gray-800 shadow-2xs hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="duration">Trip Duration</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN PAGE CONTENT: 2-COLUMN SPLIT (SIDEBAR FILTERS + TRIPS GRID) */}
      {/* ========================================================================= */}
      {/* Mobile Slide-out Filter Sidebar Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileFilterOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Sidebar Drawer */}
          <div className="fixed inset-y-0 left-0 w-full max-w-[340px] sm:max-w-sm bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-300 text-left">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                <h2 className="font-heading font-extrabold text-base text-gray-900">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-emerald-700 hover:text-emerald-950 font-semibold px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Filter Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {renderFilterSections(true)}
            </div>

            {/* Sticky Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all text-center cursor-pointer"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#0D5A46] hover:bg-emerald-800 text-white text-xs font-bold transition-all text-center shadow-xs cursor-pointer"
              >
                Show ({sortedTrips.length}) Trips
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] xl:grid-cols-[320px_1fr] gap-6 lg:gap-8 items-start">
          {/* ===================================================================== */}
          {/* LEFT COLUMN: FILTERS SIDEBAR */}
          {/* ===================================================================== */}
          <aside className="hidden lg:block bg-white rounded-3xl border border-gray-200/90 p-5 shadow-xs space-y-6 text-left lg:sticky lg:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
            {renderFilterSections(false)}
          </aside>

          {/* ===================================================================== */}
          {/* RIGHT COLUMN: ACTIVE FILTER TAGS + TRIPS CARDS GRID */}
          {/* ===================================================================== */}
          <div className="min-w-0 space-y-4">
            {/* Active Filters Pill Bar (Allows customers to see & clear individual filters) */}
            {activeFilterCount > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-3 flex flex-wrap items-center gap-2 shadow-2xs">
                <span className="text-xs font-bold text-gray-500 mr-1">Active filters:</span>

                {selectedTripType !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Type: {selectedTripType}
                    <button
                      type="button"
                      onClick={() => setSelectedTripType('All')}
                      className="hover:text-emerald-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {budgetMax < 10000 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Max: ₹{budgetMax.toLocaleString()}
                    <button
                      type="button"
                      onClick={() => setBudgetMax(10000)}
                      className="hover:text-emerald-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedDurations.map((dId) => {
                  const opt = DURATION_OPTIONS.find((o) => o.id === dId);
                  return (
                    <span
                      key={dId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {opt?.label || dId}
                      <button
                        type="button"
                        onClick={() => toggleDuration(dId)}
                        className="hover:text-emerald-950 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}

                {selectedTravelStyles.map((style) => (
                  <span
                    key={style}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    {style}
                    <button
                      type="button"
                      onClick={() => toggleTravelStyle(style)}
                      className="hover:text-emerald-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {selectedLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className="hover:text-emerald-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {selectedGroupSizes.map((gs) => {
                  const opt = GROUP_SIZE_OPTIONS.find((g) => g.id === gs);
                  return (
                    <span
                      key={gs}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {opt?.label || gs}
                      <button
                        type="button"
                        onClick={() => toggleGroupSize(gs)}
                        className="hover:text-emerald-950 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}

                {selectedInclusions.map((incId) => {
                  const opt = INCLUSION_OPTIONS.find((i) => i.id === incId);
                  return (
                    <span
                      key={incId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {opt?.label || incId}
                      <button
                        type="button"
                        onClick={() => toggleInclusion(incId)}
                        className="hover:text-emerald-950 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}

                {selectedDifficulties.map((diffId) => {
                  const opt = DIFFICULTY_OPTIONS.find((d) => d.id === diffId);
                  return (
                    <span
                      key={diffId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {opt?.label || diffId}
                      <button
                        type="button"
                        onClick={() => toggleDifficulty(diffId)}
                        className="hover:text-emerald-950 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}

                {onlyAvailableSpots && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Open Spots Only
                    <button
                      type="button"
                      onClick={() => setOnlyAvailableSpots(false)}
                      className="hover:text-emerald-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {minRating > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ★ 4.5+
                    <button
                      type="button"
                      onClick={() => setMinRating(0)}
                      className="hover:text-emerald-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {startCityFilter !== 'All Cities' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    From: {startCityFilter}
                    <button
                      type="button"
                      onClick={() => setStartCityFilter('All Cities')}
                      className="hover:text-emerald-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline ml-auto cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Results Count Summary */}
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>
                Showing <strong className="text-gray-900">{displayedTrips.length}</strong> of{' '}
                <strong className="text-gray-900">{sortedTrips.length}</strong> trips
              </span>
              {activeFilterCount > 0 && (
                <span className="text-emerald-700 font-medium">Filters active</span>
              )}
            </div>

            {/* Cards Grid */}
            {displayedTrips.length > 0 ? (
              <>
                <div className="space-y-3 sm:space-y-4">
                  {displayedTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} variant="horizontal" />
                  ))}
                </div>

                {/* Centered Load More Trips Button */}
                {hasMore && (
                  <div className="mt-10 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 6)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-300 bg-white text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
                    >
                      <span>Load More Trips</span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-3xl border border-gray-200/90 bg-white p-12 text-center shadow-xs">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3.5">
                  <Compass className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-gray-900">
                  No trips match your filters
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Try clearing some filter criteria or click the button below to view all available trips.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D5A46] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FindTripPage;
