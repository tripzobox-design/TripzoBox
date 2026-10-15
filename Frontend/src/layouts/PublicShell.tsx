import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Compass, Shield, Heart, ArrowRight, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { AccountNav } from '../components/common/AccountNav';
import { MobileNavigation } from '../components/common/MobileNavigation';
import { NotificationBell } from '../components/common/NotificationBell';

export const PublicShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isNavActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path) || location.pathname.startsWith('/app' + path);

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
  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore', path: '/explore' },
    { label: 'Trips', path: '/trips' },
    { label: 'Stories', path: '/stories' },
    { label: 'Safety', path: '/safety' },
    { label: 'About', path: '/about' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-light-bg text-text selection:bg-accent selection:text-text">
      {/* Top Nav: Full-width sticky light-themed navbar across all pages */}
      <header className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border transition-all duration-200 ${
        isScrolled ? 'shadow-subtle' : 'shadow-xs'
      }`}>
        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo: Consistent light theme with brand colors */}
          <Logo asLink to="/" size="md" variant="horizontal" inverted={false} className="min-w-0 shrink-0 [&>img]:h-auto [&>img]:w-[156px] sm:[&>img]:w-[180px]" />

          {/* Desktop Center Nav Links with active indicator */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.path}
                className={() =>
                  `text-sm font-medium transition-colors hover:text-primary relative py-1 ${
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

          {/* Mobile Right */}
          <div className="flex lg:hidden items-center gap-2">
            {isLoggedIn && <NotificationBell />}
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
          </div>
        </div>

        <MobileNavigation isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      </header>

      {/* Main Page Canvas */}
      <main>
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-border mt-3 lg:mt-20 pt-4 lg:pt-16 pb-4 lg:pb-12 text-left">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-10">
            {/* Brand column */}
            <div className="col-span-2 flex flex-col gap-3 lg:gap-4">
              <Logo asLink to="/" size="md" variant="horizontal" />
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-sm">
                The travel-community platform to discover trips, connect with compatible travellers, keep travel documents safe, and publish real travel stories.
              </p>
              <p className="text-xs font-semibold text-primary">
                "Unbox Your Next Adventure."
              </p>
            </div>

            {/* Links Column 1: Explore & Trips */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-text uppercase tracking-wider font-heading">
                Explore
              </h4>
              <Link to="/explore" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
                Destinations
              </Link>
              <Link to="/trips" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
                Find a Trip
              </Link>
              <Link to="/stories" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
                Travel Stories
              </Link>
              <Link to="/how-it-works" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
                How It Works
              </Link>
            </div>

            {/* Links Column 2: Trust & Safety */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-text uppercase tracking-wider font-heading">
                Trust & Safety
              </h4>
              <Link to="/safety" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
                Safety Guidelines
              </Link>
              <Link to="/vault-security" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
                Travel Vault Security
              </Link>
              <Link to="/community-rules" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
                Community Rules
              </Link>
              <Link to="/about" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
                About Tripzobox
              </Link>
            </div>

            {/* Links Column 3: Legal & Support */}
            <div className="col-span-2 lg:col-span-1 flex flex-wrap lg:flex-col gap-x-4 gap-y-2 lg:gap-3">
              <h4 className="w-full text-xs font-bold text-text uppercase tracking-wider font-heading">
                Legal & Support
              </h4>
              <Link to="/terms" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/contact" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
                Contact & Support
              </Link>
            </div>
          </div>

          <div className="border-t border-border mt-4 lg:mt-12 pt-3 lg:pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 lg:gap-4 text-xs text-text-muted">
            <p>© {new Date().getFullYear()} Tripzobox. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Crafted with <Heart className="w-3.5 h-3.5 text-primary fill-primary" /> for travellers everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
