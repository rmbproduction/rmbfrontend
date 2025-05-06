/**
 * Utility functions for handling images throughout the application
 */

/**
 * Checks if a URL is a valid image URL (not a blob URL)
 * @param url The URL to validate
 * @returns boolean indicating if the URL is valid and not a blob URL
 */
export const isValidImageUrl = (url: any): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's a blob URL (which we want to avoid storing)
  if (url.startsWith('blob:')) return false;
  
  // Allow base64 data URLs
  if (url.startsWith('data:image/')) return true;
  
  // Basic URL validation
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Safely revokes a blob URL if it is one
 * @param url The URL to potentially revoke
 */
export const safeRevokeUrl = (url: string | null | undefined): void => {
  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to revoke blob URL:', e);
    }
  }
};

/**
 * Cleans up all blob URLs in an object
 * @param urlsObject Object containing URLs as values
 */
export const cleanupBlobUrls = (urlsObject: Record<string, string>): void => {
  Object.values(urlsObject).forEach(safeRevokeUrl);
};

/**
 * Convert a File or Blob to a base64 data URL
 * @param file The File or Blob to convert
 * @returns Promise that resolves to a base64 data URL
 */
export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Convert multiple files to base64 strings
 * @param files Object containing file objects by key
 * @returns Promise that resolves to an object with the same keys but base64 values
 */
export const filesToBase64 = async (files: Record<string, File | null>): Promise<Record<string, string>> => {
  const result: Record<string, string> = {};
  
  await Promise.all(
    Object.entries(files).map(async ([key, file]) => {
      if (file) {
        try {
          const base64 = await fileToBase64(file);
          result[key] = base64;
        } catch (error) {
          console.error(`Error converting file ${key} to base64:`, error);
        }
      }
    })
  );
  
  return result;
};

/**
 * Check if a string is a base64 data URL
 * @param str The string to check
 * @returns boolean indicating if the string is a base64 data URL
 */
export const isBase64Image = (str: string): boolean => {
  return typeof str === 'string' && str.startsWith('data:image/');
};

/**
 * Sanitizes an object with URLs to ensure no blob URLs are included
 * @param data Object containing URL fields
 * @param urlFields Array of field names that contain URLs
 * @returns A new object with sanitized URLs
 */
export const sanitizeUrlsForStorage = (
  data: Record<string, any>,
  urlFields: string[] = []
): Record<string, any> => {
  const sanitized = { ...data };
  
  urlFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = isValidImageUrl(sanitized[field]) ? sanitized[field] : null;
    }
  });
  
  return sanitized;
};

/**
 * Extract image URLs from an API response or stored data
 * @param data The data object containing image URLs
 * @param photoFields Array of field names containing photo URLs
 * @returns An object with normalized photo URLs
 */
export const extractPhotoUrls = (
  data: Record<string, any>,
  photoFields: string[] = [
    'photo_front', 'photo_back', 'photo_left', 'photo_right',
    'photo_dashboard', 'photo_odometer', 'photo_engine', 'photo_extras'
  ]
): Record<string, string> => {
  const photos: Record<string, string> = {};
  
  photoFields.forEach(field => {
    const key = field.replace('photo_', '');
    
    // Check in various possible locations in the data structure
    const photoUrl = 
      data[field] || 
      (data.vehicle && data.vehicle[field]) ||
      (data.photo_urls && data.photo_urls[key]) ||
      (data.base64_photos && data.base64_photos[key]);
    
    if (isValidImageUrl(photoUrl)) {
      photos[key] = photoUrl;
    }
  });
  
  return photos;
};

/**
 * Calculate size of a base64 string in MB
 * @param base64 The base64 string to measure
 * @returns Size in megabytes
 */
export const getBase64Size = (base64: string): number => {
  // Remove the data URL prefix (data:image/jpeg;base64,) to get only the base64 string
  const base64String = base64.split(',')[1];
  if (!base64String) return 0;
  
  // Base64 encodes 3 bytes into 4 chars
  const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
  const length = base64String.length;
  
  // Calculate size in bytes
  const sizeInBytes = (length * 0.75) - padding;
  
  // Convert to MB
  return sizeInBytes / (1024 * 1024);
};

/**
 * Compress a base64 image to a desired maximum size
 * @param base64 The base64 string to compress
 * @param maxSizeMB Maximum size in MB (default: 1MB)
 * @returns Promise that resolves to a compressed base64 string
 */
