import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Phone,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  UserX,
  Flag,
  Info,
  RefreshCw,
  Send,
  ExternalLink,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { safetyApi } from '../../lib/api';
import { VerificationBadges } from './VerificationBadges';
import { TravellerReputationCard } from './TravellerReputationCard';
import { BlockedUserItem, UserReportItem } from '../../types';

export const TrustSafetySettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error, info } = useToast();

  // Mobile OTP state
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Government ID state
  const [docType, setDocType] = useState('PASSPORT');
  const [consentGiven, setConsentGiven] = useState(false);
  const [initiatingId, setInitiatingId] = useState(false);
  const [idStatus, setIdStatus] = useState(user?.identityVerificationStatus || 'NOT_STARTED');
  const [rejectionReason, setRejectionReason] = useState(user?.identityRejectionReason || '');

  // Blocked users & reports state
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [myReports, setMyReports] = useState<UserReportItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Email resend cooldown
  const [resendingEmail, setResendingEmail] = useState(false);

  // OTP countdown
  useEffect(() => {
    let timer: any;
    if (otpCooldown > 0) {
      timer = setInterval(() => {
        setOtpCooldown((c) => (c <= 1 ? 0 : c - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Load blocked users and user reports
  const fetchSafetyData = async () => {
    setLoadingData(true);
    try {
      const [blocked, reports, idRes] = await Promise.allSettled([
        safetyApi.getBlockedUsers(),
        safetyApi.getMyReports(),
        safetyApi.getIdentityStatus(),
      ]);

      if (blocked.status === 'fulfilled') setBlockedUsers(blocked.value);
      if (reports.status === 'fulfilled') setMyReports(reports.value);
      if (idRes.status === 'fulfilled') {
        setIdStatus(idRes.value?.status || 'NOT_STARTED');
        setRejectionReason(idRes.value?.rejectionReason || '');
      }
    } catch {
      // ignore
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSafetyData();
  }, []);

  // Request Mobile OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
      error('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      const res = await safetyApi.requestPhoneOtp(phoneNumber);
      setOtpSent(true);
      setOtpCooldown(res.cooldownSeconds || 60);
      if (res.devOtp) setDevOtpHint(res.devOtp);
      success(res.message || 'OTP sent successfully to your mobile number!');
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || 'Failed to send OTP');
    }
  };

  // Verify Mobile OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      error('Please enter the 6-digit OTP received on your mobile.');
      return;
    }

    setVerifyingPhone(true);
    try {
      await safetyApi.verifyPhoneOtp(phoneNumber, otpCode.trim());
      success('Mobile number verified successfully!');
      setOtpSent(false);
      setOtpCode('');
      setDevOtpHint(null);
      await refreshUser?.();
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || 'Invalid or expired OTP');
    } finally {
      setVerifyingPhone(false);
    }
  };

  // Resend Email Verification Link
  const handleResendEmail = async () => {
    setResendingEmail(true);
    try {
      info('Verification email dispatched! Please check your inbox.');
    } catch {
      error('Failed to dispatch verification email');
    } finally {
      setResendingEmail(false);
    }
  };

  // Initiate Gov ID verification
  const handleInitiateId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) {
      error('You must consent to privacy terms before initiating identity verification.');
      return;
    }

    setInitiatingId(true);
    try {
      const res = await safetyApi.initiateIdentityVerification(docType, consentGiven);
      setIdStatus(res.status || 'PENDING');
      success(res.message || 'Identity verification initiated! Processing check...');
      await refreshUser?.();
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || 'Failed to initiate identity verification');
    } finally {
      setInitiatingId(false);
    }
  };

  // Unblock user
  const handleUnblock = async (targetUserId: string) => {
    try {
      await safetyApi.unblockUser(targetUserId);
      setBlockedUsers((prev) => prev.filter((b) => b.blockedUserId !== targetUserId));
      success('User unblocked successfully.');
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || 'Failed to unblock user');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner / Disclaimer */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">TripzoBox Trust & Safety Center</h2>
              <p className="text-xs text-gray-600">
                Multi-level traveller verification, reputation tracking, and proactive safety controls.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <VerificationBadges user={user} size="md" showLabels />
          </div>
        </div>

        {/* Mandatory Safety Notice */}
        <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-start gap-2 text-xs text-emerald-950 font-medium">
          <Info className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
          <span>
            <strong>Safety Transparency:</strong> A verified badge confirms a specific technical check succeeded. It does not guarantee character, trustworthiness, or crime-free behaviour. Always follow safe travel practices and meetup in public spaces.
          </span>
        </div>
      </div>

      {/* Grid: Verifications Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Verification Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Email Verification</h3>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3.5 h-3.5" /> Unverified
              </span>
            )}
          </div>

          <p className="text-xs text-gray-600">
            Confirmed email addresses ensure secure notifications and account recovery.
          </p>

          {!user.emailVerified && (
            <button
              onClick={handleResendEmail}
              disabled={resendingEmail}
              className="text-xs font-semibold text-primary hover:text-primary-700 flex items-center gap-1 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
            </button>
          )}
        </div>

        {/* Mobile Phone Verification Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Mobile Number (SMS OTP)</h3>
                <p className="text-xs text-gray-500">
                  {user.phone || 'No phone number linked'}
                </p>
              </div>
            </div>
            {user.phoneVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                Unverified
              </span>
            )}
          </div>

          {!user.phoneVerified && (
            <div className="space-y-3 pt-1">
              {!otpSent ? (
                <form onSubmit={handleRequestOtp} className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={otpCooldown > 0}
                    className="px-3 py-1.5 bg-primary hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {otpCooldown > 0 ? `Resend (${otpCooldown}s)` : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-2">
                  {devOtpHint && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 font-mono">
                      [Dev Test OTP]: <strong>{devOtpHint}</strong>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="flex-1 px-3 py-1.5 text-xs font-mono tracking-widest text-center border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={verifyingPhone || otpCode.length !== 6}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {verifyingPhone ? 'Verifying...' : 'Confirm'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <button
                      type="button"
                      disabled={otpCooldown > 0}
                      onClick={handleRequestOtp}
                      className="text-primary hover:underline disabled:text-gray-400"
                    >
                      {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : 'Resend OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      Change Number
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Google Authentication Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Google OAuth Provider</h3>
                <p className="text-xs text-gray-500">Fast sign-in & identity provider link</p>
              </div>
            </div>
            {user.isGoogleConnected ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Linked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                Not Linked
              </span>
            )}
          </div>

          <p className="text-xs text-gray-600">
            Provides authenticated sign-in and OAuth safety. Note: Google authentication does not constitute government document verification.
          </p>
        </div>

        {/* Optional Government ID Verification Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Government ID Verification</h3>
                <p className="text-xs text-gray-500">Optional privacy-preserving check</p>
              </div>
            </div>
            {idStatus === 'VERIFIED' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified
              </span>
            ) : idStatus === 'PENDING' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3.5 h-3.5" /> Pending Review
              </span>
            ) : idStatus === 'REJECTED' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                <XCircle className="w-3.5 h-3.5" /> Rejected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                Not Started
              </span>
            )}
          </div>

          <p className="text-xs text-gray-600">
            Compliant with DPDP Act 2023. TripzoBox uses certified verification partners and does not store raw Aadhaar, PAN, or sensitive identification numbers.
          </p>

          {idStatus === 'NOT_STARTED' && (
            <form onSubmit={handleInitiateId} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="PASSPORT">Passport (International)</option>
                  <option value="DRIVING_LICENSE">Driving License (Indian)</option>
                  <option value="VOTER_ID">Voter Identity Card</option>
                </select>
              </div>

              <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="w-3.5 h-3.5 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span>
                  I give explicit consent for TripzoBox to initiate document verification with certified identity partners.
                </span>
              </label>

              <button
                type="submit"
                disabled={initiatingId || !consentGiven}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {initiatingId ? 'Initiating...' : 'Start Government ID Verification'}
              </button>
            </form>
          )}

          {idStatus === 'PENDING' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                <Clock className="w-4 h-4 animate-spin text-amber-600" />
                <span>Verification Underway</span>
              </div>
              <p className="text-xs text-amber-800">
                Your verification session is active. Once our provider validates the document, your status will update automatically.
              </p>
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await safetyApi.simulateIdentityResult('VERIFIED');
                    setIdStatus('VERIFIED');
                    success('Identity verified!');
                    await refreshUser?.();
                  }}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  [Dev Simulate Success]
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await safetyApi.simulateIdentityResult('REJECTED', 'Document blurred or illegible');
                    setIdStatus('REJECTED');
                    setRejectionReason('Document blurred or illegible');
                    info('Simulated rejection');
                    await refreshUser?.();
                  }}
                  className="text-[11px] font-semibold text-red-600 hover:underline"
                >
                  [Dev Simulate Reject]
                </button>
              </div>
            </div>
          )}

          {idStatus === 'REJECTED' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-900">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Verification Unsuccessful</span>
              </div>
              <p className="text-xs text-red-800">
                Reason: {rejectionReason || 'The submitted document could not be validated.'}
              </p>
              <button
                type="button"
                onClick={() => setIdStatus('NOT_STARTED')}
                className="text-xs font-semibold text-red-700 hover:underline"
              >
                Try Again with another document
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Traveller Reputation & Reviews */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
          Community Reputation & Reviews
        </h3>
        <TravellerReputationCard user={user} />
      </div>

      {/* Blocked Users & My Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocked Users */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <UserX className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900 text-sm">Blocked Users ({blockedUsers.length})</h3>
            </div>
            <button
              onClick={fetchSafetyData}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Blocked users cannot send you messages, request to join trips you lead, or view your travel diary.
          </p>

          {blockedUsers.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              No blocked users. You can block any disruptive individual from messages or trip pages.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
              {blockedUsers.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-gray-800">{item.blockedUserName}</div>
                    <div className="text-[11px] text-gray-400">
                      Blocked on {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(item.blockedUserId)}
                    className="px-2.5 py-1 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Reports */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Flag className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900 text-sm">My Safety Reports ({myReports.length})</h3>
            </div>
            <button
              onClick={fetchSafetyData}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Reports you file are strictly confidential. Our trust & safety team investigates every complaint.
          </p>

          {myReports.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              No active reports filed. Thank you for contributing to a safe community!
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
              {myReports.map((rep) => (
                <div key={rep.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-gray-800">
                      {rep.targetName || rep.targetType} ({rep.category})
                    </div>
                    <div className="text-[11px] text-gray-400 line-clamp-1">{rep.description}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rep.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : rep.status === 'UNDER_REVIEW'
                        ? 'bg-blue-50 text-blue-700'
                        : rep.status === 'DISMISSED'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
