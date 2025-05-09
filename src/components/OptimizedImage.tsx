import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api.config';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    const processImage = async () => {
      try {
        // Check if the image is already a full URL
        if (src.startsWith('http') || src.startsWith('data:')) {
          setImageSrc(src);
          return;
        }

        // Check if the image is a relative path
        if (src.startsWith('/')) {
          setImageSrc(API_CONFIG.getMediaUrl(src));
          return;
        }

        // Default case: use the API config to get the full URL
        setImageSrc(API_CONFIG.getMediaUrl(src));
      } catch (err) {
        console.error('Error processing image:', err);
        setError(true);
      }
    };

    processImage();
  }, [src]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center p-4">
          <span className="text-gray-400">Image not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}; 