import TokenManager from './tokenManager';
import { apiService } from '../config/api.config';
import type { User } from '../types/api';

// Add type definition at the top
interface TokenResponse {
  access: string;
  refresh: string;
}

interface LoginResponse {
  message?: string;
  user: User;
  tokens: TokenResponse;
  is_first_login?: boolean;
}

interface PasswordResetRequest {
  email: string;
}

interface PasswordResetConfirm {
  password: string;
  confirm_password: string;
}

// Use apiService directly since it already has the correct base URL configured
export const authService = {
  login: async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await apiService.auth.login({ email, password });
      const data = response.data as LoginResponse;
      
      if (!data?.tokens?.access || !data?.tokens?.refresh) {
        throw new Error('Invalid token data received');
      }

      // Store tokens with rememberMe preference
      TokenManager.setTokens(
        {
          access: data.tokens.access,
          refresh: data.tokens.refresh
        },
        rememberMe
      );

      return {
        user: data.user,
        tokens: data.tokens,
        isFirstLogin: data.is_first_login
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        await apiService.auth.logout({
          refresh: refreshToken
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenManager.clearTokens();
    }
  },

  verifyEmail: async (token: string) => {
    try {
      const response = await apiService.auth.verifyEmail(token);
      return response.data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await apiService.auth.getProfile();
      return response.data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  },

  updateProfile: async (data: Partial<User>) => {
    try {
      const response = await apiService.auth.updateProfile(data);
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  refreshToken: async () => {
    return TokenManager.refreshToken();
  },

  isAuthenticated: (): boolean => {
    return TokenManager.hasValidTokens();
  },

  requestPasswordReset: async (email: string) => {
    try {
      const response = await apiService.auth.forgotPassword({ email });
      return response.data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },

  resetPassword: async (token: string, password: string, confirmPassword: string) => {
    try {
      const response = await apiService.auth.resetPassword({
        token,
        password,
        confirm_password: confirmPassword
      });
      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }
};
