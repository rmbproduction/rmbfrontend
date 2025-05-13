/**
 * Utility functions for handling images throughout the application
 */
import { API_CONFIG } from '../config/api.config';

// Cloudinary configuration - get from API_CONFIG
const CLOUDINARY_CLOUD_NAME = API_CONFIG.CLOUDINARY_CLOUD_NAME || 'dz81bjuea';
const CLOUDINARY_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Checks if a URL is a valid image URL (not a blob URL)
 * @param url The URL to validate
 * @returns boolean indicating if the URL is valid and not a blob URL
 */
export const isValidImageUrl = (url: any): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's a blob URL (which we want to avoid storing)
  if (url.startsWith('blob:')) return false;
  
  // Allow Cloudinary URLs
  if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) return true;
  
  // Allow base64 data URLs for backwards compatibility
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
 * Generate a properly formatted Cloudinary URL or fallback to a guaranteed working placeholder
 * @param path The image path or identifier 
 * @param options Options for image transformations
 * @returns A properly formatted Cloudinary URL or placeholder
 */
export const getCloudinaryUrl = (
  path: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    crop?: string;
    version?: string;
    vehicleId?: string | number;
  } = {}
): string => {
  try {
    // Get the cloud name from environment variables
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dz81bjuea';
    
    // Create a placeholder URL that is guaranteed to work - this is our fallback
    const createPlaceholder = (text: string = 'Vehicle') => {
      // URL encode the text
      const encodedText = encodeURIComponent(text);
      const width = options.width || 600;
      const height = options.height || 400;
      
      // Return a Cloudinary placeholder with text overlay
      return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${height},c_fill,g_center/l_text:Arial_32:${encodedText},co_white/e_colorize,co_rgb:FF5733,g_center/sample`;
    };
    
    // For vehicle-related images, check if we have a vehicleId
    if (options.vehicleId) {
      // Instead of constructing paths, use the sample image with text
      return createPlaceholder(`Vehicle ${options.vehicleId}`);
    }
    
    // For known assets, try to use their direct Cloudinary URLs
    // This is a safe approach until we have a proper asset mapping solution
    if (path.includes('logo')) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/v1747031052/logo_jlugzw.jpg`;
    }
    
    if (path.includes('bikeExpert')) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/v1747031052/bikeExpert_qt2sfa.jpg`;
    }
    
    if (path.includes('founder')) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/v1747031052/founder_vpnyov.jpg`;
    }
    
    // Default to the guaranteed placeholder
    return createPlaceholder();
  } catch (e) {
    console.error('Failed to generate Cloudinary URL:', e);
    // Return a safe fallback URL if generation fails
    return 'https://placehold.co/600x400?text=Image+Not+Available';
  }
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
      (data.photo_urls && data.photo_urls[key]);
    
    if (isValidImageUrl(photoUrl)) {
      photos[key] = photoUrl;
    }
  });
  
  return photos;
};

/**
 * Get best image source with fallbacks, preferring CDN URLs
 * @param vehicleId The vehicle ID
 * @param imageKey The image key/type
 * @returns The best available image URL or null
 */
export const getBestImageSource = (vehicleId: string, imageKey: string): string | null => {
  // First try to get from localStorage (may contain Cloudinary URL)
  try {
    const storedUrl = localStorage.getItem(`vehicle_image_${vehicleId}_${imageKey}`);
    if (isValidImageUrl(storedUrl)) {
      return storedUrl;
    }
  } catch (e) {
    console.warn('Error accessing localStorage:', e);
  }
  
  // Construct a Cloudinary URL as fallback if we have vehicleId
  if (vehicleId) {
    // Generate appropriate Cloudinary path based on image key
    const folder = imageKey === 'front' ? 'vehicle_photos' : 
                  (imageKey === 'back' ? 'vehicle_photos_back' : 'vehicle_photos_other');
    
    return getCloudinaryUrl(`${folder}/${vehicleId}`, {
      width: 800,
      quality: 85
    });
  }
  
  return null;
};

/**
 * Store image URL for a vehicle
 * @param vehicleId The vehicle ID
 * @param imageKey The image key/type 
 * @param url The URL to store
 */
