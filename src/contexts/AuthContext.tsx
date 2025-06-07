import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { tokenService } from '../services/tokenService';
import type { User } from '../types/api';

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

    const checkToken = async () => {
      try {
        if (tokenService.isTokenExpired()) {
          await authService.refreshToken();
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        await handleLogout();
      }
    };

    const interval = setInterval(checkToken, 4 * 60 * 1000); // Check every 4 minutes
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
