import { CDN_CONFIG } from '../config/api.config';

interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: 'image' | 'raw' | 'video';
}

interface UploadOptions {
  folder?: string;
  resource_type?: 'image' | 'raw' | 'video' | 'auto';
  allowed_formats?: string[];
  max_file_size?: number;
}

class CloudinaryService {
  private static instance: CloudinaryService;
  private readonly cloudName: string;
  private readonly uploadPreset: string;
  private readonly baseUrl: string;

  private constructor() {
    this.cloudName = CDN_CONFIG.cloudName;
    this.uploadPreset = CDN_CONFIG.uploadPreset;
    this.baseUrl = CDN_CONFIG.baseURL;
  }

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  /**
   * Validates upload parameters before making the request
   */
  private validateUploadParams(file: File, options?: UploadOptions): void {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    if (!this.uploadPreset) {
      throw new Error('No upload preset configured. Please check your environment variables.');
    }

    if (options?.max_file_size && file.size > options.max_file_size) {
      throw new Error(`File size exceeds maximum allowed size of ${options.max_file_size} bytes`);
    }

    if (options?.allowed_formats) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !options.allowed_formats.includes(extension)) {
        throw new Error(`File format .${extension} is not allowed. Allowed formats: ${options.allowed_formats.join(', ')}`);
      }
    }
  }

  /**
   * Prepares FormData for upload
   */
  private prepareFormData(file: File, options?: UploadOptions): FormData {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('cloud_name', this.cloudName);

    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    if (options?.resource_type) {
      formData.append('resource_type', options.resource_type);
    }

    return formData;
  }

  /**
   * Uploads a file to Cloudinary with comprehensive error handling
   */
  public async upload(file: File, options?: UploadOptions): Promise<CloudinaryResponse> {
    try {
      // Validate parameters
      this.validateUploadParams(file, options);

      // Prepare form data
      const formData = this.prepareFormData(file, options);

      // Construct upload URL
      const uploadUrl = `${this.baseUrl}/${this.cloudName}/upload`;

      // Log upload attempt
      console.log('Attempting Cloudinary upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadUrl,
        options
      });

      // Make upload request
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `Upload failed with status ${response.status}: ${
            errorData?.error?.message || response.statusText
          }`
        );
      }

      const result = await response.json();

      // Log successful upload
      console.log('Cloudinary upload successful:', {
        publicId: result.public_id,
        url: result.secure_url
      });

      return result;
    } catch (error: any) {
      // Enhanced error logging
      console.error('Cloudinary upload error:', {
        error: error.message,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        options
      });

      // Rethrow with more context
      throw new Error(`Failed to upload file ${file.name}: ${error.message}`);
    }
  }

  /**
   * Generates a Cloudinary URL for an existing resource
   */
  public getUrl(publicId: string, options: {
    transformation?: string;
    format?: string;
  } = {}): string {
    try {
      const { transformation = '', format } = options;
      const transformationString = transformation ? `${transformation}/` : '';
      const formatString = format ? `.${format}` : '';

      return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformationString}${publicId}${formatString}`;
    } catch (error: any) {
      console.error('Error generating Cloudinary URL:', error);
      return '';
    }
  }

  /**
   * Validates if a URL is a valid Cloudinary URL
   */
  public isValidCloudinaryUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return (
        parsedUrl.hostname.includes('cloudinary.com') &&
        parsedUrl.pathname.includes('/upload/') &&
        parsedUrl.protocol === 'https:'
      );
    } catch {
      return false;
    }
  }
}

export const cloudinaryService = CloudinaryService.getInstance(); 