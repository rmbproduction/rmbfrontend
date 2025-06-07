import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';
import TokenManager from '../services/tokenManager';
import type { User } from '../types/api';

interface TokenResponse {
  access: string;
  refresh: string;
}

interface LoginResponse {
  message?: string;
  user: {
    email: string;
    username: string;
    is_admin: boolean;
    is_staff_member: boolean;
    is_field_staff: boolean;
    is_customer: boolean;
    email_verified: boolean;
  };
  tokens: TokenResponse;
  is_first_login?: boolean;
}

interface SignupResponse {
  message: string;
  user: {
    email: string;
    username: string;
  };
}

// Create a new QueryClient instance with basic configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: false,
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// API base URL
const API_BASE_URL = 'https://repairmybike.up.railway.app/api';

// Export API configuration for components that need it
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
  }
} as const;

// CDN Configuration
export const CDN_CONFIG = {
  baseURL: 'https://api.cloudinary.com/v1_1',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'rmb_preset',
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dz81bjuea',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
  folders: {
    photos: 'vehicle_photos',
    documents: 'vehicle_documents',
    models: 'vehicle_models'
  }
};

// Export API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/accounts/login/',
    signup: '/accounts/signup/',
    logout: '/accounts/logout/',
    verifyEmail: (token: string) => `/accounts/verify-email/${token}/`,
    resendVerification: '/accounts/resend-verification/',
    forgotPassword: '/accounts/password/reset/',
    resetPassword: '/accounts/password-reset/',
    profile: '/accounts/profile/',
    refreshToken: '/accounts/token/refresh/',
    changePassword: '/accounts/change-password/',
  },

  // Vehicle marketplace endpoints
  marketplace: {
    vehicles: '/marketplace/vehicles/',
    vehicle: (id: string) => `/marketplace/vehicles/${id}/`,
    sellRequests: '/marketplace/sell-requests/',
    sellRequest: (id: string) => `/marketplace/sell-requests/${id}/`,
    inspections: '/marketplace/inspections/',
    inspection: (id: string) => `/marketplace/inspections/${id}/`,
    offers: '/marketplace/offers/',
    offer: (id: string) => `/marketplace/offers/${id}/`,
    purchases: '/marketplace/purchases/',
    purchase: (id: string) => `/marketplace/purchases/${id}/`,
    bookings: '/marketplace/bookings/',
    booking: (id: string) => `/marketplace/bookings/${id}/`,
    emailVehicleSummary: '/marketplace/email-vehicle-summary/',
  },

  // Repair service endpoints
  services: {
    // Categories and services
    categories: '/repairing-service/service-categories/',
    services: '/repairing-service/services/',
    servicePrice: (id: string) => `/repairing-service/service-price/${id}/`,
    manufacturers: '/repairing-service/manufacturers/',
    vehicleModels: '/repairing-service/vehicle-models/',
    
    // Cart related
    createCart: '/repairing-service/cart/create/',
    listCarts: '/repairing-service/cart/list/',
    cartDetail: (id: number) => `/repairing-service/cart/${id}/`,
    addToCart: (id: number) => `/repairing-service/cart/${id}/add/`,
    updateCartItem: (cartId: number) => `/repairing-service/cart/${cartId}/update-item/`,
    removeCartItem: (id: number) => `/repairing-service/cart/items/${id}/`,
    clearCart: (id: number) => `/repairing-service/cart/${id}/clear/`,
    
    // Bookings
    myRepairs: '/repairing-service/bookings/',
    createBooking: '/repairing-service/bookings/create/',
    serviceNow: '/repairing-service/service-now/',
    cancelServiceNow: (id: string) => `/repairing-service/service-now/${id}/cancel/`,
    calculateDistanceFee: '/repairing-service/calculate-distance-fee/',
  },

  // Chatbot endpoints
  chatbot: {
    message: '/services/chatbot/message/',
    intent: '/services/chatbot/intent/',
    history: '/services/chatbot/history/',
  },

  // Admin dashboard endpoints
  admin: {
    statistics: '/services/admin/dashboard/statistics/',
    notifications: '/services/admin/notifications/',
    requests: '/services/admin/requests/',
    updateRequestStatus: (id: string) => `/services/admin/requests/${id}/status/`,
  },

  // Subscription endpoints
  subscription: {
    // Plan Management
    plans: '/subscription/plans/',
    planDetails: (id: string) => `/subscription/plans/${id}/`,
    planVariants: '/subscription/plan-variants/',
    getPlanVariants: (planId: string) => `/subscription/plans/${planId}/variants/`,

    // Subscription Requests
    requests: '/subscription/subscription-requests/',
    requestStatus: (id: string) => `/subscription/subscription-requests/${id}/status/`,
    approveRequest: (id: string) => `/subscription/subscription-requests/${id}/approve/`,
    rejectRequest: (id: string) => `/subscription/subscription-requests/${id}/reject/`,

    // Active Subscription
    subscriptions: '/subscription/subscriptions/',
    active: '/subscription/subscriptions/active/',
    subscriptionStatus: (id: string) => `/subscription/subscriptions/${id}/status/`,
    cancelSubscription: (id: string) => `/subscription/subscriptions/${id}/cancel/`,
    renewSubscription: (id: string) => `/subscription/subscriptions/${id}/renew/`,

    // Visit Management
    visits: {
      upcoming: '/subscription/visits/upcoming/',
      schedule: '/subscription/visits/schedule_preferred_date/',
      cancel: (id: number) => `/subscription/visits/${id}/cancel/`,
      reschedule: (id: number) => `/subscription/visits/${id}/update_schedule/`
    },
    visitHistory: '/subscription/visits/visit_history/',
    visitSummary: '/subscription/visits/subscription_visit_summary/',
    checkVisitAvailability: '/subscription/visits/check_availability/',
    availableDates: '/subscription/visits/available_dates/',
    availableTimes: '/subscription/visits/available_times/',
    scheduleVisit: '/subscription/visits/schedule_preferred_date/',
    cancelVisit: (id: string) => `/subscription/visits/${id}/cancel/`,
    rescheduleVisit: (id: string) => `/subscription/visits/${id}/reschedule/`,
    completeVisit: (id: string) => `/subscription/visits/${id}/complete/`,
    create: '/subscription/subscriptions/create/',
    history: '/subscription/history/',
  },

  // CDN endpoints
  cdn: {
    baseUrl: `https://res.cloudinary.com/${CDN_CONFIG.cloudName}`,
    upload: `${CDN_CONFIG.baseURL}/${CDN_CONFIG.cloudName}/upload`,
    imageTransform: (transformation: string, publicId: string) => 
      `https://res.cloudinary.com/${CDN_CONFIG.cloudName}/image/upload/${transformation}/${publicId}`,
    document: (publicId: string) => 
      `https://res.cloudinary.com/${CDN_CONFIG.cloudName}/raw/upload/${publicId}`,
  },

  // Profile endpoints
  profile: {
    details: '/accounts/profile/',
    create: '/accounts/profile/create/',
    update: '/accounts/profile/update/',
    changePassword: '/accounts/profile/change-password/',
  },

  // Vehicle endpoints
  vehicle: {
    types: '/vehicle/vehicle-types/',
    manufacturers: '/vehicle/manufacturers/',
    models: '/vehicle/vehicle-models/',
    userVehicles: '/vehicle/user-vehicles/',
    checkCloudinary: '/vehicle/check-cloudinary/',
    vehicleImages: (id: string) => `/vehicle/vehicles/${id}/images/`,
    uploadParams: (id: string) => `/vehicle/vehicles/${id}/upload-params/`,
    checkRegistration: '/marketplace/vehicles/check-registration-number/',
  },
};

