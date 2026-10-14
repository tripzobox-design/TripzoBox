import React from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Compass, Sparkles } from 'lucide-react';
import { mockDestinations } from '../data/mockDestinations';
import { useDiary } from '../context/DiaryContext';
import { Button } from '../components/ui/Button';
import { StoryCard } from '../components/feature/StoryCard';

export const DestinationDetailPage: React.FC = () => {
  const { destinationSlug } = useParams<{ destinationSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isInApp = location.pathname.startsWith('/app');
  const { stories } = useDiary();

  const destination = mockDestinations.find((d) => d.slug === destinationSlug);

  if (!destination) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-heading font-bold text-2xl text-text">Destination not found</h2>
        <Button variant="primary" onClick={() => navigate('/explore')} className="mt-4">
          Back to Destinations
        </Button>
      </div>
    );
  }

  // Related stories
  const relatedStories = stories.filter(
    (s) =>
      s.destination.toLowerCase().includes(destination.name.toLowerCase()) ||
      s.title.toLowerCase().includes(destination.name.toLowerCase())
  );

  return (
    <div className={`flex flex-col gap-8 text-left max-w-6xl mx-auto ${isInApp ? '' : 'px-4 sm:px-6 lg:px-8 py-8 sm:py-10'}`}>
      {/* Back Link */}
      <div>
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Destinations</span>
        </Link>

        {/* Hero Image */}
        <div className="relative rounded-3xl overflow-hidden aspect-[21/9] min-h-[260px] max-h-[420px] w-full bg-text shadow-float">
          <img
            src={destination.imageUrl}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 sm:left-10 text-white">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              {destination.state}, India
            </span>
            <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-white mt-1">
              {destination.name}
            </h1>
          </div>
        </div>
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
