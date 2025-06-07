// Profile.tsx
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { apiService } from '../config/api.config';
import { tokenService } from '../services/tokenService';

const API_BASE_URL = 'https://repairmybike.up.railway.app/api';

// Add interfaces for vehicle-related types
interface VehicleType {
  id: number;
  name: string;
}

interface Manufacturer {
  id: number;
  name: string;
}

interface VehicleModel {
  id: number;
  name: string;
  manufacturer: number;
  vehicle_type: number;
}

interface ApiResponse<T> {
  data: T[];
}

interface ProfileFormData {
  name: string;
  phone_number: string;  // Changed to match backend
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  profile_picture: File | null;  // Changed to match backend
  bio: string;
  vehicle_name: number | null;
  vehicle_type: number | null;
  manufacturer: number | null;
}

const initialFormData: ProfileFormData = {
  name: '',
  phone_number: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
  profile_picture: null,
  bio: '',
  vehicle_type: null,
  manufacturer: null,
  vehicle_name: null
};

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);

  // Add back the useEffect hooks
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const [vehicleTypesResponse, manufacturersResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/vehicles/types/`),
          fetch(`${API_BASE_URL}/vehicles/manufacturers/`)
        ]);

        if (!vehicleTypesResponse.ok || !manufacturersResponse.ok) {
          throw new Error('Failed to fetch vehicle data');
        }

        const vehicleTypesData = await vehicleTypesResponse.json() as ApiResponse<VehicleType>;
        const manufacturersData = await manufacturersResponse.json() as ApiResponse<Manufacturer>;

        setVehicleTypes(vehicleTypesData.data);
        setManufacturers(manufacturersData.data);
      } catch (error) {
        console.error('Error fetching vehicle data:', error);
        toast.error('Failed to load vehicle data');
      }
    };

    fetchVehicleData();
  }, []);

  // Fetch vehicle models when type and manufacturer are selected
  useEffect(() => {
    const fetchVehicleModels = async () => {
      if (formData.vehicle_type && formData.manufacturer) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/vehicles/models/?vehicle_type=${formData.vehicle_type}&manufacturer=${formData.manufacturer}`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch vehicle models');
          }

          const data = await response.json() as ApiResponse<VehicleModel>;
          setVehicleModels(data.data);
        } catch (error) {
          console.error('Error fetching vehicle models:', error);
          toast.error('Failed to load vehicle models');
        }
      }
    };

    fetchVehicleModels();
  }, [formData.vehicle_type, formData.manufacturer]);

  const validateForm = (): boolean => {
    const requiredFields: (keyof ProfileFormData)[] = [
      'name', 'phone_number', 'address', 'city', 'state',
      'postal_code', 'country', 'vehicle_type', 'manufacturer', 'vehicle_name'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }

    // Validate phone number (must be less than 15 characters per backend)
    if (formData.phone_number.length > 15) {
      toast.error('Phone number must be less than 15 characters');
      return false;
    }

    // Validate vehicle relationships
    if (!formData.vehicle_type || !formData.manufacturer || !formData.vehicle_name) {
      toast.error('Please select all vehicle information');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Check if we have a valid token
      const accessToken = tokenService.getAccessToken();
      if (!accessToken || tokenService.isTokenExpired()) {
        // Try to refresh the token
        const refreshToken = tokenService.getRefreshToken();
        if (!refreshToken) {
          throw new Error('Please log in again');
        }

        // Attempt to refresh the token
        const refreshResponse = await fetch(`${API_BASE_URL}/accounts/token/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh: refreshToken
          })
        });

        if (!refreshResponse.ok) {
          throw new Error('Session expired. Please log in again');
        }

        const { access } = await refreshResponse.json();
        tokenService.setToken(access);
      }

      const formDataToSend = new FormData();
      
      // Add all the required fields to FormData
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone_number', formData.phone_number);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('postal_code', formData.postal_code);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('vehicle_name', formData.vehicle_name!.toString());
      formDataToSend.append('vehicle_type', formData.vehicle_type!.toString());
      formDataToSend.append('manufacturer', formData.manufacturer!.toString());

      if (formData.bio) {
        formDataToSend.append('bio', formData.bio);
      }
      if (formData.profile_picture) {
        formDataToSend.append('profile_picture', formData.profile_picture);
      }

      // Get the current access token (which should be valid now)
      const currentToken = tokenService.getAccessToken();
      if (!currentToken) {
        throw new Error('Authentication error');
      }

      // Make the API request with the current token
      const response = await fetch(`${API_BASE_URL}/accounts/profile/`, {
        method: 'PATCH',
        body: formDataToSend,
        headers: {
          'Authorization': currentToken,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const data = await response.json();
      console.log('Profile update response:', data);
      toast.success('Profile updated successfully!');
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.message.includes('log in')) {
        // Handle authentication errors
        tokenService.clearTokens();
        window.location.href = '/login'; // Redirect to login page
      } else {
        toast.error(error.message || 'Failed to update profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'vehicle_type' || name === 'manufacturer') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? Number(value) : null,
        vehicle_name: null // Reset vehicle_name when type or manufacturer changes
      }));
    } else if (name === 'vehicle_name') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? Number(value) : null
      }));
    } else if (name === 'phone_number') {
      // Only allow numbers and limit to 15 characters
      const numbersOnly = value.replace(/[^0-9]/g, '').slice(0, 15);
      setFormData(prev => ({
        ...prev,
        [name]: numbersOnly
      }));
    } else if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0] || null;
      setFormData(prev => ({
        ...prev,
        profile_picture: file
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        {/* Personal Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Personal Information</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              maxLength={15}
              title="Please enter a valid phone number (max 15 digits)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Profile Picture
            </label>
            <input
              type="file"
              name="profile_picture"
              onChange={handleChange}
              accept="image/*"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </div>

        {/* Address Information - All fields are required */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Address Information</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                title="Please enter a valid 6-digit postal code"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Information - All fields are required */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Vehicle Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <select
                name="vehicle_type"
                value={formData.vehicle_type || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Type</option>
                {vehicleTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Manufacturer <span className="text-red-500">*</span>
              </label>
              <select
                name="manufacturer"
                value={formData.manufacturer || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Manufacturer</option>
                {manufacturers.map(mfr => (
                  <option key={mfr.id} value={mfr.id}>{mfr.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Vehicle Model <span className="text-red-500">*</span>
              </label>
              <select
                name="vehicle_name"
                value={formData.vehicle_name || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!formData.vehicle_type || !formData.manufacturer}
              >
                <option value="">Select Model</option>
                {vehicleModels.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default Profile;