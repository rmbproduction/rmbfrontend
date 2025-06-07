import { tokenService } from './tokenService';
import apiService from '../config/api.config';
import type { LoginResponse, SignupResponse, User } from '../types/api';

export const authService = {
  login: async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await apiService.auth.login({ email, password });
      
      if (!response.data?.tokens?.access || !response.data?.tokens?.refresh) {
        throw new Error('Invalid token data received');
      }

      // Store tokens
      tokenService.setTokens(
        response.data.tokens.access,
        response.data.tokens.refresh
      );

      return {
        user: response.data.user,
        tokens: response.data.tokens,
        isFirstLogin: response.data.is_first_login
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
      tokenService.clearToken();
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
        throw new Error('No refresh token available');
      }

      // Send refresh token without 'Bearer ' prefix
      const response = await apiService.auth.refreshToken({
        refresh: refreshToken.replace('Bearer ', '').trim()
      });

      if (!response.data?.access) {
        throw new Error('Invalid token refresh response');
      }

      tokenService.setToken(response.data.access);
      return response.data.access;
    } catch (error) {
      console.error('Token refresh error:', error);
      tokenService.clearToken();
      throw error;
    }
  },

  isAuthenticated: (): boolean => {
    return tokenService.hasValidTokens() && !tokenService.isTokenExpired();
  }
};
