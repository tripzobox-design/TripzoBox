import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Mail,
  Phone,
  Globe,
  Info,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import { User } from '../../types';

interface VerificationBadgesProps {
  user: Partial<User>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const VerificationBadges: React.FC<VerificationBadgesProps> = ({
  user,
  size = 'md',
  showLabels = true,
  showDetails = false,
  className = '',
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const isEmailVerified = Boolean(user.emailVerified);
  const isPhoneVerified = Boolean(user.phoneVerified);
  const isGoogleConnected = Boolean(user.isGoogleConnected);
  const idStatus = user.identityVerificationStatus || 'NOT_STARTED';
  const isIdVerified = idStatus === 'VERIFIED';
  const isIdPending = idStatus === 'PENDING';

  const badgeSizeClass =
    size === 'xs'
      ? 'text-[9px] px-1.5 py-0.5 gap-0.5'
      : size === 'sm'
      ? 'text-[10px] px-2 py-0.5 gap-1'
      : size === 'lg'
      ? 'text-xs px-3.5 py-1.5 gap-1.5'
      : 'text-[11px] px-2.5 py-1 gap-1.5';

  const iconSize =
    size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {/* 1. Email Verified Badge */}
      {isEmailVerified ? (
        <div
          className={`inline-flex items-center rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs cursor-pointer select-none transition-transform active:scale-95 ${badgeSizeClass}`}
          onClick={() => setActiveTooltip(activeTooltip === 'email' ? null : 'email')}
          title="Email verified via secure confirmation link"
        >
          <Mail className={`${iconSize} text-primary`} />
          <span>Email Verified</span>
          <CheckCircle2 className={`${iconSize} text-emerald-600 stroke-[2.5]`} />
        </div>
      ) : showDetails ? (
        <div
          className={`inline-flex items-center rounded-full font-medium bg-gray-50 text-gray-500 border border-gray-200 ${badgeSizeClass}`}
        >
          <Mail className={`${iconSize} text-gray-400`} />
          <span>Email Unverified</span>
        </div>
      ) : null}

      {/* 2. Mobile Phone Verified Badge */}
      {isPhoneVerified ? (
        <div
          className={`inline-flex items-center rounded-full font-semibold bg-blue-50 text-blue-800 border border-blue-200/90 shadow-2xs cursor-pointer select-none transition-transform active:scale-95 ${badgeSizeClass}`}
          onClick={() => setActiveTooltip(activeTooltip === 'phone' ? null : 'phone')}
          title="Mobile number verified via secure OTP"
        >
          <Phone className={`${iconSize} text-blue-600`} />
          <span>Phone Verified</span>
          <CheckCircle2 className={`${iconSize} text-blue-600 stroke-[2.5]`} />
        </div>
      ) : showDetails ? (
        <div
          className={`inline-flex items-center rounded-full font-medium bg-gray-50 text-gray-500 border border-gray-200 ${badgeSizeClass}`}
        >
          <Phone className={`${iconSize} text-gray-400`} />
          <span>Phone Unverified</span>
        </div>
      ) : null}

      {/* 3. Google Connected Badge */}
      {isGoogleConnected && (
        <div
          className={`inline-flex items-center rounded-full font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs cursor-pointer select-none transition-transform active:scale-95 ${badgeSizeClass}`}
          onClick={() => setActiveTooltip(activeTooltip === 'google' ? null : 'google')}
          title="Authenticated with verified Google profile"
        >
          <Globe className={`${iconSize} text-amber-600`} />
          <span>Google Connected</span>
          <CheckCircle2 className={`${iconSize} text-amber-600 stroke-[2.5]`} />
        </div>
      )}

      {/* 4. Government ID Verified Badge */}
      {isIdVerified ? (
        <div
          className={`inline-flex items-center rounded-full font-bold bg-purple-50 text-purple-900 border border-purple-200/90 shadow-2xs cursor-pointer select-none transition-transform active:scale-95 ${badgeSizeClass}`}
          onClick={() => setActiveTooltip(activeTooltip === 'id' ? null : 'id')}
          title="Government identity document verified"
        >
          <ShieldCheck className={`${iconSize} text-purple-600 stroke-[2.5]`} />
          <span>ID Verified</span>
          <CheckCircle2 className={`${iconSize} text-purple-600 stroke-[3]`} />
        </div>
      ) : isIdPending ? (
        <div
          className={`inline-flex items-center rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${badgeSizeClass}`}
          onClick={() => setActiveTooltip(activeTooltip === 'id' ? null : 'id')}
        >
          <Clock className={`${iconSize} text-amber-600 animate-spin`} />
          <span>ID Verification Pending</span>
        </div>
      ) : showDetails ? (
        <div
          className={`inline-flex items-center rounded-full font-medium bg-gray-50 text-gray-500 border border-gray-200 ${badgeSizeClass}`}
        >
          <ShieldCheck className={`${iconSize} text-gray-400`} />
          <span>ID Not Verified</span>
        </div>
      ) : null}

      {/* Verification Explanation Tooltip / Modal */}
      {activeTooltip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h4 className="font-heading font-bold text-sm text-gray-900">
                  {activeTooltip === 'email' && 'Email Verification'}
                  {activeTooltip === 'phone' && 'Mobile OTP Verification'}
                  {activeTooltip === 'google' && 'Google Account Connection'}
                  {activeTooltip === 'id' && 'Government ID Verification'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveTooltip(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 text-xs text-gray-600 space-y-2">
              {activeTooltip === 'email' && (
                <p>
                  This traveller confirmed ownership of their email address through an encrypted verification link.
                </p>
              )}
              {activeTooltip === 'phone' && (
                <p>
                  This traveller confirmed ownership of their mobile number through single-use time-limited SMS OTP.
                </p>
              )}
              {activeTooltip === 'google' && (
                <p>
                  This account is safely linked to a validated Google OAuth identity profile.
                </p>
              )}
              {activeTooltip === 'id' && (
                <p>
                  This traveller voluntarily submitted a government-issued photo identification document (e.g. Passport or Driver License) validated through a privacy-preserving regulatory verification provider.
                </p>
              )}

              {/* Crucial Mandatory Safety Disclaimer */}
              <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-start gap-2 mt-3">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Important Notice:</strong> A verified badge indicates a specific technical check succeeded. It does not guarantee character, trustworthiness, or personal safety. Always exercise normal personal safety precautions when meeting travellers.
                </span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setActiveTooltip(null)}
                className="px-4 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
