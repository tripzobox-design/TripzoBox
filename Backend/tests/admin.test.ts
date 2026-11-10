import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Trip } from '../src/models/Trip.js';
import { WebsiteContent } from '../src/models/WebsiteContent.js';
import { PlatformSettings } from '../src/models/PlatformSettings.js';
import { AdminAuditLog } from '../src/models/AdminAuditLog.js';

const app = createApp();

describe('TripzoBox Admin Control Panel — Integration & Security Tests', () => {
  let adminToken: string;
  let userToken: string;
  let testUserId: string;
  let testTripId: string;

  beforeAll(async () => {
    await connectDB();

    // Create a regular user
    const regularUser = await User.create({
      id: `test_regular_${Date.now()}`,
      name: 'Regular Explorer',
      username: `explorer_${Date.now()}`,
      email: `regular_${Date.now()}@example.com`,
      password: 'UserPassword123!',
      role: 'user',
      city: 'Mumbai',
      languages: ['English'],
      bio: 'Regular traveller',
    });
    testUserId = regularUser.id;

    // Login as regular user to get token
    const userLoginRes = await request(app).post('/api/v1/auth/login').send({
      emailOrPhone: regularUser.email,
      password: 'UserPassword123!',
    });
    userToken = userLoginRes.body.data.token;

    // Create an admin user
    const adminUser = await User.create({
      id: `test_admin_${Date.now()}`,
      name: 'Admin Test',
      username: `admin_${Date.now()}`,
      email: `admin_${Date.now()}@tripzobox.com`,
      password: 'AdminPassword123!',
      role: 'superadmin',
      city: 'Bangalore',
      languages: ['English'],
      bio: 'Administrator',
    });

    // Login via admin endpoint
    const adminLoginRes = await request(app).post('/api/v1/admin/auth/login').send({
      email: adminUser.email,
      password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.body.data.token;

    // Create a test trip
    const trip = await Trip.create({
      id: `trip_test_${Date.now()}`,
      name: 'Himalayan Ridge Expedition',
      destination: 'Manali, Himachal Pradesh',
      startCity: 'Delhi',
      startDate: '2026-12-01',
      endDate: '2026-12-07',
      durationDays: 6,
      budgetPerPerson: 15000,
      tripType: 'solo',
      preferences: ['Hiking'],
      maxMembers: 8,
      leader: {
        id: regularUser.id,
        name: regularUser.name,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      },
      status: 'open',
      roomType: 'public',
      description: 'Scenic high altitude trek across snow passes.',
      coverImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    });
    testTripId = trip.id;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('1. Rejects unauthenticated requests to admin endpoints', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
  });

  it('2. Rejects regular users from accessing admin routes (RBAC Enforcement)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Admin authorization required');
  });

  it('3. Allows authorized admin to access dashboard stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('counts');
    expect(res.body.data).toHaveProperty('charts');
    expect(typeof res.body.data.counts.totalUsers).toBe('number');
  });

  it('4. Admin can list users with pagination and search', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users?limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.users).toBeInstanceOf(Array);
    expect(res.body.data.pagination).toHaveProperty('total');
  });

  it('5. Admin can suspend and reactivate a user account', async () => {
    // Suspend
    const suspendRes = await request(app)
      .patch(`/api/v1/admin/users/${testUserId}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isSuspended: true, reason: 'Policy violation during group event' });
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.user.isSuspended).toBe(true);

    // Verify suspended user cannot access authenticated routes
    const blockedRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.message).toContain('suspended');

    // Reactivate
    const reactivateRes = await request(app)
      .patch(`/api/v1/admin/users/${testUserId}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isSuspended: false });
    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.data.user.isSuspended).toBe(false);
  });

  it('6. Admin can moderate trips (e.g. hide or close)', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/trips/${testTripId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'closed', reason: 'Unfavorable weather advisory' });
    expect(res.status).toBe(200);
    expect(res.body.data.trip.status).toBe('closed');
  });

  it('7. Admin can update CMS website content dynamically', async () => {
    const cmsUpdate = {
      hero: {
        headingLine1: 'Explore The World Together',
        headingHighlight: 'Safely and Freely',
        description: 'Updated dynamic tagline from CMS Control Panel',
      },
    };

    const res = await request(app)
      .put('/api/v1/admin/cms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(cmsUpdate);
    expect(res.status).toBe(200);

    // Public website endpoint should reflect updated CMS content immediately
    const publicRes = await request(app).get('/api/v1/content/homepage');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.hero.headingLine1).toBe('Explore The World Together');
    expect(publicRes.body.data.hero.description).toBe('Updated dynamic tagline from CMS Control Panel');
  });

  it('8. Admin can update global platform settings', async () => {
    const settingsUpdate = {
      websiteName: 'TripzoBox Global',
      contactEmail: 'operations@tripzobox.com',
      registrationEnabled: true,
      maintenanceMode: false,
    };

    const res = await request(app)
      .put('/api/v1/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(settingsUpdate);
    expect(res.status).toBe(200);

    // Public settings endpoint
    const publicSettings = await request(app).get('/api/v1/settings/public');
    expect(publicSettings.status).toBe(200);
    expect(publicSettings.body.data.websiteName).toBe('TripzoBox Global');
    expect(publicSettings.body.data.contactEmail).toBe('operations@tripzobox.com');
  });

  it('9. Logs administrative actions into immutable Audit Logs', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.logs.length).toBeGreaterThan(0);
    expect(res.body.data.logs[0]).toHaveProperty('action');
    expect(res.body.data.logs[0]).toHaveProperty('adminEmail');
  });

  it('10. Monitors SMS and Email service status without leaking credentials', async () => {
    const res = await request(app)
      .get('/api/v1/admin/system/services')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('emailService');
    expect(res.body.data).toHaveProperty('smsService');
    // Ensure masked passwords / keys
    if (res.body.data.emailService.passwordMasked && res.body.data.emailService.passwordMasked !== 'Not Configured') {
      expect(res.body.data.emailService.passwordMasked).toContain('••••');
    }
    if (res.body.data.smsService.apiKeyMasked && res.body.data.smsService.apiKeyMasked !== 'Not Configured') {
      expect(res.body.data.smsService.apiKeyMasked).toContain('••••');
    }
  });

  it('11. Supports date range filtering on dashboard analytics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard?range=7d')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.range).toBe('7d');
    expect(res.body.data.charts).toHaveProperty('userGrowth');
    expect(res.body.data.charts).toHaveProperty('tripStatusDistribution');
    expect(res.body.data.charts).toHaveProperty('verificationDistribution');
  });

  it('12. Enforces password reset requirement and adds moderation notes', async () => {
    // Require password reset
    const resetRes = await request(app)
      .patch(`/api/v1/admin/users/${testUserId}/require-password-reset`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Security routine update' });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.data.user.mustResetPassword).toBe(true);

    // Add moderation note
    const noteRes = await request(app)
      .post(`/api/v1/admin/users/${testUserId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Verified phone authenticity manually via call' });
    expect(noteRes.status).toBe(200);
    expect(noteRes.body.data.internalNotes.length).toBeGreaterThan(0);
  });

  it('13. Admin can list and manage destinations via CMS', async () => {
    const createRes = await request(app)
      .post('/api/v1/admin/destinations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Wayanad Tea Gardens',
        state: 'Kerala',
        category: 'Nature',
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        shortDescription: 'Misty hills and rolling tea plantations in Kerala.',
        topAttractions: ['Chembra Peak', 'Banasura Sagar Dam'],
        isHiddenSpot: false,
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.destination.name).toBe('Wayanad Tea Gardens');

    const destId = createRes.body.data.destination.id;

    // List destinations
    const listRes = await request(app)
      .get('/api/v1/admin/destinations?search=Wayanad')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.destinations.length).toBeGreaterThan(0);

    // Clean up
    await request(app)
      .delete(`/api/v1/admin/destinations/${destId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  it('14. Serves public CMS pages dynamically', async () => {
    const res = await request(app).get('/api/v1/content/pages/terms');
    expect(res.status).toBe(200);
    expect(res.body.data.page).toBe('terms');
    expect(res.body.data.content).toContain('TripzoBox Terms');
  });

  it('15. Retrieves complete RBAC role definitions', async () => {
    const res = await request(app)
      .get('/api/v1/admin/roles/permissions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.roles.length).toBe(5);
    const roles = res.body.data.roles.map((r: any) => r.role);
    expect(roles).toContain('superadmin');
    expect(roles).toContain('admin');
    expect(roles).toContain('moderator');
    expect(roles).toContain('support');
    expect(roles).toContain('content_manager');
  });

  it('16. Media library lists files securely', async () => {
    const res = await request(app)
      .get('/api/v1/admin/media')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('files');
    expect(typeof res.body.data.total).toBe('number');
  });
});
