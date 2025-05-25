import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { 
  LoginInput, 
  SignupInput, 
  ForgotPasswordInput,
  LoginResponse,
  UserResponse,
  AuthResponse
} from '../schemas/auth';

// Create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request logging
api.interceptors.request.use(
  (config) => {
    const csrfToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='))
      ?.split('=')[1];

    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    console.log('Making request to:', config.url);
    console.log('Request method:', config.method);
    console.log('Request data:', config.data);
    console.log('Request headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response logging
api.interceptors.response.use(
  (response) => {
    console.log('Response from:', response.config.url);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response;
  },
  async (error) => {
    console.error('Response error:', error);
    console.error('Error config:', error.config);
    console.error('Error response:', error.response);

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log('Attempting token refresh...');
        await authApi.refreshToken();
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authApi = {
  login: async (data: LoginInput): Promise<LoginResponse> => {
    const response = await api.post('/accounts/login/', data);
    return response.data;
  },

  register: async (data: SignupInput): Promise<AuthResponse> => {
    const response = await api.post('/accounts/signup/', data);
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/accounts/logout/', {});
    return response.data;
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const response = await api.post('/accounts/token/refresh/', {});
    return response.data;
  },

  verifyEmail: async (token: string): Promise<AuthResponse> => {
    const response = await api.get(`/accounts/verify-email/${token}/`);
    return response.data;
  },

  resendVerificationEmail: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/accounts/resend-verification/', { email });
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordInput): Promise<{ message: string }> => {
    const response = await api.post('/accounts/password/reset/', data);
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await api.post('/accounts/password/reset/confirm/', {
      token,
      password,
    });
    return response.data;
  },

  googleLogin: async (): Promise<{ auth_url: string }> => {
    const response = await api.get('/accounts/google/url/');
    return response.data;
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await api.get('/accounts/user/');
    return response.data;
  },
};

// Create and export QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
}); 