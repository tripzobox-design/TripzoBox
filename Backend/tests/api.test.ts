import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

describe('TripzoBox Backend API Integration Tests', () => {
  let app: any;
  let authToken: string;
  let testUserId: string;
  let createdTripId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('Health Checks', () => {
    it('GET /health returns healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
    });

    it('GET /api/v1/health returns API operational status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe('1.0.0');
    });
  });

  describe('Authentication & Profile Flows', () => {
    const testEmail = `testuser_${Date.now()}@example.com`;

    it('POST /api/v1/auth/signup registers a new user with secure password hash', async () => {
      const res = await request(app).post('/api/v1/auth/signup').send({
        name: 'Test Explorer',
        emailOrPhone: testEmail,
        password: 'SecurePassword123!',
        city: 'Bengaluru',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.password).toBeUndefined(); // Password hash never exposed

      authToken = res.body.data.token;
      testUserId = res.body.data.user.id;
    });

    it('POST /api/v1/auth/signup rejects duplicate email accounts', async () => {
      const res = await request(app).post('/api/v1/auth/signup').send({
        name: 'Duplicate Person',
        emailOrPhone: testEmail,
        password: 'SecurePassword123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('POST /api/v1/auth/login succeeds with correct credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        emailOrPhone: testEmail,
        password: 'SecurePassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('POST /api/v1/auth/login rejects invalid password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        emailOrPhone: testEmail,
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/auth/me rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/auth/me returns current user profile with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('PUT /api/v1/auth/profile updates user bio and preferences', async () => {
      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'Solo hiker conquering Western Ghats',
          travelStyle: 'Solo',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.bio).toBe('Solo hiker conquering Western Ghats');
    });
  });

  describe('Trips & Discovery Flows', () => {
    it('GET /api/v1/trips lists public discoverable trips', async () => {
      const res = await request(app).get('/api/v1/trips');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/trips?search=Munnar filters trips accurately', async () => {
      const res = await request(app).get('/api/v1/trips?search=Munnar');
      expect(res.status).toBe(200);
      expect(res.body.data.some((t: any) => t.destination.includes('Munnar'))).toBe(true);
    });

    it('POST /api/v1/trips creates an authorized trip with leader set to current user', async () => {
      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Coorg Coffee Highlands Weekend',
          destination: 'Coorg, Karnataka',
          startCity: 'Bengaluru',
          startDate: '10 Jan 2026',
          endDate: '12 Jan 2026',
          durationDays: 2,
          budgetPerPerson: 4200,
          tripType: 'group',
          description: 'Explore scenic coffee estates and Abbey Falls with nature enthusiasts.',
          maxMembers: 4,
          difficulty: 'easy',
          coverImageUrl:
            'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Coorg Coffee Highlands Weekend');
      expect(res.body.data.leader.id).toBe(testUserId);
      expect(res.body.data.members.length).toBe(1); // Leader is first confirmed member
      expect(res.body.data.spotsLeft).toBe(3);

      createdTripId = res.body.data.id;
    });

    it('GET /api/v1/trips/:id retrieves specific trip details', async () => {
      const res = await request(app).get(`/api/v1/trips/${createdTripId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdTripId);
    });

    it('POST /api/v1/trips/saved/:id/toggle bookmarks a trip', async () => {
      const res = await request(app)
        .post(`/api/v1/trips/saved/${createdTripId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.saved).toBe(true);
    });
  });

  describe('Join Requests & Capacity Enforcement', () => {
    let secondUserToken: string;
    let targetTripId: string = 'trip_munnar_1';

    beforeAll(async () => {
      // Create a second user to submit join request
      const res = await request(app).post('/api/v1/auth/signup').send({
        name: 'Applicant User',
        emailOrPhone: `applicant_${Date.now()}@example.com`,
        password: 'Password123!',
      });
      secondUserToken = res.body.data.token;
    });

    it('POST /api/v1/trips/:id/join submits a join request', async () => {
      const res = await request(app)
        .post(`/api/v1/trips/${targetTripId}/join`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          message: 'Would love to join the Munnar adventure!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
    });

    it('POST /api/v1/trips/:id/join prevents duplicate active requests', async () => {
      const res = await request(app)
        .post(`/api/v1/trips/${targetTripId}/join`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          message: 'Trying to request again',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already have an active join request');
    });

    it('POST /api/v1/trips/:id/join prevents trip leader from joining their own trip', async () => {
      const res = await request(app)
        .post(`/api/v1/trips/${createdTripId}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Trying to join my own trip',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot submit a join request to your own trip');
    });
  });

  describe('Destinations & Stories', () => {
    it('GET /api/v1/destinations returns 8 seeded destinations matching Explore page', async () => {
      const res = await request(app).get('/api/v1/destinations');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(8);
    });

    it('GET /api/v1/stories returns public travel stories', async () => {
      const res = await request(app).get('/api/v1/stories');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Travel Vault & Privacy Security', () => {
    it('GET /api/v1/vault/documents rejects unauthenticated access to private documents', async () => {
      const res = await request(app).get('/api/v1/vault/documents');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/vault/documents allows authorized user to add private document', async () => {
      const res = await request(app)
        .post('/api/v1/vault/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'International Driving Permit',
          type: 'DrivingLicense',
          validTill: '01 Jan 2030',
          referenceNumber: 'IDP-998877',
          visibility: 'private',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('International Driving Permit');
    });
  });
});

