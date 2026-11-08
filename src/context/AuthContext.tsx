import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { INITIAL_ADMIN_USER, INITIAL_GUEST_USER } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loginAsGuest: (email?: string, name?: string) => void;
  loginAsAdmin: (email: string, pass: string) => boolean;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'ivstay_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_GUEST_USER;
    } catch {
      return INITIAL_GUEST_USER;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  const loginAsGuest = (email = 'guest@ivstay.com', name = 'Elena Rostova') => {
    const newUser: User = {
      id: 'user_guest_' + Date.now(),
      email,
      full_name: name,
      role: 'guest',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
  };

  const loginAsAdmin = (email: string, pass: string): boolean => {
    // Admin credentials required by spec
    if (email.trim().toLowerCase() === 'bookivstay@gmail.com' && pass === '[removed]') {
      setUser(INITIAL_ADMIN_USER);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!user) return;
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isAuthenticated,
        loginAsGuest,
        loginAsAdmin,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
