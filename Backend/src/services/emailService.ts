import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env.js';

export interface EmailResult {
  sent: boolean;
  isSimulated: boolean;
  verificationLink?: string;
  previewUrl?: string;
  otp?: string;
  messageId?: string;
}

export interface EmailDispatchRecord {
  email: string;
  verificationLink?: string;
  previewUrl?: string;
  isSimulated: boolean;
  sentAt: number;
  otp?: string;
}

// In-memory registry of latest email dispatches by email (lowercase)
export const latestEmailDispatches = new Map<string, EmailDispatchRecord>();

let etherealTransporter: Transporter | null = null;
let isCreatingEthereal = false;

/**
 * Mask an email address for privacy and compliance in logs (e.g. j***e@domain.com)
 */
export const maskEmail = (email: string): string => {
  const clean = (email || '').trim().toLowerCase();
  const atIndex = clean.indexOf('@');
  if (atIndex <= 0) return '***';
  const name = clean.slice(0, atIndex);
  const domain = clean.slice(atIndex);
  if (name.length <= 2) {
    return `${name[0]}*${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}${domain}`;
};

/**
 * Strip credentials, passwords, API keys, tokens, and sensitive query params from error messages
 */
export const sanitizeErrorMessage = (error: any): string => {
  if (!error) return 'Unknown email dispatch error';
  let message = typeof error === 'string' ? error : error.message || String(error);

  if (config.brevoApiKey) {
    message = message.split(config.brevoApiKey).join('[REDACTED_API_KEY]');
  }

  if (config.smtpPass) {
    const rawPass = config.smtpPass;
    const cleanPass = config.smtpPass.replace(/\s+/g, '');
    message = message.split(rawPass).join('[REDACTED_PASS]');
    message = message.split(cleanPass).join('[REDACTED_PASS]');
  }

  // Redact any query params or tokens
  message = message.replace(/(token|otp|code|secret|password|pass|api-key)=([^&\s]+)/gi, '$1=[REDACTED]');
  return message;
};

const escapeHtml = (value: string): string =>
  (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getEtherealTransporter = async (): Promise<Transporter | null> => {
  if (config.nodeEnv === 'production' || process.env.RENDER === 'true') return null;
  if (etherealTransporter) return etherealTransporter;
  if (isCreatingEthereal) return null;
  try {
    isCreatingEthereal = true;
    const testAccount = await nodemailer.createTestAccount();
    etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000,
    });
    return etherealTransporter;
  } catch (err: any) {
    console.warn('[Email Service] Ethereal test account note:', sanitizeErrorMessage(err));
    return null;
  } finally {
    isCreatingEthereal = false;
  }
};

export const getRealTransporter = (): Transporter | null => {
  if (config.smtpUser && config.smtpPass) {
    const cleanPass = config.smtpPass.replace(/\s+/g, '');
    if (config.smtpHost.includes('gmail') || config.smtpUser.endsWith('@gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.smtpUser,
          pass: cleanPass,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
      });
    }

    return nodemailer.createTransport({
      host: config.smtpHost || 'smtp.gmail.com',
      port: config.smtpPort || 587,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: cleanPass,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });
  }
  return null;
};

/**
 * Dispatch email via Brevo's HTTP Transactional Email API (https://api.brevo.com/v3/smtp/email)
 */
