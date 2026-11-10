import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Compass,
  Shield,
  ShieldCheck,
  Lock,
  Heart,
  ArrowRight,
  Search,
  Home,
  BookOpen,
  User,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { AccountNav } from '../components/common/AccountNav';
import { MobileNavigation } from '../components/common/MobileNavigation';
import { NotificationBell } from '../components/common/NotificationBell';
import { MobileSuggestionWidget } from '../components/common/MobileSuggestionWidget';
import { useNotifications } from '../context/NotificationsContext';

// Mobile bottom navigation items for authenticated users
const MOBILE_NAV_ITEMS = [
  { label: 'Home', path: '/app/dashboard', icon: Home, matchPaths: ['/app/dashboard', '/'] },
  { label: 'Explore', path: '/explore', icon: Compass, matchPaths: ['/explore'] },
  { label: 'Trips', path: '/app/trips', icon: Search, matchPaths: ['/app/trips', '/trips'] },
  { label: 'Diary', path: '/app/diary', icon: BookOpen, matchPaths: ['/app/diary', '/app/stories', '/app/diary/add'] },
  { label: 'Profile', path: '/app/profile', icon: User, matchPaths: ['/app/profile', '/app/account-security', '/app/vault', '/app/messages', '/app/notifications'] },
] as const;

