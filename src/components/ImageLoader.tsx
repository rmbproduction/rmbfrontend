import { useState, useEffect } from 'react';
import { getCloudinaryUrl } from '../services/imageUtils';

interface ImageLoaderProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderClassName?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  sizes?: string;
}

/**
 * Optimized image loader component that uses Cloudinary and implements lazy loading
 */
const ImageLoader = ({
  src,
  alt,
  width = 800,
  height,
  className = '',
  placeholderClassName = '',
  quality = 80,
  loading = 'lazy',
  sizes = '(max-width: 768px) 100vw, 800px'
}: ImageLoaderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Determine if this is already a Cloudinary URL or needs to be transformed
  const isCloudinaryUrl = src?.includes('cloudinary.com') || src?.includes('res.cloudinary.com');
  
  // Generate optimized image URL
  const imageUrl = isCloudinaryUrl
    ? src // Already a Cloudinary URL
    : src?.startsWith('http') || src?.startsWith('/') 
      ? src // External URL or static asset
      : getCloudinaryUrl(src, { width, height, quality });
  
  // Placeholder - can be customized further
  const placeholder = (
    <div 
      className={`bg-gray-200 animate-pulse ${placeholderClassName}`} 
      style={{ 
        width: width ? `${width}px` : '100%', 
        height: height ? `${height}px` : '16rem',
        borderRadius: '0.375rem'  
      }}
    />
  );
  
  useEffect(() => {
    // Reset states when src changes
    setIsLoading(true);
    setError(false);
  }, [src]);
  
  if (!src) {
    return placeholder;
  }
  
  return (
    <>
      {isLoading && placeholder}
      
      {error ? (
        <div 
          className={`bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-500 ${className}`}
          style={{ 
            width: width ? `${width}px` : '100%', 
            height: height ? `${height}px` : '16rem' 
          }}
        >
          <span>Image not available</span>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${isLoading ? 'hidden' : 'block'}`}
          loading={loading}
          sizes={sizes}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
        />
      )}
    </>
  );
};

export default ImageLoader; 