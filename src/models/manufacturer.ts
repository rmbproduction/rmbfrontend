/**
 * Represents a vehicle manufacturer
 */
export interface Manufacturer {
  id: string | number;
  name: string;
  displayName?: string;
  logo?: string;
  country?: string;
  website?: string;
  description?: string;
  isPopular?: boolean;
  founded?: string | number;
  vehicleTypes?: string[] | number[]; // List of applicable vehicle type IDs
  models?: VehicleModel[];
  serviceRates?: Record<string, number>; // Map of service ID to price adjustment rate
}

/**
 * Represents a vehicle model from a manufacturer
 */
export interface VehicleModel {
  id: string | number;
  manufacturerId: string | number;
  name: string;
  displayName?: string;
  image?: string;
  year?: number | string;
  vehicleTypeId?: string | number;
  description?: string;
  isPopular?: boolean;
  serviceRates?: Record<string, number>; // Model-specific price adjustments
}

/**
 * Represents a manufacturer category
 */
export interface ManufacturerCategory {
  id: string | number;
  name: string;
  displayName: string;
  manufacturers: Manufacturer[];
  icon?: string;
}

/**
 * Represents manufacturer popularity metrics
 */
export interface ManufacturerPopularity {
  manufacturerId: string | number;
  bookingCount: number;
  serviceCount: number;
  searchCount: number;
  score: number;
} 