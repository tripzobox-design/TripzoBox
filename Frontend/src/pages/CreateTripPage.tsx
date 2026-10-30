import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Globe,
  Lock,
  ChevronDown,
  User as UserIcon,
  Users,
  Heart,
  Home,
  Compass,
  Trees,
  Landmark,
  Utensils,
  Waves,
  Mountain,
  Building2,
  Camera,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  X,
  Check,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrips } from '../context/TripsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type CreateTripStep = 1 | 2 | 3;

interface ItineraryItem {
  day: number;
  title: string;
  desc: string;
}

export const CreateTripPage: React.FC = () => {
  const navigate = useNavigate();
  const { createTrip } = useTrips();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [currentStep, setCurrentStep] = useState<CreateTripStep>(1);

  // =========================================================================
  // STEP 1: TRIP BASICS
  // =========================================================================
  const [tripName, setTripName] = useState('Munnar Weekend Escape');
  const [destination, setDestination] = useState('Munnar, Kerala');
  const [departureCity, setDepartureCity] = useState('Bengaluru');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripType, setTripType] = useState<'public' | 'private'>('public');

  // =========================================================================
  // STEP 2: TRAVEL PREFERENCES
  // =========================================================================
  const [budgetRange, setBudgetRange] = useState('₹5,000 – ₹10,000');
  const [groupSize, setGroupSize] = useState('3');
  const [maxGroupSize, setMaxGroupSize] = useState('6');
  const [travelStyle, setTravelStyle] = useState('Solo');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Adventure',
    'Nature',
    'Mountains',
    'Photography',
  ]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    'Hindi',
    'English',
  ]);
  const [otherLanguages, setOtherLanguages] = useState('');

  // =========================================================================
  // STEP 3: FINAL DETAILS
  // =========================================================================
  const [description, setDescription] = useState(
    'Escape to the misty hills of Munnar! This trip is perfect for nature lovers, with scenic views, tea gardens, waterfalls and local food. We will explore the best spots, enjoy some great trekking, and capture amazing memories together.'
  );
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
  ]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([
    {
      day: 1,
      title: 'Arrival & Tea Plantations',
      desc: 'Meet in Munnar, check into the eco-homestay, and enjoy a sunset walk through Lockhart tea hills.',
    },
    {
      day: 2,
      title: 'Waterfall Trek & Spice Trail',
      desc: 'Trek to Attukad waterfalls, visit organic spice gardens, and try traditional Kerala dinner.',
    },
    {
      day: 3,
      title: 'Sunrise Viewpoint & Departure',
      desc: 'Early morning sunrise view from Top Station, tea tasting session, and trip wrap-up.',
    },
  ]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  // Validation errors
  const [errors, setErrors] = useState<{
    tripName?: string;
    destination?: string;
    departureCity?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const calculateDurationDays = (start: string, end: string): number => {
    if (!start || !end) return 3;
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 3;
    }
  };

  const validateStep1 = () => {
    const errs: typeof errors = {};
    if (!tripName.trim()) errs.tripName = 'Trip Name is required';
    if (!destination.trim()) errs.destination = 'Destination is required';
    if (!departureCity.trim()) errs.departureCity = 'Departure City is required';
    if (!startDate) errs.startDate = 'From date is required';
    if (!endDate) errs.endDate = 'To date is required';
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errs.endDate = 'To date cannot be earlier than From date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;
    setCurrentStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(3);
  };

  // Toggle interest pill
  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  // Toggle language pill
  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  // Add Day to itinerary
  const handleAddDay = () => {
    const nextDay = itinerary.length + 1;
    setItinerary([
      ...itinerary,
      {
        day: nextDay,
        title: `Day ${nextDay} Activity`,
        desc: 'Describe planned trails, visits or activities.',
      },
    ]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPhotoMock = () => {
    const sampleImages = [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
    ];
    const pick = sampleImages[photos.length % sampleImages.length];
    setPhotos([...photos, pick]);
    success('Photo added to trip gallery!', 'Photo Uploaded');
  };

  const handlePublishTrip = () => {
    const durDays = calculateDurationDays(startDate, endDate);
    const startFormatted = formatDisplayDate(startDate) || '12 Dec 2025';
    const endFormatted = formatDisplayDate(endDate) || '14 Dec 2025';
    const finalLanguages = [
      ...selectedLanguages.filter((l) => l !== 'Others'),
      ...(selectedLanguages.includes('Others') && otherLanguages.trim()
        ? otherLanguages.split(',').map((s) => s.trim()).filter(Boolean)
        : selectedLanguages.includes('Others') ? ['Others'] : []),
    ];

    const created = createTrip({
      name: tripName,
      destination,
      startCity: departureCity,
      startDate: startFormatted,
      endDate: endFormatted,
      durationDays: durDays,
      budgetPerPerson: 5000,
      tripType: 'group',
      roomType: visibility,
      travelStyle,
      languages: finalLanguages,
      preferences: selectedInterests.length > 0 ? selectedInterests : ['Nature', 'Trekking'],
      description: description.trim() || 'A scenic exploration journey.',
      highlights: ['Tea Gardens', 'Waterfalls', 'Local Food', 'Trekking'],
      inclusions: ['Transport', 'Accommodation', 'Meals (breakfast + dinner)'],
      rules: ['Be respectful', 'No alcohol', 'Keep the group active'],
      maxMembers: parseInt(maxGroupSize, 10) || 6,
      difficulty: 'medium',
      coverImageUrl: photos[0] || 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
      galleryImages: photos,
      itinerary,
    });

    try {
      confetti({
        particleCount: 90,
        spread: 65,
        origin: { y: 0.55 },
      });
    } catch (e) {}

    success(`"${tripName}" published successfully!`, 'Trip Published 🎉');
    navigate(`/app/trips/${created.id}`);
  };

  const handleSaveDraft = () => {
    const durDays = calculateDurationDays(startDate, endDate);
    const startFormatted = formatDisplayDate(startDate) || '12 Dec 2025';
    const endFormatted = formatDisplayDate(endDate) || '14 Dec 2025';
    const finalLanguages = [
      ...selectedLanguages.filter((l) => l !== 'Others'),
      ...(selectedLanguages.includes('Others') && otherLanguages.trim()
        ? otherLanguages.split(',').map((s) => s.trim()).filter(Boolean)
        : selectedLanguages.includes('Others') ? ['Others'] : []),
    ];

    createTrip({
      name: tripName || 'Draft: Munnar Escape',
      destination: destination || 'Munnar, Kerala',
      startCity: departureCity || 'Bengaluru',
      startDate: startFormatted,
      endDate: endFormatted,
      durationDays: durDays,
      budgetPerPerson: 5000,
      tripType: 'group',
      roomType: 'private',
      status: 'draft',
      languages: finalLanguages,
      preferences: selectedInterests,
      description,
      highlights: ['Tea Gardens', 'Local Food'],
      maxMembers: 6,
      difficulty: 'easy',
      coverImageUrl: photos[0] || 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
    });
    success('Trip draft saved in your private vault.', 'Draft Saved');
    navigate('/app/trips');
  };

  const INTEREST_OPTIONS = [
    { label: 'Adventure', icon: Compass },
    { label: 'Nature', icon: Trees },
    { label: 'Culture', icon: Landmark },
    { label: 'Food', icon: Utensils },
    { label: 'Beaches', icon: Waves },
    { label: 'Mountains', icon: Mountain },
    { label: 'Cities', icon: Building2 },
    { label: 'Photography', icon: Camera },
  ];

  const STYLE_OPTIONS = [
    { label: 'Solo', icon: UserIcon },
    { label: 'Group', icon: Users },
    { label: 'Couple', icon: Heart },
    { label: 'Family', icon: Home },
  ];

  const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Tamil', 'Others'];

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8 text-left">
      {/* ========================================================================= */}
      {/* PAGE HERO HEADER (Matching Screen 1, 2, 3) */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl border border-gray-200/90 bg-white p-6 sm:p-8 mb-6 sm:mb-8 shadow-xs overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Text */}
        <div className="flex-1 text-left z-10">
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
            Create a Trip
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed max-w-md">
            {currentStep === 1 &&
              'Plan your next adventure and find travel buddies who share your vibe.'}
            {currentStep === 2 &&
              'Set your travel preferences so the right people can join.'}
            {currentStep === 3 &&
              'Add more details to make your trip more interesting.'}
          </p>
        </div>

        {/* Right Panoramic Scenic Image Thumbnail */}
        <div className="w-full md:w-56 h-28 sm:h-32 rounded-2xl overflow-hidden shrink-0 shadow-xs relative border border-gray-100">
          <img
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
            alt="Scenic mountain journey"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEPPER ROW (Matching Screen 1, 2, 3) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between mb-8 sm:mb-10 px-2">
        {/* Step 1 */}
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            currentStep === 1
              ? 'bg-primary text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              currentStep === 1
                ? 'bg-white/20 text-white'
                : currentStep > 1
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {currentStep > 1 ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
          </span>
          <span>Trip Basics</span>
        </button>

        <div className="flex-1 h-0.5 mx-2 sm:mx-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              currentStep > 1 ? 'bg-primary w-full' : 'w-0'
            }`}
          />
        </div>

        {/* Step 2 */}
        <button
          type="button"
          onClick={() => {
            if (validateStep1()) setCurrentStep(2);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            currentStep === 2
              ? 'bg-primary text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              currentStep === 2
                ? 'bg-white/20 text-white'
                : currentStep > 2
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {currentStep > 2 ? <Check className="w-3 h-3 stroke-[3]" /> : '2'}
          </span>
          <span>Preferences</span>
        </button>

        <div className="flex-1 h-0.5 mx-2 sm:mx-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              currentStep > 2 ? 'bg-primary w-full' : 'w-0'
            }`}
          />
        </div>

        {/* Step 3 */}
        <button
          type="button"
          onClick={() => {
            if (validateStep1()) setCurrentStep(3);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            currentStep === 3
              ? 'bg-primary text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              currentStep === 3 ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            3
          </span>
          <span>Final Details</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* FORM CARD CONTAINER */}
      {/* ========================================================================= */}
      <div className="w-full bg-white rounded-3xl border border-gray-200/90 shadow-card p-6 sm:p-10 transition-all duration-300">
        {/* ========================================================================= */}
        {/* SCREEN 1: STEP 1: TRIP BASICS */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
                Trip Basics
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Tell us the essential details about your trip.
              </p>
            </div>

            {/* Trip Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Trip Name <span className="text-emerald-600">*</span>
              </label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => {
                  setTripName(e.target.value);
                  if (errors.tripName) setErrors((prev) => ({ ...prev, tripName: undefined }));
                }}
                placeholder="e.g. Munnar Weekend Escape"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                  errors.tripName
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                }`}
              />
              {errors.tripName && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{errors.tripName}</p>
              )}
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Destination <span className="text-emerald-600">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    if (errors.destination)
                      setErrors((prev) => ({ ...prev, destination: undefined }));
                  }}
                  placeholder="Where are you going?"
                  className={`w-full px-4 pr-11 py-3 rounded-xl border text-sm outline-none transition-all ${
                    errors.destination
                      ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute right-3.5 pointer-events-none" />
              </div>
              {errors.destination && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{errors.destination}</p>
              )}
            </div>

            {/* Departure City & Travel Dates (From and To separate) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Departure City <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  value={departureCity}
                  onChange={(e) => {
                    setDepartureCity(e.target.value);
                    if (errors.departureCity)
                      setErrors((prev) => ({ ...prev, departureCity: undefined }));
                  }}
                  placeholder="e.g. Bengaluru"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                    errors.departureCity
                      ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
                {errors.departureCity && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {errors.departureCity}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  From Date <span className="text-emerald-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (errors.startDate)
                        setErrors((prev) => ({ ...prev, startDate: undefined }));
                      if (endDate && e.target.value && endDate < e.target.value) {
                        setEndDate(e.target.value);
                      }
                    }}
                    onClick={(e) => (e.target as any).showPicker?.()}
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 bg-white outline-none transition-all cursor-pointer ${
                      errors.startDate
                        ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                </div>
                {errors.startDate && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  To Date <span className="text-emerald-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    min={startDate || undefined}
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (errors.endDate)
                        setErrors((prev) => ({ ...prev, endDate: undefined }));
                    }}
                    onClick={(e) => (e.target as any).showPicker?.()}
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 bg-white outline-none transition-all cursor-pointer ${
                      errors.endDate
                        ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                </div>
                {errors.endDate && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>

            {startDate && endDate && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-800 font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Trip Duration: <strong className="font-semibold">{calculateDurationDays(startDate, endDate)} days</strong> ({formatDisplayDate(startDate)} → {formatDisplayDate(endDate)})
                </span>
              </div>
            )}

            {/* Trip Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Trip Type <span className="text-emerald-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Public Trip Card */}
                <button
                  type="button"
                  onClick={() => setTripType('public')}
                  className={`relative flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                    tripType === 'public'
                      ? 'border-primary bg-emerald-50/40 ring-1 ring-primary/40 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tripType === 'public' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pr-6">
                    <h4 className="font-heading font-bold text-sm sm:text-base text-gray-900">
                      Public Trip
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Anyone can discover and request to join.
                    </p>
                  </div>
                  {tripType === 'public' && (
                    <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Private Trip Card */}
                <button
                  type="button"
                  onClick={() => setTripType('private')}
                  className={`relative flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                    tripType === 'private'
                      ? 'border-primary bg-emerald-50/40 ring-1 ring-primary/40 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tripType === 'private' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pr-6">
                    <h4 className="font-heading font-bold text-sm sm:text-base text-gray-900">
                      Private Trip
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Only invited people can join the trip.
                    </p>
                  </div>
                  {tripType === 'private' && (
                    <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/app/trips')}
                className="text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: STEP 2: TRAVEL PREFERENCES */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Next} className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
                Travel Preferences
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Customize who should join and group compatibility factors.
              </p>
            </div>

            {/* Budget (per person) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Budget (per person)
              </label>
              <div className="relative">
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                >
                  <option value="₹5,000 – ₹10,000">₹5,000 – ₹10,000</option>
                  <option value="< ₹5,000">&lt; ₹5,000</option>
                  <option value="₹10,000 – ₹20,000">₹10,000 – ₹20,000</option>
                  <option value="₹20,000+">₹20,000+</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Group Size & Max */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Group Size
                </label>
                <div className="relative">
                  <select
                    value={groupSize}
                    onChange={(e) => setGroupSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    {[2, 3, 4, 5, 6, 8].map((n) => (
                      <option key={n} value={n.toString()}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Max
                </label>
                <div className="relative">
                  <select
                    value={maxGroupSize}
                    onChange={(e) => setMaxGroupSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    {[4, 5, 6, 8, 10, 12, 16].map((n) => (
                      <option key={n} value={n.toString()}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Travel Style */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2.5">
                Travel Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {STYLE_OPTIONS.map((style) => {
                  const Icon = style.icon;
                  const isSelected = travelStyle === style.label;
                  return (
                    <button
                      key={style.label}
                      type="button"
                      onClick={() => setTravelStyle(style.label)}
                      className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-emerald-50/80 text-primary ring-1 ring-primary/30 shadow-2xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{style.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interests (you can select multiple) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2.5">
                Interests <span className="text-gray-400 font-normal">(you can select multiple)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {INTEREST_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedInterests.includes(item.label);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => toggleInterest(item.label)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary text-white shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Languages (you can select multiple) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2.5">
                Languages <span className="text-gray-400 font-normal">(you can select multiple)</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary text-white shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {lang === 'Others' ? <Sparkles className="w-3.5 h-3.5" /> : null}
                      <span>{lang}</span>
                    </button>
                  );
                })}
              </div>

              {/* Conditional Input when "Others" is selected */}
              {selectedLanguages.includes('Others') && (
                <div className="mt-3.5 max-w-lg animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Specify Other Language(s)
                  </label>
                  <input
                    type="text"
                    value={otherLanguages}
                    onChange={(e) => setOtherLanguages(e.target.value)}
                    placeholder="e.g. Malayalam, Kannada, French, Spanish..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Enter any other languages separated by commas.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: STEP 3: FINAL DETAILS */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
                Final Details
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Add descriptions, photos, and itinerary highlights before publishing.
              </p>
            </div>

            {/* Trip Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">Trip Description</label>
                <span className="text-[11px] text-gray-400">{description.length}/1000</span>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                placeholder="Tell travellers about your trip, what to expect, and why they should join."
                className="w-full p-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
              />
            </div>

            {/* Add Photos */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Add Photos</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Upload box */}
                <button
                  type="button"
                  onClick={handleAddPhotoMock}
                  className="h-28 sm:h-32 border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-emerald-50/20 rounded-2xl flex flex-col items-center justify-center p-3 text-center transition-colors cursor-pointer group"
                >
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors mb-1.5" />
                  <span className="text-[11px] text-gray-500 group-hover:text-gray-700 leading-tight">
                    Click to upload photos or drag and drop
                  </span>
                </button>

                {/* Thumbnails with delete button */}
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative h-28 sm:h-32 rounded-2xl overflow-hidden border border-gray-200 group shadow-2xs"
                  >
                    <img
                      src={url}
                      alt={`Trip photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add more button */}
                <button
                  type="button"
                  onClick={handleAddPhotoMock}
                  className="h-28 sm:h-32 border border-gray-200 hover:border-primary/50 hover:bg-emerald-50/20 rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary transition-colors cursor-pointer"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Itinerary (optional) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-700">
                  Itinerary <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddDay}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Day</span>
                </button>
              </div>

              <div className="space-y-3">
                {itinerary.map((item, idx) => (
                  <div
                    key={item.day}
                    className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/60 text-left space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">Day {item.day}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setItinerary(itinerary.filter((_, i) => i !== idx))
                        }
                        className="text-[11px] text-gray-400 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const copy = [...itinerary];
                        copy[idx].title = e.target.value;
                        setItinerary(copy);
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={item.desc}
                      onChange={(e) => {
                        const copy = [...itinerary];
                        copy[idx].desc = e.target.value;
                        setItinerary(copy);
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Visibility</label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="tripVisibility"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="mt-0.5 text-primary accent-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 block">
                      Public
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Anyone can discover and join your trip.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="tripVisibility"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    className="mt-0.5 text-primary accent-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 block">
                      Private
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Only invited people can join.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={handlePublishTrip}
                  className="px-7 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                >
                  Publish Trip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
