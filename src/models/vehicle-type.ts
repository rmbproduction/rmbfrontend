/**
 * Represents a vehicle type
 */
export interface VehicleType {
  id: string | number;
  name: string;
  displayName: string;
  icon?: string;
  description?: string;
  isPopular?: boolean;
  services?: string[] | number[]; // List of applicable service IDs
}

/**
 * Represents vehicle type category
 */
export interface VehicleTypeCategory {
  id: string | number;
  name: string;
  displayName: string;
  types: VehicleType[];
  icon?: string;
}

/**
 * Enum for common vehicle types
 */
export enum CommonVehicleType {
  BIKE = 'bike',
  SCOOTER = 'scooter',
  ELECTRIC_BIKE = 'electric_bike',
  ELECTRIC_SCOOTER = 'electric_scooter',
  OTHER = 'other'
}

/**
 * Maps vehicle type to its display name
 */
export const VEHICLE_TYPE_DISPLAY_MAP: Record<string, string> = {
  [CommonVehicleType.BIKE]: 'Bike',
  [CommonVehicleType.SCOOTER]: 'Scooter',
  [CommonVehicleType.ELECTRIC_BIKE]: 'Electric Bike',
  [CommonVehicleType.ELECTRIC_SCOOTER]: 'Electric Scooter',
  [CommonVehicleType.OTHER]: 'Other'
}; 