export const compressBase64Image = (base64: string, maxSizeMB: number = 1): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create an image to draw on canvas
    const img = new Image();
    img.src = base64;
    
    img.onload = () => {
      // Initial quality
      let quality = 0.8;
      const currentSize = getBase64Size(base64);
      
      // If the image is already smaller than the max size, return it as is
      if (currentSize <= maxSizeMB) {
        resolve(base64);
        return;
      }
      
      // Estimate quality based on current size
      quality = Math.min(0.9, (maxSizeMB / currentSize) * 0.9);
      
      // Create canvas
      const canvas = document.createElement('canvas');
      
      // Determine dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      // If the image is too large, scale it down
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1080;
      
      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }
      
      if (height > MAX_HEIGHT) {
        width = (width * MAX_HEIGHT) / height;
        height = MAX_HEIGHT;
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      
      resolve(compressedBase64);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
  });
};

/**
 * Safely store a base64 image with compression if needed
 * @param key The storage key
 * @param base64 The base64 string to store
 * @param maxSizeMB Maximum size in MB 
 */
export const safeStoreBase64Image = async (storageKey: string, imageKey: string, base64: string, maxSizeMB: number = 1): Promise<void> => {
  try {
    // Compress the image if needed
    const optimizedBase64 = await compressBase64Image(base64, maxSizeMB);
    
    // Get existing storage
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    // Update with new image
    existingData[imageKey] = optimizedBase64;
    
    // Store back
    localStorage.setItem(storageKey, JSON.stringify(existingData));
  } catch (error) {
    console.error(`Error storing base64 image for ${imageKey}:`, error);
  }
};

/**
 * Synchronize image data between localStorage and sessionStorage to ensure persistence
 * @param vehicleId Unique identifier for the vehicle
 * @returns Object containing all available image URLs and base64 data
 */
export const syncImageStorageForVehicle = (vehicleId: string): void => {
  try {
    // Check if we're on an email verification page 
    const isEmailVerificationPage = window.location.pathname.includes('/verify-email');
    
    // Check if we have blob URLs in sessionStorage
    const sessionKey = `vehicle_summary_${vehicleId}`;
    const sessionData = sessionStorage.getItem(sessionKey);
    
    if (sessionData) {
      const parsedData = JSON.parse(sessionData);
      
      // Keep track of if we made changes
      let madeChanges = false;
      
      // If we have photo_urls that are blob URLs, try to find alternatives
      if (parsedData.photo_urls) {
        Object.entries(parsedData.photo_urls).forEach(([key, url]) => {
          // If it's a blob URL, look for base64 alternative
          if (typeof url === 'string' && url.startsWith('blob:')) {
            console.log(`Found blob URL for ${key}, looking for alternative`);
            
            // Look in local storage for base64 data
            try {
              const localData = localStorage.getItem('sell_vehicle_photos_base64');
              if (localData) {
                const photos = JSON.parse(localData);
                if (photos[key] && isBase64Image(photos[key])) {
                  console.log(`Found base64 alternative for ${key}`);
                  // Replace blob URL with base64
                  parsedData.photo_urls[key] = photos[key];
                  madeChanges = true;
                }
              }
            } catch (e) {
              console.error('Error checking localStorage:', e);
            }
            
            // For email verification pages, replace with public default images 
            if (isEmailVerificationPage) {
              // Map of default images that are publicly accessible 
              const defaultImages: Record<string, string> = {
                front: '/images/default-bike.jpg',
                back: '/images/default-bike-back.jpg',
                side: '/images/default-bike-side.jpg',
                dashboard: '/images/default-dashboard.jpg',
                engine: '/images/default-engine.jpg',
                extras: '/images/motorcycle-placeholder.jpg',
                default: '/images/default-bike.jpg'
              };
              
              // Use default image if available for this key
              const defaultImage = defaultImages[key] || defaultImages.default;
              
              // Replace the blob URL with the default image
              parsedData.photo_urls[key] = defaultImage;
              madeChanges = true;
              console.log(`Using default image for ${key} on email verification page`);
            }
          }
        });
      }
      
      // If we changed anything, update sessionStorage
      if (madeChanges) {
        console.log('Updated sessionStorage with non-blob alternatives');
        sessionStorage.setItem(sessionKey, JSON.stringify(parsedData));
      }
    }
  } catch (e) {
    console.error('Error syncing image storage:', e);
  }
};

/**
 * Gets the best image source for a vehicle image, using persistent storage and other available sources
 * @param vehicleId The vehicle ID
 * @param imageKey The image key (like 'front', 'back', etc.)
 * @returns The best available URL for the image, or null if not found
 */
