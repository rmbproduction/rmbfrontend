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
 * Get the optimized Cloudinary URL for an image with transformations
 * @param path The path of the image on Cloudinary
 * @param options Transformation options
 * @returns Cloudinary URL with transformations
 */
export const getCloudinaryUrl = (
  path: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    crop?: string;
  } = {}
): string => {
  // Remove any leading slashes
  const cleanPath = path.replace(/^\//, '');
  
  // Build transformation string
  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  
  // Always use f_auto for automatic format selection (WebP when supported)
  transformations.push('f_auto');
  
  // Add q_auto for automatic quality optimization if quality not specified
  if (!options.quality) transformations.push('q_auto');
  
  // Construct the URL
  const transformationString = transformations.length > 0 
    ? transformations.join(',') + '/' 
    : '';
  
  return `${CLOUDINARY_URL}/${transformationString}${cleanPath}`;
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