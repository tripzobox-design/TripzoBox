import { confirmAction } from '../lib/confirmAction';
import React, { useState } from 'react';
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

export const ProfilePage: React.FC<{ settingsOnly?: boolean }> = ({ settingsOnly = false }) => {
  const { user, updateProfile } = useAuth();
  const { trips, savedTripIds } = useTrips();
  const { stories } = useDiary();
  const { success } = useToast();
  const { documents } = useVault();
  const [offlineDocumentId, setOfflineDocumentId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as any) || 'trips';
  const [activeTab, setActiveTab] = useState<'trips' | 'stories' | 'saved' | 'settings'>(initialTab);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
    <div className="flex flex-col gap-3 lg:gap-6 text-left max-w-5xl mx-auto">
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
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-card overflow-hidden bg-white">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
                {visibleTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {savedTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-light-bg rounded-xl border border-border text-xs sm:text-sm text-text-muted">
                No saved trips. Click the heart icon on any trip card to bookmark it here!
              </div>
            )}
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
    </div>
  );
};
