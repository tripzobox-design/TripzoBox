import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Compass,
  Share2,
  Check,
  Sparkles,
  Mountain,
  Palmtree,
  Utensils,
  Camera,
  Car,
  Heart,
  Tent,
  Waves,
  Flame,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Clock,
  Wallet,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export interface AuthPageProps {
  initialMode?: 'signup' | 'login';
}

const AVAILABLE_INTERESTS = [
  { id: 'Hiking', label: 'Mountain Treks', icon: Mountain },
  { id: 'Beaches', label: 'Beaches & Coastal', icon: Palmtree },
  { id: 'Culture', label: 'Culture & Heritage', icon: Compass },
  { id: 'Food', label: 'Food & Culinary', icon: Utensils },
  { id: 'Nature', label: 'Nature & Wildlife', icon: Sparkles },
  { id: 'Backpacking', label: 'Backpacking & Hostels', icon: Users },
  { id: 'Photography', label: 'Photography & Scenic', icon: Camera },
  { id: 'Road Trips', label: 'Road Trips & Drives', icon: Car },
  { id: 'Wellness', label: 'Wellness & Yoga', icon: Heart },
  { id: 'Camping', label: 'Camping & Stargazing', icon: Tent },
  { id: 'Backwaters', label: 'Backwaters & Lakes', icon: Waves },
  { id: 'Adventure', label: 'Adventure Sports', icon: Flame },
];

const PACE_OPTIONS = [
  {
    value: 'Relaxed',
    label: 'Relaxed & Slow',
    emoji: '☕',
    desc: 'Leisurely cafes, gentle walks, zero rush',
  },
  {
    value: 'Balanced',
    label: 'Balanced',
    emoji: '⚖️',
    desc: 'Sightseeing mixed with downtime & relaxation',
  },
  {
    value: 'Action-packed',
    label: 'Action-Packed',
    emoji: '⚡',
    desc: 'Sunrise-to-sunset treks, sports & full schedules',
  },
];

const GROUP_OPTIONS = [
  {
    value: 'Solo explorer',
    label: 'Solo Explorer',
    emoji: '🧭',
    desc: 'Flexible, loves meeting locals & solo freedom',
  },
  {
    value: 'Small group (3–6)',
    label: 'Small Squad (3–6)',
    emoji: '👥',
    desc: 'Close-knit intimate group chemistry',
  },
  {
    value: 'Lively gang (7+)',
    label: 'Lively Gang (7+)',
    emoji: '🎒',
    desc: 'High energy, vibrant group parties & road trips',
  },
];

