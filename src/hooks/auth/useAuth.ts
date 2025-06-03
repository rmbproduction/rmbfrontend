import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../config/api.config';
import TokenManager from '../../services/tokenManager';
import { User } from '../../schemas/auth';
import { useState, useEffect } from 'react';

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

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginData): Promise<LoginResponse> => {
      console.log('Login mutation data:', {
        email: data.email,
        password: data.password ? 'PROVIDED' : 'MISSING',
        rememberMe: data.rememberMe
      });
      
      const response = await apiService.auth.login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      });

      // The response should already be transformed by the interceptor
      if (!response.data?.tokens?.access || !response.data?.tokens?.refresh) {
        console.error('Invalid login response structure:', response.data);
        throw new Error('Login failed: Invalid response structure');
      }

      console.log('Login response validation:', {
        hasTokens: !!response.data.tokens,
        hasUser: !!response.data.user,
        tokenFormat: 'tokens' in response.data ? 'nested' : 'root'
      });

      return response as LoginResponse;
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

export const useProfile = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const response = await apiService.auth.getProfile();
        return response.data;
      } catch (error) {
        console.error('Profile fetch error:', error);
        return null;
      }
    },
    retry: false
  });

  return { data, isLoading, error, refetch };
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