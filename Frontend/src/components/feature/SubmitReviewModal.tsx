import React, { useState, useEffect } from 'react';
import {
  Star,
  X,
  AlertCircle,
  Sparkles,
  Heart,
  MessageSquare,
  Clock,
  UserCheck,
  ShieldCheck,
  Check,
  Award,
} from 'lucide-react';
import { safetyApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export interface CompanionItem {
  tripId: string;
  tripName: string;
  companionId: string;
  companionName: string;
  companionAvatar: string;
  alreadyReviewed: boolean;
  existingReview?: any;
}

export interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultRevieweeId?: string;
  defaultTripId?: string;
  defaultTripName?: string;
  defaultRevieweeName?: string;
  defaultRevieweeAvatar?: string;
  existingReview?: any;
  readOnly?: boolean;
}

const SPEC_TAG_OPTIONS = [
  'Friendly',
  'Helpful',
  'Responsible',
  'Punctual',
  'Good Communicator',
  'Cooperative',
  'Respectful',
  'Unreliable',
];

export const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRevieweeId,
  defaultTripId,
  defaultTripName,
  defaultRevieweeName,
  defaultRevieweeAvatar,
  existingReview,
  readOnly = false,
}) => {
  const { success, error } = useToast();

  const [companions, setCompanions] = useState<CompanionItem[]>([]);
  const [loadingCompanions, setLoadingCompanions] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionItem | null>(null);

  // 6 Categories (1 to 5 Stars)
  const [friendliness, setFriendliness] = useState(5); // 1. Behaviour and Friendliness
  const [communication, setCommunication] = useState(5); // 2. Communication
  const [punctuality, setPunctuality] = useState(5); // 3. Punctuality
  const [cooperation, setCooperation] = useState(5); // 4. Cooperation
  const [responsibility, setResponsibility] = useState(5); // 5. Responsibility
  const [overallExperience, setOverallExperience] = useState(5); // 6. Overall Experience

  // Optional Tags & Comment
  const [selectedTags, setSelectedTags] = useState<string[]>(['Friendly', 'Cooperative']);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isViewOnly = Boolean(readOnly || existingReview);

  // Automatically calculate average rating from the categories
  const calculatedAverage = Number(
    ((friendliness + communication + punctuality + cooperation + responsibility + overallExperience) / 6).toFixed(1)
  );

  useEffect(() => {
    if (!isOpen) return;

    if (existingReview) {
      setFriendliness(existingReview.ratings?.friendliness || existingReview.ratings?.respectfulBehaviour || 5);
      setCommunication(existingReview.ratings?.communication || 5);
      setPunctuality(existingReview.ratings?.punctuality || 5);
      setCooperation(existingReview.ratings?.cooperation || 5);
      setResponsibility(existingReview.ratings?.responsibility || 5);
      setOverallExperience(existingReview.ratings?.overall || 5);
      setSelectedTags(existingReview.tags || []);
      setComment(existingReview.comment || '');
      setSelectedCompanion({
        tripId: existingReview.tripId || defaultTripId || '',
        tripName: existingReview.tripName || defaultTripName || 'Completed Journey',
        companionId: existingReview.revieweeId || defaultRevieweeId || '',
        companionName: existingReview.revieweeName || defaultRevieweeName || 'Fellow Traveller',
        companionAvatar: defaultRevieweeAvatar || '',
        alreadyReviewed: true,
      });
      return;
    }

    if (defaultRevieweeId && defaultTripId) {
      setSelectedCompanion({
        tripId: defaultTripId,
        tripName: defaultTripName || 'TripzoBox Journey',
        companionId: defaultRevieweeId,
        companionName: defaultRevieweeName || 'Travel Companion',
        companionAvatar: defaultRevieweeAvatar || '',
        alreadyReviewed: false,
      });
    } else {
      setLoadingCompanions(true);
      safetyApi
        .getReviewableCompanions()
        .then((list: CompanionItem[]) => {
          setCompanions(list || []);
          const eligible = list.find((c) => !c.alreadyReviewed);
          if (eligible) {
            setSelectedCompanion(eligible);
          }
        })
        .catch((err) => console.error('Failed to load reviewable companions', err))
        .finally(() => setLoadingCompanions(false));
    }
  }, [isOpen, defaultRevieweeId, defaultTripId, existingReview]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (isViewOnly) return;
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;

    if (!selectedCompanion) {
      setErrorMsg('Please select an eligible companion from a completed trip.');
      return;
    }

    if (comment.length > 1000) {
      setErrorMsg('Review comment cannot exceed 1000 characters.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await safetyApi.submitTravellerReview({
        tripId: selectedCompanion.tripId,
        revieweeId: selectedCompanion.companionId,
        ratings: {
          overall: calculatedAverage,
          friendliness,
          communication,
          punctuality,
          cooperation,
          responsibility,
        },
        tags: selectedTags,
        comment: comment.trim(),
      });

      success('Thank you! Your verified review has been submitted.', 'Review Published 🎉');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const categoriesConfig = [
    { label: 'Behaviour and Friendliness', val: friendliness, setVal: setFriendliness, icon: Heart, desc: 'Kind, polite, and welcoming demeanor' },
    { label: 'Communication', val: communication, setVal: setCommunication, icon: MessageSquare, desc: 'Responsive and clear discussions' },
    { label: 'Punctuality', val: punctuality, setVal: setPunctuality, icon: Clock, desc: 'On-time for meetups and departures' },
    { label: 'Cooperation', val: cooperation, setVal: setCooperation, icon: UserCheck, desc: 'Helpful group dynamic and team spirit' },
    { label: 'Responsibility', val: responsibility, setVal: setResponsibility, icon: ShieldCheck, desc: 'Careful with group plans & commitments' },
    { label: 'Overall Experience', val: overallExperience, setVal: setOverallExperience, icon: Award, desc: 'Overall satisfaction travelling together' },
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl my-6 relative animate-in fade-in max-h-[92vh] overflow-y-auto text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 tracking-wider uppercase">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{isViewOnly ? 'Submitted Traveller Review' : 'Verified Post-Trip Review'}</span>
        </div>
        <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900 mt-1">
          {isViewOnly ? 'Your Traveller Rating' : 'Rate Fellow Traveller'}
        </h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {isViewOnly
            ? 'Here is the rating and feedback you previously submitted for this traveller.'
            : 'Provide honest 1–5 star ratings across all six core categories. Written review is optional.'}
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Companion Info Card */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Traveller Information
            </label>

            {loadingCompanions ? (
              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-400 animate-pulse">
                Loading eligible travel companions...
              </div>
            ) : companions.length > 0 && !defaultRevieweeId && !isViewOnly ? (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {companions.map((comp) => {
                  const isSelected =
                    selectedCompanion?.companionId === comp.companionId &&
                    selectedCompanion?.tripId === comp.tripId;
                  return (
                    <button
                      key={`${comp.tripId}_${comp.companionId}`}
                      type="button"
                      disabled={comp.alreadyReviewed}
                      onClick={() => setSelectedCompanion(comp)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : comp.alreadyReviewed
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            comp.companionAvatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${comp.companionName}`
                          }
                          alt=""
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-gray-900">{comp.companionName}</p>
                          <p className="text-[10px] text-gray-500">Trip: {comp.tripName}</p>
                        </div>
                      </div>

                      {comp.alreadyReviewed ? (
                        <span className="text-[10px] font-semibold text-gray-400">
                          Submitted
                        </span>
                      ) : isSelected ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : selectedCompanion ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      selectedCompanion.companionAvatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCompanion.companionName}`
                    }
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-300 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">
                      {selectedCompanion.companionName}
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Trip: <span className="font-semibold">{selectedCompanion.tripName}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    isViewOnly
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {isViewOnly ? 'Submitted' : 'Pending Rating'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-500 text-center">
                No companions eligible for review.
              </div>
            )}
          </div>

          {/* Average Rating Score Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                Calculated Average Rating
              </span>
              <p className="text-xs text-emerald-700/80 mt-0.5">
                Computed across all 6 individual rating categories
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-950">
                {calculatedAverage}
              </span>
              <div className="flex items-center text-amber-400">
                <Star className="w-6 h-6 fill-amber-400" />
              </div>
              <span className="text-xs font-bold text-emerald-800">/ 5.0</span>
            </div>
          </div>

          {/* Six Rating Categories (1 to 5 Stars) */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
              Rating Categories (1–5 Stars) *
            </h4>
            <div className="space-y-2">
              {categoriesConfig.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <cat.icon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="text-xs font-bold text-gray-900 block truncate">
                        {idx + 1}. {cat.label}
                      </span>
                      <span className="text-[10px] text-gray-400 hidden sm:block">
                        {cat.desc}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={isViewOnly}
                        onClick={() => cat.setVal(s)}
                        className={`p-0.5 ${isViewOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= cat.val ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-gray-700 ml-1.5 w-4 text-right">
                      {cat.val}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Relevant Feedback Tags (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Relevant Tags <span className="text-gray-400 font-normal lowercase">(optional)</span>
              </label>
              <span className="text-[10px] text-gray-400">
                {selectedTags.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SPEC_TAG_OPTIONS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                const isNegative = tag === 'Unreliable';
                return (
                  <button
                    key={tag}
                    type="button"
                    disabled={isViewOnly}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                      isViewOnly ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      isSelected
                        ? isNegative
                          ? 'bg-rose-100 border-rose-300 text-rose-800'
                          : 'bg-[#0D5A46] text-white border-[#0D5A46] shadow-2xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Written Review */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Written Review <span className="text-gray-400 font-normal lowercase">(optional)</span>
              </label>
              <span className="text-[11px] text-gray-400">
                {comment.length} / 1000 characters
              </span>
            </div>
            <textarea
              rows={3}
              readOnly={isViewOnly}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isViewOnly
                  ? 'No written review was provided.'
                  : 'Optional — Describe your experience travelling with this person, highlights, punctuality, and group compatibility...'
              }
              className={`w-full p-3 rounded-2xl border text-xs sm:text-sm outline-none transition resize-none ${
                isViewOnly
                  ? 'bg-gray-50 border-gray-200 text-gray-700'
                  : 'bg-white border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>

            {!isViewOnly && (
              <button
                type="submit"
                disabled={submitting || !selectedCompanion}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>Submit Review</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
