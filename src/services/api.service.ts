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
import { withRetry, withTimeout, isNetworkError } from '../utils/apiUtils';
import * as apiHelpers from '../utils/apiHelpers';
import { isOnline, checkNetworkStatus } from '../utils/networkUtils';

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

// Add request interceptor to check network status
apiClient.interceptors.request.use(
  async (config) => {
    // Check if we're offline before making requests
    if (!isOnline()) {
      console.warn(`[API] Device is offline, request to ${config.url} may fail`);
      
      // Add a custom header to track offline requests
      config.headers = config.headers || {};
      config.headers['X-Offline-Request'] = 'true';
      
      // Increase timeout for offline requests
      config.timeout = DEFAULT_TIMEOUT * 2;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for offline handling
apiClient.interceptors.response.use(
  (response) => {
    // Clear any previous offline status
    if (document.body.classList.contains('offline-mode')) {
      checkNetworkStatus().then(status => {
        if (status.online) {
          document.body.classList.remove('offline-mode');
        }
      });
    }
    return response;
  },
  async (error) => {
    // Check if error is network-related
    if (isNetworkError(error)) {
      console.warn('[API] Network error detected:', error.message);
      
      // Mark UI as offline
      document.body.classList.add('offline-mode');
      
      // Check if we should retry based on error type
      const request = error.config;
      if (request && !request._isRetry) {
        request._isRetry = true;
        
        // When we come back online, retry the request
        return new Promise(resolve => {
          const onlineListener = async () => {
            window.removeEventListener('online', onlineListener);
            console.log('[API] Network connection restored, retrying request');
            
            try {
              // Verify we're really back online with a quick check
              const status = await checkNetworkStatus();
              if (status.online) {
                // We're back online, retry the request
                resolve(apiClient(request));
              } else {
                // Still offline, reject with the original error
                resolve(Promise.reject(error));
              }
            } catch (e) {
              // Error checking network status, reject original error
              resolve(Promise.reject(error));
            }
          };
          
          window.addEventListener('online', onlineListener);
          
          // If we're actually online already, trigger the listener
          if (navigator.onLine) {
            onlineListener();
          }
        });
      }
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.log('[API] Unauthorized request, clearing auth state');
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
    }
    
    return Promise.reject(error);
  }
);

// Standard error handling function
export const handleApiError = (error: any): Error => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data as any;
    
    // Network errors
    if (isNetworkError(error)) {
      return new Error('Network error. Please check your internet connection and try again.');
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
  
  // Check API availability - useful for connectivity testing
  async checkApiAvailability(): Promise<boolean> {
    try {
      await apiClient.get('/health/', { timeout: 5000 });
      return true;
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();
