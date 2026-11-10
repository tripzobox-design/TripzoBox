import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  MapPin,
  RotateCcw,
  Send,
  ArrowRight,
  Check,
  X,
  Compass,
  SlidersHorizontal,
  Plus,
  LayoutGrid,
  List,
  BookOpen,
} from 'lucide-react';
import { useDiary } from '../context/DiaryContext';
import { useAuth } from '../context/AuthContext';
import { StoryCard } from '../components/feature/StoryCard';

const TRIP_TYPES = ['All', 'Solo', 'Group', 'Family'] as const;
const DURATIONS = ['All', '1–3 days', '4–7 days', '8+ days'] as const;

const TRAVEL_STYLES_COL1 = ['Adventure', 'Culture', 'Nature'] as const;
const TRAVEL_STYLES_COL2 = ['Relaxation', 'Backpacking', 'Photography'] as const;

const LANGUAGES_COL1 = ['Hindi', 'Tamil'] as const;
const LANGUAGES_COL2 = ['English', 'Others'] as const;

export const StoriesPage: React.FC = () => {
  const { stories } = useDiary();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Search & Filter State
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [selectedTripType, setSelectedTripType] = useState<string>('All');
  const [selectedDuration, setSelectedDuration] = useState<string>('All');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('latest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (destinationFilter.trim()) count++;
    if (selectedTripType !== 'All') count++;
    if (selectedDuration !== 'All') count++;
    if (selectedStyles.length > 0) count += selectedStyles.length;
    if (selectedLanguages.length > 0) count += selectedLanguages.length;
    return count;
  }, [destinationFilter, selectedTripType, selectedDuration, selectedStyles, selectedLanguages]);

  const createPath = '/app/diary/create-story';

  const handleCreateStory = () => {
    if (isLoggedIn) {
      navigate(createPath);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(createPath)}`, {
        state: { from: { pathname: createPath } },
      });
    }
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDestinationFilter('');
    setSelectedTripType('All');
    setSelectedDuration('All');
    setSelectedStyles([]);
    setSelectedLanguages([]);
    setSortBy('latest');
  };

  // Filtered & Sorted Stories
  const visibleStories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const dest = destinationFilter.trim().toLowerCase();

    const filtered = stories.filter((story) => {
      // Visibility / Tab
      if (story.visibility === 'private' && (!isLoggedIn || story.author.id !== user?.id)) {
        return false;
      }
      if (activeTab === 'mine' && (!isLoggedIn || story.author.id !== user?.id)) {
        return false;
      }

      // Search Query (title, destination, summary, full content, author)
      if (q) {
        const matchesQuery =
          story.title.toLowerCase().includes(q) ||
          story.destination.toLowerCase().includes(q) ||
          story.author.name.toLowerCase().includes(q) ||
          story.summary.toLowerCase().includes(q) ||
          (story.fullContent && story.fullContent.some((p) => p.toLowerCase().includes(q)));
        if (!matchesQuery) return false;
      }

      // Destination Sidebar Filter
      if (dest) {
        if (!story.destination.toLowerCase().includes(dest)) return false;
      }

      // Trip Type
      if (selectedTripType !== 'All') {
        if (story.tripType && story.tripType !== selectedTripType) return false;
      }

      // Duration
      if (selectedDuration !== 'All') {
        const d = story.days || 3;
        if (selectedDuration === '1–3 days' && (d < 1 || d > 3)) return false;
        if (selectedDuration === '4–7 days' && (d < 4 || d > 7)) return false;
        if (selectedDuration === '8+ days' && d < 8) return false;
      }

      // Travel Styles
      if (selectedStyles.length > 0) {
        const storyStyles = story.travelStyle || [];
        const matchesStyle = selectedStyles.some(
          (s) =>
            storyStyles.includes(s) ||
            story.tags?.includes(s) ||
            (story.category && story.category.toLowerCase() === s.toLowerCase())
        );
        if (!matchesStyle) return false;
      }

      // Languages
      if (selectedLanguages.length > 0) {
        const storyLangs = [
          ...(story.languages || []),
          ...(story.author.languages || []),
        ];
        const matchesLang = selectedLanguages.some((l) =>
          storyLangs.some((sl) => sl.toLowerCase() === l.toLowerCase())
        );
        if (!matchesLang) return false;
      }

      return true;
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.views || b.likes || 0) - (a.views || a.likes || 0);
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'photos') {
        return (b.photosCount || 0) - (a.photosCount || 0);
      }
      // default: latest
      return 0;
    });
  }, [
    stories,
    isLoggedIn,
    user?.id,
    activeTab,
    searchQuery,
    destinationFilter,
    selectedTripType,
    selectedDuration,
    selectedStyles,
    selectedLanguages,
    sortBy,
  ]);

  const hasActiveFilters =
    searchQuery ||
    destinationFilter ||
    selectedTripType !== 'All' ||
    selectedDuration !== 'All' ||
    selectedStyles.length > 0 ||
    selectedLanguages.length > 0;

  // Reusable Filter Sections (shared by sticky desktop sidebar and mobile slide-out drawer)
  const renderFilterSections = (isDrawer = false) => (
    <div className="space-y-4 text-left">
      {/* 1. Destination Input */}
      <div>
        <label
          htmlFor={isDrawer ? 'drawer-destination-filter' : 'destination-filter'}
          className="block text-xs font-semibold text-gray-700 mb-1.5"
        >
          Destination
        </label>
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <input
            id={isDrawer ? 'drawer-destination-filter' : 'destination-filter'}
            type="text"
            placeholder="Search destinations..."
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none"
          />
          {destinationFilter && (
            <button
              type="button"
              onClick={() => setDestinationFilter('')}
              className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
              aria-label="Clear destination"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Trip Type Pills */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Trip Type
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TRIP_TYPES.map((type) => {
            const isSelected = selectedTripType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedTripType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
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

      {/* 3. Duration Pills */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Duration
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map((dur) => {
            const isSelected = selectedDuration === dur;
            return (
              <button
                key={dur}
                type="button"
                onClick={() => setSelectedDuration(dur)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#0D5A46] text-white font-semibold shadow-2xs'
                    : 'border border-gray-200 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50'
                }`}
              >
                {dur}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Travel Style (2-column checkboxes) */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Travel Style
        </label>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <div className="space-y-1">
            {TRAVEL_STYLES_COL1.map((style) => {
              const isChecked = selectedStyles.includes(style);
              return (
                <label
                  key={style}
                  onClick={() => toggleStyle(style)}
                  className="flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900 cursor-pointer select-none py-1 group"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isChecked
                        ? 'bg-[#0D5A46] border-[#0D5A46] text-white'
                        : 'border-gray-300 bg-white group-hover:border-emerald-600'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="font-medium text-xs text-gray-700">{style}</span>
                </label>
              );
            })}
          </div>

          <div className="space-y-1">
            {TRAVEL_STYLES_COL2.map((style) => {
              const isChecked = selectedStyles.includes(style);
              return (
                <label
                  key={style}
                  onClick={() => toggleStyle(style)}
                  className="flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900 cursor-pointer select-none py-1 group"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isChecked
                        ? 'bg-[#0D5A46] border-[#0D5A46] text-white'
                        : 'border-gray-300 bg-white group-hover:border-emerald-600'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="font-medium text-xs text-gray-700">{style}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Languages (2-column checkboxes) */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Languages
        </label>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <div className="space-y-1">
            {LANGUAGES_COL1.map((lang) => {
              const isChecked = selectedLanguages.includes(lang);
              return (
                <label
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className="flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900 cursor-pointer select-none py-1 group"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
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

          <div className="space-y-1">
            {LANGUAGES_COL2.map((lang) => {
              const isChecked = selectedLanguages.includes(lang);
              return (
                <label
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className="flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900 cursor-pointer select-none py-1 group"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
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
      </div>

      {/* 6. Reset Filters Button (desktop only) */}
      {!isDrawer && (
        <button
          type="button"
          onClick={handleResetFilters}
          className="w-full py-2.5 px-4 rounded-xl border border-emerald-600/30 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full text-left bg-light-bg min-h-screen">
      {/* ========================================================================= */}
      {/* 1. PANORAMIC HERO BANNER WITH DOODLE QUOTE & EMBEDDED SEARCH */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden border-b border-gray-200/80 bg-[#E8F4EE]">
        {/* Scenic Panoramic Mountain Landscape Background with Hiker on Right */}
        <div
          className="absolute inset-0 bg-cover bg-right"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85')`,
            backgroundPosition: 'right 25% center',
          }}
        />

        {/* Soft Multi-stop Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F4FAF7] via-[#F4FAF7]/95 via-45% to-transparent" />

        <div className="relative max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left Content Area */}
            <div className="max-w-xl text-left z-10">
              {/* Tab Switcher: My Diary Entries vs Travel Stories */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => navigate('/app/diary')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/80 hover:bg-white text-gray-700 border border-gray-200/80 transition-all cursor-pointer shadow-2xs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>My Trip Diary</span>
                </button>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0D5A46] text-white shadow-2xs">
                  <Compass className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Travel Stories</span>
                </div>
              </div>

              <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1.5">
                REAL PEOPLE. REAL JOURNEYS.
              </p>
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-gray-900 tracking-tight">
                Travel Stories
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed max-w-lg">
                Discover honest stories, hidden gems and practical tips from travellers around
                the world.
              </p>

              {/* Embedded Search Input */}
              <div className="mt-5 sm:mt-6 flex items-center gap-3 rounded-full border border-gray-200/90 bg-white px-4 py-3 shadow-xs max-w-lg">
                <Search className="w-4 h-4 text-emerald-700 shrink-0" />
                <input
                  type="text"
                  aria-label="Search stories"
                  placeholder="Search stories, destinations, or travellers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-w-0 bg-transparent outline-none text-xs sm:text-sm text-gray-800 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Center-Right Calligraphy Doodle: "Real stories. Better journeys." */}
            <div className="hidden lg:flex items-center gap-2 select-none -rotate-6 text-[#0A6044] pr-12 xl:pr-24">
              <div
                className="text-xl xl:text-2xl font-bold tracking-tight leading-snug drop-shadow-xs"
                style={{
                  fontFamily: '"Caveat", "Segoe Script", "Brush Script MT", cursive, sans-serif',
                }}
              >
                Real stories.
                <br />
                Better journeys.
              </div>
              <div className="text-emerald-700 font-bold text-lg mt-1 -ml-0.5">彡</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SUB-HEADER TOOLBAR (All / My Stories, Mobile Filter, View Mode & Sort) */}
      {/* ========================================================================= */}
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Tab Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#0D5A46] text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200/90 hover:bg-gray-50'
              }`}
            >
              All Stories
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  navigate(`/login?redirect=${encodeURIComponent('/stories')}`);
                } else {
                  setActiveTab('mine');
                }
              }}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'mine'
                  ? 'bg-[#0D5A46] text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200/90 hover:bg-gray-50'
              }`}
            >
              My Stories
            </button>
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => navigate('/app/diary')}
                className="px-4 sm:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer bg-white text-gray-600 hover:text-[#0D5A46] border border-gray-200/90 hover:bg-gray-50 flex items-center gap-1.5 shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>My Diary Entries</span>
              </button>
            )}
          </div>

          {/* Right Toolbar: Mobile Filter Trigger, Create Story, View Mode, Sort */}
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {/* Mobile Filter Button (lg:hidden) */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200/90 bg-white hover:bg-emerald-50/50 text-xs font-semibold text-gray-700 hover:text-[#0D5A46] shadow-2xs transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-[#0D5A46] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Mobile Create Story Button (lg:hidden) */}
            <button
              type="button"
              onClick={handleCreateStory}
              className="lg:hidden inline-flex items-center gap-1 bg-[#0D5A46] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-800 shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create</span>
            </button>

            {/* View Mode Toggle (List / Grid) */}
            <div className="flex items-center bg-white border border-gray-200/90 rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Diary List View"
                aria-label="Diary List View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#0D5A46] text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid View"
                aria-label="Grid View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#0D5A46] text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sort by Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium hidden sm:inline">Sort:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort stories by"
                  className="appearance-none bg-white border border-gray-200/90 rounded-xl px-3 py-1.5 pr-7 text-xs font-semibold text-gray-800 shadow-2xs hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="photos">Most Photos</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE SLIDE-OUT FILTER SIDEBAR DRAWER */}
      {/* ========================================================================= */}
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
                <h2 className="font-heading font-extrabold text-base text-gray-900">Filter Stories</h2>
                {activeFilterCount > 0 && (
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {renderFilterSections(true)}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 text-center transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0D5A46] text-white text-xs font-bold hover:bg-emerald-800 text-center shadow-xs transition-colors cursor-pointer"
              >
                Show {visibleStories.length} Stories
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MAIN CONTENT: 2-COLUMN SPLIT (GRID/LIST + DESKTOP STICKY SIDEBAR) */}
      {/* ========================================================================= */}
      <main className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8 items-start">
          {/* ===================================================================== */}
          {/* LEFT COLUMN: ACTIVE FILTERS TRAY + STORY CARDS */}
          {/* ===================================================================== */}
          <div className="min-w-0 space-y-4">
            {/* Active Filters Pill Bar */}
            {activeFilterCount > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-3 flex flex-wrap items-center gap-2 shadow-2xs">
                <span className="text-xs font-bold text-gray-500 mr-1">Active filters:</span>

                {destinationFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Destination: {destinationFilter}
                    <button
                      type="button"
                      onClick={() => setDestinationFilter('')}
                      className="hover:text-emerald-950 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedTripType !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Type: {selectedTripType}
                    <button
                      type="button"
                      onClick={() => setSelectedTripType('All')}
                      className="hover:text-emerald-950 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedDuration !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Duration: {selectedDuration}
                    <button
                      type="button"
                      onClick={() => setSelectedDuration('All')}
                      className="hover:text-emerald-950 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedStyles.map((style) => (
                  <span
                    key={style}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    {style}
                    <button
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className="hover:text-emerald-950 p-0.5 cursor-pointer"
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
                      className="hover:text-emerald-950 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

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
                Showing <strong className="text-gray-900">{visibleStories.length}</strong> of{' '}
                <strong className="text-gray-900">{stories.length}</strong> stories
              </span>
              {activeFilterCount > 0 && (
                <span className="text-emerald-700 font-medium">Filters active</span>
              )}
            </div>

            {/* Story Cards List or Grid */}
            {visibleStories.length > 0 ? (
              viewMode === 'list' ? (
                <div className="space-y-3.5 sm:space-y-4">
                  {visibleStories.map((story) => (
                    <StoryCard key={story.id} story={story} variant="horizontal" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-5">
                  {visibleStories.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-gray-200/90 bg-white p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-lg text-gray-900">
                  {hasActiveFilters ? 'No matching stories found' : 'No stories yet'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'Try adjusting your destination, duration, or travel style filters to see more results.'
                    : 'Be the first to share an unforgettable journey with fellow travellers!'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* RIGHT COLUMN: STICKY DESKTOP SIDEBAR (HIDDEN ON MOBILE) */}
          {/* ===================================================================== */}
          <aside className="hidden lg:block space-y-5 lg:sticky lg:top-24">
            {/* WIDGET 1: SHARE YOUR STORY */}
            <div className="rounded-2xl bg-[#0B543F] p-5 sm:p-6 text-white shadow-xs text-left relative overflow-hidden">
              {/* Paper Plane Icon */}
              <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center text-white mb-3.5">
                <Send className="w-5 h-5 -rotate-45" />
              </div>

              <h2 className="font-heading font-bold text-lg text-white">Share Your Story</h2>
              <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                Turn your travel memories into an inspiring story.
              </p>

              <button
                type="button"
                onClick={handleCreateStory}
                className="mt-5 w-full bg-white text-[#0B543F] hover:bg-emerald-50 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <span>Create Story</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* WIDGET 2: FILTER STORIES */}
            <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs text-left space-y-4">
              <h2 className="font-heading font-bold text-sm text-gray-900">Filter Stories</h2>
              {renderFilterSections(false)}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
