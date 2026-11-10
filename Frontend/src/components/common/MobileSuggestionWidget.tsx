import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Search,
  MapPin,
  PlusCircle,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Shield,
  PhoneCall,
  User,
  MessageSquare,
  HelpCircle,
  X,
  ArrowRight,
  ChevronRight,
  Globe,
  Heart,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface SuggestionItem {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  category: 'trips' | 'explore' | 'vault' | 'safety' | 'account';
  icon: React.ElementType;
  badge?: string;
  color: string;
}

export const SUGGESTIONS: SuggestionItem[] = [
  {
    id: 'find-trips',
    title: 'Find a Group Trip',
    subtitle: 'Browse upcoming group trips, solo-friendly escapes & weekend treks',
    path: '/trips',
    category: 'trips',
    icon: Compass,
    badge: 'Popular',
    color: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'explore-destinations',
    title: 'Explore Destinations',
    subtitle: 'Discover hill stations, pristine beaches, heritage towns & hidden gems',
    path: '/explore',
    category: 'explore',
    icon: MapPin,
    badge: 'Trending',
    color: 'bg-teal-100 text-teal-800',
  },
  {
    id: 'create-trip',
    title: 'Create & Host a Trip',
    subtitle: 'Plan a new itinerary, set group budget & invite fellow travellers',
    path: '/app/trips/create',
    category: 'trips',
    icon: PlusCircle,
    color: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'travel-diary',
    title: 'Travel Diary & Stories',
    subtitle: 'Record your journeys, photo memories & publish community stories',
    path: '/app/diary',
    category: 'vault',
    icon: BookOpen,
    color: 'bg-amber-100 text-amber-800',
  },
  {
    id: 'browse-stories',
    title: 'Read Travel Stories',
    subtitle: 'Real itineraries, photos & advice written by verified travellers',
    path: '/stories',
    category: 'explore',
    icon: Sparkles,
    color: 'bg-amber-100 text-amber-800',
  },
  {
    id: 'travel-vault',
    title: 'Secure Travel Vault',
    subtitle: 'Access offline copies of passports, visas, insurance & ID proofs',
    path: '/app/vault',
    category: 'vault',
    icon: ShieldCheck,
    badge: 'Encrypted',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'emergency-contacts',
    title: 'Emergency View & Contacts',
    subtitle: 'Quick access to emergency numbers, blood group & medical notes',
    path: '/app/vault',
    category: 'vault',
    icon: PhoneCall,
    color: 'bg-red-100 text-red-800',
  },
  {
    id: 'chat-messages',
    title: 'Chat & Trip Discussions',
    subtitle: 'Stay in touch with your trip leader, companions & travel mates',
    path: '/app/messages',
    category: 'account',
    icon: MessageSquare,
    color: 'bg-indigo-100 text-indigo-800',
  },
  {
    id: 'profile-settings',
    title: 'Profile & Security',
    subtitle: 'Update your avatar, bio, verified phone number & recovery credentials',
    path: '/app/profile',
    category: 'account',
    icon: User,
    color: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'safety-guidelines',
    title: 'Trust & Safety Center',
    subtitle: 'Learn about verified profiles, women-only groups & leader checks',
    path: '/safety',
    category: 'safety',
    icon: Shield,
    color: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'community-rules',
    title: 'Community Guidelines',
    subtitle: 'Code of conduct, mutual respect & trip etiquette for all members',
    path: '/community-rules',
    category: 'safety',
    icon: Globe,
    color: 'bg-teal-100 text-teal-800',
  },
  {
    id: 'help-support',
    title: 'Contact & Support',
    subtitle: 'Reach out to our 24/7 traveller support team for assistance',
    path: '/contact',
    category: 'safety',
    icon: HelpCircle,
    color: 'bg-gray-100 text-gray-800',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'trips', label: 'Trips' },
  { id: 'explore', label: 'Explore' },
  { id: 'vault', label: 'Vault & Diary' },
  { id: 'account', label: 'Account' },
  { id: 'safety', label: 'Safety & Help' },
] as const;

export const MobileSuggestionWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFloatingDismissed, setIsFloatingDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  // Close sheet on route navigation
  React.useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredSuggestions = useMemo(() => {
    let list = SUGGESTIONS;

    if (activeCategory !== 'all') {
      list = list.filter((item) => item.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeCategory, searchQuery]);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. FLOATING QUICK-SUGGESTION TRIGGER (Mobile only, bottom-left)
          Placed at bottom-[72px] left-3 to avoid collision with right-side FABs
         ───────────────────────────────────────────────────────────── */}
      {!isFloatingDismissed && (
        <div className="lg:hidden fixed bottom-[72px] left-3 z-40 pointer-events-auto flex items-center animate-in fade-in duration-200">
          <div className="flex items-center bg-[#0D5A46] hover:bg-[#0B4B3A] text-white pl-3.5 pr-1.5 py-1.5 rounded-full shadow-lg border border-emerald-400/40 text-xs font-semibold backdrop-blur-md transition-all">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-1.5 cursor-pointer pr-1 group"
              aria-label="Looking for something? Open suggestions"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Looking for something?</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFloatingDismissed(true);
              }}
              className="p-1 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer ml-1"
              aria-label="Dismiss quick suggestions"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. IN-PAGE SUGGESTION SECTION (Rendered near bottom of page)
         ───────────────────────────────────────────────────────────── */}
      <div className="lg:hidden w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-w-7xl 2xl:max-w-[1536px] mx-auto my-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-emerald-200/80 shadow-xs text-left">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-gray-900">
                Looking for something?
              </h4>
              <p className="text-[11px] text-gray-500">
                Quickly jump to popular sections across Tripzobox:
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-[11px] font-semibold text-primary hover:underline shrink-0"
          >
            View all &rarr;
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {SUGGESTIONS.slice(0, 6).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.path)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/60 text-xs font-semibold text-emerald-950 transition-colors cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FULL SUGGESTION BOTTOM SHEET / MODAL (Mobile only)
         ───────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Canvas */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-250 text-left">
            {/* Top Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2 shrink-0" />

            {/* Header */}
            <div className="px-5 pb-3 pt-1 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-gray-900">
                    Looking for something?
                  </h3>
                  <p className="text-xs text-gray-500">
                    Tap any option to go directly to that page
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center cursor-pointer"
                aria-label="Close suggestions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 pb-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search destinations, trips, vault, diary..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-[#0D5A46] text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestions Scrollable List */}
            <div className="flex-1 overflow-y-auto px-4 pt-1 pb-32 sm:pb-24 space-y-2">
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = location.pathname === item.path;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.path)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group cursor-pointer ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/60 shadow-2xs'
                          : 'border-gray-200/80 bg-white hover:border-emerald-400 hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${item.color} group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="w-5 h-5 stroke-[2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-primary transition-colors truncate">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200/60 uppercase">
                                {item.badge}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-gray-50 group-hover:bg-[#0D5A46] group-hover:text-white text-gray-400 flex items-center justify-center shrink-0 ml-2 transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-10 text-center text-gray-500">
                  <Compass className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs font-semibold text-gray-700">No suggestions match "{searchQuery}"</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Try searching for trips, vault, diary, or explore</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

