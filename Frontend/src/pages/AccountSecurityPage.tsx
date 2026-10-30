import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User as UserIcon,
  Shield,
  FolderLock,
  Compass,
  BookOpen,
  Bell,
  HelpCircle,
  Search,
  CheckCircle2,
  ChevronDown,
  LogOut,
  X,
  Key,
  Lock,
  Plus,
  ArrowRight,
  MapPin,
  Calendar,
  Edit3,
  PhoneCall,
  Users,
  ShieldCheck,
  LifeBuoy,
  Camera,
  Globe,
  FileText,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Check,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTrips } from '../context/TripsContext';
import { useDiary } from '../context/DiaryContext';
import { useVault } from '../context/VaultContext';
import { useNotifications } from '../context/NotificationsContext';
import { RecoveryCodesGrid } from '../components/auth/RecoveryCodesGrid';
import { TripCard } from '../components/feature/TripCard';
import { StoryCard } from '../components/feature/StoryCard';
import { DocumentRow } from '../components/feature/DocumentRow';
import { VaultFileViewer } from '../components/feature/VaultFileViewer';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { VaultDocument } from '../types';

export type SettingsTab =
  | 'profile'
  | 'security'
  | 'vault'
  | 'trips'
  | 'diary'
  | 'notifications'
  | 'help';

interface AccountSecurityPageProps {
  initialTab?: SettingsTab;
}