export const sendBrevoEmail = async (
  to: string,
  subject: string,
  html: string,
  recipientName?: string
): Promise<{ sent: boolean; messageId: string }> => {
  const cleanEmail = to.toLowerCase().trim();
  const apiKey = config.brevoApiKey;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  const senderName = config.emailFromName || 'TripzoBox';
  const senderEmail = config.emailFrom || 'no-reply@tripzobox.com';

  const body = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: cleanEmail, name: recipientName || 'Traveller' }],
    subject,
    htmlContent: html,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  }).catch((err: any) => {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('Brevo API request timed out after 8000ms');
    }
    throw new Error(`Brevo network error: ${sanitizeErrorMessage(err)}`);
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Brevo HTTP ${response.status}: ${sanitizeErrorMessage(errorText)}`);
  }

  const data: any = await response.json().catch(() => ({}));
  return {
    sent: true,
    messageId: data?.messageId || 'brevo-dispatched',
  };
};

/**
 * Verify Email Service status (Brevo HTTPS API or SMTP connection) on application initialization
 */
export const verifyEmailService = async (): Promise<{ ok: boolean; message: string; provider: string }> => {
  // 1. If Brevo API is configured, verify via Brevo Account API
  if (config.brevoApiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/account', {
        headers: {
          'accept': 'application/json',
          'api-key': config.brevoApiKey,
        },
        signal: AbortSignal.timeout(5000),
      }).catch((err: any) => {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
          throw new Error('Brevo account check timed out after 5000ms');
        }
        throw new Error(`Brevo network unreachable: ${sanitizeErrorMessage(err)}`);
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        const safe = sanitizeErrorMessage(errBody);
        console.error(`[Email Service] ❌ Brevo API key verification failed (HTTP ${res.status}): ${safe}`);
        return { ok: false, message: `Brevo HTTP ${res.status}: ${safe}`, provider: 'brevo' };
      }

      console.log(`[Email Service] ✅ Brevo HTTPS API verified successfully (Sender: ${config.emailFrom})`);
      return { ok: true, message: 'Brevo HTTPS API connection verified successfully', provider: 'brevo' };
    } catch (err: any) {
      const safe = sanitizeErrorMessage(err);
      console.error(`[Email Service] ❌ Brevo API verification failed: ${safe}`);
      return { ok: false, message: safe, provider: 'brevo' };
    }
  }

  // 2. If SMTP is configured, verify via transporter
  if (config.smtpUser && config.smtpPass) {
    const transporter = getRealTransporter();
    if (!transporter) {
      return { ok: false, message: 'Failed to create SMTP transporter', provider: 'smtp' };
    }

    try {
      await transporter.verify();
      console.log(`[Email Service] ✅ SMTP connection verified successfully for ${maskEmail(config.smtpUser)}`);
      return { ok: true, message: 'SMTP connection verified successfully', provider: 'smtp' };
    } catch (err: any) {
      const safeError = sanitizeErrorMessage(err);
      console.error(`[Email Service] ❌ SMTP connection verification failed: ${safeError}`);
      return { ok: false, message: safeError, provider: 'smtp' };
    }
  }

  const msg = 'No email service configured (missing BREVO_API_KEY or SMTP credentials)';
  if (config.nodeEnv === 'production') {
    console.error(`[Email Service] ❌ ${msg}`);
  } else {
    console.log(`[Email Service] ℹ️ ${msg} - running in simulated local development mode.`);
  }
  return { ok: false, message: msg, provider: 'none' };
};

// Backward-compatible alias
export const verifySmtpConnection = verifyEmailService;

export interface DispatchEmailParams {
  to: string;
  name?: string;
  subject: string;
  html: string;
  emailType: string;
  otp?: string;
  verificationLink?: string;
}

/**
 * Unified transactional email dispatcher supporting Brevo HTTPS API in production
 * and SMTP / Ethereal simulation in development.
 */
export const dispatchTransactionalEmail = async (
  params: DispatchEmailParams
): Promise<EmailResult> => {
  const cleanEmail = params.to.toLowerCase().trim();
  const masked = maskEmail(cleanEmail);
  const isProduction = config.nodeEnv === 'production' || process.env.RENDER === 'true';

  // 1. Primary Production Delivery: Brevo HTTPS API
  if (config.brevoApiKey) {
    try {
      const result = await sendBrevoEmail(cleanEmail, params.subject, params.html, params.name);
      console.log(
        `[Email Service] ${params.emailType} email dispatched via Brevo HTTPS to ${masked} (messageId: ${result.messageId})`
      );

      latestEmailDispatches.set(cleanEmail, {
        email: cleanEmail,
        verificationLink: params.verificationLink,
        isSimulated: false,
        sentAt: Date.now(),
        otp: params.otp,
      });

      return {
        sent: true,
        isSimulated: false,
        verificationLink: params.verificationLink,
        otp: params.otp,
        messageId: result.messageId,
      };
    } catch (err: any) {
      const safeError = sanitizeErrorMessage(err);
      console.error(`[Email Service] Failed to send ${params.emailType} email via Brevo to ${masked}:`, safeError);
      if (isProduction) {
        throw new Error(`Email delivery failed: ${safeError}`);
      }
      // In development, fall through to SMTP or simulation
    }
  }

  // 2. Secondary / Local Development Delivery: Real SMTP (e.g. Gmail SMTP)
  const realTransporter = getRealTransporter();
  if (realTransporter) {
    try {
      const info = await realTransporter.sendMail({
        from: config.smtpFrom || `"${config.emailFromName}" <${config.smtpUser || config.emailFrom}>`,
        to: cleanEmail,
        subject: params.subject,
        html: params.html,
      });

      console.log(
        `[Email Service] ${params.emailType} email dispatched via SMTP to ${masked} (messageId: ${info.messageId || 'ok'})`
      );

      latestEmailDispatches.set(cleanEmail, {
        email: cleanEmail,
        verificationLink: params.verificationLink,
        isSimulated: false,
        sentAt: Date.now(),
        otp: params.otp,
      });

      return {
        sent: true,
        isSimulated: false,
        verificationLink: params.verificationLink,
        otp: params.otp,
        messageId: info.messageId,
      };
    } catch (err: any) {
      const safeError = sanitizeErrorMessage(err);
      console.error(`[Email Service] Failed to send ${params.emailType} email via SMTP to ${masked}:`, safeError);
      if (isProduction) {
        throw new Error(`Email delivery failed: ${safeError}`);
      }
    }
  }

  // 3. In production, never silently fall back to simulated mode
  if (isProduction) {
    console.error(
      `[Email Service] ${params.emailType} email aborted for ${masked}: Neither BREVO_API_KEY nor SMTP credentials configured in production.`
    );
    throw new Error('Email delivery unavailable: BREVO_API_KEY (or SMTP credentials) are not configured in production.');
  }

  // 4. Simulated / Ethereal Test in development only
  if (isProduction) {
    throw new Error('Email delivery unavailable: Simulated email mode is strictly forbidden in production.');
  }
  let previewUrl: string | undefined;
  try {
    const ethereal = await getEtherealTransporter();
    if (ethereal) {
      const info = await ethereal.sendMail({
        from: '"TripzoBox Test" <test@tripzobox.com>',
        to: cleanEmail,
        subject: params.subject,
        html: params.html,
      });
      previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    }
  } catch (etherealErr: any) {
    console.warn('[Email Service] Ethereal preview note:', sanitizeErrorMessage(etherealErr));
  }

  console.log(`[Email Service (Development Mode)] Generated ${params.emailType} email for ${masked}`);
  if (previewUrl) {
    console.log(`[Email Service (Development Mode)] Preview: ${previewUrl}`);
  }

  const result: EmailResult = {
    sent: true,
    isSimulated: true,
    verificationLink: params.verificationLink,
    previewUrl,
    otp: params.otp,
  };

  latestEmailDispatches.set(cleanEmail, {
    email: cleanEmail,
    verificationLink: params.verificationLink,
    previewUrl,
    isSimulated: true,
    sentAt: Date.now(),
    otp: params.otp,
  });

  return result;
};

export const sendVerificationEmail = async (
  email: string,
  name: string,
  verificationToken: string,
  otp?: string
): Promise<EmailResult> => {
  const cleanEmail = email.toLowerCase().trim();
  const verificationLink = `${config.frontendUrl}/auth?step=verify-email&token=${verificationToken}&email=${encodeURIComponent(
    cleanEmail
  )}${otp ? `&otp=${otp}` : ''}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff;">
      <div style="margin-bottom: 24px;">
        <h1 style="color: #064e3b; font-size: 24px; font-weight: 800; margin: 0 0 8px 0;">Tripzobox</h1>
        <p style="color: #059669; font-size: 13px; font-weight: 600; margin: 0;">Explore The World Without Limits</p>
      </div>
      <h2 style="color: #111827; font-size: 20px; margin-bottom: 12px;">Verify your email address</h2>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
        Hi <strong>${escapeHtml(name)}</strong>, thanks for creating an account with TripzoBox! Use the 6-digit verification code below:
      </p>
      ${
        otp
          ? `<div style="margin: 24px 0; background-color: #f0fdf4; border: 2px solid #bbf7d0; padding: 18px 24px; border-radius: 14px; text-align: center;">
              <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #047857;">${escapeHtml(otp)}</span>
              <p style="color: #065f46; font-size: 12px; margin: 8px 0 0 0; font-weight: 500;">Valid for 15 minutes</p>
            </div>`
          : ''
      }
      <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        Or click the button below to verify your email instantly in your browser:
      </p>
      <div style="margin: 24px 0;">
        <a href="${verificationLink}" style="background-color: #059669; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${verificationLink}" style="color: #059669; word-break: break-all;">${verificationLink}</a>
      </p>
    </div>
  `;

  return dispatchTransactionalEmail({
    to: cleanEmail,
    name,
    subject: otp ? `Your TripzoBox verification code: ${otp} 🌿` : 'Verify your TripzoBox account 🌿',
    html,
    emailType: 'Verification',
    otp,
    verificationLink,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  otp: string,
  token?: string
): Promise<EmailResult> => {
  const cleanEmail = email.toLowerCase().trim();
  const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : `&otp=${encodeURIComponent(otp)}`;
  const resetLink = `${config.frontendUrl}/forgot-password?step=new-password&email=${encodeURIComponent(cleanEmail)}${tokenQuery}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 36px 28px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <div style="margin-bottom: 24px;">
        <h1 style="color: #064e3b; font-size: 26px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px;">Tripzobox</h1>
        <p style="color: #059669; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Password Reset Request</p>
      </div>
      <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 12px;">Reset Your Password</h2>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        Hi <strong>${escapeHtml(name)}</strong>, we received a request to reset your TripzoBox password. Click the button below to choose your new password:
      </p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${resetLink}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.3);">
          Create New Password
        </a>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-bottom: 8px; text-align: center;">
        Or copy and paste this link into your browser:
      </p>
      <p style="text-align: center; margin-bottom: 24px;">
        <a href="${resetLink}" style="color: #059669; word-break: break-all; font-size: 12px;">${resetLink}</a>
      </p>
      <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 24px;">
        <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
          This link will expire in 15 minutes. If you did not request a password reset, please ignore this email and your password will remain unchanged.
        </p>
      </div>
    </div>
  `;

  return dispatchTransactionalEmail({
    to: cleanEmail,
    name,
    subject: 'Reset your TripzoBox password 🔐',
    html,
    emailType: 'Password reset',
    otp,
  });
};

export const sendDocumentVerificationEmail = async (
  email: string,
  name: string,
  documentName: string,
  otp: string
): Promise<EmailResult> => {
  const cleanEmail = email.toLowerCase().trim();
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6faf8; color: #1f2937; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
          .header { background: #0D5A46; padding: 28px 24px; text-align: center; }
          .logo-text { color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
          .content { padding: 32px 28px; }
          .title { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 12px; }
          .otp-box { background: #ecfdf5; border: 1.5px dashed #059669; border-radius: 14px; padding: 18px; text-align: center; margin: 24px 0; }
          .otp-code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #065f46; margin: 0; }
          .footer { padding: 20px 28px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-text">Tripzobox Travel Vault 🛡️</div>
          </div>
          <div class="content">
            <div class="title">Verify Document Security</div>
            <p>Hello <b>${escapeHtml(name)}</b>,</p>
            <p>You requested to verify and secure <b>${escapeHtml(documentName)}</b> in your TripzoBox Travel Vault. Use the one-time verification code below:</p>
            
            <div class="otp-box">
              <p class="otp-code">${escapeHtml(otp)}</p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #047857; font-weight: 600;">Valid for 10 minutes</p>
            </div>

            <p style="font-size: 12px; color: #4b5563; line-height: 1.5;">
              If you did not initiate this document verification, please check your Travel Vault settings immediately or contact TripzoBox Trust & Safety.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Tripzobox Inc. End-to-end encrypted traveller safety.
          </div>
        </div>
      </body>
    </html>
  `;

  return dispatchTransactionalEmail({
    to: cleanEmail,
    name,
    subject: `🔐 Verify Your Document: ${escapeHtml(documentName)} – TripzoBox Travel Vault`,
    html,
    emailType: 'Document verification',
    otp,
  });
};

