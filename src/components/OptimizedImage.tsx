import React, { useState } from 'react';
import { getCloudinaryUrl } from '../services/imageUtils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  placeholder?: boolean;
  quality?: number;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * OptimizedImage - A component for high-performance image delivery
 * Automatically uses Cloudinary for dynamic resizing, format conversion, and compression
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = true,
  quality = 80,
  loading = 'lazy',
  sizes = '100vw',
  objectFit = 'cover'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Determine if this is already a Cloudinary URL or needs conversion
  const isCloudinaryUrl = src?.includes('cloudinary.com');
  const isAssetUrl = src?.startsWith('/assets/');
  
  // Convert asset URLs to Cloudinary URLs with proper folder structure
  let optimizedSrc = src;
  
  if (isAssetUrl) {
    // Extract the filename from the asset path
    const assetName = src.split('/').pop()?.split('.')[0];
    // Use a dedicated folder for static assets in Cloudinary
    const cloudinaryPath = `static_assets/${assetName}`;
    optimizedSrc = getCloudinaryUrl(cloudinaryPath, { width, height, quality });
  } else if (!isCloudinaryUrl && src) {
    // For other URLs that aren't already Cloudinary, apply transformations
    optimizedSrc = getCloudinaryUrl(src, { width, height, quality });
  }

  // Calculate aspect ratio for proper scaling
  const aspectRatio = width && height ? width / height : undefined;
  
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ 
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: aspectRatio ? `${aspectRatio}` : undefined
      }}
    >
      {/* Placeholder during loading */}
      {placeholder && !isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ borderRadius: '0.375rem' }}
        />
      )}
      
      {/* Fallback for errors */}
      {hasError ? (
        <div className="absolute inset-0 bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-500">
          <span>{alt || 'Image not available'}</span>
        </div>
      ) : (
        /* The actual optimized image */
        <img
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          sizes={sizes}
          className={`w-full h-full transition-opacity duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
          style={{ objectFit }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};

export default OptimizedImage; 