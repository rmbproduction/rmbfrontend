import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { User } from '../schemas/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check authentication status on mount, but only once
  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('jwt='));
    
    if (token) {
      // Only check auth if we have a token
      checkAuth();
    } else {
      setIsInitialized(true);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='));

      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      // Only make the API call if we have a token
      const response = await authApi.getCurrentUser();
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsInitialized(true);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      setUser(response.user || null);
      setIsAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, checkAuth, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 