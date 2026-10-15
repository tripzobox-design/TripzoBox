import { confirmAction } from '../lib/confirmAction';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  MapPin,
  Calendar,
  Globe,
  Info,
  Check,
  Lock,
  Compass,
} from 'lucide-react';
import { useDestinations } from '../context/DestinationsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Destination } from '../types';

export const CreateDestinationPage: React.FC<{ embedded?: boolean; onCreated?: (destination: Destination) => void; onCancel?: () => void }> = ({ embedded = false, onCreated, onCancel }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isInApp = location.pathname.startsWith('/app');
  const { addDestination } = useDestinations();
  const { user, isLoggedIn } = useAuth();
  const { showToast } = useToast();

  // Route auth guard: alert and prompt if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      showToast('Please log in to create and share a place', 'info');
    }
  }, [isLoggedIn, showToast]);

  // Form State
  const [name, setName] = useState('');
  const [state, setState] = useState('Kerala');
  const [customState, setCustomState] = useState('');
  const [category, setCategory] = useState<Destination['category']>('Hidden Spots');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [bestTimeToVisit, setBestTimeToVisit] = useState('October to March');
  const [locationDetails, setLocationDetails] = useState('');
  const [isHiddenSpot, setIsHiddenSpot] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  // Photos State
  const [coverPhoto, setCoverPhoto] = useState(
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  );
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Attractions / Tags State
  const [attractions, setAttractions] = useState<string[]>([
    'Scenic Viewpoint',
    'Quiet Walking Trail',
  ]);
  const [newAttraction, setNewAttraction] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sample Presets for quick selection
  const presetPhotos = [
    {
      label: 'Secret Cove',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    },
    {
      label: 'Cloud Peak',
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    },
    {
      label: 'Emerald Lagoon',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    },
    {
      label: 'Deep Rainforest',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    },
    {
      label: 'Ancient Ruins',
      url: 'https://images.unsplash.com/photo-1600100397608-f010f443b7d4?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isCover = true) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (isCover) {
          setCoverPhoto(reader.result);
        } else {
          setGalleryPhotos((prev) => [...prev, reader.result as string]);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    setGalleryPhotos((prev) => [...prev, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryPhoto = async (index: number) => {
    if (!await confirmAction('delete', 'this gallery photo')) return;
    setGalleryPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddAttraction = () => {
    if (!newAttraction.trim()) return;
    if (!attractions.includes(newAttraction.trim())) {
      setAttractions((prev) => [...prev, newAttraction.trim()]);
    }
    setNewAttraction('');
  };

  const handleRemoveAttraction = async (tag: string) => {
    if (!await confirmAction('delete', tag + ' from attractions')) return;
    setAttractions((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      showToast('Please log in to create and share a place', 'error');
      navigate('/login?redirect=/explore/create');
      return;
    }

    if (!name.trim()) {
      showToast('Please enter a location name', 'error');
      return;
    }

    if (!shortDescription.trim()) {
      showToast('Please provide a short summary description', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalState = state === 'Other' ? (customState.trim() || 'India') : state;
      const allGallery = [coverPhoto, ...galleryPhotos.filter((p) => p !== coverPhoto)];

      const created = addDestination({
        name: name.trim(),
        state: finalState,
        category,
        imageUrl: coverPhoto,
        galleryImages: allGallery,
        shortDescription: shortDescription.trim(),
        longDescription: longDescription.trim() || shortDescription.trim(),
        bestTimeToVisit: bestTimeToVisit.trim() || 'All Year',
        topAttractions: attractions,
        isHiddenSpot: isHiddenSpot || category === 'Hidden Spots',
        isPublic,
        locationDetails: locationDetails.trim() || undefined,
        createdBy: {
          id: user?.id || 'guest_user',
          name: user?.name || 'Curious Traveler',
          avatarUrl: user?.avatarUrl,
        },
        createdAt: new Date().toISOString(),
      });

      showToast('🎉 Location created and published publicly!', 'success');
      if (onCreated) onCreated(created);
      else navigate(`/explore/${created.slug}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to create location. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: Destination['category'][] = [
    'Hidden Spots',
    'Mountains',
    'Beaches',
    'Cities',
    'Culture',
    'Nature',
  ];

  // If not logged in, show dedicated auth prompt view
  if (!isLoggedIn) {
    return (
      <div className={`w-full max-w-7xl 2xl:max-w-[1536px] mx-auto text-left ${isInApp ? 'py-4' : 'px-4 sm:px-6 lg:px-8 py-8 sm:py-16'}`}>
        <Link
          to={isInApp ? '/app/explore' : '/explore'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Destinations</span>
        </Link>

        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-border p-8 sm:p-12 shadow-card text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-5">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-text">
            Login Required
          </h2>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            You must be logged in to create and share a place on Tripzobox. Please log in or create an account to contribute your hidden spots.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/login?redirect=/explore/create')}
              className="w-full sm:w-auto px-8"
            >
              Log In to Continue
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/signup?redirect=/explore/create')}
              className="w-full sm:w-auto px-6"
            >
              Create Free Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-7xl 2xl:max-w-[1536px] mx-auto text-left ${embedded ? '' : isInApp ? 'py-4' : 'px-4 sm:px-6 lg:px-8 py-6 sm:py-10'}`}>
      {/* Top Back Link */}
      {!embedded && <Link
        to={isInApp ? '/app/explore' : '/explore'}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Destinations</span>
      </Link>}

      {/* Header Banner - Stretches across full container */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-primary rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-card">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Public Location Hub</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl">
            Create & Share a Location
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-1.5 max-w-3xl leading-relaxed">
            Add a secret spot, offbeat lagoon, mountain viewpoint, or cultural treasure. Your location will be published publicly for travelers around the globe to explore.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-56 h-56 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main 2-Column Responsive Layout */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Location Details & Guidelines (8 Columns) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* SECTION 1: Location Basics */}
            <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card">
              <h3 className="font-heading font-bold text-lg text-text flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <span>1. Location Basics</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                    Place / Destination Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kappil Secret Lagoon Cliff, Kolukkumalai Peak"
                    className="w-full text-sm font-medium border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                    State / Region *
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-sm font-medium border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
                  >
                    <option value="Kerala">Kerala</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Goa">Goa</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Other">Other / Custom</option>
                  </select>
                </div>

                {state === 'Other' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                      Specify State or Territory
                    </label>
                    <input
                      type="text"
                      value={customState}
                      onChange={(e) => setCustomState(e.target.value)}
                      placeholder="Enter state or country territory"
                      className="w-full text-sm font-medium border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Category Select Pills */}
              <div className="mt-5">
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-2">
                  Select Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          if (cat === 'Hidden Spots') setIsHiddenSpot(true);
                        }}
                        className={`text-xs sm:text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-primary text-white shadow-subtle'
                            : 'bg-light-bg text-text-muted hover:text-text border border-border'
                        }`}
                      >
                        {cat === 'Hidden Spots' && <Sparkles className="w-3.5 h-3.5 text-accent" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hidden Gem Checkbox */}
              <div className="mt-5 pt-4 border-t border-border/60 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="hiddenSpotCheck"
                  checked={isHiddenSpot || category === 'Hidden Spots'}
                  onChange={(e) => setIsHiddenSpot(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer"
                />
                <label htmlFor="hiddenSpotCheck" className="text-xs text-text cursor-pointer">
                  <span className="font-semibold block text-sm">Feature as a "Hidden Spot / Secret Gem"</span>
                  <span className="text-text-muted">
                    Highlights this location under the dedicated Hidden Spots sections on both the Home Page and Explore tab.
                  </span>
                </label>
              </div>
            </div>

            {/* SECTION 2: Descriptions & Travel Tips */}
            <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card">
              <h3 className="font-heading font-bold text-lg text-text flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-primary" />
                <span>2. Place Details & Travel Tips</span>
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                    Short Catchy Tagline *
                  </label>
                  <input
                    type="text"
                    required
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="e.g. Quiet turquoise lagoon where freshwater backwaters kiss the sea cliffs."
                    className="w-full text-sm font-medium border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                    Full Story & Location Guide
                  </label>
                  <textarea
                    rows={4}
                    value={longDescription}
                    onChange={(e) => setLongDescription(e.target.value)}
                    placeholder="Share the full vibe, what to expect, packing recommendations, local treats, and etiquette..."
                    className="w-full text-sm font-medium border border-border rounded-xl p-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                      Best Time to Visit
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-text-subtle absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={bestTimeToVisit}
                        onChange={(e) => setBestTimeToVisit(e.target.value)}
                        placeholder="e.g. October to March, Early sunrise"
                        className="w-full text-sm font-medium border border-border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                      How to Reach / Landmark Details
                    </label>
                    <input
                      type="text"
                      value={locationDetails}
                      onChange={(e) => setLocationDetails(e.target.value)}
                      placeholder="e.g. Take train to Varkala, then 15 min rickshaw north"
                      className="w-full text-sm font-medium border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Attractions / Tags */}
                <div>
                  <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                    Key Highlights / Attractions
                  </label>
                  <div className="flex gap-2 mb-2.5">
                    <input
                      type="text"
                      value={newAttraction}
                      onChange={(e) => setNewAttraction(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAttraction();
                        }
                      }}
                      placeholder="e.g. Secret Cave, Sunset Cliff, Bamboo Rafting"
                      className="flex-1 text-sm font-medium border border-border rounded-xl px-4 py-2 outline-none focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddAttraction}
                    >
                      Add Tag
                    </Button>
                  </div>

                  {/* Tag Badges */}
                  <div className="flex flex-wrap gap-2">
                    {attractions.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 text-xs bg-light-bg text-text font-medium px-3 py-1 rounded-full border border-border"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttraction(tag)}
                          className="text-text-muted hover:text-red-500 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Community Visibility & Attribution */}
            <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card">
              <h3 className="font-heading font-bold text-lg text-text flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary" />
                <span>3. Community Visibility & Attribution</span>
              </h3>

              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-text">
                      Publish Publicly for Community Discovery
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      This location will be added to Explore and Home so other travelers can discover, save, and plan trips to it.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer shrink-0 ml-4"
                />
              </div>

              <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text">Creator Attribution:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-light-bg border border-border font-medium text-text">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>{user?.name || 'Verified Traveler'}</span>
                  </span>
                </div>
                <span>Instant Public URL generated upon submission</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Photos & Action Sidebar (4 Columns) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Photos & Visual Gallery */}
            <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-card">
              <h3 className="font-heading font-bold text-base sm:text-lg text-text flex items-center gap-2 mb-2">
                <Camera className="w-5 h-5 text-primary" />
                <span>Photos & Gallery</span>
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Add photos that showcase the atmosphere, trails, and authentic scenery.
              </p>

              {/* Main Cover Photo Preview */}
              <div className="mb-4">
                <span className="block text-xs font-bold text-text uppercase tracking-wider mb-2">
                  Primary Cover Photo *
                </span>
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-gray-100 border border-border shadow-subtle group">
                  <img
                    src={coverPhoto}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-white text-primary font-bold text-xs shadow-md flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold">
                    Main Cover
                  </div>
                </div>

                {/* Direct Image URL input for Cover */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="url"
                    value={coverPhoto}
                    onChange={(e) => setCoverPhoto(e.target.value)}
                    placeholder="Paste image URL..."
                    className="flex-1 text-xs font-medium border border-border rounded-xl px-3 py-2 outline-none focus:border-primary"
                  />
                  <label className="cursor-pointer px-3 py-2 rounded-xl bg-light-bg hover:bg-gray-200 text-text border border-border font-medium text-xs flex items-center gap-1 shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Quick Presets */}
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-text-muted block mb-1.5">
                    Quick sample photography:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {presetPhotos.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setCoverPhoto(preset.url)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          coverPhoto === preset.url
                            ? 'bg-primary/10 border-primary text-primary font-bold'
                            : 'bg-white border-border text-text-muted hover:text-text'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Gallery Photos */}
              <div className="pt-4 border-t border-border/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text uppercase tracking-wider">
                    Gallery Photos ({galleryPhotos.length})
                  </span>
                  <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-light-bg hover:bg-gray-200 text-text border border-border font-semibold text-[11px] flex items-center gap-1 transition-colors">
                    <Plus className="w-3 h-3 text-primary" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Input URL for Gallery */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="Extra photo URL..."
                    className="flex-1 text-xs font-medium border border-border rounded-xl px-3 py-1.5 outline-none focus:border-primary"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddGalleryUrl}
                    className="shrink-0 text-xs py-1 px-3"
                  >
                    Add
                  </Button>
                </div>

                {/* Gallery Thumbnails List */}
                {galleryPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {galleryPhotos.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-border group"
                      >
                        <img
                          src={imgUrl}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryPhoto(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Card: Publish Actions */}
            <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-card space-y-4">
              <h4 className="font-heading font-bold text-sm text-text flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" />
                <span>Ready to Share?</span>
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Once published, your spot is unboxed on the public map and discoverable by community travellers.
              </p>

              <div className="space-y-2.5 pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  icon={<Sparkles className="w-4 h-4 text-accent" />}
                  className="w-full font-bold shadow-card hover:shadow-hover justify-center py-3"
                >
                  {isSubmitting ? 'Publishing Place...' : 'Publish Location & Place'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onCancel ? onCancel() : navigate(isInApp ? '/app/explore' : '/explore')}
                  disabled={isSubmitting}
                  className="w-full text-xs text-text-muted hover:text-text justify-center"
                >
                  Cancel
                </Button>
              </div>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
};
