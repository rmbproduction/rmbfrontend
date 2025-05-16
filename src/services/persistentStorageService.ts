/**
 * Persistent Storage Service - Optimized Version
 * 
 * Provides an efficient way to store vehicle data using an appropriate storage strategy
 * based on data size and persistence requirements.
 */

// Declare global window property to store the DB promise
declare global {
  interface Window {
    __dbPromise?: Promise<IDBDatabase>;
  }
}

// In-memory cache for fastest access
const memoryCache = new Map<string, any>();

// Constants for IndexedDB
const DB_NAME = 'RepairMyBike_DB';
const DB_VERSION = 1;
const VEHICLE_STORE = 'vehicles';
const VEHICLE_DETAILS_STORE = 'vehicle_details';

// TTL values in milliseconds
const TTL = {
  VEHICLE: 24 * 60 * 60 * 1000, // 24 hours
  PHOTOS: 7 * 24 * 60 * 60 * 1000, // 7 days
  HISTORY: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Size limits in bytes
const SIZE_LIMITS = {
  SESSION_STORAGE: 50000, // ~50KB
  LOCAL_STORAGE: 100000,  // ~100KB
};

// Singleton DB instance
let dbInstance: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 * @returns Promise that resolves to an IndexedDB database instance
 */
const initializeDB = async (): Promise<IDBDatabase> => {
  // Return existing instance if available
  if (dbInstance) return dbInstance;
  
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.error('IndexedDB is not supported in this browser.');
      reject(new Error('IndexedDB not supported'));
      return;
    }
    
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create or update stores as needed
        if (!db.objectStoreNames.contains(VEHICLE_STORE)) {
          db.createObjectStore(VEHICLE_STORE, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(VEHICLE_DETAILS_STORE)) {
          db.createObjectStore(VEHICLE_DETAILS_STORE, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };
    } catch (err) {
      console.error('Failed to initialize IndexedDB:', err);
      reject(err);
      
      // The application can continue without IndexedDB
      // We'll fallback to other storage mechanisms
    }
  });
};

// Helper to calculate data size in bytes
const getDataSize = (data: any): number => {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch (e) {
    return Number.MAX_SAFE_INTEGER; // Assume large if can't calculate
  }
};

/**
 * Service for persistently storing vehicle data with optimized storage strategy
 */
