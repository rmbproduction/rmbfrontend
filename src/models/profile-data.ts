/**
 * Represents user profile data for service checkout
 */
export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  scheduleDate?: string;
  scheduleTime?: string;
  specialInstructions?: string;
  paymentMethod?: 'online' | 'cash' | 'wallet';
  saveInformation?: boolean;
  subscriptionId?: string | number;
  subscriptionPlan?: string;
  [key: string]: any; // Allow for additional dynamic fields
}

/**
 * Represents a user account
 */
export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: 'customer' | 'admin' | 'technician';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profileData?: ProfileData;
}

/**
 * Represents saved address data
 */
export interface SavedAddress {
  id: string | number;
  userId: string;
  type: 'home' | 'work' | 'other';
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
} 