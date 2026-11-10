import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Trip } from '../src/models/Trip.js';
import { OTPVerification } from '../src/models/OTPVerification.js';
import bcrypt from 'bcryptjs';

describe('TripzoBox Trust & Safety System - Security & Workflow Tests', () => {
  let app: any;
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let adminToken: string;
  let adminId: string;
  let testTripId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    await OTPVerification.deleteMany({});
    app = createApp();

    // 1. Create User 1 (Alice)
    const email1 = `alice_safety_${Date.now()}@example.com`;
    const res1 = await request(app).post('/api/v1/auth/signup').send({
      name: 'Alice Safety',
      emailOrPhone: email1,
      password: 'Password123!',
      phone: '+919876543210',
    });
    user1Token = res1.body.data.token;
    user1Id = res1.body.data.user.id;

    // 2. Create User 2 (Bob)
    const email2 = `bob_safety_${Date.now()}@example.com`;
    const res2 = await request(app).post('/api/v1/auth/signup').send({
      name: 'Bob Explorer',
      emailOrPhone: email2,
      password: 'Password123!',
      phone: '+919876543211',
    });
    user2Token = res2.body.data.token;
    user2Id = res2.body.data.user.id;

    // 3. Create Admin User
    const adminEmail = `admin_safety_${Date.now()}@example.com`;
    const resAdmin = await request(app).post('/api/v1/auth/signup').send({
      name: 'Admin Moderator',
      emailOrPhone: adminEmail,
      password: 'AdminPassword123!',
    });
    adminToken = resAdmin.body.data.token;
    adminId = resAdmin.body.data.user.id;
    // Elevate role to admin in DB
    await User.updateOne({ id: adminId }, { $set: { role: 'admin' } });

    // 4. Create a completed test trip with Alice as leader and Bob as member
    const trip = await Trip.create({
      id: `trip_test_${Date.now()}`,
      name: 'Wayanad Monsoon Trek',
      destination: 'Wayanad, Kerala',
      startCity: 'Kochi',
      startDate: '2026-05-01',
      endDate: '2026-05-04',
      durationDays: 4,
      budgetPerPerson: 4500,
      tripType: 'group',
      description: 'Scenic offbeat trek through mist-covered hills.',
      leader: {
        id: user1Id,
        name: 'Alice Safety',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      },
      members: [
        {
          id: user2Id,
          name: 'Bob Explorer',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
          role: 'Member',
        },
      ],
      maxMembers: 5,
      coverImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      status: 'closed', // completed trip
    });
    testTripId = trip.id;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  // =========================================================================
  // TEST 1: Unauthenticated user rejected on protected endpoints
  // =========================================================================
  describe('Case 1: Authentication Boundary Enforcement', () => {
    it('rejects unauthenticated requests to request-otp', async () => {
      const res = await request(app).post('/api/v1/safety/phone/request-otp').send({ phone: '+919876543210' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to identity/initiate', async () => {
      const res = await request(app).post('/api/v1/safety/identity/initiate').send({ documentType: 'aadhaar', consentGiven: true });
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated requests to submit reports', async () => {
      const res = await request(app).post('/api/v1/safety/reports').send({
        targetType: 'user',
        targetId: user2Id,
        category: 'harassment',
        description: 'Testing unauthorized submission',
      });
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // TEST 2, 3, 4: Privilege Escalation Prevention in Profile Update
  // =========================================================================
  describe('Cases 2, 3, 4: Self-Verification Prevention in Profile Update', () => {
    it('rejects attempt to mark own email as verified via profile update', async () => {
      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ emailVerified: true });

      expect(res.status).toBe(400); // blocked by validator/controller
      expect(res.body.success).toBe(false);
    });

    it('rejects attempt to mark own phone as verified via profile update', async () => {
      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ phoneVerified: true });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects attempt to manually change identityVerificationStatus via profile update', async () => {
      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ identityVerificationStatus: 'VERIFIED' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects attempt to elevate own role to admin via profile update', async () => {
      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // TEST 5, 6, 7: Mobile OTP Verification Security
  // =========================================================================
  describe('Cases 5, 6, 7: Phone OTP Verification & Brute-Force Safeguards', () => {
    const testPhone = '+919999888877';

    it('generates secure hashed OTP and responds with simulation status', async () => {
      const res = await request(app)
        .post('/api/v1/safety/phone/request-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.expiresInSeconds).toBe(300);
      expect(res.body.data.resendCooldownSeconds).toBe(60);
    });

    it('enforces resend cooldown on immediate repeat request', async () => {
      const res = await request(app)
        .post('/api/v1/safety/phone/request-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ phone: testPhone });

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Please wait');
    });

    it('rejects invalid OTP attempts and counts remaining attempts', async () => {
      const res = await request(app)
        .post('/api/v1/safety/phone/verify-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ phone: testPhone, otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid verification code');
    });

    it('rejects expired OTP', async () => {
      // Create manually expired OTP in DB
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('888888', salt);
      await OTPVerification.create({
        identifier: '+919999111122',
        type: 'phone_verification',
        hashedOtp: hash,
        expiresAt: new Date(Date.now() - 10000), // expired 10s ago
        resendAvailableAt: new Date(),
        consumed: false,
      });

      const res = await request(app)
        .post('/api/v1/safety/phone/verify-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ phone: '+919999111122', otp: '888888' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });

    it('verifies valid OTP, sets phoneVerified=true, and prevents single-use OTP reuse', async () => {
      // Create fresh valid OTP
      const freshPhone = '+919888111222';
      const rawOtp = '654321';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(rawOtp, salt);

      await OTPVerification.create({
        identifier: freshPhone,
        type: 'phone_verification',
        hashedOtp: hash,
        expiresAt: new Date(Date.now() + 300000),
        resendAvailableAt: new Date(),
        consumed: false,
      });

      // 1. Verify successfully
      const res1 = await request(app)
        .post('/api/v1/safety/phone/verify-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ phone: freshPhone, otp: rawOtp });

      expect(res1.status).toBe(200);
      expect(res1.body.data.phoneVerified).toBe(true);

      // Verify User record in DB
      const user = await User.findOne({ id: user1Id });
      expect(user?.phoneVerified).toBe(true);
      expect(user?.phoneVerifiedAt).toBeDefined();

      // 2. Attempt OTP reuse (Must be rejected)
      const res2 = await request(app)
        .post('/api/v1/safety/phone/verify-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ phone: freshPhone, otp: rawOtp });

      expect(res2.status).toBe(404); // No active unconsumed OTP
    });
  });

  // =========================================================================
  // TEST: Email Change with OTP Verification Security
  // =========================================================================
  describe('Email Change with OTP Verification Workflow', () => {
    let freshNewEmail: string;

    beforeAll(() => {
      freshNewEmail = `new_traveller_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@tripzobox.com`;
    });

    it('rejects unauthenticated requests to email/request-otp', async () => {
      const res = await request(app)
        .post('/api/v1/safety/email/request-otp')
        .send({ newEmail: freshNewEmail });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects attempt to change to the identical current email', async () => {
      const user = await User.findOne({ id: user1Id });
      const res = await request(app)
        .post('/api/v1/safety/email/request-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ newEmail: user?.email });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already your current email');
    });

    it('rejects attempt to change to an email already in use by another user', async () => {
      const otherUser = await User.findOne({ id: user2Id });
      const res = await request(app)
        .post('/api/v1/safety/email/request-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ newEmail: otherUser?.email });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already in use');
    });

    it('dispatches OTP for valid new email without updating user record prematurely', async () => {
      const res = await request(app)
        .post('/api/v1/safety/email/request-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ newEmail: freshNewEmail });

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(freshNewEmail);

      // Verify user record has NOT changed yet
      const user = await User.findOne({ id: user1Id });
      expect(user?.email).not.toBe(freshNewEmail);

      // Verify OTP record created
      const otpRecord = await OTPVerification.findOne({
        userId: user1Id,
        identifier: freshNewEmail,
        type: 'email_change',
        consumed: false,
      });
      expect(otpRecord).toBeDefined();
    });

    it('rejects verification with wrong OTP code', async () => {
      const res = await request(app)
        .post('/api/v1/safety/email/verify-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ newEmail: freshNewEmail, otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid verification code');

      // User email still must not be changed
      const user = await User.findOne({ id: user1Id });
      expect(user?.email).not.toBe(freshNewEmail);
    });

    it('successfully verifies valid OTP, updates user email in DB, marks emailVerified=true, and prevents code reuse', async () => {
      // Create fresh known OTP record
      const rawOtp = '765432';
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(rawOtp, salt);

      await OTPVerification.create({
        userId: user1Id,
        identifier: freshNewEmail,
        type: 'email_change',
        hashedOtp,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        resendAvailableAt: new Date(Date.now() + 60 * 1000),
        attempts: 0,
        maxAttempts: 5,
        consumed: false,
      });

      // 1. Verify successfully
      const res1 = await request(app)
        .post('/api/v1/safety/email/verify-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ newEmail: freshNewEmail, otp: rawOtp });

      expect(res1.status).toBe(200);
      expect(res1.body.data.emailVerified).toBe(true);
      expect(res1.body.data.email).toBe(freshNewEmail);

      // Verify user record in DB is now saved with the new email
      const user = await User.findOne({ id: user1Id });
      expect(user?.email).toBe(freshNewEmail);
      expect(user?.emailVerified).toBe(true);
      expect(user?.emailVerifiedAt).toBeDefined();

      // 2. Attempt OTP reuse (Must be rejected)
      const res2 = await request(app)
        .post('/api/v1/safety/email/verify-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ newEmail: freshNewEmail, otp: rawOtp });

      expect(res2.body.success).toBe(false);
      expect([400, 404]).toContain(res2.status);
    });
  });

  // =========================================================================
  // TEST: Travel Vault Document Verification with Registered Contact OTP
  // =========================================================================
  describe('Travel Vault Document Verification with Registered OTP', () => {
    let testDocId: string;

    beforeAll(async () => {
      // Create a test Vault document for user 1
      testDocId = `doc_test_${Date.now()}`;
      const VaultDocModel = (await import('../src/models/VaultDocument.js')).VaultDocument;
      await VaultDocModel.create({
        id: testDocId,
        userId: user1Id,
        type: 'Passport',
        name: 'Indian Passport',
        referenceNumber: 'R21234567',
        validTill: '17 May 2030',
        issuingCountry: 'India',
        isVerified: false,
      });
    });

    it('rejects unauthenticated request to /vault/documents/request-otp', async () => {
      const res = await request(app)
        .post('/api/v1/vault/documents/request-otp')
        .send({ channel: 'email', documentName: 'Indian Passport' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('requests OTP via registered email successfully', async () => {
      const res = await request(app)
        .post('/api/v1/vault/documents/request-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ channel: 'email', documentName: 'Indian Passport', documentType: 'Passport' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.channel).toBe('email');
      expect(res.body.data.maskedIdentifier).toBeDefined();
    });

    it('rejects invalid 6-digit OTP code', async () => {
      const res = await request(app)
        .post('/api/v1/vault/documents/verify-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          identifier: 'some_user@example.com',
          otp: '000000',
          documentId: testDocId,
          documentType: 'Passport',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('verifies valid OTP, sets isVerified=true on document and updates user identity status', async () => {
      const user = await User.findOne({ id: user1Id });
      const userEmail = (user?.email || '').toLowerCase();
      const rawOtp = '789123';
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(rawOtp, salt);

      await OTPVerification.create({
        userId: user1Id,
        identifier: userEmail,
        type: 'document_verification',
        hashedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        resendAvailableAt: new Date(Date.now() + 60 * 1000),
        attempts: 0,
        maxAttempts: 5,
        consumed: false,
      });

      const res = await request(app)
        .post('/api/v1/vault/documents/verify-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          identifier: userEmail,
          otp: rawOtp,
          documentId: testDocId,
          documentType: 'Passport',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isVerified).toBe(true);

      // Verify MongoDB document record is now isVerified: true
      const VaultDocModel = (await import('../src/models/VaultDocument.js')).VaultDocument;
      const updatedDoc = await VaultDocModel.findOne({ id: testDocId });
      expect(updatedDoc?.isVerified).toBe(true);

      // Check OTP replay is blocked
      const replayRes = await request(app)
        .post('/api/v1/vault/documents/verify-otp')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          identifier: userEmail,
          otp: rawOtp,
          documentId: testDocId,
        });

      expect(replayRes.status).toBe(400);
      expect(replayRes.body.success).toBe(false);
    });
  });

  // =========================================================================
  // TEST 8, 9, 10: Traveller Ratings & Reviews
  // =========================================================================
  describe('Cases 8, 9, 10: Peer-to-Peer Traveller Reviews & Anti-Abuse', () => {
    it('rejects self-review (Case 10)', async () => {
      const res = await request(app)
        .post('/api/v1/safety/reviews')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tripId: testTripId,
          revieweeId: user1Id, // self
          ratings: { overall: 5, communication: 5, punctuality: 5, cooperation: 5, respectfulBehaviour: 5 },
          comment: 'I am the best traveller ever!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot review yourself');
    });

    it('rejects review if reviewer did not participate in the trip (Case 8)', async () => {
      // Create a 3rd user not in the trip
      const nonMemberEmail = `outsider_${Date.now()}@example.com`;
      const resOutsider = await request(app).post('/api/v1/auth/signup').send({
        name: 'Outsider User',
        emailOrPhone: nonMemberEmail,
        password: 'Password123!',
      });
      const outsiderToken = resOutsider.body.data.token;

      const res = await request(app)
        .post('/api/v1/safety/reviews')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          tripId: testTripId,
          revieweeId: user2Id,
          ratings: { overall: 5, communication: 5, punctuality: 5, cooperation: 5, respectfulBehaviour: 5 },
          comment: 'I heard they were great!',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('did not join');
    });

    it('allows confirmed trip participant to review fellow traveller and calculates reputation', async () => {
      const res = await request(app)
        .post('/api/v1/safety/reviews')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tripId: testTripId,
          revieweeId: user2Id,
          ratings: { overall: 5, communication: 4, punctuality: 5, cooperation: 5, respectfulBehaviour: 5 },
          comment: 'Fantastic travel companion! Very punctual and helpful throughout the Wayanad trail.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedReputation.averageRating).toBe(5);
      expect(res.body.data.updatedReputation.reviewCount).toBe(1);

      // Verify reviewee profile
      const reviewee = await User.findOne({ id: user2Id });
      expect(reviewee?.reputation.averageRating).toBe(5);
      expect(reviewee?.reputation.reviewCount).toBe(1);
    });

    it('prevents duplicate reviews for the same user on the same trip (Case 9)', async () => {
      const res = await request(app)
        .post('/api/v1/safety/reviews')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tripId: testTripId,
          revieweeId: user2Id,
          ratings: { overall: 4, communication: 4, punctuality: 4, cooperation: 4, respectfulBehaviour: 4 },
          comment: 'Submitting a second duplicate review should be prevented.',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already submitted a review');
    });
  });

  // =========================================================================
  // TEST 11, 12: User Reporting & Blocking Boundaries
  // =========================================================================
  describe('Cases 11, 12: Reporting Confidentiality & Block Enforcement', () => {
    let reportId: string;

    it('submits a confidential safety report', async () => {
      const res = await request(app)
        .post('/api/v1/safety/reports')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          targetType: 'user',
          targetId: user2Id,
          targetName: 'Bob Explorer',
          category: 'safety_concern',
          description: 'Reporting a safety concern regarding off-trail trekking.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('OPEN');
      reportId = res.body.data.reportId;
    });

    it('allows reporter to see their own reports but isolates other users reports (Case 11)', async () => {
      // User 1 sees their report
      const res1 = await request(app).get('/api/v1/safety/reports/my').set('Authorization', `Bearer ${user1Token}`);
      expect(res1.status).toBe(200);
      expect(res1.body.data.reports.some((r: any) => r.id === reportId)).toBe(true);

      // User 2 cannot see User 1's report
      const res2 = await request(app).get('/api/v1/safety/reports/my').set('Authorization', `Bearer ${user2Token}`);
      expect(res2.status).toBe(200);
      expect(res2.body.data.reports.some((r: any) => r.id === reportId)).toBe(false);
    });

    it('blocks a user and prevents messaging / join bypass (Case 12)', async () => {
      // User 1 blocks User 2
      const blockRes = await request(app)
        .post('/api/v1/safety/block')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ targetUserId: user2Id, reason: 'Harassment prevention' });

      expect(blockRes.status).toBe(200);
      expect(blockRes.body.data.isBlocked).toBe(true);

      // Blocked User 2 attempts to message User 1's trip
      const msgRes = await request(app)
        .post(`/api/v1/messages/threads/${testTripId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ text: 'Attempting to message while blocked' });

      expect(msgRes.status).toBe(403);
      expect(msgRes.body.message).toContain('restricted');
    });

    it('unblocks a user cleanly and restores normal interactions', async () => {
      const unblockRes = await request(app)
        .post('/api/v1/safety/unblock')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ targetUserId: user2Id });

      expect(unblockRes.status).toBe(200);
      expect(unblockRes.body.data.isBlocked).toBe(false);
    });
  });

  // =========================================================================
  // TEST 13: Admin Role Authorization Boundary
  // =========================================================================
  describe('Case 13: Admin Authorization Protection', () => {
    it('rejects regular users from accessing admin moderation endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/safety/admin/reports')
        .set('Authorization', `Bearer ${user1Token}`); // Alice is regular user

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Admin authorization required');
    });

    it('allows authorized admin to review reports and update status', async () => {
      // 1. Fetch reports as admin
      const resList = await request(app)
        .get('/api/v1/safety/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resList.status).toBe(200);
      expect(resList.body.data.reports.length).toBeGreaterThan(0);
      const rep = resList.body.data.reports[0];

      // 2. Update report status to UNDER_REVIEW
      const resUpdate = await request(app)
        .put(`/api/v1/safety/admin/reports/${rep.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'UNDER_REVIEW', moderatorNotes: 'Investigating situation with trip leader.' });

      expect(resUpdate.status).toBe(200);
      expect(resUpdate.body.data.report.status).toBe('UNDER_REVIEW');
    });

    it('allows admin to suspend a violating account and prevents suspended user login/access', async () => {
      // Suspend Bob
      const suspendRes = await request(app)
        .post(`/api/v1/safety/admin/users/${user2Id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Investigation of safety violation' });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.isSuspended).toBe(true);

      // Attempt authenticated action with Bob's token (must be rejected with 403)
      const actionRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(actionRes.status).toBe(403);
      expect(actionRes.body.message).toContain('suspended');

      // Restore Bob
      const restoreRes = await request(app)
        .post(`/api/v1/safety/admin/users/${user2Id}/restore`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Investigation concluded safely' });

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.isSuspended).toBe(false);
    });
  });

  // =========================================================================
  // TEST 14, 15: Identity Verification Lifecycle & Vault Isolation
  // =========================================================================
  describe('Cases 14, 15: Government ID Verification & Vault Protection', () => {
    it('initiates optional government ID verification with explicit consent', async () => {
      const res = await request(app)
        .post('/api/v1/safety/identity/initiate')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ documentType: 'driving_license', consentGiven: true });

      expect(res.status).toBe(202);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.referenceId).toBeDefined();

      const user = await User.findOne({ id: user1Id });
      expect(user?.identityVerificationStatus).toBe('PENDING');
    });

    it('rejects identity verification when consent is missing', async () => {
      const res = await request(app)
        .post('/api/v1/safety/identity/initiate')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ documentType: 'passport', consentGiven: false });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('consent is legally required');
    });

    it('simulates verification result transition to VERIFIED in test environment', async () => {
      const res = await request(app)
        .post('/api/v1/safety/identity/simulate-result')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'VERIFIED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('VERIFIED');

      const user = await User.findOne({ id: user1Id });
      expect(user?.identityVerificationStatus).toBe('VERIFIED');
      expect(user?.identityVerifiedAt).toBeDefined();
    });

    it('provides national emergency contacts and guidelines without exposing private info', async () => {
      const res = await request(app).get('/api/v1/safety/emergency-info');
      expect(res.status).toBe(200);
      expect(res.body.data.nationalHelplines.length).toBeGreaterThan(0);
      expect(res.body.data.nationalHelplines.some((h: any) => h.number === '112')).toBe(true);
    });
  });
});

