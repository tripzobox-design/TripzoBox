import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../lib/api';
import { safeStorage } from '../lib/storage';

interface AuthContextType {
  user: User;
  isLoggedIn: boolean;
  login: (email?: string, password?: string) => Promise<boolean>;
  signup: (
    name: string,
    email: string,
    password?: string,
    securityQuestion?: string,
    securityAnswer?: string
  ) => Promise<any>;
  oauthLogin: (provider: 'Google' | 'Apple', email: string, name?: string, avatarUrl?: string) => Promise<boolean>;
  completeOAuthSession: (directUser?: User) => Promise<User>;
  logout: () => void;
  clearDeletedAccountSession: (deletedUserId?: string) => void;
  updateProfile: (updatedData: Partial<User>) => Promise<void> | void;
  refreshUser: () => Promise<void>;
}

const sanitizeUser = (u: User): User => {
  const sanitized = { ...u };
  if (
    sanitized.phone &&
    (/[a-zA-Z]/.test(sanitized.phone) || !/^\+?[\d\s-]{10,15}$/.test(sanitized.phone.trim()))
  ) {
    sanitized.phone = '';
    sanitized.phoneVerified = false;
  }
  return sanitized;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const emptyUser: User = {
  id: '',
  name: '',
  username: '',
  email: '',
  phone: '',
  bio: '',
  city: '',
  country: '',
  languages: [],
  travelStyle: '',
  travelInterests: [],
  budgetStyle: 'budget',
  travelPace: '',
  preferredGroupSize: '',
  dreamDestination: '',
  avatarUrl: '',
  coverUrl: '',
  emailVerified: false,
  phoneVerified: false,
  isGoogleConnected: false,
  stats: { trips: 0, stories: 0, followers: 0, following: 0 },
  role: 'user',
  identityVerificationStatus: 'unverified' as any,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('tripzobox_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return sanitizeUser(parsed);
      } catch (e) {
        return emptyUser;
      }
    }
    return emptyUser;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const status = localStorage.getItem('tripzobox_auth_status');
    return status !== null ? status === 'true' : false;
  });

  // Verify session with server on initial mount (supports both Bearer token and HttpOnly cookie)
  useEffect(() => {
    let active = true;
    const initSession = async () => {
      const token = localStorage.getItem('tripzobox_token');
      const hadAuthStatus = localStorage.getItem('tripzobox_auth_status') === 'true';
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const isOAuthCallback = search.includes('oauth=') || search.includes('oauth_error=');

      try {
        const fetchedUser = await authApi.getMe();
        if (active && fetchedUser) {
          setUser(sanitizeUser(fetchedUser));
          setIsLoggedIn(true);
          return;
        }
      } catch {
        // Session invalid or not yet established
      }

      if (token) {
        localStorage.removeItem('tripzobox_token');
      }

      if (active && hadAuthStatus && !isOAuthCallback) {
        // Session was stale — clear auth state cleanly; never re-sync unauthenticated
        localStorage.removeItem('tripzobox_auth_status');
        setIsLoggedIn(false);
        setUser(emptyUser);
      }
    };

    initSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    safeStorage.setJSON('tripzobox_user', user);
  }, [user]);

  useEffect(() => {
    safeStorage.setItem('tripzobox_auth_status', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  const login = async (emailOrPhone?: string, password?: string): Promise<boolean> => {
    try {
      if (emailOrPhone) {
        const data = await authApi.login(emailOrPhone, password);
        if (data?.user) {
          setUser(sanitizeUser(data.user));
        }
      }
      setIsLoggedIn(true);
      return true;
    } catch (err: any) {
      // Always propagate errors — never grant local session on backend failure
      throw err;
    }
  };

  const signup = async (
    name: string,
    emailOrPhone: string,
    password?: string,
    securityQuestion?: string,
    securityAnswer?: string
  ): Promise<any> => {
    try {
      const data = await authApi.signup({
        name,
        emailOrPhone,
        password,
        securityQuestion,
        securityAnswer,
      });
      if (data?.user) {
        setUser(sanitizeUser(data.user));
      }
      setIsLoggedIn(true);
      return data || true;
    } catch (err: any) {
      // Always propagate errors — never grant local session on backend failure
      throw err;
    }
  };

  const logout = () => {
    safeStorage.removeItem('tripzobox_token');
    safeStorage.setItem('tripzobox_auth_status', 'false');
    setIsLoggedIn(false);
    setUser(emptyUser);
    authApi.logout().catch(() => {});
  };

  const clearDeletedAccountSession = (deletedUserId?: string) => {
    const targetId = deletedUserId || user?.id;
    try {
      localStorage.removeItem('tripzobox_token');
      localStorage.removeItem('tripzobox_user');
      localStorage.setItem('tripzobox_auth_status', 'false');
      if (targetId) {
        const suffix = `:${targetId}`;
        for (let i = localStorage.length - 1; i >= 0; i -= 1) {
          const key = localStorage.key(i);
          if (key && key.endsWith(suffix)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch {
      // Ignore storage failures
    }
    setIsLoggedIn(false);
    setUser(emptyUser);
  };

  const completeOAuthSession = async (directUser?: User): Promise<User> => {
    let resolvedUser: User;
    if (directUser) {
      resolvedUser = directUser;
    } else {
      const serverUser = await authApi.getMe();
      if (!serverUser) {
        throw new Error('Unable to load authenticated Google account.');
      }
      resolvedUser = serverUser;
    }
    const sanitized = sanitizeUser(resolvedUser);
    setUser(sanitized);
    setIsLoggedIn(true);
    safeStorage.setJSON('tripzobox_user', sanitized);
    safeStorage.setItem('tripzobox_auth_status', 'true');
    return sanitized;
  };

  const oauthLogin = async (
    provider: 'Google' | 'Apple',
    email: string,
    name?: string,
    avatarUrl?: string
  ): Promise<boolean> => {
    try {
      const data = await authApi.oauthLogin({
        provider,
        email,
        name: name || email.split('@')[0],
        avatarUrl,
      });
      if (data?.user) {
        setUser(sanitizeUser(data.user));
      }
      setIsLoggedIn(true);
      return true;
    } catch (err: any) {
      // Always propagate errors — never grant local session on backend failure
      throw err;
    }
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    setUser((prev) =>
      sanitizeUser({
        ...prev,
        ...updatedData,
      })
    );
    try {
      const updatedUser = await authApi.updateProfile(updatedData);
      if (updatedUser) {
        setUser(sanitizeUser(updatedUser));
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to sync profile with server:', err);
    }
  };

  const refreshUser = async () => {
    try {
      const serverUser = await authApi.getMe();
      if (serverUser) {
        const sanitized = sanitizeUser(serverUser);
        setUser(sanitized);
        localStorage.setItem('tripzobox_user', JSON.stringify(sanitized));
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, signup, oauthLogin, completeOAuthSession, logout, clearDeletedAccountSession, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
