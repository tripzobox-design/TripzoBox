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
  otp: string
): Promise<EmailResult> => {
  const resetLink = `${config.frontendUrl}/forgot-password?step=phone-otp&email=${encodeURIComponent(email)}`;
  const cleanEmail = email.toLowerCase().trim();
  const realTransporter = getRealTransporter();

  if (realTransporter) {
    try {
      await realTransporter.sendMail({
        from: config.smtpFrom || `"TripzoBox" <${config.smtpUser}>`,
        to: email,
        subject: 'Reset your TripzoBox password 🔐',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff;">
            <div style="margin-bottom: 24px;">
              <h1 style="color: #064e3b; font-size: 24px; font-weight: 800; margin: 0 0 8px 0;">Tripzobox</h1>
              <p style="color: #059669; font-size: 13px; font-weight: 600; margin: 0;">Password Reset Request</p>
            </div>
            <h2 style="color: #111827; font-size: 20px; margin-bottom: 12px;">Your Password Reset Code</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
              Hi <strong>${name}</strong>, we received a request to reset your password. Use the 6-digit verification code below:
            </p>
            <div style="margin: 24px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 12px; text-align: center;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #047857;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 24px;">
              This code will expire in 15 minutes. If you did not request a password reset, please ignore this email.
            </p>
          </div>
        `,
      });

      return {
        sent: true,
        isSimulated: false,
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
            <p>Your OTP Code is: <strong>${otp}</strong></p>
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

  console.log(`\n======================================================`);
  console.log(`[Email Service (Simulated Local Mode)]`);
  console.log(`To: ${email} (${name})`);
  console.log(`Subject: Reset your TripzoBox password 🔐`);
  console.log(`OTP Code: ${otp}`);
  if (previewUrl) {
    console.log(`Ethereal Preview URL: ${previewUrl}`);
  }
  console.log(`Note: To send real emails to Gmail, configure SMTP_HOST, SMTP_USER, SMTP_PASS in Backend/.env`);
  console.log(`======================================================\n`);

  return {
    sent: true,
    isSimulated: true,
    previewUrl,
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
