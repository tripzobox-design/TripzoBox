import React, { useState, useEffect } from 'react';
import {
  Star,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Heart,
  UserCheck,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../../components/ui/Avatar';

export const AdminReviewsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reportedOnly, setReportedOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Moderation Modal
  const [moderatingReview, setModeratingReview] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState<'active' | 'hidden' | 'flagged'>('hidden');
  const [moderationReason, setModerationReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await adminApi.safety.getReviews({
        page,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        reported: reportedOnly ? true : undefined,
        q: searchQuery.trim() || undefined,
      });

      if (data) {
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (e: any) {
      toastError('Failed to load reviews: ' + (e?.message || 'Unknown error'));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, statusFilter, reportedOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleOpenModeration = (review: any, status: 'active' | 'hidden' | 'flagged') => {
    setModeratingReview(review);
    setTargetStatus(status);
    setModerationReason('');
  };

  const handleConfirmModeration = async () => {
    if (!moderatingReview) return;
    setActionLoading(true);
    try {
      await adminApi.safety.updateReviewStatus(
        moderatingReview.id || moderatingReview._id,
        targetStatus,
        moderationReason.trim() || `Status updated to ${targetStatus} by administrator`
      );
      success(`Review status updated to ${targetStatus}`);
      setModeratingReview(null);
      fetchReviews();
    } catch (err: any) {
      toastError(err?.message || 'Failed to update review status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReview = async (review: any) => {
    if (!window.confirm(`Permanently delete review by ${review.reviewerName} on trip ${review.tripName}?`)) {
      return;
    }
    try {
      await adminApi.safety.deleteReview(review.id || review._id);
      success('Review permanently deleted');
      fetchReviews();
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete review');
    }
  };

  const counts = {
    total: totalCount,
    active: reviews.filter((r) => r.status === 'active').length,
    flagged: reviews.filter((r) => r.isReported || r.status === 'flagged').length,
    hidden: reviews.filter((r) => r.status === 'hidden').length,
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Trust & Safety Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mt-1">
            Traveller Review Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit, verify, and moderate post-trip ratings across all TripzoBox travellers and journeys.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Reviews
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
          <span className="text-xs text-slate-500 mt-0.5 block">Recorded in database</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Active Verified
          </span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{counts.active}</p>
          <span className="text-xs text-emerald-600/80 mt-0.5 block">Visible on user profiles</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Reported / Flagged
          </span>
          <p className="text-2xl font-black text-amber-700 mt-1">{counts.flagged}</p>
          <span className="text-xs text-amber-600/80 mt-0.5 block">Requires moderation inspection</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
            Hidden Reviews
          </span>
          <p className="text-2xl font-black text-rose-700 mt-1">{counts.hidden}</p>
          <span className="text-xs text-rose-600/80 mt-0.5 block">Excluded from reputation</span>
        </div>
      </div>

      {/* Search & Filters Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviewer, traveller, trip, or written feedback..."
              className="w-full pl-10 pr-24 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {[
              { id: 'all', label: 'All Reviews' },
              { id: 'active', label: 'Active' },
              { id: 'flagged', label: 'Flagged' },
              { id: 'hidden', label: 'Hidden' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Reported Only Toggle */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reportedOnly}
                onChange={(e) => {
                  setReportedOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span>Reported only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Reviews Table / Feed */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs sm:text-sm">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading reviews from database...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Star className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-base text-slate-800">No reviews found</h4>
            <p className="text-xs text-slate-400">
              Try adjusting your search criteria or status filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((rev) => {
              const ratings = rev.ratings || {};
              const isFlagged = rev.isReported || rev.status === 'flagged';
              const isHidden = rev.status === 'hidden';

              return (
                <div
                  key={rev.id || rev._id}
                  className={`p-4 sm:p-6 transition-colors hover:bg-slate-50/50 ${
                    isFlagged ? 'bg-amber-50/20' : isHidden ? 'bg-rose-50/20' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Review Info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <Avatar src={rev.reviewerAvatar} name={rev.reviewerName} size="lg" />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {rev.reviewerName}
                          </span>
                          <span className="text-xs text-slate-400">&rarr;</span>
                          <span className="font-bold text-sm text-emerald-800">
                            {rev.revieweeName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({rev.tripName})
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isHidden
                                ? 'bg-rose-100 text-rose-800'
                                : isFlagged
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {rev.status}
                          </span>
                        </div>

                        {/* Overall & Category Ratings */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <div className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{ratings.overall || 5} / 5</span>
                          </div>

                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 text-[11px]">
                            Friendliness: <b className="text-slate-700">{ratings.friendliness || 5}</b>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 text-[11px]">
                            Comm: <b className="text-slate-700">{ratings.communication || 5}</b>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 text-[11px]">
                            Punct: <b className="text-slate-700">{ratings.punctuality || 5}</b>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 text-[11px]">
                            Coop: <b className="text-slate-700">{ratings.cooperation || 5}</b>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 text-[11px]">
                            Resp: <b className="text-slate-700">{ratings.responsibility || 5}</b>
                          </span>
                        </div>

                        {/* Written Comment */}
                        <p className="text-xs sm:text-sm text-slate-700 italic pt-1 leading-relaxed">
                          {rev.comment ? `"${rev.comment}"` : <span className="text-slate-400 italic">No written comment submitted</span>}
                        </p>

                        {/* Tags */}
                        {Array.isArray(rev.tags) && rev.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {rev.tags.map((t: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Reported Reason Callout */}
                        {rev.isReported && (
                          <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Flagged by traveller:</span>{' '}
                              <span>{rev.reportReason || 'No reason provided'}</span>
                            </div>
                          </div>
                        )}

                        {/* Moderation Note Callout */}
                        {rev.moderationNote && (
                          <div className="mt-1 text-[11px] text-slate-500">
                            <b>Admin Note:</b> {rev.moderationNote}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                      {isHidden ? (
                        <button
                          type="button"
                          onClick={() => handleOpenModeration(rev, 'active')}
                          className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenModeration(rev, 'hidden')}
                          className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide Review</span>
                        </button>
                      )}

                      {isFlagged && (
                        <button
                          type="button"
                          onClick={() => handleOpenModeration(rev, 'active')}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Dismiss Flag</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Permanently Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-xl border border-slate-200 text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-xl border border-slate-200 text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Moderation Modal */}
      {moderatingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-left space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-lg text-slate-900">
                {targetStatus === 'hidden' ? 'Hide Review' : 'Restore Review'}
              </h3>
              <button
                type="button"
                onClick={() => setModeratingReview(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {targetStatus === 'hidden'
                ? 'Hiding this review will remove it from the traveller\'s public profile and automatically recalculate their reputation score on MongoDB.'
                : 'Restoring this review will make it visible again and re-include its ratings in the traveller\'s overall reputation score.'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Moderation Reason / Note
              </label>
              <textarea
                rows={3}
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Explain the reason for this moderation action (saved to audit logs)..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-600 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModeratingReview(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmModeration}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-xs cursor-pointer ${
                  targetStatus === 'hidden'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading ? 'Processing...' : targetStatus === 'hidden' ? 'Confirm Hide' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

