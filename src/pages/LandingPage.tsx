import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Users, BookOpen, ArrowRight, Compass, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { mockDestinations } from '../data/mockDestinations';
import { DestinationCard } from '../components/feature/DestinationCard';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const popularDestinations = mockDestinations.slice(0, 4);

  return (
    <div className="flex flex-col text-left">
      {/* 1. HERO SECTION (Matching Screen 1) */}
      <section className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] flex items-center justify-center text-center overflow-hidden">
        {/* Full-bleed background image with dark gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85"
            alt="Traveller overlooking mountain lake"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/75" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28 flex flex-col items-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.15] max-w-3xl">
            <span className="block text-white">Your Journey.</span>
            <span className="block text-accent">Your People.</span>
            <span className="block text-white">Your Story.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg lg:text-xl text-gray-200 max-w-2xl font-body leading-relaxed">
            Plan your trip, connect with travellers, keep important information safe, and share your real travel experiences.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/explore')}
              className="px-8 shadow-hover"
            >
              Start Exploring
            </Button>
            <Button
              variant="outline-white"
              size="lg"
              onClick={() => navigate('/how-it-works')}
            >
              How It Works
            </Button>
          </div>
        </div>

        {/* Floating 3-Card Strip (Bottom of Hero matching Screen 1) */}
        <div className="absolute bottom-6 left-0 right-0 z-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {/* Strip Card 1 */}
            <div
              onClick={() => navigate('/app/vault')}
              className="glass-panel p-4 sm:p-5 rounded-2xl shadow-float hover:scale-[1.02] transition-transform duration-200 cursor-pointer flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/40 text-primary flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-sm sm:text-base text-text">
                  Travel Vault
                </h4>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                  Keep your important information safe.
                </p>
              </div>
            </div>

            {/* Strip Card 2 */}
            <div
              onClick={() => navigate('/app/trips')}
              className="glass-panel p-4 sm:p-5 rounded-2xl shadow-float hover:scale-[1.02] transition-transform duration-200 cursor-pointer flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/40 text-primary flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-sm sm:text-base text-text">
                  Find Your People
                </h4>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                  Create or join trips with compatible travelers.
                </p>
              </div>
            </div>

            {/* Strip Card 3 */}
            <div
              onClick={() => navigate('/app/diary')}
              className="glass-panel p-4 sm:p-5 rounded-2xl shadow-float hover:scale-[1.02] transition-transform duration-200 cursor-pointer flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/40 text-primary flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-sm sm:text-base text-text">
                  Travel Diary
                </h4>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                  Turn your journey into useful stories and tips.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR DESTINATIONS (Matching Screen 1) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
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
              onClick={() => navigate('/app/trips')}
            >
              Browse Open Trips
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
