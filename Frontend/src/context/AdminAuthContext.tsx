import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, AdminRole } from '../types/admin';
import { adminApi, AdminApiError } from '../lib/adminApi';

interface AdminAuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isLoggedIn: boolean;
  role: AdminRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (roles: AdminRole | AdminRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Role privilege hierarchy
const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  superadmin: [
    'users.view', 'users.edit', 'users.suspend', 'users.delete',
    'trips.view', 'trips.edit', 'trips.moderate', 'trips.delete',
    'safety.reports.manage', 'safety.verifications.manage', 'safety.blocks.manage',
    'cms.view', 'cms.edit', 'cms.publish', 'media.manage',
    'notifications.broadcast', 'diary.moderate',
    'system.settings.edit', 'system.health.view',
    'admins.create', 'admins.edit_role', 'admins.delete',
    'audit_logs.view', 'audit_logs.export',
  ],
  admin: [
    'users.view', 'users.edit', 'users.suspend',
    'trips.view', 'trips.edit', 'trips.moderate',
    'safety.reports.manage', 'safety.verifications.manage', 'safety.blocks.manage',
    'cms.view', 'cms.edit', 'cms.publish', 'media.manage',
    'notifications.broadcast', 'diary.moderate',
    'audit_logs.view',
  ],
  moderator: [
    'users.view', 'users.suspend',
    'trips.view', 'trips.moderate',
    'safety.reports.manage', 'safety.verifications.manage',
    'diary.moderate',
    'audit_logs.view',
  ],
  support: [
    'users.view', 'users.add_notes',
    'trips.view',
    'join_requests.view',
    'safety.reports.view',
  ],
  content_manager: [
    'cms.view', 'cms.edit', 'cms.publish',
    'destinations.manage',
    'media.manage',
    'packages.manage',
  ],
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('tripzobox_admin_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('tripzobox_admin_token');
  });

  const [loading, setLoading] = useState<boolean>(true);

  const refreshAdmin = async () => {
    const currentToken = localStorage.getItem('tripzobox_admin_token');
    if (!currentToken) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    try {
      const fetchedAdmin = await adminApi.auth.getMe();
      if (fetchedAdmin) {
        setAdmin(fetchedAdmin);
        localStorage.setItem('tripzobox_admin_user', JSON.stringify(fetchedAdmin));
      } else {
        logout();
      }
    } catch (e) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAdmin();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await adminApi.auth.login(email, password);
      if (data?.token && data?.admin) {
        setToken(data.token);
        setAdmin(data.admin);
        return { success: true };
      }
      return { success: false, error: 'Authentication failed' };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Invalid administrator credentials. Access restricted.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('tripzobox_admin_token');
    localStorage.removeItem('tripzobox_admin_user');
    setAdmin(null);
    setToken(null);
  };

  const hasRole = (roles: AdminRole | AdminRole[]): boolean => {
    if (!admin?.role) return false;
    if (admin.role === 'superadmin') return true;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(admin.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!admin?.role) return false;
    if (admin.role === 'superadmin') return true;
    const permissions = ROLE_PERMISSIONS[admin.role] || [];
    return permissions.includes(permission);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isLoggedIn: Boolean(admin && token),
        role: admin?.role || null,
        loading,
        login,
        logout,
        hasRole,
        hasPermission,
        refreshAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

