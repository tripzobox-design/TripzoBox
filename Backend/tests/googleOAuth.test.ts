import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { OAuth2Client } from 'google-auth-library';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { OAuthHandoffCode } from '../src/models/OAuthHandoffCode.js';
import crypto from 'crypto';

describe('TripzoBox Google OAuth 2.0 Integration Tests', () => {
  let app: any;
  const createdEmails: string[] = [];
  const origEnv = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:5000/api/auth/google/callback';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    await connectDB();
    app = createApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:5000/api/auth/google/callback';
  });

  afterAll(async () => {
    if (createdEmails.length > 0) {
      await User.deleteMany({ email: { $in: createdEmails } });
    }
    process.env.GOOGLE_CLIENT_ID = origEnv.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = origEnv.GOOGLE_CLIENT_SECRET;
    process.env.GOOGLE_CALLBACK_URL = origEnv.GOOGLE_CALLBACK_URL;
    process.env.FRONTEND_URL = origEnv.FRONTEND_URL;
    await disconnectDB();
  });

  const initiateGoogleAuth = async (redirectParam?: string) => {
    const url = redirectParam
      ? `/api/auth/google?redirect=${encodeURIComponent(redirectParam)}`
      : '/api/auth/google';
    const initRes = await request(app).get(url);
    expect(initRes.status).toBe(302);
    const location = initRes.headers.location as string;
    const setCookies = initRes.headers['set-cookie'] as string[];
    const stateCookie = setCookies.find((c) => c.startsWith('tripzobox_oauth_state='));
    const authUrl = new URL(location);
    const state = authUrl.searchParams.get('state') as string;
    return { initRes, location, authUrl, state, stateCookie: stateCookie! };
  };

  it('returns clear configuration error when Google credentials are missing (without crashing)', async () => {
    process.env.GOOGLE_CLIENT_ID = '';
    process.env.GOOGLE_CLIENT_SECRET = '';

    const apiRes = await request(app)
      .get('/api/auth/google')
      .set('Accept', 'application/json');
    expect(apiRes.status).toBe(503);
    expect(apiRes.body.success).toBe(false);
    expect(apiRes.body.message).toContain('Google OAuth is not configured');

    const browserRes = await request(app)
      .get('/api/auth/google')
      .set('Accept', 'text/html');
    expect(browserRes.status).toBe(302);
    expect(browserRes.headers.location).toContain('http://localhost:5173/login?oauth_error=missing_credentials');
  });

  it('GET /api/auth/google initializes OAuth with state, PKCE, callback URL, and HttpOnly state cookie', async () => {
    const { authUrl, state, stateCookie } = await initiateGoogleAuth('/app/profile');

    expect(authUrl.origin).toBe('https://accounts.google.com');
    expect(authUrl.searchParams.get('client_id')).toBe('test-google-client-id.apps.googleusercontent.com');
    expect(authUrl.searchParams.get('redirect_uri')).toBe('http://localhost:5000/api/auth/google/callback');
    expect(authUrl.searchParams.get('response_type')).toBe('code');
    expect(authUrl.searchParams.get('prompt')).toBe('select_account');
    expect(authUrl.searchParams.get('code_challenge_method')).toBe('S256');
    expect(authUrl.searchParams.get('code_challenge')).toBeTruthy();
    expect(state).toBeTruthy();
    expect(authUrl.toString()).not.toContain('test-google-client-secret');

    expect(stateCookie).toContain('HttpOnly');
    expect(stateCookie).toContain('SameSite=Lax');
  });

  it('handles user cancellation on Google callback cleanly', async () => {
    const { state, stateCookie } = await initiateGoogleAuth();

    const cbRes = await request(app)
      .get(`/api/auth/google/callback?error=access_denied&state=${encodeURIComponent(state)}`)
      .set('Cookie', stateCookie);

    expect(cbRes.status).toBe(302);
    expect(cbRes.headers.location).toContain('http://localhost:5173/login?oauth_error=cancelled');
    const cookies = (cbRes.headers['set-cookie'] || []) as string[];
    expect(cookies.some((c) => c.startsWith('tripzobox_token='))).toBe(false);
  });

  it('rejects CSRF state mismatch or missing state cookie', async () => {
    const { stateCookie } = await initiateGoogleAuth();

    const mismatchRes = await request(app)
      .get('/api/auth/google/callback?code=fake_code&state=tampered_state')
      .set('Cookie', stateCookie);
    expect(mismatchRes.status).toBe(302);
    expect(mismatchRes.headers.location).toContain('oauth_error=invalid_state');

    const missingCookieRes = await request(app)
      .get('/api/auth/google/callback?code=fake_code&state=some_state')
      .set('Accept', 'application/json');
    expect(missingCookieRes.status).toBe(403);
    expect(missingCookieRes.body.success).toBe(false);
  });

  it('rejects unverified Google email addresses', async () => {
    const { state, stateCookie } = await initiateGoogleAuth();

    vi.spyOn(OAuth2Client.prototype, 'getToken').mockResolvedValue({
      tokens: { id_token: 'mock-id-token', access_token: 'mock-access-token' },
    } as any);
    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: `google_unverified_${Date.now()}`,
        email: `unverified_${Date.now()}@gmail.com`,
        email_verified: false,
        name: 'Unverified User',
      }),
    } as any);

    const cbRes = await request(app)
      .get(`/api/auth/google/callback?code=auth_code_1&state=${encodeURIComponent(state)}`)
      .set('Cookie', stateCookie);

    expect(cbRes.status).toBe(302);
    expect(cbRes.headers.location).toContain('oauth_error=unverified_email');
    const cookies = (cbRes.headers['set-cookie'] || []) as string[];
    expect(cookies.some((c) => c.startsWith('tripzobox_token='))).toBe(false);
  });

  it('registers a new Google user, prevents duplicates on re-login, enforces protected routes, and logs out', async () => {
    const email = `google_new_${Date.now()}@gmail.com`;
    const googleSub = `sub_${Date.now()}`;
    createdEmails.push(email);

    const mockGoogleSuccess = () => {
      vi.spyOn(OAuth2Client.prototype, 'getToken').mockResolvedValue({
        tokens: { id_token: 'mock-id-token', access_token: 'secret-access-token', refresh_token: 'secret-refresh' },
      } as any);
      vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: googleSub,
          email,
          email_verified: true,
          name: 'Google Traveler',
          picture: 'https://lh3.googleusercontent.com/a/avatar123',
        }),
      } as any);
    };

    // 1. First Google login (creates new user)
    mockGoogleSuccess();
    const firstAuth = await initiateGoogleAuth('/app/profile');
    const cbRes1 = await request(app)
      .get(`/api/auth/google/callback?code=code_1&state=${encodeURIComponent(firstAuth.state)}`)
      .set('Cookie', firstAuth.stateCookie);

    expect(cbRes1.status).toBe(302);
    expect(cbRes1.headers.location).toContain('http://localhost:5173/login?oauth=google');
    expect(cbRes1.headers.location).toContain('redirect=%2Fapp%2Fprofile');
    expect(cbRes1.headers.location).toContain('code=');
    expect(cbRes1.headers.location).not.toContain('secret-access-token');
    expect(cbRes1.headers.location).not.toContain('mock-id-token');

    // Extract temporary single-use code from redirect URL
    const redirectUrl1 = new URL(cbRes1.headers.location);
    const handoffCode1 = redirectUrl1.searchParams.get('code');
    expect(handoffCode1).toBeTruthy();
    expect(handoffCode1!.length).toBeGreaterThan(20);

    // Exchange handoff code via POST /api/v1/auth/google/exchange
    const exchangeRes = await request(app)
      .post('/api/v1/auth/google/exchange')
      .send({ code: handoffCode1 });
    expect(exchangeRes.status).toBe(200);
    expect(exchangeRes.body.success).toBe(true);
    expect(exchangeRes.body.data.token).toBeTruthy();
    expect(exchangeRes.body.data.user.email).toBe(email);
    expect(exchangeRes.body.data.user.name).toBe('Google Traveler');
    expect(exchangeRes.body.data.redirect).toBe('/app/profile');

    const exchangedToken = exchangeRes.body.data.token;

    // Verify Bearer token works on protected endpoint (simulating page refresh / frontend API calls)
    const bearerMeRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${exchangedToken}`);
    expect(bearerMeRes.status).toBe(200);
    expect(bearerMeRes.body.data.user.email).toBe(email);
    expect(bearerMeRes.body.data.user.name).toBe('Google Traveler');
    expect(bearerMeRes.body.data.user.isGoogleConnected).toBe(true);
    expect(bearerMeRes.body.data.user.emailVerified).toBe(true);
    expect(bearerMeRes.body.data.user.password).toBeUndefined();

    // Verify code cannot be reused (atomic consumption check)
    const reusedExchange = await request(app)
      .post('/api/v1/auth/google/exchange')
      .send({ code: handoffCode1 });
    expect(reusedExchange.status).toBe(400);
    expect(reusedExchange.body.success).toBe(false);
    expect(reusedExchange.body.message).toContain('already been consumed');

    // Also verify endpoint mounted on /api/auth/google/exchange
    const rawFakeCode = crypto.randomBytes(32).toString('base64url');
    const fakeHash = crypto.createHash('sha256').update(rawFakeCode).digest('hex');
    await OAuthHandoffCode.create({
      codeHash: fakeHash,
      userId: exchangeRes.body.data.user.id,
      redirectPath: '/app/dashboard',
      expiresAt: new Date(Date.now() + 60000),
      consumed: false,
    });
    const altMountRes = await request(app)
      .post('/api/auth/google/exchange')
      .send({ code: rawFakeCode });
    expect(altMountRes.status).toBe(200);
    expect(altMountRes.body.data.token).toBeTruthy();

    const cookies1 = (cbRes1.headers['set-cookie'] || []) as string[];
    const authCookie1 = cookies1.find((c) => c.startsWith('tripzobox_token='));
    expect(authCookie1).toBeDefined();
    expect(authCookie1).toContain('HttpOnly');

    // Protected route also works with HttpOnly cookie
    const meRes = await request(app).get('/api/v1/auth/me').set('Cookie', authCookie1!);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(email);
    expect(meRes.body.data.user.name).toBe('Google Traveler');
    expect(meRes.body.data.user.isGoogleConnected).toBe(true);
    expect(meRes.body.data.user.emailVerified).toBe(true);
    expect(meRes.body.data.user.password).toBeUndefined();

    // Unauthenticated protected route remains protected
    const unauthMe = await request(app).get('/api/v1/auth/me');
    expect(unauthMe.status).toBe(401);

    // Google-only user cannot bypass login with arbitrary password
    const pwdLoginRes = await request(app).post('/api/v1/auth/login').send({
      emailOrPhone: email,
      password: 'AnyRandomPassword123!',
    });
    expect(pwdLoginRes.status).toBe(401);

    // 2. Second Google login (prevents duplicate records)
    vi.restoreAllMocks();
    mockGoogleSuccess();
    const secondAuth = await initiateGoogleAuth();
    const cbRes2 = await request(app)
      .get(`/api/auth/google/callback?code=code_2&state=${encodeURIComponent(secondAuth.state)}`)
      .set('Cookie', secondAuth.stateCookie);
    expect(cbRes2.status).toBe(302);
    expect(cbRes2.headers.location).toContain('oauth=google');

    const userCount = await User.countDocuments({ email });
    expect(userCount).toBe(1);

    // 3. Logout clears auth cookie
    const logoutRes = await request(app).post('/api/v1/auth/logout').set('Cookie', authCookie1!);
    expect(logoutRes.status).toBe(200);
    const logoutCookies = (logoutRes.headers['set-cookie'] || []) as string[];
    expect(logoutCookies.some((c) => c.startsWith('tripzobox_token=;'))).toBe(true);
  });

  it('links existing user safely without overwriting profile fields and blocks suspended users', async () => {
    const email = `existing_link_${Date.now()}@gmail.com`;
    const googleSub = `sub_link_${Date.now()}`;
    createdEmails.push(email);

    // Register standard user with custom name and avatar via profile update
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      name: 'Existing Custom Name',
      emailOrPhone: email,
      password: 'StrongPassword123!',
    });
    expect(signupRes.status).toBe(201);
    const existingUserId = signupRes.body.data.user.id;
    const existingToken = signupRes.body.data.token;

    const profileRes = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${existingToken}`)
      .send({ avatarUrl: 'https://example.com/custom-avatar.png' });
    expect(profileRes.status).toBe(200);

    // Sign in with Google for the same email
    vi.spyOn(OAuth2Client.prototype, 'getToken').mockResolvedValue({
      tokens: { id_token: 'mock-id-token' },
    } as any);
    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: googleSub,
        email,
        email_verified: true,
        name: 'Different Google Display Name',
        picture: 'https://lh3.googleusercontent.com/other.png',
      }),
    } as any);

    const { state, stateCookie } = await initiateGoogleAuth();
    const cbRes = await request(app)
      .get(`/api/auth/google/callback?code=code_link&state=${encodeURIComponent(state)}`)
      .set('Cookie', stateCookie);
    expect(cbRes.status).toBe(302);
    expect(cbRes.headers.location).toContain('oauth=google');

    const linkedUser = await User.findOne({ email });
    expect(linkedUser).not.toBeNull();
    expect(linkedUser!.id).toBe(existingUserId);
    expect(linkedUser!.googleId).toBe(googleSub);
    expect(linkedUser!.isGoogleConnected).toBe(true);
    expect(linkedUser!.emailVerified).toBe(true);
    // Existing profile values preserved
    expect(linkedUser!.name).toBe('Existing Custom Name');
    expect(linkedUser!.avatarUrl).toBe('https://example.com/custom-avatar.png');
    expect(await User.countDocuments({ email })).toBe(1);

    // Suspended user cannot log in via Google
    linkedUser!.isSuspended = true;
    linkedUser!.suspensionReason = 'Policy violation';
    await linkedUser!.save();

    const suspendedAuth = await initiateGoogleAuth();
    const suspendedCb = await request(app)
      .get(`/api/auth/google/callback?code=code_susp&state=${encodeURIComponent(suspendedAuth.state)}`)
      .set('Cookie', suspendedAuth.stateCookie);

    expect(suspendedCb.status).toBe(302);
    expect(suspendedCb.headers.location).toContain('oauth_error=suspended');
    const suspendedCookies = (suspendedCb.headers['set-cookie'] || []) as string[];
    expect(suspendedCookies.some((c) => c.startsWith('tripzobox_token='))).toBe(false);
  });

  it('rejects expired, invalid, and missing OAuth handoff codes securely', async () => {
    // 1. Missing code
    const missingRes = await request(app)
      .post('/api/v1/auth/google/exchange')
      .send({});
    expect(missingRes.status).toBe(400);
    expect(missingRes.body.success).toBe(false);
    expect(missingRes.body.message).toContain('Authorization code is required');

    // 2. Invalid / non-existent code
    const invalidRes = await request(app)
      .post('/api/v1/auth/google/exchange')
      .send({ code: 'nonexistent_code_12345678901234567890' });
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.success).toBe(false);
    expect(invalidRes.body.message).toContain('Invalid or unrecognized authorization code');

    // 3. Expired code
    const expiredRawCode = crypto.randomBytes(32).toString('base64url');
    const expiredHash = crypto.createHash('sha256').update(expiredRawCode).digest('hex');
    await OAuthHandoffCode.create({
      codeHash: expiredHash,
      userId: 'test_user_expired_id',
      redirectPath: '/app/dashboard',
      expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      consumed: false,
    });

    const expiredRes = await request(app)
      .post('/api/v1/auth/google/exchange')
      .send({ code: expiredRawCode });
    expect(expiredRes.status).toBe(400);
    expect(expiredRes.body.success).toBe(false);
    expect(expiredRes.body.message).toContain('expired');
  });

  it('ensures standard email and password authentication remains completely functional', async () => {
    const email = `email_login_verify_${Date.now()}@example.com`;
    const password = 'Password@TripzoBox2026!';
    createdEmails.push(email);

    // Signup
    const signupRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Standard User',
        emailOrPhone: email,
        password,
      });
    expect(signupRes.status).toBe(201);
    expect(signupRes.body.success).toBe(true);
    expect(signupRes.body.data.token).toBeTruthy();

    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        emailOrPhone: email,
        password,
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeTruthy();
    expect(loginRes.body.data.user.email).toBe(email);

    // Access protected route with Bearer token
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(email);
  });
});
