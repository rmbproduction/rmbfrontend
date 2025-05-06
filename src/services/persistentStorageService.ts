/**
 * Persistent Storage Service
 * 
 * Provides a way to persistently store vehicle data using both localStorage and IndexedDB.
 * This ensures data is never lost once it's stored, even if the user clears their session.
 */

// IndexedDB constants
const DB_NAME = 'AutoRevivePersistentStorage';
const DB_VERSION = 2; // Increased version to trigger database upgrade
const VEHICLE_STORE = 'vehicleData';
const PHOTO_STORE = 'vehiclePhotos';
const DOCUMENT_STORE = 'vehicleDocuments';
const VEHICLE_HISTORY_STORE = 'vehicleHistory';

// Maximum number of vehicles to keep in history
const MAX_HISTORY_ITEMS = 20;

/**
 * Initialize the IndexedDB database
 * @returns Promise that resolves to an IndexedDB database instance
 */
const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.error('IndexedDB is not supported in this browser.');
      reject(new Error('IndexedDB not supported'));
      return;
    }
    
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(VEHICLE_STORE)) {
        db.createObjectStore(VEHICLE_STORE, { keyPath: 'id' });
        console.log('Created vehicle data store');
      }
      
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
        console.log('Created vehicle photos store');
      }
      
      if (!db.objectStoreNames.contains(DOCUMENT_STORE)) {
        db.createObjectStore(DOCUMENT_STORE, { keyPath: 'id' });
        console.log('Created vehicle documents store');
      }
      
      if (!db.objectStoreNames.contains(VEHICLE_HISTORY_STORE)) {
        const historyStore = db.createObjectStore(VEHICLE_HISTORY_STORE, { keyPath: 'id', autoIncrement: true });
        // Create an index on vehicleId for fast lookups
        historyStore.createIndex('vehicleId', 'vehicleId', { unique: false });
        // Create an index on timestamp for ordering
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('Created vehicle history store');
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
};

/**
 * Service for persistently storing vehicle data
 */
