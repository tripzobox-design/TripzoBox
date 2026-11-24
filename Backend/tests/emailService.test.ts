import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import nodemailer from 'nodemailer';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { config } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import {
  maskEmail,
  sanitizeErrorMessage,
  verifyEmailService,
  verifySmtpConnection,
  sendBrevoEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendDocumentVerificationEmail,
  sendAccountDeletionOtpEmail,
  sendAccountDeletionConfirmationEmail,
} from '../src/services/emailService.js';

describe('TripzoBox Production Email Delivery (Brevo HTTPS API & SMTP) Suite', () => {
  let app: any;
  const originalEnv = {
    nodeEnv: config.nodeEnv,
    brevoApiKey: config.brevoApiKey,
    emailFrom: config.emailFrom,
    emailFromName: config.emailFromName,
    smtpUser: config.smtpUser,
    smtpPass: config.smtpPass,
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpSecure: config.smtpSecure,
    smtpFrom: config.smtpFrom,
  };

  const originalFetch = globalThis.fetch;
  const testUserEmail = 'audit_traveler_2026@tripzobox.com';

  beforeAll(async () => {
    await connectDB();
    app = createApp();

    // Ensure clean test user
    await User.deleteOne({ email: testUserEmail });
    await User.create({
      name: 'Audit Traveler',
      email: testUserEmail,
      password: 'HashedPassword123!',
      isVerified: true,
      authProvider: 'local',
    });
  });

  afterAll(async () => {
    await User.deleteOne({ email: testUserEmail });
    Object.assign(config, originalEnv);
    globalThis.fetch = originalFetch;
    await disconnectDB();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    Object.assign(config, originalEnv);
    globalThis.fetch = originalFetch;
  });

  describe('1. Email Privacy Masking & Error Sanitization', () => {
    it('masks emails properly to protect recipient data in logs', () => {
      expect(maskEmail('tripzobox@gmail.com')).toBe('t***x@gmail.com');
      expect(maskEmail('valatthamizhrr@gmail.com')).toBe('v***r@gmail.com');
      expect(maskEmail('ab@example.com')).toBe('a*@example.com');
      expect(maskEmail('')).toBe('***');
    });

    it('sanitizes error messages by scrubbing passwords and tokens', () => {
      config.smtpPass = 'secret_pass_1234';
      const rawError = new Error('Auth failed for secret_pass_1234 with token=eyJhbGciOi...');
      const cleaned = sanitizeErrorMessage(rawError);
      expect(cleaned).not.toContain('secret_pass_1234');
      expect(cleaned).toContain('[REDACTED_PASS]');
      expect(cleaned).toContain('token=[REDACTED]');
      expect(cleaned).not.toContain('eyJhbGciOi...');
    });

    it('sanitizes error messages by scrubbing Brevo API keys', () => {
      config.brevoApiKey = 'xkeysib-99887766554433221100-secret';
      const rawError = new Error('Brevo call failed: xkeysib-99887766554433221100-secret rejected');
      const cleaned = sanitizeErrorMessage(rawError);
      expect(cleaned).not.toContain('xkeysib-99887766554433221100-secret');
      expect(cleaned).toContain('[REDACTED_API_KEY]');
    });
  });

  describe('2. Brevo HTTPS Transactional Email API', () => {
    it('dispatches an email via Brevo HTTPS POST successfully', async () => {
      config.brevoApiKey = 'xkeysib-test-key-12345';
      config.emailFrom = 'contact@tripzobox.com';
      config.emailFromName = 'TripzoBox';

      let capturedUrl = '';
      let capturedOptions: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url: any, options: any) => {
        capturedUrl = String(url);
        capturedOptions = options;
        return {
          ok: true,
          status: 201,
          json: async () => ({ messageId: '<brevo-msg-001@smtp-relay.brevo.com>' }),
        } as Response;
      });

      const res = await sendBrevoEmail(
        'traveler@example.com',
        'Welcome to TripzoBox',
        '<p>Enjoy your trip</p>',
        'Traveler John'
      );

      expect(res.sent).toBe(true);
      expect(res.messageId).toBe('<brevo-msg-001@smtp-relay.brevo.com>');
      expect(capturedUrl).toBe('https://api.brevo.com/v3/smtp/email');
      expect(capturedOptions.method).toBe('POST');
      expect(capturedOptions.headers['api-key']).toBe('xkeysib-test-key-12345');

      const parsedBody = JSON.parse(capturedOptions.body);
      expect(parsedBody.sender).toEqual({ name: 'TripzoBox', email: 'contact@tripzobox.com' });
      expect(parsedBody.to).toEqual([{ email: 'traveler@example.com', name: 'Traveler John' }]);
      expect(parsedBody.subject).toBe('Welcome to TripzoBox');
    });

    it('handles Brevo HTTP error responses (e.g. 401 Unauthorized)', async () => {
      config.brevoApiKey = 'invalid-brevo-key';

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 401,
          text: async () => JSON.stringify({ message: 'Key not found', code: 'unauthorized' }),
        } as Response;
      });

      await expect(
        sendBrevoEmail('traveler@example.com', 'Subject', '<p>Test</p>')
      ).rejects.toThrow(/Brevo HTTP 401/);
    });

    it('handles Brevo timeout cleanly via AbortSignal', async () => {
      config.brevoApiKey = 'xkeysib-test-key-12345';

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        const timeoutErr = new Error('The operation was aborted due to timeout');
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      });

      await expect(
        sendBrevoEmail('traveler@example.com', 'Subject', '<p>Test</p>')
      ).rejects.toThrow(/Brevo API request timed out after 8000ms/);
    });

    it('throws immediately when BREVO_API_KEY is not configured', async () => {
      config.brevoApiKey = '';

      await expect(
        sendBrevoEmail('traveler@example.com', 'Subject', '<p>Test</p>')
      ).rejects.toThrow(/BREVO_API_KEY is not configured/);
    });
  });

  describe('3. Service Health Verification (Brevo HTTPS API & SMTP)', () => {
    it('verifies Brevo account successfully when BREVO_API_KEY is present', async () => {
      config.brevoApiKey = 'valid-key';
      config.smtpUser = '';
      config.smtpPass = '';

      globalThis.fetch = vi.fn().mockImplementation(async (url: any) => {
        if (String(url).includes('/v3/account')) {
          return { ok: true, status: 200 } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      const res = await verifyEmailService();
      expect(res.ok).toBe(true);
      expect(res.provider).toBe('brevo');
      expect(res.message).toContain('Brevo HTTPS API connection verified successfully');
    });

    it('reports failure when Brevo account check fails', async () => {
      config.brevoApiKey = 'bad-key';
      config.smtpUser = '';
      config.smtpPass = '';

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 401,
          text: async () => 'Unauthorized key',
        } as Response;
      });

      const res = await verifyEmailService();
      expect(res.ok).toBe(false);
      expect(res.provider).toBe('brevo');
      expect(res.message).toContain('Brevo HTTP 401');
    });

    it('verifies SMTP connection successfully when SMTP credentials exist and Brevo is absent', async () => {
      config.brevoApiKey = '';
      config.smtpUser = 'tripzobox@gmail.com';
      config.smtpPass = 'valid_app_password';

      const verifyMock = vi.fn().mockResolvedValue(true);
      vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        verify: verifyMock,
        sendMail: vi.fn(),
      } as any);

      const res = await verifySmtpConnection();
      expect(res.ok).toBe(true);
      expect(res.provider).toBe('smtp');
      expect(verifyMock).toHaveBeenCalled();
    });

    it('reports failure when neither Brevo nor SMTP is configured', async () => {
      config.brevoApiKey = '';
      config.smtpUser = '';
      config.smtpPass = '';

      const res = await verifyEmailService();
      expect(res.ok).toBe(false);
      expect(res.provider).toBe('none');
      expect(res.message).toContain('No email service configured');
    });
  });

  describe('4. Production Mode Behavior: Rejects Missing Credentials without Silent Fallback', () => {
    beforeEach(() => {
      config.nodeEnv = 'production';
      config.brevoApiKey = '';
      config.smtpUser = '';
      config.smtpPass = '';
    });

    it('rejects password reset email in production when credentials are missing', async () => {
      await expect(
        sendPasswordResetEmail('traveler@test.com', 'Traveler', '123456', 'sample_reset_token')
      ).rejects.toThrow(/Email delivery unavailable: BREVO_API_KEY \(or SMTP credentials\) are not configured/);
    });

    it('rejects verification email in production when credentials are missing', async () => {
      await expect(
        sendVerificationEmail('traveler@test.com', 'Traveler', 'sample_token', '123456')
      ).rejects.toThrow(/Email delivery unavailable: BREVO_API_KEY \(or SMTP credentials\) are not configured/);
    });

    it('rejects document verification email in production when credentials are missing', async () => {
      await expect(
        sendDocumentVerificationEmail('traveler@test.com', 'Traveler', 'Passport.pdf', '123456')
      ).rejects.toThrow(/Email delivery unavailable: BREVO_API_KEY \(or SMTP credentials\) are not configured/);
    });

    it('rejects account deletion OTP email in production when credentials are missing', async () => {
      await expect(
        sendAccountDeletionOtpEmail('traveler@test.com', 'Traveler', '123456')
      ).rejects.toThrow(/Email delivery unavailable: BREVO_API_KEY \(or SMTP credentials\) are not configured/);
    });

    it('rejects account deletion confirmation in production when credentials are missing', async () => {
      await expect(
        sendAccountDeletionConfirmationEmail('traveler@test.com', 'Traveler', {
          deletedAt: new Date(),
          retainedSummary: 'All data removed',
        })
      ).rejects.toThrow(/Email delivery unavailable: BREVO_API_KEY \(or SMTP credentials\) are not configured/);
    });
  });

  describe('5. Production Mode Behavior: Brevo Delivery & Security in Production', () => {
    beforeEach(() => {
      config.nodeEnv = 'production';
      config.brevoApiKey = 'xkeysib-prod-key-12345';
      config.smtpUser = '';
      config.smtpPass = '';
    });

    it('successfully dispatches password reset via Brevo and masks recipient in logs', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        return {
          ok: true,
          status: 201,
          json: async () => ({ messageId: '<brevo-reset-999>' }),
        } as Response;
      });

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sendPasswordResetEmail(
        'recipient@gmail.com',
        'Recipient',
        '654321',
        'super_secret_jwt_reset_token'
      );

      expect(result.sent).toBe(true);
      expect(result.isSimulated).toBe(false);
      expect(result.messageId).toBe('<brevo-reset-999>');

      // Verify masked logs without leaking sensitive token
      const logs = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(logs).toContain('r***t@gmail.com');
      expect(logs).toContain('Brevo HTTPS');
      expect(logs).not.toContain('super_secret_jwt_reset_token');
    });

    it('throws when Brevo API delivery fails in production without silent fallback', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 500,
          text: async () => 'Internal Brevo Server Error',
        } as Response;
      });

      await expect(
        sendPasswordResetEmail('traveler@test.com', 'Traveler', '123456', 'sample_token')
      ).rejects.toThrow(/Email delivery failed: Brevo HTTP 500/);
    });
  });

  describe('6. Development Mode Fallback', () => {
    it('allows simulated mode without throwing when credentials are unconfigured in development', async () => {
      config.nodeEnv = 'development';
      config.brevoApiKey = '';
      config.smtpUser = '';
      config.smtpPass = '';

      vi.spyOn(nodemailer, 'createTestAccount').mockResolvedValueOnce({
        user: 'mock_ethereal_user',
        pass: 'mock_ethereal_pass',
        smtp: { host: 'smtp.ethereal.email', port: 587, secure: false },
        imap: { host: 'imap.ethereal.email', port: 993, secure: true },
        pop3: { host: 'pop3.ethereal.email', port: 995, secure: true },
        web: 'https://ethereal.email',
      });
      vi.spyOn(nodemailer, 'createTransport').mockReturnValueOnce({
        sendMail: vi.fn().mockResolvedValue({ messageId: 'mock-ethereal-msg' }),
      } as any);

      const result = await sendPasswordResetEmail('dev_user@gmail.com', 'Dev User', '112233', 'dev_token');
      expect(result.sent).toBe(true);
      expect(result.isSimulated).toBe(true);
    });
  });

  describe('7. API Integration: /api/v1/auth/forgot-password/request in Production with Brevo', () => {
    it('returns HTTP 200 when Brevo delivery succeeds in production', async () => {
      config.nodeEnv = 'production';
      config.brevoApiKey = 'xkeysib-prod-key';
      config.smtpUser = '';
      config.smtpPass = '';

      globalThis.fetch = vi.fn().mockImplementation(async (url: any) => {
        if (String(url).includes('/v3/smtp/email')) {
          return {
            ok: true,
            status: 201,
            json: async () => ({ messageId: '<brevo-api-route-msg>' }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({
          emailOrPhone: testUserEmail,
          method: 'email',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isSimulated).toBe(false);
      expect(res.body.message).toContain('Password reset link sent to');
    });

    it('returns HTTP 500 when Brevo delivery fails in production', async () => {
      config.nodeEnv = 'production';
      config.brevoApiKey = 'xkeysib-prod-key';
      config.smtpUser = '';
      config.smtpPass = '';

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 400,
          text: async () => JSON.stringify({ message: 'Invalid recipient email address' }),
        } as Response;
      });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({
          emailOrPhone: testUserEmail,
          method: 'email',
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unable to send password reset email');
    });

    it('returns HTTP 500 when credentials are missing in production', async () => {
      config.nodeEnv = 'production';
      config.brevoApiKey = '';
      config.smtpUser = '';
      config.smtpPass = '';

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({
          emailOrPhone: testUserEmail,
          method: 'email',
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unable to send password reset email');
    });

    it('never leaks devOtp, resetToken, or full reset URLs in production API response or logs', async () => {
      config.nodeEnv = 'production';
      config.brevoApiKey = 'xkeysib-prod-key';
      config.smtpUser = '';
      config.smtpPass = '';

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        return {
          ok: true,
          status: 201,
          json: async () => ({ messageId: '<brevo-no-leak-msg>' }),
        } as Response;
      });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({
          emailOrPhone: testUserEmail,
          method: 'email',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.devOtp).toBeUndefined();
      expect(res.body.data.resetToken).toBeUndefined();
      expect(res.body.data.isSimulated).toBe(false);

      const logs = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(logs).not.toContain('step=new-password');
      expect(logs).not.toContain('token=');
      expect(logs).toContain('a***6@tripzobox.com');
    });

    it('enforces production safeguards when RENDER=true even if NODE_ENV is unset', async () => {
      config.nodeEnv = 'development';
      const origRender = process.env.RENDER;
      process.env.RENDER = 'true';
      config.brevoApiKey = '';
      config.smtpUser = '';
      config.smtpPass = '';

      try {
        const res = await request(app)
          .post('/api/v1/auth/forgot-password/request')
          .send({
            emailOrPhone: testUserEmail,
            method: 'email',
          });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
      } finally {
        if (origRender === undefined) {
          delete process.env.RENDER;
        } else {
          process.env.RENDER = origRender;
        }
      }
    });
  });
});
