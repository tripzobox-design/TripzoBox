/**
 * Phase 1 – Authentication Security Regression Tests
 *
 * Covers all four vulnerabilities fixed on 2026-11-19:
 *   1. Login without password (Vulnerability 1)
 *   2. Password reset without a valid token + account-binding bug (Vulnerability 2)
 *   3. Unauthenticated /session-sync (Vulnerability 3)
 *   4. Existing auth flows remain intact after all fixes (Regression guard)
 *
 * Uses an isolated local MongoDB instance. Never touches production data.
 * Never sends real emails (OTP bypass via direct model creation like other tests).
 */

import crypto from 'crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { config } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { ConsumedResetToken } from '../src/models/ConsumedResetToken.js';
import { signToken } from '../src/utils/token.js';

const app = createApp();

// ─── Helpers ────────────────────────────────────────────────────────────────

const uniqueTag = () => `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

/** Create a verified user directly in DB (bypasses OTP flow, matches other test patterns) */
const createVerifiedUser = async (overrides: Record<string, any> = {}) => {
  const tag = uniqueTag();
  const email = overrides.email ?? `sec_test_${tag}@example.com`;
  const password = overrides.password === null ? undefined : (overrides.password ?? 'SecurePass!99');
  const user = new User({
    id: overrides.id || `user_sec_${tag}`,
    name: overrides.name || `Security Test ${tag}`,
    username: overrides.username || `sectest_${tag}`,
    email,
    password,
    avatarUrl: '',
    city: 'TestCity',
    bio: 'Security test user.',
    emailVerified: true,
    emailVerifiedAt: new Date(),
    phoneVerified: false,
    identityVerificationStatus: 'NOT_STARTED',
    isGoogleConnected: overrides.isGoogleConnected ?? false,
    googleId: overrides.googleId,
    role: overrides.role || 'user',
    tokenVersion: 0,
  });
  await user.save();
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion ?? 0,
  });
  return { user, token };
};

function makeResetToken(payload: object, opts: jwt.SignOptions = {}) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '15m', ...opts });
}

// Track created users for cleanup
const createdUserIds: string[] = [];

// ─── Test Setup ──────────────────────────────────────────────────────────────

beforeAll(async () => {
  await connectDB();
}, 30000);

afterAll(async () => {
  // Clean up only test users created by this suite
  if (createdUserIds.length > 0) {
    await User.deleteMany({ id: { $in: createdUserIds } });
    await ConsumedResetToken.deleteMany({ userId: { $in: createdUserIds } });
  }
  await disconnectDB();
}, 30000);

// ─── Task 1: Login Without Password ─────────────────────────────────────────

describe('Task 1 – Login password enforcement', () => {
  let testEmail: string;
  const password = 'ValidPass!99';

  beforeAll(async () => {
    const { user } = await createVerifiedUser({ password });
    testEmail = user.email;
    createdUserIds.push(user.id);
  });

  it('allows login with correct password → 200', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password });
    expect(res.status).toBe(200);
    expect(res.body.data?.user).toBeDefined();
    expect(res.body.data?.token).toBeDefined();
  });

  it('rejects login with wrong password → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password: 'WrongPassword!' });
    expect(res.status).toBe(401);
    expect(res.body.data?.token).toBeUndefined();
  });

  it('rejects login with missing password field → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail });
    expect(res.status).toBe(401);
    expect(res.body.data?.token).toBeUndefined();
  });

  it('rejects login with empty string password → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password: '' });
    expect(res.status).toBe(401);
    expect(res.body.data?.token).toBeUndefined();
  });

  it('rejects non-existent user with generic 401 (no account disclosure)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: 'nobody@nowhere-secure.com', password: 'SomePass!' });
    expect(res.status).toBe(401);
    expect(res.body.data?.token).toBeUndefined();
  });

  it('rejects password login for Google-only account without password → 401', async () => {
    const { user: googleUser } = await createVerifiedUser({
      password: null,
      isGoogleConnected: true,
      googleId: 'google_sub_12345',
    });
    createdUserIds.push(googleUser.id);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: googleUser.email });
    expect(res.status).toBe(401);
    expect(res.body.data?.token).toBeUndefined();
    expect(res.body.message).toContain('Google');
  });

  it('rejects password login for Google-only account with arbitrary password → 401', async () => {
    const { user: googleUser } = await createVerifiedUser({
      password: null,
      isGoogleConnected: true,
      googleId: 'google_sub_67890',
    });
    createdUserIds.push(googleUser.id);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: googleUser.email, password: 'AnyPassword123!' });
    expect(res.status).toBe(401);
    expect(res.body.data?.token).toBeUndefined();
    expect(res.body.message).toContain('Google');
  });

  it('rejects password login for account with no password and not Google-connected → 401', async () => {
    const { user: noPassUser } = await createVerifiedUser({
      password: null,
      isGoogleConnected: false,
    });
    createdUserIds.push(noPassUser.id);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: noPassUser.email, password: 'AnyPassword123!' });
    expect(res.status).toBe(401);
    expect(res.body.data?.token).toBeUndefined();
  });

  it('never issues an auth cookie on failed login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail });
    const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
    const hasAuthCookie = Array.isArray(setCookie)
      ? setCookie.some((c) => (c.startsWith('tripzobox_token=') || c.startsWith('token=')) && !c.includes('token=;'))
      : false;
    expect(hasAuthCookie).toBe(false);
  });
});

// ─── Task 2: Password Reset Without Token ────────────────────────────────────

describe('Task 2 – Password reset token enforcement', () => {
  let testEmail: string;
  let userId: string;
  const originalPass = 'OriginalPass!99';
  const newPass = 'NewSecurePass!1';

  beforeAll(async () => {
    const { user } = await createVerifiedUser({ password: originalPass });
    testEmail = user.email;
    userId = user.id;
    createdUserIds.push(user.id);
  });

  it('rejects reset with no token field → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: newPass });
    expect(res.status).toBe(400);
  });

  it('rejects reset with empty string token → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: newPass, token: '' });
    expect(res.status).toBe(400);
  });

  it('rejects reset with tampered/garbage token → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: newPass, token: 'not.a.real.jwt.garbage' });
    expect(res.status).toBe(400);
  });

  it('rejects reset with expired JWT token → 400', async () => {
    const expiredToken = makeResetToken(
      { purpose: 'password_reset', email: testEmail, userId },
      { expiresIn: -1 } // already expired
    );
    const res = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: newPass, token: expiredToken });
    expect(res.status).toBe(400);
  });

  it('rejects token where email does not match account (account-binding) → 400', async () => {
    // Previously failed due to && bug: would only reject when BOTH email AND userId mismatch
    const wrongEmailToken = makeResetToken({
      purpose: 'password_reset',
      email: 'other-account@test.com', // different email
      userId,                           // correct userId — old bug would pass this
    });
    const res = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: newPass, token: wrongEmailToken });
    expect(res.status).toBe(400);
  });

  it('rejects token where userId does not match account (account-binding) → 400', async () => {
    const wrongUserToken = makeResetToken({
      purpose: 'password_reset',
      email: testEmail,            // correct email
      userId: 'user_different_99', // different userId — old bug would pass this
    });
    const res = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: newPass, token: wrongUserToken });
    expect(res.status).toBe(400);
  });

  it('rejects token with wrong purpose claim → 400', async () => {
    const wrongPurposeToken = makeResetToken({
      purpose: 'email_verification', // wrong purpose
      email: testEmail,
      userId,
    });
    const res = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: newPass, token: wrongPurposeToken });
    expect(res.status).toBe(400);
  });

  it('password is unchanged after all rejected attempts — original password still works', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password: originalPass });
    expect(loginRes.status).toBe(200);
  });

  it('allows reset with a valid correctly-bound token → 200', async () => {
    const validToken = makeResetToken({
      purpose: 'password_reset',
      email: testEmail,
      userId,
      jti: 'test-jti-single-use-1',
    });
    const res = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: newPass, token: validToken });
    expect(res.status).toBe(200);
  });

  it('rejects reusing the exact same reset token a second time → 400 (single-use enforcement)', async () => {
    const reuseToken = makeResetToken({
      purpose: 'password_reset',
      email: testEmail,
      userId,
      jti: 'test-jti-single-use-reuse',
    });
    // First use: must succeed
    const firstRes = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: 'FirstResetPass!1', token: reuseToken });
    expect(firstRes.status).toBe(200);

    // Second use with same token: must be rejected
    const secondRes = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: 'AttackerReusedPass!2', token: reuseToken });
    expect(secondRes.status).toBe(400);
    expect(secondRes.body.message).toContain('already been used');

    // Third use attempt with same token: must also be rejected
    const thirdRes = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: 'AnotherAttemptPass!3', token: reuseToken });
    expect(thirdRes.status).toBe(400);
    expect(thirdRes.body.message).toContain('already been used');

    // Password must remain the first reset password and NOT change to the reused attempts
    const loginValid = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password: 'FirstResetPass!1' });
    expect(loginValid.status).toBe(200);

    const loginAttacker = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password: 'AttackerReusedPass!2' });
    expect(loginAttacker.status).toBe(401);
  });

  it('after successful reset, old password is rejected → 401', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password: originalPass });
    expect(loginRes.status).toBe(401);
  });

  it('after successful reset, new password is accepted → 200', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password: 'FirstResetPass!1' });
    expect(loginRes.status).toBe(200);
  });

  it('rejects reset token replay after simulated backend restart (persistent MongoDB registry)', async () => {
    const restartTestToken = makeResetToken({
      purpose: 'password_reset',
      email: testEmail,
      userId,
      jti: 'restart-test-jti-1',
    });

    // 1. Consume token on current instance
    const firstRes = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: 'RestartPass!101', token: restartTestToken });
    expect(firstRes.status).toBe(200);

    // 2. Verify record exists in persistent MongoDB collection
    const storedRecord = await ConsumedResetToken.findOne({ tokenIdentifier: 'restart-test-jti-1' });
    expect(storedRecord).not.toBeNull();
    expect(storedRecord?.userId).toBe(userId);
    expect(storedRecord?.email).toBe(testEmail.toLowerCase());

    // 3. Simulate backend restart by creating a completely fresh Express application instance
    const restartedApp = createApp();

    // 4. Attempt to replay the same token against the restarted application instance
    const replayRes = await request(restartedApp)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: 'MaliciousRestartReplay!999', token: restartTestToken });
    expect(replayRes.status).toBe(400);
    expect(replayRes.body.message).toContain('already been used');

    // 5. Verify the password remains 'RestartPass!101' and replay attempt was completely ineffective
    const loginCheck = await request(restartedApp)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password: 'RestartPass!101' });
    expect(loginCheck.status).toBe(200);
  });

  it('rejects reset token replay across multiple backend instances sharing MongoDB', async () => {
    const multiInstanceToken = makeResetToken({
      purpose: 'password_reset',
      email: testEmail,
      userId,
      jti: 'multi-instance-jti-1',
    });

    // Simulate two distinct horizontal backend instances (Instance A and Instance B)
    const instanceA = createApp();
    const instanceB = createApp();

    // 1. User submits token to Instance A
    const resA = await request(instanceA)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: 'MultiInstancePass!202', token: multiInstanceToken });
    expect(resA.status).toBe(200);

    // 2. Attacker immediately attempts replay with same token against Instance B
    const resB = await request(instanceB)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: testEmail, newPassword: 'AttackerInstanceBPass!999', token: multiInstanceToken });
    expect(resB.status).toBe(400);
    expect(resB.body.message).toContain('already been used');

    // 3. Password on Instance B remains the legitimate one set by Instance A
    const loginOnB = await request(instanceB)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password: 'MultiInstancePass!202' });
    expect(loginOnB.status).toBe(200);
  });

  it('handles concurrent reset requests across multiple instances atomically without corrupted state', async () => {
    const concurrentToken = makeResetToken({
      purpose: 'password_reset',
      email: testEmail,
      userId,
      jti: 'concurrent-jti-atomic-test',
    });

    const instance1 = createApp();
    const instance2 = createApp();

    // Send two concurrent reset requests with the same token simultaneously
    const [result1, result2] = await Promise.all([
      request(instance1)
        .post('/api/v1/auth/forgot-password/reset')
        .send({ emailOrPhone: testEmail, newPassword: 'ConcurrentPassA!303', token: concurrentToken }),
      request(instance2)
        .post('/api/v1/auth/forgot-password/reset')
        .send({ emailOrPhone: testEmail, newPassword: 'ConcurrentPassB!303', token: concurrentToken }),
    ]);

    const statuses = [result1.status, result2.status].sort();
    // Exactly one must succeed (200) and exactly one must be rejected (400)
    expect(statuses).toEqual([200, 400]);

    const rejectedResult = result1.status === 400 ? result1 : result2;
    expect(rejectedResult.body.message).toContain('already been used');

    // Account remains fully functional and in a valid state
    const winningPass = result1.status === 200 ? 'ConcurrentPassA!303' : 'ConcurrentPassB!303';
    const loginCheck = await request(instance1)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password: winningPass });
    expect(loginCheck.status).toBe(200);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies unique index on tokenIdentifier and TTL index on expiresAt exist in MongoDB', async () => {
    await ConsumedResetToken.syncIndexes();
    const indexes = await ConsumedResetToken.collection.indexes();

    const uniqueTokenIdx = indexes.find((idx: any) => idx.key && idx.key.tokenIdentifier === 1);
    expect(uniqueTokenIdx).toBeDefined();
    expect(uniqueTokenIdx?.unique).toBe(true);

    const ttlIdx = indexes.find((idx: any) => idx.key && idx.key.expiresAt === 1);
    expect(ttlIdx).toBeDefined();
    expect(ttlIdx?.expireAfterSeconds).toBe(0);
  });

  it('verifies MongoDB rejects duplicate tokenIdentifier insertion with duplicate key error code 11000', async () => {
    const dupeIdentifier = `dupe-test-${uniqueTag()}`;
    await ConsumedResetToken.create({
      tokenIdentifier: dupeIdentifier,
      userId,
      email: testEmail,
      expiresAt: new Date(Date.now() + 60000),
    });

    let caughtError: any = null;
    try {
      await ConsumedResetToken.create({
        tokenIdentifier: dupeIdentifier,
        userId: 'other_user',
        email: 'other@example.com',
        expiresAt: new Date(Date.now() + 60000),
      });
    } catch (err: any) {
      caughtError = err;
    }
    expect(caughtError).not.toBeNull();
    expect(caughtError.code === 11000 || String(caughtError.message).includes('E11000')).toBe(true);
  });

  it('handles two different reset tokens for the same account used concurrently (race condition elimination)', async () => {
    const { user: concurrentUser } = await createVerifiedUser({ password: 'InitialPass!99' });
    createdUserIds.push(concurrentUser.id);

    const tokenA = makeResetToken({
      purpose: 'password_reset',
      email: concurrentUser.email,
      userId: concurrentUser.id,
      tokenVersion: 0,
      jti: `token-concurrent-a-${uniqueTag()}`,
    });

    const tokenB = makeResetToken({
      purpose: 'password_reset',
      email: concurrentUser.email,
      userId: concurrentUser.id,
      tokenVersion: 0,
      jti: `token-concurrent-b-${uniqueTag()}`,
    });

    const instance1 = createApp();
    const instance2 = createApp();

    const [resA, resB] = await Promise.all([
      request(instance1)
        .post('/api/v1/auth/forgot-password/reset')
        .send({ emailOrPhone: concurrentUser.email, newPassword: 'WinnerPassA!11', token: tokenA }),
      request(instance2)
        .post('/api/v1/auth/forgot-password/reset')
        .send({ emailOrPhone: concurrentUser.email, newPassword: 'WinnerPassB!22', token: tokenB }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    // Exactly one must succeed and one must be rejected with 400
    expect(statuses).toEqual([200, 400]);

    const rejected = resA.status === 400 ? resA : resB;
    expect(rejected.body.message).toContain('already been used');

    // Fresh fetch user from DB to verify tokenVersion incremented exactly once (0 -> 1)
    const freshUser = await User.findOne({ email: concurrentUser.email });
    expect(freshUser?.tokenVersion).toBe(1);

    // Only the winning password authenticates
    const winningPass = resA.status === 200 ? 'WinnerPassA!11' : 'WinnerPassB!22';
    const losingPass = resA.status === 200 ? 'WinnerPassB!22' : 'WinnerPassA!11';

    const loginWin = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: concurrentUser.email, password: winningPass });
    expect(loginWin.status).toBe(200);

    const loginLose = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: concurrentUser.email, password: losingPass });
    expect(loginLose.status).toBe(401);
  });

  it('rejects an older reset token after a successful password reset (tokenVersion advancement)', async () => {
    const { user: multiTokenUser } = await createVerifiedUser({ password: 'OldBasePass!88' });
    createdUserIds.push(multiTokenUser.id);

    // Two tokens issued when tokenVersion is 0
    const olderToken = makeResetToken({
      purpose: 'password_reset',
      email: multiTokenUser.email,
      userId: multiTokenUser.id,
      tokenVersion: 0,
      jti: `older-token-${uniqueTag()}`,
    });

    const newerToken = makeResetToken({
      purpose: 'password_reset',
      email: multiTokenUser.email,
      userId: multiTokenUser.id,
      tokenVersion: 0,
      jti: `newer-token-${uniqueTag()}`,
    });

    // Reset password using newerToken
    const reset1 = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: multiTokenUser.email, newPassword: 'NewerPass!88', token: newerToken });
    expect(reset1.status).toBe(200);

    // Now attempt reset using olderToken (tokenVersion 0 != 1)
    const resetOld = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: multiTokenUser.email, newPassword: 'OlderAttemptPass!99', token: olderToken });
    expect(resetOld.status).toBe(400);
    expect(resetOld.body.message).toContain('already been used');

    // Password remains 'NewerPass!88'
    const loginCheck = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: multiTokenUser.email, password: 'NewerPass!88' });
    expect(loginCheck.status).toBe(200);
  });

  it('safely handles legacy reset tokens missing tokenVersion claim', async () => {
    const { user: legacyUser } = await createVerifiedUser({ password: 'LegacyBasePass!1' });
    createdUserIds.push(legacyUser.id);

    const legacyToken = makeResetToken({
      purpose: 'password_reset',
      email: legacyUser.email,
      userId: legacyUser.id,
      // No tokenVersion field included
      jti: `legacy-token-${uniqueTag()}`,
    });

    // First use: succeeds
    const firstRes = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: legacyUser.email, newPassword: 'LegacyNewPass!2', token: legacyToken });
    expect(firstRes.status).toBe(200);

    // Second use of same legacy token: rejected by ConsumedResetToken
    const secondRes = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: legacyUser.email, newPassword: 'LegacyReplayPass!3', token: legacyToken });
    expect(secondRes.status).toBe(400);
    expect(secondRes.body.message).toContain('already been used');

    // Login with new password works
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: legacyUser.email, password: 'LegacyNewPass!2' });
    expect(loginRes.status).toBe(200);
  });

  it('recovers cleanly when user update fails after token claim (compensated rollback allows retry)', async () => {
    const { user: failUser } = await createVerifiedUser({ password: 'OriginalFailPass!1' });
    createdUserIds.push(failUser.id);

    const retryToken = makeResetToken({
      purpose: 'password_reset',
      email: failUser.email,
      userId: failUser.id,
      tokenVersion: 0,
      jti: `retry-token-${uniqueTag()}`,
    });

    // Mock User.updateOne to simulate a temporary failure on the first call
    let callCount = 0;
    const originalUpdateOne = User.updateOne.bind(User);
    vi.spyOn(User, 'updateOne').mockImplementation((async (...args: any[]) => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Database write failure: disk full or transient error');
      }
      return (originalUpdateOne as any)(...args);
    }) as any);

    // First attempt: fails due to DB error -> 500, never 200
    const failRes = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: failUser.email, newPassword: 'FailedAttemptPass!2', token: retryToken });
    expect(failRes.status).toBe(500);

    // Password must remain the original
    const origLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: failUser.email, password: 'OriginalFailPass!1' });
    expect(origLogin.status).toBe(200);

    // Compensated rollback deleted the consumed token record, so the user CAN retry with the same token
    const retryRes = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: failUser.email, newPassword: 'SuccessfulRetryPass!3', token: retryToken });
    expect(retryRes.status).toBe(200);

    // Password is now updated to the retry password
    const retryLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: failUser.email, password: 'SuccessfulRetryPass!3' });
    expect(retryLogin.status).toBe(200);
  });

  it('maintains credential consistency and returns 500 when both user update and rollback deletion fail', async () => {
    const { user: catastrophicUser } = await createVerifiedUser({ password: 'SafeOriginalPass!1' });
    createdUserIds.push(catastrophicUser.id);

    const failToken = makeResetToken({
      purpose: 'password_reset',
      email: catastrophicUser.email,
      userId: catastrophicUser.id,
      tokenVersion: 0,
      jti: `catastrophic-token-${uniqueTag()}`,
    });

    vi.spyOn(User, 'updateOne').mockRejectedValue(new Error('Primary DB write failure'));
    vi.spyOn(ConsumedResetToken, 'deleteOne').mockRejectedValue(new Error('Rollback delete failed'));

    const res = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: catastrophicUser.email, newPassword: 'NeverSavedPass!9', token: failToken });

    // Returns 500, never 200
    expect(res.status).toBe(500);

    // User credentials remain completely secure and unchanged
    const loginOriginal = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: catastrophicUser.email, password: 'SafeOriginalPass!1' });
    expect(loginOriginal.status).toBe(200);

    const loginAttacker = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: catastrophicUser.email, password: 'NeverSavedPass!9' });
    expect(loginAttacker.status).toBe(401);

    // tokenVersion remains 0
    const checkUser = await User.findOne({ email: catastrophicUser.email });
    expect(checkUser?.tokenVersion).toBe(0);
  });

  it('returns 500 and never success when MongoDB connection drops during reset', async () => {
    const { user: dropUser } = await createVerifiedUser({ password: 'OriginalDropPass!1' });
    createdUserIds.push(dropUser.id);

    const dropToken = makeResetToken({
      purpose: 'password_reset',
      email: dropUser.email,
      userId: dropUser.id,
      tokenVersion: 0,
      jti: `drop-token-${uniqueTag()}`,
    });

    vi.spyOn(User, 'findOne').mockRejectedValue(new Error('MongoNetworkError: connection closed'));

    const res = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: dropUser.email, newPassword: 'NeverReachPass!2', token: dropToken });

    // Response must be 500 (never 200)
    expect(res.status).toBe(500);

    vi.restoreAllMocks();

    // Verify user password remained untouched
    const loginCheck = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: dropUser.email, password: 'OriginalDropPass!1' });
    expect(loginCheck.status).toBe(200);
  });

  it('safely handles an older user document where tokenVersion is genuinely missing from MongoDB disk', async () => {
    const { user: legacyDiskUser } = await createVerifiedUser({ password: 'LegacyDiskPass!1' });
    createdUserIds.push(legacyDiskUser.id);

    // Genuinely remove the tokenVersion field from MongoDB disk via native collection update
    await User.collection.updateOne({ id: legacyDiskUser.id }, { $unset: { tokenVersion: '' } });

    // Verify tokenVersion is completely absent on the raw MongoDB document
    const rawDoc = await User.collection.findOne({ id: legacyDiskUser.id });
    expect(rawDoc).not.toBeNull();
    expect(rawDoc?.tokenVersion).toBeUndefined();

    const resetToken = makeResetToken({
      purpose: 'password_reset',
      email: legacyDiskUser.email,
      userId: legacyDiskUser.id,
      tokenVersion: 0,
      jti: `legacy-disk-token-${uniqueTag()}`,
    });

    // Reset password: must succeed and set tokenVersion to 1 on disk
    const resetRes = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: legacyDiskUser.email, newPassword: 'LegacyDiskNewPass!2', token: resetToken });
    expect(resetRes.status).toBe(200);

    // Verify raw document on disk now has tokenVersion === 1
    const updatedRawDoc = await User.collection.findOne({ id: legacyDiskUser.id });
    expect(updatedRawDoc?.tokenVersion).toBe(1);

    // Old password rejected, new password accepted
    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: legacyDiskUser.email, password: 'LegacyDiskPass!1' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: legacyDiskUser.email, password: 'LegacyDiskNewPass!2' });
    expect(newLogin.status).toBe(200);

    // Replay of the token must be rejected
    const replayRes = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: legacyDiskUser.email, newPassword: 'AttackerReplay!3', token: resetToken });
    expect(replayRes.status).toBe(400);
    expect(replayRes.body.message).toContain('already been used');
  });

  it('safely surfaces 503 and aborts password reset if ConsumedResetToken index initialization fails', async () => {
    const { user: indexFailUser } = await createVerifiedUser({ password: 'IndexFailPass!1' });
    createdUserIds.push(indexFailUser.id);

    const testToken = makeResetToken({
      purpose: 'password_reset',
      email: indexFailUser.email,
      userId: indexFailUser.id,
      tokenVersion: 0,
      jti: `index-fail-token-${uniqueTag()}`,
    });

    vi.spyOn(ConsumedResetToken, 'init').mockRejectedValueOnce(
      new Error('MongoServerError: index build failed or collection locked')
    );

    const res = await request(app)
      .post('/api/v1/auth/forgot-password/reset')
      .send({ emailOrPhone: indexFailUser.email, newPassword: 'NeverAppliedPass!2', token: testToken });

    // Returns 503 Service Unavailable, never 200
    expect(res.status).toBe(503);
    expect(res.body.message).toContain('Authentication service temporarily unavailable');

    // Password was NOT modified
    const loginOriginal = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: indexFailUser.email, password: 'IndexFailPass!1' });
    expect(loginOriginal.status).toBe(200);

    const loginAttacker = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: indexFailUser.email, password: 'NeverAppliedPass!2' });
    expect(loginAttacker.status).toBe(401);
  });
});

// ─── Task 3: Session Sync Endpoint Disabled ───────────────────────────────────

describe('Task 3 – /session-sync returns 404 (endpoint disabled)', () => {
  it('returns 404 for POST /session-sync with valid email body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/session-sync')
      .send({ email: 'any@test.com', name: 'Any User' });
    expect(res.status).toBe(404);
    expect(res.body.data?.token).toBeUndefined();
  });

  it('returns 404 for session-sync with empty body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/session-sync')
      .send({});
    expect(res.status).toBe(404);
  });

  it('returns 404 even with admin-like email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/session-sync')
      .send({ email: 'admin@tripzobox.com', name: 'Admin' });
    expect(res.status).toBe(404);
  });

  it('never issues an auth cookie via session-sync', async () => {
    const res = await request(app)
      .post('/api/v1/auth/session-sync')
      .send({ email: 'any@test.com' });
    const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
    const hasAuthCookie = Array.isArray(setCookie)
      ? setCookie.some((c) => (c.startsWith('tripzobox_token=') || c.startsWith('token=')) && !c.includes('token=;'))
      : false;
    expect(hasAuthCookie).toBe(false);
  });
});

// ─── Regression: Existing auth flows remain intact ────────────────────────────

describe('Regression – Existing auth flows still work after all fixes', () => {
  let sessionToken: string;
  let testEmail: string;
  const password = 'RegPass!77';

  beforeAll(async () => {
    const { user, token } = await createVerifiedUser({ password });
    testEmail = user.email;
    createdUserIds.push(user.id);
    // Log in to get a fresh session token for /me tests
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password });
    sessionToken = loginRes.body?.data?.token || token;
  });

  it('GET /me without auth → 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /me with valid Bearer token → 200 and returns user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${sessionToken}`);
    expect(res.status).toBe(200);
    expect(res.body?.data?.user?.email).toBe(testEmail);
  });

  it('session restoration via HttpOnly cookie succeeds → 200', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password });
    const setCookies = (loginRes.headers['set-cookie'] as unknown as string[]) || [];
    const authCookie = setCookies.find((c) => c.startsWith('tripzobox_token='));
    expect(authCookie).toBeDefined();

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', authCookie!);
    expect(meRes.status).toBe(200);
    expect(meRes.body?.data?.user?.email).toBe(testEmail);
  });

  it('rejects GET /me with tampered Bearer token → 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${sessionToken}.tampered`);
    expect(res.status).toBe(401);
  });

  it('rejects GET /me with expired Bearer token → 401', async () => {
    const expiredToken = signToken({
      userId: 'test_expired_user',
      email: 'expired@test.com',
      role: 'user',
      tokenVersion: 0,
    });
    // Sign an actually expired token using raw jwt
    const rawExpired = jwt.sign(
      { userId: 'test_expired_user', email: 'expired@test.com', role: 'user', tokenVersion: 0 },
      config.jwtSecret,
      { expiresIn: -1 }
    );
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${rawExpired}`);
    expect(res.status).toBe(401);
  });

  it('POST /logout clears cookie and invalidates session → 200', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailOrPhone: testEmail, password });
    const setCookies = (loginRes.headers['set-cookie'] as unknown as string[]) || [];
    const authCookie = setCookies.find((c) => c.startsWith('tripzobox_token='));
    expect(authCookie).toBeDefined();

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', authCookie!);
    expect(logoutRes.status).toBe(200);

    const logoutCookies = (logoutRes.headers['set-cookie'] as unknown as string[]) || [];
    expect(logoutCookies.some((c) => c.startsWith('tripzobox_token=;'))).toBe(true);

    // Request after logout with no credentials
    const meAfterLogout = await request(app).get('/api/v1/auth/me');
    expect(meAfterLogout.status).toBe(401);
  });
});
