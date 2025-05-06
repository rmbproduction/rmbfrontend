import React, { useState, useEffect, useRef } from 'react';
import { Bike, ImageOff } from 'lucide-react';
import { isBase64Image, isValidImageUrl, getBestImageSource, getImageWithFallback } from '../services/imageUtils';
import marketplaceService from '../services/marketplaceService';
import { useLocation } from 'react-router-dom';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackComponent?: React.ReactNode;
  showLoadingIndicator?: boolean;
  fallbackSrc?: string | null;
  sessionStorageKey?: string;
  imageKey?: string;
  fetchFromBackend?: boolean;
  vehicleId?: string;
  onError?: () => void;
  onLoad?: () => void;
}

// Global blob URL registry to track valid blob URLs across component instances
const validBlobUrls = new Set<string>();

/**
 * A component that safely renders images with error handling, loading states, and fallbacks
 * Enhanced to handle blob URLs and provide proper fallbacks from session/localStorage
 * Can also fetch from backend API when necessary
 */
const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackComponent,
  showLoadingIndicator = true,
  fallbackSrc = null,
  sessionStorageKey = null,
  imageKey = null,
  fetchFromBackend = true,
  vehicleId = null,
  onError,
  onLoad,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState<string | null | undefined>(null);
  const [fetchingFromBackend, setFetchingFromBackend] = useState(false);
  
  // Use location to detect if we're on the email verification page
  const location = useLocation();
  const isEmailVerificationPage = location.pathname.includes('/verify-email');
  
  // Keep track of blob URLs that need to be revoked on unmount
  const blobUrlRef = useRef<string | null>(null);
  // Keep track of the previous blob URL to prevent revoking active ones
  const prevBlobUrlRef = useRef<string | null>(null);
  
  // Validate if a blob URL is likely to be valid
  const isBlobUrlValid = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string' || !url.startsWith('blob:')) return false;
    
    // If we're on email verification page, never use blob URLs
    if (isEmailVerificationPage) return false;
    
    // Check our registry of known valid blob URLs
    return validBlobUrls.has(url);
  };

  // Safely add a valid blob URL to our registry
  const registerValidBlobUrl = (url: string | null | undefined) => {
    if (url && typeof url === 'string' && url.startsWith('blob:') && !isEmailVerificationPage) {
      validBlobUrls.add(url);
    }
  };
  
  // Revoke a specific blob URL safely
  const revokeBlobUrl = (urlToRevoke: string | null) => {
    if (urlToRevoke && typeof urlToRevoke === 'string' && urlToRevoke.startsWith('blob:')) {
      try {
        // Only revoke if it's not the current URL being used
        if (urlToRevoke !== imageSrc) {
          console.log('Revoking blob URL:', urlToRevoke);
          URL.revokeObjectURL(urlToRevoke);
          // Remove from our registry
          validBlobUrls.delete(urlToRevoke);
        }
      } catch (err) {
        console.warn('Error revoking blob URL:', err);
        // Remove from registry even if revocation fails
        validBlobUrls.delete(urlToRevoke);
      }
    }
  };
  
  // Find the best non-blob source for an image
  const findBestNonBlobSource = async (): Promise<string | null> => {
    // Try to get from sessionStorage first
    if (sessionStorageKey && imageKey) {
      try {
        const sessionData = sessionStorage.getItem(sessionStorageKey);
        if (sessionData) {
          const parsedData = JSON.parse(sessionData);
          
          // Try photo_urls
          if (parsedData.photo_urls && parsedData.photo_urls[imageKey]) {
            const url = parsedData.photo_urls[imageKey];
            if (isValidImageUrl(url) && !url.startsWith('blob:')) {
              console.log(`Found non-blob URL in sessionStorage for ${imageKey}`);
              return url;
            }
          }
          
          // Try base64 images
          if (parsedData.base64_photos && parsedData.base64_photos[imageKey]) {
            const base64 = parsedData.base64_photos[imageKey];
            if (isBase64Image(base64)) {
              console.log(`Found base64 image in sessionStorage for ${imageKey}`);
              return base64;
            }
          }
        }
      } catch (e) {
        console.error('Error checking sessionStorage:', e);
      }
    }
    
    // Try localStorage as fallback
    if (imageKey) {
      try {
        const localData = localStorage.getItem('sell_vehicle_photos_base64');
        if (localData) {
          const parsedData = JSON.parse(localData);
          if (parsedData[imageKey] && isBase64Image(parsedData[imageKey])) {
            console.log(`Found base64 image in localStorage for ${imageKey}`);
            return parsedData[imageKey];
          }
        }
      } catch (e) {
        console.error('Error checking localStorage:', e);
      }
    }
    
    // If all else fails and we can fetch from backend, try that
    if (fetchFromBackend && derivedVehicleId && imageKey) {
      try {
        const apiSource = await getImageWithFallback(derivedVehicleId, imageKey, marketplaceService);
        if (apiSource && !apiSource.startsWith('blob:')) {
          console.log(`Found image from API for ${imageKey}`);
          return apiSource;
        }
      } catch (e) {
        console.error('Error fetching from API:', e);
      }
    }
    
    // If we have a fallback source and it's not a blob, use it
    if (fallbackSrc && isValidImageUrl(fallbackSrc) && !fallbackSrc.startsWith('blob:')) {
      return fallbackSrc;
    }
    
    return null;
  };
  
  // Derive vehicleId from sessionStorageKey if not provided directly
  const derivedVehicleId = vehicleId || (sessionStorageKey ? sessionStorageKey.replace('vehicle_summary_', '') : null);
  
  // Handle blob URLs and find the best source when src changes
  useEffect(() => {
    // Store the current blob URL before changing, so we can revoke it later
    if (imageSrc && imageSrc.startsWith('blob:')) {
      prevBlobUrlRef.current = imageSrc;
    }
    
    // Process the new source
    const processSource = async () => {
      // Check if the new source is a blob URL
      const isBlobUrl = src && typeof src === 'string' && src.startsWith('blob:');
      
      // If we're on verification page or the source is a blob URL, always look for alternatives
      if (isEmailVerificationPage || isBlobUrl) {
        // If on email verification page, never use blob URLs
        if (isEmailVerificationPage && isBlobUrl) {
          console.log(`On email verification page - not using blob URL: ${src}`);
          
          // Look for a non-blob alternative
          const betterSource = await findBestNonBlobSource();
          
          if (betterSource) {
            console.log('Found non-blob source for verification page, using that instead');
            setImageSrc(betterSource);
            return;
          }
          
          // If no alternative found, show fallback component
          setHasError(true);
          setIsLoading(false);
          return;
        }
        
        // For non-verification pages with blob URLs, check validity
        if (isBlobUrl && !isBlobUrlValid(src)) {
          console.log(`Blob URL ${src} might be invalid, looking for alternatives`);
          
          // Look for a better non-blob source immediately
          const betterSource = await findBestNonBlobSource();
          if (betterSource) {
            console.log('Found better non-blob source, using that instead');
            setImageSrc(betterSource);
            return;
          }
        } else if (isBlobUrl) {
          console.log(`Blob URL ${src} is registered as valid, using it`);
          
          // Add reference for blob URL
          blobUrlRef.current = src;
        }
      }
      
      // If we get here, either it's not a blob URL or we couldn't find a better alternative
      // or we're not on the verification page
      setImageSrc(src);
      setHasError(false);
      setIsLoading(true);
    };
    
    processSource();
  }, [src, sessionStorageKey, imageKey, fetchFromBackend, derivedVehicleId, fallbackSrc, isEmailVerificationPage]);
  
  // Revoke previous blob URL after the image is loaded or on error
  useEffect(() => {
    if (!isLoading) {
      // If image loaded successfully and it's a blob URL, add to registry of valid URLs
      if (!hasError && imageSrc && imageSrc.startsWith('blob:') && !isEmailVerificationPage) {
        registerValidBlobUrl(imageSrc);
      }
      
      // Safe to revoke the previous blob URL now that new image is loaded or failed
      if (prevBlobUrlRef.current && prevBlobUrlRef.current !== imageSrc) {
        revokeBlobUrl(prevBlobUrlRef.current);
        prevBlobUrlRef.current = null;
      }
    }
  }, [isLoading, hasError, imageSrc, isEmailVerificationPage]);
  
  // Clean up any blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke both current and previous blob URLs
      if (blobUrlRef.current) {
        revokeBlobUrl(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      if (prevBlobUrlRef.current) {
        revokeBlobUrl(prevBlobUrlRef.current);
        prevBlobUrlRef.current = null;
      }
    };
  }, []);
  
  // Handle errors by finding alternative sources
  useEffect(() => {
    if (hasError) {
      const findAlternativeSource = async () => {
        console.log(`Looking for alternative to failed image: ${imageSrc}`);
        
        // If current source is a blob URL, remove it from registry since it failed
        if (imageSrc && imageSrc.startsWith('blob:')) {
          validBlobUrls.delete(imageSrc as string);
        }
        
        // Try to find a non-blob alternative
        const alternativeSource = await findBestNonBlobSource();
        
        if (alternativeSource && alternativeSource !== imageSrc) {
          console.log('Found alternative source after error', alternativeSource);
          setImageSrc(alternativeSource);
          setHasError(false);
          setIsLoading(true);
        } else {
          console.log('Could not find alternative source');
        }
      };
      
      findAlternativeSource();
    }
  }, [hasError, imageSrc, sessionStorageKey, imageKey, derivedVehicleId, fetchFromBackend, fallbackSrc]);
  
  // If no source is provided, show fallback
  if (!imageSrc) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 ${className}`}>
        {fallbackComponent || <Bike className="h-12 w-12 text-gray-400" />}
      </div>
    );
  }
  
  const handleError = () => {
    console.error(`Image failed to load: ${imageSrc}`);
    setHasError(true);
    setIsLoading(false);
    if (onError) onError();
  };
  
  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };
  
  return (
    <>
      {!hasError ? (
        <div className={`relative ${className}`}>
          <img 
            key={imageSrc} // Add key to force re-mount when source changes
            src={imageSrc} 
            alt={alt} 
            className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onError={handleError}
            onLoad={handleLoad}
            loading="lazy"
            crossOrigin="anonymous" // Enable cross-origin attribute
          />
          {isLoading && showLoadingIndicator && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="w-6 h-6 border-4 border-t-[#FF5733] border-b-[#FF5733] rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center bg-gray-100 ${className}`}>
          {fallbackComponent || (
            <>
              <ImageOff className="h-8 w-8 text-gray-400 mb-1" />
              <p className="text-xs text-gray-500 text-center px-2">
                {fetchingFromBackend 
                  ? "Loading image..." 
                  : "Image unavailable"}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default SafeImage; 