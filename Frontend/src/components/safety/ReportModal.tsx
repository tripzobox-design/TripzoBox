import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Flag } from 'lucide-react';
import { safetyApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ReportCategory } from '../../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'user' | 'trip' | 'message';
  targetId: string;
  targetName?: string;
  onSuccess?: () => void;
}

const CATEGORIES: { id: ReportCategory; label: string; desc: string }[] = [
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Unwanted persistent contact or aggressive behaviour' },
  { id: 'inappropriate_behaviour', label: 'Inappropriate Behaviour', desc: 'Disrespectful, vulgar, or offensive conduct' },
  { id: 'scam_fraud', label: 'Scam, Fraud or Financial Abuse', desc: 'Asking for illicit money transfers or suspicious deals' },
  { id: 'fake_identity', label: 'Fake Identity / Impersonation', desc: 'Misrepresenting identity or using fake photos' },
  { id: 'threatening_behaviour', label: 'Threatening or Dangerous Behaviour', desc: 'Threats of violence, coercion, or harm' },
  { id: 'safety_concern', label: 'Safety Concern During Trip', desc: 'Violation of trip safety rules or reckless actions' },
  { id: 'inappropriate_messages', label: 'Inappropriate Messages', desc: 'Spam, advertising, or unsolicited explicit content' },
  { id: 'other', label: 'Other Safety Violation', desc: 'Any other violation of TripzoBox Community Rules' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [category, setCategory] = useState<ReportCategory>('harassment');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      error('Please provide at least 10 characters detailing the safety concern.');
      return;
    }

    try {
      setSubmitting(true);
      await safetyApi.submitReport({
        targetType,
        targetId,
        targetName,
        category,
        description: description.trim(),
      });
      success('Report submitted successfully. Our trust & safety team will review it confidentially.');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 text-left animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-red-600">
            <Flag className="w-5 h-5" />
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-gray-900">
              Report Safety Concern
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="p-3 bg-red-50/80 rounded-2xl border border-red-100 text-xs text-red-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>
              Reporting: <strong>{targetName || targetId}</strong> ({targetType})
              <br />
              All reports are strictly confidential and reviewed by trained safety personnel.
            </span>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Reason / Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Describe what happened <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details, dates, and context to help our moderation team evaluate this concern..."
              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary outline-none transition-all resize-none"
              required
            />
            <span className="text-[10px] text-gray-400 float-right">
              {description.length} / 2000 chars
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

