import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { currentUser as defaultUser } from '../data/mockUsers';
import { authApi } from '../lib/api';

interface AuthContextType {
  user: User;
  isLoggedIn: boolean;
  login: (email?: string, password?: string) => Promise<boolean>;
  signup: (name: string, email: string, password?: string) => Promise<boolean>;
  oauthLogin: (provider: 'Google' | 'Apple', email: string, name?: string, avatarUrl?: string) => Promise<boolean>;
  logout: () => void;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('tripzobox_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return sanitizeUser(parsed);
      } catch (e) {
        return sanitizeUser(defaultUser);
      }
    }
    return sanitizeUser(defaultUser);
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const status = localStorage.getItem('tripzobox_auth_status');
    return status !== null ? status === 'true' : false;
  });

  // Verify session with server on initial mount & ensure valid backend token
  useEffect(() => {
    const token = localStorage.getItem('tripzobox_token');
    if (token) {
      authApi
        .getMe()
        .then((fetchedUser) => {
          if (fetchedUser) {
            setUser(sanitizeUser(fetchedUser));
            setIsLoggedIn(true);
          }
        })
        .catch(() => {
          // Token expired or invalid, re-sync session with server
          authApi
            .syncSession({ email: user.email, phone: user.phone, name: user.name })
            .catch(() => {});
        });
    } else {
      // No token in localStorage: sync session to acquire valid JWT token
      authApi
        .syncSession({ email: user.email, phone: user.phone, name: user.name })
        .then((data) => {
          if (data?.user) {
            setUser((prev) => sanitizeUser({ ...prev, ...data.user }));
            setIsLoggedIn(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tripzobox_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tripzobox_auth_status', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  const login = async (emailOrPhone?: string, password?: string): Promise<boolean> => {
    try {
      if (emailOrPhone) {
        const data = await authApi.login(emailOrPhone, password || 'Password123!');
        if (data?.user) {
          setUser(sanitizeUser(data.user));
        }
      }
      setIsLoggedIn(true);
      return true;
    } catch (err: any) {
      if (err?.statusCode === 401 || err?.statusCode === 400 || err?.statusCode === 409) {
        throw err;
      }
      console.warn('[AuthContext] Backend login call failed, falling back to local session:', err);
      if (emailOrPhone) {
        const trimmed = emailOrPhone.trim();
        const isEmail = trimmed.includes('@');
        const digits = trimmed.replace(/\D/g, '');
        const isPhone = !/[a-zA-Z]/.test(trimmed) && digits.length >= 10 && digits.length <= 15;
        setUser((prev) =>
          sanitizeUser({
            ...prev,
            name: !isEmail && !isPhone ? trimmed : prev.name || 'Traveler',
            email: isEmail ? trimmed : prev.email,
            phone: isPhone ? trimmed : '',
            phoneVerified: isPhone,
          })
        );
      }
      setIsLoggedIn(true);
      return true;
    }
  };

  const signup = async (name: string, emailOrPhone: string, password?: string): Promise<boolean> => {
    try {
      const data = await authApi.signup({
        name,
        emailOrPhone,
        password: password || 'Password123!',
      });
      if (data?.user) {
        setUser(sanitizeUser(data.user));
      }
      setIsLoggedIn(true);
      return true;
    } catch (err: any) {
      if (err?.statusCode === 409 || err?.statusCode === 400 || err?.statusCode === 401) {
        throw err;
      }
      console.warn('[AuthContext] Backend signup call failed, falling back to local session:', err);
      const trimmed = emailOrPhone.trim();
      const isEmail = trimmed.includes('@');
      const digits = trimmed.replace(/\D/g, '');
      const isPhone = !/[a-zA-Z]/.test(trimmed) && digits.length >= 10 && digits.length <= 15;
      setUser((prev) =>
        sanitizeUser({
          ...prev,
          name: name.trim() || prev.name,
          email: isEmail ? trimmed : prev.email || 'user@example.com',
          phone: isPhone ? trimmed : '',
          phoneVerified: isPhone,
          avatarUrl: '',
        })
      );
      setIsLoggedIn(true);
      return true;
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setIsLoggedIn(false);
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
      console.warn('[AuthContext] Backend oauth call failed, falling back to local session:', err);
      const cleanEmail = email.trim().toLowerCase();
      setUser((prev) =>
        sanitizeUser({
          ...prev,
          name: name || prev.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          emailVerified: true,
          avatarUrl:
            avatarUrl ||
            prev.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        })
      );
      setIsLoggedIn(true);
      return true;
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
    <AuthContext.Provider value={{ user, isLoggedIn, login, signup, oauthLogin, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
