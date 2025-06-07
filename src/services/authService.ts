import { tokenService } from './tokenService';
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
      tokenService.setTokens(
        data.tokens.access,
        data.tokens.refresh,
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
      const refreshToken = tokenService.getRefreshToken();
      if (refreshToken) {
        // Send refresh token without 'Bearer ' prefix
        await apiService.auth.logout({
          refresh: refreshToken.replace('Bearer ', '').trim()
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear tokens regardless of API call success
      tokenService.clearTokens();
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
    try {
      const refreshToken = tokenService.getRefreshToken();
      if (!refreshToken) {
        console.error('No refresh token found in storage');
        tokenService.clearTokens();
        throw new Error('No refresh token available');
      }

      // Clean the refresh token before sending
      const cleanToken = refreshToken.replace('Bearer ', '').trim();
      
      if (!cleanToken) {
        console.error('Invalid refresh token format');
        tokenService.clearTokens();
        throw new Error('Invalid refresh token');
      }

      const response = await apiService.auth.refreshToken({
        refresh: cleanToken
      });

      const tokenData = response.data as TokenResponse;
      if (!tokenData.access) {
        console.error('Invalid token refresh response:', tokenData);
        tokenService.clearTokens();
        throw new Error('Invalid token refresh response');
      }

      // Store the new access token
      tokenService.setToken(tokenData.access);
      return tokenData.access;
    } catch (error) {
      console.error('Token refresh error:', error);
      tokenService.clearTokens();
      throw error;
    }
  },

  isAuthenticated: (): boolean => {
    return tokenService.hasValidTokens() && !tokenService.isTokenExpired();
  }
};
