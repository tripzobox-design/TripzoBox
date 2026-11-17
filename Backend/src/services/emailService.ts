import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env.js';

export interface EmailResult {
  sent: boolean;
  isSimulated: boolean;
  verificationLink?: string;
  previewUrl?: string;
  otp?: string;
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

const getEtherealTransporter = async (): Promise<Transporter | null> => {
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
    });
    return etherealTransporter;
  } catch (err: any) {
    console.warn('[Email Service] Ethereal test account note:', err.message);
    return null;
  } finally {
    isCreatingEthereal = false;
  }
};

const getRealTransporter = () => {
  if (config.smtpUser && config.smtpPass) {
    const cleanPass = config.smtpPass.replace(/\s+/g, '');
    if (config.smtpHost.includes('gmail') || config.smtpUser.endsWith('@gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.smtpUser,
          pass: cleanPass,
        },
      });
    }

    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: cleanPass,
      },
    });
  }
  return null;
};

export const sendVerificationEmail = async (
  email: string,
  name: string,
  verificationToken: string,
  otp?: string
): Promise<EmailResult> => {
  const verificationLink = `${config.frontendUrl}/auth?step=verify-email&token=${verificationToken}&email=${encodeURIComponent(
    email
  )}${otp ? `&otp=${otp}` : ''}`;

  const cleanEmail = email.toLowerCase().trim();
  const realTransporter = getRealTransporter();

  // 1. If SMTP is configured in .env, send via real SMTP
  if (realTransporter) {
    try {
      await realTransporter.sendMail({
        from: config.smtpFrom || `"TripzoBox" <${config.smtpUser}>`,
        to: email,
        subject: otp ? `Your TripzoBox verification code: ${otp} 🌿` : 'Verify your TripzoBox account 🌿',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff;">
            <div style="margin-bottom: 24px;">
              <h1 style="color: #064e3b; font-size: 24px; font-weight: 800; margin: 0 0 8px 0;">Tripzobox</h1>
              <p style="color: #059669; font-size: 13px; font-weight: 600; margin: 0;">Explore The World Without Limits</p>
            </div>
            <h2 style="color: #111827; font-size: 20px; margin-bottom: 12px;">Verify your email address</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              Hi <strong>${name}</strong>, thanks for creating an account with TripzoBox! Use the 6-digit verification code below:
            </p>
            ${
              otp
                ? `<div style="margin: 24px 0; background-color: #f0fdf4; border: 2px solid #bbf7d0; padding: 18px 24px; border-radius: 14px; text-align: center;">
                    <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #047857;">${otp}</span>
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
        `,
      });

      const result: EmailResult = {
        sent: true,
        isSimulated: false,
        verificationLink,
        otp,
      };

      latestEmailDispatches.set(cleanEmail, {
        email: cleanEmail,
        verificationLink,
        isSimulated: false,
        sentAt: Date.now(),
        otp,
      });

      return result;
    } catch (err: any) {
      console.error('[Email Service] Failed to send real SMTP email:', err.message);
    }
  }

  // 2. Simulated / Ethereal Test in development
  let previewUrl: string | undefined;
  try {
    const ethereal = await getEtherealTransporter();
    if (ethereal) {
      const info = await ethereal.sendMail({
        from: '"TripzoBox Test" <test@tripzobox.com>',
        to: email,
        subject: otp ? `Your TripzoBox verification code: ${otp} 🌿` : 'Verify your TripzoBox account 🌿',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff;">
            <div style="margin-bottom: 24px;">
              <h1 style="color: #064e3b; font-size: 24px; font-weight: 800; margin: 0 0 8px 0;">Tripzobox</h1>
              <p style="color: #059669; font-size: 13px; font-weight: 600; margin: 0;">Explore The World Without Limits</p>
            </div>
            <h2 style="color: #111827; font-size: 20px; margin-bottom: 12px;">Verify your email address</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              Hi <strong>${name}</strong>, thanks for creating an account with TripzoBox! Use the 6-digit verification code below:
            </p>
            ${
              otp
                ? `<div style="margin: 24px 0; background-color: #f0fdf4; border: 2px solid #bbf7d0; padding: 18px 24px; border-radius: 14px; text-align: center;">
                    <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #047857;">${otp}</span>
                    <p style="color: #065f46; font-size: 12px; margin: 8px 0 0 0; font-weight: 500;">Valid for 15 minutes</p>
                  </div>`
                : ''
            }
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Or click the button below to verify your email instantly in your browser:
            </p>
            <div style="margin: 28px 0;">
              <a href="${verificationLink}" style="background-color: #059669; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              <a href="${verificationLink}" style="color: #059669; word-break: break-all;">${verificationLink}</a>
            </p>
          </div>
        `,
      });
      const generated = nodemailer.getTestMessageUrl(info);
      if (generated) {
        previewUrl = generated;
      }
    }
  } catch (etherealErr: any) {
    console.warn('[Email Service] Ethereal preview note:', etherealErr.message);
  }

  // Simulated Email in development (logs directly to console)
  console.log(`\n======================================================`);
  console.log(`[Email Service (${realTransporter ? 'LIVE GMAIL SMTP' : 'Simulated Local Mode'})]`);
  console.log(`To: ${email} (${name})`);
  console.log(`Subject: ${otp ? `Your TripzoBox verification code: ${otp} 🌿` : 'Verify your TripzoBox account 🌿'}`);
  if (otp) console.log(`Email OTP: ${otp}`);
  console.log(`Verification Link: ${verificationLink}`);
  if (previewUrl) {
    console.log(`Ethereal Preview URL: ${previewUrl}`);
  }
  console.log(`======================================================\n`);

  const result: EmailResult = {
    sent: true,
    isSimulated: !realTransporter,
    verificationLink,
    previewUrl,
    otp,
  };

  latestEmailDispatches.set(cleanEmail, {
    email: cleanEmail,
    verificationLink,
    previewUrl,
    isSimulated: !realTransporter,
    sentAt: Date.now(),
    otp,
  });

  return result;
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
  const realTransporter = getRealTransporter();

  if (realTransporter) {
    try {
      await realTransporter.sendMail({
        from: config.smtpFrom || `"TripzoBox" <${config.smtpUser}>`,
        to: email,
        subject: 'Reset your TripzoBox password 🔐',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 36px 28px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <div style="margin-bottom: 24px;">
              <h1 style="color: #064e3b; font-size: 26px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px;">Tripzobox</h1>
              <p style="color: #059669; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Password Reset Request</p>
            </div>
            <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 12px;">Reset Your Password</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
              Hi <strong>${name}</strong>, we received a request to reset your TripzoBox password. Click the button below to choose your new password:
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
        `,
      });

      return {
        sent: true,
        isSimulated: false,
        verificationLink: resetLink,
      };
    } catch (err: any) {
      console.error('[Email Service] Failed to send password reset email:', err.message);
    }
  }

  // Simulated in dev
  let previewUrl: string | undefined;
  try {
    const ethereal = await getEtherealTransporter();
    if (ethereal) {
      const info = await ethereal.sendMail({
        from: '"TripzoBox Test" <test@tripzobox.com>',
        to: email,
        subject: 'Reset your TripzoBox password 🔐',
        html: `
          <div style="padding: 24px; font-family: sans-serif;">
            <h2>TripzoBox Password Reset</h2>
            <p>Hi ${name}, click below to reset your password:</p>
            <p><a href="${resetLink}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Create New Password</a></p>
            <p>Or use link: ${resetLink}</p>
          </div>
        `,
      });
      const generated = nodemailer.getTestMessageUrl(info);
      if (generated) {
        previewUrl = generated;
      }
    }
  } catch (err) {
    // Ignore ethereal test errors
  }

  latestEmailDispatches.set(cleanEmail, {
    email: cleanEmail,
    verificationLink: resetLink,
    previewUrl,
    isSimulated: !realTransporter,
    sentAt: Date.now(),
    otp,
  });

  console.log(`\n======================================================`);
  console.log(`[Email Service (${realTransporter ? 'Live SMTP' : 'Simulated Local Mode'})]`);
  console.log(`To: ${email} (${name})`);
  console.log(`Subject: Reset your TripzoBox password 🔐`);
  console.log(`Reset Link: ${resetLink}`);
  if (previewUrl) {
    console.log(`Ethereal Preview URL: ${previewUrl}`);
  }
  console.log(`======================================================\n`);

  return {
    sent: true,
    isSimulated: !realTransporter,
    previewUrl,
    verificationLink: resetLink,
  };
};

export const sendDocumentVerificationEmail = async (
  email: string,
  name: string,
  documentName: string,
  otp: string
): Promise<EmailResult> => {
  const realTransporter = getRealTransporter();

  // 1. If SMTP is configured in .env, send via real SMTP
  if (realTransporter) {
    try {
      await realTransporter.sendMail({
        from: config.smtpFrom || `"TripzoBox" <${config.smtpUser}>`,
        to: email,
        subject: `🔐 Verify Your Document: ${documentName} – TripzoBox Travel Vault`,
        html: `
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
                  <p>Hello <b>${name}</b>,</p>
                  <p>You requested to verify and secure <b>${documentName}</b> in your TripzoBox Travel Vault. Use the one-time verification code below:</p>
                  
                  <div class="otp-box">
                    <p class="otp-code">${otp}</p>
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
        `,
      });

      console.log(`[Email Service (Real SMTP)] Dispatched document verification OTP to ${email}`);
      return { sent: true, isSimulated: false, otp };
    } catch (err: any) {
      console.error('[Email Service] Failed to send real SMTP document email:', err.message);
    }
  }

  // 2. Simulated / Ethereal Fallback
  console.log(`\n======================================================`);
  console.log(`[Email Service (Document OTP Verification)]`);
  console.log(`To: ${email} (${name})`);
  console.log(`Document: ${documentName}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`======================================================\n`);

  return {
    sent: true,
    isSimulated: true,
    otp,
  };
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const sendAccountDeletionOtpEmail = async (
  email: string,
  name: string,
  otp: string
): Promise<EmailResult> => {
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

  const realTransporter = getRealTransporter();
  if (realTransporter) {
    try {
      await realTransporter.sendMail({
        from: config.smtpFrom || `"TripzoBox Security" <${config.smtpUser}>`,
        to: email,
        subject,
        html,
      });
      console.log('[Email Service] Account deletion OTP dispatched via SMTP.');
      return { sent: true, isSimulated: false };
    } catch (err: any) {
      console.error('[Email Service] Failed to send deletion OTP via SMTP:', err.message);
    }
  }

  let previewUrl: string | undefined;
  try {
    const ethereal = await getEtherealTransporter();
    if (ethereal) {
      const info = await ethereal.sendMail({
        from: '"TripzoBox Security" <security@tripzobox.com>',
        to: email,
        subject,
        html,
      });
      const generated = nodemailer.getTestMessageUrl(info);
      if (generated) previewUrl = generated;
    }
  } catch {
    // Non-fatal in offline/test environments
  }

  console.log('[Email Service] Account deletion OTP email prepared (code redacted from logs).');
  return {
    sent: true,
    isSimulated: true,
    previewUrl,
  };
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

  const realTransporter = getRealTransporter();
  if (realTransporter) {
    try {
      await realTransporter.sendMail({
        from: config.smtpFrom || `"TripzoBox Privacy" <${config.smtpUser}>`,
        to: email,
        subject,
        html,
      });
      console.log('[Email Service] Account deletion confirmation email dispatched via SMTP.');
      return { sent: true, isSimulated: false };
    } catch (err: any) {
      console.error('[Email Service] Failed to send deletion confirmation email via SMTP:', err.message);
    }
  }

  let previewUrl: string | undefined;
  try {
    const ethereal = await getEtherealTransporter();
    if (ethereal) {
      const info = await ethereal.sendMail({
        from: '"TripzoBox Privacy" <privacy@tripzobox.com>',
        to: email,
        subject,
        html,
      });
      const generated = nodemailer.getTestMessageUrl(info);
      if (generated) previewUrl = generated;
    }
  } catch {
    // Non-fatal in offline/test environments
  }

  console.log('[Email Service] Account deletion confirmation email prepared.');
  return {
    sent: true,
    isSimulated: true,
    previewUrl,
  };
};