export const getBestImageSource = (vehicleId: string, imageKey: string): string | null => {
  try {
    // Sync storage to ensure we have the most recent data first
    syncImageStorageForVehicle(vehicleId);
    
    // Now fetch the data directly from storage
    const photoUrls: Record<string, string> = {};
    const base64Photos: Record<string, string> = {};
    
    // Get data from sessionStorage
    const sessionData = sessionStorage.getItem(`vehicle_summary_${vehicleId}`);
    if (sessionData) {
      const parsedData = JSON.parse(sessionData);
      
      // Extract photo URLs from session data
      if (parsedData.photo_urls) {
        Object.entries(parsedData.photo_urls).forEach(([key, url]) => {
          if (isValidImageUrl(url as string)) {
            photoUrls[key] = url as string;
          }
        });
      }
      
      // Extract base64 photos from session data
      if (parsedData.base64_photos) {
        Object.entries(parsedData.base64_photos).forEach(([key, data]) => {
          if (isBase64Image(data as string)) {
            base64Photos[key] = data as string;
          }
        });
      }
    }
    
    // Get data from localStorage
    const localData = localStorage.getItem('sell_vehicle_photos_base64');
    if (localData) {
      const parsedLocalData = JSON.parse(localData);
      
      // Fill in any missing base64 photos from localStorage
      Object.entries(parsedLocalData).forEach(([key, data]) => {
        if (isBase64Image(data as string)) {
          base64Photos[key] = data as string;
        }
      });
    }
    
    // Priority order: 
    // 1. Server URLs (non-blob)
    // 2. Base64 data
    // 3. Blob URLs (as last resort)
    
    // First check if we have a valid server URL (not blob)
    if (photoUrls[imageKey] && !photoUrls[imageKey].startsWith('blob:')) {
      return photoUrls[imageKey];
    }
    
    // Next check for a base64 image
    if (base64Photos[imageKey]) {
      return base64Photos[imageKey];
    }
    
    // Last resort: try any URL we have, including blob URLs
    if (photoUrls[imageKey]) {
      return photoUrls[imageKey];
    }
    
    // Rest of function remains unchanged
    // ... existing code ...
  } catch (error) {
    console.error(`Error getting best image source for ${imageKey}:`, error);
  }
  
  return null;
};

/**
 * Store all image data to sessionStorage for persistence
 * @param vehicleId The vehicle ID
 * @param photos The photos object containing URLs
 * @param base64Data The base64 data object (if available)
 */
export const persistImagesForVehicle = (
  vehicleId: string, 
  photos: Record<string, string>,
  base64Data?: Record<string, string>
): void => {
  try {
    // Get existing session data
    const sessionData = sessionStorage.getItem(`vehicle_summary_${vehicleId}`);
    const parsedData = sessionData ? JSON.parse(sessionData) : {};
    
    // Update photo URLs (filtering out blob URLs)
    parsedData.photo_urls = Object.entries(photos).reduce((acc, [key, url]) => {
      if (isValidImageUrl(url) && !url.startsWith('blob:')) {
        acc[key] = url;
      }
      return acc;
    }, {} as Record<string, string>);
    
    // Update base64 photos if provided
    if (base64Data) {
      parsedData.base64_photos = parsedData.base64_photos || {};
      
      Object.entries(base64Data).forEach(([key, data]) => {
        if (isBase64Image(data)) {
          parsedData.base64_photos[key] = data;
        }
      });
    }
    
    // Store in sessionStorage
    sessionStorage.setItem(`vehicle_summary_${vehicleId}`, JSON.stringify(parsedData));
  } catch (error) {
    console.error('Error persisting images for vehicle:', error);
  }
};

/**
 * Get an image URL with fallbacks from various storage methods and API
 * @param vehicleId The vehicle ID
 * @param imageKey The image key (e.g., 'front', 'back')
 * @param marketplaceService The marketplace service instance
 * @returns The best available URL for the specified image
 */
