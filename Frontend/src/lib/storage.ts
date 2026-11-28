/**
 * Safe LocalStorage wrapper to prevent QuotaExceededError and private browsing crashes.
 */
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to read ${key}:`, e);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      localStorage.setItem(key, value);
      return true;
    } catch (e: any) {
      console.warn(`[SafeStorage] Failed to write ${key}:`, e?.name || e);
      if (e?.name === 'QuotaExceededError' || e?.code === 22 || e?.code === 1014) {
        try {
          // If storage is full, purge heavy transient caches
          localStorage.removeItem('tripzobox_trips');
          localStorage.removeItem('tripzobox_stories');
          localStorage.removeItem('tripzobox_notification_reads');
          localStorage.setItem(key, value);
          return true;
        } catch {
          // Ignore if still over quota
        }
      }
      return false;
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to remove ${key}:`, e);
    }
  },

  getJSON: <T>(key: string, fallback: T): T => {
    try {
      const raw = safeStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  setJSON: <T>(key: string, value: T): boolean => {
    try {
      const serialized = JSON.stringify(value);
      return safeStorage.setItem(key, serialized);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to stringify for ${key}:`, e);
      return false;
    }
  },

  clearAppCache: (): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.removeItem('tripzobox_trips');
      localStorage.removeItem('tripzobox_stories');
      localStorage.removeItem('tripzobox_saved_destinations');
      localStorage.removeItem('tripzobox_bookmarked_stories');
      localStorage.removeItem('tripzobox_notification_reads');
    } catch {}
  },
};
