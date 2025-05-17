/**
 * Represents a vehicle model
 */
export interface VehicleModel {
  id: string | number;
  manufacturerId: string | number;
  manufacturerName?: string;
  name: string;
  displayName?: string;
  image?: string;
  year?: number | string;
  vehicleTypeId?: string | number;
  vehicleTypeName?: string;
  description?: string;
  isPopular?: boolean;
  specifications?: VehicleModelSpecification;
  serviceRates?: Record<string, number>; // Model-specific price adjustments
}

/**
 * Represents vehicle model specifications
 */
export interface VehicleModelSpecification {
  engineCapacity?: number;
  fuelType?: string;
  mileage?: string | number;
  topSpeed?: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  tankCapacity?: number;
  maxPower?: string;
  maxTorque?: string;
  transmission?: string;
  batteryCapacity?: number; // For electric vehicles
  chargingTime?: string; // For electric vehicles
  range?: number; // For electric vehicles
  [key: string]: any; // Allow for additional specifications
}

/**
 * Represents vehicle model popularity metrics
 */
export interface VehicleModelPopularity {
  modelId: string | number;
  bookingCount: number;
  serviceCount: number;
  searchCount: number;
  score: number;
} 