// Phone validator: strictly numbers, +, spaces, hyphens, min 10 digits, max 15 digits, NO words
export const isValidPhone = (val?: string): boolean => {
  if (!val) return false;
  const trimmed = val.trim();
  if (/[a-zA-Z]/.test(trimmed)) return false; // reject any wording like "admin"
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

export const AccountSecurityPage: React.FC<AccountSecurityPageProps> = ({
  initialTab = 'security',
}) => {
  const { user, updateProfile, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const { trips, savedTripIds } = useTrips();
  const { entries, stories } = useDiary();
  const { documents, emergencyContacts, sharedAccessRecords, deleteDocument } = useVault();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab
  const paramTab = searchParams.get('tab') as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(paramTab || initialTab);

  React.useEffect(() => {
    if (paramTab) {
      setActiveTab(paramTab);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [paramTab, initialTab]);

  const handleTabChange = (tabId: SettingsTab) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Modals state
  const [selectedDocForViewer, setSelectedDocForViewer] = useState<VaultDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [showAllDocs, setShowAllDocs] = useState(false);
  const [modalType, setModalType] = useState<
    'email' | 'phone' | 'password' | 'recovery-question' | 'recovery-codes' | 'edit-profile' | null
  >(null);

  // Form states for modals
  const [newEmail, setNewEmail] = useState(user.email || 'user@example.com');
  const [newPhone, setNewPhone] = useState(isValidPhone(user.phone) ? user.phone! : '');
  const [phoneError, setPhoneError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [question, setQuestion] = useState(
    user.securityQuestion || "What is your mother's name?"
  );
  const [answer, setAnswer] = useState(user.securityAnswer || 'Amina');

  // Edit Profile modal state
  const [editName, setEditName] = useState(user.name);
  const [editBio, setEditBio] = useState(user.bio);
  const [editCity, setEditCity] = useState(user.city);
  const [editBudget, setEditBudget] = useState(user.budgetStyle);

  // Profile sub-tab (trips vs stories vs saved)
  const [profileSubTab, setProfileSubTab] = useState<'trips' | 'stories' | 'saved'>('trips');

  // Diary sub-tab (entries vs stories)
  const [diarySubTab, setDiarySubTab] = useState<'entries' | 'stories'>('entries');

  // Search filter inside settings
  const [searchFilter, setSearchFilter] = useState('');

  const recoveryCodes = user.recoveryCodes || [
    '8P3K-2D9Q',
    '4G7P-1KDM',
    '2ZNV-988C',
    '6TQ1-3L5D',
    'H9W2-7K4F',
    'D5JS-0P3R',
  ];

  // User's own trips
  const myTrips = useMemo(() => {
    return trips.filter(
      (t) => t.leader.id === user.id || t.members.some((m) => m.id === user.id)
    );
  }, [trips, user.id]);

  const savedTrips = useMemo(() => {
    return trips.filter((t) => savedTripIds.includes(t.id));
  }, [trips, savedTripIds]);

  const handleUpdateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes('@')) return;
    updateProfile({ email: newEmail.trim(), emailVerified: true });
    success('Email updated and verified successfully!', 'Account Updated');
    setModalType(null);
  };

  const handleUpdatePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (/[a-zA-Z]/.test(newPhone)) {
      setPhoneError('Phone number cannot contain letters or words.');
      return;
    }
    const digits = newPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setPhoneError('Please enter a valid mobile number with at least 10 numeric digits.');
      return;
    }
    if (digits.length > 15) {
      setPhoneError('Phone number cannot exceed 15 digits.');
      return;
    }
    setPhoneError('');
    updateProfile({ phone: newPhone.trim(), phoneVerified: true });
    success('Mobile phone updated and verified successfully!', 'Phone Verified');
    setModalType(null);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError('');
    success('Password changed successfully!', 'Security Updated');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setModalType(null);
  };

  const handleUpdateSecurityQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ securityQuestion: question, securityAnswer: answer });
    success('Recovery security question updated!', 'Settings Saved');
    setModalType(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName.trim() || user.name,
      bio: editBio.trim() || user.bio,
      city: editCity.trim() || user.city,
      budgetStyle: editBudget,
    });
    success('Profile updated successfully!', 'Profile Saved');
    setModalType(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarNavItems: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'security', label: 'Account Security', icon: Shield },
    { id: 'vault', label: 'Travel Vault', icon: FolderLock },
    { id: 'trips', label: 'My Trips', icon: Compass },
    { id: 'diary', label: 'Travel Diary', icon: BookOpen },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  const isPhoneValid = isValidPhone(user.phone);

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] py-2 sm:py-3">
      {/* Container with White Card Layout */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-card overflow-hidden flex flex-col md:flex-row min-h-[680px]">
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR (Desktop permanent sidebar) */}
        {/* ========================================================================= */}
        <aside className="hidden md:flex md:w-64 border-r border-gray-200 bg-gray-50/50 p-4 sm:p-5 shrink-0 flex-col justify-between">
          <div className="space-y-4">
            <div className="px-3 py-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Account Settings
              </span>
            </div>

            <nav className="space-y-1">
              {sidebarNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-emerald-100/70 text-emerald-900 font-semibold shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-primary' : 'text-gray-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Logout Button */}
          <div className="pt-4 border-t border-gray-200/60">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN CONTENT PANEL (Rendered right here on this page) */}
        {/* ========================================================================= */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 flex flex-col justify-between overflow-x-hidden">
          {/* Mobile Top Navigation Bar */}
          <div className="md:hidden flex items-center pb-3 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tab:</span>
              <span className="text-sm font-bold text-gray-900 capitalize flex items-center gap-1.5">
                {sidebarNavItems.find((i) => i.id === activeTab)?.icon && (
                  <span className="text-primary">
                    {React.createElement(sidebarNavItems.find((i) => i.id === activeTab)!.icon, { className: 'w-4 h-4' })}
                  </span>
                )}
                {sidebarNavItems.find((i) => i.id === activeTab)?.label || 'Settings'}
              </span>
            </div>
          </div>
          {/* ----------------------------------------------------------------------- */}
          {/* 1. ACCOUNT SECURITY TAB */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                  <h1 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900">
                    Account Security
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Manage your credentials, verified contact numbers, and login safeguards.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search settings..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Security Items Table / List */}
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                {/* Row 1: Email */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/40 transition-colors">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Email
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="font-medium text-sm sm:text-base text-gray-900">
                        {user.email || 'user@example.com'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-primary stroke-[2.5]" />
                        <span>Verified</span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalType('email')}
                    className="self-start sm:self-center text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Row 2: Phone Number (Strict Phone Validation) */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/40 transition-colors">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </span>
                    <div className="flex items-center gap-2.5">
                      {isPhoneValid ? (
                        <>
                          <span className="font-medium text-sm sm:text-base text-gray-900">
                            {user.phone}
                          </span>
                          {user.phoneVerified !== false ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-primary stroke-[2.5]" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span>Unverified</span>
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-gray-400 italic">
                            No phone number linked
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                            <span>Not Verified</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneError('');
                      setNewPhone(isPhoneValid ? user.phone! : '');
                      setModalType('phone');
                    }}
                    className="self-start sm:self-center text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
                  >
                    {isPhoneValid ? 'Change' : 'Add Phone'}
                  </button>
                </div>

                {/* Row 3: Password */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/40 transition-colors">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Password
                    </span>
                    <div>
                      <span className="font-mono text-base text-gray-900 tracking-widest">
                        ••••••••••
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordError('');
                      setModalType('password');
                    }}
                    className="self-start sm:self-center text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Row 4: Recovery Question */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/40 transition-colors">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Recovery Question
                    </span>
                    <div>
                      <span className="font-medium text-sm sm:text-base text-gray-900">
                        {user.securityQuestion || "What is your mother's name?"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalType('recovery-question')}
                    className="self-start sm:self-center text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {/* Row 5: Recovery Codes */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/40 transition-colors">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Recovery Codes
                    </span>
                    <div>
                      <span className="font-medium text-sm sm:text-base text-gray-700">
                        {recoveryCodes.length} codes available
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalType('recovery-codes')}
                    className="self-start sm:self-center text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
                  >
                    View
                  </button>
                </div>
              </div>

              {/* Security Status Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-emerald-950">
                    Account Protection Active
                  </h4>
                  <p className="text-xs text-emerald-900/80 mt-0.5 leading-relaxed">
                    256-bit encrypted credential storage, verified communications, and single-device session confirmation enabled.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* 2. PROFILE TAB */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              {/* Profile Header Card */}
              <div className="relative rounded-3xl border border-gray-200/90 overflow-hidden bg-white shadow-2xs">
                {/* Cover Banner */}
                <div className="h-32 sm:h-40 w-full overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 relative">
                  <img
                    src={user.coverUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80'}
                    alt="Cover"
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>

                {/* Profile Details Container */}
                <div className="p-5 sm:p-6 sm:pt-0 relative">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
                    <div className="relative inline-block">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditName(user.name);
                        setEditBio(user.bio);
                        setEditCity(user.city);
                        setEditBudget(user.budgetStyle);
                        setModalType('edit-profile');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  <div>
                    <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
                      {user.name}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>@{user.username}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <MapPin className="w-3 h-3" />
                        {user.city}, {user.country || 'India'}
                      </span>
                    </p>

                    <p className="text-xs sm:text-sm text-gray-700 max-w-2xl mt-3 leading-relaxed">
                      {user.bio}
                    </p>

                    {/* Interests Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {user.travelInterests.map((interest) => (
                        <span
                          key={interest}
                          className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-4 gap-2 pt-4 mt-4 border-t border-gray-100 text-center">
                      <div>
                        <span className="font-heading font-bold text-base sm:text-lg text-gray-900 block leading-none">
                          {user.stats.trips}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1 block">Trips</span>
                      </div>
                      <div>
                        <span className="font-heading font-bold text-base sm:text-lg text-gray-900 block leading-none">
                          {user.stats.stories}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1 block">Stories</span>
                      </div>
                      <div>
                        <span className="font-heading font-bold text-base sm:text-lg text-gray-900 block leading-none">
                          {user.stats.followers}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1 block">Followers</span>
                      </div>
                      <div>
                        <span className="font-heading font-bold text-base sm:text-lg text-gray-900 block leading-none">
                          {user.stats.following}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1 block">Following</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-tabs: My Trips / My Stories / Saved */}
              <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                  {[
                    { id: 'trips', label: `My Trips (${myTrips.length})` },
                    { id: 'stories', label: `My Stories (${stories.length})` },
                    { id: 'saved', label: `Saved (${savedTrips.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setProfileSubTab(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        profileSubTab === tab.id
                          ? 'bg-primary text-white shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {profileSubTab === 'trips' && (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                    {myTrips.map((trip) => (
                      <TripCard key={trip.id} trip={trip} />
                    ))}
                  </div>
                )}

                {profileSubTab === 'stories' && (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                    {stories.map((story) => (
                      <StoryCard key={story.id} story={story} />
                    ))}
                  </div>
                )}

                {profileSubTab === 'saved' && (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                    {savedTrips.map((trip) => (
                      <TripCard key={trip.id} trip={trip} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* 3. TRAVEL VAULT TAB */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'vault' && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h1 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900">
                    Travel Vault
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Your essential travel documents, offline-ready and 256-bit encrypted.
                  </p>
                </div>
                <Link
                  to="/app/vault"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
                >
                  <span>Open Full Vault</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 3 Quick Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-lg text-gray-900 block leading-tight">
                      {documents.length}
                    </span>
                    <span className="text-xs text-gray-500">Secured Documents</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-lg text-gray-900 block leading-tight">
                      {emergencyContacts.length}
                    </span>
                    <span className="text-xs text-gray-500">Emergency Contacts</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-lg text-gray-900 block leading-tight">
                      {sharedAccessRecords.length}
                    </span>
                    <span className="text-xs text-gray-500">Active Shared Access</span>
                  </div>
                </div>
              </div>

              {/* Recent Documents List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-base text-gray-900">
                    Your Secured Documents
                  </h3>
                  <div className="flex items-center gap-3">
                    {documents.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllDocs(!showAllDocs)}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        {showAllDocs ? 'Show Less' : `View All (${documents.length})`}
                      </button>
                    )}
                    <Link
                      to="/app/vault?view=documents"
                      className="text-xs font-semibold text-gray-500 hover:text-gray-900 hover:underline"
                    >
                      Manage &rarr;
                    </Link>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {(showAllDocs ? documents : documents.slice(0, 4)).map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      document={doc}
                      onView={(item) => {
                        setSelectedDocForViewer(item);
                        setIsViewerOpen(true);
                      }}
                      onShare={() => {
                        navigate('/app/vault?view=share');
                      }}
                      onDelete={async (id) => {
                        deleteDocument(id);
                        success('Document removed from your vault.');
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Emergency Contacts Section */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-base text-gray-900">
                    Emergency Contacts
                  </h3>
                  <Link
                    to="/app/vault?view=emergency"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Manage Contacts &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {emergencyContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3.5 rounded-xl border border-gray-200 bg-white shadow-2xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">{contact.name}</span>
                          {contact.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Primary
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {contact.relation} • {contact.phone}
                        </span>
                      </div>
                      <a
                        href={`tel:${contact.phone}`}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        title="Call Contact"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* 4. MY TRIPS TAB */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'trips' && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h1 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900">
                    My Trips
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Trips you lead, joined groups, and upcoming itineraries.
                  </p>
                </div>
                <Link
                  to="/app/trips/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create Trip</span>
                </Link>
              </div>

              {myTrips.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                  {myTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
                  <p className="text-xs text-gray-500">You haven't joined or created any trips yet.</p>
                  <Link
                    to="/app/trips"
                    className="inline-block mt-3 text-xs font-semibold text-primary hover:underline"
                  >
                    Find your next adventure &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* 5. TRAVEL DIARY TAB */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'diary' && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h1 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900">
                    My Travel Diary
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Record your journey, collect memories, and publish stories.
                  </p>
                </div>
                <Link
                  to="/app/diary/add"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Experience</span>
                </Link>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDiarySubTab('entries')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    diarySubTab === 'entries'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  My Entries ({entries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDiarySubTab('stories')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    diarySubTab === 'stories'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Published Stories ({stories.length})
                </button>
              </div>

              {diarySubTab === 'entries' ? (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-2xl border border-gray-200 bg-white shadow-2xs flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={entry.photos[0] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80'}
                          alt={entry.place}
                          className="w-16 h-12 rounded-xl object-cover shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{entry.place}</h4>
                          <span className="text-xs text-gray-500">
                            {entry.date} · {entry.category}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                        Private
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stories.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* 6. NOTIFICATIONS TAB */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h1 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900">
                    Notifications
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Updates on your trip approvals, group messages, and story likes.
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl bg-white shadow-2xs overflow-hidden">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 flex items-start gap-3 transition-colors ${
                      !item.read ? 'bg-emerald-50/40' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-600 mt-0.5">{item.message}</p>
                      <span className="text-[11px] text-gray-400 mt-1 block">
                        {item.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* 7. HELP & SUPPORT TAB */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'help' && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h1 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900">
                    Help & Support
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Need assistance, incident escalation, or guidance? We're here 24/7.
                  </p>
                </div>
              </div>

              {/* 24/7 Safety Helpline Banner */}
              <div className="p-5 sm:p-6 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-gray-900">
                      24/7 Incident & Travel Desk
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Direct hotline for live active trips, medical support, and verified escorts.
                    </p>
                  </div>
                </div>
                <Link
                  to="/contact"
                  className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-2xs shrink-0 self-start sm:self-auto"
                >
                  Contact Safety Team
                </Link>
              </div>

              {/* FAQ Accordion / Quick Questions */}
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-base text-gray-900">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      q: 'How does Trip Leader verification work?',
                      a: 'Trip leaders undergo identity verification, submission of travel track records, and initial safety interviews before publishing group expeditions.',
                    },
                    {
                      q: 'Are my Travel Vault documents stored securely?',
                      a: 'Yes. All files are encrypted using client-side AES-256 standards with zero-knowledge architecture. Only you and designated companions hold decryption keys.',
                    },
                    {
                      q: 'Can I change my verified phone number or email anytime?',
                      a: 'Yes, navigate to the Account Security tab on this page and click Change. You will receive an instant verification check.',
                    },
                  ].map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-gray-200/90 bg-white space-y-1 shadow-2xs"
                    >
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900">{faq.q}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CHANGE EMAIL */}
      {/* ========================================================================= */}
      {modalType === 'email' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-float border border-gray-100 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg text-gray-900">Change Email Address</h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateEmail} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  New Email Address *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-xs cursor-pointer"
                >
                  Save Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHANGE PHONE (STRICT VALIDATION: NO WORDING/TEXT) */}
      {/* ========================================================================= */}
      {modalType === 'phone' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-float border border-gray-100 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg text-gray-900">
                {isPhoneValid ? 'Change Phone Number' : 'Add Phone Number'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPhoneError('');
                  setModalType(null);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdatePhone} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Mobile Number (minimum 10 digits) *
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Only allow numbers, +, spaces, hyphens — strictly reject words like 'admin'
                    if (/^[0-9+\s-]*$/.test(val)) {
                      setNewPhone(val);
                      if (phoneError) setPhoneError('');
                    }
                  }}
                  required
                  placeholder="+91 98765 43210"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    phoneError
                      ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
                {phoneError ? (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{phoneError}</p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Accepts numeric digits and country code (e.g. +91 98765 43210). Words are not permitted.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPhoneError('');
                    setModalType(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-xs cursor-pointer"
                >
                  Verify & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CHANGE PASSWORD */}
      {/* ========================================================================= */}
      {modalType === 'password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-float border border-gray-100 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg text-gray-900">Change Password</h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                />
              </div>
              {passwordError && (
                <p className="text-xs text-red-600 font-medium">{passwordError}</p>
              )}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-xs cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RECOVERY QUESTION */}
      {/* ========================================================================= */}
      {modalType === 'recovery-question' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-float border border-gray-100 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg text-gray-900">
                Security Recovery Question
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSecurityQuestion} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Select Question
                </label>
                <select
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm outline-none bg-white"
                >
                  <option value="What is your mother's name?">What is your mother's name?</option>
                  <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                  <option value="What city were you born in?">What city were you born in?</option>
                  <option value="What was your first school?">What was your first school?</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Answer</label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  placeholder="Your secret answer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-xs cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RECOVERY CODES */}
      {/* ========================================================================= */}
      {modalType === 'recovery-codes' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-float border border-gray-100 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-lg text-gray-900">
                  Your Account Recovery Codes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pt-4 space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                Save these emergency codes in a safe place. You can use each single-use backup code to sign in if you lose phone access.
              </p>
              <RecoveryCodesGrid codes={recoveryCodes} />
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: EDIT PROFILE */}
      {/* ========================================================================= */}
      {modalType === 'edit-profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-float border border-gray-100 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg text-gray-900">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  City / Location
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-xs cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: VAULT DOCUMENT VIEWER */}
      {/* ========================================================================= */}
      {selectedDocForViewer && (
        <Modal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          maxWidth="2xl"
          title={selectedDocForViewer.name}
          description={`Type: ${selectedDocForViewer.type} · Uploaded: ${selectedDocForViewer.uploadedAt}`}
        >
          <div className="space-y-4">
            <VaultFileViewer
              document={
                documents.find((d) => d.id === selectedDocForViewer.id) || selectedDocForViewer
              }
            />
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsViewerOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AccountSecurityPage;
