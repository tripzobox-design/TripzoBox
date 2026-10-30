/**
 * TripzoBox Centralized API Client
 * Provides seamless communication with the Node.js/Express/MongoDB backend
 * with graceful fallback to cached/local data when offline.
 */

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  errors?: Array<{ field?: string; message: string }>;

  constructor(message: string, statusCode: number = 400, errors?: Array<{ field?: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string; meta?: any }> {
  const token = localStorage.getItem('tripzobox_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Includes HTTP-only cookies
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = json?.message || `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, json?.errors);
    }

    return json;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network failure / server offline
    console.warn(`[API Client] Network call to ${endpoint} failed:`, error.message);
    throw new ApiError(error.message || 'Unable to connect to TripzoBox server', 503);
  }
}

export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          if (Array.isArray(val)) {
            if (val.length > 0) searchParams.set(key, val.join(','));
          } else {
            searchParams.set(key, String(val));
          }
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return request<T>(url, { method: 'GET' });
  },

  post: <T = any>(endpoint: string, data?: any) => {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put: <T = any>(endpoint: string, data?: any) => {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: <T = any>(endpoint: string) => {
    return request<T>(endpoint, {
      method: 'DELETE',
    });
  },

  upload: async <T = any>(file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<T>('/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

// ============================================================================
// 1. AUTH & PROFILE APIS
// ============================================================================
export const authApi = {
  signup: async (data: { name: string; emailOrPhone: string; password?: string; [key: string]: any }) => {
    const res = await api.post('/auth/signup', data);
    if (res.data?.token) {
      localStorage.setItem('tripzobox_token', res.data.token);
    }
    return res.data;
  },

  login: async (emailOrPhone: string, password?: string) => {
    const res = await api.post('/auth/login', { emailOrPhone, password });
    if (res.data?.token) {
      localStorage.setItem('tripzobox_token', res.data.token);
    }
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('tripzobox_token');
    }
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data?.user;
  },

  updateProfile: async (data: any) => {
    const res = await api.put('/auth/profile', data);
    return res.data?.user;
  },

  setSecurityQuestion: async (question: string, answer: string) => {
    return api.post('/auth/security-question', { question, answer });
  },

  requestReset: async (emailOrPhone: string, method: string = 'email') => {
    return api.post('/auth/forgot-password/request', { emailOrPhone, method });
  },

  verifyOtp: async (emailOrPhone: string, otp: string) => {
    return api.post('/auth/forgot-password/verify-otp', { emailOrPhone, otp });
  },

  resetPassword: async (emailOrPhone: string, newPassword: string) => {
    return api.post('/auth/forgot-password/reset', { emailOrPhone, newPassword });
  },

  getRecoveryCodes: async () => {
    const res = await api.get('/auth/recovery-codes');
    return res.data?.recoveryCodes || [];
  },
};

// ============================================================================
// 2. TRIPS & DISCOVERY APIS
// ============================================================================
export const tripsApi = {
  getTrips: async (filters?: Record<string, any>) => {
    const res = await api.get('/trips', filters);
    return res.data;
  },

  getMyTrips: async () => {
    const res = await api.get('/trips/my');
    return res.data;
  },

  getSavedTrips: async () => {
    const res = await api.get('/trips/saved');
    return res.data;
  },

  toggleSaveTrip: async (tripId: string) => {
    const res = await api.post(`/trips/saved/${tripId}/toggle`);
    return res.data;
  },

  getTripById: async (tripId: string, code?: string) => {
    const res = await api.get(`/trips/${tripId}`, code ? { code } : undefined);
    return res.data;
  },

  createTrip: async (tripData: any) => {
    const res = await api.post('/trips', tripData);
    return res.data;
  },

  updateTrip: async (tripId: string, data: any) => {
    const res = await api.put(`/trips/${tripId}`, data);
    return res.data;
  },

  deleteTrip: async (tripId: string) => {
    const res = await api.delete(`/trips/${tripId}`);
    return res.data;
  },

  updateRoomType: async (tripId: string, roomType: 'public' | 'private') => {
    const res = await api.put(`/trips/${tripId}/room-type`, { roomType });
    return res.data;
  },

  requestJoin: async (tripId: string, details?: any) => {
    const res = await api.post(`/trips/${tripId}/join`, details || {});
    return res.data;
  },

  getRequests: async (tripId: string) => {
    const res = await api.get(`/trips/${tripId}/requests`);
    return res.data;
  },

  acceptRequest: async (tripId: string, requestId: string) => {
    const res = await api.post(`/trips/${tripId}/requests/${requestId}/accept`);
    return res.data;
  },

  declineRequest: async (tripId: string, requestId: string) => {
    const res = await api.post(`/trips/${tripId}/requests/${requestId}/decline`);
    return res.data;
  },
};

// ============================================================================
// 3. DESTINATIONS APIS
// ============================================================================
export const destinationsApi = {
  getDestinations: async (params?: Record<string, any>) => {
    const res = await api.get('/destinations', params);
    return res.data;
  },

  getDestinationBySlug: async (slug: string) => {
    const res = await api.get(`/destinations/${slug}`);
    return res.data;
  },

  createDestination: async (data: any) => {
    const res = await api.post('/destinations', data);
    return res.data;
  },
};

// ============================================================================
// 4. DIARY & EXPERIENCES APIS
// ============================================================================
export const diaryApi = {
  getEntries: async () => {
    const res = await api.get('/diary');
    return res.data;
  },

  createEntry: async (data: any) => {
    const res = await api.post('/diary', data);
    return res.data;
  },

  updateEntry: async (id: string, data: any) => {
    const res = await api.put(`/diary/${id}`, data);
    return res.data;
  },

  deleteEntry: async (id: string) => {
    const res = await api.delete(`/diary/${id}`);
    return res.data;
  },
};

// ============================================================================
// 5. STORIES APIS
// ============================================================================
export const storiesApi = {
  getStories: async (params?: Record<string, any>) => {
    const res = await api.get('/stories', params);
    return res.data;
  },

  getStoryBySlug: async (slug: string) => {
    const res = await api.get(`/stories/${slug}`);
    return res.data;
  },

  createStory: async (data: any) => {
    const res = await api.post('/stories', data);
    return res.data;
  },

  updateStory: async (id: string, data: any) => {
    const res = await api.put(`/stories/${id}`, data);
    return res.data;
  },

  deleteStory: async (id: string) => {
    const res = await api.delete(`/stories/${id}`);
    return res.data;
  },

  likeStory: async (id: string) => {
    const res = await api.post(`/stories/${id}/like`);
    return res.data;
  },
};

// ============================================================================
// 6. MESSAGING & CHATS APIS
// ============================================================================
export const messagesApi = {
  getThreads: async () => {
    const res = await api.get('/messages/threads');
    return res.data;
  },

  getMessages: async (tripId: string) => {
    const res = await api.get(`/messages/threads/${tripId}`);
    return res.data;
  },

  sendMessage: async (tripId: string, text: string) => {
    const res = await api.post(`/messages/threads/${tripId}`, { text });
    return res.data;
  },
};

// ============================================================================
// 7. NOTIFICATIONS APIS
// ============================================================================
export const notificationsApi = {
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },

  markRead: async (id: string) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },
};

// ============================================================================
// 8. TRAVEL VAULT & SAFETY APIS
// ============================================================================
export const vaultApi = {
  getDocuments: async () => {
    const res = await api.get('/vault/documents');
    return res.data;
  },

  createDocument: async (docData: any) => {
    const res = await api.post('/vault/documents', docData);
    return res.data;
  },

  updateDocument: async (id: string, updates: any) => {
    const res = await api.put(`/vault/documents/${id}`, updates);
    return res.data;
  },

  deleteDocument: async (id: string) => {
    const res = await api.delete(`/vault/documents/${id}`);
    return res.data;
  },

  getEmergencyContacts: async () => {
    const res = await api.get('/vault/emergency-contacts');
    return res.data;
  },

  createEmergencyContact: async (contact: any) => {
    const res = await api.post('/vault/emergency-contacts', contact);
    return res.data;
  },

  deleteEmergencyContact: async (id: string) => {
    const res = await api.delete(`/vault/emergency-contacts/${id}`);
    return res.data;
  },

  getTrustedContacts: async () => {
    const res = await api.get('/vault/trusted-contacts');
    return res.data;
  },

  toggleTrustedContactAccess: async (id: string) => {
    const res = await api.put(`/vault/trusted-contacts/${id}/toggle`);
    return res.data;
  },

  getSharedAccess: async () => {
    const res = await api.get('/vault/shared-access');
    return res.data;
  },

  createSharedAccess: async (record: any) => {
    const res = await api.post('/vault/shared-access', record);
    return res.data;
  },

  revokeSharedAccess: async (id: string) => {
    const res = await api.delete(`/vault/shared-access/${id}`);
    return res.data;
  },

  getSettings: async () => {
    const res = await api.get('/vault/settings');
    return res.data;
  },

  updateEmergencyConfig: async (config: any) => {
    const res = await api.put('/vault/emergency-config', config);
    return res.data;
  },

  updateSecuritySettings: async (settings: any) => {
    const res = await api.put('/vault/security-settings', settings);
    return res.data;
  },
};

