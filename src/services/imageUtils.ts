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
 * Generate a properly formatted Cloudinary URL
 * @param path The image path or file name
 * @param options Options for image transformations
 * @returns A properly formatted Cloudinary URL
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
  } = {}
): string => {
  try {
    // Get the cloud name from environment variables
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dz81bjuea';
    
    // Extract the filename from the path if it's a full path
    let filename = path;
    if (path.includes('/')) {
      const parts = path.split('/');
      filename = parts[parts.length - 1];
    }
    
    // Clean the filename to be Cloudinary-friendly
    const safeFilename = encodeURIComponent(filename).replace(/%20/g, '_');
    
    // Determine folder structure - use "vehicle_photos" as the base folder
    const folder = path.includes('vehicle_photos') ? 'vehicle_photos' : 
                   path.includes('profile') ? 'profile_images' : 'uploads';
    
    // Build transformation parameters
    const transformations = [];
    
    if (options.width) {
      transformations.push(`w_${options.width}`);
    }
    
    if (options.height) {
      transformations.push(`h_${options.height}`);
    }
    
    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }
    
    if (options.format) {
      transformations.push(`f_${options.format}`);
    }
    
    if (options.crop) {
      transformations.push(`c_${options.crop}`);
    }
    
    // Build the URL
    // Format: https://res.cloudinary.com/CLOUD_NAME/image/upload/[version]/[transformations]/[folder]/[filename]
    let url = `https://res.cloudinary.com/${cloudName}/image/upload`;
    
    // Add version if specified (should come right after /upload/)
    if (options.version) {
      url += `/${options.version}`;
    }
    
    // Add transformations if any
    if (transformations.length > 0) {
      url += `/${transformations.join(',')}`;
    }
    
    // Add the folder and filename
    url += `/${folder}/${safeFilename}`;
    
    return url;
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