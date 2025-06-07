export interface LoginResponse {
  message: string;
  is_first_login: boolean;
  tokens: {
    access: string;
    refresh: string;
  };
  user: {
    id: number;
    username: string;
    email: string;
    email_verified: boolean;
  };
}

export interface ServiceBookingData {
  cart_id?: number;
  service_id?: string;
  vehicle?: {
    vehicle_type: string | number;
    manufacturer: string | number;
    model: string | number;
  };
  price?: string;
  is_custom_price?: boolean;
  quantity?: number;
}

export interface ScheduledVisit {
  id: number;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  vehicle?: {
    id: number;
    manufacturer: string;
    model: string;
  };
}

export interface VehicleType {
  id: number;
  name: string;
  description?: string;
}

export interface Manufacturer {
  id: number;
  name: string;
  country?: string;
}

export interface VehicleModel {
  id: number;
  name: string;
  manufacturer: number;
  year?: number;
}

export interface Vehicle {
  id: number;
  type: VehicleType;
  manufacturer: Manufacturer;
  model: VehicleModel;
  year?: number;
  color?: string;
  registration_number?: string;
  vin?: string;
  images?: string[];
}

export interface SparePart {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  manufacturer: string;
  compatible_vehicles: Vehicle[];
  images: string[];
  stock: number;
  rating?: number;
  reviews_count?: number;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  is_active: boolean;
}

export interface SubscriptionVariant {
  id: number;
  plan: number;
  name: string;
  price: number;
  duration: number;
  features: string[];
}

export interface Subscription {
  id: number;
  plan: SubscriptionPlan;
  variant?: SubscriptionVariant;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  auto_renew: boolean;
  remaining_visits: number;
}

export interface Profile {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    email_verified: boolean;
  };
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  avatar?: string;
  preferred_language?: string;
  notification_preferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
} 