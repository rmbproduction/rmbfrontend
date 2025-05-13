/**
 * Safe storage utilities to handle localStorage with better error handling
 * and size limits to prevent exceeding browser quotas
 */

// Default max size for items (1MB)
const DEFAULT_MAX_SIZE_BYTES = 1024 * 1024;

// Estimated localStorage quota on most browsers (5MB)
const ESTIMATED_QUOTA_BYTES = 5 * 1024 * 1024;

// Storage prefix to identify our app's keys
const STORAGE_PREFIX = 'rmb_';

/**
 * Add prefix to key for namespacing
 */
const prefixKey = (key: string): string => {
  return key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
};

/**
 * Safely get an item from localStorage with error handling
 */
export const getItem = (key: string): string | null => {
  try {
    return localStorage.getItem(prefixKey(key));
  } catch (error) {
    console.error(`Error retrieving item from localStorage:`, error);
    return null;
  }
};

/**
 * Safely get and parse a JSON item from localStorage
 */
export const getJsonItem = <T>(key: string, defaultValue: T | null = null): T | null => {
  const item = getItem(key);
  if (!item) return defaultValue;
  
  try {
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error parsing item from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Check if an item would exceed size limits before saving
 */
export const checkItemSize = (value: string): boolean => {
  // Calculate the size of the string in bytes (2 bytes per character in UTF-16)
  const sizeInBytes = new Blob([value]).size;
  return sizeInBytes <= DEFAULT_MAX_SIZE_BYTES;
};

/**
 * Estimate the remaining localStorage quota
 */
export const estimateRemainingQuota = (): number => {
  try {
    // Get all keys in localStorage
    const allKeys = Object.keys(localStorage);
    
    // Calculate total size used
    let totalSize = 0;
    allKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += new Blob([key]).size + new Blob([value]).size;
      }
    });
    
    // Return estimated remaining space
    return Math.max(0, ESTIMATED_QUOTA_BYTES - totalSize);
  } catch (error) {
    console.error('Error estimating localStorage quota:', error);
    return 0;
  }
};

/**
 * Safely set an item in localStorage with size checking
 */
export const setItem = (key: string, value: string): boolean => {
  try {
    const prefixedKey = prefixKey(key);
    
    // Check if this item would exceed our size limit
    if (!checkItemSize(value)) {
      console.warn(`Item exceeds size limit (${DEFAULT_MAX_SIZE_BYTES} bytes): ${key}`);
      return false;
    }
    
    // First try to store the item
    localStorage.setItem(prefixedKey, value);
    return true;
  } catch (error) {
    // Handle errors (including QuotaExceededError)
    console.error(`Error storing item in localStorage:`, error);
    
    if (error instanceof DOMException && 
        (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      // Clear some space by removing older items
      try {
        clearOldItems();
        
        // Try again after clearing space
        try {
          localStorage.setItem(prefixKey(key), value);
          return true;
        } catch (retryError) {
          console.error(`Failed to store item after clearing space:`, retryError);
        }
      } catch (clearError) {
        console.error(`Error clearing localStorage space:`, clearError);
      }
    }
    
    return false;
  }
};

/**
 * Safely store a JSON object in localStorage
 */
export const setJsonItem = <T>(key: string, value: T): boolean => {
  try {
    const jsonValue = JSON.stringify(value);
    return setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error stringifying item for localStorage:`, error);
    return false;
  }
};

/**
 * Clear only items related to our app (prefixed)
 */
export const clearAppItems = (): void => {
  try {
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing app items from localStorage:', error);
  }
};

/**
 * Remove an item safely
 */
export const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(prefixKey(key));
  } catch (error) {
    console.error(`Error removing item from localStorage:`, error);
  }
};

/**
 * Clear oldest items when approaching storage limits
 */
const clearOldItems = (): void => {
  try {
    const allKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .sort((a, b) => {
        // Sort by last access time if available
        const aTime = getJsonItem<number>(`${a}_timestamp`, 0);
        const bTime = getJsonItem<number>(`${b}_timestamp`, 0);
        return (aTime || 0) - (bTime || 0);
      });
    
    // Remove the oldest 20% of items
    const itemsToRemove = Math.max(1, Math.floor(allKeys.length * 0.2));
    
    for (let i = 0; i < itemsToRemove; i++) {
      if (allKeys[i]) {
        localStorage.removeItem(allKeys[i]);
        const timestampKey = `${allKeys[i]}_timestamp`;
        if (localStorage.getItem(timestampKey)) {
          localStorage.removeItem(timestampKey);
        }
      }
    }
  } catch (error) {
    console.error('Error clearing old items from localStorage:', error);
  }
};

/**
 * Update the access timestamp for an item
 */
export const touchItem = (key: string): void => {
  try {
    setItem(`${prefixKey(key)}_timestamp`, Date.now().toString());
  } catch (error) {
    // Silent fail - timestamps are useful but not critical
  }
};

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

export default {
  getItem,
  getJsonItem,
  setItem,
  setJsonItem,
  removeItem,
  clearAppItems,
  touchItem,
  isStorageAvailable,
  estimateRemainingQuota
}; 