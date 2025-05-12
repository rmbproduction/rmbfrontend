// API Service - Centralized API endpoints for RepairMyBike
import { API_CONFIG } from '../config/api.config';

// Use the API_CONFIG for base URL
const API_BASE = API_CONFIG.getApiUrl('/repairing-service');

// Common request options for consistency
const defaultOptions = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  credentials: 'include' as RequestCredentials
};

/**
 * Service category related API calls
 */
export const categoryService = {
  // Get all service categories
  getCategories: async () => {
    try {
      console.log(`[API] Fetching categories from: ${API_BASE}/service-categories/`);
      const response = await fetch(`${API_BASE}/service-categories/`, {
        method: 'GET',
        ...defaultOptions
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[API] Retrieved ${data.length} categories`);
      return data;
    } catch (error) {
      console.error('Failed to fetch service categories:', error);
      throw error;
    }
  },
  
  // Get specific category by ID
  getCategoryById: async (categoryId: string) => {
    try {
      // Try multiple URL formats to handle different API endpoint structures
      // First try with query parameter approach like the services endpoint
      const url1 = `${API_BASE}/service-categories/?uuid=${categoryId}`;
      console.log(`[API] Trying to fetch category by ID from: ${url1}`);
      
      let response = await fetch(url1, {
        method: 'GET',
        ...defaultOptions
      });
      
      if (response.ok) {
        const data = await response.json();
        // If we got an array, return the first item that matches our ID
        if (Array.isArray(data) && data.length > 0) {
          const category = data.find(c => c.uuid === categoryId);
          if (category) return category;
        }
        // If single object is returned
        if (data.uuid === categoryId) return data;
      }
      
      // If that fails, try the path parameter approach with trailing slash
      const url2 = `${API_BASE}/service-categories/${categoryId}/`;
      console.log(`[API] Trying alternate endpoint: ${url2}`);
      
      response = await fetch(url2, {
        method: 'GET',
        ...defaultOptions
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      // Try without trailing slash as last resort
      const url3 = `${API_BASE}/service-categories/${categoryId}`;
      console.log(`[API] Trying final endpoint format: ${url3}`);
      
      response = await fetch(url3, {
        method: 'GET',
        ...defaultOptions
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      // If all approaches fail, throw an error
      throw new Error(`API request failed: Unable to find category with ID ${categoryId}`);
    } catch (error) {
      console.error(`Failed to fetch category (ID: ${categoryId}):`, error);
      throw error;
    }
  }
};

/**
 * Service related API calls
 */
export const serviceService = {
  // Get services by category ID
  getServicesByCategory: async (categoryId: string) => {
    try {
      const url = `${API_BASE}/services/?category_id=${categoryId}`;
      console.log(`[API] Fetching services by category ID from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        ...defaultOptions
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[API] Retrieved data for category ${categoryId}, found ${Array.isArray(data) ? data.length : 0} items`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch services for category (ID: ${categoryId}):`, error);
      throw error;
    }
  },
  
  // Get service price for vehicle
  getServicePrice: async (serviceId: number, manufacturerId: number, vehicleModelId: number) => {
    try {
      const url = `${API_BASE}/service-price/${serviceId}/?manufacturer_id=${manufacturerId}&vehicle_model_id=${vehicleModelId}`;
      console.log(`[API] Fetching service price from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        ...defaultOptions
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch service price (ID: ${serviceId}):`, error);
      throw error;
    }
  },
  
  // Create a cart
  createCart: async () => {
    try {
      const url = `${API_BASE}/cart/create/`;
      console.log(`[API] Creating cart: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        ...defaultOptions
      });
      
      if (!response.ok) {
        throw new Error('Failed to create cart');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating cart:', error);
      throw error;
    }
  },
  
  // Add service to cart
  addToCart: async (cartId: number, serviceId: number, quantity: number, serviceName: string) => {
    try {
      const url = `${API_BASE}/cart/${cartId}/add/`;
      console.log(`[API] Adding service ${serviceId} to cart ${cartId}: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        ...defaultOptions,
        body: JSON.stringify({
          service_id: serviceId,
          quantity,
          service_name: serviceName
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add service to repairs basket');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding to repairs basket:', error);
      throw error;
    }
  },
  
  // Get cart items
  getCartItems: async (cartId: number) => {
    try {
      const url = `${API_BASE}/cart/${cartId}/items/`;
      console.log(`[API] Fetching cart items for cart ${cartId}: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        ...defaultOptions
      });
      
      if (!response.ok) {
        throw new Error('Failed to get cart items');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting cart items:', error);
      throw error;
    }
  }
};

export default {
  categoryService,
  serviceService
}; 