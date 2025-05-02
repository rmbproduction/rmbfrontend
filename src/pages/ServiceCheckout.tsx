import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { ArrowLeft, User, MapPin, Phone, Clock, CheckCircle, AlertTriangle, Navigation, Trash2, ShoppingCart, X } from 'lucide-react';
import { checkUserAuthentication } from '../utils/auth';
import { googleMapsConfig } from '../config/api.config';
import ThankYouModal from '../components/ThankYouModal';

// Declare google maps and initMap on the window object
declare global {
  interface Window {
    google: any; // Using 'any' type to avoid conflicts with existing declarations
    initMap: () => void;
  }
}

// Extend TextAreaElement with autocomplete property
interface AutocompleteTextArea extends HTMLTextAreaElement {
  __autocomplete?: google.maps.places.Autocomplete;
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
  
  // Add refs and state for Google Maps autocomplete
  const addressInputRef = useRef<AutocompleteTextArea>(null);
  const [mapsApiError, setMapsApiError] = useState(false);
  
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
      const url = `http://127.0.0.1:8000/api/repairing_service/vehicle-models/?manufacturer_id=${manufacturerId}`;
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
      const typesResponse = await fetch('http://127.0.0.1:8000/api/vehicle/vehicle-types/', {
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
      const mfgResponse = await fetch('http://127.0.0.1:8000/api/repairing_service/manufacturers/', {
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
      const modelsResponse = await fetch('http://127.0.0.1:8000/api/repairing_service/vehicle-models/', {
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
    
    // Load vehicle options when component mounts
    loadVehicleOptions();
    
    // Load profile data
    const loadProfileData = async () => {
      // First try to load from sessionStorage for returning users
      try {
        const savedData = sessionStorage.getItem('savedProfileData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('[DEBUG] Loading profile data from sessionStorage:', parsedData);
          setProfileData({
            name: parsedData.name || '',
            email: parsedData.email || '',
            phone: parsedData.phone || '',
            address: parsedData.address || '',
            city: parsedData.city || '',
            state: parsedData.state || '',
            postalCode: parsedData.postalCode || '',
            scheduleDate: parsedData.scheduleDate || '',
            scheduleTime: parsedData.scheduleTime || '',
            latitude: parsedData.latitude,
            longitude: parsedData.longitude
          });
          return true; // Indicate we loaded data successfully
        }
      } catch (error) {
        console.error('Error parsing saved profile data:', error);
      }

      // Then check localStorage for user profile
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        try {
          const profile = JSON.parse(userProfile);
          setProfileData({
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            postalCode: profile.postal_code || '',
            scheduleDate: profile.schedule_date || '',
            scheduleTime: profile.schedule_time || '',
            latitude: profile.latitude,
            longitude: profile.longitude
          });
          return true; // Indicate we loaded data successfully
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
              name: user.username || '',
              email: user.email || '',
            }));
            return true; // Indicate we loaded partial data
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
      }
      
      return false; // Indicate we didn't load any data
    };
    
    // Load vehicle data
    const loadVehicleData = async () => {
      const vehicleData = sessionStorage.getItem('userVehicleOwnership');
      if (vehicleData) {
        try {
          const parsedVehicle = JSON.parse(vehicleData);
          
          // If we have IDs but not names, fetch the details from API
          if (parsedVehicle.vehicle_type && parsedVehicle.manufacturer && parsedVehicle.model &&
              (!parsedVehicle.vehicle_type_name || !parsedVehicle.manufacturer_name || !parsedVehicle.model_name)) {
            
            // Fetch vehicle type name if needed
            try {
              const typeResponse = await fetch(`http://127.0.0.1:8000/api/vehicle/vehicle-types/${parsedVehicle.vehicle_type}/`, {
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
              const mfgResponse = await fetch(`http://127.0.0.1:8000/api/repairing_service/manufacturers/`, {
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
              const modelResponse = await fetch(`http://127.0.0.1:8000/api/repairing_service/vehicle-models/?manufacturer_id=${parsedVehicle.manufacturer}`, {
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
          }
          
          setSelectedVehicle(parsedVehicle);
        } catch (error) {
          console.error('Error parsing vehicle data:', error);
        }
      }
    };
    
    // Load basket items
    const loadBasketItems = async () => {
      try {
        const cartId = sessionStorage.getItem('cartId');
        console.log('[DEBUG] Loading cart with ID:', cartId);
        
        // Check if we have pending service data first
        const pendingServiceData = sessionStorage.getItem('pendingServiceData');
        if (pendingServiceData) {
          console.log('[DEBUG] Found pending service data:', pendingServiceData);
          try {
            const serviceData = JSON.parse(pendingServiceData);
            
            // If we have a cart ID already, try to add the service to it
            if (cartId) {
              console.log('[DEBUG] Adding pending service to existing cart:', cartId);
              // Add service to existing cart
              const addResponse = await fetch(`http://127.0.0.1:8000/api/repairing_service/cart/${cartId}/add/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  service_id: serviceData.id,
                  quantity: serviceData.quantity || 1,
                  service_name: serviceData.name
                }),
                credentials: 'omit'
              });
              
              if (addResponse.ok) {
                console.log('[DEBUG] Successfully added pending service to cart');
                // Clear pending service data to avoid duplicates
                sessionStorage.removeItem('pendingServiceData');
              }
            } else {
              // Create a new cart and add the service
              console.log('[DEBUG] Creating new cart for pending service');
              const createCartResponse = await fetch('http://127.0.0.1:8000/api/repairing_service/cart/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'omit'
              });
              
              if (!createCartResponse.ok) {
                throw new Error('Failed to create cart');
              }
              
              const cartData = await createCartResponse.json();
              const newCartId = cartData.id;
              console.log('[DEBUG] Created new cart with ID:', newCartId);
              sessionStorage.setItem('cartId', newCartId.toString());
              
              // Add service to cart
              await fetch(`http://127.0.0.1:8000/api/repairing_service/cart/${newCartId}/add/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  service_id: serviceData.id,
                  quantity: serviceData.quantity || 1,
                  service_name: serviceData.name
                }),
                credentials: 'omit'
              });
              
              // Clear pending service data to avoid duplicates
              sessionStorage.removeItem('pendingServiceData');
            }
          } catch (error) {
            console.error('Error processing pending service data:', error);
          }
        }
        
        // Now fetch cart data - use the updated cartId if it was just created
        const currentCartId = sessionStorage.getItem('cartId');
        if (!currentCartId) {
          console.log('[DEBUG] No cart ID available after processing - showing empty basket');
          setBasketItems([]);
          return;
        }
        
        console.log('[DEBUG] Fetching cart data from API for ID:', currentCartId);
        const response = await fetch(`http://127.0.0.1:8000/api/repairing_service/cart/${currentCartId}/`, {
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error('Failed to load cart data');
        }
        
        const data = await response.json();
        console.log('[DEBUG] Cart data received:', data);
        
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
              
              // If we have a local basket item but no items in the cart, recreate the cart
              setTimeout(() => {
                const createCartAndAddPendingService = async () => {
                  try {
                    const createCartResponse = await fetch('http://127.0.0.1:8000/api/repairing_service/cart/create/', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'omit'
                    });
                    
                    if (createCartResponse.ok) {
                      const cartData = await createCartResponse.json();
                      const newCartId = cartData.id;
                      sessionStorage.setItem('cartId', newCartId.toString());
                      
                      await fetch(`http://127.0.0.1:8000/api/repairing_service/cart/${newCartId}/add/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          service_id: serviceData.id,
                          quantity: serviceData.quantity || 1,
                          service_name: serviceData.name
                        }),
                        credentials: 'omit'
                      });
                      
                      // Dispatch event to update other components
                      window.dispatchEvent(new Event('cartUpdated'));
                    }
                  } catch (error) {
                    console.error('[DEBUG] Failed to recreate cart:', error);
                  }
                };
                
                createCartAndAddPendingService();
              }, 500);
              
              return;
            } catch (error) {
              console.error('Error creating local basket item:', error);
            }
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
    };
    
    // Load Google Maps API for address autocomplete
    const loadGoogleMapsScript = () => {
      // If the API is already loaded, initialize autocomplete
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("Google Maps API already loaded");
        setMapsApiError(false);
        initAutocomplete();
        return;
      }

      console.log("Loading Google Maps API script");
      
      // Remove any existing Google Maps script to avoid duplicates
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.remove();
      }

      // Define the callback function on the window object
      window.initMap = function () {
        console.log("Google Maps API loaded successfully via callback");
        setMapsApiError(false);
        initAutocomplete();
      };

      // Create script element
      const script = document.createElement("script");
      script.id = 'google-maps-script';
      
      // Use the API key from config and set the correct callback
      const apiKey = googleMapsConfig.apiKey;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;

      // Add error handling
      script.onerror = () => {
        console.error("Failed to load Google Maps API script");
        setMapsApiError(true);
        toast.error("Address autocomplete is unavailable. Please enter your address manually.", {
          position: "top-right",
          autoClose: 5000,
        });
      };

      // Append script to document
      document.head.appendChild(script);
      console.log("Google Maps API script added to document head");
    };
    
    Promise.all([loadProfileData(), loadVehicleData(), loadBasketItems()])
      .finally(() => {
        setLoading(false);
        // Initialize Google Maps for address autocomplete
        if (!window.google) {
          loadGoogleMapsScript();
        } else {
          initAutocomplete();
        }
      });
      
    // Cleanup function
    return () => {
      // Remove the global callback to prevent memory leaks
      if (window.initMap) {
        // @ts-ignore - Delete the property
        delete window.initMap;
      }
      console.log("Cleaned up Google Maps resources");
    };
  }, [navigate, loadVehicleOptions]);
  
  // Initialize Google Maps autocomplete
  const initAutocomplete = () => {
    if (
      !addressInputRef.current ||
      typeof window.google === 'undefined' ||
      !window.google ||
      !window.google.maps ||
      !window.google.maps.places
    ) {
      console.log("Cannot initialize autocomplete: Google Maps API not loaded or address input not found");
      // Try again after a short delay if Google Maps hasn't loaded yet
      setTimeout(() => {
        if (typeof window.google !== 'undefined' && window.google && window.google.maps) {
          initAutocomplete();
        }
      }, 500);
      return;
    }

    console.log("Initializing Places Autocomplete");

    try {
      // Remove any existing autocomplete to avoid duplicates
      if (addressInputRef.current.__autocomplete) {
        // Clean up existing autocomplete
        google.maps.event.clearInstanceListeners(addressInputRef.current);
        delete addressInputRef.current.__autocomplete;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ["address"],
          fields: [
            "address_components",
            "formatted_address",
            "geometry",
            "name",
            "place_id",
          ],
          componentRestrictions: { country: "in" }, // Restrict to India
        }
      );

      // Store autocomplete instance on the input element
      addressInputRef.current.__autocomplete = autocomplete;
      
      // Handle place selection
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        console.log("Selected place:", place);

        if (!place || !place.geometry) {
          console.warn("No place details available");
          return;
        }

        // Get the formatted address
        const formattedAddress = place.formatted_address || "";
        
        // Update coordinates for distance calculation
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        // Calculate distance fee based on coordinates
        calculateDistanceFee(lat, lng);

        // Extract address components
        let city = "";
        let state = "";
        let postalCode = "";

        if (place.address_components && Array.isArray(place.address_components)) {
          for (const component of place.address_components) {
            const types = component.types;
            
            if (types.includes("locality")) {
              city = component.long_name;
            } else if (types.includes("administrative_area_level_1")) {
              state = component.long_name;
            } else if (types.includes("postal_code")) {
              postalCode = component.long_name;
            }
            
            // If city is still empty, try to use administrative_area_level_2
            if (!city && types.includes("administrative_area_level_2")) {
              city = component.long_name;
            }
            
            // If city is still empty, try to use sublocality
            if (!city && types.includes("sublocality_level_1")) {
              city = component.long_name;
            }
          }
        }

        // Update all profile data fields at once with new values
        setProfileData(prevData => ({
          ...prevData,
          address: formattedAddress,
          city: city || prevData.city,
          state: state || prevData.state,
          postalCode: postalCode || prevData.postalCode,
          latitude: lat,
          longitude: lng
        }));

        // Clear form errors if any
        if (formErrors.address) {
          setFormErrors(prev => ({ ...prev, address: "" }));
        }
        
        console.log("Updated address with autocomplete:", {
          address: formattedAddress,
          city,
          state,
          postalCode,
          lat,
          lng
        });
      });

      console.log("Places Autocomplete initialized successfully");
    } catch (error) {
      console.error("Error initializing Places Autocomplete:", error);
      setMapsApiError(true);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
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
  
  // Save vehicle selection
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
    
    // Save to session storage
    sessionStorage.setItem('userVehicleOwnership', JSON.stringify(completeVehicle));
    
    // Close modal
    setShowVehicleModal(false);
    
    toast.success('Vehicle selected successfully');
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
  
  // Add function to save profile data to sessionStorage for reuse
  const saveProfileToSessionStorage = (data: ProfileData) => {
    try {
      // Store the data with a timestamp
      const storageData = {
        ...data,
        savedAt: new Date().toISOString()
      };
      sessionStorage.setItem('savedProfileData', JSON.stringify(storageData));
      console.log('[DEBUG] Saved profile data to sessionStorage:', storageData);
    } catch (error) {
      console.error('Error saving profile data to sessionStorage:', error);
    }
  };
  
  // Add function to calculate distance fee
  const calculateDistanceFee = async (lat: number, lng: number) => {
    try {
      // Call API to get distance fee
      const response = await fetch(`http://127.0.0.1:8000/api/repairing_service/calculate-distance-fee/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Distance fee calculation:', data);
        setDistanceFee(data.fee);
        setDistance(data.distance);
        setIsWithinFreeRadius(data.within_free_radius);
        
        // Update profile data with coordinates
        setProfileData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
        
        return data.fee;
      } else {
        console.error('Failed to calculate distance fee');
        return 0;
      }
    } catch (error) {
      console.error('Error calculating distance fee:', error);
      return 0;
    }
  };
  
  // Update handleSubmit to show modal instead of navigating
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    // Validate vehicle selection
    if (!selectedVehicle) {
      toast.error('Please select a vehicle for service');
      return;
    }
    
    // Validate cart has items
    if (basketItems.length === 0) {
      toast.error('Your repairs basket is empty');
      return;
    }
    
    setIsSubmitting(true);
    
    // Save profile data to sessionStorage for future form fills
    saveProfileToSessionStorage(profileData);
    
    try {
      // Get access token
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      
      // Format date as YYYY-MM-DD
      let formattedDate = '';
      if (profileData.scheduleDate) {
        try {
          const date = new Date(profileData.scheduleDate);
          formattedDate = date.toISOString().split('T')[0];
          console.log('[DEBUG] Formatted date:', formattedDate);
        } catch (err) {
          console.error('Error formatting date:', err);
          formattedDate = profileData.scheduleDate;
        }
      }
      
      // Create request payload
      const payload = {
        profile: profileData,
        vehicle: selectedVehicle,
        cart_id: sessionStorage.getItem('cartId'),
        services: basketItems.map(item => ({
          id: item.service_id,
          quantity: item.quantity,
          name: item.service_name // Include service name in submission
        })),
        scheduleDate: formattedDate,
        scheduleTime: profileData.scheduleTime,
        distanceFee: distanceFee,
        latitude: profileData.latitude,
        longitude: profileData.longitude
      };
      
      console.log('[DEBUG] Sending booking request with payload:', payload);
      
      // Create booking
      const response = await fetch('http://127.0.0.1:8000/api/repairing_service/bookings/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'omit',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      const result = await response.json();
      console.log('[DEBUG] Booking response:', result);
      
      // Store booking in sessionStorage for My Services tab
      try {
        const existingBookingsJson = sessionStorage.getItem('user_service_bookings');
        const existingBookings = existingBookingsJson ? JSON.parse(existingBookingsJson) : [];
        
        // Add the new booking to the list
        existingBookings.push({
          ...result,
          timestamp: Date.now(),
          vehicle: selectedVehicle,
          services: basketItems.map(item => ({
            id: item.service_id,
            name: item.service_name,
            quantity: item.quantity,
            price: item.price
          })),
          schedule_date: formattedDate,
          schedule_time: profileData.scheduleTime
        });
        
        // Store the updated list
        sessionStorage.setItem('user_service_bookings', JSON.stringify(existingBookings));
      } catch (storageError) {
        console.error('Error storing booking in sessionStorage:', storageError);
      }
      
      // Clear cart
      sessionStorage.removeItem('cartId');
      sessionStorage.removeItem('pendingServiceData');
      
      // Save the booking result for the thank you modal
      setBookingResult(result);
      
      // Show the thank you modal instead of navigating
      setShowThankYouModal(true);
      
      // Dispatch event to update RepairsBasketIcon
      window.dispatchEvent(new Event('cartUpdated'));
      
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
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
      
      const response = await fetch(`http://127.0.0.1:8000/api/repairing_service/cart/${cartId}/clear/`, {
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
                      {mapsApiError && (
                        <div className="text-yellow-600 text-sm flex items-center mt-1 p-2 bg-yellow-50 rounded-lg">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Address autocomplete is unavailable. Please enter your address manually.
                        </div>
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
                        <span>Order Summary</span>
                        {basketItems.length > 0 && (
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
                        {basketItems.length === 0 ? (
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
                        )}
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting || basketItems.length === 0}
                      className={`w-full ${basketItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FF5733] hover:bg-opacity-90'} text-white px-6 py-4 rounded-xl font-medium transition-colors shadow-md text-lg flex justify-center items-center`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                          Processing...
                        </>
                      ) : (
                        'Confirm Booking'
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
          type="booking"
          onClose={handleThankYouClose}
          bookingData={{
            reference: bookingResult.reference || `RMB-${Date.now()}`,
            date: formatDate(profileData.scheduleDate),
            time: formatTime(profileData.scheduleTime)
          }}
        />
      )}
    </div>
  );
};

export default ServiceCheckout; 