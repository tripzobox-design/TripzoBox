import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Wallet, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrips } from '../context/TripsContext';
import { useToast } from '../context/ToastContext';
import { Stepper } from '../components/ui/Stepper';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Chip } from '../components/ui/Badge';

export const CreateTripPage: React.FC = () => {
  const navigate = useNavigate();
  const { createTrip } = useTrips();
  const { success } = useToast();

  const [currentStep, setCurrentStep] = useState(1);

  // Space & Room Type
  const [roomType, setRoomType] = useState<'public' | 'private'>('public');

  // Step 1: Trip Details State
  const [tripName, setTripName] = useState('Munnar Adventure');
  const [destination, setDestination] = useState('Munnar, Kerala');
  const [startCity, setStartCity] = useState('Kochi');
  const [startDate, setStartDate] = useState('12 May 2025');
  const [endDate, setEndDate] = useState('18 May 2025');
  const [budgetPerPerson, setBudgetPerPerson] = useState(6000);
  const [tripType, setTripType] = useState<'solo' | 'group' | 'couple'>('group');
  const [preferences, setPreferences] = useState<string[]>(['Hiking', 'Nature', 'Food', 'Photography']);

  // Step 2: Preferences & Group Settings
  const [maxMembers, setMaxMembers] = useState(8);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [description, setDescription] = useState(
    'A short and peaceful trip to Munnar, with beautiful hills, tea gardens, and local food. Perfect for nature lovers and first-time travellers looking for gentle misty morning hikes and quiet mountain tea sampling.'
  );
  const [highlights, setHighlights] = useState<string[]>([
    'Tea Gardens',
    'Waterfalls',
    'Local Food',
    'Photography',
  ]);
  const [customHighlight, setCustomHighlight] = useState('');

  // Validation
  const [errors, setErrors] = useState<{ tripName?: string; destination?: string; startDate?: string }>({});

  const availablePreferences = ['Hiking', 'Nature', 'Food', 'Photography', 'Culture', 'Beaches', 'Roadtrip', 'Camping'];

  const togglePreference = (pref: string) => {
    setPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleStep1Next = () => {
    const newErrors: { tripName?: string; destination?: string } = {};
    if (!tripName.trim()) newErrors.tripName = 'Trip name is required';
    if (!destination.trim()) newErrors.destination = 'Destination is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setCurrentStep(2);
  };

  const handlePublish = () => {
    const newTrip = createTrip({
      name: tripName,
      destination,
      startCity: startCity || 'Kochi',
      startDate,
      endDate,
      durationDays: 6,
      budgetPerPerson,
      tripType,
      roomType,
      preferences,
      description,
      highlights,
      maxMembers,
      difficulty,
      coverImageUrl:
        destination.toLowerCase().includes('varkala')
          ? 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=1200&q=80'
          : destination.toLowerCase().includes('goa')
          ? 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
    });

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    success(`"${tripName}" is now open for join requests!`, 'Trip Published 🎉');
    navigate(`/app/trips/${newTrip.id}`);
  };

  const steps = [
    { id: 1, label: 'Trip Details' },
    { id: 2, label: 'Preferences' },
    { id: 3, label: 'Review' },
  ];

  return (
    <div className="flex flex-col gap-6 text-left max-w-3xl mx-auto">
      {/* 1. HEADER (Matching Screen 6) */}
      <div>
        <Link
          to="/app/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Trips</span>
        </Link>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-text">
          Create a Trip
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Plan your perfect journey or find like-minded travellers.
        </p>
      </div>

      {/* 2. STEPPER */}
      <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-subtle">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => setCurrentStep(step)}
        />
      </div>

      {/* 3. STEP FORM CONTENT */}
      <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card">
        {/* STEP 1: TRIP DETAILS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Trip Leader Info Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-primary/10 border border-primary/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  👑
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-text">
                    You are the Trip Leader
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    As creator, you host this room, guide the itinerary, and approve member requests.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary bg-white px-3 py-1 rounded-full border border-primary/30 shadow-xs shrink-0">
                Host / Leader
              </span>
            </div>

            {/* Room Space Visibility */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text tracking-wide block">
                Room Space Visibility *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRoomType('public')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    roomType === 'public'
                      ? 'bg-primary/10 text-primary border-primary shadow-xs ring-1 ring-primary/30'
                      : 'bg-white hover:bg-light-bg text-text border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 font-heading font-bold text-sm">
                    <span className="text-base">🌐</span>
                    <span>Public Space</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white ml-auto">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-1 leading-snug">
                    Published in the Tripzobox directory so travellers can discover your trip and request to join.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRoomType('private')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    roomType === 'private'
                      ? 'bg-primary/10 text-primary border-primary shadow-xs ring-1 ring-primary/30'
                      : 'bg-white hover:bg-light-bg text-text border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 font-heading font-bold text-sm">
                    <span className="text-base">🔒</span>
                    <span>Private Room</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1 leading-snug">
                    Hidden from public listings. Only people you invite with your unique Room Code can join.
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Trip Name *"
                placeholder="e.g. Munnar Adventure"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                error={errors.tripName}
              />
              <Input
                label="Destination *"
                placeholder="e.g. Munnar, Kerala"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                error={errors.destination}
                leftIcon={<MapPin className="w-4 h-4 text-primary" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                placeholder="12 May 2025"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                leftIcon={<Calendar className="w-4 h-4 text-text-subtle" />}
              />
              <Input
                label="End Date"
                placeholder="18 May 2025"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                leftIcon={<Calendar className="w-4 h-4 text-text-subtle" />}
              />
            </div>

            {/* Budget Per Person Range Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                <span className="text-text">Budget (per person)</span>
                <span className="text-primary font-bold">
                  ₹{budgetPerPerson.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={budgetPerPerson}
                onChange={(e) => setBudgetPerPerson(parseInt(e.target.value, 10))}
                className="w-full accent-primary h-2 bg-gray-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-text-muted">
                <span>₹1,000</span>
                <span>₹10,000</span>
                <span>₹25,000+</span>
              </div>
            </div>

            {/* Trip Type Segmented Control */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text tracking-wide block">
                Trip Type *
              </label>
              <div className="grid grid-cols-3 gap-2 bg-light-bg p-1.5 rounded-xl border border-border">
                {(['solo', 'group', 'couple'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTripType(type)}
                    className={`py-2 text-xs sm:text-sm font-semibold rounded-lg capitalize transition-all ${
                      tripType === type
                        ? 'bg-primary text-white shadow-subtle'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Preferences Chips */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-text tracking-wide block">
                Add Preferences (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {availablePreferences.map((pref) => (
                  <Chip
                    key={pref}
                    selected={preferences.includes(pref)}
                    onToggle={() => togglePreference(pref)}
                  >
                    {pref}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Step 1 CTA */}
            <div className="pt-4 border-t border-border">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStep1Next}
                className="w-full font-semibold"
              >
                Next: Add Preferences →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: PREFERENCES & ITINERARY */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text tracking-wide block mb-1.5">
                  Max Group Size
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(parseInt(e.target.value, 10) || 6)}
                    className="w-full bg-white text-text text-sm rounded-xl border border-border px-4 py-3 outline-none focus:border-primary"
                  />
                  <span className="text-xs text-text-muted whitespace-nowrap">travellers</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text tracking-wide block mb-1.5">
                  Trip Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2 bg-light-bg p-1 rounded-xl border border-border">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                        difficulty === diff
                          ? 'bg-primary text-white shadow-subtle'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Textarea
              label="Trip Description & Vibe *"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your plan, pace, who you are looking to travel with..."
            />

            {/* Highlights Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text tracking-wide block">
                Trip Highlights
              </label>
              <div className="flex flex-wrap gap-2">
                {highlights.map((h, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs bg-accent/40 text-primary-dark font-semibold px-3 py-1.5 rounded-full border border-accent"
                  >
                    {h}
                    <button
                      type="button"
                      onClick={() => setHighlights(highlights.filter((_, i) => i !== idx))}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={customHighlight}
                  onChange={(e) => setCustomHighlight(e.target.value)}
                  placeholder="Add custom highlight (e.g. Sunrise Yoga)"
                  className="flex-1 bg-white text-xs rounded-xl border border-border px-3.5 py-2.5 outline-none focus:border-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customHighlight.trim()) {
                      e.preventDefault();
                      setHighlights([...highlights, customHighlight.trim()]);
                      setCustomHighlight('');
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    if (customHighlight.trim()) {
                      setHighlights([...highlights, customHighlight.trim()]);
                      setCustomHighlight('');
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
              <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                ← Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setCurrentStep(3)}
                className="font-semibold"
              >
                Next: Review Trip →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & PUBLISH */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-light-bg rounded-2xl p-5 border border-border space-y-4 text-xs sm:text-sm">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                    {tripType} Trip
                  </span>
                  <h3 className="font-heading font-bold text-xl text-text mt-0.5">
                    {tripName}
                  </h3>
                  <p className="text-text-muted mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {destination}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-text-muted block">Budget</span>
                  <span className="font-bold text-lg text-primary">
                    ₹{budgetPerPerson.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-text-muted block text-[11px]">Dates</span>
                  <span className="font-semibold text-text">{startDate} – {endDate}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Max Members</span>
                  <span className="font-semibold text-text">{maxMembers} travellers</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Difficulty</span>
                  <span className="font-semibold text-text capitalize">{difficulty}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-text-muted block text-[11px] mb-1">Description</span>
                <p className="text-text leading-relaxed">{description}</p>
              </div>

              <div className="pt-2">
                <span className="text-text-muted block text-[11px] mb-1.5">Highlights</span>
                <div className="flex flex-wrap gap-1.5">
                  {highlights.map((h, i) => (
                    <span key={i} className="bg-white border border-border px-2.5 py-1 rounded-md text-text">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
              <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                ← Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handlePublish}
                icon={<Sparkles className="w-4 h-4" />}
                className="font-semibold shadow-hover"
              >
                Publish Trip
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
