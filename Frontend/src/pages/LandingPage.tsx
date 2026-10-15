import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Users,
  BookOpen,
  ArrowRight,
  Compass,
  CheckCircle2,
  Sparkles,
  MapPin,
  Flame,
  Lock,
  Star,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { HeroInteractiveShowcase } from '../components/feature/HeroInteractiveShowcase';
import { MemberHome } from '../components/feature/MemberHome';

const communityHighlights = [
  {
    image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1000&q=80',
    alt: 'Mountain valley surrounded by forest',
    quote: 'Find your trail. Share the adventure. Make memories together.',
  },
  {
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    alt: 'Turquoise waves along a tropical beach',
    quote: 'Chase new horizons with people who share your sense of wonder.',
  },
  {
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    alt: 'Peaceful river beneath dramatic mountain cliffs',
    quote: 'Great journeys begin with a place to explore and someone to go with.',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [communitySlide, setCommunitySlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCommunitySlide((previous) => (previous + 1) % communityHighlights.length);
    }, 1500);
    return () => window.clearInterval(timer);
  }, []);



  const handleVaultClick = () => {
    if (!isLoggedIn) {
      showToast('Please log in to access your offline Travel Vault', 'info');
      navigate('/login?redirect=/app/vault');
    } else {
      navigate('/app/vault');
    }
  };

  const handleDiaryClick = () => {
    if (!isLoggedIn) {
      showToast('Please log in to read or write in your Travel Diary', 'info');
      navigate('/login?redirect=/app/diary');
    } else {
      navigate('/app/diary');
    }
  };

  return (
    <div className="flex flex-col text-left">
      {/* 1. HERO SECTION (Dark Background Image Carousel) */}

      <section
        className="relative min-h-[620px] sm:min-h-[660px] lg:min-h-[720px] flex items-center overflow-hidden bg-text"
        aria-label="Tripzobox Hero Showcase"
      >
        <div className="absolute inset-0 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=2400&q=90" alt="" className="w-full h-full object-cover object-center" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-slate-950/20" />
        </div>
        {/* Hero Content (Spacious, balanced 2-column layout matching reference design) */}
        <div className="relative z-10 w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-14 pb-20 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column (6 cols): Brand Headline, CTAs, & Trust Badges */}
            <div className="lg:col-span-5 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-accent text-xs font-bold tracking-wide uppercase mb-4">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Next-Gen Travel Community</span>
              </div>

              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-[58px] xl:text-[64px] text-white tracking-tight leading-[1.08] drop-shadow-sm">
                <span className="block text-white">Your Journey.</span>
                <span className="block text-white">
                  Your <span className="text-[#a5f3d4]">People.</span>
                </span>
                <span className="block text-white">
                  Your <span className="text-[#00D285]">Story.</span>
                </span>
              </h1>

              <p className="mt-5 text-sm sm:text-base lg:text-lg text-gray-200 font-body leading-relaxed max-w-xl drop-shadow-sm">
                Plan your trip, connect with compatible travellers, keep important documents safe offline, and discover untouched secret spots with an authentic community.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/explore')}
                  className="px-8 py-3.5 rounded-xl font-bold bg-[#00B074] hover:bg-[#009864] text-white shadow-lg shadow-emerald-950/40 text-sm sm:text-base transition-transform hover:-translate-y-0.5"
                >
                  Start Exploring
                </Button>
                <button
                  type="button"
                  onClick={() => navigate('/how-it-works')}
                  className="px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md transition-all hover:-translate-y-0.5 cursor-pointer shadow-md"
                >
                  How It Works
                </button>
              </div>

              {/* Social Proof Tags with Divider */}
              <div className="mt-8 pt-6 border-t border-white/20 flex flex-wrap items-center gap-6 text-xs text-gray-200">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Identity Trips</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>256-Bit Encrypted Vault</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Curated Hidden Spots</span>
                </span>
              </div>
            </div>

            {/* Right Column (6 cols): Rich Hero Showcase with Trending Bali, Destinations & Travel Crew */}
            <div className="lg:col-span-7 w-full">
              <HeroInteractiveShowcase />
            </div>
          </div>
        </div>

      </section>

      {/* Floating 3-Card Strip (Clean Solid White Card) */}
      <div className="relative -mt-10 sm:-mt-14 z-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1216px] 2xl:max-w-[1472px] mx-auto bg-white rounded-2xl sm:rounded-3xl border border-border shadow-float p-2 sm:p-3">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Strip Card 1: Travel Vault */}
            <button
              type="button"
              onClick={handleVaultClick}
              className="p-4 sm:p-5 rounded-2xl hover:bg-light-bg/80 transition-all duration-200 cursor-pointer flex items-center gap-4 text-left group"
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
            </button>

            {/* Strip Card 2: Find Your People */}
            <button
              type="button"
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
            </button>

            {/* Strip Card 3: Travel Diary */}
            <button
              type="button"
              onClick={handleDiaryClick}
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
            </button>
          </div>
        </div>
      </div>


      {isLoggedIn && <div className="mt-8"><MemberHome /></div>}



      {/* 3. TRUST, SAFETY & COMMUNITY VALUE SECTION */}
      <section className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
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
              <Button
                variant="secondary"
                onClick={() => navigate('/safety')}
                className="group motion-safe:duration-300 motion-safe:hover:-translate-y-1 hover:shadow-hover hover:bg-primary hover:text-white motion-reduce:transform-none"
                iconRight={
                  <ArrowRight className="w-4 h-4 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1" />
                }
              >
                Read Our Safety Principles
              </Button>
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-subtle">
            {communityHighlights.map((highlight, index) => (
              <img
                key={highlight.image}
                src={highlight.image}
                alt={index === communitySlide ? highlight.alt : ''}
                aria-hidden={index !== communitySlide}
                className={`absolute inset-0 w-full h-full object-cover motion-safe:transition-opacity motion-safe:duration-500 ${index === communitySlide ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xs font-medium text-accent">Community Highlight</p>
              <h4 className="font-heading font-bold text-lg mt-0.5">
                &ldquo;{communityHighlights[communitySlide].quote}&rdquo;
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
              onClick={() => navigate(isLoggedIn ? '/app/trips/create' : '/signup')}
              className="bg-white text-primary border-transparent hover:bg-gray-100 shadow-md font-semibold"
            >
              {isLoggedIn ? 'Host a Trip' : 'Create Free Account'}
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
