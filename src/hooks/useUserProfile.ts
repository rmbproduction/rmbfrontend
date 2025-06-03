import { useState, useEffect } from 'react';
import userProfileDataService from '../services/userProfileDataService';
import { toast } from 'react-toastify';

interface UserProfileData {
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
  vehicle_model?: number | null;
  registration_number?: string;
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
  vehicleModel: number | null;
  registrationNumber: string;
  
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
      return data;
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile data'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, []);

  // Update profile
  const updateProfile = async (newData: Partial<UserProfileData>) => {
    try {
      setIsUpdating(true);
      await userProfileDataService.saveProfileData(newData);
      const updatedData = await fetchProfile();
      toast.success('Profile updated successfully');
      return updatedData;
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
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
      vehicleModel: null,
      registrationNumber: '',
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
      vehicleModel: profile.vehicle_model || null,
      registrationNumber: profile.registration_number || '',
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

  // Parse address into components
  const parseAddress = (fullAddress: string | undefined) => {
    if (!fullAddress) return { address: '', city: '', state: '', postal_code: '' };

    const parts = fullAddress.split(',').map(part => part.trim());
    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1].split(' ');
      return {
        address: parts[0],
        city: parts[1],
        state: lastPart[0],
        postal_code: lastPart[1] || ''
      };
    }
    return { address: fullAddress, city: '', state: '', postal_code: '' };
  };

  // Combine address components
  const combineAddress = (components: {
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  }) => {
    const { address, city, state, postal_code } = components;
    if (!address || !city || !state) return '';
    return `${address}, ${city}, ${state} ${postal_code || ''}`.trim();
  };

  // Pre-fill form data
  const prefillFormData = <T extends object>(
    currentFormData: T,
    formType: 'checkout' | 'vehicle' | 'subscription' | 'booking'
  ): T => {
    if (!profile) return currentFormData;

    const formatted = getFormattedProfile();
    const updates: Partial<T> = {};

    // Common fields that should be shared across all forms
    const commonFields = {
      name: formatted.name,
      email: formatted.email,
      phone: formatted.phone,
      address: formatted.address,
      city: formatted.city,
      state: formatted.state,
      postal_code: formatted.postalCode,
      country: formatted.country
    };

    switch (formType) {
      case 'checkout':
        Object.assign(updates, {
          ...commonFields,
          address: {
            street: formatted.address,
            city: formatted.city,
            state: formatted.state,
            zipCode: formatted.postalCode
          }
        });
        break;

      case 'vehicle':
        Object.assign(updates, {
          ...commonFields,
          contactNumber: formatted.phone,
          pickupAddress: formatted.fullAddress,
          vehicleType: formatted.vehicleType,
          manufacturer: formatted.manufacturer,
          vehicleModel: formatted.vehicleModel,
          registrationNumber: formatted.registrationNumber
        });
        break;

      case 'subscription':
        Object.assign(updates, {
          ...commonFields,
          customer_name: formatted.name,
          customer_email: formatted.email,
          customer_phone: formatted.phone,
          vehicle_type: formatted.vehicleType,
          manufacturer: formatted.manufacturer,
          vehicle_model: formatted.vehicleModel
        });
        break;

      case 'booking':
        Object.assign(updates, {
          ...commonFields,
          contact_number: formatted.phone,
          customer_name: formatted.name,
          customer_email: formatted.email
        });
        break;
    }

    return { ...currentFormData, ...updates };
  };

  // Update shared form data
  const updateSharedFormData = (formData: Partial<FormattedProfileData>) => {
    updateProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      postal_code: formData.postalCode,
      country: formData.country,
      vehicle_name: formData.vehicleName,
      vehicle_type: formData.vehicleType,
      manufacturer: formData.manufacturer,
      vehicle_model: formData.vehicleModel,
      registration_number: formData.registrationNumber
    });
  };

  return {
    profile: profile || {} as UserProfileData,
    formattedProfile: getFormattedProfile(),
    isLoading,
    isUpdating,
    error,
    updateProfile,
    parseAddress,
    combineAddress,
    prefillFormData,
    updateSharedFormData,
    // Helper functions to get specific fields with type safety
    getUsername: () => profile?.username || '',
    getEmail: () => profile?.email || '',
    getName: () => profile?.name || '',
    getPhone: () => profile?.phone || '',
    getAddress: () => profile?.address || '',
    getCity: () => profile?.city || '',
    getState: () => profile?.state || '',
    getPostalCode: () => profile?.postal_code || '',
    getCountry: () => profile?.country || '',
    getVehicleInfo: () => ({
      vehicle_name: profile?.vehicle_name || null,
      vehicle_type: profile?.vehicle_type || null,
      manufacturer: profile?.manufacturer || null
    })
  };
}; 