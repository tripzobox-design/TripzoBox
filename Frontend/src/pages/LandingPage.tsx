import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Users,
  BookOpen,
  ArrowRight,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { mockDestinations } from '../data/mockDestinations';
import { DestinationCard } from '../components/feature/DestinationCard';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const popularDestinations = mockDestinations.slice(0, 4);

  const heroSlides = [
    {
      url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=85',
      location: 'Dolomites Alps, Italy',
      tag: 'Alpine Wilderness',
    },
    {
      url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=2400&q=85',
      location: 'Yosemite Valley, California',
      tag: 'Majestic Peaks',
    },
    {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=85',
      location: 'Lofoten Fjords, Norway',
      tag: 'Nordic Horizons',
    },
    {
      url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=2400&q=85',
      location: 'Munnar Tea Hills, Kerala',
      tag: 'Emerald Highlands',
    },
    {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=85',
      location: 'Bali Coastal Cliffs, Indonesia',
      tag: 'Sunset Escapes',
    },
  ];

  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  // Auto-advance hero background every 1.8 seconds for fast, dynamic transitions unless hovered
  React.useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [isHovered, heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="flex flex-col text-left">
      {/* 1. HERO SECTION (Dark Background Image Carousel) */}
      <section
        className="relative min-h-[620px] sm:min-h-[660px] lg:min-h-[720px] flex items-center overflow-hidden bg-text"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Tripzobox Hero Showcase"
      >
        {/* Full-bleed background images with fast crossfade */}
        <div className="absolute inset-0 z-0">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.url}
              className={`absolute inset-0 transition-opacity duration-400 ease-in-out ${index === currentSlide ? 'opacity-100 z-1' : 'opacity-0 z-0 pointer-events-none'
                }`}
            >
              <img
                src={slide.url}
                alt={slide.location}
                className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-10000 ease-out"
              />
            </div>
          ))}

          {/* Cinematic Dark Gradient Overlays for High Legibility & Vibrant Image Depth */}
          <div className="absolute inset-0 z-2 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
          <div className="absolute inset-0 z-2 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
        </div>

        {/* Hero Content (Clean Left Alignment with High Contrast, padded for transparent navbar) */}
        <div className="relative z-10 w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-24 sm:pb-28">
          <div className="max-w-2xl text-left">
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.08] drop-shadow-sm">
              <span className="block text-white">Your Journey.</span>
              <span className="block text-white">
                Your <span className="text-accent">People.</span>
              </span>
              <span className="block text-white">
                Your <span className="text-secondary">Story.</span>
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-base lg:text-lg text-gray-200 font-body leading-relaxed max-w-xl drop-shadow-sm">
              Plan your trip, connect with travellers, keep important information safe, and share your real travel experiences with an authentic community.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/explore')}
                className="px-8 py-3.5 rounded-full font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 text-sm sm:text-base transition-transform hover:-translate-y-0.5"
              >
                Start Exploring
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/how-it-works')}
                className="px-8 py-3.5 rounded-full font-semibold text-sm sm:text-base bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-md hover:border-white/60 transition-all hover:-translate-y-0.5"
              >
                How It Works
              </Button>
            </div>
          </div>
        </div>

        {/* Slide Indicator Dots (Compact, subtle and lower opacity for refined background harmony) */}
        <div className="absolute bottom-16 sm:bottom-20 right-6 sm:right-10 lg:right-14 z-20 flex items-center gap-1.5 sm:gap-2">
          {heroSlides.map((slide, idx) => (
            <button
              key={slide.location}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}: ${slide.location}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${idx === currentSlide
                  ? 'w-5 sm:w-6 h-1.5 bg-accent/80'
                  : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                }`}
            />
          ))}
        </div>
      </section>

      {/* Floating 3-Card Strip (Liquid Glass Floating Dock) */}
      <div className="relative -mt-10 sm:-mt-14 md:-mt-16 z-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl 2xl:max-w-[1536px] mx-auto bg-white/88 backdrop-blur-2xl backdrop-saturate-200 rounded-2xl sm:rounded-3xl border border-white/80 shadow-[0_16px_50px_-10px_rgba(15,144,88,0.1),0_4px_20px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,1)] p-2 sm:p-3">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Strip Card 1: Travel Vault */}
            <div
              onClick={() => navigate('/app/vault')}
              className="p-4 sm:p-5 rounded-2xl hover:bg-light-bg/90 transition-all duration-200 cursor-pointer flex items-center gap-4 text-left group"
            >
              <div className="w-12 h-12 rounded-full bg-accent/35 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                <Shield className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-sm sm:text-base text-text group-hover:text-primary transition-colors">
                  Travel Vault
                </h4>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                  Keep your important information safe.
                </p>
              </div>
            </div>

            {/* Strip Card 2: Find Your People */}
            <div
              onClick={() => navigate('/trips')}
              className="p-4 sm:p-5 rounded-2xl hover:bg-light-bg/90 transition-all duration-200 cursor-pointer flex items-center gap-4 text-left group"
            >
              <div className="w-12 h-12 rounded-full bg-accent/35 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                <Users className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-sm sm:text-base text-text group-hover:text-primary transition-colors">
                  Find Your People
                </h4>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                  Create or join trips with compatible travelers.
                </p>
              </div>
            </div>

            {/* Strip Card 3: Travel Diary */}
            <div
              onClick={() => navigate('/app/diary')}
              className="p-4 sm:p-5 rounded-2xl hover:bg-light-bg/90 transition-all duration-200 cursor-pointer flex items-center gap-4 text-left group"
            >
              <div className="w-12 h-12 rounded-full bg-accent/35 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                <BookOpen className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-sm sm:text-base text-text group-hover:text-primary transition-colors">
                  Travel Diary
                </h4>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                  Turn your journey into useful stories and tips.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* 2. POPULAR DESTINATIONS (Matching Screen 1) */}
      <section className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
          <div>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text">
              Popular Destinations
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-xl">
              Explore beautiful places, hidden gems and real travel stories from our community.
            </p>
          </div>
          <Link
            to="/explore"
            className="text-sm font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1 group"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 4-Card Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularDestinations.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} />
          ))}
        </div>
      </section>

      {/* 3. TRUST, SAFETY & COMMUNITY VALUE SECTION */}
      <section className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-border shadow-card grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-bold text-primary tracking-wider uppercase font-heading">
              Trust & Community First
            </span>
            <h3 className="font-heading font-bold text-2xl sm:text-3xl text-text mt-2 leading-tight">
              Real journeys start with trusted companions.
            </h3>
            <p className="text-sm text-text-muted mt-4 leading-relaxed">
              Tripzobox isn't an anonymous social network. We are built for authentic travel: verified identity options, privacy-first Travel Vault for your flight and ID copies, and preference matching that helps you find travellers who share your pace and budget.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-text">Private By Default</h5>
                  <p className="text-xs text-text-muted mt-0.5">Your diary entries and documents stay private until you choose to publish or share.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-text">Verified Groups</h5>
                  <p className="text-xs text-text-muted mt-0.5">Trip leaders review join requests to ensure positive group chemistry.</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button variant="secondary" onClick={() => navigate('/safety')}>
                Read Our Safety Principles
              </Button>
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-subtle">
            <img
              src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=1000&q=80"
              alt="Group of friends hiking together"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xs font-medium text-accent">Community Highlight</p>
              <h4 className="font-heading font-bold text-lg mt-0.5">
                "We met on Tripzobox in Munnar and planned three more treks together."
              </h4>
            </div>
          </div>
        </div>
      </section>

      {/* 4. READY TO EXPLORE CTA BANNER */}
      <section className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-3xl p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-hover">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
          <h3 className="font-heading font-extrabold text-2xl sm:text-4xl text-white">
            Ready to start your next adventure?
          </h3>
          <p className="mt-3 text-sm sm:text-base text-gray-100 max-w-xl mx-auto leading-relaxed">
            Join thousands of curious travellers discovering hidden trails, sharing authentic stories, and making lasting connections.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              variant="outline-white"
              size="lg"
              onClick={() => navigate('/signup')}
              className="bg-white text-primary border-transparent hover:bg-gray-100 shadow-md font-semibold"
            >
              Create Free Account
            </Button>
            <Button
              variant="outline-white"
              size="lg"
              onClick={() => navigate('/trips')}
            >
              Browse Open Trips
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
