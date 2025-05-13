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

// Map of local asset names to Cloudinary public IDs
const ASSET_TO_CLOUDINARY_MAP: Record<string, string> = {
  'logo.png': 'logo_jlugzw',
  'bikeExpert.jpg': 'bikeExpert_qt2sfa',
  'founder.jpg': 'founder_vpnyov'
};

// Cloudinary version number for these uploads
const CLOUDINARY_VERSION = 'v1747031052';

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
    const assetPath = src.split('/').pop() || '';
    
    // Get Cloudinary ID from our mapping or use a fallback
    const cloudinaryId = ASSET_TO_CLOUDINARY_MAP[assetPath] || assetPath.split('.')[0];
    
    // Determine file extension - some Cloudinary IDs already have it embedded
    const hasExtension = cloudinaryId.includes('_');
    const fileExtension = hasExtension ? 'jpg' : (assetPath.includes('.') ? assetPath.split('.').pop() : 'jpg');
    
    // Build the optimized source URL using direct Cloudinary URL format
    optimizedSrc = `https://res.cloudinary.com/dz81bjuea/image/upload/${CLOUDINARY_VERSION}/${cloudinaryId}${!hasExtension ? `.${fileExtension}` : ''}`;
    
    // If dimensions or quality are provided, use Cloudinary transformations
    if (width || height || quality) {
      const transformations = [];
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      if (quality) transformations.push(`q_${quality}`);
      transformations.push('f_auto'); // Always use automatic format
      
      optimizedSrc = `https://res.cloudinary.com/dz81bjuea/image/upload/${transformations.join(',')}/${CLOUDINARY_VERSION}/${cloudinaryId}${!hasExtension ? `.${fileExtension}` : ''}`;
    }
    
    // Add debug log to help diagnose
    console.debug('Asset URL conversion:', { 
      original: src, 
      cloudinaryId,
      optimizedSrc 
    });
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
          onError={(e) => {
            console.error(`Image load error for: ${optimizedSrc}`, e);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
};

export default OptimizedImage; 