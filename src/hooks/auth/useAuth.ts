import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService, API_BASE_URL } from '../../config/api.config';
import TokenManager from '../../services/tokenManager';
import { User } from '../../schemas/auth';
import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import type { LoginResponse, SignupResponse } from '../../types/api';
import axios from 'axios';

// Create a dedicated auth axios instance with the correct base URL
const authAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    mutationFn: async ({ email, password, rememberMe }: { email: string; password: string; rememberMe?: boolean }) => {
      const response = await authAxios.post('/accounts/login/', { email, password });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useSignup = () => {
  return useMutation({
    mutationFn: async ({ email, username, password }: { email: string; username: string; password: string }) => {
      const response = await authAxios.post('/accounts/signup/', { email, username, password });
      return response.data;
    },
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
    mutationFn: async ({ email }: { email: string }) => {
      const response = await authAxios.post('/accounts/password/reset/', { email });
      return response.data;
    },
  });
};

export const useGoogleLogin = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await authAxios.get('/accounts/google/login/');
      return response.data;
    },
  });
}; 