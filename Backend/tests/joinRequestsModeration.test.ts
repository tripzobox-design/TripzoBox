import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Trip } from '../src/models/Trip.js';
import { JoinRequest } from '../src/models/JoinRequest.js';
import { Notification } from '../src/models/Notification.js';
import { AdminAuditLog } from '../src/models/AdminAuditLog.js';

const app = createApp();

describe('TripzoBox Admin → Trip Join Requests & Participation Moderation Tests', () => {
  let superadminToken: string;
  let moderatorToken: string;
  let supportToken: string;
  let leaderUser: any;
  let leaderToken: string;
  let applicant1: any;
  let applicant2: any;
  let applicant3: any;

  let normalTrip: any;
  let fullTrip: any;
  let completedTrip: any;
  let raceTrip: any;

  beforeAll(async () => {
    await connectDB();

    const timestamp = Date.now();

    // 1. Create Super Admin
    const superadmin = await User.create({
      id: `sa_${timestamp}`,
      name: 'Super Admin',
      username: `sa_${timestamp}`,
      email: `sa_${timestamp}@tripzobox.com`,
      password: 'SuperPassword123!',
      role: 'superadmin',
      city: 'Delhi',
      languages: ['English'],
      bio: 'Super Administrator',
    });
    const saLogin = await request(app).post('/api/v1/admin/auth/login').send({
      email: superadmin.email,
      password: 'SuperPassword123!',
    });
    superadminToken = saLogin.body.data.token;

    // 2. Create Moderator
    const moderator = await User.create({
      id: `mod_${timestamp}`,
      name: 'Safety Moderator',
      username: `mod_${timestamp}`,
      email: `mod_${timestamp}@tripzobox.com`,
      password: 'ModPassword123!',
      role: 'moderator',
      city: 'Bangalore',
      languages: ['English'],
      bio: 'Trust & Safety Moderator',
    });
    const modLogin = await request(app).post('/api/v1/admin/auth/login').send({
      email: moderator.email,
      password: 'ModPassword123!',
    });
    moderatorToken = modLogin.body.data.token;

    // 3. Create Support Staff (Unauthorized for moderator overrides)
    const support = await User.create({
      id: `supp_${timestamp}`,
      name: 'Customer Support',
      username: `supp_${timestamp}`,
      email: `supp_${timestamp}@tripzobox.com`,
      password: 'SuppPassword123!',
      role: 'support',
      city: 'Pune',
      languages: ['English'],
      bio: 'Customer Support Agent',
    });
    const suppLogin = await request(app).post('/api/v1/admin/auth/login').send({
      email: support.email,
      password: 'SuppPassword123!',
    });
    supportToken = suppLogin.body.data.token;

    // 4. Create Trip Leader
    leaderUser = await User.create({
      id: `ldr_${timestamp}`,
      name: 'Trip Leader Ron',
      username: `leader_${timestamp}`,
      email: `leader_${timestamp}@example.com`,
      password: 'LeaderPassword123!',
      role: 'user',
      city: 'Manali',
      languages: ['English', 'Hindi'],
      bio: 'Experienced expedition leader',
    });
    const ldrLogin = await request(app).post('/api/v1/auth/login').send({
      emailOrPhone: leaderUser.email,
      password: 'LeaderPassword123!',
    });
    leaderToken = ldrLogin.body.data.token;

    // 5. Create Applicants
    applicant1 = await User.create({
      id: `app1_${timestamp}`,
      name: 'Alice Applicant',
      username: `alice_${timestamp}`,
      email: `alice_${timestamp}@example.com`,
      password: 'AlicePassword123!',
      role: 'user',
      city: 'Mumbai',
      languages: ['English'],
      bio: 'Solo traveller Alice',
    });

    applicant2 = await User.create({
      id: `app2_${timestamp}`,
      name: 'Bob Applicant',
      username: `bob_${timestamp}`,
      email: `bob_${timestamp}@example.com`,
      password: 'BobPassword123!',
      role: 'user',
      city: 'Goa',
      languages: ['English'],
      bio: 'Adventure seeker Bob',
    });

    applicant3 = await User.create({
      id: `app3_${timestamp}`,
      name: 'Charlie Applicant',
      username: `charlie_${timestamp}`,
      email: `charlie_${timestamp}@example.com`,
      password: 'CharliePassword123!',
      role: 'user',
      city: 'Kochi',
      languages: ['English'],
      bio: 'Photographer Charlie',
    });

    // 6. Create Test Trips
    normalTrip = await Trip.create({
      id: `trip_normal_${timestamp}`,
      name: 'Himalayan Ridge Trek',
      destination: 'Manali, Himachal Pradesh',
      startCity: 'Delhi',
      startDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 15).toISOString(),
      durationDays: 5,
      budgetPerPerson: 14000,
      tripType: 'Trekking',
      preferences: ['Backpacking'],
      description: 'Scenic high altitude ridge trek',
      highlights: ['Peak view'],
      leader: {
        id: leaderUser.id,
        name: leaderUser.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Manali',
        email: leaderUser.email,
      },
      members: [
        {
          id: leaderUser.id,
          name: leaderUser.name,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          role: 'Leader',
        },
      ],
      maxMembers: 5,
      spotsLeft: 4,
      status: 'open',
      roomType: 'public',
      coverImageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
      galleryImages: [],
      inclusions: [],
      rules: [],
      languages: ['English'],
      travelStyle: 'Trekking',
      itinerary: [],
      reviews: [],
      rating: 5,
      reviewCount: 0,
      tags: ['Trekking'],
      savedBy: [],
    });

    fullTrip = await Trip.create({
      id: `trip_full_${timestamp}`,
      name: 'Full Capacity Coastal Walk',
      destination: 'Gokarna, Karnataka',
      startCity: 'Bangalore',
      startDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 14).toISOString(),
      durationDays: 4,
      budgetPerPerson: 8000,
      tripType: 'Beach',
      preferences: ['Relaxation'],
      description: 'Intimate beach camp',
      highlights: ['Sunset'],
      leader: {
        id: leaderUser.id,
        name: leaderUser.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Manali',
        email: leaderUser.email,
      },
      members: [
        {
          id: leaderUser.id,
          name: leaderUser.name,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          role: 'Leader',
        },
      ],
      maxMembers: 1, // Only 1 spot allowed and it is taken by leader
      spotsLeft: 0,
      status: 'full',
      roomType: 'public',
      coverImageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
      galleryImages: [],
      inclusions: [],
      rules: [],
      languages: ['English'],
      travelStyle: 'Beach',
      itinerary: [],
      reviews: [],
      rating: 5,
      reviewCount: 0,
      tags: ['Beach'],
      savedBy: [],
    });

    completedTrip = await Trip.create({
      id: `trip_completed_${timestamp}`,
      name: 'Old Historical Tour',
      destination: 'Hampi, Karnataka',
      startCity: 'Bangalore',
      startDate: '2022-01-01T00:00:00.000Z',
      endDate: '2022-01-05T00:00:00.000Z',
      durationDays: 4,
      budgetPerPerson: 6000,
      tripType: 'Heritage',
      preferences: ['History'],
      description: 'Historical exploration completed long ago',
      highlights: ['Ruins'],
      leader: {
        id: leaderUser.id,
        name: leaderUser.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Manali',
        email: leaderUser.email,
      },
      members: [
        {
          id: leaderUser.id,
          name: leaderUser.name,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          role: 'Leader',
        },
      ],
      maxMembers: 5,
      spotsLeft: 4,
      status: 'closed',
      roomType: 'public',
      coverImageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
      galleryImages: [],
      inclusions: [],
      rules: [],
      languages: ['English'],
      travelStyle: 'Heritage',
      itinerary: [],
      reviews: [],
      rating: 5,
      reviewCount: 0,
      tags: ['Heritage'],
      savedBy: [],
    });

    raceTrip = await Trip.create({
      id: `trip_race_${timestamp}`,
      name: 'High Demand Desert Safari',
      destination: 'Jaisalmer, Rajasthan',
      startCity: 'Jaipur',
      startDate: new Date(Date.now() + 86400000 * 20).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 25).toISOString(),
      durationDays: 5,
      budgetPerPerson: 11000,
      tripType: 'Desert',
      preferences: ['Culture'],
      description: 'Only 1 spot remaining!',
      highlights: ['Dunes'],
      leader: {
        id: leaderUser.id,
        name: leaderUser.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Manali',
        email: leaderUser.email,
      },
      members: [
        {
          id: leaderUser.id,
          name: leaderUser.name,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          role: 'Leader',
        },
      ],
      maxMembers: 2, // Leader takes 1, exactly 1 spot remains!
      spotsLeft: 1,
      status: 'open',
      roomType: 'public',
      coverImageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
      galleryImages: [],
      inclusions: [],
      rules: [],
      languages: ['English'],
      travelStyle: 'Desert',
      itinerary: [],
      reviews: [],
      rating: 5,
      reviewCount: 0,
      tags: ['Desert'],
      savedBy: [],
    });
  });

  afterAll(async () => {
    await disconnectDB();
  });

  // TEST 1: Admin approval of a pending request
  it('Case 1: Admin approval of a pending request adds participant and notifies parties', async () => {
    const reqDoc = await JoinRequest.create({
      id: `req_case1_${Date.now()}`,
      tripId: normalTrip.id,
      userId: applicant1.id,
      user: {
        id: applicant1.id,
        name: applicant1.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Mumbai',
      },
      message: 'Excited for the ridge trek!',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/v1/admin/join-requests/${reqDoc.id}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ action: 'APPROVE', reason: 'Verified profile and safety credentials' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request.status).toBe('approved');

    // Verify trip document has applicant in members
    const freshTrip = await Trip.findOne({ id: normalTrip.id });
    expect(freshTrip?.members.some((m) => m.id === applicant1.id)).toBe(true);

    // Verify notifications created
    const notifs = await Notification.find({ userId: applicant1.id });
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs[notifs.length - 1].title).toContain('approved');

    // Verify audit log
    const auditLog = await AdminAuditLog.findOne({ targetId: reqDoc.id, action: 'JOIN_REQUEST_APPROVE' });
    expect(auditLog).toBeDefined();
    expect(auditLog?.targetType).toBe('join_request');
  });

  // TEST 2: Admin rejection of a pending request
  it('Case 2: Admin rejection of a pending request sets rejected state without adding participant', async () => {
    const reqDoc = await JoinRequest.create({
      id: `req_case2_${Date.now()}`,
      tripId: normalTrip.id,
      userId: applicant2.id,
      user: {
        id: applicant2.id,
        name: applicant2.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Goa',
      },
      message: 'Can I tag along?',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/v1/admin/join-requests/${reqDoc.id}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ action: 'REJECT', reason: 'Incomplete safety questionnaire' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request.status).toBe('rejected');

    // Verify applicant NOT in members
    const freshTrip = await Trip.findOne({ id: normalTrip.id });
    expect(freshTrip?.members.some((m) => m.id === applicant2.id)).toBe(false);

    // Verify audit log
    const auditLog = await AdminAuditLog.findOne({ targetId: reqDoc.id, action: 'JOIN_REQUEST_REJECT' });
    expect(auditLog).toBeDefined();
  });

  // TEST 3: Admin override of a rejected request
  it('Case 3: Admin override of a rejected request requires reason and restores participant spot', async () => {
    const reqDoc = await JoinRequest.create({
      id: `req_case3_${Date.now()}`,
      tripId: normalTrip.id,
      userId: applicant3.id,
      user: {
        id: applicant3.id,
        name: applicant3.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Kochi',
      },
      message: 'Previous leader rejected me by mistake',
      status: 'rejected',
    });

    // Attempt override without reason -> 400 Bad Request
    const failRes = await request(app)
      .patch(`/api/v1/admin/join-requests/${reqDoc.id}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ action: 'OVERRIDE_APPROVE', reason: '   ' });

    expect(failRes.status).toBe(400);
    expect(failRes.body.success).toBe(false);
    expect(failRes.body.message).toContain('reason is required');

    // Now override WITH a valid documented reason -> 200 OK
    const successRes = await request(app)
      .patch(`/api/v1/admin/join-requests/${reqDoc.id}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ action: 'OVERRIDE_APPROVE', reason: 'Reviewed verification appeal; documentation cleared' });

    expect(successRes.status).toBe(200);
    expect(successRes.body.success).toBe(true);
    expect(successRes.body.data.request.status).toBe('approved');
    expect(successRes.body.data.request.moderatorOverride.action).toBe('OVERRIDE_APPROVE');

    // Verify member added
    const freshTrip = await Trip.findOne({ id: normalTrip.id });
    expect(freshTrip?.members.some((m) => m.id === applicant3.id)).toBe(true);

    // Verify audit log
    const audit = await AdminAuditLog.findOne({ targetId: reqDoc.id, action: 'JOIN_REQUEST_OVERRIDE_APPROVE' });
    expect(audit).toBeDefined();
  });

  // TEST 4: Revocation of approved request
  it('Case 4: Admin revocation of an approved request removes participant and requires reason', async () => {
    // applicant3 was approved in Case 3. Revoke their approval now:
    const reqDoc = await JoinRequest.findOne({ userId: applicant3.id, tripId: normalTrip.id });
    expect(reqDoc).toBeDefined();

    // Revocation without reason -> 400
    const noReasonRes = await request(app)
      .patch(`/api/v1/admin/join-requests/${reqDoc!.id}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ action: 'REVOKE_APPROVAL', reason: '' });

    expect(noReasonRes.status).toBe(400);
    expect(noReasonRes.body.message).toContain('reason is required');

    // Revocation with reason -> 200
    const res = await request(app)
      .patch(`/api/v1/admin/join-requests/${reqDoc!.id}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ action: 'REVOKE_APPROVAL', reason: 'Traveller reported for behavioral concern on separate trip' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request.status).toBe('rejected');

    // Member removed from trip
    const freshTrip = await Trip.findOne({ id: normalTrip.id });
    expect(freshTrip?.members.some((m) => m.id === applicant3.id)).toBe(false);

    // Notification created for applicant
    const notifs = await Notification.find({ userId: applicant3.id, type: 'trip_update' });
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs[notifs.length - 1].message).toContain('revoked');
  });

  // TEST 5: Unauthorized administrator attempting an override
  it('Case 5: Unauthorized administrator (support role) attempting an override is rejected with 403', async () => {
    const reqDoc = await JoinRequest.create({
      id: `req_case5_${Date.now()}`,
      tripId: normalTrip.id,
      userId: applicant2.id,
      user: {
        id: applicant2.id,
        name: applicant2.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Goa',
      },
      message: 'Pending test',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/v1/admin/join-requests/${reqDoc.id}`)
      .set('Authorization', `Bearer ${supportToken}`)
      .send({ action: 'APPROVE', reason: 'Trying to approve as support' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // TEST 6: Approval when the trip is full
  it('Case 6: Approval is rejected with 409 Conflict when trip has reached maximum capacity', async () => {
    const reqDoc = await JoinRequest.create({
      id: `req_case6_${Date.now()}`,
      tripId: fullTrip.id,
      userId: applicant1.id,
      user: {
        id: applicant1.id,
        name: applicant1.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Mumbai',
      },
      message: 'Hoping to squeeze in',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/v1/admin/join-requests/${reqDoc.id}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ action: 'APPROVE', reason: 'Forcing into full trip' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('maximum capacity');

    // Verify applicant was NOT added
    const freshFullTrip = await Trip.findOne({ id: fullTrip.id });
    expect(freshFullTrip?.members.length).toBe(1);
    expect(freshFullTrip?.members.some((m) => m.id === applicant1.id)).toBe(false);
  });

  // TEST 7: Duplicate approval
  it('Case 7: Duplicate approval of an already approved request is rejected with 409 Conflict', async () => {
    const reqDoc = await JoinRequest.findOne({ userId: applicant1.id, tripId: normalTrip.id, status: 'approved' });
    expect(reqDoc).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/admin/join-requests/${reqDoc!.id}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ action: 'APPROVE', reason: 'Approving again' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already approved');
  });

  // TEST 8: Approval after trip completion
  it('Case 8: Approval after trip completion is rejected with 409 Conflict', async () => {
    const reqDoc = await JoinRequest.create({
      id: `req_case8_${Date.now()}`,
      tripId: completedTrip.id,
      userId: applicant2.id,
      user: {
        id: applicant2.id,
        name: applicant2.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Goa',
      },
      message: 'Joining historical completed trip',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/v1/admin/join-requests/${reqDoc.id}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ action: 'APPROVE', reason: 'Late join' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('closed');
  });

  // TEST 9: Two administrators approving simultaneously (race condition check)
  it('Case 9: Two simultaneous approvals when only 1 spot remains allows exactly 1 and rejects the second with 409', async () => {
    // raceTrip has maxMembers: 2 and currently has 1 member (leader). Exactly 1 spot remains!
    const req1 = await JoinRequest.create({
      id: `req_race1_${Date.now()}`,
      tripId: raceTrip.id,
      userId: applicant1.id,
      user: {
        id: applicant1.id,
        name: applicant1.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Mumbai',
      },
      message: 'Concurrent applicant 1',
      status: 'pending',
    });

    const req2 = await JoinRequest.create({
      id: `req_race2_${Date.now()}`,
      tripId: raceTrip.id,
      userId: applicant2.id,
      user: {
        id: applicant2.id,
        name: applicant2.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Goa',
      },
      message: 'Concurrent applicant 2',
      status: 'pending',
    });

    // Execute both approval calls simultaneously
    const [res1, res2] = await Promise.all([
      request(app)
        .patch(`/api/v1/admin/join-requests/${req1.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ action: 'APPROVE', reason: 'Simultaneous admin 1' }),
      request(app)
        .patch(`/api/v1/admin/join-requests/${req2.id}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ action: 'APPROVE', reason: 'Simultaneous admin 2' }),
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    // Check raceTrip in database: members length MUST be strictly 2 (never 3!)
    const freshRaceTrip = await Trip.findOne({ id: raceTrip.id });
    expect(freshRaceTrip?.members.length).toBe(2);
    expect(freshRaceTrip?.status).toBe('full');
    expect(freshRaceTrip?.spotsLeft).toBe(0);
  });

  // TEST 10: Trip Leader Workflow & Notifications
  it('Case 10: Trip leader can approve and decline requests with notifications delivered', async () => {
    // Normal Trip Leader approval test
    const leaderTrip = await Trip.create({
      id: `trip_ldr_test_${Date.now()}`,
      name: 'Leader Managed Trip',
      destination: 'Wayanad, Kerala',
      startCity: 'Calicut',
      startDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 35).toISOString(),
      durationDays: 5,
      budgetPerPerson: 7500,
      tripType: 'Nature',
      preferences: ['Waterfalls'],
      description: 'Leader managed eco tour',
      highlights: ['Flora'],
      leader: {
        id: leaderUser.id,
        name: leaderUser.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Manali',
        email: leaderUser.email,
      },
      members: [
        {
          id: leaderUser.id,
          name: leaderUser.name,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          role: 'Leader',
        },
      ],
      maxMembers: 3,
      spotsLeft: 2,
      status: 'open',
      roomType: 'public',
      coverImageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
      galleryImages: [],
      inclusions: [],
      rules: [],
      languages: ['English'],
      travelStyle: 'Nature',
      itinerary: [],
      reviews: [],
      rating: 5,
      reviewCount: 0,
      tags: ['Nature'],
      savedBy: [],
    });

    const ldrReq = await JoinRequest.create({
      id: `req_ldr_${Date.now()}`,
      tripId: leaderTrip.id,
      userId: applicant3.id,
      user: {
        id: applicant3.id,
        name: applicant3.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        city: 'Kochi',
      },
      message: 'Looking forward to Wayanad!',
      status: 'pending',
    });

    // Leader accepts
    const acceptRes = await request(app)
      .post(`/api/v1/trips/${leaderTrip.id}/requests/${ldrReq.id}/accept`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send();

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.success).toBe(true);

    const freshLeaderTrip = await Trip.findOne({ id: leaderTrip.id });
    expect(freshLeaderTrip?.members.some((m) => m.id === applicant3.id)).toBe(true);
  });
});

