import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '../config/api.config';
import { 
  SubscriptionPlan, 
  Plan, 
  PlanVariant, 
  SubscriptionRequest, 
  UserSubscription,
  VisitSchedule
} from '../models/subscription-plan';
import { UserProfile } from '../models/user';
import { withRetry } from '../utils/apiUtils';
import * as apiHelpers from '../utils/apiHelpers';

// Base API configuration
const { BASE_URL, DEFAULT_TIMEOUT } = API_CONFIG;
const MARKETPLACE_URL = API_CONFIG.MARKETPLACE_URL;
const SUBSCRIPTION_URL = `${BASE_URL}/subscription`;

// Configure axios with default headers
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: DEFAULT_TIMEOUT
});

// Initialize authorization header with existing token on module load
const existingToken = localStorage.getItem('accessToken');
if (existingToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
}

// Standard error handling function
export const handleApiError = (error: any): Error => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data as any;
    
    // Handle authentication errors
    if (status === 401 || status === 403) {
      // Clear auth token on unauthorized
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Only redirect to login from browser environment
      if (typeof window !== 'undefined') {
        // Don't redirect if already on login page to avoid redirect loops
        if (!window.location.pathname.includes('/login-signup')) {
          // Use setTimeout to ensure this happens outside of current call stack
          setTimeout(() => {
            window.location.href = '/login-signup';
          }, 100);
        }
      }
      
      return new Error('Authentication failed. Please log in again.');
    }
    
    // Handle specific error responses with messages
    if (data && data.detail) {
      return new Error(data.detail);
    }
    
    // Use status text or generic message as fallback
    return new Error(axiosError.response?.statusText || 'An error occurred with the API request');
  }
  
  // For non-Axios errors, return as is or convert to Error
  return error instanceof Error ? error : new Error(String(error));
};

// Authentication utilities
export const setAuthToken = (token: string): void => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('accessToken', token);
  }
};

export const clearAuthToken = (): void => {
  delete apiClient.defaults.headers.common['Authorization'];
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Singleton API Service Class
class ApiService {
  private static instance: ApiService;
  
  private constructor() {
    // Private constructor to prevent direct construction calls
  }
  
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }
  
  // Authentication Methods
  
  async register(userData: any): Promise<any> {
    try {
      const response = await apiClient.post('/accounts/register/', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  async login(credentials: { email: string; password: string }): Promise<any> {
    try {
      const response = await apiClient.post('/accounts/login/', credentials);
      const { access, refresh, user } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      // Set auth header for future requests
      setAuthToken(access);
      
      return { token: access, refreshToken: refresh, user };
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  async logout(): Promise<void> {
    try {
      await apiClient.post('/accounts/logout/');
    } catch (error) {
      console.warn('Logout failed:', error);
    } finally {
      clearAuthToken();
    }
  }
  
  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const response = await apiClient.post('/accounts/token/refresh/', { refresh: refreshToken });
      const { access } = response.data;
      
      // Update stored token and auth header
      localStorage.setItem('accessToken', access);
      setAuthToken(access);
      
      return access;
    } catch (error) {
      clearAuthToken();
      throw handleApiError(error);
    }
  }

  // User Profile Methods
  
  // Use the retryable method from our helpers
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      return await apiHelpers.getUserProfile(userId);
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await apiClient.patch(`/accounts/profile/${userId}/`, profileData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  // Subscription Methods
  
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await apiClient.get(`${SUBSCRIPTION_URL}/plans/`);
      return response.data;
    } catch (error) {
      console.warn('Error fetching subscription plans:', error);
      return [];
    }
  }
  
  // Use the retryable method from our helpers
  async getUserSubscriptions(): Promise<UserSubscription[]> {
    try {
      return await apiHelpers.getUserSubscriptions();
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  // Use the retryable method from our helpers
  async getSubscriptionVisits(subscriptionId: number): Promise<VisitSchedule[]> {
    try {
      return await apiHelpers.getSubscriptionVisits(subscriptionId);
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  // Additional methods can be added here
}

// Export singleton instance
export const apiService = ApiService.getInstance();
