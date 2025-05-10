import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '../config/api.config';

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const apiCache = new Map<string, CacheEntry<any>>();

// Create cache key from request details
const createCacheKey = (url: string, config: AxiosRequestConfig = {}): string => {
  const { method = 'GET', params, data } = config;
  return `${method}:${url}:${JSON.stringify(params || {})}:${JSON.stringify(data || {})}`;
};

// Enhanced axios instance with caching
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 15000, // 15 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
      localStorage.removeItem('accessToken');
      window.location.href = '/login-signup';
    }
    return Promise.reject(error);
  }
);

// Enhanced GET method with caching
export const get = async <T>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const cacheKey = createCacheKey(url, config);
  const cachedResponse = apiCache.get(cacheKey);

  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
    console.log(`[API] Using cached response for ${url}`);
    return cachedResponse.data;
  }

  try {
    const response = await api.get<T>(url, config);
    apiCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error fetching ${url}:`, error);
    throw error;
  }
};

// Enhanced POST method
export const post = async <T>(
  url: string,
  data: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  try {
    const response = await api.post<T>(url, data, config);
    return response.data;
  } catch (error) {
    console.error(`[API] Error posting to ${url}:`, error);
    throw error;
  }
};

// Clear cache for specific URL
export const clearCache = (url: string) => {
  for (const key of apiCache.keys()) {
    if (key.includes(url)) {
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