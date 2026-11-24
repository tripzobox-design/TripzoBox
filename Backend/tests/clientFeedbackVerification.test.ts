import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { VaultDocument } from '../src/models/VaultDocument.js';
import { ConsumedResetToken } from '../src/models/ConsumedResetToken.js';

const app = createApp();

describe('TripzoBox - Client Feedback Fixes Verification', () => {
  beforeAll(async () => {
    await connectDB();
  }, 30000);

  afterAll(async () => {
    try {
      await User.deleteMany({});
      await VaultDocument.deleteMany({});
      await ConsumedResetToken.deleteMany({});
      await disconnectDB();
    } catch {}
  }, 30000);

  beforeEach(async () => {
    await User.deleteMany({});
    await VaultDocument.deleteMany({});
    await ConsumedResetToken.deleteMany({});
  });

  // =========================================================================
  // REQUIREMENT 1: SIGNUP SECURITY QUESTION & RECOVERY CODES
  // =========================================================================
  describe('1. Signup with Security Question and Recovery Codes', () => {
    it('successfully registers user with security question, hashed answer, and generated recovery codes', async () => {
      const email = `testuser_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Feedback Tester',
          emailOrPhone: email,
          password: 'Password123!',
          securityQuestion: "What is your mother's name?",
          securityAnswer: 'SecretMotherName',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(email);

      // Verify plaintext recovery codes returned to user in response
      expect(res.body.data.recoveryCodes).toBeDefined();
      expect(Array.isArray(res.body.data.recoveryCodes)).toBe(true);
      expect(res.body.data.recoveryCodes.length).toBe(6);
      expect(res.body.data.recoveryCodes[0]).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

      // Verify MongoDB persistence and secure hashing
      const savedUser = await User.findOne({ email }).select('+securityAnswer +recoveryCodes +password');
      expect(savedUser).not.toBeNull();
      expect(savedUser!.securityQuestion).toBe("What is your mother's name?");

      // Security answer MUST be bcrypt hashed, NOT plaintext
      expect(savedUser!.securityAnswer).not.toBe('SecretMotherName');
      expect(savedUser!.securityAnswer).not.toBe('secretmothername');
      expect(savedUser!.securityAnswer!.startsWith('$2')).toBe(true);
      const answerMatches = await bcrypt.compare('secretmothername', savedUser!.securityAnswer!);
      expect(answerMatches).toBe(true);

      // Recovery codes MUST be bcrypt hashed in the database
      expect(savedUser!.recoveryCodes).toBeDefined();
      expect(savedUser!.recoveryCodes!.length).toBe(6);
      const firstCodeRecord = savedUser!.recoveryCodes![0] as any;
      expect(firstCodeRecord.codeHash).toBeDefined();
      expect(firstCodeRecord.codeHash.startsWith('$2')).toBe(true);
      expect(firstCodeRecord.used).toBe(false);

      // First plain recovery code matches the stored hash
      const codeMatches = await bcrypt.compare(res.body.data.recoveryCodes[0], firstCodeRecord.codeHash);
      expect(codeMatches).toBe(true);
    });

    it('setSecurityQuestion endpoint also hashes the answer with bcrypt', async () => {
      const email = `secq_${Date.now()}@example.com`;
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'SecQ User',
          emailOrPhone: email,
          password: 'Password123!',
        });

      const token = signupRes.body.data.token;

      const updateRes = await request(app)
        .post('/api/v1/auth/security-question')
        .set('Authorization', `Bearer ${token}`)
        .send({
          question: 'What was your first school?',
          answer: 'Greenwood High',
        });

      expect(updateRes.status).toBe(200);

      const userInDb = await User.findOne({ email }).select('+securityAnswer');
      expect(userInDb!.securityQuestion).toBe('What was your first school?');
      expect(userInDb!.securityAnswer).not.toBe('greenwood high');
      expect(userInDb!.securityAnswer!.startsWith('$2')).toBe(true);
      const match = await bcrypt.compare('greenwood high', userInDb!.securityAnswer!);
      expect(match).toBe(true);
    });
  });

  // =========================================================================
  // REQUIREMENT 1.B: FORGOT PASSWORD INTEGRATION WITH SECURITY QUESTION
  // =========================================================================
  describe('1.B Account Recovery via Security Question', () => {
    it('returns the security question without requiring the answer first', async () => {
      const email = `recover_q_${Date.now()}@example.com`;
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Recovery Question User',
          emailOrPhone: email,
          password: 'Password123!',
          securityQuestion: 'What city were you born in?',
          securityAnswer: 'Bangalore',
        });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({
          emailOrPhone: email,
          method: 'security-question',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.question).toBe('What city were you born in?');
      expect(res.body.data.resetToken).toBeUndefined(); // Must NOT leak reset token
    });

    it('rejects incorrect security answer and does not issue a reset token', async () => {
      const email = `recover_wrong_${Date.now()}@example.com`;
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Wrong Answer User',
          emailOrPhone: email,
          password: 'Password123!',
          securityQuestion: 'What city were you born in?',
          securityAnswer: 'Bangalore',
        });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({
          emailOrPhone: email,
          method: 'security-question',
          securityAnswer: 'Mumbai', // Wrong answer
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Incorrect security answer/i);
    });

    it('verifies correct security answer (case-insensitive) and allows password reset', async () => {
      const email = `recover_correct_${Date.now()}@example.com`;
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Correct Answer User',
          emailOrPhone: email,
          password: 'OldPassword123!',
          securityQuestion: 'What city were you born in?',
          securityAnswer: 'Bangalore',
        });

      const verifyRes = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({
          emailOrPhone: email,
          method: 'security-question',
          securityAnswer: '  bAnGaLoRe  ', // Case and whitespace insensitive
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data.verified).toBe(true);
      const resetToken = verifyRes.body.data.resetToken;
      expect(resetToken).toBeDefined();

      // Complete password reset using issued token
      const resetRes = await request(app)
        .post('/api/v1/auth/forgot-password/reset')
        .send({
          emailOrPhone: email,
          newPassword: 'BrandNewPassword99!',
          token: resetToken,
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Verify login with new password succeeds
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrPhone: email,
          password: 'BrandNewPassword99!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });
  });

  // =========================================================================
  // REQUIREMENT 1.C: FORGOT PASSWORD INTEGRATION WITH RECOVERY CODE (SINGLE-USE)
  // =========================================================================
  describe('1.C Account Recovery via Recovery Code (Single-Use Enforcement)', () => {
    it('verifies recovery code, issues reset token, and prevents code reuse', async () => {
      const email = `recover_code_${Date.now()}@example.com`;
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Code Recovery User',
          emailOrPhone: email,
          password: 'OldPassword123!',
        });

      const recoveryCodes = signupRes.body.data.recoveryCodes;
      expect(recoveryCodes).toBeDefined();
      const codeToUse = recoveryCodes[0];

      // Use recovery code for password recovery
      const recoverRes = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({
          emailOrPhone: email,
          method: 'recovery-code',
          recoveryCode: codeToUse,
        });

      expect(recoverRes.status).toBe(200);
      expect(recoverRes.body.success).toBe(true);
      expect(recoverRes.body.data.verified).toBe(true);
      const resetToken = recoverRes.body.data.resetToken;
      expect(resetToken).toBeDefined();

      // ATTEMPT REUSE: The exact same recovery code MUST be rejected on second use
      const reuseRes = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({
          emailOrPhone: email,
          method: 'recovery-code',
          recoveryCode: codeToUse,
        });

      expect(reuseRes.status).toBe(400);
      expect(reuseRes.body.success).toBe(false);
      expect(reuseRes.body.message).toMatch(/Invalid or already used recovery code/i);

      // A DIFFERENT unused recovery code from the same user should still work
      const secondCodeToUse = recoveryCodes[1];
      const secondRecoverRes = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({
          emailOrPhone: email,
          method: 'recovery-code',
          recoveryCode: secondCodeToUse,
        });

      expect(secondRecoverRes.status).toBe(200);
      expect(secondRecoverRes.body.success).toBe(true);
    });
  });

  // =========================================================================
  // REQUIREMENT 2: LOCATION DEFAULT REMOVAL
  // =========================================================================
  describe('2. Location Defaults Verification', () => {
    it('new user account has empty/unset location, NOT hardcoded Kerala, India', async () => {
      const email = `location_test_${Date.now()}@example.com`;
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Location Test User',
          emailOrPhone: email,
          password: 'Password123!',
        });

      expect(signupRes.status).toBe(201);
      const userFromDb = await User.findOne({ email });
      expect(userFromDb).not.toBeNull();

      // City and country must NOT default to Kerala or India
      expect(userFromDb!.city).not.toBe('Kerala');
      expect(userFromDb!.country).not.toBe('India');
      expect(userFromDb!.city).toBe('');
    });

    it('allows users to freely update their city and country', async () => {
      const email = `location_update_${Date.now()}@example.com`;
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Location Updater',
          emailOrPhone: email,
          password: 'Password123!',
        });

      const token = signupRes.body.data.token;

      const updateRes = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          city: 'Tokyo',
          country: 'Japan',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.user.city).toBe('Tokyo');
      expect(updateRes.body.data.user.country).toBe('Japan');

      const userFromDb = await User.findOne({ email });
      expect(userFromDb!.city).toBe('Tokyo');
      expect(userFromDb!.country).toBe('Japan');
    });
  });

  // =========================================================================
  // REQUIREMENT 3: DUMMY CONTENT & MOCK FALLBACK REMOVAL
  // =========================================================================
  describe('3. Dummy Content and Mock Fallback Removal', () => {
    it('requestReset returns 404 for non-existent accounts and does not create mock users', async () => {
      const nonExistentEmail = `ghost_user_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({
          emailOrPhone: nonExistentEmail,
          method: 'email',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      // Verify no mock user was generated in the database
      const userCheck = await User.findOne({ email: nonExistentEmail });
      expect(userCheck).toBeNull();
    });
  });

  // =========================================================================
  // REQUIREMENT 5: TRAVEL VAULT DOCUMENT STORAGE & USER ISOLATION
  // =========================================================================
  describe('5. Travel Vault Document Storage & User Isolation', () => {
    it('stores documents securely and enforces strict user isolation', async () => {
      // User A
      const userARes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Vault User A',
          emailOrPhone: `vault_a_${Date.now()}@example.com`,
          password: 'Password123!',
        });
      const tokenA = userARes.body.data.token;

      // User B
      const userBRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Vault User B',
          emailOrPhone: `vault_b_${Date.now()}@example.com`,
          password: 'Password123!',
        });
      const tokenB = userBRes.body.data.token;

      // User A creates a passport document
      const docRes = await request(app)
        .post('/api/v1/vault/documents')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'Passport',
          name: 'My International Passport',
          referenceNumber: 'P12345678',
          validTill: '2032-12-31',
        });

      expect(docRes.status).toBe(201);
      const docId = docRes.body.data.id;
      expect(docId).toBeDefined();

      // User A can list their own documents
      const listARes = await request(app)
        .get('/api/v1/vault/documents')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(listARes.status).toBe(200);
      expect(listARes.body.data.length).toBe(1);
      expect(listARes.body.data[0].id).toBe(docId);

      // User B lists documents -> MUST BE EMPTY (Strict User Isolation)
      const listBRes = await request(app)
        .get('/api/v1/vault/documents')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(listBRes.status).toBe(200);
      expect(listBRes.body.data.length).toBe(0);

      // User B cannot delete User A's document
      const deleteAttemptByB = await request(app)
        .delete(`/api/v1/vault/documents/${docId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(deleteAttemptByB.status).toBe(404);

      // User A deletes their own document
      const deleteByA = await request(app)
        .delete(`/api/v1/vault/documents/${docId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(deleteByA.status).toBe(200);

      // Document is gone from User A's list
      const listAAfterDelete = await request(app)
        .get('/api/v1/vault/documents')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(listAAfterDelete.body.data.length).toBe(0);
    });
  });
});
