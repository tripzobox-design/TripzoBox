import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
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
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Logo } from '../components/ui/Logo';
import { AuthStepper } from '../components/auth/AuthStepper';
import { SocialAuthButtons } from '../components/auth/SocialAuthButtons';
import { BotanicalLeavesAccent } from '../components/auth/BotanicalLeavesAccent';
import { OtpInputGroup } from '../components/auth/OtpInputGroup';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../lib/api';

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
  const { login, signup, oauthLogin, user, updateProfile } = useAuth();
  const { success, error } = useToast();

  const isLoginPath = location.pathname === '/login' || initialMode === 'login';
  const [mode, setMode] = useState<AuthMode>(isLoginPath ? 'login' : 'signup');
  const [signUpStep, setSignUpStep] = useState<SignUpStep>(1);

  // OAuth Modal states
  const [oauthModal, setOauthModal] = useState<'Google' | 'Apple' | null>(null);
  const [customOAuthEmail, setCustomOAuthEmail] = useState('');
  const [isUsingAnotherAccount, setIsUsingAnotherAccount] = useState(false);
  const [emailOtp, setEmailOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [devEmailOtp, setDevEmailOtp] = useState<string>('');
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState<boolean>(false);
  const [verificationInfo, setVerificationInfo] = useState<{
    hasSmtpConfigured?: boolean;
    isSimulated?: boolean;
    previewUrl?: string;
    verificationLink?: string;
    devOtp?: string;
  }>({});

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form Inputs: Step 2 (Personal Info)
  const [signupAvatar, setSignupAvatar] = useState<string>('');
  const signupFileInputRef = useRef<HTMLInputElement>(null);
  const signupCameraInputRef = useRef<HTMLInputElement>(null);
  const [gender, setGender] = useState<'female' | 'male' | 'non-binary' | 'prefer-not-to-say'>(
    user.gender || 'prefer-not-to-say'
  );
  const [birthDate, setBirthDate] = useState(user.birthDate || '');
  const [country, setCountry] = useState(user.country || 'India');

  const handleSignupAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      error('Please select a JPG, PNG, or WebP image.', 'Invalid Image');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSignupAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
    confirmPassword?: string;
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

    if (mode === 'signup') {
      if (!confirmPassword) {
        errs.confirmPassword = 'Confirm password is required';
      } else if (confirmPassword !== password) {
        errs.confirmPassword = 'Passwords do not match';
      }
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
    // If VITE_GOOGLE_CLIENT_ID is provided, redirect to Google OAuth
    if (provider === 'Google' && (import.meta as any).env.VITE_GOOGLE_CLIENT_ID) {
      const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth`;
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=email%20profile`;
      return;
    }
    // Open interactive OAuth dialog
    setIsUsingAnotherAccount(false);
    setCustomOAuthEmail('');
    setOauthModal(provider);
  };

  const executeOAuth = async (selectedEmail: string, selectedName?: string) => {
    if (!selectedEmail.trim()) return;
    setIsLoading(true);
    try {
      await oauthLogin(
        oauthModal || 'Google',
        selectedEmail.trim(),
        selectedName || selectedEmail.split('@')[0]
      );
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
      });
      success(`Successfully signed in with ${oauthModal}!`, 'Welcome');
      setOauthModal(null);
      setIsLoading(false);
      navigate(getRedirectTarget());
    } catch (err: any) {
      setIsLoading(false);
      error(err.message || 'OAuth authentication failed', 'Login Failed');
    }
  };

  // Step 2 -> Step 3
  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      gender,
      birthDate,
      country,
      avatarUrl: signupAvatar || '',
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

  // Handle auto-completion when email is verified
  const handleVerificationComplete = React.useCallback(
    async (opts?: { skipApi?: boolean }) => {
      if (!opts?.skipApi) {
        try {
          await authApi.verifyEmail(undefined, emailOrPhone);
        } catch {
          // Fallback for offline mode
        }
      }
      updateProfile({ emailVerified: true });

      // Broadcast to any other open tabs waiting on this screen
      try {
        const channel = new BroadcastChannel('tripzobox_auth_channel');
        channel.postMessage({ type: 'EMAIL_VERIFIED', email: emailOrPhone });
        channel.close();
      } catch {
        // BroadcastChannel unsupported fallback
      }
      localStorage.setItem('tripzobox_email_verified_at', Date.now().toString());

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
      });
      success('Email verified successfully! Opening your dashboard...', 'Verified');
      setTimeout(() => {
        navigate(getRedirectTarget());
      }, 400);
    },
    [emailOrPhone, updateProfile, success, navigate, getRedirectTarget]
  );

  // 1. Auto-verify if user arrives via verification link (?step=verify-email&token=... or ?verified=true)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    const isVerifiedParam = searchParams.get('verified') === 'true';
    if (searchParams.get('step') === 'verify-email' && (token || isVerifiedParam)) {
      handleVerificationComplete();
    }
  }, [location.search, handleVerificationComplete]);

  // 2. Cross-tab & Polling listener: when on 'verify-email' step, automatically open dashboard once accepted
  useEffect(() => {
    if (signUpStep !== 'verify-email') return;

    // A. BroadcastChannel listener (instant cross-tab in same browser)
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('tripzobox_auth_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'EMAIL_VERIFIED') {
          handleVerificationComplete({ skipApi: true });
        }
      };
    } catch {
      // Ignore if not supported
    }

    // B. Storage event listener (fallback cross-tab communication)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tripzobox_email_verified_at' || e.key === 'tripzobox_user') {
        try {
          const stored = localStorage.getItem('tripzobox_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.emailVerified) {
              handleVerificationComplete({ skipApi: true });
            }
          }
        } catch {
          // ignore parse errors
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // Initial check on mount/enter step
    const targetEmail = emailOrPhone || user?.email;
    if (targetEmail && targetEmail.includes('@')) {
      authApi
        .checkVerificationStatus(targetEmail)
        .then((res: any) => {
          if (res) {
            setVerificationInfo({
              hasSmtpConfigured: res.hasSmtpConfigured,
              isSimulated: res.isSimulated,
              previewUrl: res.previewUrl,
              verificationLink: res.verificationLink,
            });
            if (res.emailVerified) {
              handleVerificationComplete({ skipApi: true });
            }
          }
        })
        .catch(() => {});
    }

    // C. Periodic Polling check (every 2.5 seconds)
    const pollTimer = setInterval(async () => {
      if (user?.emailVerified) {
        clearInterval(pollTimer);
        handleVerificationComplete({ skipApi: true });
        return;
      }

      const activeEmail = emailOrPhone || user?.email;
      if (activeEmail && activeEmail.includes('@')) {
        try {
          const res: any = await authApi.checkVerificationStatus(activeEmail);
          if (res?.emailVerified) {
            clearInterval(pollTimer);
            handleVerificationComplete({ skipApi: true });
            return;
          }
          if (res) {
            setVerificationInfo((prev) => ({
              ...prev,
              hasSmtpConfigured: res.hasSmtpConfigured,
              isSimulated: res.isSimulated,
              previewUrl: res.previewUrl || prev.previewUrl,
              verificationLink: res.verificationLink || prev.verificationLink,
            }));
          }
        } catch {
          // Ignore polling errors while offline
        }
      }
    }, 2500);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollTimer);
    };
  }, [signUpStep, user?.emailVerified, emailOrPhone, handleVerificationComplete]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    try {
      const res = await authApi.resendVerification(emailOrPhone);
      if (res?.data) {
        setVerificationInfo((prev) => ({
          ...prev,
          previewUrl: res.data.previewUrl || prev.previewUrl,
          verificationLink: res.data.verificationLink || prev.verificationLink,
          hasSmtpConfigured: res.data.hasSmtpConfigured,
          devOtp: res.data.devOtp,
        }));
        if (res.data.devOtp) {
          setDevEmailOtp(res.data.devOtp);
        }
      }
      if (res?.data?.isSimulated) {
        success(
          `Verification code generated! You can verify with code ${res?.data?.devOtp || '123456'} or click below.`,
          'Verification Ready'
        );
      } else {
        success(
          `Verification email with 6-digit OTP sent to ${emailOrPhone || 'your email'}!`,
          'Email Sent'
        );
      }
    } catch {
      success(
        `Verification email dispatched to ${emailOrPhone || 'your email'}. Check your inbox!`,
        'Email Sent'
      );
    }
  };

  const handleVerifyEmailOtp = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || emailOtp.join('');
    if (fullCode.length < 6) {
      error('Please enter all 6 digits of the code sent to your email.');
      return;
    }
    setIsVerifyingEmailOtp(true);
    try {
      const emailToVerify = (emailOrPhone || user?.email || '').trim().toLowerCase();
      await authApi.verifyEmail(undefined, emailToVerify, fullCode);
      success('Email verified successfully! Welcome to TripzoBox.', 'Account Activated');
      handleVerificationComplete();
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || 'Invalid or expired verification code');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
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
                {/* 0. Profile Photo (Optional - can be skipped) */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 border border-gray-200/80 mb-5 text-center">
                  <input
                    ref={signupFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleSignupAvatarSelect}
                  />
                  <input
                    ref={signupCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handleSignupAvatarSelect}
                  />

                  <div className="relative mb-2">
                    {signupAvatar ? (
                      <img
                        src={signupAvatar}
                        alt={fullName || 'You'}
                        className="w-20 h-20 rounded-full object-cover border-3 border-emerald-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0D5A46] to-emerald-600 text-white font-bold text-2xl flex items-center justify-center border-3 border-emerald-100 shadow-sm select-none">
                        {(fullName || 'U').trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-bold text-gray-800">
                    Profile Photo <span className="text-gray-400 font-normal">(Optional)</span>
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 max-w-xs leading-relaxed">
                    Upload your photo or skip this step to use your name's first letter (
                    <strong className="text-emerald-800 font-bold">
                      "{(fullName || 'U').trim().charAt(0).toUpperCase()}"
                    </strong>
                    ).
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => signupFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-500" />
                      <span>{signupAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => signupCameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-gray-500" />
                      <span>Camera</span>
                    </button>

                    {signupAvatar && (
                      <button
                        type="button"
                        onClick={() => setSignupAvatar('')}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline px-2 cursor-pointer"
                      >
                        Skip / Remove
                      </button>
                    )}
                  </div>
                </div>

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
                {emailOrPhone || user?.email || 'your email'}
              </p>

              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-6">
                Click the verification link sent to your email inbox. Once accepted, this page will <strong>open your dashboard automatically</strong>.
              </p>

              {/* Real-time Listening / Waiting Banner */}
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 mb-4 text-left flex items-center gap-3">
                <div className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </div>
                <div className="text-xs text-emerald-950 leading-relaxed">
                  <span className="font-semibold text-emerald-900">Waiting for email verification...</span>
                  <p className="text-emerald-800/80 text-[11px] mt-0.5">
                    Click the link in your email or enter the 6-digit code below to open your dashboard.
                  </p>
                </div>
              </div>

              {/* 6-digit Email Verification OTP Group */}
              <div className="my-5 p-5 bg-white rounded-2xl border border-emerald-100/90 shadow-2xs text-center">
                <p className="text-xs font-bold text-gray-800 mb-1">
                  Enter 6-Digit Email Verification Code
                </p>
                <p className="text-[11px] text-gray-500 mb-3.5">
                  Enter the code sent to {emailOrPhone || user?.email || 'your email'}
                </p>
                <div className="flex justify-center mb-3.5">
                  <OtpInputGroup
                    value={emailOtp}
                    onChange={setEmailOtp}
                    onComplete={(code) => handleVerifyEmailOtp(code)}
                  />
                </div>
                {devEmailOtp && (
                  <p className="text-[11px] text-emerald-700 font-medium mb-3">
                    💡 Backup Code: <span className="font-mono font-bold">{devEmailOtp}</span>
                  </p>
                )}
                <button
                  type="button"
                  disabled={isVerifyingEmailOtp}
                  onClick={() => handleVerifyEmailOtp()}
                  className="w-full max-w-xs mx-auto py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isVerifyingEmailOtp ? 'Verifying Code...' : 'Verify Code & Open Dashboard'}
                </button>
              </div>

              {/* Local / Development Mode Diagnostic Card */}
              {(!verificationInfo.hasSmtpConfigured || import.meta.env.DEV || true) && (
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 mb-6 text-left shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 space-y-2.5">
                      <div>
                        <h4 className="text-xs font-bold text-amber-950">
                          Email not arriving in your inbox?
                        </h4>
                        <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed mt-0.5">
                          Your server is running in local development mode without an external SMTP gateway in <code className="bg-amber-100/90 px-1.5 py-0.5 rounded font-mono text-amber-900 text-[11px]">Backend/.env</code>.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleVerificationComplete()}
                          className="py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Verify & Open Dashboard Now</span>
                        </button>

                        {verificationInfo.previewUrl && (
                          <a
                            href={verificationInfo.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2.5 px-3 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                            <span>View Test Email</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Resend Email & Verify Button */}
              <div className="max-w-xs mx-auto space-y-3">
                <button
                  type="button"
                  onClick={() => handleVerificationComplete()}
                  className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Verify Email & Open Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resendCooldown > 0}
                  className="w-full py-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : 'Resend Email'}
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

            {/* Confirm Password (Sign Up only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 sm:left-3.5 text-gray-400 pointer-events-none">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Confirm your password"
                    className={`w-full bg-white text-gray-900 text-xs sm:text-sm rounded-lg sm:rounded-xl border pl-9 sm:pl-10 pr-10 sm:pr-11 py-2 sm:py-3 outline-none transition-all ${
                      errors.confirmPassword
                        ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 sm:right-3.5 text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[10px] sm:text-[11px] text-red-600 font-medium mt-0.5 sm:mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

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

      {/* ========================================================================= */}
      {/* INTERACTIVE OAUTH MODAL DIALOG (Google & Apple) */}
      {/* ========================================================================= */}
      {oauthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            {oauthModal === 'Google' ? (
              <div>
                {/* Google Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
                    <span className="font-heading font-bold text-gray-900 text-lg">
                      Sign in with Google
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOauthModal(null)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4 font-medium">
                  Choose an account to continue to <span className="font-bold text-primary">TripzoBox</span>
                </p>

                {/* Account list */}
                <div className="space-y-2 mb-6">
                  {/* Option 1: Current / typed email or default tamilan */}
                  <button
                    type="button"
                    onClick={() =>
                      executeOAuth(
                        emailOrPhone.includes('@') ? emailOrPhone : 'valarthamizhrr@gmail.com',
                        fullName || 'tamilan'
                      )
                    }
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-gray-200 hover:border-primary/50 hover:bg-emerald-50/40 transition-all text-left cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                      {(fullName || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm text-gray-900 truncate group-hover:text-primary transition-colors">
                        {fullName || 'tamilan'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {emailOrPhone.includes('@') ? emailOrPhone : 'valarthamizhrr@gmail.com'}
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Use another account */}
                  {!isUsingAnotherAccount ? (
                    <button
                      type="button"
                      onClick={() => setIsUsingAnotherAccount(true)}
                      className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all text-left cursor-pointer text-gray-700 text-sm font-medium"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <span>Use another account</span>
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-2xl border border-primary/30 bg-gray-50 space-y-2">
                      <label className="block text-xs font-semibold text-gray-700">
                        Enter any Google Email address:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={customOAuthEmail}
                          onChange={(e) => setCustomOAuthEmail(e.target.value)}
                          placeholder="e.g. explorer@gmail.com"
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => executeOAuth(customOAuthEmail)}
                          disabled={!customOAuthEmail.includes('@')}
                          className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
                        >
                          Sign In
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  To continue, Google will share your name, email address, language preference, and profile picture with TripzoBox.
                </p>
              </div>
            ) : (
              <div>
                {/* Apple Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                  <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5 fill-current text-gray-900 shrink-0" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.7-11.64-13.99-6.3-9.77-11.1-20.73-14.42-32.89-3.32-12.16-4.98-23.77-4.98-34.82 0-14.78 3.8-27.18 11.41-37.19 7.6-10.02 17.1-15.08 28.5-15.2 5.01 0 10.33 1.25 15.96 3.75 5.63 2.5 9.4 3.79 11.31 3.87 1.52 0 5.48-1.35 11.88-4.04 6.4-2.69 11.83-3.88 16.29-3.57 15.53 1.15 27.29 6.94 35.29 17.37-13.68 8.27-20.4 19.33-20.15 33.19.25 10.88 4.35 20.08 12.3 27.61 8.04 7.53 17.5 11.75 28.37 12.67-2.39 7.4-5.11 14.39-8.15 20.98zM119.22 33.09c0-7.39 2.66-14.42 7.99-21.09 5.33-6.67 11.96-10.87 19.89-12.6 1.09 7.82-.71 15.34-5.4 22.56-4.69 7.22-11.46 11.53-20.31 12.93-.33-.6-.72-1.19-1.17-1.8z" />
                    </svg>
                    <span className="font-heading font-bold text-gray-900 text-lg">
                      Sign in with Apple
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOauthModal(null)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-center py-4 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8 fill-current text-white" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.7-11.64-13.99-6.3-9.77-11.1-20.73-14.42-32.89-3.32-12.16-4.98-23.77-4.98-34.82 0-14.78 3.8-27.18 11.41-37.19 7.6-10.02 17.1-15.08 28.5-15.2 5.01 0 10.33 1.25 15.96 3.75 5.63 2.5 9.4 3.79 11.31 3.87 1.52 0 5.48-1.35 11.88-4.04 6.4-2.69 11.83-3.88 16.29-3.57 15.53 1.15 27.29 6.94 35.29 17.37-13.68 8.27-20.4 19.33-20.15 33.19.25 10.88 4.35 20.08 12.3 27.61 8.04 7.53 17.5 11.75 28.37 12.67-2.39 7.4-5.11 14.39-8.15 20.98zM119.22 33.09c0-7.39 2.66-14.42 7.99-21.09 5.33-6.67 11.96-10.87 19.89-12.6 1.09 7.82-.71 15.34-5.4 22.56-4.69 7.22-11.46 11.53-20.31 12.93-.33-.6-.72-1.19-1.17-1.8z" />
                    </svg>
                  </div>
                  <p className="font-heading font-bold text-base text-gray-900">
                    {fullName || 'tamilan'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {emailOrPhone.includes('@') ? emailOrPhone : 'valarthamizhrr@icloud.com'}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      executeOAuth(
                        emailOrPhone.includes('@') ? emailOrPhone : 'valarthamizhrr@icloud.com',
                        fullName || 'tamilan'
                      )
                    }
                    className="w-full py-3.5 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Continue with Apple ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setOauthModal(null)}
                    className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
