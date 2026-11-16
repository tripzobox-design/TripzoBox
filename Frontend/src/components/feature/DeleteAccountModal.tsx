import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AccountDeletionPreflight,
  accountDeletionApi,
  authApi,
  tripsApi,
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReauthSuccess?: boolean;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  initialReauthSuccess = false,
}) => {
  const { user, clearDeletedAccountSession } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [preflight, setPreflight] = useState<AccountDeletionPreflight | null>(null);
  const [loadingPreflight, setLoadingPreflight] = useState(false);
  const [preflightError, setPreflightError] = useState<string | null>(null);

  // Leadership resolution state per tripId
  const [selectedLeaders, setSelectedLeaders] = useState<Record<string, string>>({});
  const [tripActionBusy, setTripActionBusy] = useState<string | null>(null);

  // Re-authentication state
  const [currentPassword, setCurrentPassword] = useState('');
  const [appleConfirmPhrase, setAppleConfirmPhrase] = useState('');
  const [reauthVerified, setReauthVerified] = useState(initialReauthSuccess);
  const [verifyingReauth, setVerifyingReauth] = useState(false);

  // Email OTP state
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Final irreversible confirmation safeguards (hard to click accidentally)
  const [typedConfirm, setTypedConfirm] = useState('');
  const [acknowledgeIrreversible, setAcknowledgeIrreversible] = useState(false);
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadPreflight = async () => {
    setLoadingPreflight(true);
    setPreflightError(null);
    try {
      const data = await accountDeletionApi.getPreflight();
      setPreflight(data);
      const defaults: Record<string, string> = {};
      data.blockingTrips.forEach((t) => {
        if (t.eligibleNewLeaders.length > 0) {
          defaults[t.id] = t.eligibleNewLeaders[0].id;
        }
      });
      setSelectedLeaders((prev) => ({ ...defaults, ...prev }));
      if (data.authMethods.hasRecentReauth || initialReauthSuccess) {
        setReauthVerified(true);
      }
    } catch (err: any) {
      setPreflightError(
        err?.message || 'Unable to verify account deletion requirements. Please try again.'
      );
    } finally {
      setLoadingPreflight(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setActionError(null);
    setOtpCode('');
    setTypedConfirm('');
    setAcknowledgeIrreversible(false);
    loadPreflight();
  }, [isOpen, initialReauthSuccess]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const blockingTrips = preflight?.blockingTrips || [];
  const hasBlockingTrips = blockingTrips.length > 0;
  const authMethods = preflight?.authMethods;
  const requiresOtp = Boolean(authMethods?.requiresEmailOtp);

  const canSubmitFinalDeletion = useMemo(() => {
    if (isDeleting || loadingPreflight || !preflight || hasBlockingTrips) return false;
    if (!reauthVerified) return false;
    if (!acknowledgeIrreversible) return false;
    if (typedConfirm.trim().toUpperCase() !== 'DELETE') return false;
    if (requiresOtp && otpCode.replace(/\s+/g, '').length !== 6) return false;
    return true;
  }, [
    isDeleting,
    loadingPreflight,
    preflight,
    hasBlockingTrips,
    reauthVerified,
    acknowledgeIrreversible,
    typedConfirm,
    requiresOtp,
    otpCode,
  ]);

  if (!isOpen) return null;

  const handleTransferLeadership = async (tripId: string) => {
    const newLeaderId = selectedLeaders[tripId];
    if (!newLeaderId) {
      setActionError('Please choose an eligible trip member before transferring leadership.');
      return;
    }
    setTripActionBusy(tripId);
    setActionError(null);
    try {
      await tripsApi.transferLeadership(tripId, newLeaderId);
      success('Trip leadership transferred successfully.');
      await loadPreflight();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to transfer trip leadership.');
    } finally {
      setTripActionBusy(null);
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    setTripActionBusy(tripId);
    setActionError(null);
    try {
      await tripsApi.deleteTrip(tripId);
      success('Active trip cancelled successfully.');
      await loadPreflight();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to cancel active trip.');
    } finally {
      setTripActionBusy(null);
    }
  };

  const handleVerifyPassword = async () => {
    if (!currentPassword.trim()) {
      setActionError('Please enter your current password.');
      return;
    }
    setVerifyingReauth(true);
    setActionError(null);
    try {
      await accountDeletionApi.verifyPasswordReauth(currentPassword);
      setReauthVerified(true);
      success('Identity verified. You may now proceed with confirmation.');
      await loadPreflight();
    } catch (err: any) {
      setReauthVerified(false);
      setActionError(err?.message || 'Current password verification failed.');
    } finally {
      setVerifyingReauth(false);
    }
  };

  const handleGoogleReauth = () => {
    const redirectTarget = '/app/account-security?action=delete-account';
    window.location.href = authApi.getGoogleReauthUrl(redirectTarget);
  };

  const handleFallbackOAuthReauth = async () => {
    setVerifyingReauth(true);
    setActionError(null);
    try {
      const provider = authMethods?.isAppleConnected ? 'apple' : 'passwordless';
      await accountDeletionApi.verifyOAuthFallbackReauth(provider, appleConfirmPhrase);
      setReauthVerified(true);
      success('Identity re-verified.');
      await loadPreflight();
    } catch (err: any) {
      setActionError(err?.message || 'Identity verification failed.');
    } finally {
      setVerifyingReauth(false);
    }
  };

  const handleSendOtp = async () => {
    setOtpSending(true);
    setActionError(null);
    try {
      const res = await accountDeletionApi.requestDeletionOtp(
        authMethods?.hasPassword ? currentPassword || undefined : undefined
      );
      setOtpRequested(true);
      setCooldownSeconds(res.resendCooldownSeconds || 60);
      success('Verification code sent to your registered email address.');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to send verification code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitFinalDeletion) return;

    setIsDeleting(true);
    setActionError(null);
    try {
      const response = await accountDeletionApi.deleteCurrentAccount({
        ...(authMethods?.hasPassword && currentPassword ? { currentPassword } : {}),
        ...(requiresOtp ? { otp: otpCode.trim() } : {}),
        confirmationText: typedConfirm.trim().toUpperCase(),
        confirmDeletion: true,
        reason: reason.trim() || undefined,
      });

      const completionMessage =
        response?.message || 'Your TripzoBox account deletion request has been completed.';

      clearDeletedAccountSession(user?.id);
      onClose();
      success(completionMessage, 'Account Deleted');
      navigate('/login', {
        replace: true,
        state: { accountDeletedMessage: completionMessage },
      });
    } catch (err: any) {
      const msg = err?.message || 'Could not complete account deletion. Please check your details.';
      setActionError(msg);
      toastError(msg, 'Deletion Failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-modal-title"
    >
      <div className="bg-white rounded-3xl border border-red-200 shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-gray-100 px-5 sm:px-6 py-4 flex items-center justify-between gap-3 rounded-t-3xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <h2
                id="delete-account-modal-title"
                className="text-base sm:text-lg font-bold text-gray-900 truncate"
              >
                Delete Account
              </h2>
              <p className="text-xs text-gray-500">Permanent account closure & data removal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close delete account dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer shrink-0 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleDeleteAccount} className="p-5 sm:p-6 space-y-5 text-left">
          {/* Mandatory Warning Banner */}
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 space-y-2">
            <p className="text-sm font-bold text-red-900">
              Are you sure you want to delete your TripzoBox account?
            </p>
            <p className="text-xs sm:text-sm text-red-800 leading-relaxed">
              Deleting your account will permanently remove your profile and personal information.
              You may lose access to your trips, messages, travel stories and saved documents. This
              action may not be reversible.
            </p>
          </div>

          {loadingPreflight ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Checking active trips and security settings...</p>
            </div>
          ) : preflightError ? (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs sm:text-sm text-amber-900 space-y-2">
              <p className="font-semibold">{preflightError}</p>
              <button
                type="button"
                onClick={loadPreflight}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Retry check
              </button>
            </div>
          ) : (
            preflight && (
              <>
                {/* Data Impact & Retention Transparency */}
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    What happens when you delete your account
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-white rounded-xl p-2 border border-gray-200">
                      <div className="text-sm font-bold text-gray-900">
                        {preflight.impactSummary.vaultDocuments}
                      </div>
                      <div className="text-[11px] text-gray-500">Vault Docs</div>
                    </div>
                    <div className="bg-white rounded-xl p-2 border border-gray-200">
                      <div className="text-sm font-bold text-gray-900">
                        {preflight.impactSummary.diaryEntries}
                      </div>
                      <div className="text-[11px] text-gray-500">Diary Entries</div>
                    </div>
                    <div className="bg-white rounded-xl p-2 border border-gray-200">
                      <div className="text-sm font-bold text-gray-900">
                        {preflight.impactSummary.joinedTrips}
                      </div>
                      <div className="text-[11px] text-gray-500">Joined Trips</div>
                    </div>
                    <div className="bg-white rounded-xl p-2 border border-gray-200">
                      <div className="text-sm font-bold text-gray-900">
                        {preflight.impactSummary.reviewsAuthored}
                      </div>
                      <div className="text-[11px] text-gray-500">Reviews Anonymized</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Private Travel Vault documents, uploaded files, notifications, and private diary
                    entries are permanently deleted. Public stories, ratings, and shared trip chat
                    messages are anonymized as <strong>Deleted User</strong>. Minimal moderation and
                    security audit records may be retained for safety and compliance.
                  </p>
                </div>

                {/* Step 1: Active Led Trips Blocker Resolution */}
                {hasBlockingTrips && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold text-amber-950">
                          Action Required: Resolve Active Led Trips ({blockingTrips.length})
                        </h3>
                        <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                          You are currently the Trip Leader for {blockingTrips.length} active trip
                          {blockingTrips.length > 1 ? 's' : ''}. Transfer leadership to an eligible
                          member or cancel the trip before deleting your account.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {blockingTrips.map((trip) => (
                        <div
                          key={trip.id}
                          className="bg-white rounded-xl border border-amber-200 p-3 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-gray-900">
                                {trip.name}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {trip.destination} • Status: {trip.status}
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              <Users className="w-3 h-3 inline mr-1" />
                              {trip.eligibleNewLeaders.length} eligible member
                              {trip.eligibleNewLeaders.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          {trip.eligibleNewLeaders.length > 0 ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <select
                                value={selectedLeaders[trip.id] || ''}
                                onChange={(e) =>
                                  setSelectedLeaders((prev) => ({
                                    ...prev,
                                    [trip.id]: e.target.value,
                                  }))
                                }
                                aria-label={`Select new leader for ${trip.name}`}
                                className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                {trip.eligibleNewLeaders.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} {m.city ? `(${m.city})` : ''}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={tripActionBusy === trip.id}
                                onClick={() => handleTransferLeadership(trip.id)}
                                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                              >
                                {tripActionBusy === trip.id
                                  ? 'Transferring...'
                                  : 'Transfer Leadership'}
                              </button>
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-600">
                              No other confirmed members to transfer leadership to. Cancel this trip
                              to continue.
                            </p>
                          )}

                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={tripActionBusy === trip.id}
                              onClick={() => handleCancelTrip(trip.id)}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline cursor-pointer disabled:opacity-50"
                            >
                              Cancel & Remove Trip
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Re-Authentication Verification */}
                <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-700 shrink-0" />
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                        Step 1: Verify Your Identity
                      </h3>
                    </div>
                    {reauthVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  {authMethods?.hasPassword ? (
                    <div className="space-y-2.5">
                      <label
                        htmlFor="delete-account-password"
                        className="block text-xs font-medium text-gray-700"
                      >
                        Enter your current TripzoBox password
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          id="delete-account-password"
                          type="password"
                          autoComplete="current-password"
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            if (reauthVerified) setReauthVerified(false);
                          }}
                          placeholder="Current password"
                          className="flex-1 rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          disabled={verifyingReauth || !currentPassword.trim()}
                          onClick={handleVerifyPassword}
                          className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {verifyingReauth ? 'Verifying...' : 'Verify Password'}
                        </button>
                      </div>
                    </div>
                  ) : authMethods?.isGoogleConnected ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">
                        Your account signs in with Google. Re-authenticate with your connected
                        Google account to authorize permanent deletion.
                      </p>
                      <button
                        type="button"
                        onClick={handleGoogleReauth}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold transition cursor-pointer"
                      >
                        {reauthVerified
                          ? 'Google Re-authentication Complete (Re-verify)'
                          : 'Re-authenticate with Google'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label
                        htmlFor="delete-reauth-phrase"
                        className="block text-xs text-gray-600"
                      >
                        Type <strong>DELETE MY ACCOUNT</strong> to confirm re-authentication for
                        your {authMethods?.isAppleConnected ? 'Apple' : 'passwordless'} account:
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          id="delete-reauth-phrase"
                          type="text"
                          value={appleConfirmPhrase}
                          onChange={(e) => setAppleConfirmPhrase(e.target.value)}
                          placeholder="DELETE MY ACCOUNT"
                          className="flex-1 rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          disabled={verifyingReauth || !appleConfirmPhrase.trim()}
                          onClick={handleFallbackOAuthReauth}
                          className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        >
                          {verifyingReauth ? 'Confirming...' : 'Confirm Identity'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3: Fresh Email Confirmation OTP (required for verified emails) */}
                {requiresOtp && (
                  <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                          Step 2: Email Security Confirmation Code
                        </h3>
                      </div>
                      {authMethods?.maskedEmail && (
                        <span className="text-[11px] font-mono text-gray-500">
                          {authMethods.maskedEmail}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      Send a fresh 6-digit single-use confirmation code to your verified email
                      address before deleting your account.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={!reauthVerified || otpSending || cooldownSeconds > 0}
                        onClick={handleSendOtp}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        {otpSending
                          ? 'Sending code...'
                          : cooldownSeconds > 0
                          ? `Resend code in ${cooldownSeconds}s`
                          : otpRequested
                          ? 'Resend Verification Code'
                          : 'Send Verification Code'}
                      </button>
                      {!reauthVerified && (
                        <span className="text-[11px] text-gray-500">
                          Complete Step 1 first to unlock code dispatch.
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="delete-account-otp"
                        className="block text-xs font-medium text-gray-700"
                      >
                        Enter 6-digit email confirmation code
                      </label>
                      <input
                        id="delete-account-otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-center font-mono text-base tracking-[0.4em] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Final Accidental-Click Safeguard */}
                <div className="rounded-2xl border border-gray-200 p-4 space-y-3 bg-gray-50/60">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="delete-confirm-input"
                      className="block text-xs font-semibold text-gray-800"
                    >
                      Type <span className="font-mono text-red-700">DELETE</span> to enable account
                      deletion
                    </label>
                    <input
                      id="delete-confirm-input"
                      type="text"
                      value={typedConfirm}
                      onChange={(e) => setTypedConfirm(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="delete-reason-input"
                      className="block text-xs font-medium text-gray-600"
                    >
                      Optional feedback (helps improve TripzoBox)
                    </label>
                    <input
                      id="delete-reason-input"
                      type="text"
                      maxLength={300}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Optional reason for leaving"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 text-xs text-gray-700 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={acknowledgeIrreversible}
                      onChange={(e) => setAcknowledgeIrreversible(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span>
                      I understand that deleting my account permanently removes my personal profile
                      and cannot be reversed.
                    </span>
                  </label>
                </div>
              </>
            )
          )}

          {actionError && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-red-800"
            >
              {actionError}
            </div>
          )}

          {/* Modal Action Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmitFinalDeletion}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Delete My Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

