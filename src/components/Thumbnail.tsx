import React from 'react';
import { API_CONFIG } from '../config/api.config';

interface ThumbnailProps {
  path?: string | null;
  alt?: string;
  className?: string;
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  path,
  alt = '',
  className = ''
}) => {
  const defaultSrc = API_CONFIG.getDefaultVehicleImage();
  let src = defaultSrc;

  if (path) {
    src = path.startsWith('http')
      ? path
      : API_CONFIG.getMediaUrl(path);
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = defaultSrc;
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

export default Thumbnail; 