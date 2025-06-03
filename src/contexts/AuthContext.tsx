import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { useLogin, useLogout, useProfile } from '../hooks/auth/useAuth';
import TokenManager from '../services/tokenManager';
import { toast } from 'react-toastify';
import { User } from '../schemas/auth';
import { useQueryClient } from '@tanstack/react-query';

interface LoginResponseData {
  message?: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
  is_first_login?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (emailOrTokens: string | { access: string; refresh: string }, password?: string, rememberMe?: boolean) => Promise<LoginResponseData>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const { data: user, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const queryClient = useQueryClient();

  // Debug log for initial mount
  useEffect(() => {
    console.log('AuthProvider Initial State:', {
      hasAccessToken: !!TokenManager.getAccessToken(),
      hasRefreshToken: !!TokenManager.getRefreshToken(),
      isTokenExpired: TokenManager.isTokenExpired(),
      user: user
    });
  }, [user]);

  // Check token expiration periodically
  useEffect(() => {
    console.log('Setting up token check interval');
    const checkTokenInterval = setInterval(() => {
      const isExpired = TokenManager.isTokenExpired();
      const hasRefresh = !!TokenManager.getRefreshToken();
      console.log('Token check:', { isExpired, hasRefresh });
      
      if (isExpired && hasRefresh) {
        console.log('Token expired, attempting refresh...');
        refetchProfile();
      }
    }, 60000); // Check every minute

    return () => {
      console.log('Clearing token check interval');
      clearInterval(checkTokenInterval);
    };
  }, [refetchProfile]);

  const verifyTokenStorage = (tokens: { access: string; refresh: string }, rememberMe: boolean): boolean => {
    try {
      console.log('Verifying token storage:', { rememberMe });
      TokenManager.setTokens(tokens, rememberMe);
      const storedAccess = TokenManager.getAccessToken();
      const storedRefresh = TokenManager.getRefreshToken();
      
      console.log('Token verification check:', {
        hasStoredAccess: !!storedAccess,
        hasStoredRefresh: !!storedRefresh,
        tokensMatch: storedAccess === tokens.access && storedRefresh === tokens.refresh
      });
      
      if (!storedAccess || !storedRefresh) {
        console.error('Token verification failed - tokens not found after storage');
        return false;
      }
      
      if (storedAccess !== tokens.access || storedRefresh !== tokens.refresh) {
        console.error('Token verification failed - stored tokens do not match');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token storage failed:', error);
      return false;
    }
  };

  const login = useCallback(async (emailOrTokens: string | { access: string; refresh: string }, password?: string, rememberMe: boolean = false) => {
    console.log('Login attempt started:', { 
      isOAuth: typeof emailOrTokens === 'object',
      rememberMe 
    });

    try {
      let response;

      if (typeof emailOrTokens === 'object') {
        // OAuth login - tokens provided directly
        console.log('OAuth login with provided tokens');
        const tokensStored = verifyTokenStorage(emailOrTokens, rememberMe);
        
        if (!tokensStored) {
          throw new Error('Login failed: Unable to store authentication tokens');
        }

        // Fetch user profile
        const profileResponse = await refetchProfile();
        const user = profileResponse?.data;

        if (!user) {
          throw new Error('Failed to fetch user profile after OAuth login');
        }

        response = {
          data: {
            message: 'OAuth login successful',
            tokens: emailOrTokens,
            is_first_login: false,
            user
          }
        };
      } else {
        // Regular email/password login
        if (!password) {
          throw new Error('Password is required for email login');
        }

        console.log('Making login request...');
        response = await loginMutation.mutateAsync({ email: emailOrTokens, password, rememberMe });
        console.log('Login response received:', {
          hasTokens: !!response.data?.tokens,
          hasUser: !!response.data?.user,
          status: response.status
        });

        if (!response.data?.tokens?.access || !response.data?.tokens?.refresh) {
          console.error('Invalid login response:', response.data);
          throw new Error('Login failed: No tokens received');
        }
        
        console.log('Setting tokens in TokenManager...');
        const tokensStored = verifyTokenStorage(response.data.tokens, rememberMe);
        
        if (!tokensStored) {
          throw new Error('Login failed: Unable to store authentication tokens');
        }
      }
      
      console.log('Login process completed successfully');
      return response.data;
    } catch (error: any) {
      console.error('Login error:', {
        error,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });

      // Clear any partially stored tokens
      TokenManager.clearTokens();
      
      const message = error.response?.data?.detail || error.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  }, [loginMutation, refetchProfile]);

  const logout = useCallback(async () => {
    try {
      console.log('Logout initiated');
      // Get refresh token before clearing
      const refreshToken = TokenManager.getRefreshToken();
      
      if (!refreshToken) {
        console.log('No refresh token found, clearing local state only');
        TokenManager.clearTokens();
        queryClient.clear();
        return;
      }

      console.log('Attempting server logout...');
      // Try to logout from server first
      await logoutMutation.mutateAsync({ 
        refresh_token: refreshToken.replace('Bearer ', '') 
      });
      
      console.log('Server logout successful, clearing local state');
      // Only clear local state after successful server logout
      TokenManager.clearTokens();
      queryClient.clear();
      
      toast.success('Successfully logged out');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if server logout fails, clear local state for security
      TokenManager.clearTokens();
      queryClient.clear();

      console.log('Logged out locally (server logout failed)');
    }
  }, [logoutMutation, queryClient]);

  const value = useMemo(() => {
    const isAuth = !!TokenManager.getAccessToken() && !TokenManager.isTokenExpired();
    console.log('Auth context value updated:', {
      isAuthenticated: isAuth,
      hasUser: !!user,
      isLoading: profileLoading
    });
    
    return {
      isAuthenticated: isAuth,
      user: user || null,
      login,
      logout,
      isLoading: profileLoading
    };
  }, [user, login, logout, profileLoading]);

  return (
    <AuthContext.Provider value={value}>
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
