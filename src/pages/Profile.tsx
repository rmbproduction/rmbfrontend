// Profile.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiService, CDN_CONFIG } from '../config/api.config';
import TokenManager from '../services/tokenManager';
import { motion } from 'framer-motion';
import { 
  User, MapPin, Bike, ChevronLeft, Loader2, Camera,
  Wrench, Clock, Wallet
} from 'lucide-react';
import axios from 'axios';
import { useUserProfile } from '../hooks/useUserProfile';

// Import tab components
import ForSaleVehicles from '../components/ForSaleVehicles';
import BookedVehicles from '../components/BookedVehicles';
import MyRepairs from './MyRepairs';
import SubscriptionOverview from '../components/subscription/SubscriptionOverview';

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
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  vehicle_type: number | null;
  manufacturer: number | null;
  vehicle_name: number | null;
  profile_picture?: File | null;
}

const initialFormData: ProfileFormData = {
  name: '',
  email: '',
  phone_number: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
  vehicle_type: null,
  manufacturer: null,
  vehicle_name: null,
  profile_picture: null
};

// Update the getCloudinaryUrl function
const getCloudinaryUrl = (url: string | undefined | null, size: 'thumbnail' | 'small' | 'medium' | 'original' = 'original'): string | undefined => {
  try {
    // If URL is empty or null, return undefined
    if (!url) {
      console.warn('Empty or null URL provided to getCloudinaryUrl');
      return undefined;
    }

    // If it's a data URL (from FileReader), return as is
    if (url.startsWith('data:')) {
      return url;
    }

    // If it's already a full Cloudinary URL, return as is
    if (url.startsWith('https://res.cloudinary.com')) {
      return url;
    }

    // If it's a full URL but not Cloudinary, return as is
    if (url.startsWith('http')) {
      return url;
    }

    // Handle the case where the URL is a relative path from the backend
    // The URL format from backend is like: "image/upload/v1749369482/profiles/nryer7tykrftajpy9clb.png"
    if (url.startsWith('image/upload/')) {
      const sizePath = size === 'original' ? '' : `/${size}`;
      const cloudinaryUrl = `https://res.cloudinary.com/${CDN_CONFIG.cloudName}/image/upload${sizePath}/${url}`;
      console.log('Generated Cloudinary URL:', cloudinaryUrl);
      return cloudinaryUrl;
    }

    // If we get here, the URL format is invalid
    console.warn('Invalid image URL format:', url);
    return undefined;
  } catch (error) {
    console.error('Error in getCloudinaryUrl:', error);
    return undefined;
  }
};

// Add image optimization function
const optimizeImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob with reduced quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              reject(new Error('Failed to optimize image'));
            }
          },
          'image/jpeg',
          0.8 // 80% quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