export const PublicShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isLoggedIn } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isNavActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/app/dashboard') return location.pathname.includes('/dashboard');
    if (path === '/app/vault') return location.pathname.includes('/vault');
    if (path === '/trips') return location.pathname.startsWith('/trips') || location.pathname.startsWith('/app/trips');
    if (path === '/app/diary') return location.pathname.includes('/diary') || location.pathname.includes('/stories');
    if (path === '/explore') return location.pathname.startsWith('/explore') || location.pathname.startsWith('/app/explore');
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setMobileMenuOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  const publicNavLinks = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/app/dashboard' },
    { label: 'Travel Vault', path: '/app/vault' },
    { label: 'Trips', path: '/trips' },
    { label: 'Trip Diary', path: '/app/diary' },
    { label: 'Explore', path: '/explore' },
  ];
  const navLinks = publicNavLinks;

  const isExpandedLayout =
    location.pathname.includes('/account-security') ||
    location.pathname.includes('/profile') ||
    location.pathname.includes('/vault') ||
    location.pathname.includes('/diary') ||
    location.pathname.includes('/messages');

  return (
    <div className={`min-h-screen flex flex-col bg-light-bg text-text selection:bg-accent selection:text-text ${
      isExpandedLayout ? 'lg:h-screen lg:max-h-screen lg:overflow-hidden' : ''
    }`}>
      {/* Top Nav: Full-width sticky light-themed navbar across all pages */}
      <header className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border transition-all duration-200 ${
        isScrolled ? 'shadow-subtle' : 'shadow-xs'
      }`}>
        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo: Consistent light theme with brand colors */}
          <Logo asLink to="/" size="md" variant="horizontal" inverted={false} className="min-w-0 shrink-0" />

          {/* Desktop Center Nav Links with active indicator */}
          <nav className="hidden lg:flex min-w-0 items-center justify-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.path}
                className={() =>
                  `whitespace-nowrap rounded-lg px-1.5 py-2 text-xs xl:text-sm font-medium transition-colors hover:text-primary relative ${
                    isNavActive(link.path) ? 'text-primary font-semibold' : 'text-text-muted'
                  }`
                }
              >
                {() => (
                  <>
                    {link.label}
                    {isNavActive(link.path) && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-light-bg transition-colors"
              aria-label="Search destinations and trips"
            >
              <Search className="w-5 h-5" />
            </button>
            {isLoggedIn ? (
              <AccountNav />
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-text hover:text-primary transition-colors px-2 py-1"
                >
                  Login
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/signup')}
                  className="px-5 py-2.5 rounded-full font-semibold shadow-subtle hover:shadow-hover text-sm"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Right: show hamburger only when NOT logged in (bottom nav handles logged-in nav) */}
          <div className="flex lg:hidden items-center gap-2">
            {isLoggedIn ? (
              /* Notification bell stays visible for quick access on mobile header */
              <NotificationBell />
            ) : (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-text hover:bg-light-bg transition-colors"
                aria-label="Toggle Navigation Menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>

        <MobileNavigation isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      </header>

      {/* Main Page Canvas */}
      <main className={`flex-1 min-h-0 flex flex-col ${isExpandedLayout ? 'pb-20 lg:pb-0' : ''}`}>
        <Outlet />
        <MobileSuggestionWidget />
      </main>

      {/* Public Footer */}
      {!isExpandedLayout && (
        <footer className="bg-white border-t border-gray-200/80 mt-6 sm:mt-12 lg:mt-20 pt-8 sm:pt-12 lg:pt-16 pb-28 sm:pb-32 lg:pb-12 text-left">
          <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Grid: Brand Column + Navigation Columns */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-10 items-start">
              {/* Brand Column (full width on mobile, 2 cols on lg) */}
              <div className="col-span-2 lg:col-span-2 flex flex-col gap-3.5">
                <Logo asLink to="/" size="md" variant="horizontal" />
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-md">
                  The travel-community platform to discover trips, connect with compatible travellers, keep travel documents safe, and publish real travel stories.
                </p>

                {/* Trust & Platform Highlights Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-600 font-medium">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Travellers</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-100">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Encrypted Vault</span>
                  </span>
                </div>
              </div>

              {/* Links Column 1: Explore */}
              <div className="col-span-1 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-heading">
                  Explore
                </h4>
                <div className="flex flex-col gap-2">
                  <Link to="/explore" className="text-xs sm:text-sm text-gray-600 hover:text-emerald-700 transition-colors">
                    Destinations
                  </Link>
                  <Link to="/trips" className="text-xs sm:text-sm text-gray-600 hover:text-emerald-700 transition-colors">
                    Find a Trip
                  </Link>
                  <Link to="/stories" className="text-xs sm:text-sm text-gray-600 hover:text-emerald-700 transition-colors">
                    Travel Stories
                  </Link>
                  <Link to="/how-it-works" className="text-xs sm:text-sm text-gray-600 hover:text-emerald-700 transition-colors">
                    How It Works
                  </Link>
                </div>
              </div>

              {/* Links Column 2: Trust & Safety */}
              <div className="col-span-1 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-heading">
                  Trust & Safety
                </h4>
                <div className="flex flex-col gap-2">
                  <Link to="/safety" className="text-xs sm:text-sm text-gray-600 hover:text-emerald-700 transition-colors">
                    Safety Guidelines
                  </Link>
                  <Link to="/vault-security" className="text-xs sm:text-sm text-gray-600 hover:text-emerald-700 transition-colors">
                    Vault Security
                  </Link>
                  <Link to="/community-rules" className="text-xs sm:text-sm text-gray-600 hover:text-emerald-700 transition-colors">
                    Community Rules
                  </Link>
                  <Link to="/about" className="text-xs sm:text-sm text-gray-600 hover:text-emerald-700 transition-colors">
                    About Tripzobox
                  </Link>
                </div>
              </div>

              {/* Links Column 3: Legal & Support (Full width on mobile with clean divider, 1 col on lg) */}
              <div className="col-span-2 lg:col-span-1 flex flex-col gap-3 pt-3 lg:pt-0 border-t border-gray-100 lg:border-t-0">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-heading">
                  Legal & Support
                </h4>
                <div className="flex flex-wrap lg:flex-col items-center lg:items-start gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600">
                  <Link to="/terms" className="hover:text-emerald-700 transition-colors">
                    Terms of Service
                  </Link>
                  <span className="text-gray-300 lg:hidden">•</span>
                  <Link to="/privacy" className="hover:text-emerald-700 transition-colors">
                    Privacy Policy
                  </Link>
                  <span className="text-gray-300 lg:hidden">•</span>
                  <Link to="/contact" className="hover:text-emerald-700 transition-colors">
                    Contact & Support
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Copyright & Crafted With Love Bar */}
            <div className="border-t border-gray-200 mt-8 sm:mt-10 lg:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-gray-500 text-center sm:text-left">
              <p>© {new Date().getFullYear()} Tripzobox. All rights reserved.</p>
              <p className="flex items-center justify-center gap-1">
                Crafted with <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" /> for travellers everywhere.
              </p>
            </div>
          </div>
        </footer>
      )}

      {/* ── Mobile Bottom Navigation (Hidden on lg+) ── */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-border shadow-[0_-2px_16px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-stretch h-16 min-h-[48px]">
          {[
            { label: 'Home', path: isLoggedIn ? '/app/dashboard' : '/', icon: Home, matchPaths: ['/app/dashboard', '/'] },
            { label: 'Explore', path: '/explore', icon: Compass, matchPaths: ['/explore'] },
            { label: 'Trips', path: '/trips', icon: Search, matchPaths: ['/app/trips', '/trips'] },
            { label: 'Trip Diary', path: isLoggedIn ? '/app/diary' : '/stories', icon: BookOpen, matchPaths: ['/app/diary', '/stories', '/app/stories', '/diary'] },
            { label: isLoggedIn ? 'Profile' : 'Log In', path: isLoggedIn ? '/app/profile' : '/login', icon: User, matchPaths: ['/app/profile', '/app/account-security', '/app/vault', '/app/messages', '/app/notifications', '/login', '/signup'] },
          ].map(({ label, path, icon: Icon, matchPaths }) => {
            const isActive = matchPaths.some((mp) =>
              mp === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(mp)
            );
            const isProfile = label === 'Profile';
            return (
              <Link
                key={label}
                to={path}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 transition-colors duration-150 py-1.5 touch-manipulation ${
                  isActive
                    ? 'text-primary'
                    : 'text-text-muted hover:text-primary'
                }`}
              >
                {/* Active indicator pill */}
                {isActive && (
                  <span className="absolute top-0 inset-x-3 h-0.5 rounded-b-full bg-primary" />
                )}
                <span className="relative">
                  <Icon
                    className={`w-6 h-6 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {/* Notification badge on Profile icon */}
                  {isProfile && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-semibold leading-none truncate ${isActive ? 'text-primary' : ''}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
