import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings, LogOut, Key, Bike, Bell, 
  CreditCard, MapPin, Clock, Shield, Menu, X,
  Loader, Wrench, CreditCard as Subscription
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import ForSaleVehicles from '../components/ForSaleVehicles';
import BookedVehicles from '../components/BookedVehicles';
import MyRepairs from './MyRepairs';
import MySubscription from '../components/subscription/MySubscription';
import { apiService, API_ENDPOINTS } from '../config/api.config';
import { ProfileUpdateData } from '../schemas/auth';
import axios from 'axios';
import { useUserProfile } from '../hooks/useUserProfile';

interface UserProfile {
  email: string;
  username: string;
  name: string;
  phone: string;
  address: string;
  profile_photo: string | null;
  vehicle_name: number | null;
  vehicle_type: number | null;
  manufacturer: number | null;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  preferred_location?: string;
}

interface SidebarProps {
  className?: string;
}

type TabType = 'profile' | 'vehicles' | 'bookings' | 'repairs' | 'subscriptions' | 'change-password';

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
  manufacturer_name: string;
  vehicle_type: number;
  vehicle_type_name: string;
  image: string | null;
}

const defaultProfile: UserProfile = {
  email: '',
  username: '',
  name: '',
  phone: '',
  address: '',
  profile_photo: null,
  vehicle_name: null,
  vehicle_type: null,
  manufacturer: null,
  city: '',
  state: '',
  country: '',
  postal_code: '',
  preferred_location: ''
};

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { updateProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserProfile>(defaultProfile);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [isLoadingVehicleData, setIsLoadingVehicleData] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(true);
  const [vehicleDataLoaded, setVehicleDataLoaded] = useState(false);

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
    if (user && user.profile) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        name: user.profile.name || '',
        phone: user.profile.phone || '',
        address: user.profile.address || '',
        city: user.profile.city || '',
        state: user.profile.state || '',
        country: user.profile.country || '',
        postal_code: user.profile.postal_code || '',
        vehicle_name: user.profile.vehicle_name || null,
        vehicle_type: user.profile.vehicle_type || null,
        manufacturer: user.profile.manufacturer || null,
        profile_photo: user.profile.profile_photo || null
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

  // Fetch profile data
  const fetchProfileData = async () => {
    try {
      console.log('Fetching profile data...');
      const response = await apiService.profile.getDetails();
      console.log('Fetched profile data:', response.data);

      if (response.data) {
        const profileData = response.data;
        setProfileData(profileData);
        setIsNewProfile(false);
        
        // Update form data with received profile data
        setFormData({
          username: profileData.username || '',
          email: profileData.email || '',
          name: profileData.name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          country: profileData.country || '',
          postal_code: profileData.postal_code || '',
          vehicle_name: profileData.vehicle_name || null,
          vehicle_type: profileData.vehicle_type || null,
          manufacturer: profileData.manufacturer || null,
          profile_photo: profileData.profile_photo || null
        });

        // Update the profile in AuthContext
        if (updateProfile) {
          await updateProfile(profileData);
        }

        console.log('Updated form data:', {
          before: formData,
          after: profileData
        });
      } else {
        setIsNewProfile(true);
        console.log('No profile data found, using default form data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    }
  }, [isAuthenticated]);

  // Fetch vehicle data
  const fetchVehicleData = async () => {
    try {
      setIsLoadingVehicleData(true);
      console.log('Fetching vehicle data...');

      const [typesRes, manufacturersRes, modelsRes] = await Promise.all([
        apiService.vehicle.getTypes(),
        apiService.vehicle.getManufacturers(),
        apiService.vehicle.getModels()
      ]);

      console.log('Vehicle Data Loaded:', {
        types: typesRes.data,
        manufacturers: manufacturersRes.data,
        models: modelsRes.data
      });

      setVehicleTypes(typesRes.data);
      setManufacturers(manufacturersRes.data);
      setVehicleModels(modelsRes.data);
      setVehicleDataLoaded(true);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      toast.error('Failed to load vehicle information');
    } finally {
      setIsLoadingVehicleData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchVehicleData();
    }
  }, [isAuthenticated]);

  // Handle vehicle type change
  const handleVehicleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const typeId = e.target.value ? Number(e.target.value) : null;
    console.log('Vehicle Type Changed:', { typeId });
    
    setFormData(prev => ({
      ...prev,
      vehicle_type: typeId,
      manufacturer: null, // Reset dependent fields
      vehicle_name: null
    }));
  };

  // Handle manufacturer change
  const handleManufacturerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const manufacturerId = e.target.value ? Number(e.target.value) : null;
    console.log('Manufacturer Changed:', { manufacturerId });
    
    setFormData(prev => ({
      ...prev,
      manufacturer: manufacturerId,
      vehicle_name: null // Reset dependent field
    }));
  };

  // Handle vehicle model change
  const handleVehicleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = e.target.value ? Number(e.target.value) : null;
    console.log('Vehicle Model Changed:', { modelId });
    
    setFormData(prev => ({
      ...prev,
      vehicle_name: modelId
    }));
  };

  // Filter models based on selected manufacturer and type
  const getFilteredModels = () => {
    return vehicleModels.filter(model => 
      (!formData.manufacturer || model.manufacturer === formData.manufacturer) &&
      (!formData.vehicle_type || model.vehicle_type === formData.vehicle_type)
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-[#FF5733] mx-auto" />
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or no user data, show error state
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Authentication Required</h2>
          <p className="mt-2 text-gray-600">Please log in to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handlePasswordChange = () => {
    navigate('/reset-password');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsDrawerOpen(false);
    navigate(`/profile${tab === 'profile' ? '' : `?tab=${tab}`}`, { replace: true });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // Convert vehicle-related fields to numbers
    if (['vehicle_name', 'vehicle_type', 'manufacturer'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: value ? Number(value) : null
      }));
    } else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Basic validation
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

      // Prepare data for API
      const profileData = {
        email: formData.email,
        username: formData.username,
        name: formData.name,
        address: formData.address,
        profile_photo: formData.profile_photo,
        vehicle_name: formData.vehicle_name,
        vehicle_type: formData.vehicle_type,
        manufacturer: formData.manufacturer,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code,
        phone: formData.phone
      };

      let response;
      if (isNewProfile) {
        response = await apiService.profile.create(profileData);
        setIsNewProfile(false);
      } else {
        response = await apiService.profile.update(profileData);
      }

      // Update both local state and profile cache in one go
      const updatedData = response.data;
      setFormData(updatedData);
      await updateProfile(updatedData);
      
      toast.success(`Profile ${isNewProfile ? 'created' : 'updated'} successfully!`);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error saving profile:', error);
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(profileData || defaultProfile);
  };

  const upcomingServices = [
    {
      id: 1,
      service: 'Premium Tune-Up',
      date: '2024-03-15',
      time: '10:00 AM',
      status: 'Scheduled'
    },
    {
      id: 2,
      service: 'Brake Service',
      date: '2024-03-20',
      time: '2:30 PM',
      status: 'Pending'
    }
  ];

  const serviceHistory = [
    {
      id: 3,
      service: 'Basic Maintenance',
      date: '2024-02-10',
      mechanic: 'Mike Smith',
      rating: 5
    },
    {
      id: 4,
      service: 'Tire Replacement',
      date: '2024-01-15',
      mechanic: 'Sarah Johnson',
      rating: 4
    }
  ];

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

              {/* Vehicle Information */}
              {renderVehicleDropdowns()}

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
      case 'change-password':
        return <div>Change Password</div>;
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

  // Update the vehicle dropdowns in the render section
  const renderVehicleDropdowns = () => (
    <div className="pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Type
          </label>
          <select
            name="vehicle_type"
            value={formData.vehicle_type || ''}
            onChange={handleVehicleTypeChange}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
          >
            <option value="">Select vehicle type</option>
            {vehicleTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Manufacturer
          </label>
          <select
            name="manufacturer"
            value={formData.manufacturer || ''}
            onChange={handleManufacturerChange}
            disabled={!isEditing || !formData.vehicle_type}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
          >
            <option value="">Select manufacturer</option>
            {manufacturers.map((mfr) => (
              <option key={mfr.id} value={mfr.id}>
                {mfr.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Model
          </label>
          <select
            name="vehicle_name"
            value={formData.vehicle_name || ''}
            onChange={handleVehicleModelChange}
            disabled={!isEditing || !formData.manufacturer}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
          >
            <option value="">Select model</option>
            {getFilteredModels().map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
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
                  <X className="h-6 w-6 text-gray-600" />
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
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;