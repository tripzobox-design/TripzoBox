import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, Compass, Shield, Heart, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const PublicShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore', path: '/explore' },
    { label: 'Trips', path: '/app/trips' },
    { label: 'Stories', path: '/stories/exploring-gods-own-country' },
    { label: 'Safety', path: '/safety' },
    { label: 'About', path: '/about' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-light-bg text-text selection:bg-accent selection:text-text">
      {/* Sticky Top Nav */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-subtle group-hover:scale-105 transition-transform">
              {/* Tripzobox Mountain Pin Logo */}
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm-1.5 8l2.5-3.2 2.5 3.2H14v2h-1v-2h-2.5z" />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-bold text-xl sm:text-2xl text-text tracking-tight leading-none">
                Tripz<span className="text-primary">o</span>box
              </span>
              <span className="text-[10px] text-text-muted font-medium tracking-wide">
                Go Somewhere. Meet Someone.
              </span>
            </div>
          </Link>

          {/* Desktop Center Nav Links */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-primary relative py-1 ${
                    isActive ? 'text-primary font-semibold' : 'text-text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden lg:flex items-center gap-5">
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
              className="px-5 py-2.5 rounded-full font-semibold shadow-subtle hover:shadow-hover"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Right */}
          <div className="flex lg:hidden items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/signup')}
              className="text-xs px-3.5 py-1.5 rounded-full"
            >
              Get Started
            </Button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-text hover:bg-light-bg transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Over Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-border px-6 py-6 flex flex-col gap-4 text-left shadow-float animate-in fade-in slide-in-from-top-4 duration-200">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `text-base font-medium py-2 transition-colors ${
                    isActive ? 'text-primary font-semibold' : 'text-text'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-4 border-t border-border flex flex-col gap-3">
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
                className="w-full"
              >
                Create Account
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Canvas */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-border mt-20 pt-16 pb-12 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            {/* Brand column */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm-1.5 8l2.5-3.2 2.5 3.2H14v2h-1v-2h-2.5z" />
                  </svg>
                </div>
                <span className="font-heading font-bold text-xl text-text">
                  Tripz<span className="text-primary">o</span>box
                </span>
              </Link>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-sm">
                The travel-community platform to discover trips, connect with compatible travellers, keep travel documents safe, and publish real travel stories.
              </p>
              <p className="text-xs font-semibold text-primary">
                "Go Somewhere. Meet Someone."
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
              <Link to="/app/trips" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
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
              <Link to="/app/vault" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
                Travel Vault Security
              </Link>
              <Link to="/safety#community-rules" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
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
              <Link to="/about#contact" className="text-xs sm:text-sm text-text-muted hover:text-primary transition-colors">
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
