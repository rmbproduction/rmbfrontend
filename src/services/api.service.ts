import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { SubscriptionPlan } from '../models/subscription-plan'; // Adjust the path as needed

// Base API configuration
const BASE_URL = 'http://localhost:8000/api';
const MARKETPLACE_URL = `${BASE_URL}/marketplace`;

// Configure axios with default headers
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
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
    return this.request<any[]>(API_CONFIG.ENDPOINTS.SERVICES);
  }

  async getFieldStaff() {
    return this.request<any[]>(API_CONFIG.ENDPOINTS.FIELD_STAFF);
  }

  async getReviews() {
    return this.request<any[]>(API_CONFIG.ENDPOINTS.REVIEWS);
  }

  async getPricingPlans() {
    return this.request<any[]>(API_CONFIG.ENDPOINTS.PRICING_PLANS);
  }

  async getAdditionalServices() {
    return this.request<any[]>(API_CONFIG.ENDPOINTS.ADDITIONAL_SERVICES);
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
      const response = await apiClient.get('/repairing_service/subscription-plans/');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
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
