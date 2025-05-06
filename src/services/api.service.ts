import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '../config/api.config';
import { 
  SubscriptionPlan, 
  Plan, 
  PlanVariant, 
  SubscriptionRequest, 
  UserSubscription,
  VisitSchedule
} from '../models/subscription-plan'; // Added new types

// Base API configuration
const BASE_URL = 'http://localhost:8000/api';
const MARKETPLACE_URL = `${BASE_URL}/marketplace`;

// Add subscription API URL
const SUBSCRIPTION_URL = `${BASE_URL}/subscription`;

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
        if (!window.location.pathname.includes('/login')) {
          // Use setTimeout to ensure this happens outside of current call stack
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
      
      return new Error('Authentication required. Please log in again.');
    }
    
    // Handle specific error messages from API
    if (data) {
      if (data.detail) {
        return new Error(data.detail);
      }
      
      if (data.error) {
        return new Error(data.error);
      }
      
      // Check for field-specific errors
      if (typeof data === 'object' && data !== null) {
        const fieldErrors = Object.entries(data)
          .filter(([key, value]) => key !== 'detail' && key !== 'error')
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ');
        
        if (fieldErrors) {
          return new Error(`Validation errors: ${fieldErrors}`);
        }
      }
    }
    
    // Handle specific HTTP status codes
    if (status === 404) {
      return new Error('Resource not found.');
    }
    
    if (status === 400) {
      return new Error('Invalid request. Please check your inputs.');
    }
    
    if (status === 500) {
      return new Error('Server error. Please try again later.');
    }
    
    // General axios error
    return new Error(axiosError.message || 'Network error. Please check your connection.');
  }
  
  // General error
  return error instanceof Error ? error : new Error('An unexpected error occurred.');
};