export const persistImageUrl = (vehicleId: string, imageKey: string, url: string): void => {
  if (!isValidImageUrl(url)) return;
  
  try {
    localStorage.setItem(`vehicle_image_${vehicleId}_${imageKey}`, url);
  } catch (e) {
    console.warn('Error storing URL in localStorage:', e);
  }
};

/**
 * Determine if we need to fetch images from backend
 * @param vehicleId The vehicle ID
 * @param requiredKeys Array of required image keys
 * @returns Boolean indicating if fetching is needed
 */
export const shouldFetchImagesFromBackend = (vehicleId: string, requiredKeys: string[] = ['front']): boolean => {
  // Always fetch from backend if this function is called
  return true;
};

/**
 * Convert a file to base64 string
 * @param file The file to convert
 * @returns Promise that resolves to the base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Safely store a base64 image in localStorage with compression if needed
 * @param storageKey The key to use in localStorage
 * @param imageKey The key for this particular image
 * @param base64 The base64 string to store
 * @param maxSizeMB Maximum size in MB
 * @returns Promise that resolves when storage is complete
 */
export const safeStoreBase64Image = async (
  storageKey: string,
  imageKey: string,
  base64: string,
  maxSizeMB: number = 1
): Promise<void> => {
  try {
    // Get existing images
    const storedImagesJson = localStorage.getItem(storageKey) || '{}';
    const storedImages = JSON.parse(storedImagesJson);
    
    // Store the new/updated image
    storedImages[imageKey] = base64;
    
    // Check size before saving
    const jsonString = JSON.stringify(storedImages);
    const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
    
    if (sizeInMB > maxSizeMB) {
      console.warn(`Image storage exceeds ${maxSizeMB}MB limit. Not storing in localStorage.`);
      return;
    }
    
    // Save to localStorage
    localStorage.setItem(storageKey, jsonString);
  } catch (error) {
    console.error('Error storing image in localStorage:', error);
    // Silently fail - localStorage errors shouldn't block the app
  }
};

/**
 * Check if a string is a base64 encoded image
 * @param str String to check
 * @returns boolean indicating if the string is a base64 image
 */
export const isBase64Image = (str: string): boolean => {
  if (typeof str !== 'string') return false;
  return str.startsWith('data:image/') && str.includes('base64,');
};

/**
 * Sanitize image URLs for storage by replacing blob URLs with placeholders
 * @param urls Object containing image URLs
 * @returns Sanitized version of the URLs object
 */
export const sanitizeUrlsForStorage = (urls: Record<string, string>): Record<string, string> => {
  const sanitized: Record<string, string> = {};
  
  Object.entries(urls).forEach(([key, url]) => {
    // Replace blob URLs with a marker that indicates they were blob URLs
    if (url && url.startsWith('blob:')) {
      sanitized[key] = '[BLOB_URL]';
    } else {
      sanitized[key] = url;
    }
  });
  
  return sanitized;
};

/**
 * Synchronizes image storage between localStorage and sessionStorage for a vehicle
 * @param vehicleId The vehicle ID
 * @param photoUrls Optional photo URLs to sync
 */
export const syncImageStorageForVehicle = async (
  vehicleId: string,
  photoUrls?: Record<string, string>
): Promise<void> => {
  // If photoUrls aren't provided, try to read from localStorage or sessionStorage
  if (!photoUrls) {
    try {
      // Try to get from localStorage
      const localStorageKey = `vehicle_data_${vehicleId}`;
      const localData = localStorage.getItem(localStorageKey);
      if (localData) {
        const parsedData = JSON.parse(localData);
        photoUrls = extractPhotoUrls(parsedData);
      }
      
      // If still no photoUrls, try sessionStorage
      if (!photoUrls || Object.keys(photoUrls).length === 0) {
        const sessionStorageKey = `vehicle_summary_${vehicleId}`;
        const sessionData = sessionStorage.getItem(sessionStorageKey);
        if (sessionData) {
          const parsedData = JSON.parse(sessionData);
          photoUrls = extractPhotoUrls(parsedData);
        }
      }
      
      // If still no photoUrls, use empty object
      if (!photoUrls) {
        photoUrls = {};
      }
    } catch (e) {
      console.error('Error getting photo URLs for sync:', e);
      photoUrls = {};
    }
  }
  
  if (!vehicleId) return;
  
  try {
    // Store in localStorage for offline/fast access
    Object.entries(photoUrls).forEach(([key, url]) => {
      if (isValidImageUrl(url)) {
        persistImageUrl(vehicleId, key, url);
      }
    });
    
    // For future: here you could add logic to sync with Cloudinary
    // For example, you might want to upload any base64 images to Cloudinary
    
    console.log(`Image storage synchronized for vehicle ${vehicleId}`);
  } catch (error) {
    console.error('Error synchronizing image storage:', error);
  }
};

