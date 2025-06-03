import { useState, useEffect } from 'react';
import userProfileDataService from '../services/userProfileDataService';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { apiService } from '../config/api.config';

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

interface SharedFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

const STORAGE_KEY = 'user_shared_form_data';

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

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

  // Get data from database first, then localStorage as fallback
  const getSharedData = async (): Promise<SharedFormData> => {
    try {
      // First try to get fresh data from database
      const response = await apiService.profile.getDetails();
      console.log('API Response:', response);
      
      if (response?.data) {
        const profileData = response.data;
        console.log('Raw profile data:', profileData);
        
        // Explicitly map each field from the API response
        const formattedData: SharedFormData = {
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',  // Make sure we map the phone
          address: profileData.address || '',  // Make sure we map the address
          city: profileData.city || '',  // Make sure we map the city
          state: profileData.state || '',  // Make sure we map the state
          postalCode: profileData.postal_code || ''  // Make sure we map the postal_code
        };

        console.log('Formatted shared data before storage:', formattedData);

        // Update both cache and localStorage
        queryClient.setQueryData(['sharedFormData'], formattedData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formattedData));
        
        // Log what we're actually storing
        console.log('Data being stored in localStorage:', formattedData);
        console.log('Data being stored in queryClient:', queryClient.getQueryData(['sharedFormData']));
        
        return formattedData;
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }

    // If database fetch fails, try cache
    const cached = queryClient.getQueryData<SharedFormData>(['sharedFormData']);
    if (cached) {
      console.log('Using cached data:', cached);
      return cached;
    }

    // Finally, try localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      console.log('Using localStorage data:', data);
      queryClient.setQueryData(['sharedFormData'], data);
      return data;
    }

    // Return empty data if nothing found
    const emptyData = {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: ''
    };
    console.log('No data found, returning empty data:', emptyData);
    return emptyData;
  };

  // Update shared data
  const updateSharedFormData = (data: Partial<SharedFormData>) => {
    const currentData = getSharedData();
    const newData = { ...currentData, ...data };

    // Update both cache and localStorage
    queryClient.setQueryData(['sharedFormData'], newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  // Update prefillFormData to handle async data fetching
  const prefillFormData = async <T extends object>(defaultData: T, formType: 'profile' | 'checkout' | 'subscription'): Promise<T> => {
    const sharedData = await getSharedData();
    console.log('Raw shared data received:', sharedData);
    
    // Map shared fields to form-specific fields
    const fieldMappings = {
      profile: {
        name: 'name',
        email: 'email',
        phone: 'phone',
        address: 'address',
        city: 'city',
        state: 'state',
        postal_code: 'postalCode'
      },
      checkout: {
        name: 'name',
        email: 'email',
        phone: 'phone',
        'address.street': 'address',
        'address.city': 'city',
        'address.state': 'state',
        'address.zipCode': 'postalCode'
      },
      subscription: {
        customer_name: 'name',
        customer_email: 'email',
        customer_phone: 'phone',
        address: 'address',
        city: 'city',
        state: 'state',
        postal_code: 'postalCode'
      }
    };

    const mapping = fieldMappings[formType];
    const prefilledData = { ...defaultData };
    console.log(`Prefilling ${formType} form with initial data:`, prefilledData);

    // Apply mappings to prefill data
    Object.entries(mapping).forEach(([formField, sharedField]) => {
      const value = sharedData[sharedField as keyof SharedFormData];
      console.log(`Mapping ${sharedField} (${value}) to ${formField}`);
      
      if (value !== undefined && value !== null && value !== '') {
        if (formField.includes('.')) {
          // Handle nested fields (e.g., address.street)
          const [parent, child] = formField.split('.');
          if (!prefilledData[parent as keyof T]) {
            (prefilledData[parent as keyof T] as any) = {};
          }
          ((prefilledData[parent as keyof T] as any)[child]) = value;
        } else {
          (prefilledData[formField as keyof T] as any) = value;
        }
      }
    });

    console.log(`Final prefilled data for ${formType} form:`, prefilledData);
    return prefilledData;
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
    getSharedData,
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