const persistentStorageService = {
  /**
   * Save vehicle data using the most appropriate storage method
   * based on data size and persistence requirements
   */
  saveVehicleData: async (vehicleId: string, data: any, version?: string): Promise<void> => {
    if (!vehicleId) {
      throw new Error('Vehicle ID is required');
    }
    
    try {
      // First, ensure we have a full copy with ID embedded in the object
      const dataToStore = {
        ...data,
        id: vehicleId,
        version: version || data.version || `v${Date.now()}`,
        created: data.created || Date.now(),
        last_updated: Date.now(),
        expiry: Date.now() + TTL.VEHICLE
      };
      
      // Memory cache is always updated (fastest access)
      const cacheKey = `vehicle_${vehicleId}`;
      memoryCache.set(cacheKey, dataToStore);
      
      // Determine data size
      const dataSize = getDataSize(dataToStore);
      
      // STORAGE STRATEGY:
      // 1. Small data (<50KB): Use sessionStorage (fast, but cleared on tab close)
      // 2. Medium data (<100KB): Use localStorage (persists across sessions)
      // 3. Large data (>100KB): Use IndexedDB only (avoids blocking UI)
      
      // Always try sessionStorage for small data (fastest retrieval)
      if (dataSize < SIZE_LIMITS.SESSION_STORAGE) {
        try {
          sessionStorage.setItem(`vehicle_summary_${vehicleId}`, JSON.stringify(dataToStore));
        } catch (e) {
          console.warn('Failed to save to sessionStorage, falling back to other storage:', e);
        }
      }
      
      // For medium-sized data, try localStorage
      if (dataSize < SIZE_LIMITS.LOCAL_STORAGE) {
        try {
          localStorage.setItem(`vehicle_data_${vehicleId}`, JSON.stringify(dataToStore));
        } catch (e) {
          console.warn('Failed to save to localStorage, falling back to IndexedDB:', e);
          // Continue to IndexedDB
        }
      }
      
      // For all data, especially large data, use IndexedDB
      // This won't block the UI thread for large datasets
      try {
        const db = await initializeDB();
        
        return new Promise((resolve, reject) => {
          try {
            const transaction = db.transaction([VEHICLE_STORE], 'readwrite');
            
            transaction.oncomplete = () => {
              resolve();
            };
            
            transaction.onerror = (event) => {
              console.error(`Error saving vehicle data for ID ${vehicleId}:`, 
                (event.target as IDBTransaction).error);
              reject((event.target as IDBTransaction).error);
            };
            
            const store = transaction.objectStore(VEHICLE_STORE);
            store.put(dataToStore);
          } catch (txError) {
            console.error('Transaction error:', txError);
            reject(txError);
          }
        });
      } catch (dbError) {
        console.error('IndexedDB error:', dbError);
        // Continue even if IndexedDB fails
        // We already tried memory cache, sessionStorage and localStorage
      }
    } catch (error) {
      console.error('Error in saveVehicleData:', error);
      throw error;
    }
  },
  
  /**
   * Save vehicle photo URLs to persistent storage
   * @param vehicleId The vehicle ID
   * @param photoUrls The photo URLs to store
   * @returns Promise that resolves when data is saved
   */
  saveVehiclePhotoURLs: async (vehicleId: string, photoUrls: Record<string, string>): Promise<void> => {
    try {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      // Format data for storage
      const dataToStore = {
        id: vehicleId,
        photo_urls: photoUrls,
        last_updated: new Date().toISOString()
      };
      
      // 1. Save to localStorage (as fallback)
      try {
        localStorage.setItem(`vehicle_photos_${vehicleId}`, JSON.stringify(photoUrls));
      } catch (e) {
        console.warn('Error saving photo URLs to localStorage:', e);
      }
      
      // 2. Save to IndexedDB
      const db = await initializeDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([VEHICLE_DETAILS_STORE], 'readwrite');
        
        transaction.oncomplete = () => {
          console.log(`Successfully saved photo URLs for vehicle ID ${vehicleId}`);
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error(`Error saving photo URLs for vehicle ID ${vehicleId}:`, 
            (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };
        
        const store = transaction.objectStore(VEHICLE_DETAILS_STORE);
        store.put(dataToStore);
      });
    } catch (error) {
      console.error('Error in saveVehiclePhotoURLs:', error);
      throw error;
    }
  },
  
  /**
   * Save vehicle document URLs to persistent storage
   * @param vehicleId The vehicle ID
   * @param documentUrls The document URLs to store
   * @returns Promise that resolves when data is saved
   */
  saveVehicleDocumentURLs: async (vehicleId: string, documentUrls: Record<string, string>): Promise<void> => {
    try {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      // Format data for storage
      const dataToStore = {
        id: vehicleId,
        document_urls: documentUrls,
        last_updated: new Date().toISOString()
      };
      
      // 1. Save to localStorage (as fallback)
      try {
        localStorage.setItem(`vehicle_documents_${vehicleId}`, JSON.stringify(documentUrls));
      } catch (e) {
        console.warn('Error saving document URLs to localStorage:', e);
      }
      
      // 2. Save to IndexedDB
      const db = await initializeDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([VEHICLE_DETAILS_STORE], 'readwrite');
        
        transaction.oncomplete = () => {
          console.log(`Successfully saved document URLs for vehicle ID ${vehicleId}`);
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error(`Error saving document URLs for vehicle ID ${vehicleId}:`, 
            (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };
        
        const store = transaction.objectStore(VEHICLE_DETAILS_STORE);
        store.put(dataToStore);
      });
    } catch (error) {
      console.error('Error in saveVehicleDocumentURLs:', error);
      throw error;
    }
  },
  
  /**
   * Get vehicle data using the fastest available source
   */
  getVehicleData: async (vehicleId: string): Promise<any> => {
    if (!vehicleId) {
      throw new Error('Vehicle ID is required');
    }
    
    try {
      // First check memory cache (fastest)
      const cacheKey = `vehicle_${vehicleId}`;
      if (memoryCache.has(cacheKey)) {
        const cachedData = memoryCache.get(cacheKey);
        // Check if expired
        if (cachedData.expiry && Date.now() < cachedData.expiry) {
          return cachedData;
        }
        // If expired, continue to check other sources
      }
      
      // Next, check sessionStorage (still fast)
      try {
        const sessionData = sessionStorage.getItem(`vehicle_summary_${vehicleId}`);
        if (sessionData) {
          const parsedData = JSON.parse(sessionData);
          // Check if expired
          if (parsedData.expiry && Date.now() < parsedData.expiry) {
            // Update memory cache for future access
            memoryCache.set(cacheKey, parsedData);
            return parsedData;
          }
        }
      } catch (e) {
        console.warn('Error reading from sessionStorage:', e);
      }
      
      // Then check localStorage
      try {
        const localData = localStorage.getItem(`vehicle_data_${vehicleId}`);
        if (localData) {
          const parsedData = JSON.parse(localData);
          // Check if expired
          if (parsedData.expiry && Date.now() < parsedData.expiry) {
            // Update caches for future access
            memoryCache.set(cacheKey, parsedData);
            try {
              sessionStorage.setItem(`vehicle_summary_${vehicleId}`, localData);
            } catch (e) {
              // Ignore sessionStorage errors
            }
            return parsedData;
          }
        }
      } catch (e) {
        console.warn('Error reading from localStorage:', e);
      }
      
      // Finally, check IndexedDB
      try {
        const db = await initializeDB();
        
        return new Promise((resolve, reject) => {
          try {
            const transaction = db.transaction([VEHICLE_STORE], 'readonly');
            const store = transaction.objectStore(VEHICLE_STORE);
            const request = store.get(vehicleId);
            
            request.onsuccess = () => {
              const data = request.result;
              if (data && data.expiry && Date.now() < data.expiry) {
                // Update caches for future access
                memoryCache.set(cacheKey, data);
                
                // Try to update session storage if data is small enough
                if (getDataSize(data) < SIZE_LIMITS.SESSION_STORAGE) {
                  try {
                    sessionStorage.setItem(`vehicle_summary_${vehicleId}`, JSON.stringify(data));
                  } catch (e) {
                    // Ignore sessionStorage errors
                  }
                }
                
                resolve(data);
              } else {
                resolve(null);
              }
            };
            
            request.onerror = (event) => {
              reject((event.target as IDBRequest).error);
            };
          } catch (txError) {
            console.error('Transaction error:', txError);
            reject(txError);
          }
        });
      } catch (dbError) {
        console.error('IndexedDB error:', dbError);
        return null;
      }
    } catch (error) {
      console.error('Error in getVehicleData:', error);
      return null;
    }
  },
  
  /**
   * Get vehicle photo URLs from persistent storage
   * @param vehicleId The vehicle ID
   * @returns Promise that resolves to photo URLs or empty object if not found
   */
  getVehiclePhotoURLs: async (vehicleId: string): Promise<Record<string, string>> => {
    try {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      // Try to get from IndexedDB first
      try {
        const db = await initializeDB();
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([VEHICLE_DETAILS_STORE], 'readonly');
          const store = transaction.objectStore(VEHICLE_DETAILS_STORE);
          const request = store.get(vehicleId);
          
          request.onsuccess = () => {
            const data = request.result;
            if (data && data.photo_urls) {
              console.log(`Retrieved photo URLs for vehicle ID ${vehicleId} from IndexedDB`);
              resolve(data.photo_urls);
            } else {
              // Fall back to localStorage
              const localData = localStorage.getItem(`vehicle_photos_${vehicleId}`);
              if (localData) {
                try {
                  const parsedData = JSON.parse(localData);
                  console.log(`Retrieved photo URLs for vehicle ID ${vehicleId} from localStorage`);
                  resolve(parsedData);
                } catch (e) {
                  console.error('Error parsing photo URLs from localStorage:', e);
                  resolve({});
                }
              } else {
                // Try to extract from vehicle data
                persistentStorageService.getVehicleData(vehicleId)
                  .then(vehicleData => {
                    if (vehicleData) {
                      const photoUrls: Record<string, string> = {};
                      
                      // Check various possible locations for photo URLs
                      if (vehicleData.photo_urls) {
                        Object.assign(photoUrls, vehicleData.photo_urls);
                      }
                      
                      if (vehicleData.vehicle) {
                        const photoFields = [
                          'photo_front', 'photo_back', 'photo_left', 'photo_right',
                          'photo_dashboard', 'photo_odometer', 'photo_engine', 'photo_extras'
                        ];
                        
                        photoFields.forEach(field => {
                          if (vehicleData.vehicle[field]) {
                            const key = field.replace('photo_', '');
                            photoUrls[key] = vehicleData.vehicle[field];
                          }
                        });
                      }
                      
                      if (Object.keys(photoUrls).length > 0) {
                        console.log(`Extracted photo URLs from vehicle data for ID ${vehicleId}`);
                        // Save for future use
                        persistentStorageService.saveVehiclePhotoURLs(vehicleId, photoUrls)
                          .catch(e => console.error('Error saving extracted photo URLs:', e));
                        
                        resolve(photoUrls);
                      } else {
                        console.log(`No photo URLs found for vehicle ID ${vehicleId}`);
                        resolve({});
                      }
                    } else {
                      console.log(`No photo URLs found for vehicle ID ${vehicleId}`);
                      resolve({});
                    }
                  })
                  .catch(err => {
                    console.error('Error getting vehicle data for photo extraction:', err);
                    resolve({});
                  });
              }
            }
          };
          
          request.onerror = (event) => {
            console.error(`Error retrieving photo URLs for vehicle ID ${vehicleId}:`, 
              (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
          };
        });
      } catch (dbError) {
        console.error('IndexedDB error in getVehiclePhotoURLs:', dbError);
        
        // Fall back to localStorage
        const localData = localStorage.getItem(`vehicle_photos_${vehicleId}`);
        if (localData) {
          return JSON.parse(localData);
        }
        
        return {};
      }
    } catch (error) {
      console.error('Error in getVehiclePhotoURLs:', error);
      return {};
    }
  },
  
  /**
   * Get all stored vehicle IDs
   * @returns Promise that resolves to an array of vehicle IDs
   */
  getAllVehicleIds: async (): Promise<string[]> => {
    try {
      const db = await initializeDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([VEHICLE_STORE], 'readonly');
        const store = transaction.objectStore(VEHICLE_STORE);
        const request = store.getAllKeys();
        
        request.onsuccess = () => {
          const ids = request.result as string[];
          console.log(`Retrieved ${ids.length} vehicle IDs from IndexedDB`);
          resolve(ids);
        };
        
        request.onerror = (event) => {
          console.error('Error retrieving vehicle IDs:', 
            (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      });
    } catch (dbError) {
      console.error('IndexedDB error in getAllVehicleIds:', dbError);
      
      // Fall back to parsing localStorage keys
      try {
        const vehicleIds: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('vehicle_data_')) {
            const id = key.replace('vehicle_data_', '');
            vehicleIds.push(id);
          }
        }
        
        return vehicleIds;
      } catch (e) {
        console.error('Error extracting vehicle IDs from localStorage:', e);
        return [];
      }
    }
  },
  
  /**
   * Synchronize data between all storage mechanisms
   * @param vehicleId The vehicle ID to synchronize
   */
  syncStorageLayers: async (vehicleId: string): Promise<void> => {
    try {
      if (!vehicleId) return;
      
      // Find the best data source
      let bestData: any = null;
      let bestDataSource = '';
      
      // Check IndexedDB first
      try {
        const db = await initializeDB();
        const data = await new Promise<any>((resolve) => {
          const transaction = db.transaction([VEHICLE_STORE], 'readonly');
          const store = transaction.objectStore(VEHICLE_STORE);
          const request = store.get(vehicleId);
          
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(null);
        });
        
        if (data && data.last_updated) {
          bestData = data;
          bestDataSource = 'IndexedDB';
        }
      } catch (e) {
        console.error('Error checking IndexedDB during sync:', e);
      }
      
      // Check localStorage
      try {
        const localData = localStorage.getItem(`vehicle_data_${vehicleId}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (parsed && (!bestData || parsed.last_updated > bestData.last_updated)) {
            bestData = parsed;
            bestDataSource = 'localStorage';
          }
        }
      } catch (e) {
        console.error('Error checking localStorage during sync:', e);
      }
      
      // Check sessionStorage
      try {
        const sessionData = sessionStorage.getItem(`vehicle_summary_${vehicleId}`);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed && (!bestData || parsed.last_updated > bestData.last_updated)) {
            bestData = parsed;
            bestDataSource = 'sessionStorage';
          }
        }
      } catch (e) {
        console.error('Error checking sessionStorage during sync:', e);
      }
      
      // If we found best data, update all storage layers
      if (bestData) {
        console.log(`Synchronizing all storage layers with best data from ${bestDataSource}`);
        
        // Update with fresh timestamp
        bestData.last_updated = Date.now();
        
        // Update all storage layers
        try {
          localStorage.setItem(`vehicle_data_${vehicleId}`, JSON.stringify(bestData));
          sessionStorage.setItem(`vehicle_summary_${vehicleId}`, JSON.stringify(bestData));
          
          const db = await initializeDB();
          const transaction = db.transaction([VEHICLE_STORE], 'readwrite');
          const store = transaction.objectStore(VEHICLE_STORE);
          store.put(bestData);
        } catch (e) {
          console.error('Error updating storage layers during sync:', e);
        }
      }
    } catch (error) {
      console.error('Error in syncStorageLayers:', error);
    }
  },
  
  /**
   * Subscribe to changes for a specific vehicle
   * @param vehicleId The vehicle ID to watch
   * @param callback Function to call when data changes
   * @returns Unsubscribe function
   */
  subscribeToVehicle: (vehicleId: string, callback: () => void): (() => void) => {
    const eventName = `vehicle_updated_${vehicleId}`;
    const handler = () => callback();
    
    window.addEventListener(eventName, handler);
    
    return () => {
      window.removeEventListener(eventName, handler);
    };
  },
  
  /**
   * Notify subscribers that vehicle data has changed
   * @param vehicleId The vehicle ID that was updated
   */
  notifyVehicleUpdated: (vehicleId: string): void => {
    window.dispatchEvent(new Event(`vehicle_updated_${vehicleId}`));
  },
  
  /**
   * Clear all vehicle data for a specific vehicle
   * @param vehicleId The vehicle ID to clear
   */
  clearVehicleData: async (vehicleId: string): Promise<void> => {
    try {
      if (!vehicleId) return;
      
      // 1. Clear from localStorage
      localStorage.removeItem(`vehicle_data_${vehicleId}`);
      localStorage.removeItem(`vehicle_photos_${vehicleId}`);
      localStorage.removeItem(`vehicle_documents_${vehicleId}`);
      localStorage.removeItem(`sell_request_${vehicleId}`);
      
      // 2. Clear from sessionStorage
      sessionStorage.removeItem(`vehicle_summary_${vehicleId}`);
      
      // 3. Clear from IndexedDB
      const db = await initializeDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(
          [VEHICLE_STORE, VEHICLE_DETAILS_STORE], 
          'readwrite'
        );
        
        transaction.oncomplete = () => {
          console.log(`Cleared data for vehicle ID ${vehicleId}`);
          
          // Notify subscribers that data was cleared
          persistentStorageService.notifyVehicleUpdated(vehicleId);
          
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error(`Error clearing data for vehicle ID ${vehicleId}:`, 
            (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };
        
        // Delete from all stores
        transaction.objectStore(VEHICLE_STORE).delete(vehicleId);
        transaction.objectStore(VEHICLE_DETAILS_STORE).delete(vehicleId);
      });
    } catch (error) {
      console.error('Error in clearVehicleData:', error);
    }
  },
  
  /**
   * Clear expired data from all storage mechanisms
   */
  clearExpiredData: async (): Promise<void> => {
    const now = Date.now();
    
    // Clear memory cache
    for (const [key, value] of memoryCache.entries()) {
      if (value.expiry && now > value.expiry) {
        memoryCache.delete(key);
      }
    }
    
    // Clear sessionStorage
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('vehicle_')) {
          try {
            // Skip image URL keys that shouldn't be parsed as JSON
            if (key.includes('vehicle_image_')) {
              // These are direct URL strings, not JSON objects
              continue;
            }
            
            const item = sessionStorage.getItem(key);
            if (item) {
              const data = JSON.parse(item);
              if (data.expiry && now > data.expiry) {
                sessionStorage.removeItem(key);
              }
            }
          } catch (e) {
            // Skip items that can't be parsed
            console.warn(`Failed to parse sessionStorage item: ${key}`, e);
          }
        }
      }
    } catch (e) {
      console.warn('Error cleaning sessionStorage:', e);
    }
    
    // Clear localStorage
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vehicle_')) {
          try {
            // Skip image URL keys that shouldn't be parsed as JSON
            if (key.includes('vehicle_image_')) {
              // These are direct URL strings, not JSON objects
              continue;
            }
            
            const item = localStorage.getItem(key);
            if (item) {
              const data = JSON.parse(item);
              if (data.expiry && now > data.expiry) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            // Skip items that can't be parsed
            console.warn(`Failed to parse localStorage item: ${key}`, e);
          }
        }
      }
    } catch (e) {
      console.warn('Error cleaning localStorage:', e);
    }
    
    // Clear IndexedDB data
    try {
      const db = await initializeDB();
      
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([VEHICLE_STORE, VEHICLE_DETAILS_STORE], 'readwrite');
          
          transaction.oncomplete = () => {
            resolve();
          };
          
          transaction.onerror = (event) => {
            console.error('Error cleaning IndexedDB:', (event.target as IDBTransaction).error);
            reject((event.target as IDBTransaction).error);
          };
          
          const vehicleStore = transaction.objectStore(VEHICLE_STORE);
          const vehicleRequest = vehicleStore.openCursor();
          
          vehicleRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
            if (cursor) {
              const data = cursor.value;
              if (data.expiry && now > data.expiry) {
                cursor.delete();
              }
              cursor.continue();
            }
          };
          
          const detailsStore = transaction.objectStore(VEHICLE_DETAILS_STORE);
          const detailsRequest = detailsStore.openCursor();
          
          detailsRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
            if (cursor) {
              const data = cursor.value;
              if (data.expiry && now > data.expiry) {
                cursor.delete();
              }
              cursor.continue();
            }
          };
        } catch (txError) {
          console.error('Transaction error during cleanup:', txError);
          reject(txError);
        }
      });
    } catch (dbError) {
      console.error('IndexedDB error during cleanup:', dbError);
    }
  },
  
  getVehicleHistory: async (): Promise<any[]> => {
    try {
      // First try to get from localStorage
      const vehicleKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('vehicle_data_') || key.startsWith('vehicle_summary_')
      );
      
      // Extract all vehicle data
      const vehicles = vehicleKeys.map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          // Add id from key if not present
          if (!data.id && key.includes('_')) {
            data.id = key.split('_').pop();
          }
          return data;
        } catch (e) {
          console.error(`Error parsing data for key ${key}:`, e);
          return null;
        }
      }).filter(Boolean);
      
      return vehicles;
    } catch (e) {
      console.error('Error retrieving vehicle history:', e);
      return [];
    }
  }
};

/**
 * Helper function to enrich stored vehicle data for consistent structure
 * @param data The data retrieved from storage
 * @param vehicleId The vehicle ID (for safety)
 * @returns Enhanced data with consistent structure
 */
function enrichStoredVehicleData(data: any, vehicleId: string): any {
  // Convert vehicleId to string for safety
  const safeVehicleId = String(vehicleId);
  
  // If data is null/undefined, return null
  if (data == null) return null;
  
  // Check if data is not an object (e.g., it's a number, string, boolean)
  if (typeof data !== 'object') {
    console.error(`Invalid data type for vehicle ID ${safeVehicleId}: ${typeof data}, value: ${data}. Creating new object.`);
    // Create a proper object to work with
    data = { id: safeVehicleId };
  }
  
  // Ensure we have the ID set
  const enriched = {
    ...data,
    id: data.id || safeVehicleId
  };
  
  // Ensure vehicle object exists
  if (!enriched.vehicle || typeof enriched.vehicle !== 'object') {
    // Try to create vehicle object from root level properties
    if (enriched.brand || enriched.model || enriched.registration_number) {
      console.log('Creating vehicle object from root level properties');
      enriched.vehicle = {
        id: safeVehicleId,
        brand: enriched.brand || 'Unknown',
        model: enriched.model || 'Unknown',
        registration_number: enriched.registration_number || 'Unknown',
        year: enriched.year || new Date().getFullYear(),
        fuel_type: enriched.fuel_type || 'Petrol',
        color: enriched.color || 'Not Available',
        kms_driven: enriched.kms_driven || 0,
        engine_capacity: enriched.engine_capacity || 0,
        expected_price: enriched.expected_price || enriched.price || 0,
        price: enriched.price || enriched.expected_price || 0,
        condition: enriched.condition || 'Not Available',
        mileage: enriched.mileage || enriched.Mileage || 'Not Available',
        Mileage: enriched.Mileage || enriched.mileage || 'Not Available',
        last_updated: enriched.last_updated || Date.now()
      };
    } else {
      // Provide an empty but valid structure
      enriched.vehicle = {
        id: safeVehicleId,
        brand: 'Unknown',
        model: 'Unknown',
        registration_number: 'Unknown'
      };
    }
  }
  
  // Ensure the root prices match vehicle price
  if (typeof enriched.vehicle === 'object' && enriched.vehicle !== null) {
    if (enriched.vehicle.price && !enriched.price) {
      enriched.price = enriched.vehicle.price;
    }
    if (enriched.vehicle.expected_price && !enriched.expected_price) {
      enriched.expected_price = enriched.vehicle.expected_price;
    }
  }
  
  // If we have vehicle_details, sync critical fields
  if (enriched.vehicle_details && typeof enriched.vehicle_details === 'object') {
    const fieldsToSync = [
      'brand', 'model', 'year', 'registration_number', 'fuel_type',
      'color', 'kms_driven', 'engine_capacity', 'condition',
      'mileage', 'Mileage', 'price', 'expected_price'
    ];
    
    // Ensure vehicle is an object before trying to set properties on it
    if (typeof enriched.vehicle !== 'object' || enriched.vehicle === null) {
      console.error(`Invalid vehicle object for ID ${safeVehicleId}. Creating new vehicle object.`);
      enriched.vehicle = {
        id: safeVehicleId,
        brand: 'Unknown',
        model: 'Unknown',
        registration_number: 'Unknown'
      };
    }
    
    fieldsToSync.forEach(field => {
      if (enriched.vehicle_details[field] && 
         (!enriched.vehicle[field] || 
          enriched.vehicle[field] === 'Unknown' || 
          enriched.vehicle[field] === 'Not Available')) {
        enriched.vehicle[field] = enriched.vehicle_details[field];
      }
    });
  }
  
  return enriched;
}

export { persistentStorageService, initializeDB };
export default persistentStorageService; 