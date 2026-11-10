import React, { useState } from 'react';
import { X, PhoneCall, ShieldAlert, Send, CheckCircle2, Lock, Navigation } from 'lucide-react';
import { safetyApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface EmergencyAssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId?: string;
  tripTitle?: string;
}

export const EmergencyAssistanceModal: React.FC<EmergencyAssistanceModalProps> = ({
  isOpen,
  onClose,
  tripId,
  tripTitle,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [contactPhone, setContactPhone] = useState(user?.emergencyContact?.phone || '');
  const [contactEmail, setContactEmail] = useState('');
  const [shareLocationConsent, setShareLocationConsent] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!isOpen) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPhone && !contactEmail) {
      error('Please provide either an emergency phone number or email address');
      return;
    }

    if (!tripId) {
      error('Please select an active trip to share itinerary details');
      return;
    }

    setSharing(true);
    try {
      await safetyApi.shareTripWithEmergencyContact({
        tripId,
        contactPhone,
        contactEmail,
        shareLocationConsent,
      });
      setShareSuccess(true);
      success('Trip details and safety links dispatched to your emergency contact!');
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || 'Failed to dispatch emergency info');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-red-100 bg-red-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Emergency & Safety Assistance</h3>
              <p className="text-xs text-red-600 font-medium">Quick Access Help & Itinerary Sharing</p>
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
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Quick Helplines */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              Official Indian Emergency Helplines
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="tel:112"
                className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors group"
              >
                <div>
                  <div className="font-bold text-red-900 text-base">112</div>
                  <div className="text-xs text-red-700">All-in-One Emergency</div>
                </div>
                <PhoneCall className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
              </a>

              <a
                href="tel:100"
                className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors group"
              >
                <div>
                  <div className="font-bold text-blue-900 text-base">100</div>
                  <div className="text-xs text-blue-700">Police Helpline</div>
                </div>
                <PhoneCall className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              </a>

              <a
                href="tel:108"
                className="flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors group"
              >
                <div>
                  <div className="font-bold text-emerald-900 text-base">108</div>
                  <div className="text-xs text-emerald-700">Ambulance / Medical</div>
                </div>
                <PhoneCall className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </a>

              <a
                href="tel:1091"
                className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors group"
              >
                <div>
                  <div className="font-bold text-purple-900 text-base">1091 / 181</div>
                  <div className="text-xs text-purple-700">Women Helpline</div>
                </div>
                <PhoneCall className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          {/* Share Itinerary Section */}
          <div className="border-t border-gray-100 pt-5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Share Trip With Trusted Contact
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Keep friends or family informed about your whereabouts, leader contact, and emergency plans.
            </p>

            {shareSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-sm">Itinerary details sent!</span>
                  A secure link with your itinerary and emergency details has been dispatched.
                </div>
              </div>
            ) : (
              <form onSubmit={handleShare} className="space-y-3.5">
                {tripTitle && (
                  <div className="text-xs text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <span className="text-gray-500">Selected Trip:</span> <span className="font-medium">{tripTitle}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Emergency Phone Number
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Emergency Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="trustedperson@example.com"
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                {/* Consent checkbox for location */}
                <label className="flex items-start gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareLocationConsent}
                    onChange={(e) => setShareLocationConsent(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5 shrink-0"
                  />
                  <div className="text-xs text-gray-700">
                    <span className="font-semibold block flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-primary-600 inline" /> Include Current Location Link
                    </span>
                    I explicitly consent to attach my device location with this dispatch. TripzoBox does not continuously track you without your permission.
                  </div>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={sharing || (!contactPhone && !contactEmail)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sharing ? 'Dispatching...' : 'Send Itinerary'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl flex items-center gap-2 text-[11px] text-gray-500">
            <Lock className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <span>Emergency alerts are strictly encrypted and only shared with designated contacts.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