export const getImageWithFallback = async (
  vehicleId: string,
  imageKey: string,
  marketplaceService: any
): Promise<string | null> => {
  try {
    // Sync any image data between storage mechanisms
    syncImageStorageForVehicle(vehicleId);
    
    // Get existing local source from our other utility
    const localSource = getBestImageSource(vehicleId, imageKey);
    
    // If local source is good and not a blob URL, use it
    if (localSource && !localSource.startsWith('blob:')) {
      return localSource;
    }
    
    // If we don't have a valid URL or only have a blob URL, try the API
    if (marketplaceService && (!localSource || localSource.startsWith('blob:'))) {
      try {
        // Attempt to fetch the specific photo if we have a method for it
        if (marketplaceService.getVehiclePhoto) {
          const photoResponse = await marketplaceService.getVehiclePhoto(vehicleId, imageKey);
          if (photoResponse && photoResponse.url) {
            // Store the fetched URL in sessionStorage for future use
            persistImageUrl(vehicleId, imageKey, photoResponse.url);
            return photoResponse.url;
          }
        }
        
        // If we don't have a specific method or it failed, try to fetch the full vehicle data
        const vehicleData = await marketplaceService.getSellRequest(vehicleId);
        
        if (vehicleData) {
          // Extract URLs from the response using our utility
          const photoUrls = extractPhotoUrls(vehicleData);
          
          // If we found URLs, store them and return the requested one
          if (Object.keys(photoUrls).length > 0) {
            // Store all extracted URLs in sessionStorage
            persistImagesForVehicle(vehicleId, photoUrls);
            
            // Return the specific URL if available
            if (photoUrls[imageKey]) {
              return photoUrls[imageKey];
            }
          }
          
          // Check for different possible locations in the response
          const possibleImageProps = [
            `photo_${imageKey}`,
            `${imageKey}_photo`,
            `${imageKey}_image`,
            `photo_url_${imageKey}`,
          ];
          
          // Check if any of these properties exist in the response
          for (const prop of possibleImageProps) {
            if (vehicleData[prop] && isValidImageUrl(vehicleData[prop])) {
              persistImageUrl(vehicleId, imageKey, vehicleData[prop]);
              return vehicleData[prop];
            }
            
            // Also check in the vehicle property if it exists
            if (vehicleData.vehicle && vehicleData.vehicle[prop] && isValidImageUrl(vehicleData.vehicle[prop])) {
              persistImageUrl(vehicleId, imageKey, vehicleData.vehicle[prop]);
              return vehicleData.vehicle[prop];
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching image from API for ${imageKey}:`, error);
      }
    }
    
    // As a last resort, return whatever local source we have, even if it's a blob URL
    // (the SafeImage component will handle the error if it's invalid)
    return localSource;
  } catch (error) {
    console.error(`Error getting image with fallback for ${imageKey}:`, error);
    return null;
  }
};

/**
 * Persist a single image URL to sessionStorage
 * @param vehicleId The vehicle ID
 * @param imageKey The image key
 * @param url The URL to persist
 */
export const persistImageUrl = (vehicleId: string, imageKey: string, url: string): void => {
  if (!isValidImageUrl(url) || url.startsWith('blob:')) {
    console.warn(`Not persisting invalid or blob URL for ${imageKey}`);
    return;
  }
  
  try {
    const sessionKey = `vehicle_summary_${vehicleId}`;
    const sessionData = sessionStorage.getItem(sessionKey);
    const data = sessionData ? JSON.parse(sessionData) : {};
    
    // Ensure photo_urls exists
    if (!data.photo_urls) {
      data.photo_urls = {};
    }
    
    // Add the URL
    data.photo_urls[imageKey] = url;
    
    // Save back to sessionStorage
    sessionStorage.setItem(sessionKey, JSON.stringify(data));
  } catch (error) {
    console.error(`Error persisting image URL for ${imageKey}:`, error);
  }
};

/**
 * Check if we need to fetch images from backend based on image availability
 * @param vehicleId The vehicle ID
 * @param requiredKeys Array of required image keys
 * @returns Boolean indicating if backend fetch is needed
 */
export const shouldFetchImagesFromBackend = (vehicleId: string, requiredKeys: string[] = ['front']): boolean => {
  try {
    // Sync storage first
    syncImageStorageForVehicle(vehicleId);
    
    // Now manually check for required images in session storage
    const photoUrls: Record<string, string> = {};
    const base64Photos: Record<string, string> = {};
    
    // Get data from session storage
    const sessionData = sessionStorage.getItem(`vehicle_summary_${vehicleId}`);
    if (sessionData) {
      const parsedData = JSON.parse(sessionData);
      
      // Get photo URLs
      if (parsedData.photo_urls) {
        Object.entries(parsedData.photo_urls).forEach(([key, url]) => {
          if (typeof url === 'string') {
            photoUrls[key] = url;
          }
        });
      }
      
      // Get base64 photos
      if (parsedData.base64_photos) {
        Object.entries(parsedData.base64_photos).forEach(([key, data]) => {
          if (isBase64Image(data as string)) {
            base64Photos[key] = data as string;
          }
        });
      }
    }
    
    // Check if all required keys have valid sources
    for (const key of requiredKeys) {
      const hasValidUrl = photoUrls[key] && !photoUrls[key].startsWith('blob:');
      const hasBase64 = base64Photos[key] !== undefined;
      
      if (!hasValidUrl && !hasBase64) {
        return true; // We're missing at least one required image
      }
    }
    
    return false; // We have all required images
  } catch (error) {
    console.error('Error checking if images should be fetched from backend:', error);
    return true; // Fetch to be safe
  }
}; 