export const sendAccountDeletionOtpEmail = async (
  email: string,
  name: string,
  otp: string
): Promise<EmailResult> => {
  const cleanEmail = email.toLowerCase().trim();
  const safeName = escapeHtml(name || 'Traveller');
  const subject = 'Confirm permanent deletion of your TripzoBox account';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #fecaca; border-radius: 20px; background-color: #ffffff;">
      <div style="margin-bottom: 24px;">
        <h1 style="color: #064e3b; font-size: 24px; font-weight: 800; margin: 0 0 6px 0;">Tripzobox</h1>
        <p style="color: #dc2626; font-size: 13px; font-weight: 700; margin: 0;">Account Deletion Security Confirmation</p>
      </div>
      <h2 style="color: #111827; font-size: 20px; margin-bottom: 12px;">Permanent Account Deletion Code</h2>
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
        Hi <strong>${safeName}</strong>, we received a request to permanently delete your TripzoBox account.
      </p>
      <p style="color: #991b1b; font-size: 13px; line-height: 1.5; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 14px; margin-bottom: 20px;">
        Deleting your account permanently removes your profile, personal data, private travel diary entries, and Travel Vault documents. This action cannot be reversed.
      </p>
      <div style="margin: 24px 0; background-color: #fff1f2; border: 1.5px solid #fda4af; padding: 18px 24px; border-radius: 14px; text-align: center;">
        <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #9f1239;">${escapeHtml(otp)}</span>
        <p style="color: #881337; font-size: 12px; margin: 8px 0 0 0; font-weight: 600;">Valid for 10 minutes • Single-use verification code</p>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
        If you did not request this deletion, ignore this email and change your TripzoBox password immediately or contact safety@tripzobox.com.
      </p>
    </div>
  `;

  return dispatchTransactionalEmail({
    to: cleanEmail,
    name,
    subject,
    html,
    emailType: 'Account deletion OTP',
    otp,
  });
};

export const sendAccountDeletionConfirmationEmail = async (
  email: string,
  name: string,
  details: {
    deletedAt: Date;
    retainedSummary: string;
    supportEmail?: string;
  }
): Promise<EmailResult> => {
  const cleanEmail = email.toLowerCase().trim();
  const safeName = escapeHtml(name || 'Traveller');
  const supportEmail = escapeHtml(details.supportEmail || 'support@tripzobox.com');
  const deletedAtIso = escapeHtml(details.deletedAt.toUTCString());
  const retainedSummary = escapeHtml(details.retainedSummary);
  const subject = 'Your TripzoBox account has been permanently deleted';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff;">
      <div style="margin-bottom: 24px;">
        <h1 style="color: #064e3b; font-size: 24px; font-weight: 800; margin: 0 0 6px 0;">Tripzobox</h1>
        <p style="color: #059669; font-size: 13px; font-weight: 600; margin: 0;">Account Deletion Confirmation</p>
      </div>
      <h2 style="color: #111827; font-size: 20px; margin-bottom: 12px;">Your TripzoBox account deletion request has been completed</h2>
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
        Hi <strong>${safeName}</strong>, this email confirms that your TripzoBox account and associated personal information have been permanently deleted on <strong>${deletedAtIso}</strong>.
      </p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #111827;">What was removed &amp; minimal retention summary</p>
        <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.55;">
          ${retainedSummary}
        </p>
      </div>
      <p style="color: #4b5563; font-size: 13px; line-height: 1.5;">
        If you have privacy questions or need assistance regarding this notice, please contact <a href="mailto:${supportEmail}" style="color: #059669; font-weight: 600;">${supportEmail}</a>.
      </p>
    </div>
  `;

  return dispatchTransactionalEmail({
    to: cleanEmail,
    name,
    subject,
    html,
    emailType: 'Account deletion confirmation',
  });
};

