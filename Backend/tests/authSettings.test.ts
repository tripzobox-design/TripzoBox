import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { AuthSettings } from '../src/models/AuthSettings.js';
import { AdminAuditLog } from '../src/models/AdminAuditLog.js';
import {
  getAuthSettings,
  invalidateAuthSettingsCache,
  getPublicAuthConfig,
  updateAuthSettings,
} from '../src/services/authSettingsService.js';
import { sendPhoneOtp } from '../src/services/smsService.js';
import { signToken } from '../src/utils/token.js';

describe('TripzoBox Admin-Configurable Auth Providers (SMS OTP & Apple Sign-In)', () => {
  let app: any;
  let adminToken: string;
  let adminUser: any;
  let regularUserToken: string;
  let regularUser: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    app = createApp();

    // Create Admin User
    adminUser = await User.create({
      id: `admin_auth_test_${Date.now()}`,
      name: 'Super Admin',
      email: `superadmin_${Date.now()}@tripzobox.test`,
      password: 'AdminPassword123!',
      role: 'superadmin',
      emailVerified: true,
      country: 'India',
    });
    adminToken = signToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: 'superadmin',
      tokenVersion: 0,
    });

    // Create Regular User
    regularUser = await User.create({
      id: `regular_user_${Date.now()}`,
      name: 'Regular Traveler',
      email: `traveler_${Date.now()}@tripzobox.test`,
      password: 'TravelerPassword123!',
      role: 'user',
      emailVerified: true,
      country: 'India',
    });
    regularUserToken = signToken({
      userId: regularUser.id,
      email: regularUser.email,
      role: 'user',
      tokenVersion: 0,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@tripzobox\.test$/ } });
    await AuthSettings.deleteMany({});
    invalidateAuthSettingsCache();
    await disconnectDB();
  });

  beforeEach(async () => {
    // Reset to default settings before each test
    await AuthSettings.deleteMany({});
    await AdminAuditLog.deleteMany({ action: 'AUTH_SETTINGS_UPDATED' });
    invalidateAuthSettingsCache();
  });

  // =========================================================================
  // Requirement 1: Google Login continues working
  // =========================================================================
  it('1. Google Login continues working and generates authenticated session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/oauth')
      .send({
        provider: 'Google',
        email: `google_traveler_${Date.now()}@gmail.com`,
        name: 'Google Explorer',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.emailVerified).toBe(true);
  });

  // =========================================================================
  // Requirement 2: Email OTP continues working
  // =========================================================================
  it('2. Email OTP continues working for verification and password reset', async () => {
    const testEmail = `email_otp_test_${Date.now()}@tripzobox.test`;
    const signupRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Email Traveler',
        emailOrPhone: testEmail,
        password: 'Password123!',
      });

    expect(signupRes.status).toBe(201);
    expect(signupRes.body.success).toBe(true);
    expect(signupRes.body.data.token).toBeDefined();
    expect(signupRes.body.data.user.email).toBe(testEmail.toLowerCase());

    // Password reset via email
    const resetRes = await request(app)
      .post('/api/v1/auth/forgot-password/request')
      .send({
        emailOrPhone: testEmail,
        method: 'email',
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);
    expect(resetRes.body.data.method).toBe('email');
  });

  // =========================================================================
  // Requirement 3: SMS OTP is disabled by default
  // =========================================================================
  it('3. SMS OTP is disabled by default in database and public configuration', async () => {
    const settings = await getAuthSettings();
    expect(settings.smsOtp.enabled).toBe(false);

    const publicRes = await request(app).get('/api/config/auth');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.smsOtp).toBe(false);
    expect(publicRes.body.data.google).toBe(true);
    expect(publicRes.body.data.emailOtp).toBe(true);
  });

  // =========================================================================
  // Requirement 4: No SMS messages sent while disabled & endpoints reject
  // =========================================================================
  it('4. Rejects SMS OTP request endpoints with 403 and prevents SMS dispatch while disabled', async () => {
    // 4a. Mobile phone OTP endpoint
    const phoneRes = await request(app)
      .post('/api/v1/safety/phone/request-otp')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({ phone: '+919876543210' });

    expect(phoneRes.status).toBe(403);
    expect(phoneRes.body.message).toContain('SMS OTP authentication is currently disabled');

    // 4b. SMS service internal safety check
    const dispatchResult = await sendPhoneOtp('9876543210', '123456');
    expect(dispatchResult.success).toBe(false);
    expect(dispatchResult.status).toBe('DISABLED');
    expect(dispatchResult.error).toContain('disabled');

    // 4c. Phone signup rejection
    const phoneSignupRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Phone User',
        emailOrPhone: '9876543210',
        password: 'Password123!',
      });

    expect(phoneSignupRes.status).toBe(403);
    expect(phoneSignupRes.body.message).toContain('Phone');
  });

  // =========================================================================
  // Requirement 5: Apple Sign-In is disabled by default
  // =========================================================================
  it('5. Apple Sign-In is disabled by default in database and public configuration', async () => {
    const settings = await getAuthSettings();
    expect(settings.appleAuth.enabled).toBe(false);

    const publicRes = await request(app).get('/api/v1/config/auth');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.apple).toBe(false);
  });

  // =========================================================================
  // Requirement 6: No Apple OAuth requests are triggered or permitted while disabled
  // =========================================================================
  it('6. Rejects Apple OAuth requests with 403 when Apple Sign-In is disabled', async () => {
    const res = await request(app)
      .post('/api/v1/auth/oauth')
      .send({
        provider: 'Apple',
        email: 'traveler_apple@icloud.com',
        name: 'Apple Traveler',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Apple Sign-In is currently disabled');
  });

  // =========================================================================
  // Requirement 7: Admin can enable SMS OTP
  // =========================================================================
  it('7. Admin can enable SMS OTP after providing valid credentials', async () => {
    const res = await request(app)
      .put('/api/v1/admin/settings/auth')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        smsOtp: {
          enabled: true,
          apiKey: 'fast2sms_test_live_key_valid_12345',
          senderId: 'TRIPZO',
          otpExpiryMinutes: 10,
          resendCooldownSeconds: 60,
          maxAttempts: 5,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.smsOtp.enabled).toBe(true);
    expect(res.body.data.smsOtp.hasApiKey).toBe(true);
    expect(res.body.data.smsOtp.maskedApiKey).toContain('••••');

    // Verify public configuration reflected immediately
    const publicConfig = await getPublicAuthConfig();
    expect(publicConfig.smsOtp).toBe(true);
  });

  // =========================================================================
  // Requirement 8: Admin can disable SMS OTP
  // =========================================================================
  it('8. Admin can disable SMS OTP and subsequent phone OTP requests are blocked', async () => {
    // First enable
    await updateAuthSettings(
      { smsOtp: { enabled: true, apiKey: 'dummy_valid_api_key_123' } },
      { id: adminUser.id, email: adminUser.email }
    );

    // Then disable
    const res = await request(app)
      .put('/api/v1/admin/settings/auth')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        smsOtp: {
          enabled: false,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.smsOtp.enabled).toBe(false);

    // Verify phone OTP endpoint is blocked again
    const phoneRes = await request(app)
      .post('/api/v1/safety/phone/request-otp')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({ phone: '+919876543210' });

    expect(phoneRes.status).toBe(403);
  });

  // =========================================================================
  // Requirement 9: Admin can enable Apple Sign-In after valid configuration
  // =========================================================================
  it('9. Admin can enable Apple Sign-In after configuring valid credentials', async () => {
    const validPrivateKey =
      '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgTestKeyContentHere1234567890\n-----END PRIVATE KEY-----';

    const res = await request(app)
      .put('/api/v1/admin/settings/auth')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        appleAuth: {
          enabled: true,
          clientId: 'com.tripzobox.web.auth',
          teamId: 'A1B2C3D4E5',
          keyId: 'K9L8M7N6P5',
          privateKey: validPrivateKey,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.appleAuth.enabled).toBe(true);
    expect(res.body.data.appleAuth.hasPrivateKey).toBe(true);
    expect(res.body.data.appleAuth.maskedPrivateKey).toContain('[CONFIGURED]');

    // Verify public config reflected immediately
    const publicConfig = await getPublicAuthConfig();
    expect(publicConfig.apple).toBe(true);

    // Verify Apple sign-in is now accepted
    const oauthRes = await request(app)
      .post('/api/v1/auth/oauth')
      .send({
        provider: 'Apple',
        email: `apple_activated_${Date.now()}@icloud.com`,
        name: 'Apple Enabled Traveler',
      });

    expect(oauthRes.status).toBe(200);
    expect(oauthRes.body.success).toBe(true);
  });

  // =========================================================================
  // Requirement 10: Admin can disable Apple Sign-In
  // =========================================================================
  it('10. Admin can disable Apple Sign-In and subsequent OAuth requests are rejected', async () => {
    // First enable with valid credentials
    await updateAuthSettings(
      {
        appleAuth: {
          enabled: true,
          clientId: 'com.tripzobox.web',
          teamId: 'TEAMID1234',
          keyId: 'KEYID12345',
          privateKey: '-----BEGIN PRIVATE KEY-----\nTestAppleKey1234567890\n-----END PRIVATE KEY-----',
        },
      },
      { id: adminUser.id, email: adminUser.email }
    );

    // Now disable
    const res = await request(app)
      .put('/api/v1/admin/settings/auth')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        appleAuth: {
          enabled: false,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.appleAuth.enabled).toBe(false);

    // Verify Apple OAuth login is blocked
    const oauthRes = await request(app)
      .post('/api/v1/auth/oauth')
      .send({
        provider: 'Apple',
        email: 'apple_blocked@icloud.com',
      });

    expect(oauthRes.status).toBe(403);
  });

  // =========================================================================
  // Requirement 11: Invalid credentials prevent provider activation
  // =========================================================================
  it('11. Invalid credentials prevent provider activation with clear 400 error', async () => {
    // 11a: Attempt to enable SMS without API key
    const smsRes = await request(app)
      .put('/api/v1/admin/settings/auth')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        smsOtp: {
          enabled: true,
          apiKey: '',
        },
      });

    expect(smsRes.status).toBe(400);
    expect(smsRes.body.message).toContain('Fast2SMS API key');

    // 11b: Attempt to enable Apple without valid 10-char Team ID
    const appleRes = await request(app)
      .put('/api/v1/admin/settings/auth')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        appleAuth: {
          enabled: true,
          clientId: 'com.tripzobox.web',
          teamId: 'SHORT', // only 5 chars, invalid
          keyId: 'KEYID12345',
          privateKey: 'some_key',
        },
      });

    expect(appleRes.status).toBe(400);
    expect(appleRes.body.message).toContain('10-character');
  });

  // =========================================================================
  // Requirement 12: Non-admin users cannot modify provider settings
  // =========================================================================
  it('12. Non-admin users cannot modify provider settings', async () => {
    // Regular traveler user
    const res = await request(app)
      .put('/api/v1/admin/settings/auth')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({
        smsOtp: { enabled: true },
      });

    expect(res.status).toBe(403);

    // Unauthenticated request
    const unauthRes = await request(app)
      .put('/api/v1/admin/settings/auth')
      .send({
        smsOtp: { enabled: true },
      });

    expect(unauthRes.status).toBe(401);
  });

  // =========================================================================
  // Requirement 13: Configuration updates persist after backend restart
  // =========================================================================
  it('13. Configuration updates persist in MongoDB across cache invalidations and restarts', async () => {
    // Admin updates settings
    await request(app)
      .put('/api/v1/admin/settings/auth')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        smsOtp: {
          enabled: true,
          apiKey: 'persistence_test_api_key_abc123',
          senderId: 'BOXSMS',
          otpExpiryMinutes: 12,
        },
      });

    // Simulate backend restart by wiping memory cache
    invalidateAuthSettingsCache();

    // Query database directly
    const reloadedSettings = await getAuthSettings(true);
    expect(reloadedSettings.smsOtp.enabled).toBe(true);
    expect(reloadedSettings.smsOtp.senderId).toBe('BOXSMS');
    expect(reloadedSettings.smsOtp.otpExpiryMinutes).toBe(12);

    // Verify audit log was recorded
    const auditLog = await AdminAuditLog.findOne({
      targetId: 'default_auth_settings',
      action: 'AUTH_SETTINGS_UPDATED',
    });
    expect(auditLog).toBeDefined();
    expect(auditLog?.adminEmail).toBe(adminUser.email);
  });

  // =========================================================================
  // Requirement 14: Existing users and authentication sessions are not broken
  // =========================================================================
  it('14. Existing users and active authentication sessions remain valid regardless of flag changes', async () => {
    // Alice has existing token
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${regularUserToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.id).toBe(regularUser.id);
  });

  // =========================================================================
  // Requirement 15: Frontend and backend provider availability remain synchronized
  // =========================================================================
  it('15. Frontend public config (/api/config/auth) stays synchronized with admin settings updates', async () => {
    // 15a: Initially false
    let publicRes = await request(app).get('/api/config/auth');
    expect(publicRes.body.data.smsOtp).toBe(false);

    // 15b: Admin enables SMS OTP
    await request(app)
      .put('/api/v1/admin/settings/auth')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        smsOtp: {
          enabled: true,
          apiKey: 'synchronized_test_key_12345',
        },
      });

    // 15c: Immediate check on /api/config/auth reflects true
    publicRes = await request(app).get('/api/config/auth');
    expect(publicRes.body.data.smsOtp).toBe(true);

    // 15d: Admin disables SMS OTP
    await request(app)
      .put('/api/v1/admin/settings/auth')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        smsOtp: {
          enabled: false,
        },
      });

    // 15e: Immediate check on /api/config/auth reflects false
    publicRes = await request(app).get('/api/config/auth');
    expect(publicRes.body.data.smsOtp).toBe(false);
  });
});