// Configure axios with default headers
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Initialize authorization header with existing token on module load
const existingToken = localStorage.getItem('accessToken');
if (existingToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
}

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    // Public endpoints that don't require authentication
    const publicEndpoints = [
      '/subscription/plans',
      '/subscription/plan-variants'
    ];
    
    // Check if the current URL matches any public endpoint
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    // Only add the token for non-public endpoints
    if (!isPublicEndpoint) {
      // Get the latest token from localStorage (it might have changed since app startup)
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Public endpoints that don't require authentication
    const publicEndpoints = [
      '/subscription/plans',
      '/subscription/plan-variants'
    ];
    
    // Check if the current URL matches any public endpoint
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      originalRequest.url?.includes(endpoint)
    );
    
    // Only attempt refresh if this is an auth error, we haven't already tried to refresh,
    // and this is not a public endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Call refresh token endpoint
        const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, { 
          refresh: refreshToken 
        });
        
        // Update tokens
        localStorage.setItem('accessToken', response.data.access);
        
        // Update authorization header and retry the original request
        originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Handle refresh token error separately to avoid recursion
        return Promise.reject(handleApiError(refreshError));
      }
    }
    
    // For public endpoints with a 401 error, transform the error
    if (isPublicEndpoint && error.response?.status === 401) {
      console.warn('Public endpoint returned 401 - continuing without authentication');
      // Instead of rejecting with an auth error, return an empty result
      // that the components can handle
      if (originalRequest.url?.includes('/plans')) {
        return Promise.resolve({ data: [] });
      } else if (originalRequest.url?.includes('/plan-variants')) {
        return Promise.resolve({ data: [] });
      }
    }
    
    // Handle other errors
    return Promise.reject(handleApiError(error));
  }
);

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;

  private constructor() {
    // Initialize with token from localStorage if available
    this.token = localStorage.getItem('auth_token');
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = API_CONFIG.getApiUrl(endpoint);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      return {
        data: data as T,
        status: response.status,
        message: data.message,
      };
    } catch (error) {
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/token/', { email, password });
    return response.data;
  }

  async register(userData: any) {
    const response = await apiClient.post('/auth/register/', userData);
    return response.data;
  }

  async getUserProfile() {
    return this.request<any>(API_CONFIG.ENDPOINTS.PROFILE, {
      method: 'GET',
    });
  }

  // Vehicle endpoints
  async getManufacturers() {
    return this.request<any[]>(API_CONFIG.ENDPOINTS.MANUFACTURERS);
  }

  async getVehicleModels(manufacturerId: number, vehicleTypeId: number) {
    return this.request<any[]>(
      API_CONFIG.ENDPOINTS.getFilteredModels(manufacturerId, vehicleTypeId)
    );
  }

  async getUserVehicles() {
    return this.request<any[]>(API_CONFIG.ENDPOINTS.USER_VEHICLES);
  }

  // Service endpoints
  async getServices() {
    return this.request<any[]>(API_CONFIG.ENDPOINTS.SERVICES.LIST);
  }

  async getFieldStaff() {
    // Since FIELD_STAFF doesn't exist in API_CONFIG, use a fallback endpoint or define it
    return this.request<any[]>('/field-staff/');
  }

  async getReviews() {
    // Since REVIEWS doesn't exist in API_CONFIG, use a fallback endpoint or define it
    return this.request<any[]>('/reviews/');
  }

  async getPricingPlans() {
    // Since PRICING_PLANS doesn't exist in API_CONFIG, use a fallback endpoint or define it
    return this.request<any[]>('/pricing-plans/');
  }

  async getAdditionalServices() {
    // Since ADDITIONAL_SERVICES doesn't exist in API_CONFIG, use a fallback endpoint or define it
    return this.request<any[]>('/additional-services/');
  }

  // Marketplace endpoints
  async createSellRequest(requestData: any) {
    const response = await apiClient.post('/marketplace/sell-requests/', requestData);
    return response.data;
  }

  async getSellRequest(requestId: string) {
    const response = await apiClient.get(`/marketplace/sell-requests/${requestId}/`);
    return response.data;
  }

  async getUserSellRequests() {
    const response = await apiClient.get('/marketplace/sell-requests/');
    return response.data;
  }

  async scheduleInspection(sellRequestId: string, dateTime: string) {
    const response = await apiClient.post(
      `/marketplace/sell-requests/${sellRequestId}/schedule/`,
      { pickup_slot: dateTime }
    );
    return response.data;
  }

  // Subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await apiClient.get('/repairing_service/subscription-plans/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  // Create a subscription booking
  async createSubscription(payload: {
    plan_option: number;
    vehicle: number;
    appointments: string[];
  }) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Authentication required');
    }
    const response = await apiClient.post('/repairing_service/subscriptions/create/', payload, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  }

  // NEW SUBSCRIPTION SYSTEM METHODS

  // Get all plans
  async getPlans(): Promise<Plan[]> {
    const response = await apiClient.get(`${SUBSCRIPTION_URL}/plans/`);
    return response.data;
  }
  
  // Get all plan variants
  async getPlanVariants(planId?: number): Promise<PlanVariant[]> {
    let url = `${SUBSCRIPTION_URL}/plan-variants/`;
    if (planId) {
      url += `?plan=${planId}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  }

  // Get variants for a specific plan
  async getPlanWithVariants(planId: number): Promise<PlanVariant[]> {
    const response = await apiClient.get(`${SUBSCRIPTION_URL}/plans/${planId}/variants/`);
    return response.data;
  }
  
  // Create a subscription request
  async createSubscriptionRequest(
    planVariantId: number, 
    customerInfo?: {
      customer_name?: string;
      customer_email?: string;
      customer_phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postal_code?: string;
    },
    vehicleInfo?: {
      vehicle_type?: number;
      manufacturer?: number;
      vehicle_model?: number;
    },
    scheduleInfo?: {
      schedule_date?: string;
      schedule_time?: string;
    }
  ): Promise<SubscriptionRequest> {
    const payload = {
      plan_variant: planVariantId,
      // Add customer information if provided
      ...(customerInfo && customerInfo),
      // Add vehicle information if provided
      ...(vehicleInfo && vehicleInfo),
      // Add schedule information if provided
      ...(scheduleInfo && scheduleInfo)
    };
    
    const response = await apiClient.post(`${SUBSCRIPTION_URL}/subscription-requests/`, payload);
    return response.data;
  }
  
  // Get all subscription requests for the current user
  async getSubscriptionRequests(): Promise<SubscriptionRequest[]> {
    const response = await apiClient.get(`${SUBSCRIPTION_URL}/subscription-requests/`);
    return response.data;
  }
  
  // Get user's active subscription
  async getActiveSubscription(): Promise<UserSubscription | null> {
    try {
      const response = await apiClient.get(`${SUBSCRIPTION_URL}/subscriptions/active/`);
      return response.data;
    } catch (error) {
      // It's expected to get a 404 if no active subscription exists
      if (error instanceof Error && error.message.includes('Resource not found')) {
        return null;
      }
      throw error;
    }
  }
  
  async getUserSubscriptions(): Promise<UserSubscription[]> {
    try {
      const response = await apiClient.get(`${SUBSCRIPTION_URL}/subscriptions/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  async getSubscriptionVisits(subscriptionId: number): Promise<VisitSchedule[]> {
    try {
      const response = await apiClient.get(`${SUBSCRIPTION_URL}/subscriptions/${subscriptionId}/visits/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId: number): Promise<UserSubscription> {
    const response = await apiClient.post(`${SUBSCRIPTION_URL}/subscriptions/${subscriptionId}/cancel/`);
    return response.data;
  }
  
  // Schedule a visit
  async scheduleVisit(subscriptionId: number, scheduledDate: string, notes?: string): Promise<VisitSchedule> {
    try {
      const payload = {
        subscription: subscriptionId,
        scheduled_date: scheduledDate,
        service_notes: notes || ''
      };
      console.log('[DEBUG] Scheduling visit with payload:', payload);
      const response = await apiClient.post(`${SUBSCRIPTION_URL}/visits/`, payload);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error scheduling visit:', error);
      throw error;
    }
  }
  
  // Get upcoming visits
  async getUpcomingVisits(): Promise<VisitSchedule[]> {
    const response = await apiClient.get(`${SUBSCRIPTION_URL}/visits/upcoming/`);
    return response.data;
  }
  
  // Cancel a visit
  async cancelVisit(visitId: number, notes?: string): Promise<VisitSchedule> {
    const payload = { cancellation_notes: notes || '' };
    const response = await apiClient.post(`${SUBSCRIPTION_URL}/visits/${visitId}/cancel/`, payload);
    return response.data;
  }

  // File upload helper
  async uploadFile(url: string, file: File, onProgress?: (progress: number) => void) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', API_CONFIG.getApiUrl(url));
      if (this.token) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      }
      xhr.send(formData);
    });
  }
}

export const apiService = ApiService.getInstance();
