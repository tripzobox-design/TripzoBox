import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Calendar,
  MapPin,
  Check,
  Plus,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Edit3,
  Globe,
  Lock,
  FileText,
  CalendarDays,
  Wallet,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Table,
  Upload,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDiary } from '../context/DiaryContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type StoryStep = 1 | 2 | 3 | 4;

interface ExperienceItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  category: string;
  tripType: string;
}

const DEFAULT_EXPERIENCES: ExperienceItem[] = [
  {
    id: 'exp_varkala_beach',
    title: 'Varkala Beach',
    subtitle: '12 May 2025 · Varkala, Kerala',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    category: 'Beach',
    tripType: 'Solo',
  },
  {
    id: 'exp_cliff_cafe',
    title: 'Cliff Cafe',
    subtitle: '13 May 2025 · Varkala, Kerala',
    imageUrl:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    category: 'Food',
    tripType: 'Solo',
  },
  {
    id: 'exp_sunset_varkala',
    title: 'Sunset at Varkala',
    subtitle: '13 May 2025 · Varkala, Kerala',
    imageUrl:
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
    category: 'Nature',
    tripType: 'Solo',
  },
  {
    id: 'exp_janardhana_temple',
    title: 'Janardhana Swamy Temple',
    subtitle: '14 May 2025 · Varkala, Kerala',
    imageUrl:
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
    category: 'Culture',
    tripType: 'Solo',
  },
  {
    id: 'exp_kochi_fort',
    title: 'Kochi Fort',
    subtitle: '20 May 2025 · Kochi, Kerala',
    imageUrl:
      'https://images.unsplash.com/photo-1558025638-565ae7710b3f?auto=format&fit=crop&w=600&q=80',
    category: 'City',
    tripType: 'Group',
  },
  {
    id: 'exp_chinese_nets',
    title: 'Chinese Fishing Nets',
    subtitle: '20 May 2025 · Kochi, Kerala',
    imageUrl:
      'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=600&q=80',
    category: 'Culture',
    tripType: 'Group',
  },
  {
    id: 'exp_munroe_island',
    title: 'Munroe Island',
    subtitle: '22 May 2025 · Kollam, Kerala',
    imageUrl:
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
    category: 'Adventure',
    tripType: 'Group',
  },
];

