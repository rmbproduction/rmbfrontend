import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings, LogOut, Bike, 
  Clock, Menu,
  Loader, Wrench, CreditCard as Subscription
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import ForSaleVehicles from '../components/ForSaleVehicles';
import BookedVehicles from '../components/BookedVehicles';
import MyRepairs from './MyRepairs';
import MySubscription from '../components/subscription/MySubscription';
import { apiService } from '../config/api.config.ts';
import axios from 'axios';
import { useUserProfile } from '../hooks/useUserProfile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface VehicleType {
  id: number;
  name: string;
  image?: string;
}

interface Manufacturer {
  id: number;
  name: string;
  image?: string;
}

interface VehicleModel {
  id: number;
  name: string;
  manufacturer: number;
  manufacturer_name: string;
  vehicle_type: number;
  vehicle_type_name: string;
  image?: string;
}

interface UserProfile {
  id?: number;
  user?: number;
  email: string;
  username: string;
  name: string;
  phone: string;
  address: string;
  profile_photo: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  preferred_location?: string;
  vehicle_model?: number | null;
  vehicle_details?: {
    vehicle_model: number;
    vehicle_type: number;
    manufacturer: number;
    model_name: string;
    type_name: string;
    manufacturer_name: string;
  };
}

interface SidebarProps {
  className?: string;
}

type TabType = 'profile' | 'vehicles' | 'bookings' | 'repairs' | 'subscriptions' | 'change-password';

const defaultProfile: UserProfile = {
  email: '',
  username: '',
  name: '',
  phone: '',
  address: '',
  profile_photo: null,
  city: '',
  state: '',
  country: '',
  postal_code: '',
  preferred_location: ''
};

// Add type for API responses
interface ApiResponse<T> {
  data: T;
}

interface VehicleDetails {
  vehicle_model: number;
  vehicle_type: number;
  manufacturer: number;
  model_name: string;
  type_name: string;
  manufacturer_name: string;
}

