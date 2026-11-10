import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Lock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { vaultApi } from '../../lib/api';

export interface DocumentOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentType?: string;
  documentId?: string;
  onVerified: () => void;
  onSaveWithoutVerification?: () => void;
}

export const DocumentOtpModal: React.FC<DocumentOtpModalProps> = ({
  isOpen,
  onClose,
  documentName,
  documentType = 'Passport',
  documentId,
  onVerified,
  onSaveWithoutVerification,
}) => {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [channel, setChannel] = useState<'email' | 'phone'>('email');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const [maskedIdentifier, setMaskedIdentifier] = useState('');

  // Default to phone if user has verified phone, else email
  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setErrorMsg('');
      setDevOtp(undefined);
      setOtpSent(false);

      if (user?.phone && user.phoneVerified) {
        setChannel('phone');
      } else {
        setChannel('email');
      }
    }
  }, [isOpen, user]);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSendOtp = async (selectedChannel: 'email' | 'phone' = channel) => {
    if (selectedChannel === 'phone' && !user?.phone) {
      setErrorMsg('No phone number registered on your account. Please select Registered Email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await vaultApi.requestDocumentOtp({
        channel: selectedChannel,
        documentName,
        documentType,
      });

      setOtpSent(true);
      setCooldown(res.data?.resendCooldownSeconds || 60);
      setMaskedIdentifier(res.data?.maskedIdentifier || (selectedChannel === 'phone' ? user?.phone || '' : user?.email || ''));
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp);
      }
      success(
        `Verification code sent to your registered ${selectedChannel === 'phone' ? 'phone' : 'email'}!`,
        'Code Dispatched'
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to dispatch verification code';
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter a complete 6-digit OTP code');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const targetIdentifier = channel === 'phone' ? user?.phone : user?.email;
      const res = await vaultApi.verifyDocumentOtp({
        identifier: targetIdentifier || '',
        otp: cleanOtp,
        documentId,
        documentType,
      });

      if (res.data?.isVerified) {
        success(
          `Document verified! ${documentName} is now confirmed with OTP and secured in your Travel Vault.`,
          'Verification Complete 🎉'
        );
        if (refreshUser) {
          refreshUser().catch(() => {});
        }
        onVerified();
        onClose();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid or expired OTP code';
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-gray-100 text-left relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-gray-900">
              Verify Document with OTP
            </h3>
            <p className="text-xs text-gray-500">
              Security confirmation for <span className="font-semibold text-gray-700">{documentName}</span>
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            TripzoBox requires OTP verification with your registered email or phone number before marking any sensitive identity document as officially verified.
          </p>
        </div>

        {/* Channel Selector */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Send One-Time Password (OTP) To:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Registered Email Option */}
            <button
              type="button"
              onClick={() => {
                setChannel('email');
                setOtpSent(false);
                setErrorMsg('');
              }}
              className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                channel === 'email'
                  ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  channel === 'email' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-gray-900">Registered Email</span>
                <span className="block text-[11px] text-gray-500 truncate" title={user?.email}>
                  {user?.email || 'No email registered'}
                </span>
              </div>
            </button>

            {/* Registered Phone Option */}
            <button
              type="button"
              disabled={!user?.phone}
              onClick={() => {
                if (!user?.phone) return;
                setChannel('phone');
                setOtpSent(false);
                setErrorMsg('');
              }}
              className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                !user?.phone
                  ? 'border-gray-200 bg-gray-50/60 opacity-60 cursor-not-allowed'
                  : channel === 'phone'
                  ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 cursor-pointer'
                  : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  channel === 'phone' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-gray-900">Registered Mobile</span>
                <span className="block text-[11px] text-gray-500 truncate">
                  {user?.phone ? user.phone : 'Not linked yet'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Dispatch button if not yet sent */}
        {!otpSent ? (
          <div className="mt-5 space-y-3">
            <button
              type="button"
              disabled={loading || (channel === 'phone' && !user?.phone)}
              onClick={() => handleSendOtp(channel)}
              className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching OTP...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Send OTP to {channel === 'phone' ? 'Mobile' : 'Email'}</span>
                </>
              )}
            </button>

            {onSaveWithoutVerification && (
              <button
                type="button"
                onClick={onSaveWithoutVerification}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-center"
              >
                Save document as unverified and verify later
              </button>
            )}
          </div>
        ) : (
          /* Step 2: Enter OTP Form */
          <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Code sent to <b className="text-gray-900">{maskedIdentifier || (channel === 'phone' ? user?.phone : user?.email)}</b>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSendOtp(channel)}
                disabled={cooldown > 0 || loading}
                className="text-xs font-semibold text-primary hover:underline disabled:text-gray-400 disabled:no-underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                {cooldown > 0 ? `${cooldown}s` : 'Resend'}
              </button>
            </div>

            {/* Test/Dev helper banner */}
            {devOtp && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                <span>
                  Test OTP Code: <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-300">{devOtp}</code>
                </span>
                <button
                  type="button"
                  onClick={() => setOtp(devOtp)}
                  className="font-bold text-amber-900 underline ml-2 cursor-pointer"
                >
                  Auto Fill
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center text-2xl font-mono tracking-[0.5em] text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:tracking-normal placeholder:font-sans placeholder:text-gray-300"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting || otp.length !== 6}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Verify Document</span>
                  </>
                )}
              </button>
            </div>

            {onSaveWithoutVerification && (
              <button
                type="button"
                onClick={onSaveWithoutVerification}
                className="w-full py-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline transition-colors text-center cursor-pointer"
              >
                Skip verification and save as unverified
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

