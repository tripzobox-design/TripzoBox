import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripsContext';
import { useDiary } from '../context/DiaryContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { TripCard } from '../components/feature/TripCard';
import { StoryCard } from '../components/feature/StoryCard';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { trips, savedTripIds } = useTrips();
  const { stories } = useDiary();
  const { success } = useToast();
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

  // Privacy Settings State
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'members_only' | 'private'>('public');
  const [showExactDates, setShowExactDates] = useState(true);

  const tabs = [
    { id: 'trips', label: 'My Trips', badge: user.stats.trips },
    { id: 'stories', label: 'My Stories', badge: user.stats.stories },
    { id: 'saved', label: 'Saved', badge: savedTripIds.length },
    { id: 'settings', label: 'Settings' },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      bio,
      city,
      budgetStyle,
    });
    success('Profile details updated successfully!');
    setIsEditProfileOpen(false);
  };

  const savedTrips = trips.filter((t) => savedTripIds.includes(t.id));
  const myTrips = trips.filter(
    (t) => t.leader.id === user.id || t.members.some((m) => m.id === user.id)
  );
  const myStories = stories.filter((s) => s.author.id === user.id || s.author.name === user.name);

  return (
    <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto">
      {/* 1. COVER BANNER & PROFILE CARD (Matching Screen 12) */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-card">
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
        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
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

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditProfileOpen(true)}
              icon={<Edit3 className="w-3.5 h-3.5" />}
              className="text-xs self-start sm:self-end"
            >
              Edit Profile
            </Button>
          </div>

          <div>
            <h1 className="font-heading font-bold text-2xl text-text">
              {user.name}
            </h1>
            <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
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
            <div className="flex flex-wrap gap-1.5 mt-3.5">
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
            <div className="flex items-center gap-6 sm:gap-10 pt-5 mt-5 border-t border-border">
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
      </div>

      {/* 2. PROFILE TABS (My Trips, My Stories, Saved, Settings) */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-subtle">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
          variant="underline"
        />

        {/* TAB 1: MY TRIPS (Matching Screen 12) */}
        {activeTab === 'trips' && (
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-text">
                Recent Trips
              </h3>
              <a
                href="/app/trips"
                className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                View all →
              </a>
            </div>
            {myTrips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {myTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No trips joined yet.</p>
            )}
          </div>
        )}

        {/* TAB 2: MY STORIES */}
        {activeTab === 'stories' && (
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
        {activeTab === 'saved' && (
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
        {activeTab === 'settings' && (
          <div className="pt-6 space-y-8 max-w-2xl">
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

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
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
            <Button variant="primary" type="submit">
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