interface ProfileResponse extends UserProfile {
  vehicle_details?: VehicleDetails;
}

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { updateProfile, updateSharedFormData } = useUserProfile();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserProfile>(defaultProfile);
  const [isNewProfile, setIsNewProfile] = useState(true);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<number | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<number | null>(null);
  const [selectedVehicleModel, setSelectedVehicleModel] = useState<number | null>(null);
  const [filteredModels, setFilteredModels] = useState<VehicleModel[]>([]);

  // Get active tab from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || 'profile');

  // Add debug logs
  console.log('Profile Component State:', {
    isAuthenticated,
    isLoading,
    user,
    activeTab,
    formData
  });

  // Handle authentication check
  useEffect(() => {
    console.log('Auth Check Effect:', { isAuthenticated, isLoading });
    if (!isAuthenticated && !isLoading) {
      console.log('Redirecting to login...');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Update form data when user data changes
  useEffect(() => {
    console.log('User Data Effect:', { user });
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        name: user.profile?.name || user.name || '',
        phone: user.profile?.phone || user.phone || '',
        address: user.profile?.address || user.address || '',
        city: user.profile?.city || '',
        state: user.profile?.state || '',
        country: user.profile?.country || '',
        postal_code: user.profile?.postal_code || '',
        profile_photo: user.profile?.profile_photo || null
      });
    }
  }, [user]);

  // Update active tab when URL changes
  useEffect(() => {
    const tab = queryParams.get('tab') as TabType | null;
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Query keys
  const QUERY_KEYS = {
    profile: ['profile'],
    vehicleTypes: ['vehicleTypes'],
    manufacturers: ['manufacturers'],
    vehicleModels: (type: number | null | undefined, manufacturer: number | null | undefined) => 
      ['vehicleModels', { type: type || undefined, manufacturer: manufacturer || undefined }]
  } as const;

  // Fetch profile data using React Query
  const { data: profileQueryData, isLoading: isProfileLoading } = useQuery<ProfileResponse>({
    queryKey: QUERY_KEYS.profile,
    queryFn: async () => {
      const response = await apiService.profile.getDetails();
      console.log('Fetched profile data:', response.data); // Debug log
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false
  });

  // Add a function to handle vehicle selection updates
  const handleVehicleSelectionChange = (type: 'type' | 'manufacturer' | 'model', value: number | null) => {
    console.log('Updating vehicle selection:', { type, value });
    
    switch (type) {
      case 'type':
        setSelectedVehicleType(value);
        // Reset dependent fields
        setSelectedManufacturer(null);
        setSelectedVehicleModel(null);
        break;
      case 'manufacturer':
        setSelectedManufacturer(value);
        // Reset model when manufacturer changes
        setSelectedVehicleModel(null);
        break;
      case 'model':
        setSelectedVehicleModel(value);
        break;
    }
  };

  // Update the vehicle dropdowns JSX
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Vehicle Type Dropdown */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Vehicle Type
      </label>
      <select
        name="vehicle_type"
        value={selectedVehicleType || ''}
        onChange={(e) => {
          const value = e.target.value ? parseInt(e.target.value) : null;
          handleVehicleSelectionChange('type', value);
        }}
        disabled={!isEditing}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
      >
        <option value="">Select Vehicle Type</option>
        {vehicleTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
    </div>

    {/* Manufacturer Dropdown */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Manufacturer
      </label>
      <select
        name="manufacturer"
        value={selectedManufacturer || ''}
        onChange={(e) => {
          const value = e.target.value ? parseInt(e.target.value) : null;
          handleVehicleSelectionChange('manufacturer', value);
        }}
        disabled={!isEditing}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
      >
        <option value="">Select Manufacturer</option>
        {manufacturers.map((manufacturer) => (
          <option key={manufacturer.id} value={manufacturer.id}>
            {manufacturer.name}
          </option>
        ))}
      </select>
    </div>

    {/* Vehicle Model Dropdown */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Vehicle Model
      </label>
      <select
        name="vehicle_model"
        value={selectedVehicleModel || ''}
        onChange={(e) => {
          const value = e.target.value ? parseInt(e.target.value) : null;
          handleVehicleSelectionChange('model', value);
        }}
        disabled={!isEditing || !selectedVehicleType || !selectedManufacturer}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
      >
        <option value="">Select Vehicle Model</option>
        {filteredModels.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      {isEditing && (!selectedVehicleType || !selectedManufacturer) && (
        <p className="mt-1 text-sm text-gray-500">
          Please select both Vehicle Type and Manufacturer first
        </p>
      )}
    </div>
  </div>

  // Update useEffect for profile data handling
  useEffect(() => {
    if (profileQueryData) {
      console.log('Setting profile data from query:', profileQueryData);
      const formattedData = {
        ...profileQueryData,
        email: profileQueryData.email || '',
        username: profileQueryData.username || '',
        name: profileQueryData.name || '',
        phone: profileQueryData.phone || '',
        address: profileQueryData.address || '',
        city: profileQueryData.city || '',
        state: profileQueryData.state || '',
        country: profileQueryData.country || '',
        postal_code: profileQueryData.postal_code || '',
        profile_photo: profileQueryData.profile_photo || null,
        vehicle_model: profileQueryData.vehicle_model
      };

      setFormData(formattedData);
      setProfileData(formattedData);
      setIsNewProfile(false);

      // Enhanced vehicle details restoration
      console.log('Vehicle details from profile:', profileQueryData.vehicle_details);
      if (profileQueryData.vehicle_details) {
        const { vehicle_type, manufacturer, vehicle_model } = profileQueryData.vehicle_details;
        
        console.log('Restoring vehicle selections:', {
          type: vehicle_type,
          manufacturer,
          model: vehicle_model
        });

        // First set the vehicle type
        setSelectedVehicleType(vehicle_type);

        // Then set manufacturer after a small delay to ensure type is set
        setTimeout(() => {
          setSelectedManufacturer(manufacturer);

          // Finally set the vehicle model after manufacturer is set
          setTimeout(() => {
            setSelectedVehicleModel(vehicle_model);
            console.log('Vehicle selections restored:', {
              type: vehicle_type,
              manufacturer,
              model: vehicle_model
            });
          }, 100);
        }, 100);
      } else {
        console.log('No vehicle details found in profile data');
        // Reset selections if no vehicle details
        setSelectedVehicleType(null);
        setSelectedManufacturer(null);
        setSelectedVehicleModel(null);
      }
    } else {
      console.log('No profile data received, setting as new profile');
      setIsNewProfile(true);
      // Reset vehicle selections for new profile
      setSelectedVehicleType(null);
      setSelectedManufacturer(null);
      setSelectedVehicleModel(null);
    }
  }, [profileQueryData]);

  // Add a debug effect for vehicle selections
  useEffect(() => {
    console.log('Current vehicle selections:', {
      type: selectedVehicleType,
      manufacturer: selectedManufacturer,
      model: selectedVehicleModel
    });
  }, [selectedVehicleType, selectedManufacturer, selectedVehicleModel]);

  // Fetch vehicle types using React Query
  const { data: vehicleTypesData } = useQuery<VehicleType[]>({
    queryKey: QUERY_KEYS.vehicleTypes,
    queryFn: async () => {
      const response = await apiService.vehicle.getTypes();
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000 // Consider data fresh for 30 minutes
  });

  // Update vehicle types when data changes
  useEffect(() => {
    if (vehicleTypesData) {
      setVehicleTypes(vehicleTypesData);
    }
  }, [vehicleTypesData]);

  // Fetch manufacturers using React Query
  const { data: manufacturersData } = useQuery<Manufacturer[]>({
    queryKey: QUERY_KEYS.manufacturers,
    queryFn: async () => {
      const response = await apiService.vehicle.getManufacturers();
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000 // Consider data fresh for 30 minutes
  });

  // Update manufacturers when data changes
  useEffect(() => {
    if (manufacturersData) {
      setManufacturers(manufacturersData);
    }
  }, [manufacturersData]);

  // Fetch vehicle models using React Query
  const { data: vehicleModelsData } = useQuery<VehicleModel[]>({
    queryKey: QUERY_KEYS.vehicleModels(selectedVehicleType, selectedManufacturer),
    queryFn: async () => {
      if (!selectedVehicleType && !selectedManufacturer) return [];
      
      const queryParams: Record<string, string> = {};
      if (selectedVehicleType) queryParams.vehicle_type = selectedVehicleType.toString();
      if (selectedManufacturer) queryParams.manufacturer = selectedManufacturer.toString();
      
      const response = await apiService.vehicle.getModels(queryParams);
      return Array.isArray(response.data) ? response.data : response.data.vehicle_models || [];
    },
    enabled: isAuthenticated && (!!selectedVehicleType || !!selectedManufacturer),
    staleTime: 5 * 60 * 1000 // Consider data fresh for 5 minutes
  });

  // Update vehicle models when data changes
  useEffect(() => {
    if (vehicleModelsData) {
      setVehicleModels(vehicleModelsData);
    }
  }, [vehicleModelsData]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      console.log('Sending to backend:', data); // Debug log
      const response = isNewProfile
        ? await apiService.profile.create(data)
        : await apiService.profile.update(data);
      console.log('Backend response:', response.data); // Debug log
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Mutation success, updated profile:', data); // Debug log
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      toast.success(`Profile ${isNewProfile ? 'created' : 'updated'} successfully!`);
      setIsEditing(false);
    },
    onError: (error: unknown) => {
      console.error('Profile update error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          navigate('/login');
        } else {
          const errorMessage = error.response?.data?.message || 
            Object.values(error.response?.data || {}).flat().join(', ') ||
            'Failed to update profile. Please try again.';
          toast.error(errorMessage);
        }
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    }
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsDrawerOpen(false);
    if (tab === 'change-password') {
      navigate('/reset-password');
    } else {
      navigate(`/profile${tab === 'profile' ? '' : `?tab=${tab}`}`, { replace: true });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update shared form data when common fields change
    const sharedFields = {
      name: 'name',
      email: 'email',
      phone: 'phone',
      address: 'address',
      city: 'city',
      state: 'state',
      postal_code: 'postalCode'
    };

    if (name in sharedFields) {
      updateSharedFormData({
        [sharedFields[name as keyof typeof sharedFields]]: value
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!formData.name?.trim()) {
        toast.error('Please enter your name');
        return;
      }
      if (!formData.phone?.trim()) {
        toast.error('Please enter your phone number');
        return;
      }
      if (!formData.address?.trim()) {
        toast.error('Please enter your address');
        return;
      }
      if (!formData.city?.trim()) {
        toast.error('Please enter your city');
        return;
      }
      if (!formData.state?.trim()) {
        toast.error('Please enter your state');
        return;
      }
      if (!formData.postal_code?.trim()) {
        toast.error('Please enter your postal code');
        return;
      }
      if (!formData.country?.trim()) {
        toast.error('Please enter your country');
        return;
      }

      console.log('Current selections:', { // Debug log
        selectedVehicleType,
        selectedManufacturer,
        selectedVehicleModel
      });

      const profileData: Partial<UserProfile> = {
        email: formData.email,
        username: formData.username,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        profile_photo: formData.profile_photo,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code,
        vehicle_model: selectedVehicleModel || null
      };

      console.log('Saving profile data:', profileData); // Debug log
      await updateProfileMutation.mutateAsync(profileData);
    } catch (error) {
      console.error('Error in handleSave:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(profileData || defaultProfile);
  };

  // Update useEffect for filtering vehicle models
  useEffect(() => {
    const filtered = vehicleModelsData?.filter(model => {
      const matchesType = !selectedVehicleType || model.vehicle_type === selectedVehicleType;
      const matchesManufacturer = !selectedManufacturer || model.manufacturer === selectedManufacturer;
      return matchesType && matchesManufacturer;
    }) || [];

    setFilteredModels(filtered);
  }, [selectedVehicleType, selectedManufacturer, vehicleModelsData]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm text-[#FF5733] hover:text-[#ff4019]"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="space-y-6">
              {/* Username and Email inline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                    <span className="text-gray-400 ml-1">(read-only)</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                    <span className="text-gray-400 ml-1">(read-only)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Name and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name {isEditing && <span className="text-red-500">*</span>}
                  </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                    placeholder={isEditing ? "Enter your full name" : ""}
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number {isEditing && <span className="text-red-500">*</span>}
                  </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                    placeholder={isEditing ? "Enter phone number with country code" : ""}
                    />
                  </div>
              </div>

              {/* Address */}
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address {isEditing && <span className="text-red-500">*</span>}
                </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                  placeholder={isEditing ? "Enter your street address" : ""}
                />
              </div>

              {/* City, State, and Postal Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                    placeholder={isEditing ? "Enter your city" : ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                    placeholder={isEditing ? "Enter your state" : ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                    placeholder={isEditing ? "Enter postal code" : ""}
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country {isEditing && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                  placeholder={isEditing ? "Enter your country" : ""}
                />
              </div>

              {/* Vehicle Information Section */}
              <div className="border-t pt-6 mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Vehicle Type Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      name="vehicle_type"
                      value={selectedVehicleType || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : null;
                        handleVehicleSelectionChange('type', value);
                      }}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                    >
                      <option value="">Select Vehicle Type</option>
                      {vehicleTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manufacturer Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer
                    </label>
                    <select
                      name="manufacturer"
                      value={selectedManufacturer || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : null;
                        handleVehicleSelectionChange('manufacturer', value);
                      }}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                    >
                      <option value="">Select Manufacturer</option>
                      {manufacturers.map((manufacturer) => (
                        <option key={manufacturer.id} value={manufacturer.id}>
                          {manufacturer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vehicle Model Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Model
                    </label>
                    <select
                      name="vehicle_model"
                      value={selectedVehicleModel || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : null;
                        handleVehicleSelectionChange('model', value);
                      }}
                      disabled={!isEditing || !selectedVehicleType || !selectedManufacturer}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                    >
                      <option value="">Select Vehicle Model</option>
                      {filteredModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                    {isEditing && (!selectedVehicleType || !selectedManufacturer) && (
                      <p className="mt-1 text-sm text-gray-500">
                        Please select both Vehicle Type and Manufacturer first
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733] disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="flex items-center">
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        {isNewProfile ? 'Creating...' : 'Saving...'}
                      </div>
                    ) : (
                      isNewProfile ? 'Create Profile' : 'Update Profile'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 'vehicles':
        return <ForSaleVehicles />;
      case 'bookings':
        return <BookedVehicles />;
      case 'repairs':
        return <MyRepairs />;
      case 'subscriptions':
        return <MySubscription />;

      default:
        return null;
    }
  };

  const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      <div className="space-y-1">
        <button
          onClick={() => handleTabChange('profile')}
          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
            activeTab === 'profile' ? 'text-[#FF5733] bg-[#FFF5F2]' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <User className="h-5 w-5 mr-3" />
          Profile Information
        </button>
        <button
          onClick={() => handleTabChange('vehicles')}
          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
            activeTab === 'vehicles' ? 'text-[#FF5733] bg-[#FFF5F2]' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Bike className="h-5 w-5 mr-3" />
          Vehicles for Sale
        </button>
        <button
          onClick={() => handleTabChange('repairs')}
          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
            activeTab === 'repairs' ? 'text-[#FF5733] bg-[#FFF5F2]' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Wrench className="h-5 w-5 mr-3" />
          My Repairs
        </button>
        <button
          onClick={() => handleTabChange('bookings')}
          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
            activeTab === 'bookings' ? 'text-[#FF5733] bg-[#FFF5F2]' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Clock className="h-5 w-5 mr-3" />
          My Bookings
        </button>
        <button
          onClick={() => handleTabChange('subscriptions')}
          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
            activeTab === 'subscriptions' ? 'text-[#FF5733] bg-[#FFF5F2]' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Subscription className="h-5 w-5 mr-3" />
          My Subscriptions
        </button>
        <button
          onClick={() => handleTabChange('change-password')}
          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
            activeTab === 'change-password' ? 'text-[#FF5733] bg-[#FFF5F2]' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Settings className="h-5 w-5 mr-3" />
          Change Password
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg mt-4"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm py-4 px-4 flex items-center justify-between">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween' }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white z-50 lg:hidden"
            >
              <div className="p-4 flex justify-end">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <Sidebar className="rounded-none shadow-none" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block lg:col-span-1"
          >
            <Sidebar />
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            {isProfileLoading ? (
              <div className="flex justify-center items-center p-4">
                <Loader className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading profile...</span>
              </div>
            ) : renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;