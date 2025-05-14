/**
 * Image optimization utilities to improve rendering and loading performance
 */

import { API_CONFIG } from '../config/api.config';

/**
 * Preload critical images in the background
 * @param urls Array of image URLs to preload
 */
export const preloadImages = (urls: string[]): void => {
  urls.forEach(url => {
    if (!url) return;
    
    // Create new image element to load in background
    const img = new Image();
    
    // Add CORS attributes if needed
    if (url.includes('cloudinary.com')) {
      img.crossOrigin = 'anonymous';
    }
    
    // Set source after configuring
    img.src = url;
  });
};

/**
 * Get optimized image source with dimensions for Cloudinary
 * @param url Original Cloudinary URL
 * @param width Desired width
 * @param height Desired height
 * @param quality Image quality (1-100)
 * @returns Optimized Cloudinary URL
 */
export const getOptimizedCloudinaryUrl = (
  url: string,
  width: number = 800,
  height: number = 600,
  quality: number = 80
): string => {
  // Check if it's a Cloudinary URL
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }
  
  try {
    // Parse the URL to extract components
    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) return url;
    
    // Format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/path/to/image.jpg
    const baseUrl = urlParts[0] + '/upload/';
    
    // Add transformation parameters 
    // c_fill = crop and fill to exact dimensions
    // g_auto = automatic gravity (focus on the important part of the image)
    // q_auto = automatic quality determination (or specify with q_80)
    // f_auto = automatic format selection based on browser
    const transformations = `c_fill,g_auto,w_${width},h_${height},q_${quality},f_auto/`;
    
    const pathPart = urlParts[1];
    
    // CASE 1: URLs with /v1/ format (API versioning)
    if (pathPart.startsWith('v1/')) {
      return `${baseUrl}${transformations}${pathPart}`;
    }
    
    // CASE 2: URLs with version numbers (v1234567890)
    const versionMatch = pathPart.match(/^(v\d+)(\/|$)/);
    if (versionMatch) {
      const version = versionMatch[1];
      const needsSlash = !pathPart.substring(version.length).startsWith('/') && pathPart.length > version.length;
      const remainingPath = pathPart.substring(version.length + (needsSlash ? 0 : 1));
      return `${baseUrl}${transformations}${version}/${remainingPath}`;
    }
    
    // CASE 3: Standard path without version
    return `${baseUrl}${transformations}${pathPart}`;
  } catch (error) {
    console.error('Error optimizing Cloudinary URL:', error);
    return url; // Return original URL if processing fails
  }
};

/**
 * Create a blur-up placeholder URL for Cloudinary images
 * @param url Original Cloudinary URL
 * @returns Low quality placeholder image URL
 */
export const getBlurPlaceholder = (url: string): string => {
  // Check if it's a valid Cloudinary URL
  if (!url || !url.includes('cloudinary.com')) {
    return API_CONFIG.getDefaultVehicleImage();
  }
  
  try {
    // Create a very low quality, blurred version for placeholder
    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) return API_CONFIG.getDefaultVehicleImage();
    
    const baseUrl = urlParts[0] + '/upload/';
    
    // w_100 = width 100px (very small)
    // q_10 = very low quality (10%)
    // e_blur:800 = heavy blur effect
    const transformations = 'w_100,q_10,e_blur:800/';
    
    const pathPart = urlParts[1];
    
    // CASE 1: URLs with /v1/ format (API versioning)
    if (pathPart.startsWith('v1/')) {
      return `${baseUrl}${transformations}${pathPart}`;
    }
    
    // CASE 2: URLs with version numbers (v1234567890)
    const versionMatch = pathPart.match(/^(v\d+)(\/|$)/);
    if (versionMatch) {
      const version = versionMatch[1];
      const needsSlash = !pathPart.substring(version.length).startsWith('/') && pathPart.length > version.length;
      const remainingPath = pathPart.substring(version.length + (needsSlash ? 0 : 1));
      return `${baseUrl}${transformations}${version}/${remainingPath}`;
    }
    
    // CASE 3: Standard path without version
    return `${baseUrl}${transformations}${pathPart}`;
  } catch (error) {
    console.error('Error creating blur placeholder:', error);
    return API_CONFIG.getDefaultVehicleImage();
  }
};

/**
 * Check if browser supports modern image formats
 * @returns Object indicating support for various formats
 */
export const checkBrowserImageSupport = (): Record<string, boolean> => {
  const support = {
    webp: false,
    avif: false
  };
  
  if (typeof document !== 'undefined') {
    // Check WebP support
    const webpCanvas = document.createElement('canvas');
    if (webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      support.webp = true;
    }
    
    // Try to check AVIF support (not fully reliable in all browsers)
    const img = new Image();
    img.onload = () => {
      support.avif = img.width > 0 && img.height > 0;
    };
    img.onerror = () => {
      support.avif = false;
    };
    // Base64 representation of a 1x1 AVIF image
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  }
  
  return support;
}; 