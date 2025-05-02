import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { API_CONFIG } from '../config/api.config';

interface VehicleImageProps {
  vehicle: any;
  alt?: string;
  className?: string;
  imageType?: 'main' | 'thumbnail' | 'gallery';
  galleryIndex?: number;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const VehicleImage: React.FC<VehicleImageProps> = ({
  vehicle,
  alt = 'Vehicle',
  className = '',
  imageType = 'main',
  galleryIndex = 0,
  size = 'md'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determine classes based on size
  const sizeClasses = {
    sm: 'h-20 w-20 object-cover',
    md: 'h-44 w-full object-cover',
    lg: 'h-64 w-full object-cover',
    full: 'w-full h-full object-cover',
  };

  const getImageUrl = () => {
    if (!vehicle) return API_CONFIG.getDefaultVehicleImage();

    try {
      // First check if we already have a processed imageUrl
      if (vehicle.imageUrl) {
        return vehicle.imageUrl;
      }
      
      // Then continue with existing logic
      // Handle different image types
      if (imageType === 'main' && vehicle.image_urls?.main) {
        const mainUrl = vehicle.image_urls.main;
        return mainUrl.startsWith('http') ? mainUrl : API_CONFIG.getMediaUrl(mainUrl);
      }

      if (imageType === 'thumbnail' && vehicle.image_urls?.thumbnail) {
        const thumbUrl = vehicle.image_urls.thumbnail;
        return thumbUrl.startsWith('http') ? thumbUrl : API_CONFIG.getMediaUrl(thumbUrl);
      }

      if (imageType === 'gallery' && vehicle.image_urls?.gallery && vehicle.image_urls.gallery.length > galleryIndex) {
        const galleryUrl = vehicle.image_urls.gallery[galleryIndex];
        return galleryUrl.startsWith('http') ? galleryUrl : API_CONFIG.getMediaUrl(galleryUrl);
      }

      // Fallback options in order of preference
      if (vehicle.photo_front) {
        return API_CONFIG.getMediaUrl(vehicle.photo_front);
      }

      if (vehicle.image_url) {
        return vehicle.image_url.startsWith('http') 
          ? vehicle.image_url 
          : API_CONFIG.getMediaUrl(vehicle.image_url);
      }

      if (vehicle.image) {
        return vehicle.image.startsWith('http') 
          ? vehicle.image 
          : API_CONFIG.getMediaUrl(vehicle.image);
      }

      // Final fallback to placeholder
      return API_CONFIG.getDefaultVehicleImage();
    } catch (error) {
      console.error('Error resolving image URL:', error);
      return API_CONFIG.getDefaultVehicleImage();
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse bg-gray-200 h-full w-full"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="flex items-center justify-center bg-gray-100 h-full w-full">
          <div className="text-center p-4">
            <ImageOff className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Image not available</p>
          </div>
        </div>
      ) : (
        <img
          src={getImageUrl()}
          alt={alt}
          className={`${sizeClasses[size]} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
};

export default VehicleImage; 