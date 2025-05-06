/**
 * Storage Manager Service
 * 
 * A centralized service for managing browser storage (localStorage and sessionStorage)
 * with additional features like expiration, key standardization, and cleanup.
 */

interface StoredItem<T> {
  data: T;
  expiry?: number; // Timestamp in milliseconds
  created: number; // Timestamp in milliseconds
}

const STORAGE_PREFIX = 'rmb_';
const SESSION_PREFIX = 'session_';
const LOCAL_PREFIX = 'local_';

// Default expiration times
const DEFAULT_EXPIRY = {
  SESSION: 30 * 60 * 1000, // 30 minutes
  LOCAL: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const StorageManager = {
  /**
   * Generate standardized keys for different types of data
   */
  keys: {
    // Vehicle-related keys
    vehicle: (id: string) => `${STORAGE_PREFIX}vehicle_${id}`,
    vehicleSummary: (id: string) => `${STORAGE_PREFIX}vehicle_summary_${id}`,
    vehiclePhotos: (id: string) => `${STORAGE_PREFIX}vehicle_photos_${id}`,
    vehicleData: (id: string) => `${STORAGE_PREFIX}vehicle_data_${id}`,
    lastSubmittedVehicle: () => `${STORAGE_PREFIX}last_submitted_vehicle`,
    
    // Authentication keys
    accessToken: () => `${STORAGE_PREFIX}access_token`,
    refreshToken: () => `${STORAGE_PREFIX}refresh_token`,
    user: () => `${STORAGE_PREFIX}user`,
    
    // Other data keys
    availableVehicles: () => `${STORAGE_PREFIX}available_vehicles`,
    vehicleFilters: () => `${STORAGE_PREFIX}vehicle_filters`,
    userBookings: () => `${STORAGE_PREFIX}user_bookings`,
    
    // Custom key generator
    custom: (name: string) => `${STORAGE_PREFIX}${name}`,
  },
  
  /**
   * Session Storage Operations (with automatic expiry)
   */
  session: {
    /**
     * Store data in sessionStorage with expiration
     * @param key Storage key
     * @param data Data to store
     * @param expiryMinutes Expiration time in minutes (default: 30 minutes)
     */
    set: <T>(key: string, data: T, expiryMinutes?: number): void => {
      try {
        const item: StoredItem<T> = {
          data,
          created: Date.now(),
        };
        
        // Set expiry if provided
        if (expiryMinutes !== undefined) {
          item.expiry = Date.now() + expiryMinutes * 60 * 1000;
        } else {
          item.expiry = Date.now() + DEFAULT_EXPIRY.SESSION;
        }
        
        sessionStorage.setItem(
          `${SESSION_PREFIX}${key}`, 
          JSON.stringify(item)
        );
      } catch (error) {
        console.error(`Error storing data in sessionStorage (${key}):`, error);
      }
    },
    
    /**
     * Get data from sessionStorage with expiration check
     * @param key Storage key
     * @returns The stored data or null if expired or not found
     */
    get: <T>(key: string): T | null => {
      try {
        const item = sessionStorage.getItem(`${SESSION_PREFIX}${key}`);
        if (!item) return null;
        
        const parsedItem = JSON.parse(item) as StoredItem<T>;
        
        // Check if the item has expired
        if (parsedItem.expiry && Date.now() > parsedItem.expiry) {
          // Remove expired item
          sessionStorage.removeItem(`${SESSION_PREFIX}${key}`);
          return null;
        }
        
        return parsedItem.data;
      } catch (error) {
        console.error(`Error retrieving data from sessionStorage (${key}):`, error);
        return null;
      }
    },
    
    /**
     * Remove item from sessionStorage
     * @param key Storage key
     */
    remove: (key: string): void => {
      try {
        sessionStorage.removeItem(`${SESSION_PREFIX}${key}`);
      } catch (error) {
        console.error(`Error removing data from sessionStorage (${key}):`, error);
      }
    },
    
    /**
     * Clear all session storage items for the application
     */
    clear: (): void => {
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(SESSION_PREFIX)) {
            sessionStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error('Error clearing sessionStorage:', error);
      }
    },
  },
  
  /**
   * Local Storage Operations (with automatic expiry)
   */
  local: {
    /**
     * Store data in localStorage with expiration
     * @param key Storage key
     * @param data Data to store
     * @param expiryDays Expiration time in days (default: 7 days)
     */
    set: <T>(key: string, data: T, expiryDays?: number): void => {
      try {
        const item: StoredItem<T> = {
          data,
          created: Date.now(),
        };
        
        // Set expiry if provided
        if (expiryDays !== undefined) {
          item.expiry = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
        } else {
          item.expiry = Date.now() + DEFAULT_EXPIRY.LOCAL;
        }
        
        localStorage.setItem(
          `${LOCAL_PREFIX}${key}`, 
          JSON.stringify(item)
        );
      } catch (error) {
        console.error(`Error storing data in localStorage (${key}):`, error);
      }
    },
    
    /**
     * Get data from localStorage with expiration check
     * @param key Storage key
     * @returns The stored data or null if expired or not found
     */
    get: <T>(key: string): T | null => {
      try {
        const item = localStorage.getItem(`${LOCAL_PREFIX}${key}`);
        if (!item) return null;
        
        const parsedItem = JSON.parse(item) as StoredItem<T>;
        
        // Check if the item has expired
        if (parsedItem.expiry && Date.now() > parsedItem.expiry) {
          // Remove expired item
          localStorage.removeItem(`${LOCAL_PREFIX}${key}`);
          return null;
        }
        
        return parsedItem.data;
      } catch (error) {
        console.error(`Error retrieving data from localStorage (${key}):`, error);
        return null;
      }
    },
    
    /**
     * Remove item from localStorage
     * @param key Storage key
     */
    remove: (key: string): void => {
      try {
        localStorage.removeItem(`${LOCAL_PREFIX}${key}`);
      } catch (error) {
        console.error(`Error removing data from localStorage (${key}):`, error);
      }
    },
    
    /**
     * Clear all local storage items for the application
     */
    clear: (): void => {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LOCAL_PREFIX)) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    },
  },
  
  /**
   * Vehicle-specific storage operations
   */
  vehicle: {
    /**
     * Store vehicle data with proper prefixing
     * @param id Vehicle ID
     * @param data Vehicle data
     */
    storeVehicleData: (id: string, data: any): void => {
      try {
        // Store in both local and session storage for redundancy
        StorageManager.session.set(StorageManager.keys.vehicleData(id), data);
        StorageManager.local.set(StorageManager.keys.vehicleData(id), data);
        
        // Also store as vehicle summary if it's not already there
        const existingSummary = StorageManager.session.get(StorageManager.keys.vehicleSummary(id));
        if (!existingSummary) {
          StorageManager.session.set(StorageManager.keys.vehicleSummary(id), { 
            ...data,
            id, // Ensure ID is present
          });
        }
        
        console.log(`Vehicle data stored for ID ${id}`);
      } catch (error) {
        console.error(`Error storing vehicle data (${id}):`, error);
      }
    },
    
    /**
     * Get vehicle data with fallback mechanisms
     * @param id Vehicle ID
     * @returns Vehicle data or null if not found
     */
    getVehicleData: (id: string): any => {
      try {
        // Try to get from session storage first (faster)
        let data = StorageManager.session.get(StorageManager.keys.vehicleSummary(id)) || 
                  StorageManager.session.get(StorageManager.keys.vehicleData(id));
        
        // If not found in session storage, try local storage
        if (!data) {
          data = StorageManager.local.get(StorageManager.keys.vehicleData(id));
        }
        
        // As a last resort, try the last submitted vehicle
        if (!data) {
          const lastSubmitted = StorageManager.local.get<Record<string, any>>(StorageManager.keys.lastSubmittedVehicle());
          if (lastSubmitted && 
              (typeof lastSubmitted === 'object' && 
              ('id' in lastSubmitted ? lastSubmitted.id === id : true))) {
            data = lastSubmitted;
          }
        }
        
        return data;
      } catch (error) {
        console.error(`Error retrieving vehicle data (${id}):`, error);
        return null;
      }
    },
    
    /**
     * Remove all data related to a vehicle
     * @param id Vehicle ID
     */
    clearVehicleData: (id: string): void => {
      try {
        // Clear from all possible storage locations
        StorageManager.session.remove(StorageManager.keys.vehicleSummary(id));
        StorageManager.session.remove(StorageManager.keys.vehicleData(id));
        StorageManager.session.remove(StorageManager.keys.vehiclePhotos(id));
        StorageManager.local.remove(StorageManager.keys.vehicleData(id));
        StorageManager.local.remove(StorageManager.keys.vehiclePhotos(id));
        
        console.log(`Cleared all data for vehicle ${id}`);
      } catch (error) {
        console.error(`Error clearing vehicle data (${id}):`, error);
      }
    },
  },
  
  /**
   * Cleanup and maintenance operations
   */
  maintenance: {
    /**
     * Clean up expired items from both storage types
     * @returns Number of items removed
     */
    cleanupExpiredItems: (): number => {
      let removedCount = 0;
      
      try {
        // Clean sessionStorage
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(SESSION_PREFIX)) {
            try {
              const item = sessionStorage.getItem(key);
              if (item) {
                const parsedItem = JSON.parse(item) as StoredItem<any>;
                if (parsedItem.expiry && Date.now() > parsedItem.expiry) {
                  sessionStorage.removeItem(key);
                  removedCount++;
                }
              }
            } catch (e) {
              // Skip items that can't be parsed
              console.warn(`Skipping invalid sessionStorage item: ${key}`);
            }
          }
        }
        
        // Clean localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LOCAL_PREFIX)) {
            try {
              const item = localStorage.getItem(key);
              if (item) {
                const parsedItem = JSON.parse(item) as StoredItem<any>;
                if (parsedItem.expiry && Date.now() > parsedItem.expiry) {
                  localStorage.removeItem(key);
                  removedCount++;
                }
              }
            } catch (e) {
              // Skip items that can't be parsed
              console.warn(`Skipping invalid localStorage item: ${key}`);
            }
          }
        }
        
        console.log(`Cleanup completed: removed ${removedCount} expired items`);
      } catch (error) {
        console.error('Error during storage cleanup:', error);
      }
      
      return removedCount;
    },
    
    /**
     * Clean up old items based on creation date, even if not expired
     * @param maxAgeDays Maximum age in days for items to keep
     * @returns Number of items removed
     */
    cleanupOldItems: (maxAgeDays: number): number => {
      let removedCount = 0;
      const maxAge = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
      
      try {
        // Clean sessionStorage
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(SESSION_PREFIX)) {
            try {
              const item = sessionStorage.getItem(key);
              if (item) {
                const parsedItem = JSON.parse(item) as StoredItem<any>;
                if (parsedItem.created && parsedItem.created < maxAge) {
                  sessionStorage.removeItem(key);
                  removedCount++;
                }
              }
            } catch (e) {
              // Skip items that can't be parsed
            }
          }
        }
        
        // Clean localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LOCAL_PREFIX)) {
            try {
              const item = localStorage.getItem(key);
              if (item) {
                const parsedItem = JSON.parse(item) as StoredItem<any>;
                if (parsedItem.created && parsedItem.created < maxAge) {
                  localStorage.removeItem(key);
                  removedCount++;
                }
              }
            } catch (e) {
              // Skip items that can't be parsed
            }
          }
        }
        
        console.log(`Old item cleanup completed: removed ${removedCount} items older than ${maxAgeDays} days`);
      } catch (error) {
        console.error('Error during old item cleanup:', error);
      }
      
      return removedCount;
    },
  },
};

// Run cleanup on startup
setTimeout(() => {
  StorageManager.maintenance.cleanupExpiredItems();
}, 2000);

export default StorageManager; 