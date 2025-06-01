import { useState, useEffect } from 'react';
import userProfileDataService from '../services/userProfileDataService';
import { toast } from 'react-toastify';

export interface UserProfileData {
  id?: number;
  user?: number;
  username?: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  profile_photo?: string | null;
  vehicle_name?: number | null;
  vehicle_type?: number | null;
  manufacturer?: number | null;
  created_at?: string;
}

export interface FormattedProfileData {
  // Personal Info
  name: string;
  email: string;
  phone: string;
  username: string;
  
  // Address Info
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  
  // Vehicle Info
  vehicleName: number | null;
  vehicleType: number | null;
  manufacturer: number | null;
  
  // Combined Fields
  fullAddress: string;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await userProfileDataService.getProfileData();
      setProfile(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Error fetching profile data:', err);
      const error = err instanceof Error ? err : new Error('Failed to fetch profile data');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProfile().catch(err => {
      console.error('Error in initial profile fetch:', err);
    });
  }, []);

  // Update profile
  const updateProfile = async (newData: Partial<UserProfileData>) => {
    try {
      setIsUpdating(true);
      
      // Validate the data before saving
      if (!newData || typeof newData !== 'object') {
        throw new Error('Invalid profile data: data must be an object');
      }

      // Save to service and update local state atomically
      await userProfileDataService.saveProfileData(newData);
      setProfile(prevProfile => ({
        ...prevProfile,
        ...newData
      }));
      setError(null);
      
      return newData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // Format profile data for forms
  const getFormattedProfile = (): FormattedProfileData => {
    const defaultData: FormattedProfileData = {
      name: '',
      email: '',
      phone: '',
      username: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      vehicleName: null,
      vehicleType: null,
      manufacturer: null,
      fullAddress: '',
      contactInfo: {
        name: '',
        email: '',
        phone: ''
      }
    };

    if (!profile) return defaultData;

    const formattedData: FormattedProfileData = {
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      username: profile.username || '',
      address: profile.address || '',
      city: profile.city || '',
      state: profile.state || '',
      postalCode: profile.postal_code || '',
      country: profile.country || '',
      vehicleName: profile.vehicle_name || null,
      vehicleType: profile.vehicle_type || null,
      manufacturer: profile.manufacturer || null,
      fullAddress: combineAddress({
        address: profile.address,
        city: profile.city,
        state: profile.state,
        postal_code: profile.postal_code
      }),
      contactInfo: {
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      }
    };

    return formattedData;
  };

  // Helper function to combine address parts
  const combineAddress = (parts: {
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  }): string => {
    const addressParts = [
      parts.address,
      parts.city,
      parts.state,
      parts.postal_code
    ].filter(Boolean);
    return addressParts.join(', ');
  };

  return {
    profile: profile || {} as UserProfileData,
    formattedProfile: getFormattedProfile(),
    isLoading,
    isUpdating,
    error,
    updateProfile,
    fetchProfile
  };
}; 