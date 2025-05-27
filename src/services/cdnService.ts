import { API_ENDPOINTS, CDN_CONFIG } from '../config/api.config';
import { cloudinaryService } from './cloudinaryService';

export interface CloudinaryAsset {
  public_id: string;
  version: string;
  format: string;
  resource_type: 'image' | 'video' | 'raw';
  url: string;
  secure_url: string;
}

interface UploadResponse extends CloudinaryAsset {
  original_filename: string;
  bytes: number;
  created_at: string;
}

interface UploadParams {
  folder: string;
  resource_type: 'image' | 'raw' | 'video' | 'auto';
  allowed_formats?: string[];
  max_file_size?: number;
}

interface CloudinaryUrlOptions {
  transformation?: string[];
  version?: string;
  format?: string;
}

// Define folder structure types for type safety
export type VehiclePhotoType = 'back' | 'dashboard' | 'engine' | 'extras' | 'front' | 'left' | 'odometer' | 'right';
export type VehicleDocumentType = 'additional' | 'insurance' | 'puc' | 'rc';
export type VehicleModelType = 'back' | 'front' | 'side' | 'thumbnails';

export class CDNService {
  private static instance: CDNService;
  private readonly cloudName: string;

  private constructor() {
    this.cloudName = CDN_CONFIG.cloudName;
  }

  public static getInstance(): CDNService {
    if (!CDNService.instance) {
      CDNService.instance = new CDNService();
    }
    return CDNService.instance;
  }

  /**
   * Get folder path for different asset types
   */
  private getFolderPath(type: 'photos' | 'documents' | 'models', subFolder: string): string {
    switch (type) {
      case 'photos':
        return `${CDN_CONFIG.folders.photos}/${subFolder}`;
      case 'documents':
        return `${CDN_CONFIG.folders.documents}/${subFolder}`;
      case 'models':
        return `${CDN_CONFIG.folders.models}/${subFolder}`;
      default:
        throw new Error('Invalid folder type');
    }
  }

  /**
   * Generate a Cloudinary URL for an asset
   */
  generateUrl(publicId: string, options: CloudinaryUrlOptions = {}): string {
    const {
      transformation = [],
      version,
      format
    } = options;

    const transformationString = transformation.length > 0 ? transformation.join(',') + '/' : '';
    const versionString = version ? `v${version}/` : '';
    const formatString = format ? `.${format}` : '';

    return `${CDN_CONFIG.baseURL}/${this.cloudName}/image/upload/${transformationString}${versionString}${publicId}${formatString}`;
  }

