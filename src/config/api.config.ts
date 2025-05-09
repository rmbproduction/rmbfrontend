/**
 * API Configuration
 * 
 * This file contains the central configuration for all API endpoints used in the application.
 * It defines base URLs, helper functions, and commonly used endpoints.
 */

// Default timeout for API requests in milliseconds
export const DEFAULT_TIMEOUT = 15000; // 15 seconds

// Maximum number of retries for failed requests
export const MAX_RETRIES = 2;

// Retry delay multiplier in milliseconds
export const RETRY_DELAY = 1000; // 1 second initial, doubles each retry

// Helper to determine if running in production
const isProduction = () => {
  const prodDomain = window.location.hostname === 'repairmybike.in' || 
                     window.location.hostname === 'www.repairmybike.in';
  const prodEnv = import.meta.env.MODE === 'production';
  return prodDomain || prodEnv;
};

// Force production URLs if in production environment
const getApiBaseUrl = () => {
  if (isProduction()) {
    return 'https://repairmybike.up.railway.app/api';
  }
  return import.meta.env.VITE_API_URL || 'https://repairmybike.up.railway.app/api';
};

const getMediaBaseUrl = () => {
  if (isProduction()) {
    return 'https://repairmybike.up.railway.app';
  }
  return import.meta.env.VITE_MEDIA_URL || 'https://repairmybike.up.railway.app';
};

// API status monitoring
export const API_STATUS = {
  isOnline: true,
  lastCheck: Date.now(),
  responseTime: 0,
};

// Function to update API status
export const updateApiStatus = (online: boolean, responseTime?: number) => {
  API_STATUS.isOnline = online;
  API_STATUS.lastCheck = Date.now();
  if (responseTime !== undefined) {
    API_STATUS.responseTime = responseTime;
  }
};