export const sendTripAcceptedEmail = async (
  email: string,
  name: string,
  tripName: string,
  tripId: string,
  leaderName: string
): Promise<EmailResult> => {
  const cleanEmail = email.toLowerCase().trim();
  const safeName = escapeHtml(name || 'Traveller');
  const safeTrip = escapeHtml(tripName);
  const safeLeader = escapeHtml(leaderName);
  const tripUrl = `${config.frontendUrl}/app/trips/${encodeURIComponent(tripId)}?tab=chat`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 36px 28px; border: 1px solid #d1fae5; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 14px rgba(16,185,129,0.08);">
      <div style="margin-bottom: 24px;">
        <h1 style="color: #064e3b; font-size: 26px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px;">Tripzobox</h1>
        <p style="color: #059669; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Spot Confirmed! 🎉</p>
      </div>
      <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin-bottom: 12px;">You're in! Welcome to ${safeTrip}</h2>
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
        Hi <strong>${safeName}</strong>, great news! Trip leader <strong>${safeLeader}</strong> has officially accepted your join request for <strong>${safeTrip}</strong>.
      </p>
      <div style="background-color: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 14px; padding: 18px 20px; margin: 24px 0;">
        <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Next steps with your group:</p>
        <ul style="color: #15803d; font-size: 13px; margin: 0; padding-left: 18px; line-height: 1.6;">
          <li>Say hello to the crew in the trip room chat</li>
          <li>Review the shared itinerary and packing checklist</li>
          <li>Coordinate departure timings and shared plans</li>
        </ul>
      </div>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${tripUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
          Open Trip Room &amp; Chat 💬
        </a>
      </div>
      <p style="color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
        Have questions? You can access your trip details and emergency help anytime at <a href="${tripUrl}" style="color: #059669;">${tripUrl}</a>.
      </p>
    </div>
  `;

  return dispatchTransactionalEmail({
    to: cleanEmail,
    name,
    subject: `🎉 You're accepted to join "${safeTrip}" on TripzoBox!`,
    html,
    emailType: 'Trip acceptance confirmation',
  });
};