  /**
   * Parse a Cloudinary URL to extract its components
   */
  parseUrl(url: string): {
    publicId: string;
    version?: string;
    transformation?: string[];
    format?: string;
  } {
    const regex = /https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/((?:[^/]+\/)*)(v\d+\/)?([^.]+)(?:\.([^?]+))?/;
    const matches = url.match(regex);

    if (!matches) {
      throw new Error('Invalid Cloudinary URL');
    }

    const [, transformationPath, versionPath, publicId, format] = matches;

    return {
      publicId,
      version: versionPath ? versionPath.replace(/v|\//, '') : undefined,
      transformation: transformationPath ? transformationPath.split('/').filter(Boolean) : [],
      format
    };
  }

  /**
   * Upload a file to Cloudinary
   */
  async uploadFile(file: File, params: UploadParams): Promise<UploadResponse> {
    try {
      const result = await cloudinaryService.upload(file, params);
      return {
        ...result,
        version: result.public_id.split('/').pop() || '',
        original_filename: file.name,
        bytes: file.size,
        created_at: new Date().toISOString(),
        url: result.secure_url
      };
    } catch (error: any) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  }

  /**
   * Upload vehicle photos with proper categorization
   */
  async uploadVehiclePhotos(photos: {
    [K in VehiclePhotoType]?: File;
  }): Promise<Record<string, CloudinaryAsset>> {
    const uploadPromises: Promise<{ key: string; asset: CloudinaryAsset }>[] = [];

    // Validate that we have at least one valid photo
    const validPhotos = Object.entries(photos).filter(([_, file]) => file instanceof File);
    if (validPhotos.length === 0) {
      throw new Error('No valid photos provided for upload');
    }

    // Validate required photos
    const requiredTypes: VehiclePhotoType[] = ['front', 'back', 'left', 'right'];
    const missingRequired = requiredTypes.filter(type => !photos[type]);
    if (missingRequired.length > 0) {
      throw new Error(`Missing required photos: ${missingRequired.join(', ')}`);
    }

    for (const [key, file] of Object.entries(photos)) {
      if (file && file instanceof File) {
        try {
          uploadPromises.push(
            this.uploadFile(file, {
              folder: this.getFolderPath('photos', key),
              resource_type: 'image',
              allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
              max_file_size: 5 * 1024 * 1024 // 5MB
            }).then(response => ({
              key,
              asset: {
                public_id: response.public_id,
                version: response.version,
                format: response.format,
                resource_type: response.resource_type,
                url: response.url,
                secure_url: response.secure_url
              }
            }))
          );
        } catch (error) {
          console.error(`Error preparing upload for ${key}:`, error);
          throw new Error(`Failed to prepare upload for ${key}: ${error}`);
        }
      }
    }

    try {
      const results = await Promise.all(uploadPromises);
      return results.reduce((acc, { key, asset }) => {
        acc[key] = asset;
        return acc;
      }, {} as Record<string, CloudinaryAsset>);
    } catch (error: any) {
      console.error('Error uploading vehicle photos:', error);
      throw new Error(`Failed to upload vehicle photos: ${error.message}`);
    }
  }

  /**
   * Upload vehicle documents with proper validation
   */
  async uploadVehicleDocuments(documents: {
    [K in VehicleDocumentType]?: File;
  }): Promise<Record<string, CloudinaryAsset>> {
    const uploadPromises: Promise<{ key: string; asset: CloudinaryAsset }>[] = [];

    // Validate that we have at least one valid document
    const validDocs = Object.entries(documents).filter(([_, file]) => file instanceof File);
    if (validDocs.length === 0) {
      throw new Error('No valid documents provided for upload');
    }

    // Validate required documents
    const requiredTypes: VehicleDocumentType[] = ['rc', 'insurance', 'puc'];
    const missingRequired = requiredTypes.filter(type => !documents[type]);
    if (missingRequired.length > 0) {
      throw new Error(`Missing required documents: ${missingRequired.join(', ')}`);
    }

    for (const [key, file] of Object.entries(documents)) {
      if (file && file instanceof File) {
        try {
          uploadPromises.push(
            this.uploadFile(file, {
              folder: this.getFolderPath('documents', key),
              resource_type: 'auto',
              allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
              max_file_size: 10 * 1024 * 1024 // 10MB
            }).then(response => ({
              key,
              asset: {
                public_id: response.public_id,
                version: response.version,
                format: response.format,
                resource_type: response.resource_type,
                url: response.url,
                secure_url: response.secure_url
              }
            }))
          );
        } catch (error) {
          console.error(`Error preparing upload for ${key}:`, error);
          throw new Error(`Failed to prepare upload for ${key}: ${error}`);
        }
      }
    }

    try {
      const results = await Promise.all(uploadPromises);
      return results.reduce((acc, { key, asset }) => {
        acc[key] = asset;
        return acc;
      }, {} as Record<string, CloudinaryAsset>);
    } catch (error: any) {
      console.error('Error uploading vehicle documents:', error);
      throw new Error(`Failed to upload vehicle documents: ${error.message}`);
    }
  }

  /**
   * Get transformed URL for an image
   */
  getImageUrl(publicId: string, transformation?: string): string {
    const baseUrl = API_ENDPOINTS.cdn.baseUrl;
    if (transformation) {
      return `${baseUrl}/image/upload/${transformation}/${publicId}`;
    }
    return `${baseUrl}/image/upload/${publicId}`;
  }

  /**
   * Get document URL
   */
  getDocumentUrl(publicId: string): string {
    return `${API_ENDPOINTS.cdn.baseUrl}/raw/upload/${publicId}`;
  }

  /**
   * Upload vehicle model images
   */
  async uploadVehicleModelImages(images: {
    [K in VehicleModelType]?: File;
  }): Promise<Record<string, CloudinaryAsset>> {
    const uploadPromises: Promise<{ key: string; asset: CloudinaryAsset }>[] = [];

    for (const [key, file] of Object.entries(images)) {
      if (file) {
        uploadPromises.push(
          this.uploadFile(file, {
            folder: this.getFolderPath('models', key),
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            max_file_size: 5 * 1024 * 1024 // 5MB
          }).then(response => ({
            key,
            asset: {
              public_id: response.public_id,
              version: response.version,
              format: response.format,
              resource_type: response.resource_type as 'image' | 'video' | 'raw',
              url: response.url,
              secure_url: response.secure_url
            }
          }))
        );
      }
    }

    const results = await Promise.all(uploadPromises);
    return results.reduce((acc, { key, asset }) => {
      acc[key] = asset;
      return acc;
    }, {} as Record<string, CloudinaryAsset>);
  }

  /**
   * Get a transformed version of an image URL
   */
  transform(url: string, transformation: string[]): string {
    const parsed = this.parseUrl(url);
    return this.generateUrl(parsed.publicId, {
      ...parsed,
      transformation
    });
  }
}

export const cdnService = CDNService.getInstance(); 