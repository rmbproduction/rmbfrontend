// Vehicle related interfaces for backend data structure

export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  registration_number: string;
  year: number;
  price: number;
  status: 'available' | 'sold' | 'under_inspection' | 'pending';
  vehicle_type: 'bike' | 'scooter' | 'other';
  fuel_type: 'petrol' | 'electric' | 'diesel' | 'cng';
  color: string;
  kms_driven: number;
  engine_capacity: number;
  mileage?: string | number;
  Mileage?: string | number; // Backend sometimes uses capitalized version
  condition?: string;
  features?: string[];
  highlights?: string[];
  description?: string;
  last_service_date?: string;
  insurance_valid_till?: string;
  
  // Image fields
  photo_front?: string;
  photo_back?: string;
  photo_left?: string;
  photo_right?: string;
  photo_dashboard?: string;
  photo_odometer?: string;
  photo_engine?: string;
  photo_extras?: string;
  
  // Normalized fields (will be added by frontend)
  image_url?: string;
  images?: {
    front: string | null;
    back: string | null;
    left: string | null;
    right: string | null;
    dashboard: string | null;
    engine: string | null;
  };
  
  // EMI related fields
  emi_available?: boolean;
  emi_options?: {
    min_months: number;
    max_months: number;
    interest_rate: number;
  };
  
  created_at?: string;
  updated_at?: string;

  status_display?: string;
  display_price?: {
    amount: number;
    currency: string;
    formatted: string;
    emi_available?: boolean;
    emi_starting_at?: string;
  };
  short_description?: string;
  condition_rating?: number;
  image_urls?: {
    thumbnail?: string;
    main?: string;
    gallery?: string[];
  };
}

export interface VehicleFilterOptions {
  status?: string[];
  brand?: string[];
  vehicle_type?: string[];
  fuel_type?: string[];
  price_range?: {
    min?: number;
    max?: number;
  };
  year_range?: {
    min?: number;
    max?: number;
  };
  location?: string;
  kms_driven_range?: {
    min?: number;
    max?: number;
  };
}

export interface VehicleFilters {
  brands: string[];
  vehicle_types: string[];
  fuel_types: string[];
  years: number[];
  price_ranges: {
    min: number;
    max: number | null;
  }[];
}

export interface VehiclePurchase {
  id: number;
  vehicle: number;
  user: number;
  status: 'initiated' | 'processing' | 'confirmed' | 'cancelled' | 'completed';
  payment_method: 'cash' | 'online' | 'emi';
  payment_status: 'pending' | 'completed';
  delivery_address: string;
  delivery_date: string;
  contact_number: string;
  emi_months?: number;
  created_at: string;
  updated_at: string;
  total_amount: number;
}

// Extended vehicle interface with UI-specific properties
export interface UIVehicle extends Vehicle {
  name: string;
  image?: string;
  formatted_price?: string;
} 