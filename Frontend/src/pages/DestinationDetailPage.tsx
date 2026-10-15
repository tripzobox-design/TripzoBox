import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Compass,
  Sparkles,
  Camera,
  Share2,
  Check,
  Globe,
  User,
} from 'lucide-react';
import { useDestinations } from '../context/DestinationsContext';
import { useDiary } from '../context/DiaryContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { StoryCard } from '../components/feature/StoryCard';

export const DestinationDetailPage: React.FC = () => {
  const { destinationSlug } = useParams<{ destinationSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isInApp = location.pathname.startsWith('/app');
  const { destinations } = useDestinations();
  const { stories } = useDiary();
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();

  const handleAddPlace = () => {
    if (!isLoggedIn) {
      showToast('Please log in to add and share a place', 'info');
      navigate('/login?redirect=/explore/create');
    } else {
      navigate(isInApp ? '/app/explore/create' : '/explore/create');
    }
  };

  const destination = destinations.find((d) => d.slug === destinationSlug);

  const [activeImage, setActiveImage] = useState<string | null>(null);

  if (!destination) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-heading font-bold text-2xl text-text">Destination not found</h2>
        <Button variant="primary" onClick={() => navigate(isInApp ? '/app/explore' : '/explore')} className="mt-4">
          Back to Destinations
        </Button>
      </div>
    );
  }

  const currentHeroImage = activeImage || destination.imageUrl;
  const gallery = destination.galleryImages && destination.galleryImages.length > 0
    ? destination.galleryImages
    : [destination.imageUrl];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!', 'success');
  };

  // Related stories
  const relatedStories = stories.filter(
    (s) =>
      s.destination.toLowerCase().includes(destination.name.toLowerCase()) ||
      s.title.toLowerCase().includes(destination.name.toLowerCase())
  );

  return (
    <div className={`flex flex-col gap-8 text-left max-w-6xl mx-auto ${isInApp ? '' : 'px-4 sm:px-6 lg:px-8 py-8 sm:py-10'}`}>
      {/* Back Link & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to={isInApp ? '/app/explore' : '/explore'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Destinations</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            icon={<Share2 className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Share Location
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddPlace}
            icon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
            className="text-xs font-semibold"
          >
            + Add Another Place
          </Button>
        </div>
      </div>

      {/* Main Hero & Visual Showcase */}
      <div className="space-y-3">
        <div className="relative rounded-3xl overflow-hidden aspect-[21/9] min-h-[280px] max-h-[460px] w-full bg-text shadow-float">
          <img
            src={currentHeroImage}
            alt={destination.name}
            className="w-full h-full object-cover transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Badges Top Left & Right */}
          <div className="absolute top-4 left-4 sm:left-6 flex flex-wrap gap-2">
            {(destination.isHiddenSpot || destination.category === 'Hidden Spots') && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-accent text-xs font-bold border border-accent/30 shadow-subtle">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hidden Gem / Secret Spot</span>
              </span>
            )}
            {destination.isPublic !== false && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 backdrop-blur-md text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <Globe className="w-3.5 h-3.5" />
                <span>Public Community Place</span>
              </span>
            )}
          </div>

          {/* Hero Bottom Info */}
          <div className="absolute bottom-6 left-6 sm:left-10 right-6 sm:right-10 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{destination.state}, India</span>
              </span>
              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-white mt-1 drop-shadow-sm">
                {destination.name}
              </h1>
              <p className="text-xs sm:text-sm text-gray-200 mt-1 max-w-2xl drop-shadow-sm">
                {destination.shortDescription}
              </p>
            </div>

            {destination.createdBy && (
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-black/50 backdrop-blur-md border border-white/20 shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/80 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                  {destination.createdBy.avatarUrl ? (
                    <img src={destination.createdBy.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    destination.createdBy.name.charAt(0)
                  )}
                </div>
                <div className="text-left text-xs">
                  <span className="text-gray-300 block text-[10px]">Created & Shared by</span>
                  <span className="font-semibold text-white">{destination.createdBy.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Thumbnails Strip (if multiple photos exist) */}
        {gallery.length > 1 && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
            <span className="text-xs font-bold text-text-muted flex items-center gap-1 shrink-0 pl-1">
              <Camera className="w-3.5 h-3.5 text-primary" />
              <span>{gallery.length} Photos:</span>
            </span>
            {gallery.map((img, i) => {
              const isSelected = img === currentHeroImage;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`relative aspect-video h-14 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    isSelected ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-border/80 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Overview & Quick Info Card */}
      <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-heading font-bold text-xl text-text">
            About {destination.name}
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            {destination.longDescription || destination.shortDescription}
          </p>

          {destination.topAttractions && (
            <div className="pt-3">
              <h4 className="font-heading font-semibold text-sm text-text mb-2.5">
                Top Attractions & Highlights
              </h4>
              <div className="flex flex-wrap gap-2">
                {destination.topAttractions.map((attraction, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs bg-light-bg text-text font-medium px-3.5 py-1.5 rounded-full border border-border"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    {attraction}
                  </span>
                ))}
              </div>
            </div>
          )}

          {destination.locationDetails && (
            <div className="pt-3 border-t border-border/60">
              <h4 className="font-heading font-semibold text-sm text-text mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span>How to Reach & Location Details</span>
              </h4>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed bg-light-bg rounded-xl p-3 border border-border">
                {destination.locationDetails}
              </p>
            </div>
          )}
        </div>

        {/* Right Info Box */}
        <div className="bg-light-bg rounded-xl p-5 border border-border flex flex-col justify-between text-left space-y-4">
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <span className="text-text-muted text-xs block">Best Time to Visit</span>
              <span className="font-semibold text-text flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-4 h-4 text-primary" />
                {destination.bestTimeToVisit || 'October to April'}
              </span>
            </div>
            <div>
              <span className="text-text-muted text-xs block">Category</span>
              <span className="font-semibold text-text capitalize">
                {destination.category}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate(isInApp ? `/app/trips?q=${encodeURIComponent(destination.name)}` : `/trips?q=${encodeURIComponent(destination.name)}`)}
            icon={<Compass className="w-4 h-4" />}
            className="w-full text-xs font-semibold"
          >
            Find Trips to {destination.name}
          </Button>
        </div>
      </div>

      {/* Related Stories */}
      <div>
        <h3 className="font-heading font-bold text-xl sm:text-2xl text-text mb-5">
          Travel Stories from {destination.name}
        </h3>
        {relatedStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-8 text-center text-text-muted text-sm">
            Be the first to publish a travel story from {destination.name}!
          </div>
        )}
      </div>
    </div>
  );
};
