/**
 * API Configuration
 * 
 * This file contains the central configuration for all API endpoints used in the application.
 * It defines base URLs, helper functions, and commonly used endpoints.
 */
export const API_CONFIG = {
  // Base URLs for API and media content
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  MEDIA_URL: import.meta.env.VITE_MEDIA_BASE_URL || 'http://127.0.0.1:8000',
  // Use BASE_URL for marketplace to avoid hardcoding
  get MARKETPLACE_URL() {
    return `${this.BASE_URL}/marketplace`;
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
    
    if (process.env.NODE_ENV === 'development') {
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
    if (url.startsWith('http')) {
      return url;
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
    PROFILE: '/accounts/profile/', // Updated from /profiles/me/
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
    
    /**
     * Get endpoint for uploading photos to a sell request
     * @param requestId - The sell request ID
     * @returns API endpoint for photo upload
     */
    getSellRequestPhotos: (requestId: string) => `/marketplace/sell-requests/${requestId}/photos/`
  },
  
  // Default headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Default timeout in milliseconds
  timeout: 30000, // 30 seconds
  
  // Debug mode
  debugMode: process.env.NODE_ENV === 'development',
};