import React, { useState, useEffect, useRef, memo } from 'react';
import { Bike, ImageOff } from 'lucide-react';
import { isValidImageUrl, getBestImageSource, getCloudinaryUrl } from '../services/imageUtils';
import marketplaceService from '../services/marketplaceService';
import { useLocation } from 'react-router-dom';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  fallbackSrc?: string;
  placeholderSrc?: string;
  className?: string;
  containerClassName?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  threshold?: number;
  vehicleId?: string | number | null;
  sessionStorageKey?: string | null;
  imageKey?: string | null;
  fetchFromBackend?: boolean;
  fallbackComponent?: React.ReactNode;
}

// Global blob URL registry to track valid blob URLs across component instances
const validBlobUrls = new Set<string>();

/**
 * SafeImage - A component for safely loading images with fallbacks and optimizations
 * 
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Placeholder display during loading
 * - Fallback image on error
 * - Progressive enhancement when available
 * - Uses Cloudinary for optimized delivery
 */
const SafeImage: React.FC<SafeImageProps> = memo(({
  src,
  alt,
  fallbackSrc = 'https://placehold.co/400x300?text=Image+Not+Available',
  placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==',
  className = '',
  containerClassName = '',
  width,
  height,
  style = {},
  onLoad,
  onError,
  lazy = true,
  threshold = 0.1,
  vehicleId = null,
  sessionStorageKey = null,
  imageKey = null,
  fetchFromBackend = false,
  fallbackComponent
}) => {
  // Keep track of the current image state
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(placeholderSrc || '');
  
  // Refs for intersection observer and image element
  const imageRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
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
  
  // Helper to check if a string is a base64 data URL
  const isBase64Image = (str: string): boolean => {
    return typeof str === 'string' && str.startsWith('data:image/');
  };
  
  // Find the best non-blob source for an image
  const findBestNonBlobSource = async (): Promise<string | null> => {
    // If we have a vehicleId and imageKey, use the CDN approach
    if (derivedVehicleId && imageKey) {
      try {
        const cdnSource = getBestImageSource(
          typeof derivedVehicleId === 'number' ? String(derivedVehicleId) : derivedVehicleId,
          imageKey
        );
        
        if (cdnSource) {
          console.log(`Using CDN source for ${imageKey}`);
          return cdnSource;
        }
      } catch (e) {
        console.error('Error getting CDN source:', e);
      }
    }
    
    // Try to get from sessionStorage for backwards compatibility
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
        }
      } catch (e) {
        console.error('Error checking sessionStorage:', e);
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
  
  // If we have a URL that might be a blob, try to find a better source
  useEffect(() => {
    const fetchBetterSource = async () => {
      // Only try to find a better source if the current one is a blob URL or missing
      if (src && !src.startsWith('blob:')) {
        // Use the provided source directly
        setImageSrc(src);
        return;
      }
      
      // Try to find a non-blob source
      const betterSource = await findBestNonBlobSource();
      if (betterSource) {
        setImageSrc(betterSource);
      } else {
        // If we couldn't find a better source, use the original or fallback
        setImageSrc(src || fallbackSrc);
      }
    };
    
    fetchBetterSource();
  }, [src, vehicleId, imageKey]);
  
  // Clean up the current source
  const actualSrc = src || fallbackSrc;
  
  // Set up intersection observer for lazy loading
  useEffect(() => {
    // If not using lazy loading, or no image ref, skip
    if (!lazy || !imageRef.current) {
      return;
    }
    
    // Disconnect any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Create new intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When the image enters the viewport
          if (entry.isIntersecting) {
            // Image is already set by the fetchBetterSource useEffect
            // Stop observing after loading starts
            observer.disconnect();
            observerRef.current = null;
          }
        });
      },
      { threshold, rootMargin: '50px' }
    );
    
    // Start observing the image element
    observer.observe(imageRef.current);
    observerRef.current = observer;
    
    // Clean up observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, threshold]);
  
  // Handle image loading
  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };
  
  // Handle image error
  const handleError = () => {
    setError(true);
    if (!fallbackComponent) {
      setImageSrc(fallbackSrc);
    }
    onError?.();
  };
  
  // Combine passed style with default styles
  const imageStyle: React.CSSProperties = {
    ...style,
    transition: 'opacity 0.3s ease',
    opacity: loaded ? 1 : 0.5,
  };
  
  return (
    <div 
      className={`safe-image-container ${containerClassName}`}
      style={{ 
        position: 'relative',
        width: width || 'auto',
        height: height || 'auto',
        overflow: 'hidden'
      }}
    >
      {/* Render base placeholder if image hasn't loaded yet */}
      {!loaded && !error && (
        <div
          className="safe-image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="loading-spinner" style={{
            width: '30px',
            height: '30px',
            border: '3px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            borderTopColor: '#3498db',
            animation: 'spin 1s ease-in-out infinite'
          }}></div>
          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}
      
      {/* Show fallbackComponent when provided and there's an error */}
      {error && fallbackComponent ? (
        fallbackComponent
      ) : (
        /* The actual image element */
        <img
          ref={imageRef}
          src={imageSrc}
          alt={alt}
          className={`safe-image ${className} ${error ? 'safe-image-error' : ''}`}
          width={width}
          height={height}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? "lazy" : "eager"}
        />
      )}
    </div>
  );
});

SafeImage.displayName = 'SafeImage';

export default SafeImage; 