import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Compass,
  Users,
  Shield,
  BookOpen,
  ArrowRight,
  MapPin,
  Sparkles,
  Lock,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { useDestinations } from '../context/DestinationsContext';
import { SEO } from '../components/common/SEO';

const corePillars = [
  {
    icon: Compass,
    title: 'Destination Discovery',
    description:
      'Explore handpicked hill stations, mountain passes, coastal routes, and hidden travel spots across India with seasonal advice, highlight tags, and estimated budgets.',
  },
  {
    icon: Users,
    title: 'Group Trip Coordination',
    description:
      'Find open trips or create your own. Filter by travel style, group size, and itinerary pace so you travel with companions who share your expectations.',
  },
  {
    icon: Lock,
    title: 'Travel Vault Document Storage',
    description:
      'Store your tickets, identification cards, hotel bookings, and emergency helpline details locally on your device with offline-ready access during your trip.',
  },
  {
    icon: BookOpen,
    title: 'Travel Diary & Stories',
    description:
      'Document your day-by-day travel experiences, publish authentic community stories, and preserve travel memories to guide future explorers.',
  },
];

const whoItsFor = [
  {
    title: 'Solo Travellers',
    subtitle: 'Looking for companions',
    description:
      'Discover upcoming trips with open seats, review group vibes and difficulty levels, and connect with fellow travellers heading to the same destinations.',
  },
  {
    title: 'Weekend Explorers',
    subtitle: 'Escapes & road trips',
    description:
      'Find short getaways, scenic treks, and weekend drives from major cities with transparent itineraries and estimated costs.',
  },
  {
    title: 'Trip Leaders & Organizers',
    subtitle: 'Coordinating group adventures',
    description:
      'Create detailed day-by-day itineraries, manage member join requests in the Trip Leader Console, and communicate smoothly before departure.',
  },
];

const platformValues = [
  {
    icon: Users,
    title: 'Clear Expectations',
    description:
      'Agree on routes, budgets, accommodation types, and travel pace before you embark. Shared clarity prevents misunderstandings on the road.',
  },
  {
    icon: Heart,
    title: 'Mutual Respect',
    description:
      'Respect individual privacy, personal boundaries, and local cultural norms. Every member contributes to a considerate travel atmosphere.',
  },
  {
    icon: Shield,
    title: 'Responsible Planning',
    description:
      'Keep verified emergency contacts handy, prepare travel documentation early, and follow safety best practices on every journey.',
  },
];

