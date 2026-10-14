import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { currentUser as defaultUser } from '../data/mockUsers';

interface AuthContextType {
  user: User;
  isLoggedIn: boolean;
  login: (email?: string, password?: string) => Promise<boolean>;
  signup: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('tripzobox_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultUser;
      }
    }
    return defaultUser;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const status = localStorage.getItem('tripzobox_auth_status');
    return status !== null ? status === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('tripzobox_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tripzobox_auth_status', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  const login = async (_email?: string, _password?: string): Promise<boolean> => {
    setIsLoggedIn(true);
    return true;
  };

  const signup = async (name: string, _email: string, _password?: string): Promise<boolean> => {
    setUser((prev) => ({
      ...prev,
      name: name.trim() || prev.name,
    }));
    setIsLoggedIn(true);
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  const updateProfile = (updatedData: Partial<User>) => {
    setUser((prev) => ({
      ...prev,
      ...updatedData,
    }));
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
