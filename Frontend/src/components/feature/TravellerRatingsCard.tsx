import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  MessageSquare,
  Clock,
  Heart,
  Award,
  AlertCircle,
  Flag,
  UserCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { safetyApi } from '../../lib/api';
import { Avatar } from '../ui/Avatar';

export interface ReviewItem {
  id: string;
  _id?: string;
  tripId: string;
  tripName: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  ratings: {
    overall: number;
    friendliness?: number;
    communication: number;
    punctuality: number;
    cooperation: number;
    responsibility?: number;
    respectfulBehaviour?: number;
  };
  tags?: string[];
  comment: string;
  createdAt: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: {
    [star: number]: { count: number; percent: number };
  };
  categories: {
    overall: number;
    friendliness: number;
    communication: number;
    punctuality: number;
    cooperation: number;
    responsibility: number;
  };
  positiveTags: Array<{ tag: string; count: number; percent: number }>;
}

interface TravellerRatingsCardProps {
  userId: string;
  userName?: string;
  onOpenReviewModal?: () => void;
  canReview?: boolean;
}

export const TravellerRatingsCard: React.FC<TravellerRatingsCardProps> = ({
  userId,
  userName = 'Traveller',
  onOpenReviewModal,
  canReview = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [filterStar, setFilterStar] = useState<number | null>(null);

  // Reporting modal
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await safetyApi.getUserReviews(userId);
      if (data) {
        setStats(data.stats);
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load user reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchReviews();
    }
  }, [userId]);

  const handleReportReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReviewId || !reportReason.trim()) return;
    setReporting(true);
    try {
      await safetyApi.reportReview(reportingReviewId, reportReason.trim());
      setReportFeedback('Review reported to trust & safety team for inspection.');
      setTimeout(() => {
        setReportingReviewId(null);
        setReportReason('');
        setReportFeedback(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setReporting(false);
    }
  };

  const filteredReviews = filterStar
    ? reviews.filter((r) => Math.round(r.ratings.overall) === filterStar)
    : reviews;

  if (loading) {
    return (
      <div className="w-full bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 animate-pulse space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
          </div>
        </div>
        <div className="h-28 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const hasReviews = stats && stats.totalReviews > 0;

  return (
    <div className="w-full bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified Post-Trip Reviews</span>
          </div>
          <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900 mt-1">
            Traveller Reputation & Feedback
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Reviews from confirmed companions on completed TripzoBox adventures.
          </p>
        </div>

        {canReview && onOpenReviewModal && (
          <button
            onClick={onOpenReviewModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            Write a Review
          </button>
        )}
      </div>

      {!hasReviews ? (
        <div className="py-16 px-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Award className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-gray-900 text-base">No Traveller Reviews Yet</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
            {userName} hasn&apos;t received reviews from completed trips yet. Join a trip with them to share the first verified experience!
          </p>
        </div>
      ) : (
        <div className="p-6 sm:p-8 space-y-8">
          {/* Top Score & Distribution Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gray-50/70 p-6 rounded-2xl border border-gray-100">
            {/* Big Rating Summary */}
            <div className="lg:col-span-4 text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="flex items-baseline gap-2">
                <span className="font-heading font-extrabold text-5xl text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-gray-400 font-bold text-lg">/ 5.0</span>
              </div>

              <div className="flex items-center gap-1 mt-2 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      s <= Math.round(stats.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs font-semibold text-gray-600 mt-2">
                Based on <span className="font-bold text-gray-900">{stats.totalReviews}</span> verified traveller {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Star Distribution Bars */}
            <div className="lg:col-span-8 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const item = stats.distribution[star] || { count: 0, percent: 0 };
                const isSelected = filterStar === star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFilterStar(isSelected ? null : star)}
                    className={`w-full flex items-center gap-3 text-xs group transition cursor-pointer p-1 rounded-lg ${
                      isSelected ? 'bg-emerald-100/50' : 'hover:bg-white'
                    }`}
                  >
                    <span className="w-10 font-bold text-gray-700 flex items-center gap-1 shrink-0">
                      {star} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2.5 bg-gray-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-gray-500 font-medium shrink-0">
                      {item.count} ({item.percent}%)
                    </span>
                  </button>
                );
              })}
              {filterStar && (
                <div className="pt-2 text-right">
                  <button
                    onClick={() => setFilterStar(null)}
                    className="text-xs text-emerald-700 font-semibold hover:underline"
                  >
                    Clear Star Filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 6 Category Breakdown Grid */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
              Detailed Experience Criteria
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Friendliness & Vibe', score: stats.categories.friendliness, icon: Heart },
                { label: 'Communication', score: stats.categories.communication, icon: MessageSquare },
                { label: 'Punctuality', score: stats.categories.punctuality, icon: Clock },
                { label: 'Cooperation & Teamwork', score: stats.categories.cooperation, icon: UserCheck },
                { label: 'Responsibility', score: stats.categories.responsibility, icon: ShieldCheck },
                { label: 'Overall Travel Vibe', score: stats.categories.overall, icon: Award },
              ].map((cat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-gray-100 bg-white shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <cat.icon className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-gray-900">
                      {cat.score ? cat.score.toFixed(1) : '5.0'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${((cat.score || 5) / 5) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-semibold text-gray-600 mt-1.5 truncate">
                      {cat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Positive Feedback Tags */}
          {stats.positiveTags && stats.positiveTags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Top Traveller Impressions
              </h4>
              <div className="flex flex-wrap gap-2">
                {stats.positiveTags.map((tg, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{tg.tag}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-200/60 px-1.5 py-0.5 rounded-full font-bold">
                      {tg.percent}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Individual Reviews Feed */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">
              Recent Reviews ({filteredReviews.length})
            </h4>

            {filteredReviews.map((rev) => (
              <div
                key={rev.id || rev._id}
                className="p-5 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={rev.reviewerAvatar} name={rev.reviewerName} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-sm text-gray-900 leading-tight">
                          {rev.reviewerName}
                        </h5>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          <span>Verified Trip Review</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Travelled together on <span className="font-semibold text-emerald-700">{rev.tripName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{rev.ratings.overall.toFixed(1)}</span>
                    </div>

                    <button
                      onClick={() => setReportingReviewId(rev.id || rev._id || null)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Report inappropriate review"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>

                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rev.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-gray-400 pt-1">
                  Reviewed on {new Date(rev.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Review Modal */}
      {reportingReviewId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in">
            <h4 className="font-bold text-gray-900 text-base mb-1">Report Review</h4>
            <p className="text-xs text-gray-500 mb-4">
              Help us maintain a safe community. Explain why this review violates guidelines.
            </p>

            {reportFeedback ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reportFeedback}</span>
              </div>
            ) : (
              <form onSubmit={handleReportReview} className="space-y-4">
                <textarea
                  rows={3}
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="e.g. Inappropriate language, false claims, harassment..."
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReportingReviewId(null);
                      setReportReason('');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reporting || !reportReason.trim()}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition disabled:opacity-50"
                  >
                    {reporting ? 'Reporting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

