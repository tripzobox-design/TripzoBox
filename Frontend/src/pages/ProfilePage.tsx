import { confirmAction } from '../lib/confirmAction';
import React, { useState, useRef } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Edit3,
  Shield,
  Settings as SettingsIcon,
  Trash2,
  Lock,
  Globe,
  Sparkles,
  Check,
  WifiOff,
  Camera,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripsContext';
import { useDiary } from '../context/DiaryContext';
import { useToast } from '../context/ToastContext';
import { useVault } from '../context/VaultContext';
import { VaultFileViewer } from '../components/feature/VaultFileViewer';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { TripCard } from '../components/feature/TripCard';
import { StoryCard } from '../components/feature/StoryCard';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import { TravellerRatingsCard } from '../components/feature/TravellerRatingsCard';
import { SubmitReviewModal } from '../components/feature/SubmitReviewModal';

export const ProfilePage: React.FC<{ settingsOnly?: boolean }> = ({ settingsOnly = false }) => {
  const { user, updateProfile } = useAuth();
  const { trips, savedTripIds } = useTrips();
  const { stories } = useDiary();
  const { success, error: toastError } = useToast();
  const { documents } = useVault();
  const [offlineDocumentId, setOfflineDocumentId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as any) || 'trips';
  const [activeTab, setActiveTab] = useState<'trips' | 'stories' | 'saved' | 'settings' | 'reviews'>(initialTab);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isChangePhotoOpen, setIsChangePhotoOpen] = useState(false);

  // Avatar changing refs & state
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toastError?.('Please select a JPG, PNG, or WebP image.', 'Invalid Image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastError?.('Image size must be under 5 MB.', 'File Too Large');
      return;
    }

    setAvatarLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      try {
        await updateProfile({ avatarUrl: result });
        setAvatarUrl(result);
        success('Profile photo updated successfully!', 'Photo Changed');
        setIsChangePhotoOpen(false);
      } catch (err: any) {
        toastError?.('Failed to update profile photo: ' + (err?.message || 'Unknown error'));
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.onerror = () => {
      toastError?.('Could not read image file. Please try again.');
      setAvatarLoading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    try {
      await updateProfile({ avatarUrl: '' });
      setAvatarUrl('');
      success('Profile photo removed. First letter of your name is now used.', 'Photo Removed');
      setIsChangePhotoOpen(false);
    } catch (err: any) {
      toastError?.('Failed to remove photo');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Edit Profile Form State
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [city, setCity] = useState(user.city);
  const [budgetStyle, setBudgetStyle] = useState<typeof user.budgetStyle>(user.budgetStyle);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [photoError, setPhotoError] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);

  const chooseProfilePhoto = (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setPhotoError('Choose a JPG, PNG, or WebP image up to 2 MB.');
      return;
    }
    setPhotoError('');
    setPhotoLoading(true);
    const reader = new FileReader();
    reader.onload = () => { setAvatarUrl(reader.result as string); setPhotoLoading(false); };
    reader.onerror = () => { setPhotoError('Could not read this photo. Try another image.'); setPhotoLoading(false); };
    reader.readAsDataURL(file);
  };

  // Privacy Settings State
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'members_only' | 'private'>('public');
  const [showExactDates, setShowExactDates] = useState(true);

  const tabs = [
    { id: 'trips', label: 'My Trips', badge: user.stats.trips },
    { id: 'stories', label: 'My Stories', badge: user.stats.stories },
    { id: 'saved', label: 'Saved', badge: savedTripIds.length },
    { id: 'reviews', label: 'Reviews', badge: user.reputation?.reviewCount || undefined },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      bio,
      city,
      budgetStyle,
      avatarUrl,
    });
    success('Profile details updated successfully!');
    setIsEditProfileOpen(false);
  };

  const savedTrips = trips.filter((t) => savedTripIds.includes(t.id));
  const myTrips = trips.filter(
    (t) => t.leader.id === user.id || t.members.some((m) => m.id === user.id)
  );
  const showAllTrips = searchParams.get('view') === 'all-trips';
  const visibleTrips = showAllTrips ? myTrips : myTrips.slice(0, 3);
  const myStories = stories.filter((s) => s.author.id === user.id || s.author.name === user.name);

  if (!settingsOnly && searchParams.get('tab') === 'settings') return <Navigate to="/app/profile/settings" replace />;

  return (
    <div className="flex flex-col gap-3 lg:gap-6 text-left w-full max-w-7xl 2xl:max-w-[1536px] mx-auto">
      {/* 1. COVER BANNER & PROFILE CARD (Matching Screen 12) */}
      {!settingsOnly && <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-card">
        {/* Cover Image */}
        <div className="relative h-44 sm:h-56 w-full bg-text">
          <img
            src={user.coverUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80'}
            alt="Cover banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Profile Header Details */}
        <div className="px-4 sm:px-5 lg:px-8 pb-3 lg:pb-6 pt-0 relative">
          <div className="flex items-end justify-between gap-3 -mt-12 sm:-mt-16 lg:-mt-20 mb-2 lg:mb-4">
            {/* Avatar overlapping cover banner */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsChangePhotoOpen(true)}
                className="relative inline-block group cursor-pointer focus:outline-none rounded-full"
                title="Click to change profile photo"
                aria-label="Change profile photo"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-card overflow-hidden bg-white">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#0D5A46] to-emerald-600 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center select-none">
                      {(user.name || 'U').trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold border-4 border-white">
                  <Camera className="w-5 h-5 mb-0.5 text-white stroke-[2.2]" />
                  <span>Change</span>
                </div>
                <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#0D5A46] text-white flex items-center justify-center border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4 stroke-[2.2]" />
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2 self-end mb-1">
              <Link to="/app/profile/settings" aria-label="Profile settings" className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-primary hover:bg-light-bg">
                <SettingsIcon className="w-4 h-4" />
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  if (!await confirmAction('edit', 'your profile')) return;
                  setAvatarUrl(user.avatarUrl);
                  setPhotoError('');
                  setName(user.name);
                  setCity(user.city);
                  setBio(user.bio);
                  setBudgetStyle(user.budgetStyle);
                  setIsEditProfileOpen(true);
                }}
                icon={<Edit3 className="w-3.5 h-3.5" />}
                className="text-xs self-end bg-white mb-1"
              >
                Edit Profile
              </Button>
            </div>
          </div>

          <div>
            <h1 className="font-heading font-bold text-2xl text-text">
              {user.name}
            </h1>
            <p className="text-xs text-text-muted mt-0.5 flex flex-wrap items-center gap-1.5">
              <span>@{user.username}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {user.city}, {user.country || 'India'}
              </span>
            </p>

            <p className="text-xs sm:text-sm text-text max-w-2xl mt-3 leading-relaxed">
              {user.bio}
            </p>

            {/* Travel Interest Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2 lg:mt-3.5">
              {user.travelInterests.map((interest) => (
                <span
                  key={interest}
                  className="text-[11px] font-semibold bg-accent/30 text-primary-dark px-2.5 py-1 rounded-full border border-accent/60"
                >
                  {interest}
                </span>
              ))}
            </div>

            {/* Stats Row (Screen 12: Trips / Stories / Followers / Following) */}
            <div className="grid grid-cols-4 gap-2 pt-3 mt-3 lg:pt-4 lg:mt-4 border-t border-border [&>div]:min-w-0 [&>div]:text-center [&>div.w-px]:hidden">
              <div>
                <span className="font-heading font-bold text-lg text-text block leading-none">
                  {user.stats.trips}
                </span>
                <span className="text-[11px] text-text-muted mt-1 block">Trips</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <span className="font-heading font-bold text-lg text-text block leading-none">
                  {user.stats.stories}
                </span>
                <span className="text-[11px] text-text-muted mt-1 block">Stories</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <span className="font-heading font-bold text-lg text-text block leading-none">
                  {user.stats.followers}
                </span>
                <span className="text-[11px] text-text-muted mt-1 block">Followers</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <span className="font-heading font-bold text-lg text-text block leading-none">
                  {user.stats.following}
                </span>
                <span className="text-[11px] text-text-muted mt-1 block">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>}

      {settingsOnly && <div>
        <Link to="/app/profile" className="text-xs font-semibold text-primary">← Back to profile</Link>
        <h1 className="font-heading font-bold text-2xl text-text mt-2">Profile Settings</h1>
        <p className="text-sm text-text-muted mt-1">Manage offline access and your preferences.</p>
      </div>}

      {/* 2. PROFILE TABS (My Trips, My Stories, Saved, Settings) */}
      <div className="bg-white rounded-2xl border border-border p-3 sm:p-4 lg:p-6 shadow-subtle">
        {!settingsOnly && <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
          variant="underline"
        />}

        {/* TAB 1: MY TRIPS (Matching Screen 12) */}
        {!settingsOnly && activeTab === 'trips' && (
          <div className="pt-3 lg:pt-6 space-y-3 lg:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-text">
                {showAllTrips ? 'All My Trips' : 'Recent Trips'}
              </h3>
              <Link
                to={showAllTrips ? '/app/profile?tab=trips' : '/app/trips/my'}
                className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                {showAllTrips ? 'Show recent' : 'View all →'}
              </Link>
            </div>
            {myTrips.length > 0 ? (
              <div className="space-y-3 sm:space-y-3.5">
                {visibleTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} variant="horizontal" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No trips joined yet.</p>
            )}
          </div>
        )}

        {/* TAB 2: MY STORIES */}
        {!settingsOnly && activeTab === 'stories' && (
          <div className="pt-6 space-y-4">
            <h3 className="font-heading font-bold text-lg text-text">
              Published Stories
            </h3>
            {myStories.length > 0 ? (
              <div className="space-y-3 sm:space-y-3.5">
                {myStories.map((story) => (
                  <StoryCard key={story.id} story={story} variant="horizontal" />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-light-bg rounded-xl border border-border text-xs sm:text-sm text-text-muted">
                You haven't composed a public story yet. Visit your Travel Diary to create one!
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED TRIPS */}
        {!settingsOnly && activeTab === 'saved' && (
          <div className="pt-6 space-y-4">
            <h3 className="font-heading font-bold text-lg text-text">
              Saved Trips ({savedTrips.length})
            </h3>
            {savedTrips.length > 0 ? (
              <div className="space-y-3 sm:space-y-3.5">
                {savedTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} variant="horizontal" />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-light-bg rounded-xl border border-border text-xs sm:text-sm text-text-muted">
                No saved trips. Click the heart icon on any trip card to bookmark it here!
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REPUTATION & REVIEWS */}
        {!settingsOnly && activeTab === 'reviews' && (
          <div className="pt-4 lg:pt-6">
            <TravellerRatingsCard
              userId={user.id}
              userName={user.name}
              canReview={true}
              onOpenReviewModal={() => setIsReviewModalOpen(true)}
            />
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {settingsOnly && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <section className="rounded-2xl border border-border bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <WifiOff className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h4 className="font-heading font-bold text-base text-text">Offline Access</h4>
                  <p className="text-xs sm:text-sm text-text-muted mt-1">Uploaded ID images and PDFs are saved on this device. Open the app online once to prepare it for offline use.</p>
                </div>
              </div>
              <div className="divide-y divide-border mt-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text break-words">{doc.name}</p>
                      <p className="text-xs text-text-muted mt-0.5">{doc.fileKey ? 'Original saved on this device' : 'No original attached'}</p>
                    </div>
                    <Button size="sm" variant="secondary" className="shrink-0 whitespace-nowrap" onClick={() => setOfflineDocumentId(doc.id)}>{doc.fileKey ? 'Open' : 'Attach file'}</Button>
                  </div>
                ))}
                {documents.length === 0 && <p className="text-sm text-text-muted py-3">Add a document in Travel Vault to access it offline.</p>}
              </div>
              <p className="text-xs text-text-muted mt-2">Available in this browser only. Clearing site data removes saved copies.</p>
            </section>
            {/* Account Settings */}
            <div className="space-y-4">
              <h4 className="font-heading font-bold text-base text-text flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-primary" />
                Account & Preferences
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Name" value={user.name} readOnly disabled />
                <Input label="Location" value={`${user.city}, India`} readOnly disabled />
              </div>
              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Languages Spoken</label>
                <p className="text-xs text-text-muted bg-light-bg p-3 rounded-xl border border-border">
                  {user.languages.join(', ')}
                </p>
              </div>
            </div>

            {/* Account Security Card Link (Matching Screen 12) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm sm:text-base text-gray-900">Account Security</h4>
                  <p className="text-xs text-gray-600 mt-0.5">Manage email, phone number, password, recovery question and codes.</p>
                </div>
              </div>
              <Link
                to="/app/account-security"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
              >
                Manage Security
              </Link>
            </div>

            {/* Privacy Sub-section (Per Section 8.12) */}
            <div className="pt-6 border-t border-border space-y-4">
              <h4 className="font-heading font-bold text-base text-text flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Privacy & Trip Visibility
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-light-bg rounded-xl border border-border">
                  <div>
                    <h5 className="text-xs sm:text-sm font-semibold text-text">Profile Visibility</h5>
                    <p className="text-xs text-text-muted">Control who can discover your travel profile</p>
                  </div>
                  <select
                    value={profileVisibility}
                    onChange={(e) => {
                      setProfileVisibility(e.target.value as any);
                      success('Privacy preferences updated.');
                    }}
                    className="text-xs bg-white border border-border rounded-lg px-2.5 py-1.5 outline-none font-medium"
                  >
                    <option value="public">Public</option>
                    <option value="members_only">Trip Members Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-light-bg rounded-xl border border-border">
                  <div>
                    <h5 className="text-xs sm:text-sm font-semibold text-text">Show Exact Travel Dates</h5>
                    <p className="text-xs text-text-muted">Only approved companions see exact itinerary times</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showExactDates}
                    onChange={() => {
                      setShowExactDates(!showExactDates);
                      success('Date visibility setting toggled.');
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Destructive Action: Delete Account */}
            <div className="pt-6 border-t border-border">
              <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <h5 className="text-xs sm:text-sm font-bold text-red-900">Delete Account</h5>
                  <p className="text-xs text-red-700 mt-0.5">
                    Clear local mock profile data and reset demo session.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="border-red-400 text-red-600 hover:bg-red-100 text-xs shrink-0"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={offlineDocumentId !== null} onClose={() => setOfflineDocumentId(null)} title={documents.find((doc) => doc.id === offlineDocumentId)?.name || 'Original document'} maxWidth="2xl">
        {documents.find((doc) => doc.id === offlineDocumentId) && <VaultFileViewer document={documents.find((doc) => doc.id === offlineDocumentId)!} />}
      </Modal>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div className="flex items-center gap-4">
            <img src={avatarUrl} alt="Profile photo preview" className="w-16 h-16 rounded-full object-cover border border-border shrink-0" />
            <div className="min-w-0">
              <label className="inline-flex cursor-pointer rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary">Change photo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { chooseProfilePhoto(event.target.files?.[0]); event.target.value = ''; }} />
              </label>
              <p className="text-xs text-text-muted mt-1">JPG, PNG, WebP · Up to 2 MB</p>
              {photoError && <p role="alert" className="text-xs text-red-600 mt-1">{photoError}</p>}
            </div>
          </div>
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
          <Textarea
            label="Bio Tagline"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
          />
          <Select
            label="Budget Style"
            value={budgetStyle}
            onChange={(e) => setBudgetStyle(e.target.value as any)}
            options={[
              { label: 'Budget (Backpacker)', value: 'budget' },
              { label: 'Mid-Range (Balanced)', value: 'mid-range' },
              { label: 'Comfort (Premium Homestays)', value: 'comfort' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={photoLoading || !!photoError}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        description="Are you sure you want to reset your local demo session? This will clear local changes."
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs sm:text-sm text-text-muted">
            This action will clear localStorage and return all mock models to their fresh default state.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Keep Account
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Reset
            </Button>
          </div>
        </div>
      </Modal>

      {/* CHANGE PROFILE PHOTO MODAL */}
      {isChangePhotoOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-left">
            {/* Hidden native inputs for camera and file picker */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />

            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-heading font-bold text-lg text-gray-900">
                  Change Profile Photo
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Take a photo or choose an image from your device
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePhotoOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Avatar Display */}
            <div className="flex flex-col items-center justify-center py-5">
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0D5A46] to-emerald-600 text-white font-bold text-3xl flex items-center justify-center border-4 border-emerald-100 shadow-md select-none">
                    {(user.name || 'U').trim().charAt(0).toUpperCase()}
                  </div>
                )}
                {avatarLoading && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-gray-700 mt-2">
                {user.avatarUrl ? 'Current Photo' : 'First Letter Initial Avatar'}
              </span>
            </div>

            {/* Actions: Open Camera or Upload */}
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={avatarLoading}
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 border-emerald-600/30 bg-emerald-50/50 hover:bg-emerald-100/60 transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0D5A46] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900">Open Camera</div>
                  <div className="text-xs text-gray-500">Take a new photo directly using your camera</div>
                </div>
              </button>

              <button
                type="button"
                disabled={avatarLoading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-gray-50 transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 group-hover:bg-emerald-50 group-hover:text-primary flex items-center justify-center shrink-0 transition-colors">
                  <Upload className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900">Upload Photo</div>
                  <div className="text-xs text-gray-500">Choose an image file from your device gallery</div>
                </div>
              </button>
            </div>

            {/* Remove / Reset Option & Close */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              {user.avatarUrl ? (
                <button
                  type="button"
                  disabled={avatarLoading}
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove photo</span>
                </button>
              ) : (
                <span className="text-xs text-gray-400">Showing initial</span>
              )}

              <button
                type="button"
                onClick={() => setIsChangePhotoOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* SUBMIT REVIEW MODAL */}
      <SubmitReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={() => {
          setActiveTab('reviews');
        }}
      />
    </div>
  );
};
