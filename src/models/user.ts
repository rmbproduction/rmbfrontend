/**
 * User models for profile and authentication
 */

export interface UserProfile {
  id?: number;
  email: string;
  name: string;
  username: string;
  address: string;
  profile_photo: string | null;
  vehicle_name: number | null;
  vehicle_type: number | null;
  manufacturer: number | null;
  memberSince?: string;
  phone?: string;
  preferredLocation?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  [key: string]: any; // Allow string indexing for flexibility
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: UserProfile;
} 