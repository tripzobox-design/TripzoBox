import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Shield,
  Smartphone,
  Apple,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
  Wifi,
  ExternalLink,
  Lock,
  Clock,
  RefreshCw,
  Info,
  Check,
  X,
  Mail,
  Globe,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminAuthSettingsData } from '../../types/admin';
import { AdminTableSkeleton } from '../../components/admin/AdminEmptyState';

export const AdminAuthSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminAuthSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSms, setSavingSms] = useState(false);
  const [savingApple, setSavingApple] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status: string;
    message: string;
    diagnostics?: any;
  } | null>(null);

  // Form local states for Google
  const [googleEnabled, setGoogleEnabled] = useState(true);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [googleCallbackUrl, setGoogleCallbackUrl] = useState('');
  const [savingGoogle, setSavingGoogle] = useState(false);

  // Form local states for Email
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailExpiry, setEmailExpiry] = useState(10);
  const [emailCooldown, setEmailCooldown] = useState(60);
  const [emailMaxAttempts, setEmailMaxAttempts] = useState(5);
  const [emailSmtpHost, setEmailSmtpHost] = useState('');
  const [emailSmtpPort, setEmailSmtpPort] = useState(587);
  const [emailSmtpUser, setEmailSmtpUser] = useState('');
  const [emailSmtpPass, setEmailSmtpPass] = useState('');
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  // Form local states for SMS
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsApiKeyInput, setSmsApiKeyInput] = useState('');
  const [showSmsKey, setShowSmsKey] = useState(false);
  const [smsSenderId, setSmsSenderId] = useState('TRIPZO');
  const [smsExpiry, setSmsExpiry] = useState(5);
  const [smsCooldown, setSmsCooldown] = useState(60);
  const [smsMaxAttempts, setSmsMaxAttempts] = useState(5);

  // Form local states for Apple
  const [appleEnabled, setAppleEnabled] = useState(false);
  const [appleClientId, setAppleClientId] = useState('');
  const [appleTeamId, setAppleTeamId] = useState('');
  const [appleKeyId, setAppleKeyId] = useState('');
  const [applePrivateKeyInput, setApplePrivateKeyInput] = useState('');
  const [showAppleKey, setShowAppleKey] = useState(false);
  const [appleCallbackUrl, setAppleCallbackUrl] = useState('');

  // Notifications / feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await adminApi.authSettings.get();
      setSettings(data);

      // Populate local form state
      setGoogleEnabled(data.googleAuth?.enabled ?? true);
      setGoogleClientId(data.googleAuth?.clientId || '');
      setGoogleClientSecret(data.googleAuth?.maskedClientSecret || '');
      setGoogleCallbackUrl(data.googleAuth?.callbackUrl || '');

      setEmailEnabled(data.emailOtp?.enabled ?? true);
      setEmailExpiry(data.emailOtp?.otpExpiryMinutes ?? 10);
      setEmailCooldown(data.emailOtp?.resendCooldownSeconds ?? 60);
      setEmailMaxAttempts(data.emailOtp?.maxAttempts ?? 5);
      setEmailSmtpHost(data.emailOtp?.smtpHost || '');
      setEmailSmtpPort(data.emailOtp?.smtpPort || 587);
      setEmailSmtpUser(data.emailOtp?.smtpUser || '');
      setEmailSmtpPass(data.emailOtp?.hasSmtpConfigured ? '••••••••' : '');

      setSmsEnabled(data.smsOtp.enabled);
      setSmsApiKeyInput(data.smsOtp.maskedApiKey || '');
      setSmsSenderId(data.smsOtp.senderId || 'TRIPZO');
      setSmsExpiry(data.smsOtp.otpExpiryMinutes || 5);
      setSmsCooldown(data.smsOtp.resendCooldownSeconds || 60);
      setSmsMaxAttempts(data.smsOtp.maxAttempts || 5);

      setAppleEnabled(data.appleAuth.enabled);
      setAppleClientId(data.appleAuth.clientId || '');
      setAppleTeamId(data.appleAuth.teamId || '');
      setAppleKeyId(data.appleAuth.keyId || '');
      setApplePrivateKeyInput(data.appleAuth.maskedPrivateKey || '');
      setAppleCallbackUrl(data.appleAuth.callbackUrl || '');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch auth provider settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Validation helper for Apple
  const isAppleFormValid = Boolean(
    appleClientId.trim() &&
      appleTeamId.trim().length === 10 &&
      appleKeyId.trim().length === 10 &&
      (applePrivateKeyInput.trim().length > 20 || settings?.appleAuth.hasPrivateKey)
  );

  // Validation helper for SMS
  const isSmsFormValid = Boolean(
    smsApiKeyInput.trim().length > 10 || settings?.smsOtp.hasApiKey
  );

  const handleSaveGoogleSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingGoogle(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = await adminApi.authSettings.update({
        googleAuth: {
          enabled: googleEnabled,
          clientId: googleClientId.trim(),
          clientSecret: googleClientSecret.trim(),
          callbackUrl: googleCallbackUrl.trim(),
        },
      });

      setSettings(updated);
      setGoogleEnabled(updated.googleAuth?.enabled ?? true);
      setGoogleClientSecret(updated.googleAuth?.maskedClientSecret || '');
      setSuccessMsg(
        `Google OAuth settings updated successfully! Status: ${
          updated.googleAuth?.enabled ? 'ACTIVE / ENABLED' : 'TEMPORARILY DISABLED'
        }`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save Google OAuth settings');
    } finally {
      setSavingGoogle(false);
    }
  };

  const handleSaveEmailSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingEmail(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = await adminApi.authSettings.update({
        emailOtp: {
          enabled: emailEnabled,
          otpExpiryMinutes: Number(emailExpiry),
          resendCooldownSeconds: Number(emailCooldown),
          maxAttempts: Number(emailMaxAttempts),
          smtpHost: emailSmtpHost.trim(),
          smtpPort: Number(emailSmtpPort) || 587,
          smtpUser: emailSmtpUser.trim(),
          smtpPass: emailSmtpPass.trim(),
        },
      });

      setSettings(updated);
      setEmailEnabled(updated.emailOtp?.enabled ?? true);
      setEmailSmtpPass(updated.emailOtp?.hasSmtpConfigured ? '••••••••' : '');
      setSuccessMsg(
        `Email OTP settings updated successfully! Status: ${
          updated.emailOtp?.enabled ? 'ACTIVE / ENABLED' : 'TEMPORARILY DISABLED'
        }`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save Email OTP settings');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSaveSmsSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingSms(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // If enabling, ensure API key is present
    if (smsEnabled && !isSmsFormValid) {
      setErrorMsg('Cannot enable SMS OTP: Please provide a valid Fast2SMS API key first.');
      setSavingSms(false);
      return;
    }

    try {
      const updated = await adminApi.authSettings.update({
        smsOtp: {
          enabled: smsEnabled,
          apiKey: smsApiKeyInput,
          senderId: smsSenderId,
          otpExpiryMinutes: Number(smsExpiry),
          resendCooldownSeconds: Number(smsCooldown),
          maxAttempts: Number(smsMaxAttempts),
        },
      });

      setSettings(updated);
      setSmsEnabled(updated.smsOtp.enabled);
      setSmsApiKeyInput(updated.smsOtp.maskedApiKey || '');
      setSuccessMsg(
        `SMS OTP settings updated successfully! Status: ${
          updated.smsOtp.enabled ? 'ACTIVE / ENABLED' : 'TEMPORARILY DISABLED'
        }`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save SMS settings');
    } finally {
      setSavingSms(false);
    }
  };

  const handleSaveAppleSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingApple(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // If enabling, ensure all 4 credentials are valid
    if (appleEnabled && !isAppleFormValid) {
      setErrorMsg(
        'Cannot enable Apple Sign-In: Services ID, Team ID (10 chars), Key ID (10 chars), and Private Key must all be configured.'
      );
      setSavingApple(false);
      return;
    }

    try {
      const updated = await adminApi.authSettings.update({
        appleAuth: {
          enabled: appleEnabled,
          clientId: appleClientId,
          teamId: appleTeamId,
          keyId: appleKeyId,
          privateKey: applePrivateKeyInput,
          callbackUrl: appleCallbackUrl,
        },
      });

      setSettings(updated);
      setAppleEnabled(updated.appleAuth.enabled);
      setApplePrivateKeyInput(updated.appleAuth.maskedPrivateKey || '');
      setSuccessMsg(
        `Apple Sign-In settings updated successfully! Status: ${
          updated.appleAuth.enabled ? 'ACTIVE / ENABLED' : 'TEMPORARILY DISABLED'
        }`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save Apple settings');
    } finally {
      setSavingApple(false);
    }
  };

  const handleTestSms = async () => {
    setTestingSms(true);
    setTestResult(null);
    try {
      const res = await adminApi.authSettings.testSms(testPhone.trim() || undefined);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        status: 'ERROR',
        message: err.message || 'Failed to communicate with SMS provider',
      });
    } finally {
      setTestingSms(false);
    }
  };

  if (loading || !settings) {
    return <AdminTableSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Authentication & Login Settings
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 ml-9 sm:ml-10">
            Control live login providers, SMS verification gateways, and OAuth secrets with zero application redeployment.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reload Configuration</span>
        </button>
      </div>

      {/* Status Alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMsg}
          </span>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-2.5 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            {errorMsg}
          </span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Provider Status Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Google OAuth</p>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              {settings.googleAuth?.enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
              settings.googleAuth?.enabled
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {settings.googleAuth?.enabled ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email OTP</p>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              {settings.emailOtp?.enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
              settings.emailOtp?.enabled
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {settings.emailOtp?.enabled ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SMS OTP</p>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              {settings.smsOtp.enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
              settings.smsOtp.enabled
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {settings.smsOtp.enabled ? 'Live' : 'Inactive'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Apple Sign-In</p>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              {settings.appleAuth.enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
              settings.appleAuth.enabled
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {settings.appleAuth.enabled ? 'Live' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Main Grid: 4 Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =========================================================================
            CARD 1: GOOGLE OAUTH SETTINGS
           ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header & Toggle */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Google OAuth Settings</h2>
                  <p className="text-xs text-slate-500">Google Cloud Console credentials & sign-in integration</p>
                </div>
              </div>

              {/* Status Switch */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={googleEnabled}
                  onChange={(e) => setGoogleEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Provider Badge */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Google OAuth 2.0 Status</span>
              {settings.googleAuth?.isConfigured ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                  <Check className="w-3 h-3" /> Fully Configured
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                  Pending Credentials
                </span>
              )}
            </div>

            {/* Google Client ID Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                Client ID
              </label>
              <input
                type="text"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                placeholder="e.g. 1234567890-abc.apps.googleusercontent.com"
                className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition font-mono text-[11px]"
              />
            </div>

            {/* Google Client Secret Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Client Secret
                </label>
                {settings.googleAuth?.hasClientSecret && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Secret Encrypted & Stored
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showGoogleSecret ? 'text' : 'password'}
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  placeholder={settings.googleAuth?.hasClientSecret ? '••••••••••••••••' : 'Enter Google Client Secret'}
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 pl-3.5 pr-10 py-2.5 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showGoogleSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Encrypted with AES-256-GCM before database persistence.
              </p>
            </div>

            {/* Google Callback URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                Authorized Redirect URI / Callback URL
              </label>
              <input
                type="text"
                value={googleCallbackUrl}
                onChange={(e) => setGoogleCallbackUrl(e.target.value)}
                placeholder="https://tripzobox-api.onrender.com/api/auth/google/callback"
                className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2">
            <button
              type="button"
              disabled={savingGoogle}
              onClick={() => handleSaveGoogleSettings()}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingGoogle ? 'Saving Settings...' : 'Save Google Configuration'}</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            CARD 2: EMAIL OTP & SMTP SETTINGS
           ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header & Toggle */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Email OTP & SMTP Settings</h2>
                  <p className="text-xs text-slate-500">Transactional verification email delivery & attempt thresholds</p>
                </div>
              </div>

              {/* Status Switch */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Provider Badge */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Delivery Gateway</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-800 font-bold text-[11px]">
                {settings.emailOtp?.hasSmtpConfigured ? 'Custom SMTP Server' : 'Nodemailer / Ethereal Fallback'}
              </span>
            </div>

            {/* SMTP Host and Port */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">SMTP Host</label>
                <input
                  type="text"
                  value={emailSmtpHost}
                  onChange={(e) => setEmailSmtpHost(e.target.value)}
                  placeholder="e.g. smtp.gmail.com"
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition font-mono text-[11px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Port</label>
                <input
                  type="number"
                  value={emailSmtpPort}
                  onChange={(e) => setEmailSmtpPort(Number(e.target.value))}
                  placeholder="587"
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition text-center font-mono text-[11px]"
                />
              </div>
            </div>

            {/* SMTP User and Pass */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">SMTP Username</label>
                <input
                  type="text"
                  value={emailSmtpUser}
                  onChange={(e) => setEmailSmtpUser(e.target.value)}
                  placeholder="e.g. noreply@tripzobox.com"
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition font-mono text-[11px]"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    SMTP Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showSmtpPass ? 'text' : 'password'}
                    value={emailSmtpPass}
                    onChange={(e) => setEmailSmtpPass(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 pl-3.5 pr-8 py-2.5 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Timings row */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">OTP Expiry (Min)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={emailExpiry}
                  onChange={(e) => setEmailExpiry(Number(e.target.value))}
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-center font-bold focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Cooldown (Sec)</label>
                <input
                  type="number"
                  min={10}
                  max={600}
                  value={emailCooldown}
                  onChange={(e) => setEmailCooldown(Number(e.target.value))}
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-center font-bold focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Max Attempts</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={emailMaxAttempts}
                  onChange={(e) => setEmailMaxAttempts(Number(e.target.value))}
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-center font-bold focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2">
            <button
              type="button"
              disabled={savingEmail}
              onClick={() => handleSaveEmailSettings()}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingEmail ? 'Saving Settings...' : 'Save Email Configuration'}</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            CARD 3: SMS OTP SETTINGS
           ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header & Toggle */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">SMS OTP Settings</h2>
                  <p className="text-xs text-slate-500">Fast2SMS Gateway & phone verification parameters</p>
                </div>
              </div>

              {/* Status Switch */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Provider Badge */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">SMS Gateway Provider</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-800 font-bold text-[11px]">
                Fast2SMS (India Bulk V2)
              </span>
            </div>

            {/* Fast2SMS API Key Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Fast2SMS API Key
                </label>
                {settings.smsOtp.hasApiKey ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Key Configured
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Not Configured
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type={showSmsKey ? 'text' : 'password'}
                  value={smsApiKeyInput}
                  onChange={(e) => setSmsApiKeyInput(e.target.value)}
                  placeholder="Paste Fast2SMS authorization API key"
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 pr-10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSmsKey((prev) => !prev)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showSmsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Secrets are encrypted with AES-256-GCM before saving and masked in API responses.
              </p>
            </div>

            {/* Sender ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Sender ID (DLT Approved Header)</label>
              <input
                type="text"
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value.toUpperCase())}
                placeholder="e.g. TRIPZO"
                maxLength={6}
                className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition uppercase font-mono font-semibold"
              />
            </div>

            {/* Durations Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  OTP Expiry (Min)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={smsExpiry}
                  onChange={(e) => setSmsExpiry(Number(e.target.value))}
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3 py-2 outline-none font-bold text-center"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Cooldown (Sec)
                </label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={smsCooldown}
                  onChange={(e) => setSmsCooldown(Number(e.target.value))}
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3 py-2 outline-none font-bold text-center"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Max Attempts
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={smsMaxAttempts}
                  onChange={(e) => setSmsMaxAttempts(Number(e.target.value))}
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3 py-2 outline-none font-bold text-center"
                />
              </div>
            </div>

            {/* Test SMS Connectivity Sub-Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  Test SMS Gateway Connectivity
                </span>
                <span className="text-[10px] text-slate-400">Safe Test Mode</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Optional 10-digit number (e.g. 9876543210)"
                  className="flex-1 bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3 py-2 outline-none"
                />
                <button
                  type="button"
                  disabled={testingSms || !isSmsFormValid}
                  onClick={handleTestSms}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {testingSms ? 'Pinging...' : 'Test Connection'}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-100/60 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100/60 text-rose-900 border border-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.diagnostics?.latencyMs && (
                      <p className="text-[10px] opacity-80">
                        Response Latency: {testResult.diagnostics.latencyMs}ms | Provider: {testResult.diagnostics.provider}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2">
            <button
              type="button"
              disabled={savingSms}
              onClick={() => handleSaveSmsSettings()}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingSms ? 'Saving Settings...' : 'Save SMS Configuration'}</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            CARD B: APPLE SIGN-IN SETTINGS
           ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header & Toggle */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Apple className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Apple Sign-In Settings</h2>
                  <p className="text-xs text-slate-500">Sign in with Apple OAuth & Services ID</p>
                </div>
              </div>

              {/* Status Switch */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={appleEnabled}
                  onChange={(e) => setAppleEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
              </label>
            </div>

            {/* Validation Pre-check Warning */}
            {appleEnabled && !isAppleFormValid && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  All 4 Apple credentials below are required before activation can take effect.
                </span>
              </div>
            )}

            {/* Configuration Status Badge */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Apple OAuth Status</span>
              {settings.appleAuth.isFullyConfigured ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                  <Check className="w-3 h-3" /> Fully Configured
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Incomplete Credentials
                </span>
              )}
            </div>

            {/* Apple Services ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Services ID / Client ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={appleClientId}
                onChange={(e) => setAppleClientId(e.target.value)}
                placeholder="e.g. com.tripzobox.web"
                className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition font-mono"
              />
            </div>

            {/* Team ID & Key ID Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Team ID (10 chars) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={appleTeamId}
                  onChange={(e) => setAppleTeamId(e.target.value.toUpperCase())}
                  placeholder="e.g. 7A9B3C2D1F"
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition uppercase font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Key ID (10 chars) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={appleKeyId}
                  onChange={(e) => setAppleKeyId(e.target.value.toUpperCase())}
                  placeholder="e.g. 8K3L9M2N1P"
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition uppercase font-mono"
                />
              </div>
            </div>

            {/* Apple Private Key (.p8 contents) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Apple Private Key (.p8 file text) <span className="text-rose-500">*</span>
                </label>
                {settings.appleAuth.hasPrivateKey ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Key Encrypted & Stored
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Not Provided
                  </span>
                )}
              </div>
              <div className="relative">
                <textarea
                  rows={3}
                  value={applePrivateKeyInput}
                  onChange={(e) => setApplePrivateKeyInput(e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;Paste .p8 private key contents here&#10;-----END PRIVATE KEY-----"
                  className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 p-3 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition font-mono"
                />
              </div>
            </div>

            {/* Callback URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Return / Callback URL</label>
              <input
                type="text"
                value={appleCallbackUrl}
                onChange={(e) => setAppleCallbackUrl(e.target.value)}
                placeholder="https://tripzobox-api.onrender.com/api/auth/apple/callback"
                className="w-full bg-white text-slate-800 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-slate-800 focus:ring-2 focus:ring-slate-100 outline-none transition font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2">
            <button
              type="button"
              disabled={savingApple}
              onClick={() => handleSaveAppleSettings()}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingApple ? 'Saving Settings...' : 'Save Apple Configuration'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

