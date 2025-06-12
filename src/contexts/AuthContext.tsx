import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { tokenService } from '../services/tokenService';
import type { User } from '../types/api';
import TokenManager from '../services/tokenManager';

interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
  isFirstLogin?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          setIsAuthenticated(true);
          const profile = await authService.getProfile();
          setUser(profile);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await handleLogout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('Setting up token refresh mechanism');

    const checkToken = async () => {
      try {
        // Check if access token is expired or will expire soon (within 5 minutes)
        if (TokenManager.isTokenExpired() || TokenManager.willExpireSoon(5)) {
          console.log('Token expired or will expire soon, refreshing...');
          const success = await authService.refreshToken();
          if (!success) {
            console.error('Token refresh failed, logging out');
            await handleLogout();
          } else {
            console.log('Token refreshed successfully');
          }
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        await handleLogout();
      }
    };

    // Run once immediately to check current token status
    checkToken();

    // Then set up interval - check every 4 minutes
    const interval = setInterval(checkToken, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = async (email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password, rememberMe);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