// Create axios instance with enforced base URL and CORS configuration
const axiosInstance = axios.create(API_CONFIG);

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject(new Error('Network Error: Please check your internet connection'));
    }

    // Handle 401 and token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const success = await TokenManager.refreshToken();
        if (!success) {
          TokenManager.clearTokens();
          throw new Error('Token refresh failed');
        }

        const newToken = TokenManager.getAccessToken();
        if (!originalRequest.headers) {
          originalRequest.headers = {};
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        TokenManager.clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API service functions
export const apiService = {
  auth: {
    login: (data: { email: string; password: string } | { provider: string }) =>
      axiosInstance.post<LoginResponse>(API_ENDPOINTS.auth.login, data),
    signup: (data: { username: string; email: string; password: string }) =>
      axiosInstance.post<SignupResponse>(API_ENDPOINTS.auth.signup, data),
    logout: (data: { refresh: string }) =>
      axiosInstance.post(API_ENDPOINTS.auth.logout, data),
    verifyEmail: (token: string) =>
      axiosInstance.get(API_ENDPOINTS.auth.verifyEmail(token)),
    resendVerification: (email: string) =>
      axiosInstance.post(API_ENDPOINTS.auth.resendVerification, { email }),
    getProfile: () =>
      axiosInstance.get<User>(API_ENDPOINTS.auth.profile),
    updateProfile: (data: Partial<User>) =>
      axiosInstance.patch(API_ENDPOINTS.auth.profile, data),
    refreshToken: (data: { refresh: string }) =>
      axiosInstance.post<TokenResponse>(API_ENDPOINTS.auth.refreshToken, data),
    resetPassword: (data: { email: string }) =>
      axiosInstance.post(API_ENDPOINTS.auth.resetPassword, data),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      axiosInstance.post(API_ENDPOINTS.auth.changePassword, data),
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
    getDetails: () => axiosInstance.get<User>(API_ENDPOINTS.auth.profile),
    create: (data: Partial<User>) => axiosInstance.post(API_ENDPOINTS.profile.create, data),
    update: (data: FormData | Partial<User>) => 
      axiosInstance.patch(API_ENDPOINTS.profile.details, data, {
        headers: {
          ...(data instanceof FormData 
            ? { 'Content-Type': 'multipart/form-data' }
            : { 'Content-Type': 'application/json' })
        }
      }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      axiosInstance.post(API_ENDPOINTS.auth.changePassword, data),
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
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.active);
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
    getActive: () =>
      axiosInstance.get(API_ENDPOINTS.subscription.active),
    create: (data: any) =>
      axiosInstance.post(API_ENDPOINTS.subscription.create, data),
    getHistory: () =>
      axiosInstance.get(API_ENDPOINTS.subscription.history),
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
};

// Utility function to handle all cleanup during logout
async function handleLogoutCleanup() {
  console.log('=== STARTING LOGOUT CLEANUP ===');
  
  try {
    // Clear all tokens using TokenManager
    TokenManager.clearTokens();
    console.log('Tokens cleared');

    // Clear all React Query cache
    queryClient.clear();
    console.log('Query cache cleared');

    // Cancel any ongoing queries
    await queryClient.cancelQueries();
    console.log('Ongoing queries cancelled');

    // Reset auth-related queries
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

export { axiosInstance, handleLogoutCleanup };
export default apiService;