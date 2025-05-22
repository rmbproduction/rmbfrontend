/**
 * ServiceCheckout Component
 * 
 * This component handles service and subscription checkout flows.
 * 
 * User profile data handling:
 * - When a user enters information like address and phone number, it is automatically saved to:
 *   1. The user's profile in the backend via userProfileService if the user is logged in
 *   2. Local storage for persistence between sessions
 *   3. Session storage for immediate use in the current session
 * 
 * This ensures that the next time the user uses the application, their data (address, phone, etc.)
 * will be automatically pre-filled in all forms throughout the application.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from '../utils/noToast';
import { ArrowLeft, User, MapPin, Phone, Clock, CheckCircle, AlertTriangle, Navigation, Trash2, ShoppingCart, X, Calendar, Info, Plus, Bike } from 'lucide-react';
import { checkUserAuthentication } from '../utils/auth';
import ThankYouModal from '../components/ThankYouModal';
import { SubscriptionPlan } from '../models/subscription-plan';
import apiService, { userProfileService, serviceService } from '../services/apiService';
import { API_CONFIG } from '../config/api.config';
import LoadingSpinner from '../components/LoadingSpinner';
import MultiStepVehicleSelector from '../components/SelectVehicle';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CartItem as ModelCartItem } from '../models/cart-item';
import { VehicleData as ModelVehicleData } from '../models/vehicle-data';
import { ProfileData as ModelProfileData } from '../models/profile-data';
import { VehicleType as ModelVehicleType } from '../models/vehicle-type';
import { Manufacturer as ModelManufacturer } from '../models/manufacturer';
import { VehicleModel as ModelVehicleModel } from '../models/vehicle-model';
// Add import for our new profile data service
import userProfileDataService from '../services/userProfileDataService';
// Import MarketplaceService
import marketplaceService from '../services/marketplaceService';

interface CartItem {
  id: number;
  service_id: number;
  service_name: string;
  quantity: number;
  price: string;
  description?: string;
  features?: Array<{ id?: number; name: string } | string>;
}

interface VehicleData {
  vehicle_type: number;
  manufacturer: number;
  model: number;
  vehicle_type_name?: string;
  manufacturer_name?: string;
  model_name?: string;
  registration_number?: string;
  purchase_date?: string;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  scheduleDate: string;
  scheduleTime: string;
  latitude?: number;
  longitude?: number;
}

// Add new interfaces for vehicle selection
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
  manufacturer_id: number;
}

const ServiceCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if this is a subscription checkout
  const isSubscription = location.state?.isSubscription || false;
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    scheduleDate: '',
    scheduleTime: ''
  });
  const [basketItems, setBasketItems] = useState<CartItem[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add state for vehicle selection modal
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<VehicleModel[]>([]);
  const [newVehicle, setNewVehicle] = useState<VehicleData>({
    vehicle_type: 0,
    manufacturer: 0,
    model: 0
  });
  const [vehicleModalErrors, setVehicleModalErrors] = useState<Record<string, string>>({});
  const [loadingVehicleOptions, setLoadingVehicleOptions] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  
  // Use regular ref for address input
  const addressInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Add new state variables for distance pricing
  const [distanceFee, setDistanceFee] = useState<number>(0);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinFreeRadius, setIsWithinFreeRadius] = useState<boolean>(true);
  
  // Add state for thank you modal
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  
  // Function to fetch models for a specific manufacturer
  const loadModelsForManufacturer = useCallback(async (manufacturerId: number) => {
    if (!manufacturerId) return;
    
    setLoadingModels(true);
    try {
      const url = API_CONFIG.getApiUrl(`/repairing-service/vehicle-models/?manufacturer_id=${manufacturerId}`);
      console.log(`[DEBUG] Fetching models from: ${url}`);
      
      const modelsResponse = await fetch(url, {
        credentials: 'omit'
      });
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        console.log(`[DEBUG] Received ${modelsData.length} models for manufacturer ${manufacturerId}:`, modelsData);
        setFilteredModels(modelsData);
      } else {
        console.error(`[ERROR] Failed to fetch models for manufacturer ${manufacturerId}:`, modelsResponse.statusText);
        toast.error('Failed to load vehicle models');
        setFilteredModels([]);
      }
    } catch (error) {
      console.error(`[ERROR] Error loading models for manufacturer ${manufacturerId}:`, error);
      toast.error('Failed to load vehicle models');
      setFilteredModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, []);
  
  // Load vehicle options
  const loadVehicleOptions = useCallback(async () => {
    setLoadingVehicleOptions(true);
    try {
      console.log('[DEBUG] Loading vehicle options...');
      
      // Fetch vehicle types
      const typesResponse = await fetch(API_CONFIG.getApiUrl('/vehicle/vehicle-types/'), {
        credentials: 'omit'
      });
      
      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        console.log('[DEBUG] Received vehicle types:', typesData);
        setVehicleTypes(typesData);
      } else {
        console.error('[ERROR] Failed to fetch vehicle types:', typesResponse.statusText);
        toast.error('Failed to load vehicle types');
      }
      
      // Fetch manufacturers
      const mfgResponse = await fetch(API_CONFIG.getApiUrl('/repairing-service/manufacturers/'), {
        credentials: 'omit'
      });
      
      if (mfgResponse.ok) {
        const mfgData = await mfgResponse.json();
        console.log('[DEBUG] Received manufacturers:', mfgData);
        setManufacturers(mfgData);
      } else {
        console.error('[ERROR] Failed to fetch manufacturers:', mfgResponse.statusText);
        toast.error('Failed to load manufacturers');
      }
      
      // Fetch all vehicle models (as a backup)
      const modelsResponse = await fetch(API_CONFIG.getApiUrl('/repairing-service/vehicle-models/'), {
        credentials: 'omit'
      });
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        console.log('[DEBUG] Received all vehicle models:', modelsData);
        setVehicleModels(modelsData);
      } else {
        console.error('[ERROR] Failed to fetch all vehicle models:', modelsResponse.statusText);
        // Don't show toast here as it's a backup request
      }
    } catch (error) {
      console.error('[ERROR] Error loading vehicle options:', error);
      toast.error('Failed to load vehicle options');
    } finally {
      setLoadingVehicleOptions(false);
    }
  }, []);
  
  // Filter models based on selected manufacturer
  useEffect(() => {
    if (newVehicle.manufacturer && newVehicle.manufacturer > 0) {
      console.log(`[DEBUG] Manufacturer changed to ${newVehicle.manufacturer}, loading models...`);
      loadModelsForManufacturer(newVehicle.manufacturer);
    } else {
      console.log('[DEBUG] No manufacturer selected, clearing filtered models');
      setFilteredModels([]);
    }
  }, [newVehicle.manufacturer, loadModelsForManufacturer]);
  
  useEffect(() => {
    // Check authentication
    if (!checkUserAuthentication()) {
      toast.error('Please login to continue');
      navigate('/login-signup', { 
        state: { redirectTo: '/service-checkout' } 
      });
      return;
    }
    
    // Load subscription plan data if this is a subscription checkout
    if (isSubscription) {
      try {
        const planData = sessionStorage.getItem('subscriptionPlan');
        if (planData) {
          setSubscriptionPlan(JSON.parse(planData));
        }
      } catch (error) {
        console.error('Error loading subscription plan:', error);
      }
    } else {
      // Only load basket items for service checkouts (not subscriptions)
      const loadBasketItems = async () => {
        try {
          const cartId = sessionStorage.getItem('cartId');
          if (cartId) {
            console.log('[DEBUG] Loading basket items for cart:', cartId);
            const response = await fetch(API_CONFIG.getApiUrl(`/repairing-service/cart/${cartId}/`));
            
            if (response.ok) {
              const cartData = await response.json();
              if (cartData.items && Array.isArray(cartData.items)) {
                console.log('[DEBUG] Loaded basket items:', cartData.items);
                
                // Fetch complete service details for each item to get features
                const enhancedItems = await Promise.all(
                  cartData.items.map(async (item: CartItem) => {
                    try {
                      // Try to fetch detailed service information
                      const serviceResponse = await fetch(
                        API_CONFIG.getApiUrl(`/repairing-service/services/${item.service_id}/`)
                      );
                      
                      if (serviceResponse.ok) {
                        const serviceData = await serviceResponse.json();
                        // Add service features and description to the item
                        return {
                          ...item,
                          features: serviceData.features || [],
                          description: serviceData.description || ''
                        };
                      }
                      return item;
                    } catch (error) {
                      console.error(`[ERROR] Failed to fetch details for service ${item.service_id}:`, error);
                      return item;
                    }
                  })
                );
                
                setBasketItems(enhancedItems);
              }
            } else {
              console.error('[ERROR] Failed to fetch cart:', response.statusText);
            }
          } else {
            // Check if we have pending service data in session storage
            const pendingData = sessionStorage.getItem('pendingServiceData');
            if (pendingData) {
              try {
                const service = JSON.parse(pendingData);
                console.log('[DEBUG] Found pending service data:', service);
                
                // Check if this service already exists in basketItems
                const serviceExists = basketItems.some(item => 
                  item.service_id === service.id
                );
                
                if (!serviceExists) {
                  // Only add if not already in basketItems
                  let enhancedService = {
                    id: 0, // Temporary ID
                    service_id: service.id,
                    service_name: service.name,
                    quantity: service.quantity || 1,
                    price: service.price,
                    features: service.features || [],
                    description: service.description || ''
                  };
                  
                  setBasketItems(prev => [...prev, enhancedService]);
                }
              } catch (error) {
                console.error('[ERROR] Error handling pending service data:', error);
                sessionStorage.removeItem('pendingServiceData');
              }
            }
          }
        } catch (error) {
          console.error('[ERROR] Error loading basket items:', error);
        }
      };
      
      loadBasketItems();
    }
    
    // Check if we have checkout data saved from before login
    restoreCheckoutAfterLogin();
    
    // Load vehicle options when component mounts
    loadVehicleOptions();
    
    // Use the enhanced data loading function that combines all sources
    loadAllUserData()
      .then(() => {
        // Successfully loaded data
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading user data:', error);
        // Still set loading to false to prevent infinite loading state
        setLoading(false);
        // Show error notification
        toast.error('Some data could not be loaded. Please refresh or try again later.');
      });
      
    // No Google Maps cleanup needed
    return () => {
      // Empty cleanup function
    };
  }, [navigate, loadVehicleOptions, isSubscription]);
  
  // Add the new function to restore checkout data after login
  const restoreCheckoutAfterLogin = () => {
    try {
      const savedCheckoutData = sessionStorage.getItem('checkoutAfterLogin');
      if (!savedCheckoutData) return;
      
      const checkoutData = JSON.parse(savedCheckoutData);
      console.log('[DEBUG] Restoring checkout data after login:', checkoutData);
      
      // If this is a subscription checkout
      if (checkoutData.isSubscription) {
        // Check if we already have subscription plan loaded
        if (!subscriptionPlan && checkoutData.subscriptionPlanId) {
          // Fetch the subscription plans and find the one we need
          (apiService as any).getSubscriptionPlans()
            .then((plansData: any) => {
              // Find the specific plan by ID
              const planData = plansData.find((plan: any) => plan.id === parseInt(checkoutData.subscriptionPlanId));
              if (planData) {
                console.log('[DEBUG] Restored subscription plan:', planData);
                setSubscriptionPlan(planData);
                
                // Also restore vehicle if available
                if (checkoutData.vehicleId) {
                  console.log('[DEBUG] Restoring vehicle with ID:', checkoutData.vehicleId);
                  marketplaceService.getSellRequest(checkoutData.vehicleId)
                    .then((vehicleData: any) => setSelectedVehicle(vehicleData));
                }
              }
            })
            .catch((err: any) => {
              console.error('Error restoring subscription plan:', err);
            });
        }
      } else {
        // For regular service checkout
        if (checkoutData.cartId) {
          sessionStorage.setItem('cartId', checkoutData.cartId);
        }
      }
      
      // Restore profile data if available
      if (checkoutData.profileData) {
        try {
          const profileData = JSON.parse(checkoutData.profileData);
          setProfileData(prev => ({
            ...prev,
            ...profileData
          }));
          
          // Save to session storage
          saveProfileToSessionStorage(profileData);
        } catch (error) {
          console.error('Error parsing restored profile data:', error);
        }
      }
      
      // Restore vehicle if available
      if (checkoutData.vehicle) {
        try {
          const vehicle = JSON.parse(checkoutData.vehicle);
          setSelectedVehicle(vehicle);
          
          // Save to storage
          sessionStorage.setItem('userVehicleOwnership', JSON.stringify(vehicle));
          localStorage.setItem('userVehicleData', JSON.stringify(vehicle));
        } catch (error) {
          console.error('Error parsing restored vehicle data:', error);
        }
      }
      
      // Clear the saved checkout data to prevent duplicates
      sessionStorage.removeItem('checkoutAfterLogin');
      
      // Show a toast to inform the user
      toast.success('Your checkout information has been restored');
    } catch (error) {
      console.error('Error restoring checkout data:', error);
    }
  };
  
  // Add the new comprehensive data loading function
  const loadAllUserData = async () => {
    try {
      console.log('[DEBUG] Loading all user data');
      
      // Initialize profile data with default values
      setProfileData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        scheduleDate: '',
        scheduleTime: '',
        latitude: 0,
        longitude: 0
      });

      // Check multiple storage locations for vehicle data, prioritizing most recent and complete data
      
      // 1. First check session storage for pending vehicle data (from direct checkout flow)
      let foundVehicleData = false;
      const pendingVehicleData = sessionStorage.getItem('pendingVehicleData');
      
      if (pendingVehicleData) {
        try {
          const parsedVehicle = JSON.parse(pendingVehicleData);
          console.log('[DEBUG] Found pending vehicle data in sessionStorage:', parsedVehicle);
          
          // Check if it has the name fields
          if (parsedVehicle.vehicle_type_name && parsedVehicle.manufacturer_name && parsedVehicle.model_name) {
            console.log('[DEBUG] Using complete vehicle data from pendingVehicleData');
            setSelectedVehicle(parsedVehicle);
            foundVehicleData = true;
          } else {
            console.log('[DEBUG] Pending vehicle data missing name fields, will try other sources');
          }
        } catch (error) {
          console.error('Error parsing pending vehicle data:', error);
        }
      }
      
      // 2. Next check userVehicleOwnership in session storage
      if (!foundVehicleData) {
        const vehicleData = sessionStorage.getItem('userVehicleOwnership');
        if (vehicleData) {
          try {
            const parsedVehicle = JSON.parse(vehicleData);
            console.log('[DEBUG] Found vehicle data in userVehicleOwnership:', parsedVehicle);
            
            // Check if it has the name fields
            if (parsedVehicle.vehicle_type_name && parsedVehicle.manufacturer_name && parsedVehicle.model_name) {
              console.log('[DEBUG] Using complete vehicle data from userVehicleOwnership');
              setSelectedVehicle(parsedVehicle);
              foundVehicleData = true;
            } else {
              console.log('[DEBUG] Vehicle data missing name fields');
              // Also save to localStorage for better persistence
              localStorage.setItem('userVehicleData', JSON.stringify(parsedVehicle));
              setSelectedVehicle(parsedVehicle);
            }
          } catch (error) {
            console.error('Error parsing vehicle data:', error);
          }
        }
      }
      
      // After setting up vehicle, load user profile data if available
      try {
        // Load user profile from central service
        const storedProfile = userProfileDataService.getFullProfileData();
        if (storedProfile) {
          console.log('[DEBUG] Loaded user profile from service:', storedProfile);
          setProfileData(prev => ({
            ...prev,
            ...storedProfile
          }));
        }
      } catch (profileError) {
        console.error('Error loading profile data:', profileError);
      }
    } catch (error) {
      console.error('Error in loadAllUserData:', error);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Update local state
    setProfileData({ ...profileData, [name]: value });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }

    // For phone and address fields, also update in our centralized service
    if (name === 'phone' || name === 'address' || name === 'name' || 
        name === 'email' || name === 'city' || name === 'state' || name === 'postalCode') {
      // Map the field name to the profile data structure
      const profileField = name as keyof typeof profileData;
      
      // Save to our centralized service
      userProfileDataService.saveProfileData({
        [name]: value
      });
    }

    // For address field, provide manual coordinate handling
    if (name === 'address' && value) {
      // Use default coordinates for India when Maps API is not available
      const defaultLat = 28.6139; // Default Delhi coordinates
      const defaultLng = 77.2090;
      setProfileData(prev => ({
        ...prev,
        latitude: defaultLat,
        longitude: defaultLng
      }));

      // Calculate distance fee based on default coordinates
      try {
        calculateDistanceFee()
          .catch(err => {
            console.warn('Non-critical error calculating distance fee:', err);
            // Set default values if distance fee calculation fails
            setDistanceFee(0);
            setDistance(0);
            setIsWithinFreeRadius(true);
          });
      } catch (err) {
        console.warn('Error initiating distance fee calculation:', err);
        // Set default values if distance fee calculation fails
        setDistanceFee(0);
        setDistance(0);
        setIsWithinFreeRadius(true);
      }
    }
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!profileData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!profileData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9+\s-]{10,15}$/.test(profileData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!profileData.address.trim()) {
      errors.address = 'Service address is required';
    }

    // Check for schedule date and time
    if (!profileData.scheduleDate) {
      errors.scheduleDate = 'Please select a date for service';
    }
    
    if (!profileData.scheduleTime) {
      errors.scheduleTime = 'Please select a time for service';
    }
    
    setFormErrors(errors);

    // If there are errors, scroll to the first error field and show a toast
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        // Scroll to error element with some offset
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Show a toast with the error message
      toast.error('Please fill in all required fields', {
        position: 'top-center',
        autoClose: 3000,
      });
    }
    
    return Object.keys(errors).length === 0;
  };
  
  const calculateTotal = (): string => {
    return basketItems
      .reduce((total, item) => {
        const price = parseFloat(item.price);
        return total + (isNaN(price) ? 0 : price * item.quantity);
      }, 0)
      .toFixed(2);
  };
  
  // Handle vehicle selection in modal
  const handleVehicleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const typeId = parseInt(e.target.value);
    console.log(`[DEBUG] Vehicle type changed to: ${typeId}`);
    
    // Reset manufacturer and model when vehicle type changes
    setNewVehicle({ 
      vehicle_type: typeId, 
      manufacturer: 0, 
      model: 0 
    });
    
    setFilteredModels([]);
    setVehicleModalErrors({ ...vehicleModalErrors, vehicle_type: '' });
  };
  
  const handleManufacturerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mfgId = parseInt(e.target.value);
    console.log(`[DEBUG] Manufacturer changed to: ${mfgId}`);
    
    // Reset model when manufacturer changes
    setNewVehicle({ 
      ...newVehicle, 
      manufacturer: mfgId, 
      model: 0 
    });
    
    setVehicleModalErrors({ ...vehicleModalErrors, manufacturer: '' });
  };
  
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = parseInt(e.target.value);
    console.log(`[DEBUG] Model changed to: ${modelId}`);
    
    setNewVehicle({ 
      ...newVehicle, 
      model: modelId 
    });
    
    setVehicleModalErrors({ ...vehicleModalErrors, model: '' });
  };
  
  // Validate vehicle selection
  const validateVehicleSelection = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!newVehicle.vehicle_type) {
      errors.vehicle_type = 'Vehicle type is required';
    }
    
    if (!newVehicle.manufacturer) {
      errors.manufacturer = 'Manufacturer is required';
    }
    
    if (!newVehicle.model) {
      errors.model = 'Model is required';
    }
    
    console.log('[DEBUG] Vehicle validation errors:', errors);
    setVehicleModalErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Use a default fixed value for distance fee
  const calculateDistanceFee = async () => {
    return 0; // Return 0 as a fixed value for now
  };

  // Add a new function to sync checkout data with the user's account
  const syncCheckoutDataWithAccount = async (data: {
    profileData: ProfileData;
    vehicleData: VehicleData | null;
  }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('[DEBUG] No auth token found, skipping account sync');
        return false;
      }

      // Sync profile data with user's account using our centralized service
      try {
        // Format the profile data
        const profilePayload = {
          name: data.profileData.name,
          email: data.profileData.email,
          phone: data.profileData.phone,
          address: data.profileData.address,
          city: data.profileData.city,
          state: data.profileData.state,
          postalCode: data.profileData.postalCode
        };

        // Use our centralized service to save to the server
        await userProfileDataService.saveProfileToServer(profilePayload);
        console.log('[DEBUG] Updated user profile successfully');
      } catch (profileError) {
        console.error('[ERROR] Failed to update profile:', profileError);
        // Continue with vehicle update even if profile update fails
      }

      // If we have vehicle data, sync that too
      if (data.vehicleData) {
        const vehiclePayload = {
          vehicle_type: data.vehicleData.vehicle_type,
          manufacturer: data.vehicleData.manufacturer,
          model: data.vehicleData.model
        };

        try {
          // Save or update vehicle data
          await fetch(API_CONFIG.getApiUrl('/vehicle/user-vehicles/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(vehiclePayload)
          });
          console.log('[DEBUG] Updated vehicle data successfully');
        } catch (vehicleError) {
          console.error('[ERROR] Failed to update vehicle data:', vehicleError);
        }
      }
    } catch (error) {
      console.error('[ERROR] Failed to sync checkout data with account:', error);
      return false;
    }
  };

  // Update saveProfileToSessionStorage to use our centralized service
  const saveProfileToSessionStorage = (data: ProfileData) => {
    try {
      // Save to centralized profile service
      userProfileDataService.saveProfileData({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode
      });
      
      // Also save to sessionStorage for this specific component's needs
      sessionStorage.setItem('savedProfileData', JSON.stringify(data));
      
      console.log('Profile data saved successfully');
    } catch (e) {
      console.error('Error saving profile data:', e);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long', 
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  // Format time for display
  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    
    try {
      // Convert 24-hour format to 12-hour format with AM/PM
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12; // Convert 0 to 12
      
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };
  
  // Get number of visits from subscription plan description
  const getVisitCount = (plan: SubscriptionPlan | null): number => {
    if (!plan || !plan.description) return 1;
    
    const visitMatch = plan.description.match(/(\d+)\s*visits?/i);
    if (visitMatch && visitMatch[1]) {
      return parseInt(visitMatch[1], 10);
    }
    
    return 1;
  };
  
  // Format visits for display
  const formatVisits = (plan: SubscriptionPlan | null): string => {
    const visits = getVisitCount(plan);
    return `${visits} ${visits === 1 ? 'Visit' : 'Visits'}`;
  };
  
  // Open calendar modal for subscription
  const openCalendarModal = () => {
    if (subscriptionPlan) {
      setShowCalendarModal(true);
    }
  };
  
  // Handle date selection from calendar
  const handleDateSelection = (dates: Date[]) => {
    setSelectedDates(dates);
    setShowCalendarModal(false);
  };
  
  // Add helper function to calculate the end date based on subscription duration
  const getSubscriptionEndDate = (startDate: Date, duration: string): Date => {
    const endDate = new Date(startDate);
    
    if (duration.toLowerCase().includes('month')) {
      const months = parseInt(duration.match(/\d+/)?.[0] || '1');
      endDate.setMonth(endDate.getMonth() + months);
    } else if (duration.toLowerCase().includes('year')) {
      const years = parseInt(duration.match(/\d+/)?.[0] || '1');
      endDate.setFullYear(endDate.getFullYear() + years);
    }
    
    return endDate;
  };
  
  // Function to check if a date is within the subscription period
  const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
    return date >= startDate && date <= endDate;
  };
  
  // Open vehicle selection modal
  const openVehicleModal = () => {
    // If there's already a selected vehicle, pre-fill the form
    if (selectedVehicle) {
      console.log('[DEBUG] Pre-filling vehicle selection form with:', selectedVehicle);
      
      setNewVehicle({
        vehicle_type: selectedVehicle.vehicle_type,
        manufacturer: selectedVehicle.manufacturer,
        model: selectedVehicle.model
      });
      
      // Pre-load models for the selected manufacturer
      if (selectedVehicle.manufacturer) {
        loadModelsForManufacturer(selectedVehicle.manufacturer);
      }
    } else {
      // Reset form
      console.log('[DEBUG] Resetting vehicle selection form');
      setNewVehicle({
        vehicle_type: 0,
        manufacturer: 0,
        model: 0
      });
      setFilteredModels([]);
    }
    
    setVehicleModalErrors({});
    setShowVehicleModal(true);
  };
  
  // Handle vehicle selection (previously this navigated away)
  const handleVehicleSelection = () => {
    openVehicleModal();
  };
  
  // Enhance the vehicle selection save function to better persist the data
  const saveVehicleSelection = () => {
    if (!validateVehicleSelection()) {
      console.log('[DEBUG] Vehicle validation failed');
      return;
    }
    
    console.log('[DEBUG] Saving vehicle selection:', newVehicle);
    
    // Find names for selected IDs
    const typeObj = vehicleTypes.find(t => t.id === newVehicle.vehicle_type);
    const mfgObj = manufacturers.find(m => m.id === newVehicle.manufacturer);
    const modelObj = filteredModels.find(m => m.id === newVehicle.model) || 
                    vehicleModels.find(m => m.id === newVehicle.model);
    
    if (!typeObj || !mfgObj || !modelObj) {
      console.error('[ERROR] Could not find all vehicle details:', { 
        typeFound: !!typeObj, 
        mfgFound: !!mfgObj, 
        modelFound: !!modelObj 
      });
      toast.error('Could not save vehicle selection due to missing data');
      return;
    }
    
    // Create complete vehicle data object
    const completeVehicle: VehicleData = {
      ...newVehicle,
      vehicle_type_name: typeObj.name,
      manufacturer_name: mfgObj.name,
      model_name: modelObj.name,
      registration_number: `AUTO-${Date.now()}`,
      purchase_date: new Date().toISOString().split('T')[0],
    };
    
    console.log('[DEBUG] Complete vehicle data:', completeVehicle);
    
    // Update selected vehicle state
    setSelectedVehicle(completeVehicle);
    
    // Save to both session storage and local storage for better persistence
    sessionStorage.setItem('userVehicleOwnership', JSON.stringify(completeVehicle));
    localStorage.setItem('userVehicleData', JSON.stringify(completeVehicle));
    
    // Try to sync with user account in the background
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        // Fire and forget - don't wait for response
        fetch(API_CONFIG.getApiUrl('/vehicle/user-vehicles/'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            vehicle_type: completeVehicle.vehicle_type,
            manufacturer: completeVehicle.manufacturer,
            model: completeVehicle.model
          })
        }).catch(err => console.warn('Non-critical: Failed to sync vehicle with account:', err));
    } catch (error) {
        console.warn('Non-critical: Error initiating vehicle sync:', error);
      }
    }
    
    // Close modal
    setShowVehicleModal(false);
    
    toast.success('Vehicle selected successfully');
  };
  
  // Enhance the handleSubscriptionSubmit function to include better progress tracking and feedback
  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subscriptionPlan) {
      toast.error('No subscription plan selected');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    if (!selectedVehicle) {
      toast.error('Please select a vehicle for service');
      handleVehicleSelection();
      return;
    }
    
    // Save profile and vehicle data for future use
    saveProfileToSessionStorage(profileData);
    
    // Show a toast that we're processing
    const processingToast = toast.info('Processing your subscription request...', {
      autoClose: false,
      closeButton: false
    });
    
    setIsSubmitting(true);
    
    try {
      // Step 1: Sync with user account
      toast.update(processingToast, { 
        render: 'Syncing your data... (Step 1/3)',
        autoClose: false 
      });
      
      await syncCheckoutDataWithAccount({
        profileData,
        vehicleData: selectedVehicle
      });
      
      // Step 2: Process subscription
      toast.update(processingToast, { 
        render: 'Creating subscription... (Step 2/3)',
        autoClose: false 
      });
      
      // Get current date as start date
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split('T')[0];
      
      // Check if we're using the new subscription plan API or legacy API
      const isNewApiPlan = subscriptionPlan.plan_type !== undefined;
      
      if (isNewApiPlan) {
        // New API
        try {
          // Prepare customer info data
          const customerInfo = {
            customer_name: profileData.name,
            customer_email: profileData.email,
            customer_phone: profileData.phone,
            address: profileData.address,
            city: profileData.city,
            state: profileData.state,
            postal_code: profileData.postalCode,
          };
          
          // Prepare vehicle info data
          const vehicleInfo = {
            vehicle_type: selectedVehicle.vehicle_type,
            manufacturer: selectedVehicle.manufacturer,  // Changed from vehicle_manufacturer
            vehicle_model: selectedVehicle.model,
          };
          
          // Prepare schedule info
          const scheduleInfo = {
            schedule_date: profileData.scheduleDate || formattedDate,
            schedule_time: profileData.scheduleTime || '09:00',
          };
          
          // New API with enhanced data
          const response = await (apiService as any).createSubscriptionRequest(
            subscriptionPlan.id,
            customerInfo,
            vehicleInfo,
            scheduleInfo
          );
          
          // Store the request in sessionStorage for immediate display in My Subscriptions tab
          try {
            // Get existing requests or initialize empty array
            const storedRequests = sessionStorage.getItem('user_subscription_requests');
            const existingRequests = storedRequests ? JSON.parse(storedRequests) : [];
            
            // Add timestamp for sorting
            const requestWithTimestamp = {
              ...response,
              timestamp: Date.now()
            };
            
            // Add to existing requests and save back to sessionStorage
            const updatedRequests = [requestWithTimestamp, ...existingRequests];
            sessionStorage.setItem('user_subscription_requests', JSON.stringify(updatedRequests));
            console.log('[DEBUG] Updated subscription requests in sessionStorage:', updatedRequests);
          } catch (storageError) {
            console.error('[ERROR] Failed to update sessionStorage with new subscription request:', storageError);
          }
          
          // Step 3: Complete and update UI
          toast.update(processingToast, { 
            render: 'Finalizing your subscription request... (Step 3/3)',
            autoClose: false 
          });
          
          // Store subscription details for thank you page
          setBookingResult({
            id: response.id,
            isSubscription: true,
            plan: subscriptionPlan,
            status: response.status,
            request_date: response.request_date
          });
          
          // Show thank you modal
          setShowThankYouModal(true);
          
          // Close the processing toast
          toast.dismiss(processingToast);
          toast.success('Subscription request submitted successfully!');
          
          // Clear subscription plan from session storage to prevent duplicates
          sessionStorage.removeItem('subscriptionPlan');
        } catch (error: any) {
          toast.dismiss(processingToast);
          console.error('Error creating subscription request:', error);
          
          // Check if authentication error
          if (error.message?.includes('Authentication required')) {
            toast.error('Please log in to create a subscription');
            
            // Save checkout state for after login
            sessionStorage.setItem('checkoutAfterLogin', JSON.stringify({
              isSubscription: true,
              subscriptionPlanId: subscriptionPlan.id,
              profileData: JSON.stringify(profileData),
              vehicle: JSON.stringify(selectedVehicle)
            }));
            
            // Redirect to login
            navigate('/login-signup', { 
              state: { 
                redirectTo: '/service-checkout',
                subscriptionPlanId: subscriptionPlan.id
              } 
            });
            return;
          }
          
          toast.error(error.message || 'Failed to create subscription request');
        }
      } else {
        // Legacy API
        try {
          // Legacy API expects plan_option, vehicle and schedule_date
          const legacyPayload = {
            plan_option: subscriptionPlan.id,
            vehicle: selectedVehicle.vehicle_type,
            schedule_date: profileData.scheduleDate || formattedDate,
            schedule_time: profileData.scheduleTime || '09:00',
            vehicle_model: selectedVehicle.model,  // Include more vehicle data
            manufacturer: selectedVehicle.manufacturer,  // This is already correct
            customer_name: profileData.name,
            customer_phone: profileData.phone,
            customer_email: profileData.email,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
            postal_code: profileData.postalCode
          };
          
          // Call legacy API endpoint
          const response = await fetch(API_CONFIG.getApiUrl('/repairing-service/subscriptions/create/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
            body: JSON.stringify(legacyPayload)
      });
      
      if (!response.ok) {
            throw new Error(`Failed to create subscription (${response.status})`);
          }
          
          const result = await response.json();
          
          // Store the request in sessionStorage for immediate display in My Subscriptions tab
          try {
            // Get existing requests or initialize empty array
            const storedRequests = sessionStorage.getItem('user_subscription_requests');
            const existingRequests = storedRequests ? JSON.parse(storedRequests) : [];
            
            // Create a subscription request object from the result
            const subscriptionRequest = {
              id: result.id || Date.now(),
              user: result.user || null,
              username: result.username || localStorage.getItem('username') || '',
              plan_variant: subscriptionPlan.id,
              plan_name: subscriptionPlan.name,
              duration_type: subscriptionPlan.duration || 'monthly',
              price: subscriptionPlan.price?.toString() || '0',
              discounted_price: subscriptionPlan.discounted_price?.toString(),
              request_date: new Date().toISOString(),
              status: 'pending',
              status_display: 'Pending',
              customer_name: profileData.name,
              customer_email: profileData.email,
              customer_phone: profileData.phone,
              vehicle_type: selectedVehicle.vehicle_type,
              manufacturer: selectedVehicle.manufacturer,
              vehicle_model: selectedVehicle.model,
              timestamp: Date.now()
            };
            
            // Add to existing requests and save back to sessionStorage
            const updatedRequests = [subscriptionRequest, ...existingRequests];
            sessionStorage.setItem('user_subscription_requests', JSON.stringify(updatedRequests));
            console.log('[DEBUG] Updated subscription requests in sessionStorage with legacy API:', updatedRequests);
          } catch (storageError) {
            console.error('[ERROR] Failed to update sessionStorage with new subscription request (legacy):', storageError);
          }
          
          // Step 3: Complete and update UI
          toast.update(processingToast, { 
            render: 'Finalizing your subscription... (Step 3/3)',
            autoClose: false 
          });
          
          // Store subscription details for thank you page
          setBookingResult({
            ...result,
            isSubscription: true,
            plan: subscriptionPlan
          });
          
          // Show thank you modal
          setShowThankYouModal(true);
          
          // Close the processing toast
          toast.dismiss(processingToast);
          toast.success('Subscription created successfully!');
          
          // Clear subscription plan from session storage to prevent duplicates
          sessionStorage.removeItem('subscriptionPlan');
        } catch (error) {
          toast.dismiss(processingToast);
          console.error('Error creating legacy subscription:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to create subscription');
        }
      }
    } catch (error) {
      toast.dismiss(processingToast);
      console.error('Error in subscription process:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to clear basket items
  const clearBasket = () => {
    sessionStorage.removeItem('cartId');
    setBasketItems([]);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // Function to handle thank you modal close
  const handleThankYouClose = () => {
    setShowThankYouModal(false);
    clearBasket();
    navigate('/my-bookings');
  };

  const processBooking = async (cartId: string) => {
    // Validate basket items
    if (!basketItems || basketItems.length === 0) {
      console.error('[ERROR] No services in cart');
      toast.error('Please add services to your cart first.');
      return;
    }

    // Save profile data for future use
    saveProfileToSessionStorage(profileData);

    // Show a toast that we're processing
    const processingToast = toast.info('Processing your service booking...', {
      autoClose: false,
      closeButton: false
    });

    setIsSubmitting(true);

    try {
      // Step 1: Sync with user account
      toast.update(processingToast, { 
        render: 'Syncing your data... (Step 1/3)',
        autoClose: false 
      });

      await syncCheckoutDataWithAccount({
        profileData,
        vehicleData: selectedVehicle
      }).catch(err => {
        console.warn('Non-critical: Error syncing data:', err);
      });

      // Step 2: Create booking
      toast.update(processingToast, { 
        render: 'Creating your service booking... (Step 2/3)',
        autoClose: false 
      });

      // Create payload with all required data
      const payload = {
        cart_id: cartId,
        customer_name: profileData.name,
        customer_email: profileData.email,
        customer_phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        postal_code: profileData.postalCode,
        schedule_date: profileData.scheduleDate,
        schedule_time: profileData.scheduleTime,
        vehicle_type: selectedVehicle?.vehicle_type,
        manufacturer: selectedVehicle?.manufacturer,
        vehicle_model: selectedVehicle?.model,
        latitude: profileData.latitude,
        longitude: profileData.longitude
      };

      // Call API to create booking
      const response = await fetch(API_CONFIG.getApiUrl('/repairing-service/bookings/create/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to create booking (${response.status})`);
      }

      const result = await response.json();

      // Step 3: Finalize and update UI
      toast.update(processingToast, { 
        render: 'Finalizing your booking... (Step 3/3)',
        autoClose: false 
      });

      // Store booking details for thank you page
      setBookingResult({
        ...result,
        vehicle: {
          vehicle_type: selectedVehicle?.vehicle_type,
          manufacturer: selectedVehicle?.manufacturer,
          model: selectedVehicle?.model,
          vehicle_type_name: selectedVehicle?.vehicle_type_name || vehicleTypes.find(v => v.id === selectedVehicle?.vehicle_type)?.name,
          manufacturer_name: selectedVehicle?.manufacturer_name || manufacturers.find(m => m.id === selectedVehicle?.manufacturer)?.name,
          model_name: selectedVehicle?.model_name || vehicleModels.find(m => m.id === selectedVehicle?.model)?.name
        },
        schedule_date: profileData.scheduleDate,
        schedule_time: profileData.scheduleTime
      });

      // Show thank you modal
      setShowThankYouModal(true);

      // Clear cart after successful booking
      clearBasket();

      // Close the processing toast
      toast.dismiss(processingToast);
      toast.success('Booking created successfully!');
    } catch (err) {
      // Dismiss the processing toast
      toast.dismiss(processingToast);

      const error = err as Error;
      console.error('Error creating booking:', error);

      // Check if authentication error
      if (error.message.includes('Authentication required')) {
        toast.error('Please log in to create a booking');

        // Save checkout state for after login
        sessionStorage.setItem('checkoutAfterLogin', JSON.stringify({
          isSubscription: false,
          cartId: sessionStorage.getItem('cartId'),
          profileData: JSON.stringify(profileData),
          vehicle: JSON.stringify(selectedVehicle)
        }));

        // Redirect to login
        navigate('/login-signup', { 
          state: { redirectTo: '/service-checkout' } 
        });
        return;
      }

      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for cart and services
    const storedCartId = sessionStorage.getItem('cartId');

    try {
      if (!storedCartId) {
        console.log('[DEBUG] No cart found, creating new cart...');
        const cartResponse = await serviceService.createCart();
        if (!cartResponse || !cartResponse.id) {
          throw new Error('Failed to create cart');
        }
        const newCartId = cartResponse.id.toString();
        sessionStorage.setItem('cartId', newCartId);
        
        // Process with new cart
        await processBooking(newCartId);
      } else {
        // Process with existing cart
        await processBooking(storedCartId);
      }
    } catch (err) {
      const error = err as Error;
      console.error('[ERROR] Cart operation failed:', error);
      toast.error(error.message || 'Failed to process cart. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Your existing JSX */}
    </div>
  );
};

export default ServiceCheckout; 