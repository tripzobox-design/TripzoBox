import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Globe,
  ArrowLeft,
  ArrowRight,
  Compass,
  MapPin,
  Trees,
  Landmark,
  Utensils,
  Camera,
  Waves,
  Mountain,
  Car,
  Building2,
  Bird,
  Users,
  Heart,
  Home,
  Check,
  Send,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Logo } from '../components/ui/Logo';
import { AuthStepper } from '../components/auth/AuthStepper';
import { SocialAuthButtons } from '../components/auth/SocialAuthButtons';
import { BotanicalLeavesAccent } from '../components/auth/BotanicalLeavesAccent';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export interface AuthPageProps {
  initialMode?: 'signup' | 'login';
}

type AuthMode = 'signup' | 'login';
type SignUpStep = 1 | 2 | 3 | 'verify-email';

const TRAVEL_INTERESTS = [
  { id: 'Adventure', label: 'Adventure', icon: Compass },
  { id: 'Nature', label: 'Nature', icon: Trees },
  { id: 'Culture', label: 'Culture', icon: Landmark },
  { id: 'Food', label: 'Food', icon: Utensils },
  { id: 'Photography', label: 'Photography', icon: Camera },
  { id: 'Beaches', label: 'Beaches', icon: Waves },
  { id: 'Mountains', label: 'Mountains', icon: Mountain },
  { id: 'Road Trips', label: 'Road Trips', icon: Car },
  { id: 'Cities', label: 'Cities', icon: Building2 },
  { id: 'Wildlife', label: 'Wildlife', icon: Bird },
];

const TRAVEL_STYLES = [
  { id: 'Solo', label: 'Solo', icon: UserIcon },
  { id: 'Group', label: 'Group', icon: Users },
  { id: 'Couple', label: 'Couple', icon: Heart },
  { id: 'Family', label: 'Family', icon: Home },
];

