import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../config/api.config';
import TokenManager from '../../services/tokenManager';
import type { User } from '../../schemas/auth';
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

interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

interface TokenResponse {
  access: string;
  refresh: string;
}

interface UserResponse {
  user: User;
  tokens: TokenResponse;
  is_first_login?: boolean;
}

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
    mutationFn: async ({ email, password, rememberMe }: { 
      email: string; 
      password: string; 
      rememberMe?: boolean 
    }) => {
      const response = await apiService.auth.login({ email, password });
      return response.data as UserResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
};

export const useSignup = () => {
  return useMutation({
    mutationFn: async ({ email, username, password }: { 
      email: string; 
      username: string; 
      password: string 
    }) => {
      const response = await apiService.auth.signup({ email, username, password });
      return response.data;
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ refresh }: { refresh: string }) => {
      const response = await apiService.auth.logout({ refresh });
      return response.data;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await apiService.auth.updateProfile(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await apiService.auth.forgotPassword({ email });
      return response.data;
    },
  });
};

export const useGoogleLogin = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiService.auth.googleLogin();
      return response.data;
    },
  });
}; 