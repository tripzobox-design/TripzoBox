import crypto from 'crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Trip } from '../src/models/Trip.js';
import { VaultDocument } from '../src/models/VaultDocument.js';
import { SharedAccessRecord } from '../src/models/VaultSettings.js';
import { Notification } from '../src/models/Notification.js';
import { signToken } from '../src/utils/token.js';

describe('Travel Vault Document Metadata, Online Visibility & Eligible Contact Sharing', () => {
  let app: any;
  const createdUserIds: string[] = [];
  const createdTripIds: string[] = [];
  const createdDocIds: string[] = [];

  const uid = () => `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const createTestUser = async (overrides: Record<string, any> = {}) => {
    const tag = uid();
    const user = new User({
      id: `user_vault_share_${tag}`,
      name: overrides.name || `Vault Traveller ${tag}`,
      username: overrides.username || `vtrav_${tag}`,
      email: `vtrav_${tag}@example.com`,
      password: 'Password!123',
      emailVerified: true,
      isDeleted: overrides.isDeleted ?? false,
      isSuspended: overrides.isSuspended ?? false,
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

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    app = createApp();
  });

  afterAll(async () => {
    if (createdDocIds.length > 0) {
      await SharedAccessRecord.deleteMany({ documentId: { $in: createdDocIds } });
      await VaultDocument.deleteMany({ id: { $in: createdDocIds } });
    }
    if (createdTripIds.length > 0) {
      await Trip.deleteMany({ id: { $in: createdTripIds } });
    }
    if (createdUserIds.length > 0) {
      await Notification.deleteMany({ userId: { $in: createdUserIds } });
      await User.deleteMany({ id: { $in: createdUserIds } });
    }
    await disconnectDB();
  });

  it('stores category-specific details + online fileUrl, discovers active TripzoBox accounts, and enforces eligible shared viewing', async () => {
    const { user: owner, token: ownerToken } = await createTestUser({ name: 'Aarav Owner' });
    const { user: recipient, token: recipientToken } = await createTestUser({
      name: 'Meera Companion',
    });
    const { user: bystander, token: bystanderToken } = await createTestUser({
      name: 'Other User',
    });
    const { user: deletedUser } = await createTestUser({
      name: 'Deleted Person',
      isDeleted: true,
    });

    // Shared trip makes Meera appear prioritized as a Trip companion
    const tripId = `trip_vs_${uid()}`;
    createdTripIds.push(tripId);
    await Trip.create({
      id: tripId,
      name: 'Valley Co-Travel',
      destination: 'Coorg',
      startCity: 'Bengaluru',
      startDate: '2026-12-01',
      endDate: '2026-12-04',
      durationDays: 4,
      budgetPerPerson: 9000,
      maxMembers: 5,
      spotsLeft: 3,
      description: 'Trip for co-traveler discovery.',
      coverImageUrl: 'https://example.com/coorg.jpg',
      leader: { id: owner.id, name: owner.name, username: owner.username, avatarUrl: '' },
      members: [
        { id: owner.id, name: owner.name, avatarUrl: '', role: 'Trip Leader' },
        { id: recipient.id, name: recipient.name, avatarUrl: '', role: 'Member' },
      ],
    });

    // 1. Search eligible TripzoBox contacts: excludes self & deleted users, prioritizes companion
    const searchRes = await request(app)
      .get(`/api/v1/vault/contacts/search?q=Meera`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.some((c: any) => c.id === recipient.id && c.isCoTraveler === true)).toBe(
      true
    );
    expect(searchRes.body.data.some((c: any) => c.id === owner.id)).toBe(false);

    const deletedSearch = await request(app)
      .get(`/api/v1/vault/contacts/search?q=Deleted`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(deletedSearch.body.data.some((c: any) => c.id === deletedUser.id)).toBe(false);

    // 2. Owner creates ID Card document with custom ID, category metadata, and online fileUrl
    const customDocId = `doc_${uid()}`;
    createdDocIds.push(customDocId);
    const createDocRes = await request(app)
      .post('/api/v1/vault/documents')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        id: customDocId,
        type: 'Aadhaar',
        category: 'ID Card',
        name: 'College / University ID Card',
        referenceNumber: 'KCE-2026-091',
        validTill: 'Lifetime',
        issuingCountry: 'India',
        fileUrl: 'http://localhost:5000/uploads/sample-id-card.png',
        fileName: 'sample-id-card.png',
        fileMime: 'image/png',
        visibility: 'private',
        details: {
          idSubType: 'College / Work ID',
          issuingAuthority: 'Karpagam College of Engineering',
        },
      });
    expect(createDocRes.status).toBe(201);
    expect(createDocRes.body.data.id).toBe(customDocId);
    expect(createDocRes.body.data.fileUrl).toBe('http://localhost:5000/uploads/sample-id-card.png');
    expect(createDocRes.body.data.details.issuingAuthority).toBe(
      'Karpagam College of Engineering'
    );

    // Non-owner cannot share someone else's document
    const forbiddenShareRes = await request(app)
      .post('/api/v1/vault/shared-access')
      .set('Authorization', `Bearer ${bystanderToken}`)
      .send({
        documentId: customDocId,
        sharedWithUserId: recipient.id,
        sharedWithName: recipient.name,
        permission: 'View',
      });
    expect(forbiddenShareRes.status).toBe(404);

    // Owner cannot share with deleted account
    const deletedShareRes = await request(app)
      .post('/api/v1/vault/shared-access')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        documentId: customDocId,
        sharedWithUserId: deletedUser.id,
        sharedWithName: deletedUser.name,
        permission: 'View',
      });
    expect(deletedShareRes.status).toBe(404);

    // 3. Owner shares document with eligible TripzoBox account Meera
    const shareRes = await request(app)
      .post('/api/v1/vault/shared-access')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        documentId: customDocId,
        documentName: 'College / University ID Card',
        documentType: 'Aadhaar',
        sharedWithUserId: recipient.id,
        sharedWithName: recipient.name,
        permission: 'View • Download',
        expires: '7 days',
      });
    expect(shareRes.status).toBe(201);
    const shareId = shareRes.body.data.id;

    // 4. Eligible recipient sees document & online fileUrl in /shared-with-me; bystander sees none
    const recipientInboxRes = await request(app)
      .get('/api/v1/vault/shared-with-me')
      .set('Authorization', `Bearer ${recipientToken}`);
    expect(recipientInboxRes.status).toBe(200);
    expect(recipientInboxRes.body.data).toHaveLength(1);
    expect(recipientInboxRes.body.data[0].document.id).toBe(customDocId);
    expect(recipientInboxRes.body.data[0].document.fileUrl).toBe(
      'http://localhost:5000/uploads/sample-id-card.png'
    );
    expect(recipientInboxRes.body.data[0].owner.id).toBe(owner.id);

    const bystanderInboxRes = await request(app)
      .get('/api/v1/vault/shared-with-me')
      .set('Authorization', `Bearer ${bystanderToken}`);
    expect(bystanderInboxRes.status).toBe(200);
    expect(bystanderInboxRes.body.data).toHaveLength(0);

    // 5. Revoking share immediately revokes online visibility for recipient
    const revokeRes = await request(app)
      .delete(`/api/v1/vault/shared-access/${shareId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(revokeRes.status).toBe(200);

    const afterRevokeRes = await request(app)
      .get('/api/v1/vault/shared-with-me')
      .set('Authorization', `Bearer ${recipientToken}`);
    expect(afterRevokeRes.body.data).toHaveLength(0);
  });
});

