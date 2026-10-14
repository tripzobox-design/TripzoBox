import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Compass, Shield, Heart, ArrowRight, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';

export const PublicShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

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

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore', path: '/explore' },
    { label: 'Trips', path: '/trips' },
    { label: 'Stories', path: '/stories/exploring-gods-own-country' },
    { label: 'Safety', path: '/safety' },
    { label: 'About', path: '/about' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-light-bg text-text selection:bg-accent selection:text-text">
      {/* Top Nav: Liquid Light Glass Floating Dock */}
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300">
        <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pointer-events-auto">
          <div
            className={`transition-all duration-300 rounded-2xl sm:rounded-full px-4 sm:px-6 flex items-center justify-between ${
              isScrolled
                ? 'h-16 bg-white/92 backdrop-blur-2xl backdrop-saturate-200 border border-white/90 shadow-[0_14px_40px_-8px_rgba(15,144,88,0.14),0_4px_16px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,1)]'
                : 'h-16 sm:h-18 bg-white/85 backdrop-blur-2xl backdrop-saturate-180 border border-white/80 shadow-[0_10px_30px_-5px_rgba(15,144,88,0.09),0_2px_10px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.95)]'
            }`}
          >
            {/* Logo: Light theme with full color mark & typography */}
            <Logo asLink to="/" size="sm" variant="horizontal" inverted={false} />

            {/* Desktop Center Nav Links: Liquid Glass Track with Fluid Active Pill */}
            <nav className="hidden lg:flex items-center gap-1 p-1 bg-black/[0.03] backdrop-blur-md rounded-full border border-black/[0.04]" aria-label="Main Navigation">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.path}
                  className={({ isActive }) =>
                    `text-xs sm:text-sm font-medium transition-all duration-200 px-4 py-1.5 rounded-full ${
                      isActive
                        ? 'bg-white text-primary font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)]'
                        : 'text-text/75 hover:text-primary hover:bg-white/60'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Right CTAs: Liquid Glass Pills */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-text/70 hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="Search destinations and trips"
              >
                <Search className="w-4 h-4" />
              </button>
              {isLoggedIn ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/app/dashboard')}
                  className="px-5 py-2 rounded-full font-semibold shadow-md shadow-primary/20 hover:shadow-primary/35 text-xs sm:text-sm"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-full text-text hover:text-primary border border-border/80 hover:border-primary/50 bg-white/70 hover:bg-white backdrop-blur-md shadow-xs transition-all"
                  >
                    Login
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/signup')}
                    className="px-5 py-2 rounded-full font-semibold bg-gradient-to-r from-primary to-[#18a86a] hover:from-[#0da765] hover:to-primary text-white shadow-md shadow-primary/25 hover:shadow-primary/40 text-xs sm:text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Right */}
            <div className="flex lg:hidden items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(isLoggedIn ? '/app/dashboard' : '/signup')}
                className="text-xs px-3.5 py-1.5 rounded-full"
              >
                {isLoggedIn ? 'Dashboard' : 'Get Started'}
              </Button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-text hover:bg-black/5 transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Liquid Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-2 bg-white/95 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-2xl p-5 flex flex-col gap-2.5 text-left animate-in fade-in slide-in-from-top-2 duration-200">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-text hover:bg-light-bg'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <Link
                  to="/explore"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-primary hover:bg-light-bg flex items-center justify-between"
                >
                  <span>Explore Search</span>
                  <Search className="w-4 h-4" />
                </Link>
                {isLoggedIn ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/app/dashboard');
                    }}
                    className="w-full rounded-xl py-2.5"
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 text-sm font-semibold text-text border border-border rounded-xl hover:bg-light-bg"
                    >
                      Login
                    </Link>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/signup');
                      }}
                      className="w-full rounded-xl py-2.5"
                    >
                      Create Account
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Page Canvas */}
      <main className={`flex-1 ${isHome ? '' : 'pt-24 sm:pt-28'}`}>
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-border mt-20 pt-16 pb-12 text-left">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            {/* Brand column */}
            <div className="md:col-span-2 flex flex-col gap-4">
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
              <Link to="/stories/exploring-gods-own-country" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
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
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-text uppercase tracking-wider font-heading">
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

          <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
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
