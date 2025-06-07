import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../config/api.config';
import TokenManager from '../../services/tokenManager';
import { User } from '../../schemas/auth';
import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponseData {
  message?: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

interface LoginResponse {
  status: number;
  data: LoginResponseData;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
}

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const response = await apiService.auth.getProfile();
        return response.data;
      } catch (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
    },
    enabled: TokenManager.getAccessToken() !== null,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginData): Promise<LoginResponseData> => {
      console.log('Login attempt started:', {
        email: data.email,
        password: data.password ? 'PROVIDED' : 'MISSING',
        rememberMe: data.rememberMe
      });
      
      const response = await apiService.auth.login({
        email: data.email,
        password: data.password
      });

      console.log('Login response validation:', {
        hasTokens: !!response.data.tokens,
        hasUser: !!response.data.user,
        tokenFormat: 'tokens' in response.data ? 'nested' : 'root'
      });

      // Store tokens using TokenManager
      if (response.data?.tokens?.access && response.data?.tokens?.refresh) {
        TokenManager.setTokens(response.data.tokens, data.rememberMe);
        console.log('Token verification check:', {
          accessToken: !!TokenManager.getAccessToken(),
          refreshToken: !!TokenManager.getRefreshToken()
        });
      } else {
        throw new Error('Login failed: No tokens received');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useSignup = () => {
  return useMutation({
    mutationFn: (data: SignupData) => 
      apiService.auth.signup(data),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { refresh_token: string }) => 
      apiService.auth.logout(data),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.auth.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: apiService.auth.forgotPassword,
  });
};

export const useGoogleLogin = () => {
  return useMutation({
    mutationFn: apiService.auth.googleLogin,
  });
}; 