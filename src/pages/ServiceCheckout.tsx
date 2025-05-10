import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from '../utils/noToast';
import { ArrowLeft, User, MapPin, Phone, Clock, CheckCircle, AlertTriangle, Navigation, Trash2, ShoppingCart, X, Calendar, Info } from 'lucide-react';
import { checkUserAuthentication } from '../utils/auth';
import ThankYouModal from '../components/ThankYouModal';
import { SubscriptionPlan } from '../models/subscription-plan';
import { apiService } from '../services/api.service';
import { API_CONFIG } from '../config/api.config';

// Declare google maps and initMap on the window object
declare global {
  interface Window {
    // Remove Google Maps related properties
  }
}

interface CartItem {
  id: number;
  service_id: number;
  service_name: string;
  quantity: number;
  price: string;
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
      const url = API_CONFIG.getApiUrl(`/repairing_service/vehicle-models/?manufacturer_id=${manufacturerId}`);
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
      const mfgResponse = await fetch(API_CONFIG.getApiUrl('/repairing_service/manufacturers/'), {
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
      const modelsResponse = await fetch(API_CONFIG.getApiUrl('/repairing_service/vehicle-models/'), {
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
    }
    
    // Check if we have checkout data saved from before login
    restoreCheckoutAfterLogin();
    
    // Load vehicle options when component mounts
    loadVehicleOptions();
    
    // Use the enhanced data loading function that combines all sources
    loadAllUserData()
      .finally(() => {
        setLoading(false);
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
          apiService.getSubscriptionPlans()
            .then((plansData) => {
              // Find the specific plan by ID
              const planData = plansData.find(plan => plan.id === parseInt(checkoutData.subscriptionPlanId));
              if (planData) {
                console.log('[DEBUG] Restored subscription plan:', planData);
                setSubscriptionPlan(planData);
                
                // Store in session storage for consistency
                sessionStorage.setItem('subscriptionPlan', JSON.stringify(planData));
              } else {
                console.warn('Could not find subscription plan with ID:', checkoutData.subscriptionPlanId);
              }
            })
            .catch((err) => {
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
      // First try to load data from the user's account (most authoritative)
      const token = localStorage.getItem('accessToken');
      let loadedFromAccount = false;
      
      if (token) {
        try {
          // Fetch user profile data
          const profileResponse = await fetch(API_CONFIG.getApiUrl('/accounts/profile/'), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (profileResponse.ok) {
            const accountData = await profileResponse.json();
            console.log('[DEBUG] Loaded profile data from account:', accountData);
            
            // Update profile data with account information
            setProfileData(prev => ({
              ...prev,
              name: accountData.name || prev.name,
              email: accountData.email || prev.email,
              phone: accountData.phone || prev.phone,
              address: accountData.address || prev.address,
              city: accountData.city || prev.city,
              state: accountData.state || prev.state,
              postalCode: accountData.postal_code || prev.postalCode
            }));
            
            loadedFromAccount = true;
          }
          
          // Fetch user's vehicles
          const vehiclesResponse = await fetch(API_CONFIG.getApiUrl('/vehicle/user-vehicles/'), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (vehiclesResponse.ok) {
            const vehiclesData = await vehiclesResponse.json();
            console.log('[DEBUG] Loaded vehicles from account:', vehiclesData);
            
            // Use the most recently added vehicle if available
            if (vehiclesData.length > 0) {
              const latestVehicle = vehiclesData[vehiclesData.length - 1];
              
              // Need to fetch names for the vehicle data
              try {
                // Fetch vehicle type name
                const typeResponse = await fetch(API_CONFIG.getApiUrl(`/vehicle/vehicle-types/${latestVehicle.vehicle_type}/`), {
                  credentials: 'omit'
                });
                
                let typeName = '';
                if (typeResponse.ok) {
                  const typeData = await typeResponse.json();
                  typeName = typeData.name;
                }
                
                // Fetch manufacturer name
                const mfgResponse = await fetch(API_CONFIG.getApiUrl('/repairing_service/manufacturers/'), {
                  credentials: 'omit'
                });
                
                let mfgName = '';
                if (mfgResponse.ok) {
                  const manufacturers = await mfgResponse.json();
                  const manufacturer = manufacturers.find((m: any) => m.id == latestVehicle.manufacturer);
                  if (manufacturer) {
                    mfgName = manufacturer.name;
                  }
                }
                
                // Fetch model name
                const modelResponse = await fetch(API_CONFIG.getApiUrl(`/repairing_service/vehicle-models/?manufacturer_id=${latestVehicle.manufacturer}`), {
                  credentials: 'omit'
                });
                
                let modelName = '';
                if (modelResponse.ok) {
                  const models = await modelResponse.json();
                  const model = models.find((m: any) => m.id == latestVehicle.model);
                  if (model) {
                    modelName = model.name;
                  }
                }
                
                // Create a complete vehicle object
                const completeVehicle: VehicleData = {
                  vehicle_type: latestVehicle.vehicle_type,
                  manufacturer: latestVehicle.manufacturer,
                  model: latestVehicle.model,
                  vehicle_type_name: typeName,
                  manufacturer_name: mfgName,
                  model_name: modelName,
                  registration_number: latestVehicle.registration_number || '',
                  purchase_date: latestVehicle.purchase_date || ''
                };
                
                // Set the selected vehicle
                setSelectedVehicle(completeVehicle);
                
                // Save to session storage for consistency
                sessionStorage.setItem('userVehicleOwnership', JSON.stringify(completeVehicle));
                localStorage.setItem('userVehicleData', JSON.stringify(completeVehicle));
              } catch (vehicleError) {
                console.error('Error fetching vehicle details:', vehicleError);
              }
            }
          }
        } catch (accountError) {
          console.error('Error fetching from user account:', accountError);
        }
      }
      
      // Then try to load from sessionStorage for returning users
      if (!loadedFromAccount) {
      try {
        const savedData = sessionStorage.getItem('savedProfileData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('[DEBUG] Loading profile data from sessionStorage:', parsedData);
            setProfileData(prev => ({
              ...prev,
              name: parsedData.name || prev.name,
              email: parsedData.email || prev.email,
              phone: parsedData.phone || prev.phone,
              address: parsedData.address || prev.address,
              city: parsedData.city || prev.city,
              state: parsedData.state || prev.state,
              postalCode: parsedData.postalCode || prev.postalCode,
              scheduleDate: parsedData.scheduleDate || prev.scheduleDate,
              scheduleTime: parsedData.scheduleTime || prev.scheduleTime,
              latitude: parsedData.latitude || prev.latitude,
              longitude: parsedData.longitude || prev.longitude
            }));
        }
      } catch (error) {
        console.error('Error parsing saved profile data:', error);
      }

      // Then check localStorage for user profile
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        try {
          const profile = JSON.parse(userProfile);
            setProfileData(prev => ({
              ...prev,
              name: profile.name || prev.name,
              email: profile.email || prev.email,
              phone: profile.phone || prev.phone,
              address: profile.address || prev.address,
              city: profile.city || prev.city,
              state: profile.state || prev.state,
              postalCode: profile.postal_code || prev.postalCode
            }));
        } catch (error) {
          console.error('Error parsing profile data:', error);
        }
      } else {
        // Try to get user details from the auth token
        const userJson = localStorage.getItem('user');
        if (userJson) {
          try {
            const user = JSON.parse(userJson);
            setProfileData(prev => ({
              ...prev,
                name: user.username || prev.name,
                email: user.email || prev.email,
            }));
          } catch (error) {
            console.error('Error parsing user data:', error);
            }
          }
        }
      }
      
      // Load vehicle data if not already loaded from account
      if (!selectedVehicle) {
        // First try localStorage for more persistence
        const localVehicleData = localStorage.getItem('userVehicleData');
        if (localVehicleData) {
          try {
            const parsedVehicle = JSON.parse(localVehicleData);
            setSelectedVehicle(parsedVehicle);
          } catch (error) {
            console.error('Error parsing local vehicle data:', error);
          }
        } else {
          // Try sessionStorage as fallback
          const sessionVehicleData = sessionStorage.getItem('userVehicleOwnership');
          if (sessionVehicleData) {
            try {
              const parsedVehicle = JSON.parse(sessionVehicleData);
          
          // If we have IDs but not names, fetch the details from API
          if (parsedVehicle.vehicle_type && parsedVehicle.manufacturer && parsedVehicle.model &&
              (!parsedVehicle.vehicle_type_name || !parsedVehicle.manufacturer_name || !parsedVehicle.model_name)) {
            
            // Fetch vehicle type name if needed
            try {
              const typeResponse = await fetch(API_CONFIG.getApiUrl(`/vehicle/vehicle-types/${parsedVehicle.vehicle_type}/`), {
                credentials: 'omit'
              });
              
              if (typeResponse.ok) {
                const typeData = await typeResponse.json();
                parsedVehicle.vehicle_type_name = typeData.name;
              }
            } catch (error) {
              console.error('Error fetching vehicle type:', error);
            }
            
            // Fetch manufacturer name if needed
            try {
              const mfgResponse = await fetch(API_CONFIG.getApiUrl('/repairing_service/manufacturers/'), {
                credentials: 'omit'
              });
              
              if (mfgResponse.ok) {
                const manufacturers = await mfgResponse.json();
                const manufacturer = manufacturers.find((m: any) => m.id == parsedVehicle.manufacturer);
                if (manufacturer) {
                  parsedVehicle.manufacturer_name = manufacturer.name;
                }
              }
            } catch (error) {
              console.error('Error fetching manufacturers:', error);
            }
            
            // Fetch model name if needed
            try {
              const modelResponse = await fetch(API_CONFIG.getApiUrl(`/repairing_service/vehicle-models/?manufacturer_id=${parsedVehicle.manufacturer}`), {
                credentials: 'omit'
              });
              
              if (modelResponse.ok) {
                const models = await modelResponse.json();
                const model = models.find((m: any) => m.id == parsedVehicle.model);
                if (model) {
                  parsedVehicle.model_name = model.name;
                }
              }
            } catch (error) {
              console.error('Error fetching vehicle models:', error);
            }
            
            // Update sessionStorage with the enhanced data
            sessionStorage.setItem('userVehicleOwnership', JSON.stringify(parsedVehicle));
                // Also save to localStorage for better persistence
                localStorage.setItem('userVehicleData', JSON.stringify(parsedVehicle));
          }
          
          setSelectedVehicle(parsedVehicle);
        } catch (error) {
          console.error('Error parsing vehicle data:', error);
        }
      }
        }
      }
    
    // Load basket items
      try {
        // Get the cart ID from sessionStorage
        const cartId = sessionStorage.getItem('cartId');
        const pendingServiceData = sessionStorage.getItem('pendingServiceData');
        
        // If there's no cart ID, attempt to use the pending service data
        if (!cartId) {
        if (pendingServiceData) {
          try {
            const serviceData = JSON.parse(pendingServiceData);
              console.log('[DEBUG] Creating local basket item from pending service data');
              
              setBasketItems([{
                id: 0, // Temporary ID
                  service_id: serviceData.id,
                service_name: serviceData.name,
                  quantity: serviceData.quantity || 1,
                price: serviceData.price?.replace('₹', '') || '0'
              }]);
              
              // Create a new cart with the pending service
              const createCartAndAddPendingService = async () => {
                try {
              const createCartResponse = await fetch(API_CONFIG.getApiUrl('/repairing_service/cart/create/'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'omit'
              });
              
                  if (createCartResponse.ok) {
              const cartData = await createCartResponse.json();
              const newCartId = cartData.id;
              sessionStorage.setItem('cartId', newCartId.toString());
              
              await fetch(API_CONFIG.getApiUrl(`/repairing_service/cart/${newCartId}/add/`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  service_id: serviceData.id,
                  quantity: serviceData.quantity || 1,
                  service_name: serviceData.name
                }),
                credentials: 'omit'
              });
              
                    // Clear the pending service data to prevent duplication
              sessionStorage.removeItem('pendingServiceData');
                    
                    // Dispatch event to update other components
                    window.dispatchEvent(new Event('cartUpdated'));
            }
          } catch (error) {
                  console.error('[DEBUG] Failed to recreate cart:', error);
                }
              };
              
              createCartAndAddPendingService();
              return;
            } catch (error) {
              console.error('Error creating local basket item:', error);
            }
          }
          setBasketItems([]);
          return;
        }
        
        // Fetch cart items from API
        console.log(`[DEBUG] Fetching cart data for cart ID: ${cartId}`);
        // Change from /cart/{id}/items/ to /cart/{id}/ to match backend
        const response = await fetch(API_CONFIG.getApiUrl(`/repairing_service/cart/${cartId}/`), {
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[DEBUG] Cart data received:', data);
        
        // Check if the cart is empty and we have pending service data
        if (!data.items || data.items.length === 0) {
          console.log('[DEBUG] Cart has no items, checking for fallback data');
          
          // If cart is empty but we have pending service data, try to create a local basket item
          if (pendingServiceData) {
            try {
              const serviceData = JSON.parse(pendingServiceData);
              console.log('[DEBUG] Creating local basket item from pending service data');
              
              setBasketItems([{
                id: 0, // Temporary ID
                service_id: serviceData.id,
                service_name: serviceData.name,
                quantity: serviceData.quantity || 1,
                price: serviceData.price?.replace('₹', '') || '0'
              }]);
              
              // If we have a local basket item but no items in the cart, add the pending service to the cart
              setTimeout(() => {
                const createCartAndAddPendingService = async () => {
                  try {
                    await fetch(API_CONFIG.getApiUrl(`/repairing_service/cart/${cartId}/add/`), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          service_id: serviceData.id,
                          quantity: serviceData.quantity || 1,
                          service_name: serviceData.name
                        }),
                        credentials: 'omit'
                      });
                    
                    // Clear the pending service data to prevent duplication
                    sessionStorage.removeItem('pendingServiceData');
                      
                      // Dispatch event to update other components
                      window.dispatchEvent(new Event('cartUpdated'));
                  } catch (error) {
                    console.error('[DEBUG] Failed to add pending service to cart:', error);
                  }
                };
                
                createCartAndAddPendingService();
              }, 500);
              
              return;
            } catch (error) {
              console.error('Error creating local basket item:', error);
            }
          }
        } else {
          // If we already have items in the cart, we can safely clear the pending service data
          if (pendingServiceData) {
            console.log('[DEBUG] Clearing pending service data as we already have items in cart');
            sessionStorage.removeItem('pendingServiceData');
          }
        }
        
        setBasketItems(data.items || []);
        
        // Optional: If we have items in the cart now, dispatch an event to update other components
        if (data.items && data.items.length > 0) {
          window.dispatchEvent(new Event('cartUpdated'));
        }
      } catch (error) {
        console.error('Error loading basket items:', error);
        toast.error('Failed to load your repair items');
        setBasketItems([]);
      }
    } catch (error) {
      console.error('Error in loadAllUserData:', error);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
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

      // Sync profile data with user's account
      const profilePayload = {
        name: data.profileData.name,
        email: data.profileData.email,
        phone: data.profileData.phone,
        address: data.profileData.address,
        city: data.profileData.city,
        state: data.profileData.state,
        postal_code: data.profileData.postalCode
      };

      // Update user profile
      await fetch(API_CONFIG.getApiUrl('/accounts/profile/'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profilePayload)
      });

      // If we have vehicle data, sync that too
      if (data.vehicleData) {
        const vehiclePayload = {
          vehicle_type: data.vehicleData.vehicle_type,
          manufacturer: data.vehicleData.manufacturer,
          model: data.vehicleData.model
        };

        // Save or update vehicle data
        await fetch(API_CONFIG.getApiUrl('/vehicle/user-vehicles/'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(vehiclePayload)
        });
      }

      // Update localStorage with latest profile data
      const updatedProfile = {
        ...data.profileData,
        lastSynced: new Date().toISOString()
      };
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      console.log('[DEBUG] Successfully synced checkout data with user account');
      return true;
    } catch (error) {
      console.error('[ERROR] Failed to sync checkout data with account:', error);
      return false;
    }
  };

  // Improve the saveProfileToSessionStorage function to also update localStorage
  const saveProfileToSessionStorage = (data: ProfileData) => {
    try {
      // Store the data with a timestamp
      const storageData = {
        ...data,
        savedAt: new Date().toISOString()
      };
      
      // Save to sessionStorage for current session
      sessionStorage.setItem('savedProfileData', JSON.stringify(storageData));
      
      // Also update localStorage for longer persistence
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        try {
          const profile = JSON.parse(userProfile);
          const updatedProfile = {
            ...profile,
            name: data.name || profile.name,
            email: data.email || profile.email,
            phone: data.phone || profile.phone,
            address: data.address || profile.address,
            city: data.city || profile.city,
            state: data.state || profile.state,
            postal_code: data.postalCode || profile.postal_code,
            schedule_date: data.scheduleDate || profile.schedule_date,
            schedule_time: data.scheduleTime || profile.schedule_time,
            lastUpdated: new Date().toISOString()
          };
          localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        } catch (error) {
          console.error('Error updating localStorage profile:', error);
        }
      }
      
      console.log('[DEBUG] Saved profile data to storage:', storageData);
    } catch (error) {
      console.error('Error saving profile data to storage:', error);
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
          const response = await apiService.createSubscriptionRequest(
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
          const response = await fetch(API_CONFIG.getApiUrl('/repairing_service/subscriptions/create/'), {
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

  // Enhance the standard submission handler for services checkout
  const handleServiceSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!selectedVehicle) {
      toast.error('Please select a vehicle for service');
      handleVehicleSelection();
      return;
    }
    
    if (basketItems.length === 0) {
      toast.error('Your cart is empty. Please add services before checkout.');
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
      
      // Step 2: Get cart info and create booking
      toast.update(processingToast, { 
        render: 'Creating your service booking... (Step 2/3)',
        autoClose: false 
      });
      
      // Get cart ID from session storage
      const cartId = sessionStorage.getItem('cartId');
      
      if (!cartId) {
        throw new Error('No cart found');
      }
      
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
        vehicle_type: selectedVehicle.vehicle_type,
        manufacturer: selectedVehicle.manufacturer,
        vehicle_model: selectedVehicle.model,
        latitude: profileData.latitude,
        longitude: profileData.longitude
      };
      
      // Call API to create booking
      const response = await fetch(API_CONFIG.getApiUrl('/repairing_service/bookings/create/'), {
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
      setBookingResult(result);
      
      // Show thank you modal
      setShowThankYouModal(true);
      
      // Clear cart after successful booking
      sessionStorage.removeItem('cartId');
      
      // Dispatch event to update other components
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Close the processing toast
      toast.dismiss(processingToast);
      toast.success('Booking created successfully!');
    } catch (error) {
      // Dismiss the processing toast
      toast.dismiss(processingToast);
      
      console.error('Error creating booking:', error);
      
      // Check if authentication error
      if (error instanceof Error && error.message.includes('Authentication required')) {
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
      
      toast.error(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modify the form submission handler to use the appropriate enhanced submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubscription) {
      handleSubscriptionSubmit(e);
    } else {
      handleServiceSubmit();
    }
  };
  
  // Handle thank you modal close
  const handleThankYouClose = () => {
    setShowThankYouModal(false);
    navigate('/#services');
  };
  
  // Add clearBasket function after handleVehicleSelection function
  const clearBasket = async () => {
    try {
      const confirmed = window.confirm('Are you sure you want to clear all items from your basket?');
      if (!confirmed) return;
      
      // Check if we have any temporary items (ID 0)
      const hasTemporaryItem = basketItems.some(item => item.id === 0);
      if (hasTemporaryItem) {
        // Clear pendingServiceData and update local state
        sessionStorage.removeItem('pendingServiceData');
        setBasketItems([]);
        toast.success('Basket cleared successfully');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('cartUpdated'));
        
        // Navigate back after clearing
        navigate('/#services');
        return;
      }
      
      // For regular items, call the API
      const cartId = sessionStorage.getItem('cartId');
      if (!cartId) {
        toast.error('No basket found');
        return;
      }
      
      const response = await fetch(API_CONFIG.getApiUrl(`/repairing_service/cart/${cartId}/clear/`), {
        method: 'DELETE',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear basket');
      }
      
      // Clear basket items
      setBasketItems([]);
      toast.success('Basket cleared successfully');
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Navigate back after clearing
      navigate('/#services');
    } catch (error) {
      console.error('Error clearing basket:', error);
      toast.error('Failed to clear your basket');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }
  
  return (
    <div className="py-12 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-8 border-b pb-4">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mr-4 p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-3xl font-bold text-gray-900">Complete Your Booking</h2>
              </div>
              <div className="hidden sm:block">
                <img src="/dist/assets/logo.png" alt="Repair My Bike" className="h-10" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-2/3 space-y-6">
                  {/* Vehicle Selection */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="bg-amber-100 p-2 rounded-lg mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      Choose Your Vehicle
                    </h3>
                    
                    {selectedVehicle ? (
                      <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <div className="bg-amber-100 p-3 rounded-full mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m12 0v10m0 0v-2m0 2h-4" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-lg">
                              {selectedVehicle.vehicle_type_name}
                            </p>
                            <p className="text-gray-600">
                              {selectedVehicle.manufacturer_name} {selectedVehicle.model_name}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={openVehicleModal}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
                        <div className="inline-flex justify-center items-center w-16 h-16 mb-4 bg-amber-100 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-gray-600 mb-4">Please select a vehicle for service</p>
                        <button
                          type="button"
                          onClick={openVehicleModal}
                          className="bg-[#FF5733] text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-md"
                        >
                          Select Vehicle
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Personal Information */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="bg-blue-100 p-2 rounded-lg mr-3">
                        <User className="h-5 w-5 text-blue-600" />
                      </span>
                      Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-colors`}
                          placeholder="Enter your full name"
                        />
                        {formErrors.name && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {formErrors.name}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-colors"
                          placeholder="Enter your email"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border ${formErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-colors`}
                          placeholder="Enter your phone number"
                        />
                        {formErrors.phone && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {formErrors.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Address Information */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="bg-green-100 p-2 rounded-lg mr-3">
                        <MapPin className="h-5 w-5 text-green-600" />
                      </span>
                      Service Address
                    </h3>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        ref={addressInputRef}
                        name="address"
                        value={profileData.address}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border ${formErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-colors`}
                        placeholder="Enter your address"
                        rows={2}
                      />
                      {formErrors.address && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {formErrors.address}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={profileData.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-colors"
                          placeholder="City"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={profileData.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-colors"
                          placeholder="State"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={profileData.postalCode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-colors"
                          placeholder="Postal Code"
                        />
                      </div>
                    </div>
                    
                    {profileData.latitude && profileData.longitude && (
                      <div className="mt-4 text-sm text-green-600 flex items-center p-2 bg-green-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Location coordinates captured for accurate service delivery
                      </div>
                    )}
                  </div>
                  
                  {/* Schedule Information */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="bg-purple-100 p-2 rounded-lg mr-3">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </span>
                      Schedule Service
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="scheduleDate"
                          value={profileData.scheduleDate}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className={`w-full px-4 py-3 border ${formErrors.scheduleDate ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-colors`}
                        />
                        {formErrors.scheduleDate && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {formErrors.scheduleDate}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Time <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="scheduleTime"
                          value={profileData.scheduleTime}
                          onChange={handleSelectChange}
                          className={`w-full px-4 py-3 border ${formErrors.scheduleTime ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-colors`}
                        >
                          <option value="">Select a time slot</option>
                          <option value="09:00">9:00 AM</option>
                          <option value="10:00">10:00 AM</option>
                          <option value="11:00">11:00 AM</option>
                          <option value="12:00">12:00 PM</option>
                          <option value="13:00">1:00 PM</option>
                          <option value="14:00">2:00 PM</option>
                          <option value="15:00">3:00 PM</option>
                          <option value="16:00">4:00 PM</option>
                          <option value="17:00">5:00 PM</option>
                        </select>
                        {formErrors.scheduleTime && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {formErrors.scheduleTime}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-600">
                      <p>Our service technicians are available from 9AM to 5PM daily. Please choose a convenient time slot.</p>
                    </div>
                  </div>
                </div>
                
                <div className="w-full lg:w-1/3">
                  <div className="sticky top-6 space-y-6">
                    <div className="bg-gradient-to-br from-[#FFEBE5] to-[#FFF5F2] rounded-xl border border-[#FFCFC0] shadow-sm overflow-hidden">
                      <div className="p-4 bg-[#FF5733] text-white text-lg font-semibold flex justify-between items-center">
                        <span>{isSubscription ? 'Subscription Details' : 'Order Summary'}</span>
                        {!isSubscription && basketItems.length > 0 && (
                          <button 
                            onClick={clearBasket}
                            className="text-white hover:text-red-100 text-sm flex items-center"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear All
                          </button>
                        )}
                      </div>
                      
                      <div className="p-6">
                        {isSubscription && subscriptionPlan ? (
                          <div>
                            {/* Plan Name and Description */}
                            <div className="py-3 border-b border-gray-200">
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-xl text-gray-900">{subscriptionPlan.name}</h3>
                                {subscriptionPlan.plan_type === 'premium' && (
                                  <span className="bg-[#FFC107] text-[#333333] text-xs px-3 py-1 rounded-full font-bold">
                                    PREMIUM
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm">{subscriptionPlan.description}</p>
                            </div>
                            
                            {/* Plan Pricing */}
                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                              <span className="font-medium text-gray-800">Pricing</span>
                              <div className="text-right">
                                {subscriptionPlan.discounted_price ? (
                                  <>
                                    <span className="font-semibold text-[#FF5733] text-lg">₹{subscriptionPlan.discounted_price}</span>
                                    <span className="ml-2 text-gray-400 line-through text-sm">₹{subscriptionPlan.price}</span>
                                  </>
                                ) : (
                                  <span className="font-semibold text-[#FF5733] text-lg">₹{subscriptionPlan.price}</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Plan Duration */}
                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                              <span className="font-medium text-gray-800">Duration</span>
                              <span className="font-semibold text-gray-800">{subscriptionPlan.duration_display || subscriptionPlan.duration}</span>
                            </div>
                            
                            {/* Service Visits */}
                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                              <span className="font-medium text-gray-800">Service Visits</span>
                              <span className="font-semibold text-gray-800">
                                {subscriptionPlan.max_visits || getVisitCount(subscriptionPlan)} visits
                              </span>
                            </div>
                            
                            {/* Features List */}
                            {subscriptionPlan.features && subscriptionPlan.features.length > 0 && (
                              <div className="py-3 border-b border-gray-200">
                                <h4 className="font-medium text-gray-800 mb-2">Features:</h4>
                                <ul className="space-y-2">
                                  {subscriptionPlan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start">
                                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                      <span className="text-gray-600 text-sm">{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Visit Selection Button - This is for informational purposes only as scheduling happens later */}
                            <div className="py-3 border-b border-gray-200">
                              <div className="flex items-center text-gray-600 text-sm mb-2">
                                <Info className="h-4 w-4 mr-2 text-blue-500" />
                                <span>After your subscription is approved, you'll be able to schedule your service visits.</span>
                              </div>
                            </div>
                            
                            <div className="pt-4 mt-2">
                              <div className="flex justify-between font-bold text-lg text-gray-900">
                                <span>Total</span>
                                <span>₹{subscriptionPlan.discounted_price || subscriptionPlan.price}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Standard service basket remains unchanged
                          basketItems.length === 0 ? (
                          <div className="py-8 text-center">
                            <div className="inline-flex justify-center items-center w-16 h-16 mb-4 bg-red-100 rounded-full">
                              <ShoppingCart className="h-8 w-8 text-red-500" />
                            </div>
                            <p className="text-gray-600 mb-4">Your repairs basket is empty</p>
                            <button
                              type="button"
                              onClick={() => navigate('/#services')}
                              className="bg-[#FF5733] text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
                            >
                              Browse Services
                            </button>
                          </div>
                        ) : (
                          <div>
                            {basketItems.map(item => (
                              <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.service_name}</p>
                                  {item.quantity > 1 && (
                                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                  )}
                                </div>
                                <span className="font-semibold text-gray-900">₹{
                                  (parseFloat(item.price) * item.quantity).toFixed(2)
                                }</span>
                              </div>
                            ))}
                            
                            {distanceFee > 0 && (
                              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                <div>
                                  <p className="font-medium text-gray-900">Distance Fee</p>
                                  <p className="text-xs text-gray-500">Based on your location</p>
                                </div>
                                <span className="font-semibold text-gray-900">₹{distanceFee.toFixed(2)}</span>
                              </div>
                            )}
                            
                            <div className="pt-4 mt-2">
                              <div className="flex justify-between font-bold text-lg text-gray-900">
                                <span>Total</span>
                                <span>₹{calculateTotal()}</span>
                              </div>
                            </div>
                          </div>
                          )
                        )}
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting || (isSubscription ? !subscriptionPlan : basketItems.length === 0)}
                      className={`w-full ${
                        (isSubscription ? !subscriptionPlan : basketItems.length === 0) 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-[#FF5733] hover:bg-opacity-90'
                      } text-white px-6 py-4 rounded-xl font-medium transition-colors shadow-md text-lg flex justify-center items-center`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                          Processing...
                        </>
                      ) : (
                        isSubscription ? 'Confirm Subscription' : 'Confirm Booking'
                      )}
                    </button>
                    
                    <div className="text-center text-sm text-gray-500 mt-4">
                      <p>By confirming, you agree to our <span className="text-[#FF5733]">Terms & Conditions</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Vehicle Selection Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowVehicleModal(false)} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Vehicle</h2>
            
            {loadingVehicleOptions ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF5733] mb-2"></div>
                <p className="text-gray-600">Loading vehicle options...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Vehicle Type Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newVehicle.vehicle_type || ''}
                    onChange={handleVehicleTypeChange}
                    className={`w-full px-4 py-3 border ${vehicleModalErrors.vehicle_type ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-colors`}
                  >
                    <option value="">Select Vehicle Type</option>
                    {vehicleTypes.length === 0 ? (
                      <option value="" disabled>No vehicle types available</option>
                    ) : (
                      vehicleTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))
                    )}
                  </select>
                  {vehicleModalErrors.vehicle_type && (
                    <p className="text-red-500 text-sm mt-1">{vehicleModalErrors.vehicle_type}</p>
                  )}
                </div>
                
                {/* Manufacturer Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newVehicle.manufacturer || ''}
                    onChange={handleManufacturerChange}
                    disabled={!newVehicle.vehicle_type}
                    className={`w-full px-4 py-3 border ${vehicleModalErrors.manufacturer ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-colors ${!newVehicle.vehicle_type ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Manufacturer</option>
                    {manufacturers.length === 0 ? (
                      <option value="" disabled>No manufacturers available</option>
                    ) : (
                      manufacturers.map(mfg => (
                        <option key={mfg.id} value={mfg.id}>{mfg.name}</option>
                      ))
                    )}
                  </select>
                  {vehicleModalErrors.manufacturer && (
                    <p className="text-red-500 text-sm mt-1">{vehicleModalErrors.manufacturer}</p>
                  )}
                </div>
                
                {/* Model Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                    <span>Model <span className="text-red-500">*</span></span>
                    {loadingModels && (
                      <span className="text-xs text-blue-600 flex items-center">
                        <div className="mr-1 h-3 w-3 border-t-1 border-b-1 border-blue-600 rounded-full animate-spin"></div>
                        Loading models...
                      </span>
                    )}
                  </label>
                  <select
                    value={newVehicle.model || ''}
                    onChange={handleModelChange}
                    disabled={!newVehicle.manufacturer || loadingModels}
                    className={`w-full px-4 py-3 border ${vehicleModalErrors.model ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-colors ${(!newVehicle.manufacturer || loadingModels) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Model</option>
                    {loadingModels ? (
                      <option value="" disabled>Loading models...</option>
                    ) : filteredModels.length === 0 ? (
                      <option value="" disabled>No models available for this manufacturer</option>
                    ) : (
                      filteredModels.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))
                    )}
                  </select>
                  {vehicleModalErrors.model && (
                    <p className="text-red-500 text-sm mt-1">{vehicleModalErrors.model}</p>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowVehicleModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveVehicleSelection}
                    disabled={loadingVehicleOptions || loadingModels}
                    className={`px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-opacity-90 transition-colors ${(loadingVehicleOptions || loadingModels) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Save Vehicle
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add the ThankYouModal component */}
      {showThankYouModal && bookingResult && (
        <ThankYouModal
          type={bookingResult.isSubscription ? "subscription" : "booking"}
          onClose={handleThankYouClose}
          title={bookingResult.isSubscription
            ? (bookingResult.status === 'pending' ? "Subscription Request Submitted!" : "Subscription Confirmed!")
            : "Booking Confirmed!"}
          message={bookingResult.isSubscription
            ? (bookingResult.status === 'pending' 
                ? "Thank you for your subscription request. Our team will review it and get back to you shortly."
                : "Thank you for subscribing to our service. We'll help you schedule your service visits soon.")
            : "Thank you for booking our service. Our experts will be at your location at the scheduled time."}
          bookingData={!bookingResult.isSubscription ? {
            reference: bookingResult.reference || `RMB-${Date.now()}`,
            date: formatDate(profileData.scheduleDate),
            time: formatTime(profileData.scheduleTime)
          } : undefined}
          subscriptionData={bookingResult.isSubscription ? {
            name: subscriptionPlan?.name,
            price: subscriptionPlan?.discounted_price?.toString() || subscriptionPlan?.price?.toString(),
            duration: subscriptionPlan?.duration_display || subscriptionPlan?.duration,
            visits: subscriptionPlan?.max_visits || getVisitCount(subscriptionPlan),
            features: subscriptionPlan?.features,
            status: bookingResult.status as 'pending' | 'approved' | 'rejected',
            plan_type: subscriptionPlan?.plan_type,
            request_date: bookingResult.request_date
          } : undefined}
        />
      )}

      {/* Add calendar modal at the end of the component */}
      {showCalendarModal && subscriptionPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md">
            <div className="flex justify-between items-center bg-[#FF5733] text-white p-4">
              <h2 className="text-xl font-bold">Schedule Your Services</h2>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800">{subscriptionPlan.name}</h3>
                <p className="text-gray-600">{subscriptionPlan.description}</p>
                <div className="mt-2 flex justify-between">
                  <span className="text-[#FF5733] font-bold text-lg">₹{subscriptionPlan.price}</span>
                  <span className="text-gray-500">{subscriptionPlan.duration}</span>
                </div>
              </div>
              
              <div className="mb-4 flex items-start bg-blue-50 p-3 rounded-lg">
                <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Please select <strong>exactly {subscriptionPlan.max_services} dates</strong> within your subscription period.
                  You can adjust these later if needed.
                </p>
              </div>
              
              <div className="text-center mb-4">
                <p className="text-sm font-medium text-gray-600">
                  {selectedDates.length} of {subscriptionPlan.max_services} dates selected
                </p>
                
                {selectedDates.length > 0 && (
                  <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">Selected dates:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDates.map((date, index) => (
                        <div key={index} className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded-full">
                          {date.toLocaleDateString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Simple calendar UI placeholder */}
              <div className="bg-gray-100 rounded-lg p-6 mb-4 text-center">
                <p className="text-gray-600 mb-2">Calendar would go here</p>
                <p className="text-sm text-gray-500">
                  Select exactly {subscriptionPlan.max_services} dates within the subscription period.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDateSelection([new Date()])}
                  className={`px-4 py-2 ${
                    selectedDates.length === subscriptionPlan.max_services 
                    ? 'bg-[#FF5733] hover:bg-opacity-90' 
                    : 'bg-gray-400 cursor-not-allowed'
                  } text-white rounded-lg transition-colors`}
                  disabled={selectedDates.length !== subscriptionPlan.max_services}
                >
                  Confirm Dates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCheckout; 