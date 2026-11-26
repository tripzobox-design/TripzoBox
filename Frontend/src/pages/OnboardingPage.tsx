import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  AtSign,
  Phone,
  Lock,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi, vaultApi } from '../lib/api';
import { SEO } from '../components/common/SEO';

export const OnboardingPage: React.FC = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await vaultApi.uploadFile(file);
      if (res?.url) {
        setAvatarUrl(res.url);
        success('Avatar updated successfully!');
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!name.trim()) {
      error('Full Name is required', 'Missing Name');
      return;
    }

    if (!username.trim()) {
      error('Username is required', 'Missing Username');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setPasswordError('Password must be at least 8 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Update basic profile info
      await updateProfile({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      });

      // 2. If password provided, set password
      if (newPassword) {
        await authApi.setPassword({ newPassword });
        success('TripzoBox password created successfully!', 'Password Set');
      }

      await refreshUser();
      success('Welcome to TripzoBox! Your profile is all set.', 'Onboarding Completed');
      navigate('/app/dashboard', { replace: true });
    } catch (err: any) {
      setIsSubmitting(false);
      error(err?.message || 'Could not save onboarding details. Please try again.', 'Setup Failed');
    }
  };

  const handleSkip = () => {
    info('You can update your profile or set a password anytime in Account Settings.');
    navigate('/app/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <SEO
        title="Welcome to TripzoBox — Complete Your Profile"
        description="Finish setting up your TripzoBox profile to start exploring trips and connecting with verified travellers."
      />

      <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-200 shadow-float p-6 sm:p-8 text-left space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to TripzoBox</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900">
            Let's Personalize Your Journey
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            You've signed in with Google! Review your profile information below and optionally create a TripzoBox password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-emerald-100 border-2 border-primary/40 flex items-center justify-center shadow-subtle">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-2xl text-primary">{(name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white hover:bg-primary-hover shadow-xs cursor-pointer transition-all"
                aria-label="Upload photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFile}
            />
            <span className="text-[11px] text-gray-400">Prefilled from your Google account. Click camera to change.</span>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none text-gray-900"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <AtSign className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="unique_username"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none text-gray-900 font-mono"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Your unique handle on TripzoBox (letters, numbers, underscore).</p>
          </div>

          {/* Phone Number (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none text-gray-900"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Used for trip leader emergency reachability and verification.</p>
          </div>

          {/* Password Creation Section (Optional) */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs sm:text-sm text-gray-900">Create a TripzoBox Password (Optional)</p>
                <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Setting a password allows you to sign in with your email and password in addition to Google sign-in. You can also do this anytime later in Account Settings.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">New Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm outline-none text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Confirm Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm outline-none text-gray-900"
                  />
                </div>
              </div>
            </div>

            {passwordError && (
              <p className="text-xs text-red-600 font-semibold">{passwordError}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleSkip}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer text-center"
            >
              Skip for now & Go to Dashboard
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Saving Profile...' : 'Save & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
