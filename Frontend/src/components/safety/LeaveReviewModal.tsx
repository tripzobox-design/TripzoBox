import React, { useState } from 'react';
import { X, Star, ShieldCheck, AlertCircle } from 'lucide-react';
import { safetyApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle?: string;
  revieweeId: string;
  revieweeName?: string;
  onSuccess?: () => void;
}

interface RatingCategoryConfig {
  key: 'overall' | 'communication' | 'punctuality' | 'cooperation' | 'respectfulBehaviour';
  label: string;
  description: string;
}

const CATEGORIES: RatingCategoryConfig[] = [
  { key: 'overall', label: 'Overall Experience', description: 'Overall reliability, companionship, and experience' },
  { key: 'communication', label: 'Communication', description: 'Clear, timely, and responsive messaging' },
  { key: 'punctuality', label: 'Punctuality', description: 'Adherence to agreed meetup schedules and itinerary' },
  { key: 'cooperation', label: 'Cooperation & Teamwork', description: 'Helpfulness and flexibility as a travel companion' },
  { key: 'respectfulBehaviour', label: 'Respectful Behaviour', description: 'Respect for personal boundaries, safety rules, and local customs' },
];

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  isOpen,
  onClose,
  tripId,
  tripTitle,
  revieweeId,
  revieweeName,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [ratings, setRatings] = useState({
    overall: 5,
    communication: 5,
    punctuality: 5,
    cooperation: 5,
    respectfulBehaviour: 5,
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  if (!isOpen) return null;

  const handleStarClick = (category: keyof typeof ratings, starValue: number) => {
    setRatings(prev => ({ ...prev, [category]: starValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      error('Please provide at least 10 characters in your written review.');
      return;
    }

    setSubmitting(true);
    try {
      await safetyApi.submitTravellerReview({
        tripId,
        revieweeId,
        ratings,
        comment: comment.trim(),
      });
      success('Review submitted successfully! Thank you for keeping our community trustworthy.');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Rate & Review Traveller</h3>
              <p className="text-xs text-gray-500">
                {revieweeName ? `Reviewing ${revieweeName}` : 'Post-Trip Feedback'}
                {tripTitle ? ` • ${tripTitle}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-blue-900 text-xs flex gap-2.5 items-start">
            <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Honest Community Reputation:</span> Reviews can only be submitted by verified companions who completed this trip together. Reviews help keep solo travellers and groups safe.
            </div>
          </div>

          {/* Rating Categories */}
          <div className="space-y-4">
            {CATEGORIES.map((cat) => {
              const currentRating = ratings[cat.key];
              const isHoveringThis = hoveredCategory === cat.key;

              return (
                <div key={cat.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{cat.label}</div>
                    <div className="text-xs text-gray-500">{cat.description}</div>
                  </div>
                  <div
                    className="flex items-center gap-1 mt-1 sm:mt-0"
                    onMouseLeave={() => {
                      setHoveredCategory(null);
                      setHoveredStar(0);
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = isHoveringThis ? star <= hoveredStar : star <= currentRating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleStarClick(cat.key, star)}
                          onMouseEnter={() => {
                            setHoveredCategory(cat.key);
                            setHoveredStar(star);
                          }}
                          className="p-1 hover:scale-110 transition-transform focus:outline-none"
                          aria-label={`${star} stars for ${cat.label}`}
                        >
                          <Star
                            className={`w-5 h-5 ${
                              isFilled
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="w-6 text-center text-xs font-semibold text-gray-700 ml-1">
                      {isHoveringThis ? hoveredStar : currentRating}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Written Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your experience travelling with this companion. Did they communicate well, respect safety guidelines, and arrive on time?"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            />
            <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
              <span>Minimum 10 characters</span>
              <span className={comment.length < 10 ? 'text-amber-600' : 'text-gray-500'}>
                {comment.length} / 1000
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || comment.trim().length < 10}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

