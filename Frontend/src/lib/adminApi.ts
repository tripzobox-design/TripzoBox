import {
  AdminUser,
  AdminDashboardData,
  AdminAuditLogItem,
  CMSContent,
  PlatformSettingsData,
  ServiceHealthStatus,
  IdentityVerificationItem,
  MediaFileItem,
  RoleDefinitionItem,
  AdminRole,
} from '../types/admin';
import { User, Trip, UserReportItem } from '../types';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api/v1';

export class AdminApiError extends Error {
  statusCode: number;
  errors?: any;
  constructor(message: string, statusCode = 400, errors?: any) {
    super(message);
    this.name = 'AdminApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function adminRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string }> {
  // Check admin specific token first, then fall back to generic token
  const token = localStorage.getItem('tripzobox_admin_token') || localStorage.getItem('tripzobox_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = json?.message || `Admin request failed with status ${response.status}`;
      throw new AdminApiError(errorMessage, response.status, json?.errors);
    }

    return json;
  } catch (err: any) {
    if (err instanceof AdminApiError) throw err;
    throw new AdminApiError(err.message || 'Unable to connect to TripzoBox API Server', 503);
  }
}

export const adminApi = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      const res = await adminRequest<{ token: string; admin: AdminUser }>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.data?.token) {
        localStorage.setItem('tripzobox_admin_token', res.data.token);
        localStorage.setItem('tripzobox_admin_user', JSON.stringify(res.data.admin));
      }
      return res.data;
    },
    getMe: async () => {
      const res = await adminRequest<{ admin: AdminUser }>('/admin/me');
      return res.data?.admin;
    },
    updateProfile: async (data: Partial<AdminUser>) => {
      const res = await adminRequest<{ admin: AdminUser }>('/admin/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.data?.admin;
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
      const res = await adminRequest('/admin/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return res;
    },
  },

  // Dashboard
  dashboard: {
    getStats: async (params?: { range?: string; startDate?: string; endDate?: string }) => {
      let query = '';
      if (params) {
        const sp = new URLSearchParams();
        if (params.range) sp.set('range', params.range);
        if (params.startDate) sp.set('startDate', params.startDate);
        if (params.endDate) sp.set('endDate', params.endDate);
        const qs = sp.toString();
        if (qs) query = `?${qs}`;
      }
      const res = await adminRequest<AdminDashboardData>(`/admin/dashboard${query}`);
      return res.data;
    },
  },

  // User Management
  users: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
      verification?: string;
      sortBy?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      let query = '';
      if (params) {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
        });
        const qs = sp.toString();
        if (qs) query = `?${qs}`;
      }
      const res = await adminRequest<{
        users: User[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/admin/users${query}`);
      return res.data;
    },
    getById: async (id: string) => {
      const res = await adminRequest<{
        user: User;
        activity: {
          createdTrips: Trip[];
          joinRequests: any[];
          reports: any[];
          reportsFiledByUser: any[];
          diaryEntries: any[];
          stories: any[];
          reviewsReceived: any[];
          identityRecord: IdentityVerificationItem | null;
          auditLogs: AdminAuditLogItem[];
        };
      }>(`/admin/users/${id}`);
      return res.data;
    },
    update: async (id: string, data: any) => {
      const res = await adminRequest<{ user: User }>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.data?.user;
    },
    toggleSuspend: async (id: string, isSuspended: boolean, suspensionReason?: string) => {
      const res = await adminRequest<{ user: User }>(`/admin/users/${id}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ isSuspended, suspensionReason }),
      });
      return res.data?.user;
    },
    requirePasswordReset: async (id: string, reason?: string) => {
      const res = await adminRequest<{ user: User }>(`/admin/users/${id}/require-password-reset`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      return res.data?.user;
    },
    revokeSessions: async (id: string, reason?: string) => {
      const res = await adminRequest<{ user: User }>(`/admin/users/${id}/revoke-sessions`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return res.data?.user;
    },
    addNote: async (id: string, note: string) => {
      const res = await adminRequest<{ internalNotes: any[] }>(`/admin/users/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
      return res.data?.internalNotes;
    },
    deleteUser: async (id: string) => {
      const res = await adminRequest(`/admin/users/${id}`, { method: 'DELETE' });
      return res;
    },
  },

  // Trip Management
  trips: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      destination?: string;
      difficulty?: string;
    }) => {
      let query = '';
      if (params) {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
        });
        const qs = sp.toString();
        if (qs) query = `?${qs}`;
      }
      const res = await adminRequest<{
        trips: Trip[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/admin/trips${query}`);
      return res.data;
    },
    getById: async (id: string) => {
      const res = await adminRequest<{
        trip: Trip;
        joinRequests: any[];
        reports: any[];
      }>(`/admin/trips/${id}`);
      return res.data;
    },
    update: async (id: string, data: any) => {
      const res = await adminRequest<{ trip: Trip }>(`/admin/trips/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.data?.trip;
    },
    updateStatus: async (id: string, status: string, reason?: string) => {
      const res = await adminRequest<{ trip: Trip }>(`/admin/trips/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      });
      return res.data?.trip;
    },
    deleteTrip: async (id: string) => {
      const res = await adminRequest(`/admin/trips/${id}`, { method: 'DELETE' });
      return res;
    },
  },

  // Join Requests
  joinRequests: {
    getAll: async (params?: { page?: number; limit?: number; status?: string; search?: string; tripId?: string }) => {
      let query = '';
      if (params) {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
        });
        const qs = sp.toString();
        if (qs) query = `?${qs}`;
      }
      const res = await adminRequest<{
        requests?: any[];
        joinRequests?: any[];
        pagination?: { page: number; limit: number; total: number; pages: number };
      }>(`/admin/join-requests${query}`);
      const list = res.data?.joinRequests || res.data?.requests || [];
      return {
        requests: list,
        joinRequests: list,
        pagination: res.data?.pagination || { page: 1, limit: 12, total: list.length, pages: 1 },
      };
    },
    getById: async (id: string) => {
      const res = await adminRequest<{ request: any }>(`/admin/join-requests/${id}`);
      return res.data?.request;
    },
    updateStatus: async (
      id: string,
      statusOrPayload: string | { action?: string; status?: string; reason?: string; notes?: string },
      reason?: string
    ) => {
      const body =
        typeof statusOrPayload === 'string'
          ? { status: statusOrPayload, reason }
          : statusOrPayload;
      const res = await adminRequest<{ request: any; trip: any }>(`/admin/join-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      return res.data;
    },
    delete: async (id: string) => {
      const res = await adminRequest(`/admin/join-requests/${id}`, { method: 'DELETE' });
      return res;
    },
  },

  // Trust & Safety / Moderation
  safety: {
    getReports: async (params?: { page?: number; limit?: number; status?: string; category?: string }) => {
      let query = '';
      if (params) {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v) sp.set(k, String(v));
        });
        const qs = sp.toString();
        if (qs) query = `?${qs}`;
      }
      const res = await adminRequest<{
        reports: UserReportItem[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/admin/reports${query}`);
      return res.data;
    },
    resolveReport: async (id: string, data: { status: string; moderatorNotes?: string; actionTaken?: string }) => {
      const res = await adminRequest(`/admin/reports/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    getVerifications: async (params?: { page?: number; limit?: number; status?: string; documentType?: string }) => {
      let query = '';
      if (params) {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v) sp.set(k, String(v));
        });
        const qs = sp.toString();
        if (qs) query = `?${qs}`;
      }
      const res = await adminRequest<{
        verifications: IdentityVerificationItem[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/admin/verifications${query}`);
      return res.data;
    },
    reviewVerification: async (id: string, status: 'VERIFIED' | 'REJECTED', rejectionReason?: string) => {
      const res = await adminRequest(`/admin/verifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason }),
      });
      return res.data;
    },
    getBlocks: async (params?: { page?: number; limit?: number }) => {
      const query = params ? `?page=${params.page || 1}&limit=${params.limit || 15}` : '';
      const res = await adminRequest<{
        blocks: any[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/admin/blocks${query}`);
      return res.data;
    },
    unblockUser: async (id: string) => {
      const res = await adminRequest(`/admin/blocks/${id}`, { method: 'DELETE' });
      return res;
    },
    getReviews: async (params?: { page?: number; limit?: number; status?: string; reported?: boolean; q?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.limit) queryParams.set('limit', String(params.limit));
      if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
      if (params?.reported !== undefined) queryParams.set('reported', String(params.reported));
      if (params?.q) queryParams.set('q', params.q);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const res = await adminRequest<{
        reviews: any[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/admin/reviews${qs}`);
      return res.data;
    },
    updateReviewStatus: async (id: string, status: 'active' | 'hidden' | 'flagged', moderationNote?: string) => {
      const res = await adminRequest<{ review: any }>(`/admin/reviews/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, moderationNote }),
      });
      return res.data;
    },
    deleteReview: async (id: string) => {
      const res = await adminRequest(`/admin/reviews/${id}`, { method: 'DELETE' });
      return res;
    },
  },

  // CMS Content Management
  cms: {
    getContent: async (key = 'main_cms') => {
      const res = await adminRequest<{ content: CMSContent }>(`/admin/cms?key=${key}`);
      return res.data?.content;
    },
    updateContent: async (data: Partial<CMSContent>) => {
      const res = await adminRequest<{ content: CMSContent }>('/admin/cms', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.data?.content;
    },
    getPublicHomepage: async () => {
      const res = await adminRequest<{ hero: any; promotionalBanner: any; sectionVisibility: any }>('/content/homepage');
      return res.data;
    },
    getPublicPage: async (slug: string) => {
      const res = await adminRequest<{ page: string; content: any }>(`/content/pages/${slug}`);
      return res.data?.content;
    },
  },

  // Destinations Management
  destinations: {
    getAll: async (params?: { page?: number; limit?: number; search?: string; category?: string }) => {
      let query = '';
      if (params) {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v) sp.set(k, String(v));
        });
        const qs = sp.toString();
        if (qs) query = `?${qs}`;
      }
      const res = await adminRequest<{
        destinations: any[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/admin/destinations${query}`);
      return res.data;
    },
    create: async (data: any) => {
      const res = await adminRequest<{ destination: any }>('/admin/destinations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data?.destination;
    },
    update: async (id: string, data: any) => {
      const res = await adminRequest<{ destination: any }>(`/admin/destinations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.data?.destination;
    },
    delete: async (id: string) => {
      const res = await adminRequest(`/admin/destinations/${id}`, { method: 'DELETE' });
      return res;
    },
  },

  // Media Library
  media: {
    getAll: async () => {
      const res = await adminRequest<{ files: MediaFileItem[]; total: number }>('/admin/media');
      return res.data?.files || [];
    },
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await adminRequest<{ url: string; filename: string }>('/admin/media', {
        method: 'POST',
        body: formData,
      });
      return res.data;
    },
    delete: async (filename: string) => {
      const res = await adminRequest(`/admin/media/${filename}`, { method: 'DELETE' });
      return res;
    },
  },

  // Travel Diary Moderation
  diary: {
    getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
      const query = params ? `?page=${params.page || 1}&limit=${params.limit || 15}` : '';
      const res = await adminRequest<{
        entries: any[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/admin/diary${query}`);
      return res.data;
    },
    toggleVisibility: async (id: string, isPublic: boolean) => {
      const res = await adminRequest(`/admin/diary/${id}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic }),
      });
      return res.data;
    },
    delete: async (id: string) => {
      const res = await adminRequest(`/admin/diary/${id}`, { method: 'DELETE' });
      return res;
    },
  },

  // Travel Packages
  packages: {
    getAll: async () => {
      const res = await adminRequest<{ packages: any[] }>('/admin/packages');
      return res.data?.packages || [];
    },
    create: async (data: any) => {
      const res = await adminRequest<{ package: any }>('/admin/packages', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data?.package;
    },
    update: async (id: string, data: any) => {
      const res = await adminRequest<{ package: any }>(`/admin/packages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.data?.package;
    },
    delete: async (id: string) => {
      const res = await adminRequest(`/admin/packages/${id}`, { method: 'DELETE' });
      return res;
    },
  },

  // Notifications
  notifications: {
    broadcast: async (data: {
      title: string;
      message: string;
      type: 'info' | 'warning' | 'success' | 'alert';
      targetGroup: 'all' | 'verified_only' | 'trip_leaders';
      linkUrl?: string;
    }) => {
      const res = await adminRequest('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    getHistory: async () => {
      const res = await adminRequest<{ announcements: any[] }>('/admin/notifications/history');
      return res.data?.announcements || [];
    },
  },

  // System & Platform Settings
  system: {
    getServices: async () => {
      const res = await adminRequest<ServiceHealthStatus>('/admin/system/services');
      return res.data;
    },
    testService: async (service: 'email' | 'sms') => {
      const res = await adminRequest<{ service: string; status: string; diagnostics: string; latencyMs: number }>(
        '/admin/system/test-service',
        {
          method: 'POST',
          body: JSON.stringify({ service }),
        }
      );
      return res.data;
    },
    getHealth: async () => {
      const res = await adminRequest<{
        status?: string;
        serverTime?: string;
        uptimeSeconds: number;
        database: { status: string; connected: boolean; name: string } | string;
        process?: { nodeVersion: string; platform: string; pid: number };
        memory: any;
        nodeVersion?: string;
        platform?: string;
      }>('/admin/system/health');
      return res.data;
    },
    getSettings: async () => {
      const res = await adminRequest<{ settings: PlatformSettingsData }>('/admin/settings');
      return res.data?.settings;
    },
    updateSettings: async (data: Partial<PlatformSettingsData>) => {
      const res = await adminRequest<{ settings: PlatformSettingsData }>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.data?.settings;
    },
    getAuditLogs: async (params?: { page?: number; limit?: number; action?: string }) => {
      let query = '';
      if (params) {
        const sp = new URLSearchParams();
        if (params.page) sp.set('page', String(params.page));
        if (params.limit) sp.set('limit', String(params.limit));
        if (params.action) sp.set('action', params.action);
        const qs = sp.toString();
        if (qs) query = `?${qs}`;
      }
      const res = await adminRequest<{
        logs: AdminAuditLogItem[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/admin/audit-logs${query}`);
      return res.data;
    },
    getRolePermissions: async () => {
      const res = await adminRequest<{ roles: RoleDefinitionItem[] }>('/admin/roles/permissions');
      return res.data?.roles || [];
    },
  },

  // Administrators Management (Superadmin Only)
  admins: {
    getAll: async () => {
      const res = await adminRequest<{ admins: AdminUser[] }>('/admin/admins');
      return res.data?.admins || [];
    },
    create: async (data: { name: string; email: string; password: string; role: AdminRole }) => {
      const res = await adminRequest<{ admin: AdminUser }>('/admin/admins', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data?.admin;
    },
    updateRole: async (id: string, role: AdminRole) => {
      const res = await adminRequest<{ admin: AdminUser }>(`/admin/admins/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      return res.data?.admin;
    },
    delete: async (id: string) => {
      const res = await adminRequest(`/admin/admins/${id}`, { method: 'DELETE' });
      return res;
    },
  },
};

