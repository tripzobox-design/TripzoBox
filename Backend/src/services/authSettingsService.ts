import crypto from 'crypto';
import { AuthSettings, IAuthSettings } from '../models/AuthSettings.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { config } from '../config/env.js';

// AES-256-GCM encryption helpers
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const ENCRYPTION_SECRET = process.env.AUTH_SETTINGS_ENCRYPTION_KEY || config.jwtSecret || 'tripzobox_auth_secret_key_2026';
const DERIVED_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

export const encryptSecret = (text: string): string => {
  if (!text) return '';
  if (text.startsWith('enc:gcm:')) return text; // already encrypted
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, DERIVED_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `enc:gcm:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

export const decryptSecret = (cipherText: string): string => {
  if (!cipherText) return '';
  if (!cipherText.startsWith('enc:gcm:')) return cipherText; // legacy or plaintext
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 5) return '';
    const iv = Buffer.from(parts[2], 'hex');
    const tag = Buffer.from(parts[3], 'hex');
    const encryptedText = parts[4];
    const decipher = crypto.createDecipheriv(ALGORITHM, DERIVED_KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err: any) {
    console.warn('[AuthSettings] Failed to decrypt secret:', err.message);
    return '';
  }
};

const maskApiKey = (rawKey: string): string => {
  if (!rawKey) return '';
  const clean = rawKey.trim();
  if (clean.length <= 4) return '••••••••';
  return '••••••••' + clean.slice(-4);
};

// In-memory caching
let cachedSettings: IAuthSettings | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute max fallback

export const invalidateAuthSettingsCache = (): void => {
  cachedSettings = null;
  lastCacheTime = 0;
};

export const getAuthSettings = async (forceRefresh = false): Promise<IAuthSettings> => {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedSettings;
  }

  let settings = await AuthSettings.findOne({ key: 'default_auth_settings' });
  if (!settings) {
    // Default initial settings: SMS and Apple DISABLED by default, Google and Email ENABLED
    const initialSmsKey = (process.env.FAST2SMS_API_KEY || '').trim();
    const initialAppleKey = (process.env.APPLE_PRIVATE_KEY || '').trim();
    const initialGoogleSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
    const initialGoogleId = (process.env.GOOGLE_CLIENT_ID || '').trim();

    settings = new AuthSettings({
      key: 'default_auth_settings',
      smsOtp: {
        enabled: process.env.SMS_OTP_ENABLED === 'true', // defaults to false
        providerName: 'Fast2SMS',
        apiKey: initialSmsKey ? encryptSecret(initialSmsKey) : '',
        senderId: 'TRIPZO',
        otpExpiryMinutes: 5,
        resendCooldownSeconds: 60,
        maxAttempts: 5,
      },
      appleAuth: {
        enabled: process.env.APPLE_AUTH_ENABLED === 'true', // defaults to false
        clientId: process.env.APPLE_CLIENT_ID || '',
        teamId: process.env.APPLE_TEAM_ID || '',
        keyId: process.env.APPLE_KEY_ID || '',
        privateKey: initialAppleKey ? encryptSecret(initialAppleKey) : '',
        callbackUrl:
          process.env.APPLE_CALLBACK_URL ||
          `${config.frontendUrl ? config.frontendUrl.replace('5173', '5000') : 'http://localhost:5000'}/api/auth/apple/callback`,
      },
      googleAuth: {
        enabled: process.env.GOOGLE_AUTH_ENABLED !== 'false', // defaults to true
        clientId: initialGoogleId,
        clientSecret: initialGoogleSecret ? encryptSecret(initialGoogleSecret) : '',
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      emailOtp: {
        enabled: process.env.EMAIL_AUTH_ENABLED !== 'false', // defaults to true
        otpExpiryMinutes: 15,
        resendCooldownSeconds: 60,
        maxAttempts: 5,
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
        smtpUser: process.env.SMTP_USER || '',
        smtpPass: process.env.SMTP_PASS ? encryptSecret(process.env.SMTP_PASS) : '',
        smtpFrom: process.env.SMTP_FROM || '',
      },
      updatedBy: 'system',
    });

    await settings.save();
  }

  cachedSettings = settings;
  lastCacheTime = now;
  return settings;
};

export interface PublicAuthConfig {
  google: boolean;
  emailOtp: boolean;
  smsOtp: boolean;
  apple: boolean;
}

export const getPublicAuthConfig = async (): Promise<PublicAuthConfig> => {
  const settings = await getAuthSettings();
  return {
    google: Boolean(settings.googleAuth?.enabled),
    emailOtp: Boolean(settings.emailOtp?.enabled),
    smsOtp: Boolean(settings.smsOtp?.enabled),
    apple: Boolean(settings.appleAuth?.enabled),
  };
};

export interface AdminAuthSettingsView {
  key: string;
  smsOtp: {
    enabled: boolean;
    providerName: string;
    hasApiKey: boolean;
    maskedApiKey: string;
    senderId: string;
    otpExpiryMinutes: number;
    resendCooldownSeconds: number;
    maxAttempts: number;
  };
  appleAuth: {
    enabled: boolean;
    clientId: string;
    teamId: string;
    keyId: string;
    hasPrivateKey: boolean;
    maskedPrivateKey: string;
    callbackUrl: string;
    isFullyConfigured: boolean;
  };
  googleAuth: {
    enabled: boolean;
    clientId: string;
    hasClientSecret: boolean;
    maskedClientSecret: string;
    callbackUrl: string;
    isConfigured: boolean;
  };
  emailOtp: {
    enabled: boolean;
    otpExpiryMinutes: number;
    resendCooldownSeconds: number;
    maxAttempts: number;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    hasSmtpConfigured: boolean;
    isSimulated: boolean;
  };
  updatedBy: string;
  updatedAt: Date;
}

export const getAdminAuthSettingsView = async (): Promise<AdminAuthSettingsView> => {
  const settings = await getAuthSettings();
  const rawSmsKey = decryptSecret(settings.smsOtp?.apiKey || '');
  const rawAppleKey = decryptSecret(settings.appleAuth?.privateKey || '');
  const rawGoogleSecret =
    decryptSecret(settings.googleAuth?.clientSecret || '') || (config.googleClientSecret || '').trim();

  const hasApiKey = Boolean(rawSmsKey && rawSmsKey.length > 5);
  const hasPrivateKey = Boolean(rawAppleKey && rawAppleKey.length > 10);
  const hasGoogleSecret = Boolean(rawGoogleSecret && rawGoogleSecret.length > 5);

  const isAppleConfigured = Boolean(
    settings.appleAuth?.clientId &&
      settings.appleAuth?.teamId &&
      settings.appleAuth?.keyId &&
      hasPrivateKey
  );

  const activeGoogleClientId = settings.googleAuth?.clientId || config.googleClientId || '';
  const isGoogleConfigured = Boolean(activeGoogleClientId && hasGoogleSecret);

  const hasSmtpConfigured = Boolean(
    (settings.emailOtp?.smtpHost || config.smtpHost) &&
    (settings.emailOtp?.smtpUser || config.smtpUser)
  );

  return {
    key: settings.key,
    smsOtp: {
      enabled: Boolean(settings.smsOtp?.enabled),
      providerName: settings.smsOtp?.providerName || 'Fast2SMS',
      hasApiKey,
      maskedApiKey: hasApiKey ? maskApiKey(rawSmsKey) : '',
      senderId: settings.smsOtp?.senderId || 'TRIPZO',
      otpExpiryMinutes: settings.smsOtp?.otpExpiryMinutes ?? 5,
      resendCooldownSeconds: settings.smsOtp?.resendCooldownSeconds ?? 60,
      maxAttempts: settings.smsOtp?.maxAttempts ?? 5,
    },
    appleAuth: {
      enabled: Boolean(settings.appleAuth?.enabled),
      clientId: settings.appleAuth?.clientId || '',
      teamId: settings.appleAuth?.teamId || '',
      keyId: settings.appleAuth?.keyId || '',
      hasPrivateKey,
      maskedPrivateKey: hasPrivateKey
        ? '-----BEGIN PRIVATE KEY-----\n••••••••••••••••••••••••••••••••\n[CONFIGURED]\n-----END PRIVATE KEY-----'
        : '',
      callbackUrl: settings.appleAuth?.callbackUrl || 'http://localhost:5000/api/auth/apple/callback',
      isFullyConfigured: isAppleConfigured,
    },
    googleAuth: {
      enabled: Boolean(settings.googleAuth?.enabled),
      clientId: activeGoogleClientId,
      hasClientSecret: hasGoogleSecret,
      maskedClientSecret: hasGoogleSecret ? maskApiKey(rawGoogleSecret) : '',
      callbackUrl: settings.googleAuth?.callbackUrl || config.googleCallbackUrl,
      isConfigured: isGoogleConfigured,
    },
    emailOtp: {
      enabled: Boolean(settings.emailOtp?.enabled),
      otpExpiryMinutes: settings.emailOtp?.otpExpiryMinutes ?? 15,
      resendCooldownSeconds: settings.emailOtp?.resendCooldownSeconds ?? 60,
      maxAttempts: settings.emailOtp?.maxAttempts ?? 5,
      smtpHost: settings.emailOtp?.smtpHost || config.smtpHost || '',
      smtpPort: settings.emailOtp?.smtpPort || config.smtpPort || 587,
      smtpUser: settings.emailOtp?.smtpUser || config.smtpUser || '',
      hasSmtpConfigured,
      isSimulated: !hasSmtpConfigured,
    },
    updatedBy: settings.updatedBy || 'system',
    updatedAt: settings.updatedAt || new Date(),
  };
};

export interface UpdateAuthSettingsInput {
  smsOtp?: {
    enabled?: boolean;
    providerName?: string;
    apiKey?: string;
    senderId?: string;
    otpExpiryMinutes?: number;
    resendCooldownSeconds?: number;
    maxAttempts?: number;
  };
  appleAuth?: {
    enabled?: boolean;
    clientId?: string;
    teamId?: string;
    keyId?: string;
    privateKey?: string;
    callbackUrl?: string;
  };
  googleAuth?: {
    enabled?: boolean;
    clientId?: string;
    clientSecret?: string;
    callbackUrl?: string;
  };
  emailOtp?: {
    enabled?: boolean;
    otpExpiryMinutes?: number;
    resendCooldownSeconds?: number;
    maxAttempts?: number;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
  };
}

export const updateAuthSettings = async (
  updates: UpdateAuthSettingsInput,
  adminUser: { id: string; email: string; name?: string; ipAddress?: string }
): Promise<AdminAuthSettingsView> => {
  const settings = await getAuthSettings(true);

  // Existing decrypted secrets for verification
  let currentSmsKey = decryptSecret(settings.smsOtp?.apiKey || '');
  let currentAppleKey = decryptSecret(settings.appleAuth?.privateKey || '');

  // 1. Process SMS OTP updates
  if (updates.smsOtp) {
    if (updates.smsOtp.apiKey !== undefined) {
      const trimmedKey = updates.smsOtp.apiKey.trim();
      // If not masked placeholder, update secret
      if (trimmedKey && !trimmedKey.startsWith('••••')) {
        currentSmsKey = trimmedKey;
        settings.smsOtp.apiKey = encryptSecret(trimmedKey);
      } else if (!trimmedKey) {
        currentSmsKey = '';
        settings.smsOtp.apiKey = '';
      }
    }

    if (updates.smsOtp.providerName !== undefined) {
      settings.smsOtp.providerName = updates.smsOtp.providerName.trim() || 'Fast2SMS';
    }
    if (updates.smsOtp.senderId !== undefined) {
      settings.smsOtp.senderId = updates.smsOtp.senderId.trim().toUpperCase() || 'TRIPZO';
    }
    if (updates.smsOtp.otpExpiryMinutes !== undefined) {
      const val = Number(updates.smsOtp.otpExpiryMinutes);
      if (isNaN(val) || val < 1 || val > 60) {
        throw new Error('SMS OTP expiry duration must be between 1 and 60 minutes.');
      }
      settings.smsOtp.otpExpiryMinutes = val;
    }
    if (updates.smsOtp.resendCooldownSeconds !== undefined) {
      const val = Number(updates.smsOtp.resendCooldownSeconds);
      if (isNaN(val) || val < 10 || val > 300) {
        throw new Error('SMS OTP resend cooldown must be between 10 and 300 seconds.');
      }
      settings.smsOtp.resendCooldownSeconds = val;
    }
    if (updates.smsOtp.maxAttempts !== undefined) {
      const val = Number(updates.smsOtp.maxAttempts);
      if (isNaN(val) || val < 1 || val > 10) {
        throw new Error('Maximum SMS OTP verification attempts must be between 1 and 10.');
      }
      settings.smsOtp.maxAttempts = val;
    }

    // Check activation requirement
    if (updates.smsOtp.enabled === true) {
      if (!currentSmsKey || currentSmsKey.length < 10) {
        throw new Error('Cannot enable SMS OTP without configuring a valid Fast2SMS API key.');
      }
      settings.smsOtp.enabled = true;
    } else if (updates.smsOtp.enabled === false) {
      settings.smsOtp.enabled = false;
    }
  }

  // 2. Process Apple Sign-In updates
  if (updates.appleAuth) {
    if (updates.appleAuth.clientId !== undefined) {
      settings.appleAuth.clientId = updates.appleAuth.clientId.trim();
    }
    if (updates.appleAuth.teamId !== undefined) {
      settings.appleAuth.teamId = updates.appleAuth.teamId.trim().toUpperCase();
    }
    if (updates.appleAuth.keyId !== undefined) {
      settings.appleAuth.keyId = updates.appleAuth.keyId.trim().toUpperCase();
    }
    if (updates.appleAuth.callbackUrl !== undefined) {
      settings.appleAuth.callbackUrl = updates.appleAuth.callbackUrl.trim();
    }

    if (updates.appleAuth.privateKey !== undefined) {
      const trimmedPriv = updates.appleAuth.privateKey.trim();
      if (trimmedPriv && !trimmedPriv.includes('[CONFIGURED]')) {
        currentAppleKey = trimmedPriv;
        settings.appleAuth.privateKey = encryptSecret(trimmedPriv);
      } else if (!trimmedPriv) {
        currentAppleKey = '';
        settings.appleAuth.privateKey = '';
      }
    }

    // Check activation requirement
    if (updates.appleAuth.enabled === true) {
      const clientId = settings.appleAuth.clientId;
      const teamId = settings.appleAuth.teamId;
      const keyId = settings.appleAuth.keyId;

      if (!clientId) {
        throw new Error('Cannot enable Apple Sign-In without Apple Services ID / Client ID.');
      }
      if (!teamId || teamId.length !== 10) {
        throw new Error('Apple Team ID must be a 10-character alphanumeric string.');
      }
      if (!keyId || keyId.length !== 10) {
        throw new Error('Apple Key ID must be a 10-character alphanumeric string.');
      }
      if (!currentAppleKey || currentAppleKey.length < 20) {
        throw new Error('Cannot enable Apple Sign-In without configuring a valid Apple Private Key.');
      }
      settings.appleAuth.enabled = true;
    } else if (updates.appleAuth.enabled === false) {
      settings.appleAuth.enabled = false;
    }
  }

  // 3. Process Google OAuth updates
  if (updates.googleAuth) {
    if (updates.googleAuth.clientId !== undefined) {
      settings.googleAuth.clientId = updates.googleAuth.clientId.trim();
    }
    if (updates.googleAuth.callbackUrl !== undefined) {
      settings.googleAuth.callbackUrl = updates.googleAuth.callbackUrl.trim();
    }
    if (updates.googleAuth.clientSecret !== undefined) {
      const trimmedSecret = updates.googleAuth.clientSecret.trim();
      if (trimmedSecret && !trimmedSecret.startsWith('••••')) {
        settings.googleAuth.clientSecret = encryptSecret(trimmedSecret);
      } else if (!trimmedSecret) {
        settings.googleAuth.clientSecret = '';
      }
    }

    if (updates.googleAuth.enabled === true) {
      const activeClientId = settings.googleAuth.clientId || config.googleClientId;
      if (!activeClientId) {
        throw new Error('Cannot enable Google OAuth without configuring a Google Client ID.');
      }
      settings.googleAuth.enabled = true;
    } else if (updates.googleAuth.enabled === false) {
      settings.googleAuth.enabled = false;
    }
  }

  // 4. Process Email OTP updates
  if (updates.emailOtp) {
    if (updates.emailOtp.enabled !== undefined) {
      settings.emailOtp.enabled = Boolean(updates.emailOtp.enabled);
    }
    if (updates.emailOtp.otpExpiryMinutes !== undefined) {
      const val = Number(updates.emailOtp.otpExpiryMinutes);
      if (isNaN(val) || val < 1 || val > 60) {
        throw new Error('Email OTP expiry duration must be between 1 and 60 minutes.');
      }
      settings.emailOtp.otpExpiryMinutes = val;
    }
    if (updates.emailOtp.resendCooldownSeconds !== undefined) {
      const val = Number(updates.emailOtp.resendCooldownSeconds);
      if (isNaN(val) || val < 10 || val > 300) {
        throw new Error('Email OTP resend cooldown must be between 10 and 300 seconds.');
      }
      settings.emailOtp.resendCooldownSeconds = val;
    }
    if (updates.emailOtp.maxAttempts !== undefined) {
      const val = Number(updates.emailOtp.maxAttempts);
      if (isNaN(val) || val < 1 || val > 10) {
        throw new Error('Maximum Email OTP verification attempts must be between 1 and 10.');
      }
      settings.emailOtp.maxAttempts = val;
    }
    if (updates.emailOtp.smtpHost !== undefined) {
      settings.emailOtp.smtpHost = updates.emailOtp.smtpHost.trim();
    }
    if (updates.emailOtp.smtpPort !== undefined) {
      settings.emailOtp.smtpPort = Number(updates.emailOtp.smtpPort) || 587;
    }
    if (updates.emailOtp.smtpUser !== undefined) {
      settings.emailOtp.smtpUser = updates.emailOtp.smtpUser.trim();
    }
    if (updates.emailOtp.smtpPass !== undefined) {
      const trimmedPass = updates.emailOtp.smtpPass.trim();
      if (trimmedPass && !trimmedPass.startsWith('••••')) {
        settings.emailOtp.smtpPass = encryptSecret(trimmedPass);
      } else if (!trimmedPass) {
        settings.emailOtp.smtpPass = '';
      }
    }
  }

  settings.updatedBy = adminUser.email || adminUser.id;
  await settings.save();

  // Invalidate in-memory cache and reassign
  cachedSettings = settings;
  lastCacheTime = Date.now();

  // Audit logging (DO NOT log raw credentials)
  await AdminAuditLog.create({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    adminName: adminUser.name || 'Administrator',
    action: 'AUTH_SETTINGS_UPDATED',
    targetType: 'auth',
    targetId: 'default_auth_settings',
    targetName: 'Authentication Providers',
    details: `Updated auth settings: Google (${settings.googleAuth.enabled ? 'Enabled' : 'Disabled'}), Email OTP (${settings.emailOtp.enabled ? 'Enabled' : 'Disabled'}), SMS OTP (${settings.smsOtp.enabled ? 'Enabled' : 'Disabled'}), Apple (${settings.appleAuth.enabled ? 'Enabled' : 'Disabled'})`,
    metadata: {
      smsEnabled: settings.smsOtp.enabled,
      appleEnabled: settings.appleAuth.enabled,
      googleEnabled: settings.googleAuth.enabled,
      emailOtpEnabled: settings.emailOtp.enabled,
      hasSmsApiKey: Boolean(currentSmsKey),
      hasApplePrivateKey: Boolean(currentAppleKey),
    },
    ipAddress: adminUser.ipAddress,
  }).catch((err) => console.warn('[AuthSettings] Audit log error:', err.message));

  return getAdminAuthSettingsView();
};

export const testSmsConnectivity = async (
  testPhone?: string
): Promise<{
  success: boolean;
  status: string;
  message: string;
  diagnostics: {
    provider: string;
    isConfigured: boolean;
    latencyMs?: number;
    walletBalance?: number;
    error?: string;
  };
}> => {
  const settings = await getAuthSettings();
  const apiKey = decryptSecret(settings.smsOtp?.apiKey || '') || (process.env.FAST2SMS_API_KEY || '').trim();

  if (!apiKey || apiKey.length < 10) {
    return {
      success: false,
      status: 'UNCONFIGURED',
      message: 'Fast2SMS API key is not configured. Please provide a valid key.',
      diagnostics: {
        provider: 'Fast2SMS',
        isConfigured: false,
        error: 'No API key configured in database or environment.',
      },
    };
  }

  const startTime = Date.now();

  // 1. If test phone number provided, attempt safe test SMS
  if (testPhone && testPhone.trim()) {
    const cleanPhone = testPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return {
        success: false,
        status: 'INVALID_PHONE',
        message: 'Please provide a valid 10-digit mobile number for test dispatch.',
        diagnostics: { provider: 'Fast2SMS', isConfigured: true },
      };
    }

    try {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: '123456',
          numbers: cleanPhone,
        }),
      });

      const latencyMs = Date.now() - startTime;
      const data: any = await res.json().catch(() => ({}));

      if (data.return) {
        return {
          success: true,
          status: 'DELIVERED',
          message: `Test OTP successfully delivered to +91 ${cleanPhone}.`,
          diagnostics: { provider: 'Fast2SMS', isConfigured: true, latencyMs },
        };
      }

      return {
        success: false,
        status: 'PROVIDER_ERROR',
        message: data.message || 'Fast2SMS returned an error during test dispatch.',
        diagnostics: {
          provider: 'Fast2SMS',
          isConfigured: true,
          latencyMs,
          error: data.message,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'NETWORK_ERROR',
        message: `Failed to connect to Fast2SMS servers: ${err.message}`,
        diagnostics: {
          provider: 'Fast2SMS',
          isConfigured: true,
          latencyMs: Date.now() - startTime,
          error: err.message,
        },
      };
    }
  }

  // 2. No test phone provided -> safe wallet/balance check (does NOT consume SMS credits)
  try {
    const res = await fetch('https://www.fast2sms.com/dev/wallet', {
      method: 'POST',
      headers: {
        authorization: apiKey,
      },
    });

    const latencyMs = Date.now() - startTime;
    const data: any = await res.json().catch(() => ({}));

    if (data.return !== false && (data.wallet !== undefined || res.ok)) {
      return {
        success: true,
        status: 'CONNECTED',
        message: `Fast2SMS API connection verified successfully. Balance: ${data.wallet ?? 'Active'} INR`,
        diagnostics: {
          provider: 'Fast2SMS',
          isConfigured: true,
          latencyMs,
          walletBalance: data.wallet,
        },
      };
    }

    return {
      success: false,
      status: 'AUTH_FAILED',
      message: data.message || 'Fast2SMS rejected API credentials.',
      diagnostics: {
        provider: 'Fast2SMS',
        isConfigured: true,
        latencyMs,
        error: data.message || 'Authentication check failed',
      },
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'NETWORK_ERROR',
      message: `Failed to connect to Fast2SMS endpoint: ${err.message}`,
      diagnostics: {
        provider: 'Fast2SMS',
        isConfigured: true,
        latencyMs: Date.now() - startTime,
        error: err.message,
      },
    };
  }
};