/**
 * Validate if a URL is a proper Cloudinary URL with version number
 * @param url The URL to validate
 * @returns boolean indicating if it's a valid Cloudinary URL
 */
export const isValidCloudinaryUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's a properly formatted Cloudinary URL with version number
  // Example: https://res.cloudinary.com/dz81bjuea/image/upload/v1747150610/vehicle_photos/back/hrj3dowlhp5biid3ardg.png
  return url.includes('cloudinary.com') && 
         url.includes('/upload/v') && 
         !url.includes('/v1/') && // avoid the common error format
         url.match(/\/v\d+\//) !== null; // ensure it has a numeric version
};

/**
 * Process an image URL to ensure it's properly formatted
 * @param url The original URL from API or other source
 * @returns A properly formatted URL or null
 */
export const processCloudinaryUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // If it's already a properly formatted Cloudinary URL, use it directly
  if (isValidCloudinaryUrl(url)) {
    return url;
  }
  
  // If it's a URL with hostname but not properly formatted, log for debugging
  if (url.includes('cloudinary.com')) {
    console.warn('Potentially malformed Cloudinary URL:', url);
  }
  
  // If it's a relative media URL, complete it
  if (url.startsWith('/media/')) {
    return `${API_CONFIG.MEDIA_URL}${url}`;
  }
  
  // Return the original URL - don't try to fix it
  // The backend should provide proper URLs
  return url;
};

/**
 * Get an image URL with guaranteed fallback
 * @param url The primary URL to try
 * @param fallbackUrl Optional specific fallback URL
 * @returns A URL that should work
 */
export const getImageUrlWithFallback = (
  url: string | null | undefined, 
  fallbackUrl?: string
): string => {
  // First process the URL to ensure it's valid
  const processedUrl = processCloudinaryUrl(url);
  
  // If processing succeeded, use it
  if (processedUrl) {
    return processedUrl;
  }
  
  // Use the provided fallback or a default placeholder
  return fallbackUrl || API_CONFIG.getCloudinaryPlaceholder();
};

/**
 * Store a valid Cloudinary URL in localStorage for future use
 * @param vehicleId The vehicle ID
 * @param imageType The image type (front, back, etc.)
 * @param url The URL to store
 */
export const storeValidCloudinaryUrl = (
  vehicleId: string, 
  imageType: string, 
  url: string
): void => {
  // Only store if it's a valid Cloudinary URL
  if (isValidCloudinaryUrl(url)) {
    try {
      localStorage.setItem(`vehicle_image_${vehicleId}_${imageType}`, url);
    } catch (e) {
      console.warn('Error storing URL in localStorage:', e);
    }
  }
};

/**
 * Retrieve a previously stored valid Cloudinary URL
 * @param vehicleId The vehicle ID
 * @param imageType The image type (front, back, etc.)
 * @returns The stored URL or null if not found
 */
export const getStoredCloudinaryUrl = (
  vehicleId: string, 
  imageType: string
): string | null => {
  try {
    const storedUrl = localStorage.getItem(`vehicle_image_${vehicleId}_${imageType}`);
    return isValidCloudinaryUrl(storedUrl) ? storedUrl : null;
  } catch (e) {
    console.warn('Error retrieving URL from localStorage:', e);
    return null;
  }
}; 