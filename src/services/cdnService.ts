import { API_CONFIG } from '../config/api.config';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  crop?: 'fill' | 'fit' | 'scale';
}

export interface ImageUrls {
  thumbnail: string;
  preview: string;
  full: string;
  compressed: string;
}

export interface UploadParams {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

type ImageSize = 'thumbnail' | 'preview' | 'full' | 'compressed';
type ProfileSize = 'small' | 'medium';

// Environment variable helper
const getEnvVar = (key: string, defaultValue: string): string => {
  const env = (window as any)?.import?.meta?.env || {};
  return env[key] || defaultValue;
};

class CDNService {
  private readonly baseUrl: string;
  private readonly cloudName: string;
  private readonly defaultTransformations: Record<ImageSize, ImageTransformOptions>;
  private readonly profileTransformations: Record<ProfileSize, ImageTransformOptions>;

  constructor() {
    this.baseUrl = getEnvVar('VITE_API_URL', API_CONFIG.BASE_URL);
    this.cloudName = getEnvVar('VITE_CLOUDINARY_CLOUD_NAME', 'dz81bjuea');
    
    this.defaultTransformations = {
      thumbnail: {
        width: 300,
        height: 200,
        quality: 80,
        crop: 'fill',
        format: 'auto'
      },
      preview: {
        width: 800,
        height: 600,
        quality: 85,
        crop: 'fill',
        format: 'auto'
      },
      full: {
        width: 1920,
        height: 1080,
        quality: 90,
        crop: 'fill',
        format: 'auto'
      },
      compressed: {
        width: 600,
        height: 400,
        quality: 60,
        crop: 'fill',
        format: 'auto'
      }
    };

    this.profileTransformations = {
      small: {
        width: 100,
        height: 100,
        quality: 80,
        crop: 'fill',
        format: 'auto'
      },
      medium: {
        width: 400,
        height: 400,
        quality: 85,
        crop: 'fill',
        format: 'auto'
      }
    };
  }

  async getVehicleImageUrls(vehicleId: number): Promise<ImageUrls> {
    try {
      const response = await fetch(`${this.baseUrl}/api/vehicle/vehicles/${vehicleId}/images/`);
      if (!response.ok) {
        throw new Error(`Failed to fetch image URLs: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching vehicle image URLs:', error);
      return this.getFallbackImageUrls('vehicles');
    }
  }

  async getUploadParams(vehicleId: number): Promise<UploadParams> {
    try {
      const response = await fetch(`${this.baseUrl}/api/vehicle/vehicles/${vehicleId}/upload-params/`);
      if (!response.ok) {
        throw new Error(`Failed to fetch upload parameters: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching upload parameters:', error);
      throw error;
    }
  }

  buildImageUrl(publicId: string, transformation: ImageTransformOptions): string {
    const { width, height, quality, format, crop } = transformation;
    const transformString = [
      width && height ? `w_${width},h_${height}` : '',
      crop ? `c_${crop}` : '',
      quality ? `q_${quality}` : '',
      format ? `f_${format}` : ''
    ].filter(Boolean).join(',');

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformString}/${publicId}`;
  }

  private getFallbackImageUrls(type: 'vehicles' | 'services' = 'vehicles'): ImageUrls {
    const fallbackImage = `${type}/placeholder`;
    return {
      thumbnail: this.buildImageUrl(fallbackImage, this.defaultTransformations.thumbnail),
      preview: this.buildImageUrl(fallbackImage, this.defaultTransformations.preview),
      full: this.buildImageUrl(fallbackImage, this.defaultTransformations.full),
      compressed: this.buildImageUrl(fallbackImage, this.defaultTransformations.compressed)
    };
  }

  async getProfileImageUrl(userId: number, size: ProfileSize = 'medium'): Promise<string> {
    try {
      const publicId = `profiles/${userId}`;
      return this.buildImageUrl(publicId, this.profileTransformations[size]);
    } catch (error) {
      console.error('Error getting profile image URL:', error);
      return this.buildImageUrl('profiles/default', this.profileTransformations[size]);
    }
  }

  async getServiceImageUrl(serviceId: number, size: ImageSize = 'preview'): Promise<string> {
    try {
      const publicId = `service_images/${serviceId}`;
      return this.buildImageUrl(publicId, this.defaultTransformations[size]);
    } catch (error) {
      console.error('Error getting service image URL:', error);
      return this.buildImageUrl('service_images/default', this.defaultTransformations[size]);
    }
  }

  validateImageDimensions(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve(img.width >= 800 && img.height >= 600);
        };
        img.onerror = () => resolve(false);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
}

const cdnService = new CDNService();
export default cdnService; 