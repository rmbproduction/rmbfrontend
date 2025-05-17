/**
 * Represents an item in the service cart
 */
export interface CartItem {
  id: number | string;
  serviceId: number;
  serviceName: string;
  description?: string;
  price: number;
  quantity: number;
  manufacturerId?: number;
  manufacturerName?: string;
  vehicleModelId?: number;
  vehicleModelName?: string;
  vehicleType?: string;
  extraInfo?: string;
  discount?: number;
  imageUrl?: string;
}

/**
 * Represents a cart with service items
 */
export interface Cart {
  id?: string;
  items: CartItem[];
  total: number;
  discountTotal?: number;
  finalTotal?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'pending' | 'completed' | 'cancelled';
}

/**
 * Represents a service that can be added to the cart
 */
export interface ServiceData {
  id: number;
  title: string;
  description: string;
  category: string;
  categoryId: number;
  price: number;
  basePrice?: number;
  duration?: string;
  warranty?: string;
  imageUrl?: string;
  packages?: ServicePackage[];
  isPopular?: boolean;
  isRecommended?: boolean;
}

/**
 * Represents a service package
 */
export interface ServicePackage {
  id: number;
  serviceId: number;
  name: string;
  description?: string;
  price: number;
  duration: string;
  warranty: string;
  features?: string[];
  isPopular?: boolean;
} 