import React from 'react';
import { Star, MessageSquare, Clock, ThumbsUp, HeartHandshake, Shield, Flag } from 'lucide-react';
import { TravellerReviewItem, User } from '../../types';

interface TravellerReputationCardProps {
  user: Partial<User>;
  reviews?: TravellerReviewItem[];
  onReportReview?: (reviewId: string) => void;
  onOpenReviewModal?: () => void;
  canReview?: boolean;
}

export const TravellerReputationCard: React.FC<TravellerReputationCardProps> = ({
  user,
  reviews = [],
  onReportReview,
  onOpenReviewModal,
  canReview = false,
}) => {
  const reputation = user.reputation || {
    averageRating: 0,
    reviewCount: 0,
    communicationRating: 0,
    punctualityRating: 0,
    cooperationRating: 0,
    respectfulRating: 0,
    completedTripsCount: 0,
  };

  const avgRating = reputation.averageRating || 0;
  const reviewCount = reputation.reviewCount || reviews.length || 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-card p-5 sm:p-7 text-left space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-gray-900">
              Traveller Reputation & Reviews
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Genuine ratings submitted by verified co-travellers from completed trips.
          </p>
        </div>

        {canReview && onOpenReviewModal && (
          <button
            type="button"
            onClick={onOpenReviewModal}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Leave a Review
          </button>
        )}
      </div>

      {/* Main Score & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Overall Score Box */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 via-accent/20 to-light-bg p-5 border border-emerald-200/80 flex items-center gap-5">
          <div className="text-center shrink-0">
            <div className="text-3xl sm:text-4xl font-extrabold font-heading text-emerald-950">
              {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
            </div>
            <div className="flex items-center justify-center gap-0.5 text-amber-500 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-500 font-medium block mt-1">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          <div className="h-16 w-px bg-emerald-200/70" />

          <div className="space-y-1.5 min-w-0">
            <div className="text-xs font-bold text-gray-800">Completed Journeys</div>
            <p className="text-xs text-gray-600">
              <strong className="text-primary font-bold text-sm">
                {reputation.completedTripsCount || user.stats?.trips || 0}
              </strong>{' '}
              verified expeditions completed
            </p>
            <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
              TripzoBox Verified Explorer
            </span>
          </div>
        </div>

        {/* 4 Category Breakdowns */}
        <div className="space-y-3">
          {/* Communication */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                Communication
              </span>
              <span>{(reputation.communicationRating || avgRating || 5).toFixed(1)} / 5</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{
                  width: `${((reputation.communicationRating || avgRating || 5) / 5) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Punctuality */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Punctuality & Reliability
              </span>
              <span>{(reputation.punctualityRating || avgRating || 5).toFixed(1)} / 5</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{
                  width: `${((reputation.punctualityRating || avgRating || 5) / 5) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Cooperation */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
              <span className="flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-amber-600" />
                Group Cooperation
              </span>
              <span>{(reputation.cooperationRating || avgRating || 5).toFixed(1)} / 5</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full"
                style={{
                  width: `${((reputation.cooperationRating || avgRating || 5) / 5) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Respectful Behaviour */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
              <span className="flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
                Respectful Behaviour
              </span>
              <span>{(reputation.respectfulRating || avgRating || 5).toFixed(1)} / 5</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full"
                style={{
                  width: `${((reputation.respectfulRating || avgRating || 5) / 5) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3 pt-2">
        <h4 className="font-heading font-bold text-sm text-gray-800">
          Recent Reviews ({reviews.length})
        </h4>

        {reviews.length > 0 ? (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/30">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-white space-y-2 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        rev.reviewerAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={rev.reviewerName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <span className="font-bold text-xs text-gray-900 block leading-tight">
                        {rev.reviewerName}
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        Trip: {rev.tripName} •{' '}
                        {new Date(rev.createdAt).toLocaleDateString('en-GB', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-gray-800">
                      {rev.ratings.overall.toFixed(1)}
                    </span>
                    {onReportReview && (
                      <button
                        type="button"
                        onClick={() => onReportReview(rev.id)}
                        className="ml-2 p-1 text-gray-300 hover:text-red-600 transition-colors cursor-pointer"
                        title="Report inappropriate review"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed font-normal pl-10">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
            No traveller reviews submitted yet. Completed trips unlock mutual peer reviews!
          </div>
        )}
      </div>
    </div>
  );
};