export const AboutPage: React.FC = () => {
  const { destinations } = useDestinations();

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 lg:py-10 space-y-6 sm:space-y-8 lg:space-y-12 text-left">
      <SEO
        title="About TripzoBox — Discover Destinations & Group Travel Community"
        description="TripzoBox is a collaborative travel platform connecting travellers to discover destinations across India, join organized group trips, coordinate itineraries, and store documents in Travel Vault."
        canonical="https://tripzobox.com/about"
      />

      {/* Hero Section */}
      <section className="grid md:grid-cols-2 lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-10 items-center rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 sm:p-6 lg:p-10">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary tracking-widest uppercase">
            <Sparkles className="w-4 h-4" /> About TripzoBox
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-5xl text-text tracking-tight mt-3 lg:mt-4">
            Discover Destinations, Plan Group Trips &amp; Travel Together
          </h1>
          <p className="font-heading font-semibold text-base sm:text-lg lg:text-2xl text-primary mt-2 lg:mt-4">
            A collaborative platform for explorers seeking real travel connections.
          </p>
          <p className="text-sm lg:text-base text-text-muted mt-3 lg:mt-4 leading-relaxed max-w-2xl">
            TripzoBox brings destination discovery, collaborative group travel planning, and offline document organization into a single transparent space. Whether you are seeking travel companions for a mountain trek or planning a weekend road trip, TripzoBox helps you coordinate without scattered group chats.
          </p>
          <div className="flex flex-wrap gap-3 mt-5 lg:mt-6">
            <Link
              to="/explore"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
            >
              Explore Destinations <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/trips"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-white px-5 py-3 text-sm font-semibold text-primary hover:bg-emerald-50 transition-colors shadow-sm"
            >
              Browse Group Trips <Users className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden min-h-[220px] sm:min-h-[260px] md:h-full lg:min-h-[340px]">
          <img
            src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=1000&q=85"
            alt="Travellers exploring mountain scenic route together"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-5 inset-x-5 text-white">
            <p className="font-heading font-bold text-lg sm:text-xl">Shared Adventures, Real Connections</p>
            <p className="text-xs sm:text-sm text-white/80 mt-1">Connecting travellers across India through transparent trip coordination.</p>
          </div>
        </div>
      </section>

      {/* What TripzoBox Is & Who It Is Designed For */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border p-5 sm:p-6 lg:p-8 shadow-subtle space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Platform Purpose</span>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text">
            What is TripzoBox?
          </h2>
          <p className="text-sm sm:text-base text-text-muted leading-relaxed">
            TripzoBox is designed to solve common travel headaches: fragmented WhatsApp groups, lost PDF tickets, mismatched group budgets, and unreliable travel advice. We provide a structured environment where travellers can discover curated destinations, organize detailed itineraries, find verified travel companions, and manage essential trip details.
          </p>
          <div className="pt-2">
            <h3 className="font-heading font-bold text-lg text-text mb-3">Designed For Every Style of Explorer</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {whoItsFor.map((item) => (
                <div key={item.title} className="rounded-xl border border-emerald-50 bg-emerald-50/40 p-4">
                  <h4 className="font-heading font-bold text-sm text-text">{item.title}</h4>
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mt-0.5">{item.subtitle}</p>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-3xl bg-emerald-950 text-white p-5 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Quick Overview</span>
            <h3 className="font-heading font-bold text-xl sm:text-2xl mt-2 text-white">At a Glance</h3>
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-xs text-emerald-300 uppercase">Curated Destinations</p>
                <p className="font-heading font-extrabold text-2xl sm:text-3xl text-white mt-0.5">
                  {destinations.length > 0 ? destinations.length : '15+'} Places
                </p>
                <p className="text-xs text-white/70 mt-1">From Munnar hills to Varkala coastline.</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-emerald-300 uppercase">Trip Compatibility</p>
                <p className="font-heading font-extrabold text-xl sm:text-2xl text-white mt-0.5">Interest Fit Signals</p>
                <p className="text-xs text-white/70 mt-1">Match based on travel style, budget, and pace.</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-emerald-300 uppercase">Travel Vault</p>
                <p className="font-heading font-extrabold text-xl sm:text-2xl text-white mt-0.5">Offline Document Access</p>
                <p className="text-xs text-white/70 mt-1">Keep tickets and emergency contacts ready anywhere.</p>
              </div>
            </div>
          </div>
          <div className="pt-6">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-200 hover:text-white transition-colors"
            >
              See how the platform works <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </aside>
      </section>

      {/* How TripzoBox Works: Core Features */}
      <section className="rounded-3xl border border-border bg-white p-5 sm:p-6 lg:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Built-In Capabilities</span>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text mt-2">
            How TripzoBox Helps You Plan &amp; Travel
          </h2>
          <p className="text-sm text-text-muted mt-2 max-w-3xl">
            Every feature in TripzoBox is built around practical travel coordination, from the first spark of inspiration to your return home.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {corePillars.map(({ icon: Icon, title, description }) => (
            <article key={title} className="flex flex-col rounded-2xl border border-emerald-100 bg-white p-5 shadow-subtle hover:border-emerald-200 transition-colors">
              <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary w-fit">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-text mt-4">{title}</h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed mt-2">{description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Deep Dive: How Travellers Connect & Travel Vault */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-border bg-white p-5 sm:p-6 lg:p-8 space-y-4">
          <div className="inline-flex p-3 rounded-xl bg-emerald-50 text-primary w-fit">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-text">
            Connecting With Fellow Travellers
          </h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Finding compatible companions is essential for enjoyable group travel. In TripzoBox:
          </p>
          <ul className="space-y-3 text-xs sm:text-sm text-text-muted">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>Join Requests:</strong> Travellers submit requests with personal introductions and expectations before being added to a trip squad.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>Trip Chat Rooms:</strong> Accepted members coordinate directly in focused group conversations without leaking personal phone numbers.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>Compatibility Fit Scores:</strong> Compatibility signals highlight common travel interests, activity levels, and preferences.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-white p-5 sm:p-6 lg:p-8 space-y-4">
          <div className="inline-flex p-3 rounded-xl bg-emerald-50 text-primary w-fit">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-text">
            Travel Vault Document Security
          </h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Losing boarding passes or hotel confirmations in low-connectivity areas can disrupt a trip. The Travel Vault provides:
          </p>
          <ul className="space-y-3 text-xs sm:text-sm text-text-muted">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>Offline-First Storage:</strong> Documents are cached locally on your device so they remain accessible even without mobile data.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>Categorized Records:</strong> Keep ID proofs, transportation tickets, hotel bookings, and travel insurance clearly separated.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>Emergency Helpline Access:</strong> Instant access to national helplines (112, 100, 108) and your designated emergency contacts.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Community Values & Trust */}
      <section aria-labelledby="about-values" className="space-y-4 lg:space-y-6">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Community Principles</span>
          <h2 id="about-values" className="font-heading font-bold text-2xl sm:text-3xl text-text mt-2">
            Shared Standards for Thoughtful Travel
          </h2>
          <p className="text-sm text-text-muted mt-1">
            TripzoBox operates on honesty, transparency, and personal accountability.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {platformValues.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-text mt-4">{title}</h3>
                <p className="text-xs sm:text-sm text-text-muted mt-2 leading-relaxed">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Trust & Policy Links */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-xl text-text">Trust &amp; Safety Guidelines</h3>
            <p className="text-sm text-text-muted leading-relaxed mt-2">
              Learn our recommendations for vetting trip details, communicating with organizers, agreeing on split expenses, and keeping your journey safe.
            </p>
          </div>
          <Link
            to="/safety"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover mt-4"
          >
            Read Safety Guidelines <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-xl text-text">Community Rules &amp; Code of Conduct</h3>
            <p className="text-sm text-text-muted leading-relaxed mt-2">
              Our community code outlines expectations for host transparency, participant behavior, and prompt reporting of any concerns.
            </p>
          </div>
          <Link
            to="/community-rules"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover mt-4"
          >
            Review Community Rules <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="rounded-2xl border border-border bg-white p-5 sm:p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-subtle"
      >
        <div>
          <h2 className="font-heading font-bold text-xl text-text">Have Questions or Suggestions?</h2>
          <p className="text-sm text-text-muted mt-1 leading-relaxed">
            We are continuously improving TripzoBox to serve the travel community better. Reach out anytime.
          </p>
          <a href="mailto:hello@tripzobox.com" className="inline-block text-sm text-primary font-semibold hover:underline mt-2">
            hello@tripzobox.com
          </a>
        </div>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
        >
          Contact Us <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};