export const CreateStoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { publishStory } = useDiary();
  const { success, info } = useToast();

  const [step, setStep] = useState<StoryStep>(1);

  // =========================================================================
  // STEP 1 STATE: SELECT EXPERIENCES
  // =========================================================================
  const [selectedExpIds, setSelectedExpIds] = useState<string[]>([
    'exp_varkala_beach',
    'exp_cliff_cafe',
    'exp_sunset_varkala',
    'exp_kochi_fort',
    'exp_munroe_island',
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tripTypeFilter, setTripTypeFilter] = useState<'All' | 'Solo' | 'Group' | 'Family'>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All Dates');
  const [locationFilter, setLocationFilter] = useState('All Places');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Filter experiences
  const filteredExperiences = useMemo(() => {
    return DEFAULT_EXPERIENCES.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        `${item.title} ${item.subtitle} ${item.category}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchTripType = tripTypeFilter === 'All' || item.tripType === tripTypeFilter;
      const matchTag = !selectedTag || item.category === selectedTag;
      return matchSearch && matchTripType && matchTag;
    });
  }, [searchQuery, tripTypeFilter, selectedTag]);

  const toggleExperience = (id: string) => {
    setSelectedExpIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // =========================================================================
  // STEP 2 STATE: STORY DETAILS
  // =========================================================================
  const [storyTitle, setStoryTitle] = useState('My Unforgettable Western Ghats Journey');
  const [destination, setDestination] = useState('Munnar & Varkala, Kerala');
  const [startDate, setStartDate] = useState('2025-05-12');
  const [endDate, setEndDate] = useState('2025-05-22');

  const travelDates = useMemo(() => {
    if (!startDate && !endDate) return 'Select dates';
    if (startDate && !endDate) {
      const d = new Date(startDate + 'T00:00:00');
      return isNaN(d.getTime())
        ? startDate
        : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (!startDate && endDate) {
      const d = new Date(endDate + 'T00:00:00');
      return isNaN(d.getTime())
        ? endDate
        : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (startDate === endDate) {
      const d = new Date(startDate + 'T00:00:00');
      return isNaN(d.getTime())
        ? startDate
        : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const d1 = new Date(startDate + 'T00:00:00');
    const d2 = new Date(endDate + 'T00:00:00');
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return `${startDate} - ${endDate}`;
    if (d1.getFullYear() === d2.getFullYear()) {
      if (d1.getMonth() === d2.getMonth()) {
        return `${d1.getDate()} - ${d2.getDate()} ${d1.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })}`;
      }
      return `${d1.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
      })} - ${d2.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`;
    }
    return `${d1.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} - ${d2.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }, [startDate, endDate]);

  const [coverPhoto, setCoverPhoto] = useState(
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80'
  );
  const [storySummary, setStorySummary] = useState(
    'From early misty mornings in Lockhart tea plantations to crimson sunsets over Varkala cliffs, here is how we explored Kerala with a small group of travellers.'
  );

  // =========================================================================
  // STEP 3 STATE: YOUR TRAVEL GUIDE (MODULES & EDITOR)
  // =========================================================================
  const [includedModules, setIncludedModules] = useState({
    fullStory: true,
    itinerary: true,
    expenses: true,
    places: true,
    foodTips: false,
    photosGallery: true,
  });

  const [fullStoryNarrative, setFullStoryNarrative] = useState(
    'From early misty mornings in Lockhart tea plantations to crimson sunsets over Varkala cliffs, here is how we explored Kerala with a small group of travellers.'
  );

  const [storyPhotos, setStoryPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
  ]);

  // =========================================================================
  // STEP 4 STATE: REVIEW & POST
  // =========================================================================
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [categories, setCategories] = useState<string[]>([
    'Nature',
    'Adventure',
    'Food',
  ]);
  const [isPublishing, setIsPublishing] = useState(false);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handlePublishStory = () => {
    setIsPublishing(true);
    setTimeout(() => {
      const created = publishStory({
        title: storyTitle,
        destination,
        dates: travelDates,
        summary: storySummary,
        coverImageUrl: coverPhoto,
        galleryImages: storyPhotos,
        fullContent: [fullStoryNarrative],
        readTimeMins: 4,
        visibility,
        entries: [],
      });

      confetti({
        particleCount: 90,
        spread: 65,
        origin: { y: 0.55 },
      });

      success('Your travel story has been published to the community!', 'Story Published 🎉');
      setIsPublishing(false);
      navigate(`/stories/${created.slug}`);
    }, 450);
  };

  const handleSaveDraft = () => {
    success('Story draft saved in your private diary.', 'Draft Saved');
  };

  const handleCoverPhotoChange = () => {
    const alternates = [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
    ];
    const pick = alternates[(alternates.indexOf(coverPhoto) + 1) % alternates.length];
    setCoverPhoto(pick);
    info('Cover photo updated.');
  };

  const handleAddPhotoToStory = () => {
    const newPics = [
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
    ];
    setStoryPhotos([...storyPhotos, newPics[storyPhotos.length % newPics.length]]);
    success('Photo added to story gallery!');
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto py-2 sm:py-6 px-3 sm:px-6 text-left space-y-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/stories"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Stories</span>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* HERO BANNER (Screen 1 in image) */}
      {/* ========================================================================= */}
      {step === 1 ? (
        <div className="relative rounded-3xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 p-6 sm:p-8 shadow-xs overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-left z-10">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
              Create a Travel Story
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed max-w-lg">
              Turn your diary experiences into an inspiring, practical travel story for fellow
              travellers.
            </p>
          </div>

          {/* Right Hiker Landscape Banner with Script Quote */}
          <div className="w-full md:w-80 h-32 sm:h-36 rounded-2xl overflow-hidden shrink-0 shadow-xs relative border border-white/60">
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
              alt="Hiker journey"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
            <div className="absolute bottom-3 left-4 right-4 text-left">
              <span className="font-heading italic font-bold text-sm sm:text-base text-white drop-shadow-sm">
                Real stories.
                <br />
                Better journeys.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
            Create a Travel Story
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {step === 2 && 'Add the basic details and a short summary of your trip.'}
            {step === 3 && 'Add more details to make your story more useful for fellow travellers.'}
            {step === 4 && 'Review your story before publishing. You can always make changes later.'}
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4-STEP STEPPER ROW (Matching Screens 1, 2, 3, 4) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between px-2 py-2">
        {[
          { id: 1 as const, label: 'Select Experiences' },
          { id: 2 as const, label: 'Story Details' },
          { id: 3 as const, label: 'Your Travel Guide' },
          { id: 4 as const, label: 'Review & Post' },
        ].map((item, idx, arr) => {
          const isCurrent = step === item.id;
          const isCompleted = step > item.id;
          return (
            <React.Fragment key={item.id}>
              <button
                type="button"
                onClick={() => setStep(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-primary text-white shadow-xs'
                    : isCompleted
                    ? 'text-primary hover:bg-emerald-50'
                    : 'text-gray-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isCompleted
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : item.id}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>

              {idx < arr.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      step > item.id ? 'bg-primary w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 1: STEP 1: SELECT EXPERIENCES */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          {/* Left Column: Filter Experiences */}
          <aside className="bg-white rounded-3xl border border-gray-200/90 p-5 shadow-xs space-y-5 self-start">
            <h3 className="font-heading font-bold text-sm sm:text-base text-gray-900">
              Filter Experiences
            </h3>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places, dates or keywords..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            {/* Trip Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Trip Type</label>
              <div className="flex flex-wrap gap-1.5">
                {(['All', 'Solo', 'Group', 'Family'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTripTypeFilter(type)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      tripTypeFilter === type
                        ? 'bg-primary text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date Range</label>
              <div className="relative">
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="All Dates">All Dates</option>
                  <option value="May 2025">May 2025</option>
                  <option value="June 2025">June 2025</option>
                  <option value="July 2025">July 2025</option>
                </select>
                <Calendar className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Location</label>
              <div className="relative">
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="All Places">All Places</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Varkala">Varkala</option>
                  <option value="Kochi">Kochi</option>
                  <option value="Munnar">Munnar</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {['Nature', 'Adventure', 'Culture', 'Food', 'City', 'Beach', 'Wildlife'].map(
                  (tag) => {
                    const isSelected = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(isSelected ? null : tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white border-primary'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Clear All */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTripTypeFilter('All');
                  setDateRangeFilter('All Dates');
                  setLocationFilter('All Places');
                  setSelectedTag(null);
                }}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </aside>

          {/* Right Column: Your Travel Diary Experiences */}
          <main className="lg:col-span-3 bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-7 shadow-xs space-y-6">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <h2 className="font-heading font-extrabold text-base sm:text-lg text-gray-900">
                  Your Travel Diary Experiences
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select the experiences you want to include in your story. You can reorder them
                  later.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-primary">
                  Selected ({selectedExpIds.length})
                </span>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4-Column Experience Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              {filteredExperiences.map((item) => {
                const isSelected = selectedExpIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleExperience(item.id)}
                    className={`relative rounded-2xl border overflow-hidden bg-white shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-gray-100">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Check badge top-left */}
                      {isSelected && (
                        <div className="absolute top-2 left-2 w-5 h-5 rounded-md bg-primary text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="p-2.5 sm:p-3 text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            info(`Experience: ${item.title}`);
                          }}
                          className="text-gray-400 hover:text-gray-700 p-0.5"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-gray-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* 8th Card: Add more experiences */}
              <Link
                to="/app/diary/add"
                className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80 p-4 flex flex-col items-center justify-center text-center transition-colors group cursor-pointer min-h-[140px]"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-2xs">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="font-heading font-bold text-xs text-gray-900 group-hover:text-primary transition-colors">
                  Add more experiences
                </h4>
                <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                  You can select more from your diary into our draft
                </p>
              </Link>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: STEP 2: STORY DETAILS */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Left Column: Form Details (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-5">
            {/* Story Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Story Title <span className="text-emerald-600">*</span>
                </label>
                <span className="text-[11px] text-gray-400">{storyTitle.length}/100</span>
              </div>
              <input
                type="text"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all font-medium text-gray-900"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Destination <span className="text-emerald-600">*</span>
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all font-medium text-gray-900"
                />
              </div>
            </div>

            {/* Travel Dates & Cover Photo Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Travel Dates <span className="text-emerald-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[11px] text-gray-500 font-medium mb-1">
                      From Date
                    </span>
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (endDate && e.target.value && endDate < e.target.value) {
                            setEndDate(e.target.value);
                          }
                        }}
                        onClick={(e) => (e.target as any).showPicker?.()}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm outline-none transition-all font-medium text-gray-900 bg-white cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-500 font-medium mb-1">
                      To Date
                    </span>
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        min={startDate || undefined}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        onClick={(e) => (e.target as any).showPicker?.()}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm outline-none transition-all font-medium text-gray-900 bg-white cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                {(startDate || endDate) && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Selected: {travelDates}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Cover Photo <span className="text-emerald-600">*</span>
                </label>
                <span className="hidden sm:block text-[11px] text-transparent font-medium mb-1 select-none">
                  Align
                </span>
                <div className="flex items-center gap-3">
                  <img
                    src={coverPhoto}
                    alt="Cover preview"
                    className="w-20 h-11 rounded-xl object-cover border border-gray-200 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleCoverPhotoChange}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Story Intro / Executive Summary */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Story Intro / Executive Summary <span className="text-emerald-600">*</span>
                </label>
                <span className="text-[11px] text-gray-400">{storySummary.length}/500</span>
              </div>
              <textarea
                rows={4}
                value={storySummary}
                onChange={(e) => setStorySummary(e.target.value)}
                maxLength={500}
                className="w-full p-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all resize-y text-gray-700 leading-relaxed"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs sm:text-sm font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer"
              >
                &larr; Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Preview Card (Matching Screen 2) */}
          <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-xs self-start text-left space-y-4">
            <h3 className="font-heading font-bold text-sm text-gray-900">Preview</h3>

            <div className="rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs bg-white">
              <img
                src={coverPhoto}
                alt="Story preview"
                className="w-full h-36 object-cover"
              />
              <div className="p-4 space-y-2">
                <h4 className="font-heading font-bold text-sm text-gray-900 leading-snug">
                  {storyTitle}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    {destination}
                  </span>
                  <span>·</span>
                  <span>{travelDates}</span>
                  <span>·</span>
                  <span>{selectedExpIds.length} experiences</span>
                </div>

                {/* Author row */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="text-[11px]">
                    <span className="font-semibold text-gray-800">{user.name}</span>
                    <span className="text-gray-400 ml-1">· Traveller</span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed pt-1">
                  {storySummary}
                </p>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer">
                    <span>View Full Story</span>
                    <span>&rarr;</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: STEP 3: YOUR TRAVEL GUIDE */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Left Column: Story Content Modules */}
          <aside className="bg-white rounded-3xl border border-gray-200/90 p-5 shadow-xs space-y-4 self-start">
            <div>
              <h3 className="font-heading font-bold text-base text-gray-900">Story Content</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose what you want to include in your story.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  id: 'fullStory',
                  title: 'Full Story',
                  desc: 'Write the complete travel experience, tips and insights.',
                  icon: FileText,
                },
                {
                  id: 'itinerary',
                  title: 'Itinerary',
                  desc: 'Day-wise plan of your trip.',
                  icon: CalendarDays,
                },
                {
                  id: 'expenses',
                  title: 'Travel Expenses',
                  desc: 'Total cost, stay, food, transport, etc.',
                  icon: Wallet,
                },
                {
                  id: 'places',
                  title: 'Places Visited',
                  desc: 'Must-visit spots and highlights.',
                  icon: MapPin,
                },
                {
                  id: 'foodTips',
                  title: 'Food & Local Tips',
                  desc: 'Recommended food, local tips & hacks.',
                  icon: Sparkles,
                },
                {
                  id: 'photosGallery',
                  title: 'Photos & Gallery',
                  desc: 'Add more photos and videos.',
                  icon: Camera,
                },
              ].map((mod) => {
                const Icon = mod.icon;
                const isChecked = includedModules[mod.id as keyof typeof includedModules];
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() =>
                      setIncludedModules((prev) => ({
                        ...prev,
                        [mod.id]: !prev[mod.id as keyof typeof includedModules],
                      }))
                    }
                    className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50/60 border-primary/40 ring-1 ring-primary/20'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <h4 className="font-heading font-bold text-xs text-gray-900 truncate">
                        {mod.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{mod.desc}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        isChecked ? 'bg-primary border-primary text-white' : 'border-gray-300'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Column: Editor Panel */}
          <main className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6 text-left">
            {/* Section: Full Story */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-base text-gray-900">Full Story</h3>

              {/* Rich Text Toolbar */}
              <div className="flex items-center gap-1 p-1.5 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-600 flex-wrap">
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-white hover:text-gray-900"
                  aria-label="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-white hover:text-gray-900"
                  aria-label="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-white hover:text-gray-900"
                  aria-label="Link"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-white hover:text-gray-900"
                  aria-label="Bullet list"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-white hover:text-gray-900"
                  aria-label="Numbered list"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-white hover:text-gray-900"
                  aria-label="Quote"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-white hover:text-gray-900"
                  aria-label="Table"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Narrative Textarea */}
              <textarea
                rows={4}
                value={fullStoryNarrative}
                onChange={(e) => setFullStoryNarrative(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all resize-y text-gray-700 leading-relaxed font-sans"
              />

              {/* Photos Gallery Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {storyPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative w-28 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-2xs group"
                  >
                    <img
                      src={photo}
                      alt="Story photo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <button
                      type="button"
                      onClick={() => setStoryPhotos(storyPhotos.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddPhotoToStory}
                  className="h-20 px-4 rounded-xl border border-gray-300 hover:border-primary text-gray-600 hover:text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Photos</span>
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs sm:text-sm font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer"
              >
                &larr; Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-1 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: STEP 4: REVIEW & POST */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Left Column: Full Story Preview Card (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/90 overflow-hidden shadow-xs space-y-4 text-left">
            {/* Large Cover Photo */}
            <div className="h-48 sm:h-64 w-full overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
                alt="Story banner"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-5 sm:p-7 space-y-4">
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900 leading-tight">
                {storyTitle}
              </h2>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {destination}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  {travelDates} · {selectedExpIds.length} experiences
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-xs font-semibold text-gray-800">{user.name}</span>
                <span className="text-xs text-gray-400">· Traveller</span>
              </div>

              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed pt-1">
                {storySummary}
              </p>

              {/* 4 Photo gallery preview */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {[
                  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80',
                  'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=400&q=80',
                  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=400&q=80',
                  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
                ].map((p, idx) => (
                  <img
                    key={idx}
                    src={p}
                    alt="Gallery thumbnail"
                    className="h-16 sm:h-20 w-full object-cover rounded-xl border border-gray-100"
                  />
                ))}
              </div>

              {/* Bottom Nav / Module Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100 text-xs">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 font-medium">
                  <CalendarDays className="w-3.5 h-3.5 text-primary" />
                  <span>Itinerary</span>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 font-medium">
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  <span>Expenses</span>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Places</span>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Tips</span>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 font-medium">
                  <Camera className="w-3.5 h-3.5 text-primary" />
                  <span>Photos (12)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Publishing Options */}
          <aside className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-7 shadow-xs space-y-6 self-start text-left">
            {/* Visibility */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-sm text-gray-900">Visibility</h3>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="storyVisibility"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                  className="mt-0.5 accent-primary cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Public</span>
                  <span className="text-[11px] text-gray-500">
                    Anyone can discover and read this story.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="storyVisibility"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                  className="mt-0.5 accent-primary cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Private</span>
                  <span className="text-[11px] text-gray-500">
                    Only invited people can view this story.
                  </span>
                </div>
              </label>

              {/* Callout box */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex items-start gap-2.5 text-emerald-900 text-xs">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-snug">
                  This story will be visible to everyone on Tripzobox. Photos, places and details
                  you added will be public.
                </p>
              </div>
            </div>

            {/* Add to Categories */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-sm text-gray-900">Add to Categories</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Nature', 'Adventure', 'Culture', 'Food', 'Photography', 'Roads'].map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer text-gray-700">
                    <input
                      type="checkbox"
                      checked={categories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="rounded accent-primary"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={() => success('Custom tag added!')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add custom tag</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="w-full py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors cursor-pointer text-center"
              >
                Save as Draft
              </button>
              <button
                type="button"
                disabled={isPublishing}
                onClick={handlePublishStory}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60 text-center"
              >
                {isPublishing ? 'Publishing...' : 'Publish Story'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
