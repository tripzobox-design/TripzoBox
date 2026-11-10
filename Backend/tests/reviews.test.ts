import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Trip } from '../src/models/Trip.js';
import { TravellerReview } from '../src/models/TravellerReview.js';
import { signToken } from '../src/utils/token.js';

describe('TripzoBox Traveller Reviews & Peer Reputation — Automated Tests', () => {
  let app: any;
  let leaderUser: any;
  let memberUser: any;
  let outsideUser: any;
  let leaderToken: string;
  let memberToken: string;
  let completedTrip: any;

  beforeAll(async () => {
    await connectDB();
    app = createApp();

    // Clean up test data
    await TravellerReview.deleteMany({ tripId: 'test_completed_trip_1' });
    await Trip.deleteMany({ id: 'test_completed_trip_1' });
    await User.deleteMany({ email: { $in: ['rev_leader@test.com', 'rev_member@test.com', 'rev_outsider@test.com'] } });

    // Seed test users
    leaderUser = await User.create({
      id: `usr_leader_${Date.now()}`,
      name: 'Leader Alice',
      username: `leader_${Date.now()}`,
      email: 'rev_leader@test.com',
      password: 'Password123!',
      role: 'user',
      emailVerified: true,
      city: 'Bangalore',
      country: 'India',
    });

    memberUser = await User.create({
      id: `usr_member_${Date.now()}`,
      name: 'Member Bob',
      username: `member_${Date.now()}`,
      email: 'rev_member@test.com',
      password: 'Password123!',
      role: 'user',
      emailVerified: true,
      city: 'Mumbai',
      country: 'India',
    });

    outsideUser = await User.create({
      id: `usr_outsider_${Date.now()}`,
      name: 'Outsider Charlie',
      username: `outsider_${Date.now()}`,
      email: 'rev_outsider@test.com',
      password: 'Password123!',
      role: 'user',
      emailVerified: true,
      city: 'Delhi',
      country: 'India',
    });

    leaderToken = signToken({ userId: leaderUser.id, email: leaderUser.email, role: 'user' });
    memberToken = signToken({ userId: memberUser.id, email: memberUser.email, role: 'user' });

    // Seed completed trip
    completedTrip = await Trip.create({
      id: 'test_completed_trip_1',
      name: 'Completed Himalayan Trek',
      destination: 'Manali, Himachal Pradesh',
      startCity: 'Delhi',
      startDate: '2025-01-01',
      endDate: '2025-01-05',
      durationDays: 5,
      budgetPerPerson: 6500,
      tripType: 'group',
      roomType: 'public',
      status: 'closed', // completed trip
      maxMembers: 6,
      description: 'An unforgettable trek across Manali passes and cedar forests.',
      coverImageUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800',
      leader: {
        id: leaderUser.id,
        name: leaderUser.name,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      },
      members: [
        {
          id: memberUser.id,
          name: memberUser.name,
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
          joinedAt: new Date(),
        },
      ],
    });
  });

  afterAll(async () => {
    await TravellerReview.deleteMany({ tripId: 'test_completed_trip_1' });
    await Trip.deleteMany({ id: 'test_completed_trip_1' });
    await User.deleteMany({ email: { $in: ['rev_leader@test.com', 'rev_member@test.com', 'rev_outsider@test.com'] } });
    await disconnectDB();
  });

  it('rejects self-reviews with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/v1/safety/reviews')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        tripId: completedTrip.id,
        revieweeId: leaderUser.id,
        ratings: { overall: 5, communication: 5, punctuality: 5, cooperation: 5 },
        comment: 'I am the best leader ever!',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot review yourself/i);
  });

  it('rejects reviews if reviewer did not participate in the trip with HTTP 403', async () => {
    const outsiderToken = signToken({ userId: outsideUser.id, email: outsideUser.email, role: 'user' });
    const res = await request(app)
      .post('/api/v1/safety/reviews')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        tripId: completedTrip.id,
        revieweeId: memberUser.id,
        ratings: { overall: 5, communication: 5, punctuality: 5, cooperation: 5 },
        comment: 'Great traveller even though I was not there.',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/did not join/i);
  });

  it('successfully submits a verified traveller review with all 6 categories and tags', async () => {
    const res = await request(app)
      .post('/api/v1/safety/reviews')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        tripId: completedTrip.id,
        revieweeId: memberUser.id,
        ratings: {
          overall: 5,
          friendliness: 5,
          communication: 5,
          punctuality: 4,
          cooperation: 5,
          responsibility: 5,
        },
        tags: ['Friendly', 'Cooperative', 'Punctual'],
        comment: 'Bob was an outstanding companion throughout the Manali trek. Always on time and very positive.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.review.ratings.overall).toBe(5);
    expect(res.body.data.updatedReputation.averageRating).toBe(5);
    expect(res.body.data.updatedReputation.reviewCount).toBe(1);
    expect(res.body.data.updatedReputation.ratingDistribution[5]).toBe(1);
  });

  it('prevents duplicate reviews for the same traveller on the same trip with HTTP 409', async () => {
    const res = await request(app)
      .post('/api/v1/safety/reviews')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        tripId: completedTrip.id,
        revieweeId: memberUser.id,
        ratings: { overall: 4, communication: 4, punctuality: 4, cooperation: 4 },
        comment: 'Submitting a duplicate review should fail.',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already submitted a review/i);
  });

  it('retrieves user reviews with star distribution, categories, and positive tags', async () => {
    const res = await request(app).get(`/api/v1/safety/reviews/user/${memberUser.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stats.totalReviews).toBe(1);
    expect(res.body.data.stats.averageRating).toBe(5);
    expect(res.body.data.stats.distribution[5].count).toBe(1);
    expect(res.body.data.stats.distribution[5].percent).toBe(100);
    expect(res.body.data.stats.positiveTags.length).toBeGreaterThan(0);
    expect(res.body.data.reviews.length).toBe(1);
  });

  it('allows reporting an inappropriate review for moderation with HTTP 200', async () => {
    const review = await TravellerReview.findOne({ revieweeId: memberUser.id });
    expect(review).toBeDefined();

    const res = await request(app)
      .post(`/api/v1/safety/reviews/${review?.id}/report`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        reason: 'Report review test reason for safety inspection',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await TravellerReview.findOne({ id: review?.id });
    expect(updated?.isReported).toBe(true);
    expect(updated?.status).toBe('flagged');
  });

  it('returns reviewable companions for the logged-in traveller', async () => {
    const res = await request(app)
      .get('/api/v1/safety/reviews/companions')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.companions)).toBe(true);
    // Member can review the leader
    const companion = res.body.data.companions.find((c: any) => c.companionId === leaderUser.id);
    expect(companion).toBeDefined();
    expect(companion.alreadyReviewed).toBe(false);
  });

  it('allows submitting a review without a written comment (comment is optional)', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        tripId: completedTrip.id,
        revieweeId: leaderUser.id,
        ratings: {
          friendliness: 5,
          communication: 4,
          punctuality: 5,
          cooperation: 4,
          responsibility: 5,
        },
        tags: ['Punctual', 'Responsible'],
        // Note: comment is intentionally omitted
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.review.comment).toBe('');
    expect(res.body.data.review.ratings.overall).toBe(4.6);
  });

  it('fetches trip review eligibility and participants status via GET /api/v1/reviews/trip/:tripId', async () => {
    const res = await request(app)
      .get(`/api/v1/reviews/trip/${completedTrip.id}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isEligible).toBe(true);
    expect(Array.isArray(res.body.data.participants)).toBe(true);

    const leaderStatus = res.body.data.participants.find((p: any) => p.id === leaderUser.id);
    expect(leaderStatus).toBeDefined();
    expect(leaderStatus.hasReviewed).toBe(true);
  });

  it('fetches user review summary via GET /api/v1/reviews/summary/:userId', async () => {
    const res = await request(app).get(`/api/v1/reviews/summary/${leaderUser.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalReviews).toBe(1);
    expect(res.body.data.categoryAverages.friendliness).toBe(5);
  });

  it('admin can hide a review via PATCH /api/v1/admin/reviews/:id/status and it recalculates reputation', async () => {
    const adminUser = await User.create({
      id: `usr_adm_${Date.now()}`,
      name: 'Super Admin',
      username: `adm_${Date.now()}`,
      email: `rev_admin_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'superadmin',
      city: 'Delhi',
      country: 'India',
    });
    const adminToken = signToken({ userId: adminUser.id, email: adminUser.email, role: 'superadmin' });

    const review = await TravellerReview.findOne({ revieweeId: leaderUser.id });
    expect(review).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/admin/reviews/${review?.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'hidden',
        moderationNote: 'Inappropriate content hidden by moderator test',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.review.status).toBe('hidden');

    // Verify hidden review is excluded from public reviews list
    const publicRes = await request(app).get(`/api/v1/reviews/user/${leaderUser.id}`);
    expect(publicRes.body.data.reviews.length).toBe(0);

    await User.deleteOne({ id: adminUser.id });
  });
});
