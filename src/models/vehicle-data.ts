/**
 * Represents vehicle data for service checkout
 */
export interface VehicleData {
  type: string; // bike, scooter, etc.
  manufacturerId: string | number;
  manufacturerName?: string;
  modelId: string | number;
  modelName?: string;
  registrationNumber?: string;
  year?: number;
  color?: string;
  fuelType?: string;
  engineCapacity?: number;
  kmsDriven?: number;
  vinNumber?: string;
  purchaseDate?: string;
  lastServiceDate?: string;
  additionalInfo?: string;
  imageUrl?: string;
}

/**
 * Represents a vehicle type
 */
export interface VehicleType {
  id: string | number;
  name: string;
  displayName?: string;
  icon?: string;
  description?: string;
  isPopular?: boolean;
  services?: string[]; // List of applicable service IDs
}

/**
 * Represents vehicle ownership info
 */
export interface VehicleOwnership {
  id: string | number;
  userId: string;
  vehicleId: string | number;
  isPrimary: boolean;
  relationshipType: 'owner' | 'family' | 'friend' | 'other';
  createdAt?: string;
  updatedAt?: string;
  vehicle?: VehicleData;
} 