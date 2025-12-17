/**
 * useAuth Hook for Strapi v5 Authentication
 * Provides authentication state and methods
 */

import { useState, useEffect, useCallback } from 'react';
import { authAPI, getUserInfo, isAuthenticated as checkAuthStatus } from '@/lib/api';

// User type based on Strapi v5 user structure
export interface User {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
}

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

// Authentication methods
export interface AuthMethods {
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): AuthState & AuthMethods => {
  // Initialize state based on localStorage to avoid loading flash
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return checkAuthStatus();
    }
    return false;
  });
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      return getUserInfo();
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with localStorage on mount (for SSR compatibility)
  useEffect(() => {
    const authenticated = checkAuthStatus();
    const userInfo = getUserInfo();
    
    setIsAuthenticated(authenticated);
    setUser(authenticated ? userInfo : null);
  }, []);

  // Login method
  const login = useCallback(async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(identifier, password);
      
      // Update state with user data
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout method
  const logout = useCallback(() => {
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
  };
};