export const API_CONFIG = {
  // Base URLs for API and media content
  BASE_URL: getApiBaseUrl(),
  MEDIA_URL: getMediaBaseUrl(),
  
  // Default timeouts - can be overridden in specific requests
  DEFAULT_TIMEOUT,
  
  // Retry configuration
  MAX_RETRIES,
  RETRY_DELAY,
  
  // Use BASE_URL for marketplace to avoid hardcoding
  get MARKETPLACE_URL() {
    // Ensure the path includes /marketplace/ with proper slashes
    const baseWithoutTrailingSlash = this.BASE_URL.endsWith('/') 
      ? this.BASE_URL.slice(0, -1) 
      : this.BASE_URL;
    return `${baseWithoutTrailingSlash}/marketplace`;
  },
  
  // Get the frontend base URL for links
  get FRONTEND_URL() {
    if (isProduction()) {
      return 'https://repairmybike.in';
    }
    return window.location.origin;
  },
  
  /**
   * Helper function to get complete media URLs
   * @param path - The media path (can be relative or absolute)
   * @returns The complete media URL
   */
  getMediaUrl: (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    // Ensure path has a leading slash if it doesn't already
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    
    // If the path doesn't already include /media and isn't explicitly for the API, add /media
    if (!formattedPath.includes('/media/') && !formattedPath.startsWith('/api/')) {
      return `${API_CONFIG.MEDIA_URL}/media${formattedPath}`;
    }
    
    return `${API_CONFIG.MEDIA_URL}${formattedPath}`;
  },
  
  /**
   * Helper function to get complete API URLs
   * @param endpoint - The API endpoint (can include leading slash)
   * @returns The complete API URL
   */
  getApiUrl: (endpoint: string): string => {
    // Make sure endpoint starts with a slash if it doesn't already
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_CONFIG.BASE_URL}${formattedEndpoint}`;
    
    if (import.meta.env.DEV) {
      console.log(`[API] Request URL: ${url}`);
    }
    
    return url;
  },
  
  /**
   * Helper function to properly format image URLs
   * @param url - The image URL (can be relative, absolute, or from API)
   * @returns The complete, usable image URL
   */
  getImageUrl: (url: string | null | undefined): string => {
    if (!url) {
      // Return a guaranteed working placeholder image
      return 'https://placehold.co/600x400?text=No+Image';
    }
    
    // If it's already an absolute URL, return it
    // This will handle Cloudinary URLs (res.cloudinary.com) and other external URLs
    if (url.startsWith('http')) {
      return url;
    }
    
    // If it's a Cloudinary URL without http prefix
    if (url.includes('res.cloudinary.com')) {
      return `https://${url}`;
    }
    
    // If it's a media URL from our backend
    if (url.startsWith('/media')) {
      return `${API_CONFIG.MEDIA_URL}${url}`;
    }
    
    // If it's a relative path to an asset in our app
    if (url.startsWith('/assets')) {
      return `${window.location.origin}${url}`;
    }
    
    // Default case - try to make the most reasonable guess
    const baseUrl = url.startsWith('/') ? API_CONFIG.MEDIA_URL : `${API_CONFIG.MEDIA_URL}/`;
    return `${baseUrl}${url}`;
  },
  
  /**
   * Helper function to get a default vehicle image when no image is available
   * @returns The URL to the default vehicle image
   */
  getDefaultVehicleImage: () => {
    // Use a guaranteed working placeholder image
    return 'https://placehold.co/600x400?text=Vehicle';
  },
  
  /**
   * Perform controlled fetch with timeout
   * @param url - The URL to fetch
   * @param options - Fetch options
   * @param timeout - Timeout in milliseconds
   * @returns Promise resolving to Response
   */
  fetchWithTimeout: async (url: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT): Promise<Response> => {
    const controller = new AbortController();
    const { signal } = controller;
    
    // Create timeout promise
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });
    
    try {
      // Start timing
      const startTime = Date.now();
      
      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, { ...options, signal }),
        timeoutPromise
      ]) as Response;
      
      // Update API status on success
      updateApiStatus(true, Date.now() - startTime);
      
      return response;
    } catch (error) {
      // Check if it's an abort error (timeout) or network error
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      
      // Update API status on errors
      updateApiStatus(false);
      
      if (isTimeout) {
        throw new Error(`Request to ${url} timed out after ${timeout}ms`);
      }
      
      throw error;
    }
  },
  
  /**
   * API endpoints
   */
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/accounts/login/',
      REGISTER: '/accounts/register/',
      REFRESH: '/accounts/token/refresh/',
      VERIFY: '/accounts/token/verify/',
      FORGOT_PASSWORD: '/accounts/password-reset/',
    },
    SERVICES: {
      LIST: '/repairing_service/services/',
      CATEGORIES: '/repairing_service/categories/',
    },
    VEHICLES: {
      LIST: '/marketplace/vehicles/',
      BRANDS: '/vehicle/brands/',
      MODELS: '/vehicle/models/',
      TYPES: '/vehicle/types/',
      FEATURES: '/vehicle/features/',
      SEARCH: '/marketplace/search/',
    },
    // Account-related endpoints
    PROFILE: '/accounts/profile/', 
    AUTH_CALLBACK: '/accounts/auth/callback',
    SESSION: '/accounts/session',
    USER: '/accounts/user',
    
    // Vehicle-related endpoints
    MANUFACTURERS: '/vehicle/manufacturers/',
    VEHICLE_TYPES: '/vehicle/vehicle-types/',
    VEHICLE_MODELS: '/vehicle/vehicle-models/',
    USER_VEHICLES: '/vehicle/user-vehicles/',
    
    // Marketplace endpoints
    SELL_REQUESTS: '/marketplace/sell-requests',
    
    // Booking endpoints
    BOOKINGS: '/marketplace/bookings/',
    USER_BOOKINGS: '/marketplace/bookings/user/',
    BOOKING_CANCEL: (bookingId: string) => `/repairing_service/bookings/${bookingId}/cancel/`,
    
    /**
     * Get endpoint for filtered vehicle models by manufacturer and vehicle type
     * @param manufacturerId - The manufacturer ID
     * @param vehicleTypeId - The vehicle type ID
     * @returns API endpoint for filtered vehicle models
     */
    getFilteredModels: (manufacturerId: number, vehicleTypeId: number) => 
      `/vehicle/vehicle-models/?manufacturer=${manufacturerId}&vehicle_type=${vehicleTypeId}`,
      
    /**
     * Get endpoint for specific user profile
     * @param email - The user's email
     * @returns API endpoint for specific user profile
     */
    getUserProfile: (email: string) => `/accounts/profile/${email}`,
    
    /**
     * Get endpoint for a specific sell request
     * @param requestId - The sell request ID
     * @returns API endpoint for specific sell request
     */
    getSellRequest: (requestId: string) => `/marketplace/sell-requests/${requestId}`,
    
    /**
     * Get endpoint for uploading documents to a sell request
     * @param requestId - The sell request ID
     * @returns API endpoint for document upload
     */
    getSellRequestDocuments: (requestId: string) => `/marketplace/sell-requests/${requestId}/documents/`,
  },
  
  /**
   * Helper function to get vehicle image URL
   * @param vehicleId - The vehicle ID
   * @returns The URL to the vehicle image
   */
  getVehicleImageUrl(vehicleId: string | number): string {
    return `${this.MARKETPLACE_URL}/vehicles/${vehicleId}/image/`;
  }
};

// Google Maps API configuration
export const googleMapsConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  region: 'IN',
  language: 'en'
};