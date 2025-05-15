import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api.config';

interface SuggestedVehicleItemProps {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  kmsDriven: number;
  imageUrl: string;
}

const SuggestedVehicleItem: React.FC<SuggestedVehicleItemProps> = ({
  id,
  brand,
  model,
  year,
  price,
  kmsDriven,
  imageUrl
}) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState<string>('');
  const [isAvatarImage, setIsAvatarImage] = useState(false);

  // Process and validate image URL
  useEffect(() => {
    try {
      // Check if this is already a UI Avatars URL
      if (imageUrl && imageUrl.includes('ui-avatars.com')) {
        setFinalImageUrl(imageUrl);
        setIsAvatarImage(true);
        setImageLoaded(true); // Consider avatar images pre-loaded
        return;
      }
      
      // First try with the original URL
      let processedUrl = imageUrl;
      
      // Fix common issues with image URLs
      if (processedUrl && !processedUrl.startsWith('http') && !processedUrl.startsWith('data:')) {
        // Handle relative URLs
        processedUrl = API_CONFIG.getMediaUrl(processedUrl);
      }
      
      // If the URL is empty or invalid, use an avatar image with initials
      if (!processedUrl || processedUrl === 'null' || processedUrl === 'undefined') {
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.charAt(0))}+${encodeURIComponent(model.charAt(0))}&background=FF5733&color=fff&size=256`;
        setFinalImageUrl(avatarUrl);
        setIsAvatarImage(true);
        setImageLoaded(true); // Consider avatar images pre-loaded
        return;
      }
      
      // Set the validated URL
      setFinalImageUrl(processedUrl);
      
      // Preload the image
      const img = new Image();
      img.src = processedUrl;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => {
        setImageError(true);
        // Fall back to avatar image on error
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.charAt(0))}+${encodeURIComponent(model.charAt(0))}&background=FF5733&color=fff&size=256`;
        setFinalImageUrl(avatarUrl);
        setIsAvatarImage(true);
        setImageLoaded(true);
      };
    } catch (e) {
      console.error('Error processing image URL:', e);
      setImageError(true);
    }
    
    // Clean up function to cancel any pending image loads
    return () => {
      // Create a clean reference so we don't create a closure on too many objects
      const cleanupImg = new Image();
      cleanupImg.onload = null;
      cleanupImg.onerror = null;
    };
  }, [imageUrl, brand, model]);

  const handleClick = () => {
    navigate(`/vehicles/${id}`);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    // Don't try to reload avatar images
    if (isAvatarImage) return;
    
    // If we already tried a fallback and it failed, create an avatar image
    if (imageError) {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.charAt(0))}+${encodeURIComponent(model.charAt(0))}&background=FF5733&color=fff&size=256`;
      setFinalImageUrl(avatarUrl);
      setIsAvatarImage(true);
      setImageLoaded(true);
      return;
    }
    
    setImageError(true);
    console.warn(`Failed to load image for vehicle ${id} (${brand} ${model}). Creating avatar.`);
  };

  return (
    <div 
      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 relative">
        {!imageLoaded && !isAvatarImage && (
          <div className="absolute inset-0 flex items-center justify-center animate-pulse bg-gray-200">
            <span className="text-xs text-gray-400">Loading</span>
          </div>
        )}
        
        {finalImageUrl && (
          <img
            src={finalImageUrl}
            alt={`${brand} ${model}`}
            className={`h-full w-full ${isAvatarImage ? 'object-cover' : 'object-contain'} transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="eager" 
            decoding="async"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">{brand} {model}</h3>
        <p className="text-xs text-gray-500">{year} • {kmsDriven.toLocaleString()} km</p>
        <p className="text-sm font-medium text-[#FF5733]">₹{price.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default SuggestedVehicleItem; 