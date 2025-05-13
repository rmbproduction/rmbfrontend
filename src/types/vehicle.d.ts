export interface BaseVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  fuel_type?: string;
  kms_driven?: number;
  photo_front?: string;
  pickup_address?: string;
  contact_number?: string;
  created_at: string;
  expected_price?: number;
  price?: number;
  status?: string;
  status_display?: string;
  image_urls?: {
    main?: string;
    thumbnail?: string;
    gallery?: string[];
  };
  image_url?: string;
  image?: string;
}

export interface VehicleData extends BaseVehicle {
  vehicle?: BaseVehicle;
  [key: string]: any;
}

export interface StatusInfo {
  status: string;
  status_display: string;
  title: string;
  message: string;
  updated_at: string;
}

export interface VehicleFilterOptions {
  status?: string[];
  brand?: string[];
  vehicle_type?: string[];
  price_range?: {
    min: number;
    max: number;
  };
  year_range?: {
    min: number;
    max: number;
  };
  kms_driven_range?: {
    min: number;
    max: number;
  };
}

export interface VehicleFilters {
  brands: string[];
  vehicle_types: string[];
  price_ranges: Array<{
    min: number;
    max: number;
  }>;
  year_ranges: Array<{
    min: number;
    max: number;
  }>;
  kms_driven_ranges: Array<{
    min: number;
    max: number;
  }>;
} 