const persistentStorageService = {
  /**
   * Save vehicle data to persistent storage (both IndexedDB and localStorage)
   * @param vehicleId The vehicle ID
   * @param data The data to store
   * @returns Promise that resolves when data is saved
   */
  saveVehicleData: async (vehicleId: string, data: any): Promise<void> => {
    try {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      // First, ensure we have a full copy with ID embedded in the object
      const dataToStore = {
        ...data,
        id: vehicleId,
        last_updated: new Date().toISOString()
      };
      
      console.log(`Saving vehicle data for ID ${vehicleId} to persistent storage`);
      
      // 1. Save to localStorage (as fallback)
      try {
        localStorage.setItem(`vehicle_data_${vehicleId}`, JSON.stringify(dataToStore));
      } catch (e) {
        console.warn('Error saving to localStorage (possibly full):', e);
      }
      
      // 2. Save to IndexedDB
      const db = await initializeDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([VEHICLE_STORE], 'readwrite');
        
        transaction.oncomplete = () => {
          console.log(`Successfully saved vehicle data for ID ${vehicleId} to IndexedDB`);
          
          // After successful save, add to vehicle history
          persistentStorageService.addToVehicleHistory(vehicleId, data.vehicle || data)
            .catch(err => console.error('Error adding to vehicle history:', err));
            
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error(`Error saving vehicle data for ID ${vehicleId}:`, 
            (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };
        
        const store = transaction.objectStore(VEHICLE_STORE);
        store.put(dataToStore);
      });
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
        const transaction = db.transaction([PHOTO_STORE], 'readwrite');
        
        transaction.oncomplete = () => {
          console.log(`Successfully saved photo URLs for vehicle ID ${vehicleId}`);
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error(`Error saving photo URLs for vehicle ID ${vehicleId}:`, 
            (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };
        
        const store = transaction.objectStore(PHOTO_STORE);
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
        const transaction = db.transaction([DOCUMENT_STORE], 'readwrite');
        
        transaction.oncomplete = () => {
          console.log(`Successfully saved document URLs for vehicle ID ${vehicleId}`);
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error(`Error saving document URLs for vehicle ID ${vehicleId}:`, 
            (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };
        
        const store = transaction.objectStore(DOCUMENT_STORE);
        store.put(dataToStore);
      });
    } catch (error) {
      console.error('Error in saveVehicleDocumentURLs:', error);
      throw error;
    }
  },
  
  /**
   * Get vehicle data from persistent storage
   * @param vehicleId The vehicle ID
   * @returns Promise that resolves to the vehicle data or null if not found
   */
  getVehicleData: async (vehicleId: string): Promise<any | null> => {
    try {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      // 1. Try to get from IndexedDB first
      try {
        const db = await initializeDB();
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([VEHICLE_STORE], 'readonly');
          const store = transaction.objectStore(VEHICLE_STORE);
          const request = store.get(vehicleId);
          
          request.onsuccess = () => {
            const data = request.result;
            if (data) {
              console.log(`Retrieved vehicle data for ID ${vehicleId} from IndexedDB`);
              resolve(data);
            } else {
              // 2. Fall back to localStorage if not in IndexedDB
              const localData = localStorage.getItem(`vehicle_data_${vehicleId}`);
              if (localData) {
                try {
                  const parsedData = JSON.parse(localData);
                  console.log(`Retrieved vehicle data for ID ${vehicleId} from localStorage`);
                  resolve(parsedData);
                } catch (e) {
                  console.error('Error parsing vehicle data from localStorage:', e);
                  resolve(null);
                }
              } else {
                // 3. Check sessionStorage as last resort
                const sessionData = sessionStorage.getItem(`vehicle_summary_${vehicleId}`);
                if (sessionData) {
                  try {
                    const parsedData = JSON.parse(sessionData);
                    console.log(`Retrieved vehicle data for ID ${vehicleId} from sessionStorage`);
                    resolve(parsedData);
                  } catch (e) {
                    console.error('Error parsing vehicle data from sessionStorage:', e);
                    resolve(null);
                  }
                } else {
                  console.log(`No stored vehicle data found for ID ${vehicleId}`);
                  resolve(null);
                }
              }
            }
          };
          
          request.onerror = (event) => {
            console.error(`Error retrieving vehicle data for ID ${vehicleId}:`, 
              (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
          };
        });
      } catch (dbError) {
        console.error('IndexedDB error:', dbError);
        // Fall back to localStorage
        const localData = localStorage.getItem(`vehicle_data_${vehicleId}`);
        if (localData) {
          return JSON.parse(localData);
        }
        
        // Try sessionStorage as last resort
        const sessionData = sessionStorage.getItem(`vehicle_summary_${vehicleId}`);
        if (sessionData) {
          return JSON.parse(sessionData);
        }
        
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
          const transaction = db.transaction([PHOTO_STORE], 'readonly');
          const store = transaction.objectStore(PHOTO_STORE);
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
   * Add a vehicle to the history store
   * @param vehicleId The vehicle ID
   * @param vehicleData Basic vehicle data to store
   */
  addToVehicleHistory: async (vehicleId: string, vehicleData: any): Promise<void> => {
    try {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      // Extract essential vehicle data for the history
      const essentialData = {
        brand: vehicleData.brand || 'Unknown',
        model: vehicleData.model || 'Unknown',
        year: vehicleData.year || new Date().getFullYear(),
        registration_number: vehicleData.registration_number || 'Unknown',
        price: vehicleData.price || vehicleData.expected_price || 0,
        thumbnail: vehicleData.photo_front || vehicleData.photo_urls?.front || null,
        status: vehicleData.status || 'unknown'
      };
      
      // Create history entry
      const historyEntry = {
        vehicleId,
        timestamp: new Date().toISOString(),
        summary: essentialData
      };
      
      // 1. Save to localStorage as backup
      try {
        // First, get existing history
        const existingHistory = JSON.parse(localStorage.getItem('vehicle_history') || '[]');
        
        // Check if this vehicle is already in history
        const existingIndex = existingHistory.findIndex((entry: any) => entry.vehicleId === vehicleId);
        
        if (existingIndex >= 0) {
          // Update existing entry with latest data
          existingHistory[existingIndex] = {
            ...existingHistory[existingIndex],
            timestamp: historyEntry.timestamp,
            summary: historyEntry.summary
          };
        } else {
          // Add new entry
          existingHistory.unshift(historyEntry);
          
          // Limit size
          if (existingHistory.length > MAX_HISTORY_ITEMS) {
            existingHistory.pop();
          }
        }
        
        // Save back to localStorage
        localStorage.setItem('vehicle_history', JSON.stringify(existingHistory));
      } catch (e) {
        console.warn('Error saving to localStorage history:', e);
      }
      
      // 2. Save to IndexedDB
      const db = await initializeDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([VEHICLE_HISTORY_STORE], 'readwrite');
        
        transaction.oncomplete = () => {
          console.log(`Added vehicle ID ${vehicleId} to history`);
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error(`Error adding vehicle ID ${vehicleId} to history:`, 
            (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };
        
        const store = transaction.objectStore(VEHICLE_HISTORY_STORE);
        const index = store.index('vehicleId');
        const request = index.getKey(vehicleId);
        
        request.onsuccess = () => {
          const existingKey = request.result;
          
          if (existingKey) {
            // Update existing entry
            store.put({
              id: existingKey,
              ...historyEntry
            });
          } else {
            // First, we need to check the count to maintain our limit
            const countRequest = store.count();
            
            countRequest.onsuccess = () => {
              const count = countRequest.result;
              
              // Add the new entry
              store.add(historyEntry);
              
              // If we're over the limit, remove the oldest entries
              if (count >= MAX_HISTORY_ITEMS) {
                // Get all entries sorted by timestamp
                const indexTimestamp = store.index('timestamp');
                const cursorRequest = indexTimestamp.openCursor();
                let processed = 0;
                
                cursorRequest.onsuccess = (event) => {
                  const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
                  
                  if (cursor && processed < (count - MAX_HISTORY_ITEMS + 1)) {
                    cursor.delete();
                    processed++;
                    cursor.continue();
                  }
                };
              }
            };
          }
        };
      });
    } catch (error) {
      console.error('Error in addToVehicleHistory:', error);
    }
  },
  
  /**
   * Get vehicle history entries
   * @param limit Maximum number of entries to return
   * @returns Promise that resolves to array of history entries
   */
  getVehicleHistory: async (limit: number = MAX_HISTORY_ITEMS): Promise<any[]> => {
    try {
      // 1. Try to get from IndexedDB first
      try {
        const db = await initializeDB();
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([VEHICLE_HISTORY_STORE], 'readonly');
          const store = transaction.objectStore(VEHICLE_HISTORY_STORE);
          const index = store.index('timestamp');
          
          // Open a cursor on the timestamp index in reverse order (newest first)
          const request = index.openCursor(null, 'prev');
          
          const results: any[] = [];
          
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
            
            if (cursor && results.length < limit) {
              results.push(cursor.value);
              cursor.continue();
            } else {
              console.log(`Retrieved ${results.length} vehicle history entries from IndexedDB`);
              resolve(results);
            }
          };
          
          request.onerror = (event) => {
            console.error('Error retrieving vehicle history:', 
              (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
          };
        });
      } catch (dbError) {
        console.error('IndexedDB error in getVehicleHistory:', dbError);
        
        // Fall back to localStorage
        try {
          const history = JSON.parse(localStorage.getItem('vehicle_history') || '[]');
          return history.slice(0, limit);
        } catch (e) {
          console.error('Error reading vehicle history from localStorage:', e);
          return [];
        }
      }
    } catch (error) {
      console.error('Error in getVehicleHistory:', error);
      return [];
    }
  },
  
  /**
   * View a vehicle (add to history without full data save)
   * Just records that the user viewed this vehicle
   * @param vehicleId The vehicle ID
   * @param basicInfo Basic vehicle info if available
   */
  viewVehicle: async (vehicleId: string, basicInfo?: any): Promise<void> => {
    try {
      if (!vehicleId) return;
      
      // First, check if we have this vehicle data already saved to avoid overwriting better data
      const existingData = await persistentStorageService.getVehicleData(vehicleId);
      
      // If we already have good data for this vehicle, just add to history
      if (existingData && existingData.vehicle &&
          ((existingData.vehicle.brand && existingData.vehicle.brand !== 'Unknown') ||
          (existingData.vehicle.registration_number && existingData.vehicle.registration_number !== 'Unknown'))) {
        console.log(`Vehicle ${vehicleId} already has good data in storage, just updating history`);
        
        // Extract essential data from existing data
        const essentialData = {
          brand: existingData.vehicle.brand || 'Unknown',
          model: existingData.vehicle.model || 'Unknown',
          year: existingData.vehicle.year || new Date().getFullYear(),
          registration_number: existingData.vehicle.registration_number || 'Unknown',
          price: existingData.vehicle.price || existingData.vehicle.expected_price || 0,
          thumbnail: existingData.vehicle.photo_front || existingData.photo_urls?.front || null,
          status: existingData.vehicle.status || existingData.status || 'unknown'
        };
        
        // Add to history
        await persistentStorageService.addToVehicleHistory(vehicleId, essentialData);
        return;
      }
      
      // If we don't have basic info, try to get it from storage
      if (!basicInfo) {
        const storedData = await persistentStorageService.getVehicleData(vehicleId);
        if (storedData) {
          basicInfo = storedData.vehicle || storedData;
        }
      }
      
      // If we still don't have data, just record the ID
      if (!basicInfo) {
        basicInfo = { 
          brand: 'Unknown',
          model: 'Unknown'
        };
      }
      
      // Add to history
      await persistentStorageService.addToVehicleHistory(vehicleId, basicInfo);
      
      // If the vehicleId matches the current URL, try to get more info from session storage too
      // This helps with page refreshes
      try {
        // Check if we're on vehicle summary page for this vehicle
        const currentPath = window.location.pathname;
        if (currentPath.includes(`/sell-vehicle/${vehicleId}/summary`)) {
          console.log('On vehicle summary page, checking for session storage data');
          
          // Try to get data from session storage
          const sessionData = sessionStorage.getItem(`vehicle_summary_${vehicleId}`);
          if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            console.log('Found session data for current vehicle:', parsedData);
            
            // If we have better data in session than in the basic info, save it to persistent storage
            if (parsedData && parsedData.vehicle && 
                (parsedData.vehicle.brand !== 'Unknown' || 
                 parsedData.vehicle.model !== 'Unknown' ||
                 parsedData.vehicle.registration_number !== 'Unknown')) {
              console.log('Saving better data from session to persistent storage');
              await persistentStorageService.saveVehicleData(vehicleId, parsedData);
            }
          }
        }
      } catch (e) {
        console.error('Error checking if on vehicle summary page:', e);
      }
      
    } catch (error) {
      console.error('Error in viewVehicle:', error);
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
      
      // 2. Clear from sessionStorage
      sessionStorage.removeItem(`vehicle_summary_${vehicleId}`);
      
      // 3. Clear from IndexedDB
      const db = await initializeDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(
          [VEHICLE_STORE, PHOTO_STORE, DOCUMENT_STORE], 
          'readwrite'
        );
        
        transaction.oncomplete = () => {
          console.log(`Cleared data for vehicle ID ${vehicleId}`);
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error(`Error clearing data for vehicle ID ${vehicleId}:`, 
            (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };
        
        // Delete from all stores
        transaction.objectStore(VEHICLE_STORE).delete(vehicleId);
        transaction.objectStore(PHOTO_STORE).delete(vehicleId);
        transaction.objectStore(DOCUMENT_STORE).delete(vehicleId);
      });
    } catch (error) {
      console.error('Error in clearVehicleData:', error);
    }
  }
};

export default persistentStorageService; 