const BUDGET_OPTIONS: { value: 'budget' | 'mid-range' | 'comfort'; label: string; range: string; desc: string }[] = [
  {
    value: 'budget',
    label: 'Budget Backpacker',
    range: '< ₹5,000 / trip',
    desc: 'Hostels, homestays, public transit & street food',
  },
  {
    value: 'mid-range',
    label: 'Comfort & Value',
    range: '₹5,000 – ₹15,000',
    desc: 'Boutique stays, private cabs & curated cafes',
  },
  {
    value: 'comfort',
    label: 'Premium Explorer',
    range: '₹15,000+ / trip',
    desc: 'Luxury resorts, guided experiences & all comforts',
  },
];

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, user, updateProfile } = useAuth();
  const { success } = useToast();

  const isLoginRoute = location.pathname === '/login' || initialMode === 'login';
  const [mode, setMode] = useState<'signup' | 'login'>(isLoginRoute ? 'login' : 'signup');
  const [authStep, setAuthStep] = useState<'credentials' | 'preferences'>('credentials');
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [authStep]);

  // Form State
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<NonNullable<typeof user.gender>>('prefer-not-to-say');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Preferences Questionnaire State
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Hiking',
    'Nature',
    'Photography',
  ]);
  const [travelPace, setTravelPace] = useState<'Relaxed' | 'Balanced' | 'Action-packed'>('Balanced');
  const [preferredGroupSize, setPreferredGroupSize] = useState<string>('Small group (3–6)');
  const [budgetStyle, setBudgetStyle] = useState<'budget' | 'mid-range' | 'comfort'>('mid-range');
  const [homeCity, setHomeCity] = useState('');
  const [dreamDestination, setDreamDestination] = useState('');
  const [bio, setBio] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<{
    fullName?: string;
    emailOrPhone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      fullName?: string;
      emailOrPhone?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (mode === 'signup' && !fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email or phone number is required';
    } else if (
      emailOrPhone.includes('@') &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone.trim())
    ) {
      newErrors.emailOrPhone = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Confirm Password is required';
      } else if (confirmPassword !== password) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const getRedirectTarget = () => {
    if (location.state?.from?.pathname) {
      return `${location.state.from.pathname}${location.state.from.search || ''}`;
    }
    if (redirectParam && redirectParam.startsWith('/')) {
      return redirectParam;
    }
    return '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    setTimeout(async () => {
      if (mode === 'signup') {
        await signup(fullName, emailOrPhone, password);
        updateProfile({ gender });
        setIsLoading(false);
        setAuthStep('preferences');
      } else {
        await login(emailOrPhone, password);
        success('Welcome back to Tripzobox!', 'Logged In');
        const redirectTarget = getRedirectTarget();
        setIsLoading(false);
        navigate(redirectTarget);
      }
    }, 450);
  };

  const handleCompletePreferences = () => {
    setIsLoading(true);
    setTimeout(() => {
      updateProfile({
        travelInterests: selectedInterests.length > 0 ? selectedInterests : ['Nature', 'Culture'],
        budgetStyle,
        travelPace,
        preferredGroupSize,
        city: homeCity.trim() || 'Kochi',
        dreamDestination: dreamDestination.trim() || undefined,
        bio: bio.trim() || `Travel enthusiast based in ${homeCity.trim() || 'Kochi'}. Ready to unbox new trails and connect with fellow explorers!`,
      });
      success(`Welcome to Tripzobox, ${fullName || user.name || 'explorer'}! Your preferences have been set.`, 'Profile Ready');
      setIsLoading(false);
      const redirectTarget = getRedirectTarget();
      navigate(redirectTarget);
    }, 500);
  };

  const handleSkipPreferences = () => {
    updateProfile({
      city: homeCity.trim() || 'Kochi',
      travelInterests: selectedInterests.length > 0 ? selectedInterests : ['Nature', 'Culture'],
    });
    success(`Welcome to Tripzobox! You can update your trip preferences anytime in Profile.`, 'Welcome');
    const redirectTarget = getRedirectTarget();
    navigate(redirectTarget);
  };

  // Continuous brand pane rotating images, headlines, bullets, and quotes
  const authSlides = [
    {
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85',
      headlines: ['New places.', 'Real people.', 'Better journeys.'],
      subtitle: 'Join our community of travellers and start your next adventure.',
      bullets: [
        { icon: Shield, text: 'Secure your travel information' },
        { icon: Users, text: 'Connect with genuine travellers' },
        { icon: Compass, text: 'Discover amazing destinations' },
        { icon: Share2, text: 'Share your journey' },
      ],
      quote: '"Go Somewhere. Meet Someone."',
      author: 'Tripzobox Philosophy',
      location: 'Alpine Horizon',
    },
    {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85',
      headlines: ['Unbox trails.', 'Find your tribe.', 'Make memories.'],
      subtitle: 'Hike misty ridges and discover hidden trails with verified companions.',
      bullets: [
        { icon: Compass, text: 'Handpicked mountain & valley routes' },
        { icon: Users, text: 'Small, verified travel groups' },
        { icon: Shield, text: 'Emergency contacts & offline access' },
        { icon: Share2, text: 'Capture shared memories together' },
      ],
      quote: '"Travel isn’t about the miles. It’s about the memories."',
      author: 'Authentic Journeys',
      location: 'Yosemite Valley',
    },
    {
      url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=85',
      headlines: ['Travel bold.', 'Stay safe.', 'Wander free.'],
      subtitle: 'Your private travel vault keeps your identity and documents protected.',
      bullets: [
        { icon: Shield, text: 'Zero-hassle encrypted document vault' },
        { icon: Users, text: 'Host-vetted group itineraries' },
        { icon: Compass, text: 'Real-time member discussions' },
        { icon: Share2, text: 'Community-approved travel tips' },
      ],
      quote: '"Not all those who wander are lost."',
      author: 'J.R.R. Tolkien',
      location: 'Dolomite Summits',
    },
    {
      url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1600&q=85',
      headlines: ['Live stories.', 'Inspire others.', 'See the world.'],
      subtitle: 'Record intimate travel moments and publish authentic guides for the world.',
      bullets: [
        { icon: Share2, text: 'Publish rich photo travelogues' },
        { icon: Compass, text: 'Unfiltered destination guides' },
        { icon: Users, text: 'Follow inspiring travel creators' },
        { icon: Shield, text: 'Keep personal logs safe & private' },
      ],
      quote: '"Life is short and the world is wide."',
      author: 'Wanderlust Spirit',
      location: 'Misty Highlands',
    },
    {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
      headlines: ['Seek wonder.', 'Cross borders.', 'Find yourself.'],
      subtitle: 'Step outside the ordinary and experience extraordinary adventures.',
      bullets: [
        { icon: Users, text: 'Compatible pace & budget matching' },
        { icon: Compass, text: 'Offbeat destinations & stays' },
        { icon: Shield, text: 'Verified traveller identities' },
        { icon: Share2, text: 'Lifelong friendships forged on trails' },
      ],
      quote: '"Traveling leaves you speechless, then turns you into a storyteller."',
      author: 'Ibn Battuta',
      location: 'Ocean Horizons',
    },
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-advance auth brand pane every 3.2 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % authSlides.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [authSlides.length]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* LEFT COLUMN: Visual Brand Pane (Matching Screen 2, with dynamic rotating images & quotes) */}
      <div className="relative lg:w-1/2 lg:min-h-screen flex flex-col justify-between p-5 sm:p-6 lg:p-12 text-white overflow-hidden bg-text">
        {/* Full-bleed background images with continuous crossfade */}
        <div className="absolute inset-0 z-0">
          {authSlides.map((slide, index) => (
            <div
              key={slide.url}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === activeSlide ? 'opacity-100 z-1' : 'opacity-0 z-0 pointer-events-none'
                }`}
            >
              <img
                src={slide.url}
                alt={slide.location}
                className="w-full h-full object-cover transform scale-105 transition-transform duration-8000 ease-out"
              />
            </div>
          ))}
          <div className="absolute inset-0 z-2 bg-gradient-to-t from-black/90 via-black/55 to-black/60" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center">
          <Logo asLink to="/" size="md" variant="horizontal" inverted />
        </div>

        {/* Center / Bottom Feature Highlights (Dynamically changing with each slide) */}
        <div className="relative z-10 lg:my-auto pt-4 lg:py-8 text-left">
          <div
            key={activeSlide}
            className="transition-all duration-500 ease-out animate-in fade-in"
          >
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl lg:text-4xl text-white leading-tight max-w-xl lg:max-w-md">
              {authSlides[activeSlide].headlines.map((line, idx) => (
                <span key={idx} className="inline lg:block">
                  {line}{' '}
                </span>
              ))}
            </h2>
            <p className="text-xs sm:text-sm text-gray-200 mt-2 lg:mt-3 max-w-xl lg:max-w-sm leading-relaxed">
              {authSlides[activeSlide].subtitle}
            </p>

            {/* 4 Feature Bullets with Icons */}
            <div className="hidden lg:block mt-8 space-y-4 max-w-sm">
              {authSlides[activeSlide].bullets.map((bullet, idx) => {
                const IconComponent = bullet.icon;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                      <IconComponent className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-white">
                      {bullet.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Rotating Quote */}
        <div className="hidden lg:flex relative z-10 pt-4 border-t border-white/15 items-center justify-between text-left">
          <div className="min-h-[44px] flex flex-col justify-center">
            <p className="text-xs sm:text-sm font-medium text-white italic tracking-wide transition-all duration-300">
              {authSlides[activeSlide].quote}
            </p>
            <span className="text-[11px] text-accent font-medium mt-0.5">
              — {authSlides[activeSlide].author}
            </span>
          </div>

          {/* Subtle slide dots */}
          <div className="flex items-center gap-1.5 shrink-0 pl-3">
            {authSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to quote ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${idx === activeSlide
                  ? 'w-5 h-1.5 bg-accent shadow-sm'
                  : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Form Panel / Preferences Questionnaire Panel */}
      <div
        ref={panelRef}
        className={`lg:w-1/2 flex justify-center p-4 sm:p-8 lg:p-12 lg:overflow-y-auto lg:max-h-screen ${authStep === 'preferences' ? 'items-start' : 'items-center'
          }`}
      >
        {authStep === 'preferences' ? (
          <div className="w-full max-w-xl flex flex-col text-left py-2 sm:py-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Step Progress Header */}
            <div className="mb-5 sm:mb-6">
              <div className="flex items-center justify-between text-xs text-text-muted mb-2 font-medium">
                <span className="flex items-center gap-2 text-primary font-bold">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-xs">
                    2
                  </span>
                  <span>Step 2 of 2: Trip & Travel Preferences</span>
                </span>
                <span className="text-[11px] bg-accent/40 text-primary font-bold px-2.5 py-0.5 rounded-full border border-accent/60">
                  Almost Done!
                </span>
              </div>
              <div className="w-full h-1.5 bg-light-bg rounded-full overflow-hidden border border-border/50">
                <div className="w-full h-full bg-gradient-to-r from-primary to-[#18a86a] rounded-full" />
              </div>
            </div>

            {/* Header Titles */}
            <div className="mb-6">
              <h3 className="font-heading font-bold text-2xl sm:text-3xl text-text">
                Personalize your adventures
              </h3>
              <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
                Tell us what kind of trips excite you. We use this to calculate compatibility fit scores with travel buddies and recommend the best open trips.
              </p>
            </div>

            <div className="space-y-6">
              {/* 1. Travel Interests (Multi-select) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs sm:text-sm font-semibold text-text flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>What trips are you interested in?</span>
                  </label>
                  <span className="text-[11px] text-text-muted font-medium">
                    {selectedInterests.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_INTERESTS.map((item) => {
                    const isSelected = selectedInterests.includes(item.id);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleInterest(item.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${isSelected
                          ? 'bg-primary/10 text-primary border-primary shadow-xs ring-1 ring-primary/30'
                          : 'bg-white hover:bg-light-bg text-text-muted hover:text-text border-border'
                          }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-light-bg text-text-muted'
                            }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate flex-1">{item.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Preferred Travel Pace */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Preferred Travel Pace</span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {PACE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={travelPace === opt.value} onClick={() => setTravelPace(opt.value as any)}
                      className={`min-w-0 p-2 sm:p-3 rounded-xl border text-center sm:text-left transition-all ${travelPace === opt.value
                        ? 'bg-primary/10 text-primary border-primary shadow-xs ring-1 ring-primary/30'
                        : 'bg-white hover:bg-light-bg text-text border-border'
                        }`}
                    >
                      <div className="text-xl mb-1">{opt.emoji}</div>
                      <div className="font-heading font-bold text-xs sm:text-sm text-text">
                        {opt.label}
                      </div>
                      <div className="sr-only sm:not-sr-only sm:text-[11px] sm:text-text-muted sm:mt-1 sm:leading-snug">
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Preferred Group Size */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text mb-2.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Who do you like travelling with?</span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {GROUP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={preferredGroupSize === opt.value} onClick={() => setPreferredGroupSize(opt.value)}
                      className={`min-w-0 p-2 sm:p-3 rounded-xl border text-center sm:text-left transition-all ${preferredGroupSize === opt.value
                        ? 'bg-primary/10 text-primary border-primary shadow-xs ring-1 ring-primary/30'
                        : 'bg-white hover:bg-light-bg text-text border-border'
                        }`}
                    >
                      <div className="text-xl mb-1">{opt.emoji}</div>
                      <div className="font-heading font-bold text-xs sm:text-sm text-text">
                        {opt.label}
                      </div>
                      <div className="sr-only sm:not-sr-only sm:text-[11px] sm:text-text-muted sm:mt-1 sm:leading-snug">
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Budget Preference */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text mb-2.5 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span>Typical Budget Style</span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={budgetStyle === opt.value} onClick={() => setBudgetStyle(opt.value)}
                      className={`min-w-0 p-2 sm:p-3 rounded-xl border text-center sm:text-left transition-all ${budgetStyle === opt.value
                        ? 'bg-primary/10 text-primary border-primary shadow-xs ring-1 ring-primary/30'
                        : 'bg-white hover:bg-light-bg text-text border-border'
                        }`}
                    >
                      <div className="font-heading font-bold text-xs sm:text-sm text-text">
                        {opt.label}
                      </div>
                      <div className="text-[10px] sm:text-xs font-semibold text-primary mt-1 leading-snug">
                        {opt.range}
                      </div>
                      <div className="sr-only sm:not-sr-only sm:text-[11px] sm:text-text-muted sm:mt-1 sm:leading-snug">
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Trip Details & Starting Location */}
              <div className="space-y-3.5 pt-4 border-t border-border">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>Your Home City / Starting Location</span>
                  </label>
                  <input
                    type="text"
                    value={homeCity}
                    onChange={(e) => setHomeCity(e.target.value)}
                    placeholder="e.g. Kochi, Bengaluru, Mumbai, Delhi, Chennai..."
                    className="w-full text-xs sm:text-sm rounded-xl border border-border bg-white px-3.5 py-2.5 text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                  {/* Quick City suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-text-subtle mr-0.5">Quick select:</span>
                    {['Kochi', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad'].map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setHomeCity(city)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${homeCity === city
                          ? 'bg-primary text-white border-primary'
                          : 'bg-light-bg text-text-muted hover:text-text border-border'
                          }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    <span>Your Next Bucket-List Destination</span>
                  </label>
                  <input
                    type="text"
                    value={dreamDestination}
                    onChange={(e) => setDreamDestination(e.target.value)}
                    placeholder="e.g. Fort Kochi art biennale, Munnar tea hills, Ladakh bike ride..."
                    className="w-full text-xs sm:text-sm rounded-xl border border-border bg-white px-3.5 py-2.5 text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Short Travel Bio / Motto <span className="text-text-muted font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Weekend hiker who loves trying local seafood, finding hidden viewpoints & shooting photography."
                    className="w-full text-xs sm:text-sm rounded-xl border border-border bg-white px-3.5 py-2 text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  onClick={handleCompletePreferences}
                  className="w-full font-semibold shadow-hover flex items-center justify-center gap-2"
                >
                  <span>Complete Profile & Start Exploring</span>
                  {/* <ArrowRight className="w-4 h-4" /> */}
                </Button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthStep('credentials')}
                    className="text-xs text-text-muted hover:text-text transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back to account details</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipPreferences}
                    className="text-xs text-text-muted hover:text-primary transition-colors font-semibold"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md flex flex-col text-left">
            {/* Tabs: Sign Up / Login with Underline Style */}
            <div className="flex items-center border-b border-border mb-8">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrors({});
                  setConfirmPassword('');
                }}
                className={`flex-1 pb-3 text-center text-sm sm:text-base font-semibold relative transition-colors ${mode === 'signup' ? 'text-primary' : 'text-text-muted hover:text-text'
                  }`}
              >
                Sign Up
                {mode === 'signup' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrors({});
                  setConfirmPassword('');
                }}
                className={`flex-1 pb-3 text-center text-sm sm:text-base font-semibold relative transition-colors ${mode === 'login' ? 'text-primary' : 'text-text-muted hover:text-text'
                  }`}
              >
                Login
                {mode === 'login' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </div>

            {/* Form Header */}
            <div className="mb-6">
              <h3 className="font-heading font-bold text-2xl text-text">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h3>
              <p className="text-xs sm:text-sm text-text-muted mt-1">
                {mode === 'signup'
                  ? 'Join our community of travellers'
                  : 'Log in to continue your adventure'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {mode === 'signup' && <label className="block text-xs font-semibold text-text">Gender
                <select value={gender} onChange={(event) => setGender(event.target.value as typeof gender)} className="block w-full mt-1.5 rounded-xl border border-border bg-light-bg px-3 py-2.5 text-sm text-text">
                  <option value="prefer-not-to-say">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                </select>
              </label>}
              {mode === 'signup' && (
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  error={errors.fullName}
                />
              )}

              <Input
                label="Email or Phone Number"
                placeholder="Enter your email or phone"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                error={errors.emailOrPhone}
              />

              <Input
                label="Password"
                placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                isPassword
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />

              {mode === 'signup' && (
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  isPassword
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                />
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2 font-semibold text-sm sm:text-base"
              >
                {mode === 'signup' ? 'Sign Up' : 'Log In'}
              </Button>
            </form>

            {/* Switch mode footer */}
            <div className="mt-4 text-center text-xs text-text-muted">
              {mode === 'signup' ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrors({});
                      setConfirmPassword('');
                    }}
                    className="font-semibold text-primary hover:underline ml-1"
                  >
                    Login
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrors({});
                      setConfirmPassword('');
                    }}
                    className="font-semibold text-primary hover:underline ml-1"
                  >
                    Sign Up
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