const POPULAR_COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'United Arab Emirates',
  'Singapore',
  'Japan',
  'Italy',
  'Spain',
  'Thailand',
  'Malaysia',
  'Indonesia',
  'New Zealand',
  'Switzerland',
  'Netherlands',
];

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, user, updateProfile } = useAuth();
  const { success, error } = useToast();

  const isLoginPath = location.pathname === '/login' || initialMode === 'login';
  const [mode, setMode] = useState<AuthMode>(isLoginPath ? 'login' : 'signup');
  const [signUpStep, setSignUpStep] = useState<SignUpStep>(1);

  // Sync mode if route changes
  useEffect(() => {
    if (location.pathname === '/login') {
      setMode('login');
    } else if (location.pathname === '/signup') {
      setMode('signup');
    }
  }, [location.pathname]);

  // Form Inputs: Step 1 (Account Credentials)
  const [fullName, setFullName] = useState(user.name || '');
  const [emailOrPhone, setEmailOrPhone] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form Inputs: Step 2 (Personal Info)
  const [gender, setGender] = useState<'female' | 'male' | 'non-binary' | 'prefer-not-to-say'>(
    user.gender || 'prefer-not-to-say'
  );
  const [birthDate, setBirthDate] = useState(user.birthDate || '');
  const [country, setCountry] = useState(user.country || 'India');

  // Form Inputs: Step 3 (Preferences)
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    user.travelInterests && user.travelInterests.length > 0
      ? user.travelInterests
      : ['Adventure', 'Nature', 'Photography', 'Mountains']
  );
  const [travelStyle, setTravelStyle] = useState<string>(user.travelStyle || 'Solo');

  // Email Verification Step State
  const [resendCooldown, setResendCooldown] = useState(0);

  // Field validation errors
  const [errors, setErrors] = useState<{
    fullName?: string;
    emailOrPhone?: string;
    password?: string;
  }>({});

  const validateStep1 = () => {
    const errs: typeof errors = {};
    if (mode === 'signup' && !fullName.trim()) {
      errs.fullName = 'Full Name is required';
    }
    if (!emailOrPhone.trim()) {
      errs.emailOrPhone = 'Email or phone number is required';
    } else if (
      emailOrPhone.includes('@') &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone.trim())
    ) {
      errs.emailOrPhone = 'Please enter a valid email address';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getRedirectTarget = () => {
    if (location.state?.from?.pathname) {
      return `${location.state.from.pathname}${location.state.from.search || ''}`;
    }
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');
    if (redirectParam && redirectParam.startsWith('/')) {
      return redirectParam;
    }
    return '/app/dashboard';
  };

  // Submit Step 1 / Login
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setIsLoading(true);

    if (mode === 'login') {
      try {
        await login(emailOrPhone, password);
        success('Welcome back to Tripzobox!', 'Logged In');
        setIsLoading(false);
        navigate(getRedirectTarget());
      } catch (err: any) {
        setIsLoading(false);
        error(err.message || 'Invalid email or password', 'Login Failed');
      }
    } else {
      // Sign Up: Advance to Step 2 (Personal Info)
      try {
        await signup(fullName, emailOrPhone, password);
        setIsLoading(false);
        setSignUpStep(2);
      } catch (err: any) {
        setIsLoading(false);
        error(err.message || 'An error occurred during registration', 'Signup Failed');
      }
    }
  };

  // Social Auth Handlers
  const handleSocialAuth = (provider: 'Google' | 'Apple') => {
    setIsLoading(true);
    setTimeout(async () => {
      await signup(fullName || 'Mubarak Ali', 'mubarakallansari@gmail.com');
      success(`Successfully signed in with ${provider}!`, 'Welcome');
      setIsLoading(false);
      navigate(getRedirectTarget());
    }, 500);
  };

  // Step 2 -> Step 3
  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      gender,
      birthDate,
      country,
    });
    setSignUpStep(3);
  };

  // Step 3 -> Create Account & Verification
  const handleStep3Submit = () => {
    setIsLoading(true);
    setTimeout(() => {
      updateProfile({
        travelInterests: selectedInterests,
        travelStyle,
      });
      setIsLoading(false);
      // Trigger subtle celebration
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
      setSignUpStep('verify-email');
      setResendCooldown(60);
    }, 400);
  };

  // Toggle Interest Pill
  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Cooldown countdown for resending verification email
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    success(
      `A new verification link has been sent to ${emailOrPhone || 'your email'}!`,
      'Email Sent'
    );
  };

  const handleVerificationComplete = () => {
    updateProfile({ emailVerified: true });
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 },
    });
    success('Email verified successfully! Welcome to Tripzobox.', 'Verified');
    navigate(getRedirectTarget());
  };

  // =========================================================================
  // MULTI-STEP FLOWS (Steps 2, 3, and Verify Email)
  // Matching Screens 2, 3, and 4
  // =========================================================================

  if (mode === 'signup' && signUpStep !== 1) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between relative overflow-x-hidden">
        {/* Header with Logo */}
        <header className="w-full py-4 sm:py-6 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {signUpStep === 'verify-email' && (
              <button
                type="button"
                onClick={() => setSignUpStep(3)}
                aria-label="Go back"
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Logo asLink to="/" size="sm" variant="horizontal" />
          </div>
        </header>

        {/* ========================================================================= */}
        {/* SCREEN 2: Step 2: Personal Info */}
        {/* ========================================================================= */}
        {signUpStep === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-8 z-10 animate-in fade-in duration-300">
            {/* Stepper */}
            <AuthStepper
              currentStep={2}
              onStepClick={(s) => {
                if (s === 1) setSignUpStep(1);
              }}
              className="mb-6 sm:mb-8"
            />

            {/* Content Container */}
            <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200/90 shadow-card p-6 sm:p-10 text-left">
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
                Tell us a bit more about you
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5 mb-6 sm:mb-8 leading-relaxed">
                This helps us connect you with the right trips and people.
              </p>

              <form onSubmit={handleStep2Next} className="space-y-5">
                {/* 1. Gender (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Gender <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    <option value="prefer-not-to-say">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                {/* 2. Date of Birth (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Date of Birth <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      placeholder="DD / MM / YYYY"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* 3. Country (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Country <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="">Select country</option>
                      {POPULAR_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSignUpStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-primary transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: Step 3: Preferences */}
        {/* ========================================================================= */}
        {signUpStep === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-8 z-10 animate-in fade-in duration-300">
            {/* Stepper */}
            <AuthStepper
              currentStep={3}
              onStepClick={(s) => {
                if (s === 1) setSignUpStep(1);
                if (s === 2) setSignUpStep(2);
              }}
              className="mb-6 sm:mb-8"
            />

            {/* Content Container */}
            <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-200/90 shadow-card p-6 sm:p-10 text-left relative overflow-hidden">
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
                Your travel preferences
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5 mb-6 sm:mb-8 leading-relaxed">
                Help us suggest trips and destinations that match your interests.
              </p>

              <div className="space-y-6">
                {/* Interests (Select all that apply) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs sm:text-sm font-semibold text-gray-800">
                      Interests <span className="text-gray-400 font-normal">(Select all that apply)</span>
                    </label>
                    <span className="text-[11px] text-primary font-semibold">
                      {selectedInterests.length} selected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                    {TRAVEL_INTERESTS.map((item) => {
                      const isSelected = selectedInterests.includes(item.id);
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleInterest(item.id)}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50/90 border-primary text-primary ring-1 ring-primary/30 shadow-2xs'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-primary' : 'text-gray-500'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Travel Style */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-3">
                    Preferred Travel Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                    {TRAVEL_STYLES.map((style) => {
                      const isSelected = travelStyle === style.id;
                      const Icon = style.icon;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setTravelStyle(style.id)}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50/90 border-primary text-primary ring-1 ring-primary/30 shadow-2xs'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-primary' : 'text-gray-500'
                            }`}
                          />
                          <span>{style.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSignUpStep(2)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-primary transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStep3Submit}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center px-7 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: Verify your email */}
        {/* ========================================================================= */}
        {signUpStep === 'verify-email' && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-8 z-10 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200/90 shadow-card p-6 sm:p-10 text-center relative overflow-hidden">
              {/* Paper Plane Icon in circular badge */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100/80 text-primary flex items-center justify-center mx-auto mb-5 shadow-xs">
                <Send className="w-8 h-8 sm:w-9 sm:h-9 translate-x-0.5 -translate-y-0.5" />
              </div>

              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
                Verify your email
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 mb-1">
                We've sent a verification link to
              </p>
              <p className="font-heading font-bold text-sm sm:text-base text-gray-900 mb-4">
                {emailOrPhone || 'mubarakallansari@gmail.com'}
              </p>

              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-6 sm:mb-8">
                Check your inbox and click the link to verify your account. If you don't see it,
                check your spam folder.
              </p>

              <div className="max-w-xs mx-auto space-y-3.5">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resendCooldown > 0}
                  className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : 'Resend Email'}
                </button>

                <button
                  type="button"
                  onClick={handleVerificationComplete}
                  className="w-full py-3 rounded-xl border border-gray-200 hover:border-primary text-gray-700 hover:text-primary font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-primary stroke-[2.5]" />
                  <span>I've verified my email</span>
                </button>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Didn't receive the email?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setSignUpStep(1);
                    }}
                    className="font-semibold text-primary hover:underline ml-1 cursor-pointer"
                  >
                    Check another email
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botanical Leaves Accent matching design */}
        <BotanicalLeavesAccent />
      </div>
    );
  }

  // =========================================================================
  // SPLIT SCREEN: SCREEN 1 (Sign Up Step 1) & SCREEN 5 (Login)
  // High-fidelity split layout with left imagery, logo, quote, tabs, and inputs
  // =========================================================================
  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-x-hidden">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: Visual Brand Pane */}
      {/* Matches Screen 1 for Sign Up, Screen 5 for Login */}
      {/* ========================================================================= */}
      <div className="relative lg:w-1/2 lg:min-h-screen min-h-[260px] sm:min-h-[340px] flex flex-col justify-between p-5 sm:p-10 lg:p-14 text-white overflow-hidden bg-emerald-950">
        {/* Full-bleed background image with smooth crossfade */}
        <div className="absolute inset-0 z-0">
          <img
            src={
              isLogin
                ? 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85'
                : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=85'
            }
            alt={isLogin ? 'Scenic mountain lake vista' : 'Majestic alpine summit'}
            className="w-full h-full object-cover transform scale-105 transition-all duration-1000 ease-out"
          />
          {/* Refined gradient overlay for high contrast and rich atmosphere */}
          <div className="absolute inset-0 z-1 bg-gradient-to-t from-black/90 via-black/45 to-black/55" />
        </div>

        {/* Top: Tripzobox Logo Inverted (White) & Location Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <Logo asLink to="/" size="md" variant="horizontal" inverted />
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[11px] font-medium text-emerald-200 shadow-2xs">
            <MapPin className="w-3 h-3 text-[#bef264]" />
            <span>{isLogin ? 'Yosemite Valley, CA' : 'Dolomites, Italian Alps'}</span>
          </div>
        </div>

        {/* Center / Poetic Typography matching image */}
        <div className="relative z-10 my-auto py-3 sm:py-8 lg:py-12 text-left">
          {isLogin ? (
            <div className="animate-in fade-in duration-500 space-y-2 sm:space-y-4">
              <h1 className="font-heading font-extrabold text-xl sm:text-3xl lg:text-[42px] text-white tracking-tight leading-snug sm:leading-[1.18] drop-shadow-md max-w-lg">
                “Travel isn’t where you go, but <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-[#bef264]">who you become</span> along the way.”
              </h1>

              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-md leading-relaxed font-normal">
                Log in to reconnect with fellow adventurers, update your travel diary, and discover upcoming journeys.
              </p>

              <div className="flex pt-3 sm:pt-4 items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-white/80">
                <div className="flex -space-x-2 overflow-hidden">
                  <img
                    className="inline-block h-6 w-6 sm:h-7 sm:w-7 rounded-full ring-2 ring-emerald-900 object-cover"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                    alt="Traveler"
                  />
                  <img
                    className="inline-block h-6 w-6 sm:h-7 sm:w-7 rounded-full ring-2 ring-emerald-900 object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt="Traveler"
                  />
                  <img
                    className="inline-block h-6 w-6 sm:h-7 sm:w-7 rounded-full ring-2 ring-emerald-900 object-cover"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                    alt="Traveler"
                  />
                </div>
                <span className="font-medium">
                  Over <strong className="text-white font-bold">10,000+</strong> journeys shared across 40+ destinations
                </span>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500 space-y-2 sm:space-y-4">
              <h1 className="font-heading font-extrabold text-xl sm:text-3xl lg:text-[42px] text-white tracking-tight leading-snug sm:leading-[1.18] drop-shadow-md max-w-lg">
                “The world is too big to stay in one place, and life is too short to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-[#bef264]">explore alone</span>.”
              </h1>

              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-md leading-relaxed font-normal">
                Join our verified community of travellers exploring offbeat trails, group expeditions, and unforgettable memories together.
              </p>

              <div className="flex pt-3 sm:pt-4 items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-white/80">
                <div className="flex -space-x-2 overflow-hidden">
                  <img
                    className="inline-block h-6 w-6 sm:h-7 sm:w-7 rounded-full ring-2 ring-emerald-900 object-cover"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                    alt="Traveler"
                  />
                  <img
                    className="inline-block h-6 w-6 sm:h-7 sm:w-7 rounded-full ring-2 ring-emerald-900 object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt="Traveler"
                  />
                  <img
                    className="inline-block h-6 w-6 sm:h-7 sm:w-7 rounded-full ring-2 ring-emerald-900 object-cover"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                    alt="Traveler"
                  />
                </div>
                <span className="font-medium">
                  Join <strong className="text-white font-bold">15,000+</strong> verified adventurers worldwide
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom subtle quote / brand tagline */}
        <div className="hidden lg:flex relative z-10 pt-4 border-t border-white/20 items-center justify-between text-xs text-emerald-200/90">
          <span>Explore The World Without Limits</span>
          <span>© Tripzobox · Verified Travel Community</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: Interactive Form Panel */}
      {/* Matches Screen 1 for Sign Up, Screen 5 for Login */}
      {/* ========================================================================= */}
      <div className="lg:w-1/2 flex items-center justify-center px-5 py-6 sm:p-8 lg:p-14 bg-white overflow-y-auto">
        <div className="w-full max-w-md flex flex-col text-left">
          {/* Top Tabs: Sign Up | Login */}
          <div className="flex items-center border-b border-gray-200 mb-4 sm:mb-8">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrors({});
              }}
              className={`flex-1 pb-2.5 sm:pb-3 text-center text-sm sm:text-base font-semibold relative transition-colors cursor-pointer ${
                mode === 'signup' ? 'text-primary' : 'text-gray-400 hover:text-gray-700'
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
              }}
              className={`flex-1 pb-2.5 sm:pb-3 text-center text-sm sm:text-base font-semibold relative transition-colors cursor-pointer ${
                mode === 'login' ? 'text-primary' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Login
              {mode === 'login' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Form Header Titles */}
          <div className="mb-3.5 sm:mb-6">
            <h2 className="font-heading font-extrabold text-xl sm:text-3xl text-gray-900 tracking-tight">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {isLogin ? 'Log in to continue your journey' : 'Join our community of travellers'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleStep1Submit} className="space-y-3 sm:space-y-4" noValidate>
            {/* Full Name (Sign Up only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 sm:left-3.5 text-gray-400 pointer-events-none">
                    <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                    }}
                    placeholder="Enter your full name"
                    className={`w-full bg-white text-gray-900 text-xs sm:text-sm rounded-lg sm:rounded-xl border pl-9 sm:pl-10 pr-3.5 sm:pr-4 py-2 sm:py-3 outline-none transition-all ${
                      errors.fullName
                        ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-[10px] sm:text-[11px] text-red-600 font-medium mt-0.5 sm:mt-1">{errors.fullName}</p>
                )}
              </div>
            )}

            {/* Email or Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email or Phone Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 sm:left-3.5 text-gray-400 pointer-events-none">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => {
                    setEmailOrPhone(e.target.value);
                    if (errors.emailOrPhone)
                      setErrors((prev) => ({ ...prev, emailOrPhone: undefined }));
                  }}
                  placeholder="Enter your email or phone number"
                  className={`w-full bg-white text-gray-900 text-xs sm:text-sm rounded-lg sm:rounded-xl border pl-9 sm:pl-10 pr-3.5 sm:pr-4 py-2 sm:py-3 outline-none transition-all ${
                    errors.emailOrPhone
                      ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.emailOrPhone && (
                <p className="text-[10px] sm:text-[11px] text-red-600 font-medium mt-0.5 sm:mt-1">{errors.emailOrPhone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 sm:left-3.5 text-gray-400 pointer-events-none">
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                  className={`w-full bg-white text-gray-900 text-xs sm:text-sm rounded-lg sm:rounded-xl border pl-9 sm:pl-10 pr-10 sm:pr-11 py-2 sm:py-3 outline-none transition-all ${
                    errors.password
                      ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 sm:right-3.5 text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] sm:text-[11px] text-red-600 font-medium mt-0.5 sm:mt-1">{errors.password}</p>
              )}
            </div>

            {/* Login Only: Remember Me & Forgot Password row */}
            {isLogin && (
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none text-gray-600 text-[11px] sm:text-xs">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-primary focus:ring-primary/20 border-gray-300 cursor-pointer accent-primary"
                  />
                  <span>Remember me</span>
                </label>

                <Link
                  to="/forgot-password"
                  className="font-semibold text-primary hover:text-primary-hover hover:underline transition-colors text-[11px] sm:text-xs"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 sm:py-3.5 rounded-lg sm:rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm sm:text-base shadow-xs transition-colors cursor-pointer disabled:opacity-60 mt-1.5 sm:mt-2"
            >
              {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          {/* Divider 'or' */}
          <div className="relative my-3 sm:my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-3 text-xs text-gray-400 uppercase tracking-wider font-medium">
              or
            </span>
          </div>

          {/* Social Auth Buttons */}
          <SocialAuthButtons
            isLoading={isLoading}
            onGoogleClick={() => handleSocialAuth('Google')}
            onAppleClick={() => handleSocialAuth('Apple')}
          />

          {/* Footer mode switch */}
          <div className="mt-3.5 sm:mt-6 text-center text-xs text-gray-500">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrors({});
                  }}
                  className="font-semibold text-primary hover:underline ml-1 cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrors({});
                  }}
                  className="font-semibold text-primary hover:underline ml-1 cursor-pointer"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
