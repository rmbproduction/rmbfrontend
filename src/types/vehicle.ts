export interface VehiclePrice {
  amount: number;
  currency: string;
  formatted: string;
  emi_available: boolean;
  emi_starting_at: string;
}

export interface Vehicle {
  id: string;
  vehicle_type: string;
  vehicle_type_display: string;
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  kms_driven: number;
  Mileage: string;
  fuel_type: string;
  engine_capacity: number;
  color: string;
  last_service_date: string | null;
  insurance_valid_till: string | null;
  status: string;
  status_display: string;
  short_description: string;
  display_price: VehiclePrice;
  front_image_url: string;
  back_image_url: string | null;
  left_image_url: string | null;
  right_image_url: string | null;
  dashboard_image_url: string | null;
  features: string[];
  condition_rating: number | null;
  price: string;
  expected_price: string;
  bookable: boolean;
  is_bookable: boolean;
}

export interface SelectedVehicle {
  manufacturer: string;
  model: string;
  vehicleType: string;
  manufacturerId?: number;
  modelId?: number;
} 