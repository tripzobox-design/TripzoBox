import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { OAuth2Client } from 'google-auth-library';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { config } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Trip } from '../src/models/Trip.js';
import { JoinRequest } from '../src/models/JoinRequest.js';
import { TravellerReview } from '../src/models/TravellerReview.js';
import { Message } from '../src/models/Message.js';
import { Notification } from '../src/models/Notification.js';
import { Story } from '../src/models/Story.js';
import { DiaryEntry } from '../src/models/DiaryEntry.js';
import { VaultDocument } from '../src/models/VaultDocument.js';
import {
  EmergencyContact,
  SharedAccessRecord,
  TrustedContact,
  VaultSettings,
} from '../src/models/VaultSettings.js';
import { OTPVerification } from '../src/models/OTPVerification.js';
import { IdentityVerification } from '../src/models/IdentityVerification.js';
import { UserBlock } from '../src/models/UserBlock.js';
import { UserReport } from '../src/models/UserReport.js';
import { AdminAuditLog } from '../src/models/AdminAuditLog.js';
import { signToken } from '../src/utils/token.js';
import * as emailService from '../src/services/emailService.js';

describe('TripzoBox Account Deletion End-to-End Integration Suite', () => {
  let app: any;
  const createdUserIds: string[] = [];
  const createdTripIds: string[] = [];
  const createdStoryIds: string[] = [];
  const createdFilePaths: string[] = [];

  const origEnv = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  };

  const uniqueTag = () => `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const createVerifiedUser = async (overrides: Record<string, any> = {}) => {
    const tag = uniqueTag();
    const id = overrides.id || `user_del_test_${tag}`;
    const email = overrides.email ?? `deltest_${tag}@example.com`;
    const user = new User({
      id,
      name: overrides.name || `Test Traveller ${tag}`,
      username: overrides.username || `deluser_${tag}`,
      ...(email ? { email } : {}),
      ...(overrides.phone ? { phone: overrides.phone } : {}),
      password: overrides.password === null ? undefined : overrides.password || 'SecretPass!123',
      avatarUrl: overrides.avatarUrl || '',
      city: overrides.city || 'Kochi',
      bio: overrides.bio || 'Loves mountain trails and coastal cafes.',
      emailVerified: overrides.emailVerified ?? Boolean(email),
      emailVerifiedAt: overrides.emailVerified === false ? undefined : new Date(),
      phoneVerified: overrides.phoneVerified ?? false,
      identityVerificationStatus: overrides.identityVerificationStatus || 'NOT_STARTED',
      isGoogleConnected: overrides.isGoogleConnected ?? false,
      isAppleConnected: overrides.isAppleConnected ?? false,
      googleId: overrides.googleId,
      role: overrides.role || 'user',
      tokenVersion: 0,
      securityQuestion: 'Favorite trip?',
      securityAnswer: 'Ladakh',
      recoveryCodes: ['CODE-1111', 'CODE-2222'],
    });
    await user.save();
    createdUserIds.push(user.id);
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });
    return { user, token };
  };

  const createUploadFileOnDisk = async (prefix: string): Promise<{ filename: string; url: string; fullPath: string }> => {
    await fs.promises.mkdir(config.uploadDir, { recursive: true });
    const filename = `${prefix}_${uniqueTag()}.txt`;
    const fullPath = path.resolve(config.uploadDir, filename);
    await fs.promises.writeFile(fullPath, 'TripzoBox confidential test artifact', 'utf8');
    createdFilePaths.push(fullPath);
    return {
      filename,
      url: `http://localhost:5000/uploads/${filename}`,
      fullPath,
    };
  };

  const requestAndCaptureOtp = async (token: string, currentPassword?: string) => {
    let capturedOtp = '';
    const otpEmailSpy = vi
      .spyOn(emailService, 'sendAccountDeletionOtpEmail')
      .mockImplementation(async (_email, _name, otp) => {
        capturedOtp = otp;
        return { sent: true, isSimulated: true };
      });

    const otpRes = await request(app)
      .post('/api/users/me/deletion-otp')
      .set('Authorization', `Bearer ${token}`)
      .send(currentPassword ? { currentPassword } : {});

    return { otpRes, capturedOtp, otpEmailSpy };
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:5000/api/auth/google/callback';
    await connectDB();
    app = createApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    for (const filePath of createdFilePaths) {
      await fs.promises.unlink(filePath).catch(() => {});
    }
    if (createdTripIds.length > 0) {
      await Message.deleteMany({ tripId: { $in: createdTripIds } });
      await JoinRequest.deleteMany({ tripId: { $in: createdTripIds } });
      await TravellerReview.deleteMany({ tripId: { $in: createdTripIds } });
      await Trip.deleteMany({ id: { $in: createdTripIds } });
    }
    if (createdStoryIds.length > 0) {
      await Story.deleteMany({ id: { $in: createdStoryIds } });
    }
    if (createdUserIds.length > 0) {
      await VaultDocument.deleteMany({ userId: { $in: createdUserIds } });
      await EmergencyContact.deleteMany({ userId: { $in: createdUserIds } });
      await TrustedContact.deleteMany({ userId: { $in: createdUserIds } });
      await SharedAccessRecord.deleteMany({ userId: { $in: createdUserIds } });
      await VaultSettings.deleteMany({ userId: { $in: createdUserIds } });
      await DiaryEntry.deleteMany({ userId: { $in: createdUserIds } });
      await Notification.deleteMany({ userId: { $in: createdUserIds } });
      await UserBlock.deleteMany({
        $or: [{ blockerId: { $in: createdUserIds } }, { blockedUserId: { $in: createdUserIds } }],
      });
      await UserReport.deleteMany({
        $or: [{ reporterId: { $in: createdUserIds } }, { targetId: { $in: createdUserIds } }],
      });
      await IdentityVerification.deleteMany({ userId: { $in: createdUserIds } });
      await OTPVerification.deleteMany({ userId: { $in: createdUserIds } });
      await AdminAuditLog.deleteMany({ targetId: { $in: createdUserIds } });
      await User.deleteMany({ id: { $in: createdUserIds } });
    }

    process.env.GOOGLE_CLIENT_ID = origEnv.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = origEnv.GOOGLE_CLIENT_SECRET;
    process.env.GOOGLE_CALLBACK_URL = origEnv.GOOGLE_CALLBACK_URL;
    await disconnectDB();
  });

  it('rejects unauthenticated, wrong-password, arbitrary userId (IDOR), and untrusted CSRF requests', async () => {
    const { user: userA, token: tokenA } = await createVerifiedUser();
    const { user: userB } = await createVerifiedUser();

    // Unauthenticated
    const unauthRes = await request(app).delete('/api/users/me').send({ confirmDeletion: true });
    expect(unauthRes.status).toBe(401);

    // IDOR: target explicit userId param or mismatched body userId
    const idorParamRes = await request(app)
      .delete(`/api/users/${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ confirmDeletion: true });
    expect(idorParamRes.status).toBe(403);

    const idorBodyRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ userId: userB.id, confirmDeletion: true });
    expect(idorBodyRes.status).toBe(403);

    // CSRF checks: cookie without X-Requested-With, and untrusted Origin header
    const csrfCookieNoHeader = await request(app)
      .delete('/api/users/me')
      .set('Cookie', [`tripzobox_token=${tokenA}`])
      .send({ confirmDeletion: true });
    expect(csrfCookieNoHeader.status).toBe(403);

    const csrfBadOrigin = await request(app)
      .delete('/api/users/me')
      .set('Cookie', [`tripzobox_token=${tokenA}`])
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Origin', 'https://attacker.example.com')
      .send({ confirmDeletion: true });
    expect(csrfBadOrigin.status).toBe(403);

    // Wrong current password rejected
    const wrongPassReauth = await request(app)
      .post('/api/users/me/deletion-reauth')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ currentPassword: 'WrongPassword!999' });
    expect(wrongPassReauth.status).toBe(401);

    const { capturedOtp } = await requestAndCaptureOtp(tokenA, 'SecretPass!123');
    expect(capturedOtp).toMatch(/^\d{6}$/);

    const wrongPassDelete = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        currentPassword: 'IncorrectPassword!',
        otp: capturedOtp,
        confirmDeletion: true,
      });
    expect(wrongPassDelete.status).toBe(401);

    const stillActive = await User.findOne({ id: userA.id });
    expect(stillActive?.isDeleted).toBe(false);
    expect(stillActive?.email).toBe(userA.email);
  });

  it('enforces OTP expiry, attempt lockout, replay prevention, resend cooldown, and rejects fixed code 123456', async () => {
    const { user, token } = await createVerifiedUser();
    const { otpRes, capturedOtp } = await requestAndCaptureOtp(token, 'SecretPass!123');
    expect(otpRes.status).toBe(200);
    expect(JSON.stringify(otpRes.body)).not.toContain(capturedOtp);
    expect(otpRes.body.data.devOtp).toBeUndefined();

    // Resend cooldown enforced
    const cooldownRes = await request(app)
      .post('/api/users/me/deletion-otp')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(cooldownRes.status).toBe(429);

    // Fixed / demo OTP 123456 rejected (unless cryptographically generated 123456)
    const bogusOtp = capturedOtp === '123456' ? '654321' : '123456';
    const bogusRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'SecretPass!123',
        otp: bogusOtp,
        confirmDeletion: true,
      });
    expect(bogusRes.status).toBe(400);

    // Expired OTP rejected
    await OTPVerification.updateMany(
      { userId: user.id, type: 'account_deletion', consumed: false },
      { $set: { expiresAt: new Date(Date.now() - 10_000) } }
    );
    const expiredRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'SecretPass!123',
        otp: capturedOtp,
        confirmDeletion: true,
      });
    expect(expiredRes.status).toBe(400);
    expect(expiredRes.body.message.toLowerCase()).toContain('expired');

    // Issue fresh OTP after cooldown reset and test attempt limit lockout (5 wrong attempts)
    const { otpRes: secondOtpRes } = await requestAndCaptureOtp(token, 'SecretPass!123');
    expect(secondOtpRes.status).toBe(200);

    for (let attempt = 1; attempt <= 5; attempt++) {
      const failAttemptRes = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'SecretPass!123',
          otp: '000001',
          confirmDeletion: true,
        });
      expect(failAttemptRes.status).toBe(attempt === 5 ? 429 : 400);
    }

    // Issue fresh OTP and complete deletion, then verify OTP replay & duplicate deletion fail
    const { otpRes: finalOtpRes, capturedOtp: finalOtp } = await requestAndCaptureOtp(
      token,
      'SecretPass!123'
    );
    expect(finalOtpRes.status).toBe(200);

    const confirmationSpy = vi
      .spyOn(emailService, 'sendAccountDeletionConfirmationEmail')
      .mockResolvedValue({ sent: true, isSimulated: true });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const deleteRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'SecretPass!123',
        otp: finalOtp,
        confirmationText: 'DELETE',
        confirmDeletion: true,
      });

    expect(deleteRes.status, JSON.stringify(deleteRes.body)).toBe(200);
    expect(deleteRes.body.message).toBe(
      'Your TripzoBox account deletion request has been completed.'
    );
    expect(confirmationSpy).toHaveBeenCalledTimes(1);

    // Ensure sensitive password/OTP did not leak in console logs or API response
    const loggedOutput = consoleSpy.mock.calls.flat().join(' ');
    expect(loggedOutput).not.toContain('SecretPass!123');
    expect(loggedOutput).not.toContain(finalOtp);
    expect(JSON.stringify(deleteRes.body)).not.toContain('SecretPass!123');
    expect(JSON.stringify(deleteRes.body)).not.toContain(finalOtp);

    // Pre-deletion token rejected immediately and duplicate deletion impossible
    const afterMeRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(afterMeRes.status).toBe(401);

    const replayRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'SecretPass!123',
        otp: finalOtp,
        confirmDeletion: true,
      });
    expect(replayRes.status).toBe(401);
  });

  it('blocks active trip leader deletion until leadership transfer or cancellation, while removing member safely from other trips', async () => {
    const { user: leaderUser, token: leaderToken } = await createVerifiedUser();
    const { user: memberUser } = await createVerifiedUser();
    const { user: otherLeader } = await createVerifiedUser();

    const ledTripId = `trip_led_${uniqueTag()}`;
    const joinedTripId = `trip_joined_${uniqueTag()}`;
    createdTripIds.push(ledTripId, joinedTripId);

    await Trip.create({
      id: ledTripId,
      name: 'Spiti Valley Expedition',
      destination: 'Spiti Valley',
      startCity: 'Delhi',
      startDate: '2026-12-10',
      endDate: '2026-12-16',
      durationDays: 7,
      budgetPerPerson: 18000,
      maxMembers: 5,
      spotsLeft: 3,
      description: 'Himalayan winter road trip across Spiti.',
      coverImageUrl: 'https://example.com/spiti.jpg',
      status: 'open',
      roomType: 'public',
      leader: {
        id: leaderUser.id,
        name: leaderUser.name,
        username: leaderUser.username,
        avatarUrl: '',
        city: 'Kochi',
      },
      members: [
        {
          id: leaderUser.id,
          name: leaderUser.name,
          avatarUrl: '',
          role: 'Trip Leader',
          city: 'Kochi',
        },
        {
          id: memberUser.id,
          name: memberUser.name,
          avatarUrl: '',
          role: 'Member',
          city: 'Bengaluru',
        },
      ],
    });

    await Trip.create({
      id: joinedTripId,
      name: 'Coorg Mist Retreat',
      destination: 'Coorg',
      startCity: 'Bengaluru',
      startDate: '2026-12-20',
      endDate: '2026-12-23',
      durationDays: 4,
      budgetPerPerson: 9000,
      maxMembers: 2,
      spotsLeft: 0,
      description: 'Coffee estate weekend trek.',
      coverImageUrl: 'https://example.com/coorg.jpg',
      status: 'full',
      roomType: 'public',
      leader: {
        id: otherLeader.id,
        name: otherLeader.name,
        username: otherLeader.username,
        avatarUrl: '',
        city: 'Mysuru',
      },
      members: [
        {
          id: otherLeader.id,
          name: otherLeader.name,
          avatarUrl: '',
          role: 'Trip Leader',
          city: 'Mysuru',
        },
        {
          id: leaderUser.id,
          name: leaderUser.name,
          avatarUrl: '',
          role: 'Member',
          city: 'Kochi',
        },
      ],
      savedBy: [leaderUser.id, otherLeader.id],
    });

    await JoinRequest.create({
      id: `req_pending_${uniqueTag()}`,
      tripId: joinedTripId,
      userId: leaderUser.id,
      user: {
        id: leaderUser.id,
        name: leaderUser.name,
        avatarUrl: '',
        email: leaderUser.email,
      },
      status: 'pending',
    });

    const preflightRes = await request(app)
      .get('/api/users/me/deletion-preflight')
      .set('Authorization', `Bearer ${leaderToken}`);
    expect(preflightRes.status).toBe(200);
    expect(preflightRes.body.data.canDelete).toBe(false);
    expect(preflightRes.body.data.blockingTrips).toHaveLength(1);
    expect(preflightRes.body.data.blockingTrips[0].eligibleNewLeaders[0].id).toBe(memberUser.id);

    const { capturedOtp } = await requestAndCaptureOtp(leaderToken, 'SecretPass!123');
    const blockedDeleteRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        currentPassword: 'SecretPass!123',
        otp: capturedOtp,
        confirmDeletion: true,
      });
    expect(blockedDeleteRes.status).toBe(409);

    // Transfer leadership cleanly to eligible member
    const transferRes = await request(app)
      .post(`/api/v1/trips/${ledTripId}/transfer-leadership`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ newLeaderId: memberUser.id });
    expect(transferRes.status).toBe(200);
    expect(transferRes.body.data.trip.leader.id).toBe(memberUser.id);

    const newLeaderNotif = await Notification.findOne({ userId: memberUser.id });
    expect(newLeaderNotif?.title).toContain('Leadership Transferred');

    // Cooldown bypass only in DB for test speed, then request new OTP & delete cleanly
    await OTPVerification.updateMany(
      { userId: leaderUser.id, type: 'account_deletion' },
      { $set: { resendAvailableAt: new Date(Date.now() - 1000) } }
    );
    const { capturedOtp: finalOtp } = await requestAndCaptureOtp(leaderToken, 'SecretPass!123');
    vi.spyOn(emailService, 'sendAccountDeletionConfirmationEmail').mockResolvedValue({
      sent: true,
      isSimulated: true,
    });

    const delRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        currentPassword: 'SecretPass!123',
        otp: finalOtp,
        confirmDeletion: true,
      });
    expect(delRes.status).toBe(200);

    // Transferred trip now belongs to memberUser and former leader is removed from members
    const updatedLedTrip = await Trip.findOne({ id: ledTripId });
    expect(updatedLedTrip?.leader.id).toBe(memberUser.id);
    expect(updatedLedTrip?.members.some((m) => m.id === leaderUser.id)).toBe(false);
    expect(updatedLedTrip?.members.find((m) => m.id === memberUser.id)?.role).toBe('Trip Leader');

    // Joined full trip re-opened a spot when user was removed and otherLeader's save remained intact
    const updatedJoinedTrip = await Trip.findOne({ id: joinedTripId });
    expect(updatedJoinedTrip?.status).toBe('open');
    expect(updatedJoinedTrip?.spotsLeft).toBe(1);
    expect(updatedJoinedTrip?.members.some((m) => m.id === leaderUser.id)).toBe(false);
    expect(updatedJoinedTrip?.savedBy).toEqual([otherLeader.id]);

    const remainingPendingReqs = await JoinRequest.find({ userId: leaderUser.id });
    expect(remainingPendingReqs).toHaveLength(0);
  });

  it('cleans up Vault, storage files, private diary/stories, notifications, OTPs, blocks while anonymizing public stories, messages, reviews, preserving other users & compliance logs', async () => {
    const avatarFile = await createUploadFileOnDisk('avatar_del');
    const vaultFile = await createUploadFileOnDisk('passport_del');
    const diaryFile = await createUploadFileOnDisk('diary_del');
    const otherUserVaultFile = await createUploadFileOnDisk('passport_keep');

    const { user: userA, token: tokenA } = await createVerifiedUser({
      avatarUrl: avatarFile.url,
    });
    const { user: userB } = await createVerifiedUser();
    const { user: adminUser, token: adminToken } = await createVerifiedUser({
      role: 'superadmin',
    });

    const tripId = `trip_comm_${uniqueTag()}`;
    const publicStoryId = `story_pub_${uniqueTag()}`;
    const privateStoryId = `story_priv_${uniqueTag()}`;
    createdTripIds.push(tripId);
    createdStoryIds.push(publicStoryId, privateStoryId);

    // Seed personal vault, diary, stories, notifications, blocks, compliance logs & unrelated userB doc
    await VaultDocument.create({
      id: `vdoc_${uniqueTag()}`,
      userId: userA.id,
      type: 'Passport',
      name: 'Passport Copy',
      fileUrl: vaultFile.url,
    });
    await VaultDocument.create({
      id: `vdoc_other_${uniqueTag()}`,
      userId: userB.id,
      type: 'Passport',
      name: 'Other User Passport',
      fileUrl: otherUserVaultFile.url,
    });
    await EmergencyContact.create({
      id: `ec_${uniqueTag()}`,
      userId: userA.id,
      name: 'Mom',
      relation: 'Mother',
      phone: '+919999999999',
    });
    await TrustedContact.create({
      id: `tc_${uniqueTag()}`,
      userId: userA.id,
      name: 'Best Friend',
      relation: 'Friend',
      email: 'trusted@example.com',
      phone: '+918888888888',
    });
    await SharedAccessRecord.create({
      id: `sa_${uniqueTag()}`,
      userId: userA.id,
      documentId: `vdoc_${uniqueTag()}`,
      documentType: 'Passport',
      documentName: 'Passport Copy',
      sharedWithName: 'Co-Traveler',
    });
    await VaultSettings.create({
      userId: userA.id,
      vaultPinHash: 'hashed_pin',
    });

    await DiaryEntry.create({
      id: `diary_${uniqueTag()}`,
      userId: userA.id,
      place: 'Munnar',
      date: '2026-01-12',
      text: 'My personal private journal.',
      photos: [diaryFile.url],
      visibility: 'private',
    });
    await DiaryEntry.create({
      id: `diary_b_${uniqueTag()}`,
      userId: userB.id,
      place: 'Goa',
      date: '2026-02-01',
      text: 'Must not be deleted.',
      photos: [],
      visibility: 'private',
    });

    await Story.create({
      id: publicStoryId,
      slug: `slug-pub-${uniqueTag()}`,
      title: 'Public Ladakh Guide',
      destination: 'Ladakh',
      dates: 'Aug 2026',
      summary: 'Helpful community trail notes.',
      coverImageUrl: 'https://example.com/public.jpg',
      author: {
        id: userA.id,
        name: userA.name,
        avatarUrl: avatarFile.url,
        city: 'Kochi',
      },
      likedBy: [userA.id, userB.id],
      visibility: 'public',
      status: 'published',
    });
    await Story.create({
      id: privateStoryId,
      slug: `slug-priv-${uniqueTag()}`,
      title: 'Draft Secret Story',
      destination: 'Wayanad',
      dates: 'Sep 2026',
      summary: 'Private draft notes.',
      coverImageUrl: 'https://example.com/priv.jpg',
      author: {
        id: userA.id,
        name: userA.name,
        avatarUrl: avatarFile.url,
      },
      visibility: 'private',
      status: 'draft',
    });

    await Notification.create({
      id: `notif_a_${uniqueTag()}`,
      userId: userA.id,
      type: 'system',
      title: 'Welcome',
      message: 'Private notification for A',
    });
    await Notification.create({
      id: `notif_b_${uniqueTag()}`,
      userId: userB.id,
      type: 'system',
      title: 'Welcome B',
      message: 'Private notification for B',
    });

    await UserBlock.create({
      id: `blk_${uniqueTag()}`,
      blockerId: userA.id,
      blockedUserId: userB.id,
      blockedUserName: userB.name,
    });

    await Trip.create({
      id: tripId,
      name: 'Completed Kerala Trip',
      destination: 'Munnar',
      startCity: 'Kochi',
      startDate: '2026-01-01',
      endDate: '2026-01-05',
      durationDays: 5,
      budgetPerPerson: 10000,
      maxMembers: 4,
      spotsLeft: 2,
      description: 'Completed trip.',
      coverImageUrl: 'https://example.com/kerala.jpg',
      status: 'closed',
      leader: {
        id: userB.id,
        name: userB.name,
        username: userB.username,
        avatarUrl: '',
        city: 'Bengaluru',
      },
      members: [
        { id: userB.id, name: userB.name, avatarUrl: '', role: 'Trip Leader' },
        { id: userA.id, name: userA.name, avatarUrl: avatarFile.url, role: 'Member' },
      ],
      reviews: [
        {
          id: `trev_emb_${uniqueTag()}`,
          author: { id: userA.id, name: userA.name, avatarUrl: avatarFile.url },
          rating: 5,
          comment: 'Great mountains and itinerary!',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    await Message.create({
      id: `msg_a_${uniqueTag()}`,
      tripId,
      sender: { id: userA.id, name: userA.name, avatarUrl: avatarFile.url },
      text: 'Meet at the trailhead at 7 AM!',
      readBy: [userA.id, userB.id],
    });
    await Message.create({
      id: `msg_b_${uniqueTag()}`,
      tripId,
      sender: { id: userB.id, name: userB.name, avatarUrl: '' },
      text: 'Sounds great!',
      readBy: [userB.id],
    });

    await TravellerReview.create({
      id: `rev_${uniqueTag()}`,
      tripId,
      tripName: 'Completed Kerala Trip',
      reviewerId: userA.id,
      reviewerName: userA.name,
      reviewerAvatar: avatarFile.url,
      revieweeId: userB.id,
      revieweeName: userB.name,
      ratings: {
        overall: 5,
        friendliness: 5,
        communication: 5,
        punctuality: 5,
        cooperation: 5,
        responsibility: 5,
        respectfulBehaviour: 5,
      },
      comment: 'Super reliable co-traveler.',
    });

    await UserReport.create({
      id: `rep_${uniqueTag()}`,
      reporterId: userA.id,
      reporterName: userA.name,
      targetType: 'trip',
      targetId: tripId,
      category: 'other',
      description: 'Reported spam link in itinerary notes for compliance check.',
    });

    await IdentityVerification.create({
      id: `idv_${uniqueTag()}`,
      userId: userA.id,
      providerReferenceId: `prov_${uniqueTag()}`,
      documentType: 'passport',
      status: 'VERIFIED',
      consentGiven: true,
      consentTimestamp: new Date(),
      verificationMetadata: {
        confidenceScore: 0.99,
        checkSummary: 'Passed',
      },
    });

    const originalEmail = userA.email!;
    const { capturedOtp } = await requestAndCaptureOtp(tokenA, 'SecretPass!123');
    vi.spyOn(emailService, 'sendAccountDeletionConfirmationEmail').mockResolvedValue({
      sent: true,
      isSimulated: true,
    });

    const delRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        currentPassword: 'SecretPass!123',
        otp: capturedOtp,
        confirmationText: 'DELETE',
        confirmDeletion: true,
      });

    expect(delRes.status).toBe(200);

    // 1. User tombstone has zero personal PII, passwords, or verified identifiers
    const scrubbedUser = await User.findOne({ id: userA.id }).select('+password +securityAnswer +recoveryCodes');
    expect(scrubbedUser?.isDeleted).toBe(true);
    expect(scrubbedUser?.deletedAt).toBeTruthy();
    expect(scrubbedUser?.name).toBe('Deleted User');
    expect(scrubbedUser?.email).toBeUndefined();
    expect(scrubbedUser?.phone).toBeUndefined();
    expect(scrubbedUser?.password).toBeUndefined();
    expect(scrubbedUser?.securityAnswer).toBeUndefined();
    expect(scrubbedUser?.recoveryCodes).toEqual([]);
    expect(scrubbedUser?.bio).toBe('');

    const rawMongoUser = await User.collection.findOne({ id: userA.id });
    expect(rawMongoUser?.email).toBeUndefined();
    expect(rawMongoUser?.password).toBeUndefined();
    expect(rawMongoUser?.recoveryCodes).toBeUndefined();

    // 2. Old login fails cleanly (never resurrects)
    const oldLoginRes = await request(app).post('/api/v1/auth/login').send({
      emailOrPhone: originalEmail,
      password: 'SecretPass!123',
    });
    expect(oldLoginRes.status).toBe(401);

    // 3. Vault, physical upload files, diary, private stories, notifications, blocks, OTPs deleted
    expect(await VaultDocument.countDocuments({ userId: userA.id })).toBe(0);
    expect(await EmergencyContact.countDocuments({ userId: userA.id })).toBe(0);
    expect(await TrustedContact.countDocuments({ userId: userA.id })).toBe(0);
    expect(await SharedAccessRecord.countDocuments({ userId: userA.id })).toBe(0);
    expect(await VaultSettings.countDocuments({ userId: userA.id })).toBe(0);
    expect(await DiaryEntry.countDocuments({ userId: userA.id })).toBe(0);
    expect(await Notification.countDocuments({ userId: userA.id })).toBe(0);
    expect(await UserBlock.countDocuments({ blockerId: userA.id })).toBe(0);
    expect(await OTPVerification.countDocuments({ userId: userA.id })).toBe(0);
    expect(await Story.findOne({ id: privateStoryId })).toBeNull();

    // Physical uploaded files removed on disk; User B's uploaded file untouched
    expect(fs.existsSync(avatarFile.fullPath)).toBe(false);
    expect(fs.existsSync(vaultFile.fullPath)).toBe(false);
    expect(fs.existsSync(diaryFile.fullPath)).toBe(false);
    expect(fs.existsSync(otherUserVaultFile.fullPath)).toBe(true);

    // 4. Shared stories, chat messages, and reviews anonymized while preserving conversation & ratings
    const anonymizedPubStory = await Story.findOne({ id: publicStoryId });
    expect(anonymizedPubStory?.author.name).toBe('Deleted User');
    expect(anonymizedPubStory?.author.id).not.toBe(userA.id);
    expect(anonymizedPubStory?.likedBy).toEqual([userB.id]);

    const chatMessages = await Message.find({ tripId });
    expect(chatMessages).toHaveLength(2);
    const anonymizedMsg = chatMessages.find((m) => m.text.includes('7 AM'));
    expect(anonymizedMsg?.sender.name).toBe('Deleted User');
    expect(anonymizedMsg?.sender.id).not.toBe(userA.id);

    const anonymizedReview = await TravellerReview.findOne({ tripId, revieweeId: userB.id });
    expect(anonymizedReview?.reviewerName).toBe('Deleted User');
    expect(anonymizedReview?.reviewerId).not.toBe(userA.id);
    expect(anonymizedReview?.ratings.overall).toBe(5);

    // 5. Retained compliance/audit data scrubbed of unneeded PII + User B untouched
    const retainedReport = await UserReport.findOne({ reporterId: userA.id });
    expect(retainedReport?.reporterName).toBe('Deleted User');
    const retainedIdentity = await IdentityVerification.findOne({ userId: userA.id });
    expect(retainedIdentity?.verificationMetadata?.checkSummary).toContain('redacted for compliance');
    const selfDeleteAudit = await AdminAuditLog.findOne({
      targetId: userA.id,
      action: 'ACCOUNT_SELF_DELETED',
    });
    expect(selfDeleteAudit).toBeTruthy();

    expect(await DiaryEntry.countDocuments({ userId: userB.id })).toBe(1);
    expect(await Notification.countDocuments({ userId: userB.id })).toBe(1);

    // 6. Admin Panel integration: filter deleted accounts, view details, block recovery/reactivation
    const adminListRes = await request(app)
      .get('/api/v1/admin/users?status=deleted')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminListRes.status).toBe(200);
    const foundDeleted = adminListRes.body.data.users.find((u: any) => u.id === userA.id);
    expect(foundDeleted?.isDeleted).toBe(true);
    expect(foundDeleted?.deletedAt).toBeTruthy();
    expect(foundDeleted?.email).toBeUndefined();

    const adminDetailRes = await request(app)
      .get(`/api/v1/admin/users/${userA.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDetailRes.status).toBe(200);
    expect(adminDetailRes.body.data.user.isDeleted).toBe(true);
    expect(
      adminDetailRes.body.data.activity.auditLogs.some(
        (l: any) => l.action === 'ACCOUNT_SELF_DELETED'
      )
    ).toBe(true);

    const adminReactivateAttempt = await request(app)
      .patch(`/api/v1/admin/users/${userA.id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isSuspended: false });
    expect(adminReactivateAttempt.status).toBe(403);

    const adminUpdateAttempt = await request(app)
      .put(`/api/v1/admin/users/${userA.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Recovered User' });
    expect(adminUpdateAttempt.status).toBe(403);
    expect(adminUser.id).toBeTruthy();
  });

  it('supports OAuth-only (Google) re-authentication flow and blocks mismatched Google account reauth', async () => {
    const tag = uniqueTag();
    const googleSub = `google_sub_${tag}`;
    const googleEmail = `oauth_del_${tag}@gmail.com`;
    const { user: oauthUser, token: oauthToken } = await createVerifiedUser({
      email: googleEmail,
      password: null,
      googleId: googleSub,
      isGoogleConnected: true,
      emailVerified: true,
    });

    // Cannot spoof password auth or fallback Apple phrase for a Google-connected account
    const badFallback = await request(app)
      .post('/api/users/me/deletion-reauth')
      .set('Authorization', `Bearer ${oauthToken}`)
      .send({ provider: 'passwordless', confirmationPhrase: 'DELETE MY ACCOUNT' });
    expect(badFallback.status).toBe(400);

    // Step A: Initiate Google OAuth reauth
    const initRes = await request(app)
      .get('/api/auth/google?mode=reauth&redirect=/app/account-security?action=delete-account')
      .set('Cookie', [`tripzobox_token=${oauthToken}`]);
    expect(initRes.status).toBe(302);
    const authUrl = new URL(initRes.headers.location);
    const state = authUrl.searchParams.get('state')!;
    const cookies = initRes.headers['set-cookie'] as string[];
    const stateCookie = cookies.find((c) => c.startsWith('tripzobox_oauth_state='))!;

    // Mismatched Google account reauth rejected (403)
    vi.spyOn(OAuth2Client.prototype, 'getToken').mockResolvedValue({
      tokens: { id_token: 'mock-id-token-other' },
    } as any);
    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: 'different_google_sub_999',
        email: 'different@gmail.com',
        email_verified: true,
        name: 'Different Person',
      }),
    } as any);

    const mismatchCb = await request(app)
      .get(`/api/auth/google/callback?code=mock_code&state=${encodeURIComponent(state)}`)
      .set('Accept', 'application/json')
      .set('Cookie', [stateCookie]);
    expect(mismatchCb.status).toBe(403);

    // Matching Google account reauth succeeds and issues tripzobox_reauth cookie
    const initRes2 = await request(app)
      .get('/api/auth/google?mode=reauth&redirect=/app/account-security?action=delete-account')
      .set('Cookie', [`tripzobox_token=${oauthToken}`]);
    const state2 = new URL(initRes2.headers.location).searchParams.get('state')!;
    const stateCookie2 = (initRes2.headers['set-cookie'] as string[]).find((c) =>
      c.startsWith('tripzobox_oauth_state=')
    )!;

    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: googleSub,
        email: googleEmail,
        email_verified: true,
        name: oauthUser.name,
      }),
    } as any);

    const okCb = await request(app)
      .get(`/api/auth/google/callback?code=mock_code&state=${encodeURIComponent(state2)}`)
      .set('Accept', 'application/json')
      .set('Cookie', [stateCookie2]);
    expect(okCb.status).toBe(200);
    expect(okCb.body.data.reauthenticated).toBe(true);
    const reauthCookie = (okCb.headers['set-cookie'] as string[]).find((c) =>
      c.startsWith('tripzobox_reauth=')
    )!;
    expect(reauthCookie).toBeTruthy();

    const { otpRes: oauthOtpRes, capturedOtp } = await requestAndCaptureOtp(oauthToken);
    expect(oauthOtpRes.status, JSON.stringify(oauthOtpRes.body)).toBe(200);
    vi.spyOn(emailService, 'sendAccountDeletionConfirmationEmail').mockResolvedValue({
      sent: true,
      isSimulated: true,
    });

    const delRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${oauthToken}`)
      .set('Cookie', [reauthCookie])
      .send({
        otp: capturedOtp,
        confirmationText: 'DELETE',
        confirmDeletion: true,
      });
    expect(delRes.status, JSON.stringify(delRes.body)).toBe(200);
    expect((await User.findOne({ id: oauthUser.id }))?.isDeleted).toBe(true);
  });

  it('releases deletion lock and leaves account & uploaded files intact if a database error occurs mid-deletion', async () => {
    const vaultFile = await createUploadFileOnDisk('rollback_vault');
    const { user, token } = await createVerifiedUser();
    await VaultDocument.create({
      id: `vdoc_fail_${uniqueTag()}`,
      userId: user.id,
      type: 'Other',
      name: 'Important Doc',
      fileUrl: vaultFile.url,
    });

    const { capturedOtp } = await requestAndCaptureOtp(token, 'SecretPass!123');
    vi.spyOn(Message, 'updateMany').mockRejectedValueOnce(
      new Error('Simulated transient MongoDB write failure')
    );

    const errRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'SecretPass!123',
        otp: capturedOtp,
        confirmDeletion: true,
      });
    expect(errRes.status).toBe(500);

    const survivingUser = await User.findOne({ id: user.id });
    expect(survivingUser?.isDeleted).toBe(false);
    expect(survivingUser?.deletionInProgress).toBe(false);
    expect(fs.existsSync(vaultFile.fullPath)).toBe(true);
  });

  it('supports Apple OAuth re-authentication, trip cancellation unblock with member notifications, and concurrent deletion lock protection', async () => {
    // 1. Apple OAuth account without password
    const { user: appleUser, token: appleToken } = await createVerifiedUser({
      password: null,
      isAppleConnected: true,
      emailVerified: true,
    });

    const badPhraseRes = await request(app)
      .post('/api/users/me/deletion-reauth')
      .set('Authorization', `Bearer ${appleToken}`)
      .send({ provider: 'apple', confirmationPhrase: 'wrong' });
    expect(badPhraseRes.status).toBe(400);

    const appleReauthRes = await request(app)
      .post('/api/users/me/deletion-reauth')
      .set('Authorization', `Bearer ${appleToken}`)
      .send({ provider: 'apple', confirmationPhrase: 'DELETE MY ACCOUNT' });
    expect(appleReauthRes.status).toBe(200);

    const { capturedOtp } = await requestAndCaptureOtp(appleToken);
    vi.spyOn(emailService, 'sendAccountDeletionConfirmationEmail').mockResolvedValue({
      sent: true,
      isSimulated: true,
    });

    const appleDeleteRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${appleToken}`)
      .send({
        otp: capturedOtp,
        confirmationText: 'DELETE',
        confirmDeletion: true,
      });
    expect(appleDeleteRes.status).toBe(200);
    expect((await User.findOne({ id: appleUser.id }))?.isDeleted).toBe(true);

    // 2. Trip leader unblocking via trip cancellation notifies members + concurrent lock returns 409
    const { user: leaderUser, token: leaderToken } = await createVerifiedUser();
    const { user: memberUser } = await createVerifiedUser();
    const cancelTripId = `trip_cancel_${uniqueTag()}`;
    createdTripIds.push(cancelTripId);

    await Trip.create({
      id: cancelTripId,
      name: 'Andaman Snorkeling Trip',
      destination: 'Havelock Island',
      startCity: 'Chennai',
      startDate: '2026-12-28',
      endDate: '2027-01-03',
      durationDays: 6,
      budgetPerPerson: 24000,
      maxMembers: 6,
      spotsLeft: 4,
      description: 'Island hopping trip.',
      coverImageUrl: 'https://example.com/andaman.jpg',
      status: 'open',
      leader: {
        id: leaderUser.id,
        name: leaderUser.name,
        username: leaderUser.username,
        avatarUrl: '',
        city: 'Chennai',
      },
      members: [
        { id: leaderUser.id, name: leaderUser.name, avatarUrl: '', role: 'Trip Leader' },
        { id: memberUser.id, name: memberUser.name, avatarUrl: '', role: 'Member' },
      ],
    });

    const cancelTripRes = await request(app)
      .delete(`/api/v1/trips/${cancelTripId}`)
      .set('Authorization', `Bearer ${leaderToken}`);
    expect(cancelTripRes.status).toBe(200);

    const memberCancelNotif = await Notification.findOne({ userId: memberUser.id });
    expect(memberCancelNotif?.title).toContain('Trip Cancelled');

    // Simulate concurrent in-progress lock
    await User.updateOne({ id: leaderUser.id }, { $set: { deletionInProgress: true } });
    const concurrentRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        currentPassword: 'SecretPass!123',
        confirmDeletion: true,
      });
    expect(concurrentRes.status).toBe(409);

    await User.updateOne({ id: leaderUser.id }, { $set: { deletionInProgress: false } });
    const { capturedOtp: leaderOtp } = await requestAndCaptureOtp(leaderToken, 'SecretPass!123');
    const leaderDeleteRes = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        currentPassword: 'SecretPass!123',
        otp: leaderOtp,
        confirmationText: 'DELETE',
        confirmDeletion: true,
      });
    expect(leaderDeleteRes.status).toBe(200);
  });
});
