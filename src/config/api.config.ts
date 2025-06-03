import axios from 'axios';
import TokenManager from '../services/tokenManager';

// Add this utility function at the top of the file after imports
const normalizeUrl = (url: string): string => {
  // Remove multiple consecutive slashes, except after protocol (e.g., http://)
  return url.replace(/([^:]\/)\/+/g, '$1');
};

// Base configuration
const API_BASE_URL = 'https://repairmybike.up.railway.app/api';
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://repairmybike.in';

// Export API configuration for components that need it
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  frontendURL: FRONTEND_URL,
  withCredentials: true,
};

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
    signup: 'accounts/signup/',
    login: 'accounts/login/',  // Changed from '/accounts/login/'
    logout: 'accounts/logout/',
    refreshToken: 'accounts/token/refresh/',
    passwordReset: 'accounts/password-reset/',
    passwordResetConfirm: (token: string) => `accounts/password-reset/${token}/`,
    verifyEmail: (token: string) => `accounts/verify-email/${token}/`,
    resendVerification: '/accounts/resend-verification/',
    googleLogin: 'accounts/google/login/',
    googleCallback: 'accounts/google/callback/',
    profile: 'accounts/profile/',
    contact: 'accounts/contact/',
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
    activeSubscription: '/subscription/subscriptions/active/',
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

// Create axios instance with default config
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL.replace(/\/+$/, ''),  // Remove trailing slashes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
});

// Add request interceptor for adding auth token and normalizing URLs
axiosInstance.interceptors.request.use(
  async (config) => {
    // Clean up the URL parts
    const baseUrl = (config.baseURL || '').replace(/\/+$/, '');  // Remove trailing slashes
    let url = (config.url || '').replace(/^\/+/, '');  // Remove leading slashes

    // Ensure trailing slash for Django URLs (only if url is not empty)
    if (url && !url.endsWith('/')) {
      url = `${url}/`;
    }

    // Set the cleaned url
    config.url = url;
    config.baseURL = baseUrl;

    // Calculate and log the full URL
    const fullUrl = `${baseUrl}/${url}`;

    // Log the request details
    console.log('Making request:', {
      url: config.url,
      baseURL: config.baseURL,
      fullUrl,
      method: config.method,
      headers: config.headers,
      data: config.data
    });

    // Ensure CORS headers for all requests
    config.withCredentials = true;

    const token = TokenManager.getAccessToken();
    if (token && !url.includes('login') && !url.includes('verify-email')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
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

// Add response interceptor for handling auth errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // For login responses, check if we have tokens
    if (response.config.url?.includes('/login')) {
      console.log('Processing login response:', {
        hasTokens: !!response.data?.tokens,
        hasUser: !!response.data?.user
      });
    }
    return response;
  },
  async (error) => {
    // Log detailed error information
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
      requestData: error.config?.data
    });

    // If it's a 500 error, provide more helpful error message
    if (error.response?.status === 500) {
      error.message = 'Server error occurred. Please try again later.';
    }

    const originalRequest = error.config;

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) : 15 * 60; // Default to 15 minutes
      const lockoutTime = Date.now() + waitTime * 1000;
      localStorage.setItem('loginLockoutUntil', lockoutTime.toString());
      throw new Error(`Too many attempts. Please try again in ${Math.ceil(waitTime / 60)} minutes.`);
    }

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken) {
          console.warn('No refresh token found during response interceptor');
          TokenManager.clearTokens();
          if (!isPublicRoute(originalRequest.url || '')) {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('No refresh token available'));
        }

        console.log('Attempting token refresh after 401...');
        const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
          refresh: refreshToken
        }, {
          withCredentials: true
        });

        if (!response.data?.access || !response.data?.refresh) {
          throw new Error('Invalid refresh response');
        }

        const { access, refresh } = response.data;
        TokenManager.setTokens({ access, refresh }, true);

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        console.log('Token refresh successful, retrying original request');
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed after 401:', refreshError);
        // If refresh fails, clear tokens and only redirect if not on a public route
        TokenManager.clearTokens();
        if (!isPublicRoute(originalRequest.url || '')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // If it's a 500 error on the profile endpoint, handle it gracefully
    if (error.response?.status === 500 && error.config.url?.includes('/accounts/profile/')) {
      return Promise.resolve({ data: null });
    }

    return Promise.reject(error);
  }
);

interface LoginResponse {
  message: string;
  is_first_login: boolean;
  tokens: {
    access: string;
    refresh: string;
  };
  user: {
    id: number;
    username: string;
    email: string;
    email_verified: boolean;
  };
}

// API service functions
export const apiService = {
  // Auth services
  auth: {
    login: async (data: { email: string; password: string; rememberMe?: boolean }) => {
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

        // Extract and validate data from response
        const { message, user, tokens, is_first_login } = response.data;

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
        console.log('Attempting to store tokens in localStorage...');

        // Store tokens
        try {
          localStorage.setItem('accessToken', tokens.access);
          localStorage.setItem('refreshToken', tokens.refresh);
          console.log('Tokens successfully stored in localStorage');
          
          // Verify storage
          const storedAccess = localStorage.getItem('accessToken');
          const storedRefresh = localStorage.getItem('refreshToken');
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

        // Return the validated response
        return {
          status: response.status,
          data: {
            message: message || 'Login successful',
            is_first_login: !!is_first_login,
            user,
            tokens: {
              access: tokens.access,
              refresh: tokens.refresh
            }
          }
        };
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
      try {
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token found');
        }

        const response = await axiosInstance.post(API_ENDPOINTS.auth.logout, {
          refresh: refreshToken
        });

        // Clear tokens on successful logout
        if (response.status === 200) {
          TokenManager.clearTokens();
        }

        return response;
      } catch (error) {
        console.error('Logout error:', error);
        // Clear tokens even if logout fails
        TokenManager.clearTokens();
        throw error;
      }
    },
    getProfile: async () => {
      return axiosInstance.get(API_ENDPOINTS.auth.profile);
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
};

export default apiService;