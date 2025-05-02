import React, { useState, useEffect } from 'react';
import { Bike, ImageOff } from 'lucide-react';
import { isBase64Image, isValidImageUrl, getBestImageSource, getImageWithFallback } from '../services/imageUtils';
import marketplaceService from '../services/marketplaceService';

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
  
  // Derive vehicleId from sessionStorageKey if not provided directly
  const derivedVehicleId = vehicleId || (sessionStorageKey ? sessionStorageKey.replace('vehicle_summary_', '') : null);
  
  // Preemptively handle blob URLs and find the best source on mount and when src changes
  useEffect(() => {
    // Check if the source is a blob URL - these are temporary and might be invalid
    const isBlobUrl = src && typeof src === 'string' && src.startsWith('blob:');
    
    // If it's a blob URL and we have session storage info, try to get a better source first
    if (isBlobUrl && sessionStorageKey && imageKey) {
      // Try to get the best available source
      const bestSource = getBestImageSource(sessionStorageKey.replace('vehicle_summary_', ''), imageKey);
      
      if (bestSource && bestSource !== src) {
        console.log(`Using better source instead of blob URL for ${imageKey}`);
        setImageSrc(bestSource);
        return;
      }
    }
    
    // If we have a regular URL or no better source was found, use the provided src
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src, sessionStorageKey, imageKey]);
  
  // Fetch from backend API when necessary
  useEffect(() => {
    // Only proceed if we're allowed to fetch from backend and we have necessary info
    if (fetchFromBackend && derivedVehicleId && imageKey) {
      const isBlobOrMissing = !imageSrc || 
        (typeof imageSrc === 'string' && imageSrc.startsWith('blob:'));
      
      // Only fetch if we have an error or the current source is a blob URL
      if ((hasError || isBlobOrMissing) && !fetchingFromBackend) {
        setFetchingFromBackend(true);
        
        // Use our comprehensive function to fetch from all possible sources including API
        getImageWithFallback(derivedVehicleId, imageKey, marketplaceService)
          .then(newSource => {
            if (newSource && newSource !== imageSrc) {
              console.log(`Found image source from backend for ${imageKey}`);
              setImageSrc(newSource);
              setHasError(false);
              setIsLoading(true);
            }
          })
          .catch(error => {
            console.error(`Error fetching image from backend for ${imageKey}:`, error);
          })
          .finally(() => {
            setFetchingFromBackend(false);
          });
      }
    }
  }, [fetchFromBackend, derivedVehicleId, imageKey, hasError, imageSrc, fetchingFromBackend]);
  
  // Attempt to retrieve alternative sources if the primary source fails
  useEffect(() => {
    if (hasError && imageSrc) {
      // If we have a direct fallback source, use it
      if (fallbackSrc && isValidImageUrl(fallbackSrc)) {
        console.log('Using fallback image source');
        setImageSrc(fallbackSrc);
        setHasError(false);
        setIsLoading(true);
        return;
      }
      
      // Check if we should look for alternatives in sessionStorage
      if (sessionStorageKey && imageKey) {
        try {
          const storedData = sessionStorage.getItem(sessionStorageKey);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            
            // Look for base64 data
            if (parsedData.base64_photos && parsedData.base64_photos[imageKey]) {
              const base64Image = parsedData.base64_photos[imageKey];
              if (isBase64Image(base64Image)) {
                console.log(`Found base64 image for ${imageKey} in sessionStorage`);
                setImageSrc(base64Image);
                setHasError(false);
                setIsLoading(true);
                return;
              }
            }
            
            // Look for other URL sources
            if (parsedData.photo_urls && parsedData.photo_urls[imageKey]) {
              const photoUrl = parsedData.photo_urls[imageKey];
              if (isValidImageUrl(photoUrl) && photoUrl !== imageSrc) {
                console.log(`Found alternative URL for ${imageKey} in sessionStorage`);
                setImageSrc(photoUrl);
                setHasError(false);
                setIsLoading(true);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error retrieving alternative image from sessionStorage:', error);
        }
      }
      
      // As a last resort, check localStorage for base64 data
      if (imageKey) {
        try {
          const localData = localStorage.getItem('sell_vehicle_photos_base64');
          if (localData) {
            const parsedLocalData = JSON.parse(localData);
            if (parsedLocalData[imageKey]) {
              const base64Image = parsedLocalData[imageKey];
              if (isBase64Image(base64Image)) {
                console.log(`Found base64 image for ${imageKey} in localStorage`);
                setImageSrc(base64Image);
                setHasError(false);
                setIsLoading(true);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error retrieving image from localStorage:', error);
        }
      }
    }
  }, [hasError, imageSrc, fallbackSrc, sessionStorageKey, imageKey]);
  
  // Check if the src is a blob URL that might be invalid
  const isBlobUrl = imageSrc && typeof imageSrc === 'string' && imageSrc.startsWith('blob:');
  
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
            src={imageSrc} 
            alt={alt} 
            className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onError={handleError}
            onLoad={handleLoad}
            loading="lazy"
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
                  : (isBlobUrl ? "Image no longer available" : "Failed to load image")}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default SafeImage; 