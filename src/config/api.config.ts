import axios from 'axios';

// Base configuration
const API_BASE_URL = import.meta.env.DEV 
  ? '/api'  // Use relative path in development
  : (import.meta.env.VITE_API_BASE_URL || 'https://repairmybike.up.railway.app/api');

// Export API configuration for components that need it
export const API_CONFIG = {
  baseURL: API_BASE_URL,
};

// Create axios instance with default config
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true // This is crucial for sending/receiving cookies
});

// Add request interceptor to handle CSRF token
axiosInstance.interceptors.request.use(
  (config) => {
    // For non-GET requests, we need to include the CSRF token
    if (config.method !== 'get') {
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {}, {
          withCredentials: true,
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Endpoints configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    signup: '/accounts/signup/',
    login: '/accounts/login/',
    logout: '/accounts/logout/',
    refreshToken: '/accounts/token/refresh/',
    passwordReset: '/accounts/password-reset/',
    passwordResetConfirm: (token: string) => `/accounts/password-reset/${token}/`,
    verifyEmail: (token: string) => `/accounts/verify-email/${token}/`,
    googleLogin: '/accounts/google/login/',
    googleCallback: '/accounts/google/callback/',
    profile: '/accounts/profile/',
    contact: '/accounts/contact/',
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
    manufacturers: '/services/manufacturers/',
    vehicleModels: '/services/vehicle-models/',
    categories: '/services/service-categories/',
    services: '/services/services/',
    servicePrice: (id: number) => `/services/service-price/${id}/`,
    
    // Cart related
    createCart: '/services/cart/create/',
    cart: (id: number) => `/services/cart/${id}/`,
    addToCart: (cartId: number) => `/services/cart/${cartId}/add/`,
    updateCartItem: (cartId: number) => `/services/cart/${cartId}/update-item/`,
    clearCart: (cartId: number) => `/services/cart/${cartId}/clear/`,
    removeCartItem: (itemId: number) => `/services/cart/items/${itemId}/`,
    
    // Bookings
    userBookings: '/services/bookings/',
    createBooking: '/services/bookings/create/',
    cancelBooking: (id: number) => `/services/bookings/${id}/cancel/`,
    clearCancelledBookings: '/services/bookings/clear-cancelled/',
    
    // Service requests
    serviceRequests: '/services/service-requests/',
    serviceRequest: (id: number) => `/services/service-requests/${id}/`,
    serviceRequestResponses: (id: number) => `/services/service-requests/${id}/responses/`,
    liveLocation: (id: number) => `/services/service-requests/${id}/location/`,
    calculateDistanceFee: '/services/calculate-distance-fee/',
    pricingPlans: '/services/pricing-plans/',
    
    // Field staff
    fieldStaff: '/services/field-staff/',
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
  }
};

// API service functions
export const apiService = {
  // Auth services
  auth: {
    login: async (data: { email: string; password: string }) => {
      const response = await axiosInstance.post(API_ENDPOINTS.auth.login, data);
      return response;
    },
    signup: (data: any) => 
      axiosInstance.post(API_ENDPOINTS.auth.signup, data),
    logout: async () => {
      const response = await axiosInstance.post(API_ENDPOINTS.auth.logout);
      return response;
    },
    getProfile: () => 
      axiosInstance.get(API_ENDPOINTS.auth.profile),
    updateProfile: (data: any) => 
      axiosInstance.patch(API_ENDPOINTS.auth.profile, data),
    forgotPassword: (data: { email: string }) =>
      axiosInstance.post(API_ENDPOINTS.auth.passwordReset, data),
    googleLogin: () =>
      axiosInstance.get(API_ENDPOINTS.auth.googleLogin),
  },

  // Vehicle marketplace services
  marketplace: {
    getVehicles: (params?: any) => 
      axiosInstance.get(API_ENDPOINTS.marketplace.vehicles, { params }),
    getVehicle: (id: string) => 
      axiosInstance.get(API_ENDPOINTS.marketplace.vehicle(id)),
    createSellRequest: (data: any) => 
      axiosInstance.post(API_ENDPOINTS.marketplace.sellRequests, data),
    createBooking: (data: any) => 
      axiosInstance.post(API_ENDPOINTS.marketplace.bookings, data),
  },

  // Repair service functions
  services: {
    getManufacturers: () => 
      axiosInstance.get(API_ENDPOINTS.services.manufacturers),
    getVehicleModels: (params?: any) => 
      axiosInstance.get(API_ENDPOINTS.services.vehicleModels, { params }),
    getServiceCategories: () => 
      axiosInstance.get(API_ENDPOINTS.services.categories),
    getServices: (params?: any) => 
      axiosInstance.get(API_ENDPOINTS.services.services, { params }),
    createCart: () => 
      axiosInstance.post(API_ENDPOINTS.services.createCart),
    addToCart: (cartId: number, data: any) => 
      axiosInstance.post(API_ENDPOINTS.services.addToCart(cartId), data),
    createBooking: (data: any) => 
      axiosInstance.post(API_ENDPOINTS.services.createBooking, data),
    getUserBookings: () => 
      axiosInstance.get(API_ENDPOINTS.services.userBookings),
  },
};

export default apiService;