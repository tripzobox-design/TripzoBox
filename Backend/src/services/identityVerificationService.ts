import crypto from 'crypto';
import { IdentityStatus } from '../models/IdentityVerification.js';

export interface IdentityVerificationRequest {
  userId: string;
  documentType: 'aadhaar' | 'passport' | 'driving_license' | 'voter_id' | 'other';
  consentGiven: boolean;
}

export interface VerificationProviderResult {
  providerReferenceId: string;
  status: IdentityStatus;
  redirectUrl?: string;
  rejectionReason?: string;
  isMock: boolean;
}

export interface IIdentityVerificationProvider {
  name: string;
  isConfigured: boolean;
  initiateVerification(req: IdentityVerificationRequest): Promise<VerificationProviderResult>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
  parseWebhookEvent(body: any): { providerReferenceId: string; status: IdentityStatus; rejectionReason?: string };
}

/**
 * Sandboxed Regulatory Identity Provider (compliant mock for test/development environments)
 * Never stores raw Aadhaar, PAN, or passport numbers.
 */
class SandboxIdentityProvider implements IIdentityVerificationProvider {
  name = 'SandboxIdentityService';
  apiKey = process.env.IDENTITY_PROVIDER_KEY || '';
  webhookSecret = process.env.IDENTITY_WEBHOOK_SECRET || 'tripzobox_idv_webhook_dev_secret_2026';

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async initiateVerification(req: IdentityVerificationRequest): Promise<VerificationProviderResult> {
    if (!req.consentGiven) {
      throw new Error('Explicit consent is legally mandatory for identity verification under Indian DPDP Act');
    }

    const providerReferenceId = `idv_ref_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    return {
      providerReferenceId,
      status: 'PENDING',
      redirectUrl: `http://localhost:5173/app/profile?tab=safety&idv_ref=${providerReferenceId}`,
      isMock: !this.isConfigured,
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!signature) return false;
    const computed = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  }

  parseWebhookEvent(body: any) {
    return {
      providerReferenceId: body.referenceId || body.providerReferenceId,
      status: (body.status?.toUpperCase() as IdentityStatus) || 'FAILED',
      rejectionReason: body.rejectionReason,
    };
  }
}

const activeProvider: IIdentityVerificationProvider = new SandboxIdentityProvider();

export const identityVerificationService = {
  getProviderStatus: () => ({
    name: activeProvider.name,
    isConfigured: activeProvider.isConfigured,
    liveMode: Boolean(process.env.NODE_ENV === 'production' && activeProvider.isConfigured),
  }),

  initiate: async (req: IdentityVerificationRequest) => {
    return activeProvider.initiateVerification(req);
  },

  verifyWebhookSignature: (rawPayload: string, signature: string) => {
    return activeProvider.verifyWebhookSignature(rawPayload, signature);
  },

  parseWebhook: (body: any) => {
    return activeProvider.parseWebhookEvent(body);
  },
};