const Profile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'profile';
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [previewImage, setPreviewImage] = useState<string | undefined>(undefined);
  const { prefillFormData, updateSharedFormData } = useUserProfile();

  // Prefill profile form from shared data on mount
  useEffect(() => {
    const loadSharedData = async () => {
      const prefilled = await prefillFormData(initialFormData, 'profile');
      setFormData(prev => ({ ...prev, ...prefilled }));
    };
    loadSharedData();
  }, []);

  // Fetch vehicle types
  const fetchVehicleTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle/vehicle-types/`);
      if (!response.ok) {
        throw new Error('Failed to fetch vehicle types');
      }
      const data = await response.json();
      setVehicleTypes(data);
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      toast.error('Failed to load vehicle types');
    }
  };

  // Fetch manufacturers
  const fetchManufacturers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle/manufacturers/`);
      if (!response.ok) {
        throw new Error('Failed to fetch manufacturers');
      }
      const data = await response.json();
      setManufacturers(data);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      toast.error('Failed to load manufacturers');
    }
  };

  // Fetch vehicle models
  const fetchVehicleModels = async (vehicleType: number, manufacturer: number) => {
    try {
      const response = await axios.get<VehicleModel[]>(`${API_BASE_URL}/vehicle/vehicle-models/`, {
        params: {
          vehicle_type: vehicleType,
          manufacturer: manufacturer
        }
      });
      setVehicleModels(response.data);
      } catch (error) {
      console.error('Error fetching vehicle models:', error);
      toast.error('Failed to load vehicle models');
    }
  };

  // Initial load of vehicle types and manufacturers
  useEffect(() => {
    fetchVehicleTypes();
    fetchManufacturers();
    fetchProfile();
  }, []);

  // Update the fetchProfile function
  const fetchProfile = async () => {
    try {
      const response = await apiService.profile.getDetails();
      const profileData = response.data;
      
      // Log the profile data to see the URL format
      console.log('Profile data:', profileData);
      
      setFormData(prev => ({
        ...prev,
        name: profileData.name || '',
        email: profileData.email || '',
        phone_number: profileData.phone_number || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        postal_code: profileData.postal_code || '',
        country: profileData.country || '',
        vehicle_type: profileData.vehicle_type?.id || null,
        manufacturer: profileData.manufacturer?.id || null,
        vehicle_name: profileData.vehicle_name?.id || null
      }));

      // Handle profile photo with responsive images
      if (profileData.profile_photo) {
        try {
          console.log('Profile photo URL from backend:', profileData.profile_photo);
          
          // Construct the full Cloudinary URL
          const cloudinaryUrl = `https://res.cloudinary.com/${CDN_CONFIG.cloudName}/${profileData.profile_photo}`;
          console.log('Constructed Cloudinary URL:', cloudinaryUrl);
          
          // Create a new image object to test the URL
          const img = new Image();
          img.onload = () => {
            console.log('Profile image loaded successfully');
            setPreviewImage(cloudinaryUrl);
          };
          img.onerror = (error) => {
            console.error('Error loading profile image:', error);
            setPreviewImage(undefined);
          };
          img.src = cloudinaryUrl;
        } catch (error) {
          console.error('Error setting profile image:', error);
          setPreviewImage(undefined);
        }
      } else {
        setPreviewImage(undefined);
      }

      // If both vehicle type and manufacturer exist, fetch vehicle models
      if (profileData.vehicle_type?.id && profileData.manufacturer?.id) {
        fetchVehicleModels(profileData.vehicle_type.id, profileData.manufacturer.id);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    }
  };

  // Fetch vehicle models when both vehicle type and manufacturer are selected
  useEffect(() => {
    if (formData.vehicle_type && formData.manufacturer) {
      fetchVehicleModels(formData.vehicle_type, formData.manufacturer);
    } else {
      // Reset vehicle models if either selection is cleared
      setVehicleModels([]);
    }
  }, [formData.vehicle_type, formData.manufacturer]);

  const validateForm = (): boolean => {
    const requiredFields: (keyof ProfileFormData)[] = [
      'name',
      'email',
      'phone_number',
      'address',
      'city',
      'state',
      'postal_code',
      'country',
      'vehicle_type',
      'manufacturer',
      'vehicle_name'
    ];

    // Check for missing required fields
    const missingFields = requiredFields.filter(field => {
      const value = formData[field];
      return value === null || value === undefined || value === '';
    });

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.map(field => field.replace(/_/g, ' ')).join(', ')}`);
      return false;
    }

    // Validate phone number (must be less than 15 characters per backend)
    if (formData.phone_number && formData.phone_number.length > 15) {
      toast.error('Phone number must be less than 15 characters');
      return false;
    }

    // Validate postal code (must be 6 digits)
    if (formData.postal_code && !/^\d{6}$/.test(formData.postal_code)) {
      toast.error('Postal code must be exactly 6 digits');
      return false;
    }

    // Validate vehicle relationships
    if (!formData.vehicle_type || !formData.manufacturer || !formData.vehicle_name) {
      toast.error('Please select all vehicle information');
      return false;
    }

    return true;
  };

  // Update the handleChange function
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (e.target instanceof HTMLInputElement && e.target.type === 'file') {
      const file = e.target.files?.[0];
      if (file) {
        try {
          // Show loading state
          setIsLoading(true);
          
          // Optimize the image
          const optimizedFile = await optimizeImage(file);
          
          setFormData(prev => ({
            ...prev,
            profile_picture: optimizedFile
          }));
          
          // Preview logic
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log('Setting preview image:', reader.result);
            setPreviewImage(reader.result as string);
          };
          reader.readAsDataURL(optimizedFile);
        } catch (error) {
          console.error('Error optimizing image:', error);
          toast.error('Failed to process image. Please try a different image.');
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      // Update shared form data for two-way sync
      if ([
        'name', 'email', 'phone_number', 'address', 'city', 'state', 'postal_code'
      ].includes(name)) {
        updateSharedFormData({
          name: name === 'name' ? value : formData.name,
          email: name === 'email' ? value : formData.email,
          phone: name === 'phone_number' ? value : formData.phone_number,
          address: name === 'address' ? value : formData.address,
          city: name === 'city' ? value : formData.city,
          state: name === 'state' ? value : formData.state,
          postalCode: name === 'postal_code' ? value : formData.postal_code,
        });
      }
    }
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields to FormData
      (Object.keys(formData) as Array<keyof ProfileFormData>).forEach(key => {
        if (key === 'profile_picture' && formData[key] instanceof File) {
          formDataToSend.append('profile_photo', formData[key] as File);
        } else if (key !== 'profile_picture' && formData[key] !== null) {
          formDataToSend.append(key, formData[key]?.toString() || '');
        }
      });

      // Log the form data for debugging
      console.log('Form data being sent:', {
        ...Object.fromEntries(formDataToSend),
        profile_photo: formData.profile_picture ? 'File present' : 'No file'
      });

      const response = await apiService.profile.update(formDataToSend);

      // Log the response data to see the URL format
      console.log('Profile update response:', response);

      // Update the preview image with the new URL
      if (response.data.profile_photo) {
        const cloudinaryUrl = getCloudinaryUrl(response.data.profile_photo, 'medium');
        console.log('New profile photo URL:', cloudinaryUrl);
        setPreviewImage(cloudinaryUrl);
      }

      toast.success('Profile updated successfully!');
      // Update shared form data after successful save
      updateSharedFormData({
        name: formData.name,
        email: formData.email,
        phone: formData.phone_number,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postal_code,
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  // Render the appropriate tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
            {/* Profile Picture Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-[#FF5733]" />
                </div>
                <h3 className="font-semibold">Profile Picture</h3>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Profile Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error loading image:', {
                            src: previewImage,
                            error: e
                          });
                          setPreviewImage(undefined);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <User className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <label 
                    htmlFor="profile_picture" 
                    className="absolute bottom-0 right-0 bg-[#FF5733] text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-[#ff4019] transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    type="file"
                    id="profile_picture"
                    name="profile_picture"
                    onChange={handleChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Click the camera icon to upload a profile picture
                </p>
              </div>
            </motion.div>

            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#FF5733]" />
                </div>
                <h3 className="font-semibold">Personal Information</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name *"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                    required
                  />
                  </div>
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      placeholder="Email Address"
                      className="w-full px-4 py-2 border rounded-lg bg-gray-100 border-gray-300"
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="Phone Number *"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                    required
                    maxLength={15}
                  />
                </div>
              </div>
            </motion.div>

            {/* Address Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#FF5733]" />
                </div>
                <h3 className="font-semibold">Address Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street Address *"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City *"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State *"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      placeholder="Postal Code *"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                      maxLength={6}
                      pattern="[0-9]{6}"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Country *"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Vehicle Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                  <Bike className="w-5 h-5 text-[#FF5733]" />
                </div>
                <h3 className="font-semibold">Vehicle Information</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <select
                      name="vehicle_type"
                      value={formData.vehicle_type || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                    >
                      <option value="">Select Vehicle Type *</option>
                      {vehicleTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      name="manufacturer"
                      value={formData.manufacturer || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                    >
                      <option value="">Select Manufacturer *</option>
                      {manufacturers.map(mfr => (
                        <option key={mfr.id} value={mfr.id}>{mfr.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      name="vehicle_name"
                      value={formData.vehicle_name || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                      disabled={!formData.vehicle_type || !formData.manufacturer}
                    >
                      <option value="">Select Vehicle Model *</option>
                      {vehicleModels.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FF5733] text-white py-3 rounded-lg hover:bg-[#ff4019] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </motion.div>
          </form>
        );
      case 'vehicles':
        return <ForSaleVehicles />;
      case 'repairs':
        return <MyRepairs />;
      case 'bookings':
        return <BookedVehicles />;
      case 'subscriptions':
        return <SubscriptionOverview />;
      default:
        return (
          <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
            {/* Profile Picture Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-[#FF5733]" />
                </div>
                <h3 className="font-semibold">Profile Picture</h3>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Profile Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error loading image:', {
                            src: previewImage,
                            error: e
                          });
                          setPreviewImage(undefined);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <User className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <label 
                    htmlFor="profile_picture" 
                    className="absolute bottom-0 right-0 bg-[#FF5733] text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-[#ff4019] transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    type="file"
                    id="profile_picture"
                    name="profile_picture"
                    onChange={handleChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Click the camera icon to upload a profile picture
                </p>
              </div>
            </motion.div>

            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#FF5733]" />
                </div>
                <h3 className="font-semibold">Personal Information</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name *"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                    required
                  />
                  </div>
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      placeholder="Email Address"
                      className="w-full px-4 py-2 border rounded-lg bg-gray-100 border-gray-300"
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="Phone Number *"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                    required
                    maxLength={15}
                  />
                </div>
              </div>
            </motion.div>

            {/* Address Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#FF5733]" />
                </div>
                <h3 className="font-semibold">Address Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street Address *"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City *"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State *"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      placeholder="Postal Code *"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                      maxLength={6}
                      pattern="[0-9]{6}"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Country *"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Vehicle Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                  <Bike className="w-5 h-5 text-[#FF5733]" />
                </div>
                <h3 className="font-semibold">Vehicle Information</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <select
                      name="vehicle_type"
                      value={formData.vehicle_type || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                    >
                      <option value="">Select Vehicle Type *</option>
                      {vehicleTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      name="manufacturer"
                      value={formData.manufacturer || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                    >
                      <option value="">Select Manufacturer *</option>
                      {manufacturers.map(mfr => (
                        <option key={mfr.id} value={mfr.id}>{mfr.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      name="vehicle_name"
                      value={formData.vehicle_name || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] border-gray-300"
                      required
                      disabled={!formData.vehicle_type || !formData.manufacturer}
                    >
                      <option value="">Select Vehicle Model *</option>
                      {vehicleModels.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FF5733] text-white py-3 rounded-lg hover:bg-[#ff4019] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </motion.div>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Profile Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Tabs */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <nav className="space-y-1">
                {[
                  { id: 'profile', label: 'Profile Information', icon: User },
                  { id: 'vehicles', label: 'Vehicles for Sale', icon: Bike },
                  { id: 'repairs', label: 'My Repairs', icon: Wrench },
                  { id: 'bookings', label: 'My Bookings', icon: Clock },
                  { id: 'subscriptions', label: 'My Subscriptions', icon: Wallet },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-[#FFF5F2] text-[#FF5733] border-l-4 border-[#FF5733]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;