import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Users, Compass, Share2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export interface AuthPageProps {
  initialMode?: 'signup' | 'login';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAuth();
  const { success } = useToast();

  const isLoginRoute = location.pathname === '/login' || initialMode === 'login';
  const [mode, setMode] = useState<'signup' | 'login'>(isLoginRoute ? 'login' : 'signup');

  // Form State
  const [fullName, setFullName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    setTimeout(async () => {
      if (mode === 'signup') {
        await signup(fullName, emailOrPhone, password);
        success(`Welcome to Tripzobox, ${fullName || 'traveller'}!`, 'Account Created');
      } else {
        await login(emailOrPhone, password);
        success('Welcome back to Tripzobox!', 'Logged In');
      }

      const redirectTarget = location.state?.from?.pathname
        ? `${location.state.from.pathname}${location.state.from.search || ''}`
        : '/app/dashboard';
      setIsLoading(false);
      navigate(redirectTarget);
    }, 600);
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(async () => {
      await login();
      success(`Signed in successfully with ${provider}!`);
      const redirectTarget = location.state?.from?.pathname
        ? `${location.state.from.pathname}${location.state.from.search || ''}`
        : '/app/dashboard';
      setIsLoading(false);
      navigate(redirectTarget);
    }, 400);
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
      <div className="relative lg:w-1/2 min-h-[360px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 text-white overflow-hidden bg-text">
        {/* Full-bleed background images with continuous crossfade */}
        <div className="absolute inset-0 z-0">
          {authSlides.map((slide, index) => (
            <div
              key={slide.url}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === activeSlide ? 'opacity-100 z-1' : 'opacity-0 z-0 pointer-events-none'
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
        <div className="relative z-10 my-auto py-8 text-left">
          <div
            key={activeSlide}
            className="transition-all duration-500 ease-out animate-in fade-in"
          >
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white leading-tight max-w-md">
              {authSlides[activeSlide].headlines.map((line, idx) => (
                <span key={idx} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className="text-xs sm:text-sm text-gray-200 mt-3 max-w-sm leading-relaxed">
              {authSlides[activeSlide].subtitle}
            </p>

            {/* 4 Feature Bullets with Icons */}
            <div className="mt-8 space-y-4 max-w-sm">
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
        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-left">
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
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === activeSlide
                    ? 'w-5 h-1.5 bg-accent shadow-sm'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Form Panel (Matching Screen 2) */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
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
              className={`flex-1 pb-3 text-center text-sm sm:text-base font-semibold relative transition-colors ${
                mode === 'signup' ? 'text-primary' : 'text-text-muted hover:text-text'
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
              className={`flex-1 pb-3 text-center text-sm sm:text-base font-semibold relative transition-colors ${
                mode === 'login' ? 'text-primary' : 'text-text-muted hover:text-text'
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

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative bg-white px-3 text-xs text-text-subtle uppercase">
              or
            </span>
          </div>

          {/* Social Logins */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('Google')}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-white hover:bg-light-bg text-text text-xs sm:text-sm font-semibold transition-all shadow-subtle hover:border-gray-300"
            >
              {/* Google G icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('Apple')}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-white hover:bg-light-bg text-text text-xs sm:text-sm font-semibold transition-all shadow-subtle hover:border-gray-300"
            >
              {/* Apple icon */}
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.93.04-2.07.62-2.73 1.39-.58.67-1.09 1.77-.96 2.82 1.05.08 2.13-.53 2.75-1.28" />
              </svg>
              Continue with Apple
            </button>
          </div>

          {/* Switch mode footer */}
          <div className="mt-8 text-center text-xs text-text-muted">
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
      </div>
    </div>
  );
};
