import axios, { AxiosRequestConfig, AxiosResponse, CancelToken } from 'axios';
import { API_CONFIG } from '../config/api.config';

// Cache interface with different TTLs for different endpoint types
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Cache configuration - different TTLs for different endpoint types
const CACHE_TTL = {
  DEFAULT: 5 * 60 * 1000, // 5 minutes
  STATIC: 30 * 60 * 1000, // 30 minutes for static data like manufacturers
  SHORT: 1 * 60 * 1000,   // 1 minute for frequently changing data
  USER: 2 * 60 * 1000     // 2 minutes for user data
};

// Improved cache with endpoint-specific TTLs
const apiCache = new Map<string, CacheEntry<any>>();

// Maximum request timeout in milliseconds
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Create cache key from request details
const createCacheKey = (url: string, config: AxiosRequestConfig = {}): string => {
  const { method = 'GET', params, data } = config;
  return `${method}:${url}:${JSON.stringify(params || {})}:${JSON.stringify(data || {})}`;
};

// Determine TTL based on endpoint pattern
const getTtlForEndpoint = (url: string): number => {
  // Static data endpoints
  if (url.includes('/manufacturers') || 
      url.includes('/vehicle-types') || 
      url.includes('/service-categories')) {
    return CACHE_TTL.STATIC;
  }
  
  // User-specific endpoints
  if (url.includes('/profile') || 
      url.includes('/user-vehicles') || 
      url.includes('/user-bookings')) {
    return CACHE_TTL.USER;
  }
  
  // Short-lived data
  if (url.includes('/cart') || url.includes('/marketplace/search')) {
    return CACHE_TTL.SHORT;
  }
  
  // Default fallback
  return CACHE_TTL.DEFAULT;
};

// Enhanced axios instance with better timeout handling
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: REQUEST_TIMEOUT,
});

// Request interceptor with proper error handling
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for timing metrics
    (config as any).metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with timing metrics
api.interceptors.response.use(
  (response) => {
    const config = response.config as any;
    if (config.metadata) {
      const requestTime = Date.now() - config.metadata.startTime;
      
      // Log slow requests (over 2 seconds) for monitoring
      if (requestTime > 2000) {
        console.warn(`[API] Slow request detected: ${response.config.url} took ${requestTime}ms`);
      }
    }
    
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh only once per session to prevent infinite loops
      const isRefreshing = localStorage.getItem('isRefreshing');
      
      if (!isRefreshing) {
        try {
          localStorage.setItem('isRefreshing', 'true');
          const refreshToken = localStorage.getItem('refreshToken');
          
          if (refreshToken) {
            const response = await axios.post(
              `${API_CONFIG.BASE_URL}/accounts/token/refresh/`, 
              { refresh: refreshToken }
            );
            
            if (response.data && response.data.access) {
              localStorage.setItem('accessToken', response.data.access);
              localStorage.removeItem('isRefreshing');
              
              // Retry original request with new token
              error.config.headers['Authorization'] = `Bearer ${response.data.access}`;
              return axios(error.config);
            }
          }
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
          localStorage.removeItem('isRefreshing');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          // Redirect to login page - ensure we don't create redirect loops
          if (!window.location.pathname.includes('/login-signup')) {
            window.location.href = '/login-signup';
          }
        }
      } else {
        // Already trying to refresh, clear auth and redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('isRefreshing');
        
        if (!window.location.pathname.includes('/login-signup')) {
          window.location.href = '/login-signup';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Enhanced GET method with smarter caching
export const get = async <T>(
  url: string,
  config: AxiosRequestConfig = {},
  bypassCache = false // Option to bypass cache when needed
): Promise<T> => {
  const cacheKey = createCacheKey(url, config);
  const cachedResponse = apiCache.get(cacheKey);
  const ttl = getTtlForEndpoint(url);

  if (!bypassCache && cachedResponse && Date.now() - cachedResponse.timestamp < cachedResponse.ttl) {
    return cachedResponse.data;
  }

  try {
    const response = await api.get<T>(url, {
      ...config,
      timeout: config.timeout || REQUEST_TIMEOUT,
    });
    
    // Only cache successful responses
    if (response.status >= 200 && response.status < 300) {
      apiCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
        ttl: ttl
      });
    }
    
    return response.data;
  } catch (error) {
    // Enhanced error logging
    if (axios.isAxiosError(error) && error.response) {
      console.error(`[API] Error ${error.response.status} fetching ${url}:`, 
        error.response.data || error.message);
    } else {
      console.error(`[API] Network error fetching ${url}:`, error);
    }
    throw error;
  }
};

// Enhanced POST method with better error handling
export const post = async <T>(
  url: string,
  data: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  try {
    const response = await api.post<T>(url, data, {
      ...config,
      timeout: config.timeout || REQUEST_TIMEOUT
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(`[API] Error ${error.response.status} posting to ${url}:`, 
        error.response.data || error.message);
    } else {
      console.error(`[API] Network error posting to ${url}:`, error);
    }
    throw error;
  }
};

// New method to fetch multiple resources in parallel
export const fetchParallel = async <T>(
  urls: string[],
  config: AxiosRequestConfig = {}
): Promise<T[]> => {
  try {
    const promises = urls.map(url => get<any>(url, config));
    return await Promise.all(promises);
  } catch (error) {
    console.error('[API] Error in parallel request:', error);
    throw error;
  }
};

// Clear cache for specific URL pattern
export const clearCache = (urlPattern: string) => {
  for (const key of apiCache.keys()) {
    if (key.includes(urlPattern)) {
      apiCache.delete(key);
    }
  }
};

// Clear all cache
export const clearAllCache = () => {
  apiCache.clear();
};

// Export the enhanced API instance
export default api; 