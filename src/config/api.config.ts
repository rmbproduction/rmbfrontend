/// <reference types="vite/client" />
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import TokenManager from '../services/tokenManager';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from './endpoints';
import type { LoginResponse } from '../types/api.types';

// Define types for environment variables
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_API_TIMEOUT: string;
    readonly VITE_FRONTEND_URL?: string;
    readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
    readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
    readonly VITE_CLOUDINARY_API_KEY?: string;
    readonly VITE_CLOUDINARY_API_SECRET?: string;
    // Add other env variables as needed
  }
}

// Extend AxiosRequestConfig to include retry property
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Create a new QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://repairmybike.up.railway.app/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    const currentPath = window.location.pathname;

    console.log('Response error:', {
      status: error.response?.status,
      url: originalRequest?.url,
      hasRetried: !!originalRequest?._retry,
      isPublicRoute: isPublicRoute(currentPath)
    });

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry && !isPublicRoute(currentPath)) {
      originalRequest._retry = true;

      try {
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken) {
          console.log('No refresh token available');
          await handleLogoutCleanup();
          return Promise.reject(error);
        }

        console.log('Attempting to refresh token');
        const response = await axios.post<{ access: string }>(
          `${API_BASE_URL}/accounts/token/refresh/`,
          { refresh: refreshToken },
          { withCredentials: true }
        );

        if (response.data?.access) {
          console.log('Token refresh successful');
          
          // Update tokens
          TokenManager.setTokens({
            access: response.data.access,
            refresh: refreshToken
          });

          // Update auth header and retry original request
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return axiosInstance(originalRequest);
        } else {
          console.error('Token refresh failed - no access token in response');
          await handleLogoutCleanup();
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        await handleLogoutCleanup();
      }
    }

    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Handle specific HTTP errors
    switch (error.response.status) {
      case 400: {
        const errorDetail = (error.response.data as any)?.detail || (error.response.data as any)?.message;
        toast.error(errorDetail || 'Invalid request. Please check your input.');
        break;
      }
      case 401:
        toast.error('Session expired. Please login again.');
        TokenManager.clearTokens();
        window.location.href = '/login';
        break;
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('Resource not found.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

// Create axios instance with default config
const axiosInstanceWithCredentials = axios.create({
  baseURL: API_BASE_URL.replace(/\/+$/, ''),  // Remove trailing slashes
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor for adding auth token
axiosInstanceWithCredentials.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    // Clean up the URL parts
    const baseUrl = (config.baseURL || '').replace(/\/+$/, '');
    let url = (config.url || '').replace(/^\/+/, '');

    // Ensure trailing slash for Django URLs
    if (url && !url.endsWith('/')) {
      url = `${url}/`;
    }

    // Set the cleaned url
    config.url = url;
    config.baseURL = baseUrl;

    // Calculate and log the full URL for debugging
    const fullUrl = `${baseUrl}/${url}`;
    console.log('Making request:', {
      url: config.url,
      baseURL: config.baseURL,
      fullUrl,
      method: config.method,
      hasAuthHeader: config.headers?.Authorization ? true : false
    });

    // Get the access token
    const token = TokenManager.getAccessToken();
    
    // Only add token if we have one and it's not a login/verify request
    if (token && !url.includes('login') && !url.includes('verify-email')) {
      console.log('Adding auth token to request');
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('No token added to request:', {
        hasToken: !!token,
        isLoginRequest: url.includes('login'),
        isVerifyRequest: url.includes('verify-email')
      });
    }

    return config;
  },
  (error: Error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Helper function to check if a route is public
const isPublicRoute = (url: string): boolean => {
  const publicRoutes = [
    '/login',
    '/verify-email',
    '/resend-verification',
    '/reset-password',
    '/password-reset-confirmation',
    '/',
    '/vehicles',
    '/service',
    '/contact',
    '/about-us'
  ];
  return publicRoutes.some(route => url.includes(route));
};

// Utility function to handle all cleanup during logout
async function handleLogoutCleanup() {
  console.log('=== STARTING LOGOUT CLEANUP ===');
  
  try {
    // 1. Clear all tokens
    TokenManager.clearTokens();
    console.log('Tokens cleared');

    // 2. Clear all React Query cache
    queryClient.clear();
    console.log('Query cache cleared');

    // 3. Cancel any ongoing queries
    await queryClient.cancelQueries();
    console.log('Ongoing queries cancelled');

    // 4. Remove any other auth-related storage
    localStorage.removeItem('user');
    sessionStorage.clear();
    console.log('Additional storage cleared');

    // 5. Reset auth-related queries
    await Promise.all([
      queryClient.resetQueries({ queryKey: ['profile'] }),
      queryClient.resetQueries({ queryKey: ['auth'] })
    ]);
    console.log('Auth queries reset');

    console.log('=== LOGOUT CLEANUP COMPLETED ===');
  } catch (error) {
    console.error('Error during logout cleanup:', error);
    // Still clear tokens even if other cleanup fails
    TokenManager.clearTokens();
  }
}

// API service functions
export const apiService = {
  // Auth services
  auth: {
    login: async (data: { email: string; password: string; rememberMe?: boolean }): Promise<AxiosResponse<LoginResponse>> => {
      console.log('=== LOGIN ATTEMPT START ===');
      console.log('Login request data:', {
        email: data.email,
        hasPassword: !!data.password,
        rememberMe: data.rememberMe
      });
      
      try {
        const loginData = {
          email: data.email,
          password: data.password
        };

        console.log('Making API request to:', `${API_BASE_URL}/${API_ENDPOINTS.auth.login}`);

        const response = await axiosInstance.post<LoginResponse>(
          API_ENDPOINTS.auth.login,
          loginData,
          {
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        
        console.log('=== RAW API RESPONSE ===');
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (!response.data) {
          console.error('Empty response received');
          throw new Error('Empty response received');
        }

        const { tokens } = response.data;

        // Debug: Log the exact structure of tokens
        console.log('=== TOKEN DEBUG ===');
        console.log('Raw tokens object:', tokens);
        console.log('Access token exists:', !!tokens?.access);
        console.log('Refresh token exists:', !!tokens?.refresh);
        console.log('Tokens structure:', {
          isObject: typeof tokens === 'object',
          hasAccess: 'access' in (tokens || {}),
          hasRefresh: 'refresh' in (tokens || {}),
          accessType: typeof tokens?.access,
          refreshType: typeof tokens?.refresh
        });

        // Simplified but effective token validation
        if (!tokens || !tokens.access || !tokens.refresh) {
          console.error('Token validation failed:', {
            hasTokens: !!tokens,
            hasAccess: !!tokens?.access,
            hasRefresh: !!tokens?.refresh
          });
          throw new Error('Invalid or missing tokens in response');
        }

        // Debug: Log token lengths and partial values (safely)
        console.log('=== TOKEN VALIDATION SUCCESS ===');
        console.log('Token lengths:', {
          access: tokens.access.length,
          refresh: tokens.refresh.length
        });
        console.log('Token previews:', {
          access: `${tokens.access.substring(0, 15)}...`,
          refresh: `${tokens.refresh.substring(0, 15)}...`
        });

        // Debug: Log localStorage operations
        console.log('=== TOKEN STORAGE ===');
        console.log('Attempting to store tokens using TokenManager...');

        // Store tokens using TokenManager
        try {
          TokenManager.setTokens(tokens, data.rememberMe || false);
          console.log('Tokens successfully stored using TokenManager');
          
          // Verify storage
          const storedAccess = TokenManager.getAccessToken();
          const storedRefresh = TokenManager.getRefreshToken();
          console.log('Storage verification:', {
            accessStored: !!storedAccess,
            refreshStored: !!storedRefresh,
            accessLength: storedAccess?.length,
            refreshLength: storedRefresh?.length
          });
        } catch (storageError) {
          console.error('Failed to store tokens:', storageError);
          // Continue execution as this is not critical
        }

        return response;
      } catch (error: any) {
        console.error('=== LOGIN ERROR ===');
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        // Enhanced error handling with specific messages
        if (error.response?.status === 401) {
          throw new Error('Invalid credentials');
        } else if (error.response?.status === 400) {
          throw new Error(error.response.data.message || 'Invalid request data');
        } else if (error.response) {
          throw new Error(error.response.data.message || 'Server error occurred');
        } else if (error.request) {
          throw new Error('No response from server');
        } else {
          throw new Error(error.message || 'An unexpected error occurred');
        }
      }
    },
    signup: async (data: { username: string; email: string; password: string }) => {
      try {
        const response = await axiosInstance.post(API_ENDPOINTS.auth.signup, data);
        return response;
      } catch (error) {
        console.error('Signup error:', error);
        throw error;
      }
    },
    verifyEmail: async (token: string) => {
      try {
        // Using GET request with token in URL path to match backend route exactly
        const url = API_ENDPOINTS.auth.verifyEmail(token);
        console.log('Making verification request to:', url);
        const response = await axiosInstance.get(url);
        console.log('Verification response:', response);
        return response;
      } catch (error) {
        console.error('Email verification error:', error);
        throw error;
      }
    },
    resendVerification: (email: string) =>
      axiosInstance.post(API_ENDPOINTS.auth.resendVerification, { email }),
    resetPassword: (data: { password: string; confirmPassword: string }) =>
      axiosInstance.post(API_ENDPOINTS.auth.passwordReset, data),
    resetPasswordConfirm: (token: string, data: { password: string; confirmPassword: string }) =>
      axiosInstance.post(API_ENDPOINTS.auth.passwordResetConfirm(token), data),
    logout: async () => {
      console.log('=== LOGOUT STARTED ===');
      try {
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken) {
          console.log('No refresh token found during logout');
          await handleLogoutCleanup();
          return { status: 200, message: 'Logged out successfully' };
        }

        const response = await axiosInstance.post(API_ENDPOINTS.auth.logout, {
          refresh: refreshToken
        });

        console.log('Logout API response:', response.status);
        await handleLogoutCleanup();
        return response;
      } catch (error) {
        console.error('Logout error:', error);
        await handleLogoutCleanup();
        throw error;
      }
    },
    getProfile: async () => {
      const accessToken = TokenManager.getAccessToken();
      if (!accessToken) {
        console.log('No access token available for profile fetch');
        return { data: null };
      }

      try {
        console.log('Fetching profile with token');
        const response = await axiosInstance.get(API_ENDPOINTS.auth.profile);
        console.log('Profile fetch successful');
        return response;
      } catch (error: any) {
        console.error('Profile fetch failed:', {
          status: error.response?.status,
          data: error.response?.data
        });
        
        if (error.response?.status === 401) {
          await handleLogoutCleanup();
          return { data: null };
        }
        throw error;
      }
    },
    updateProfile: async (data: any) => {
      return axiosInstance.patch(API_ENDPOINTS.auth.profile, data);
    },
    forgotPassword: async (data: { email: string }) => {
      return axiosInstance.post(API_ENDPOINTS.auth.passwordReset, data);
    },
    googleLogin: async () => {
      return axiosInstance.get(API_ENDPOINTS.auth.googleLogin);
    },
  },

  // Vehicle marketplace services
  marketplace: {
    getVehicles: async (params?: any) => {
      const response = await axiosInstance.get(API_ENDPOINTS.marketplace.vehicles, { params });
      return response.data;
    },
    getVehicle: async (id: string) => {
      const response = await axiosInstance.get(API_ENDPOINTS.marketplace.vehicle(id));
      return response.data;
    },
    createSellRequest: (formData: FormData) => 
      axiosInstance.post(API_ENDPOINTS.marketplace.sellRequests, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    updateSellRequest: async (id: string, data: any) => {
      const response = await axiosInstance.patch(
        API_ENDPOINTS.marketplace.sellRequest(id),
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    getSellRequests: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.marketplace.sellRequests);
      return response.data;
    },
    getSellRequest: async (id: string) => {
      const response = await axiosInstance.get(API_ENDPOINTS.marketplace.sellRequest(id));
      return response.data;
    },
    createBooking: async (data: any) => {
      const response = await axiosInstance.post(API_ENDPOINTS.marketplace.bookings, data);
      return response.data;
    },
  },

  // Repair service functions
  services: {
    // Categories and services
    getCategories: () => axiosInstance.get(API_ENDPOINTS.services.categories),
    getServices: () => axiosInstance.get(API_ENDPOINTS.services.services),
    
    // Service pricing
    getServicePrice: (serviceId: string) => 
      axiosInstance.get(API_ENDPOINTS.services.servicePrice(serviceId)),
    
    // Cart related
    createCart: () => axiosInstance.post(API_ENDPOINTS.services.createCart),
    getUserCarts: () => axiosInstance.get(API_ENDPOINTS.services.listCarts),
    getCart: (cartId: number) => axiosInstance.get(API_ENDPOINTS.services.cartDetail(cartId)),
    addToCart: (cartId: number, item: any) => 
      axiosInstance.post(API_ENDPOINTS.services.addToCart(cartId), item),
    updateCartItem: (cartId: number, itemId: number, quantity: number) => 
      axiosInstance.post(API_ENDPOINTS.services.updateCartItem(cartId), { cart_item_id: itemId, quantity }),
    clearCart: (cartId: number) => 
      axiosInstance.delete(API_ENDPOINTS.services.clearCart(cartId)),
    removeCartItem: (itemId: number) => 
      axiosInstance.delete(API_ENDPOINTS.services.removeCartItem(itemId)),
    
    // Bookings
    getUserBookings: () => axiosInstance.get(API_ENDPOINTS.services.myRepairs),

    // Create a booking
    createBooking: (data: {
      service_id: string;
      package_id?: string;
      vehicle_manufacturer_id: number;
      vehicle_model_id: number;
      price: string;
      is_custom_price: boolean;
      quantity: number;
    }) => 
      axiosInstance.post('/repairing-service/bookings/create/', data),
  },

  // Profile functions
  profile: {
    getDetails: async () => {
      try {
        console.log('Getting profile details...');
        const token = TokenManager.getAccessToken();
        if (!token) {
          console.log('No access token found');
          return { data: null };
        }

        const response = await axiosInstance.get(API_ENDPOINTS.profile.details);
        console.log('Profile details response:', response.data);
        return { data: response.data };
      } catch (error: any) {
        console.error('Profile fetch error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        if (error.response?.status === 401) {
          TokenManager.clearTokens();
        }
        throw error;
      }
    },
    create: async (data: any) => {
      try {
        console.log('Creating new profile with data:', data);
        const response = await axiosInstance.post(API_ENDPOINTS.profile.details, data);
        console.log('Profile creation response:', response.data);
        return response;
      } catch (error: any) {
        console.error('Profile creation error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    update: async (data: any) => {
      try {
        console.log('Updating profile with data:', data);
        const response = await axiosInstance.patch(API_ENDPOINTS.profile.details, data);
        console.log('Profile update response:', response.data);
        return response;
      } catch (error: any) {
        console.error('Profile update error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      axiosInstance.post(API_ENDPOINTS.profile.changePassword, data),
  },

  // Subscription services
  subscription: {
    // Plan Management
    getPlans: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.plans);
      return response.data;
    },
    getPlanDetails: async (id: string) => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.planDetails(id));
      return response.data;
    },
    getPlanVariants: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.planVariants);
      return response.data;
    },
    getPlanSpecificVariants: async (planId: string) => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.getPlanVariants(planId));
      return response.data;
    },

    // Subscription Requests
    createSubscriptionRequest: async (data: any) => {
      const response = await axiosInstance.post(API_ENDPOINTS.subscription.requests, data);
      return response.data;
    },
    getSubscriptionRequests: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.requests);
      return response.data;
    },
    getRequestStatus: async (id: string) => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.requestStatus(id));
      return response.data;
    },
    approveRequest: async (id: string, data: any) => {
      const response = await axiosInstance.post(API_ENDPOINTS.subscription.approveRequest(id), data);
      return response.data;
    },
    rejectRequest: async (id: string, data: any) => {
      const response = await axiosInstance.post(API_ENDPOINTS.subscription.rejectRequest(id), data);
      return response.data;
    },

    // User Subscriptions
    getUserSubscriptions: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.subscriptions);
      return response.data;
    },
    getActiveSubscription: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.activeSubscription);
      return response.data;
    },
    cancelSubscription: async (id: string, data?: any) => {
      const response = await axiosInstance.post(API_ENDPOINTS.subscription.cancelSubscription(id), data);
      return response.data;
    },

    // Visit Management
    getVisits: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.visits.upcoming);
      return response.data;
    },
    getUpcomingVisits: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.visits.upcoming);
      return response.data;
    },
    checkVisitAvailability: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.checkVisitAvailability);
      return response.data;
    },
    getVisitHistory: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.visitHistory);
      return response.data;
    },
    getVisitSummary: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.visitSummary);
      return response.data;
    },
    completeVisit: async (id: string, data: any) => {
      const response = await axiosInstance.post(API_ENDPOINTS.subscription.completeVisit(id), data);
      return response.data;
    },
    cancelVisit: async (id: number, data?: any) => {
      const response = await axiosInstance.post(API_ENDPOINTS.subscription.visits.cancel(id), data);
      return response.data;
    },
    getSubscriptionStatus: async (id: string) => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.subscriptionStatus(id));
      return response.data;
    },
  },

  // Vehicle services
  vehicle: {
    getTypes: () => axiosInstance.get(API_ENDPOINTS.vehicle.types),
    getManufacturers: () => axiosInstance.get(API_ENDPOINTS.vehicle.manufacturers),
    getModels: (params?: Record<string, string>) => axiosInstance.get(API_ENDPOINTS.vehicle.models, { params }),
    getUserVehicles: () => axiosInstance.get(API_ENDPOINTS.vehicle.userVehicles),
    checkCloudinary: () => axiosInstance.get(API_ENDPOINTS.vehicle.checkCloudinary),
    getVehicleImages: (id: string) => axiosInstance.get(API_ENDPOINTS.vehicle.vehicleImages(id)),
    getUploadParams: (id: string) => axiosInstance.get(API_ENDPOINTS.vehicle.uploadParams(id)),
  },

  // Spare parts services
  spareParts: {
    getAll: async (params?: any) => {
      const response = await axiosInstance.get(API_ENDPOINTS.spareParts.list, { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await axiosInstance.get(API_ENDPOINTS.spareParts.detail(id));
      return response.data;
    },
    getCategories: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.spareParts.categories);
      return response.data;
    },
    getReviews: async (partId: string) => {
      const response = await axiosInstance.get(API_ENDPOINTS.spareParts.reviews(partId));
      return response.data;
    },
    getRelated: async (partId: string) => {
      const response = await axiosInstance.get(API_ENDPOINTS.spareParts.related(partId));
      return response.data;
    },
    getFeatured: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.spareParts.featured);
      return response.data;
    },
    getByVehicle: async (params: { vehicle_type?: string; manufacturer?: string; model?: string }) => {
      const response = await axiosInstance.get(API_ENDPOINTS.spareParts.byVehicle, { params });
      return response.data;
    },
    search: async (query: string) => {
      const response = await axiosInstance.get(API_ENDPOINTS.spareParts.search, { 
        params: { search: query }
      });
      return response.data;
    },
    filter: async (filters: any) => {
      const response = await axiosInstance.get(API_ENDPOINTS.spareParts.filter, { 
        params: filters 
      });
      return response.data;
    }
  },
};

export default apiService;