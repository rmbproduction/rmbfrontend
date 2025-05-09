import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Settings,
  LogOut,
  Key,
  Bike,
  Calendar,
  Bell,
  CreditCard,
  MapPin,
  Clock,
  Shield,
  Camera,
  Phone,
  Info,
  BookOpen,
  CreditCard as Subscription,
  X,
  Upload,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_CONFIG } from "../config/api.config";
import marketplaceService from "../services/marketplaceService";
import MyBookingsTab from "../components/MyBookingsTab";
import MyServicesTab from "../components/MyServicesTab";
import MySubscriptionsTab from "../components/MySubscriptionsTab";

// Remove Google Maps declarations
interface UserProfile {
  [key: string]: any; // Add index signature to allow string indexing
  id?: number;
  email: string;
  name: string;
  username: string;
  address: string;
  profile_photo: string | null; // Changed from optional to nullable to match reality
  vehicle_name: number | null; // Changed to number for clarity
  vehicle_type: number | null; // Changed to number for clarity
  manufacturer: number | null; // Changed to number for clarity
  memberSince?: string;
  phone?: string;
  preferredLocation?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  pending?: boolean;
  lastError?: string;
  lastErrorTime?: string;
}

declare interface Manufacturer {
  id: number;
  name: string;
  image: string;
}

declare interface VehicleType {
  id: number;
  name: string;
  image: string;
}

declare interface VehicleModel {
  id: number;
  name: string;
  manufacturer: number;
  manufacturer_name: string;
  vehicle_type: number;
  vehicle_type_name: string;
  image: string | null;
}

// Define RequiredLabel component
const RequiredLabel = ({ text }: { text: string }) => (
  <label className="block text-sm font-medium text-gray-700">
    {text} <span className="text-red-500">*</span>
  </label>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<
    "profile" | "services" | "settings" | "bookings" | "subscriptions"
  >("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);

  // Vehicle-related state
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [loadingVehicleData, setLoadingVehicleData] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<
    number | null
  >(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<number | null>(
    null,
  );

  // Remove reference for the location input element and related Map/Google Maps code
  const [locationLoaded, setLocationLoaded] = useState(false);

  // Add a new state for map visibility
  const [showMap, setShowMap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  // Add a new state for script loading
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Add a state to track if Maps API failed to load
  const [mapsApiError, setMapsApiError] = useState(false);

  // Add this state for the file object right after other state declarations
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Add this state for the save button loading
  const [isSaving, setIsSaving] = useState(false);

  // Add a new state for the vehicle model dropdown
  const [vehicleModelDropdown, setVehicleModelDropdown] = useState<
    VehicleModel[]
  >([]);

  // Add this at the beginning of the component
  console.log("ProfilePage render - Vehicle state:", {
    vehicleModelsLoaded: vehicleModels.length > 0,
    manufacturersLoaded: manufacturers.length > 0,
    vehicleTypesLoaded: vehicleTypes.length > 0,
  });

  // Add this state for the timestamp
  const [refreshTimestamp, setRefreshTimestamp] = useState(() => Date.now());

  // Function to refresh bookings
  const refreshBookings = () => {
    setRefreshTimestamp(Date.now());
  };

  // Add this function to handle the vehicle model selection specifically
  const handleVehicleModelChange = (modelId: number | null) => {
    if (!profile) return;
    
    if (modelId) {
      const selectedModel = vehicleModels.find(m => m.id === modelId);
      console.log('Selected model:', selectedModel);
      console.log('Current profile:', profile);
      
      // Validate that the selected model matches both manufacturer and vehicle type
      if (selectedModel) {
        const modelManufacturerId = typeof selectedModel.manufacturer === 'object' 
          ? (selectedModel.manufacturer as {id: number}).id 
          : selectedModel.manufacturer;
        
        const modelVehicleTypeId = typeof selectedModel.vehicle_type === 'object'
          ? (selectedModel.vehicle_type as {id: number}).id
          : selectedModel.vehicle_type;

        if (modelManufacturerId === Number(profile.manufacturer) &&
            modelVehicleTypeId === Number(profile.vehicle_type)) {
          const updatedProfile = {
            ...profile,
            vehicle_name: modelId
          };
          
          setProfile(updatedProfile);
          
          // Persist the updated profile to storage
          persistProfileData(updatedProfile);
          
          // Clear any form errors
          if (formErrors.vehicle_name) {
            setFormErrors({...formErrors, vehicle_name: ''});
          }
        } else {
          toast.error('Selected model does not match the chosen manufacturer and vehicle type');
          return;
        }
      }
    } else {
      // If null, clear the vehicle_name
      const updatedProfile = {
        ...profile,
        vehicle_name: null
      };
      
      setProfile(updatedProfile);
      
      // Persist the updated profile to storage
      persistProfileData(updatedProfile);
    }
  };

  // Add this to be called when the vehicle model dropdown is clicked
  const handleVehicleModelDropdownClick = () => {
    // Log the available models for debugging
    console.log(
      "Vehicle model dropdown clicked, available models:",
      vehicleModels.map((m) => ({
        id: m.id,
        name: m.name,
        manufacturer:
          typeof m.manufacturer === "object" && m.manufacturer !== null
            ? (m.manufacturer as { id: number }).id
            : m.manufacturer,
        vehicle_type:
          typeof m.vehicle_type === "object" && m.vehicle_type !== null
            ? (m.vehicle_type as { id: number }).id
            : m.vehicle_type,
      })),
    );
    // Check if we have profile.manufacturer and profile.vehicle_type but no models
    if (
      profile?.manufacturer &&
      profile?.vehicle_type &&
      vehicleModels.length === 0 &&
      !loadingVehicleData
    ) {
      console.log("Refreshing vehicle models on dropdown click");
      fetchVehicleModels(
        Number(profile.manufacturer),
        Number(profile.vehicle_type),
      );
    }
  };

  // Better function to fetch vehicle models filtered by both manufacturer and vehicle type
  const fetchVehicleModels = async (
    manufacturerId: number | null,
    vehicleTypeId: number | null,
  ) => {
    if (!manufacturerId || !vehicleTypeId) {
      console.log("Missing required parameters for fetchVehicleModels:", {
        manufacturerId,
        vehicleTypeId,
      });
      setVehicleModels([]);
      if (profile) {
        setProfile({
          ...profile,
          vehicle_name: null,
        });
      }
      return;
    }

    console.log(
      `Fetching vehicle models for manufacturer ${manufacturerId} and vehicle type ${vehicleTypeId}`,
    );
    setLoadingVehicleData(true);

    try {
      // Construct the API URL with query parameters
      const url = API_CONFIG.getApiUrl("vehicle/vehicle-models/");
      const queryParams = new URLSearchParams({
        manufacturer_id: manufacturerId.toString(),
        vehicle_type_id: vehicleTypeId.toString(),
      });
      
      const fullUrl = `${url}?${queryParams.toString()}`;
      console.log("API URL for vehicle models:", fullUrl);
      
      // Get access token
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("Authentication required");
      }
      
      // Make API call
      const response = await axios.get(fullUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 5000 // Add timeout to prevent hanging requests
      });
      
      // Check response
      if (response.data && Array.isArray(response.data)) {
        console.log("Fetched vehicle models:", response.data);
        
        // Cache the models data
        localStorage.setItem(`vehicle_models_${manufacturerId}_${vehicleTypeId}`, JSON.stringify(response.data));
        
        // Update dropdown with fetched models
        setVehicleModelDropdown(response.data);
        return response.data;
          } else {
        throw new Error("Invalid response format for vehicle models");
      }
    } catch (error) {
      console.error("Error fetching vehicle models:", error);
      
      // Try to load models from cache
      try {
        const cachedModels = localStorage.getItem(`vehicle_models_${manufacturerId}_${vehicleTypeId}`);
        if (cachedModels) {
          const parsedModels = JSON.parse(cachedModels);
          console.log("Using cached vehicle models:", parsedModels);
          setVehicleModelDropdown(parsedModels);
          return parsedModels;
        }
      } catch (cacheError) {
        console.error("Error loading cached models:", cacheError);
      }
      
      // Filter from all models as last resort
      filterFallbackModels(manufacturerId, vehicleTypeId);
    } finally {
      setLoadingVehicleData(false);
    }
  };

  // Function to fetch all vehicle models (not filtered by manufacturer or type)
  const fetchAllModels = async () => {
    console.log("Fetching all vehicle models");
    
    try {
      // Get access token
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("Authentication required");
      }
      
      // Construct API URL
      const url = API_CONFIG.getApiUrl("vehicle/vehicle-models/");
      console.log("API URL for all vehicle models:", url);
      
      // Make API call
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 5000 // Add timeout to prevent hanging requests
      });
      
      // Check response
      if (response.data && Array.isArray(response.data)) {
        console.log(`Fetched ${response.data.length} vehicle models`);
        
        // Cache all models
        localStorage.setItem("cached_vehicle_models", JSON.stringify(response.data));
        
        // Update state
        setVehicleModels(response.data);
        return response.data;
      } else {
        throw new Error("Invalid response format for vehicle models");
      }
    } catch (error) {
      console.error("Failed to fetch all vehicle models:", error);
      
      // Try to load from cache
      const cachedModels = localStorage.getItem("cached_vehicle_models");
      if (cachedModels) {
        try {
          const parsedModels = JSON.parse(cachedModels);
          console.log(`Using ${parsedModels.length} cached vehicle models`);
          setVehicleModels(parsedModels);
          return parsedModels;
        } catch (parseError) {
          console.error("Error parsing cached models:", parseError);
        }
      }
      
      // Use mock data as last resort
      console.log("Using mock vehicle models data");
      const mockModels = [
        { id: 1, name: 'Splendor', manufacturer: 2, manufacturer_name: 'Hero', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null },
        { id: 2, name: 'Activa', manufacturer: 1, manufacturer_name: 'Honda', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
        { id: 3, name: 'Pulsar', manufacturer: 3, manufacturer_name: 'Bajaj', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null },
        { id: 4, name: 'Jupiter', manufacturer: 4, manufacturer_name: 'TVS', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
        { id: 5, name: 'R15', manufacturer: 5, manufacturer_name: 'Yamaha', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null },
        { id: 6, name: 'Shine', manufacturer: 1, manufacturer_name: 'Honda', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null },
        { id: 7, name: 'Access', manufacturer: 5, manufacturer_name: 'Yamaha', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
        { id: 8, name: 'Pleasure', manufacturer: 2, manufacturer_name: 'Hero', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
        { id: 9, name: 'Dio', manufacturer: 1, manufacturer_name: 'Honda', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
        { id: 10, name: 'Xtreme', manufacturer: 2, manufacturer_name: 'Hero', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null }
      ];
      setVehicleModels(mockModels);
      
      // Cache the mock data for future use
      localStorage.setItem("cached_vehicle_models", JSON.stringify(mockModels));
      return mockModels;
    }
  };

  useEffect(() => {
    // Call the existing fetchUserProfile function
    fetchUserProfile();
    fetchVehicleData();

    // Remove Google Maps initialization since we no longer use location input
  }, []); // Empty dependency array means this runs once on mount

  // Update effect to handle profile manufacturer and vehicle type changes
  useEffect(() => {
    if (profile?.manufacturer && profile?.vehicle_type) {
      // When both profile manufacturer and vehicle type are set, fetch matching models
      console.log(
        `Profile has manufacturer ID: ${profile.manufacturer} and vehicle type ID: ${profile.vehicle_type}, fetching models`,
      );
      fetchVehicleModels(
        Number(profile.manufacturer),
        Number(profile.vehicle_type),
      );
    }
  }, [profile?.manufacturer, profile?.vehicle_type]);

  // Add useEffect to check for activeTab in location state
  useEffect(() => {
    // Check if we have a state passed from navigation with an activeTab
    const locationState = location?.state as { activeTab?: "profile" | "services" | "settings" | "bookings" | "subscriptions" };
    if (locationState?.activeTab) {
      setActiveTab(locationState.activeTab);
      
      // Clear the state after using it to prevent tab from persisting on refresh
      navigate('/profile', { replace: true, state: {} });
    }
  }, [location, navigate]);
  
  // Handle tab changes with proper cleanup
  const handleTabChange = (tab: "profile" | "services" | "settings" | "bookings" | "subscriptions") => {
    // Change the tab - all location input references removed
    setActiveTab(tab);
  };

  // Add better debugging for selected vehicle model
  useEffect(() => {
    if (profile?.vehicle_name && vehicleModels.length > 0) {
      const selectedModel = vehicleModels.find(
        (model) => model.id === Number(profile.vehicle_name),
      );
      if (selectedModel) {
        console.log("Selected vehicle model:", selectedModel);
      } else {
        console.warn(
          "Selected model ID not found in available models:",
          profile.vehicle_name,
        );
      }
    }
  }, [profile?.vehicle_name, vehicleModels]);

  // Parse URL parameters to check for tab selection
  useEffect(() => {
    // Get the tab parameter from the URL
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    
    // If a valid tab parameter is provided, switch to that tab
    if (tabParam) {
      const validTabs = ['profile', 'services', 'subscriptions', 'settings', 'bookings'];
      if (validTabs.includes(tabParam)) {
        handleTabChange(tabParam as any);
      }
    }
  }, [location.search, handleTabChange]);

  const fetchVehicleData = async () => {
    setLoadingVehicleData(true);
    try {
      // Try to get access token
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        console.warn("No access token found, using fallback data");
        loadFallbackVehicleData();
        return;
      }

      console.log("Fetching vehicle data (manufacturers and types)");

      // Attempt to fetch manufacturers
      let manufacturersData;
      try {
      const manufacturersUrl = API_CONFIG.getApiUrl("vehicle/manufacturers/");
      console.log("Manufacturers API URL:", manufacturersUrl);

      const manufacturersResponse = await axios.get(manufacturersUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000, // Add timeout to prevent long-hanging requests
      });

      console.log("Manufacturers API response:", manufacturersResponse.data);
        manufacturersData = manufacturersResponse.data || [];
        
        // Cache successful response
        if (Array.isArray(manufacturersData) && manufacturersData.length > 0) {
          localStorage.setItem('cached_manufacturers', JSON.stringify(manufacturersData));
          console.log("Cached manufacturers data");
        }
      } catch (manufacturerError) {
        console.error("Error fetching manufacturers:", manufacturerError);
        // Try to load from cache
        const cachedManufacturers = localStorage.getItem('cached_manufacturers');
        if (cachedManufacturers) {
          manufacturersData = JSON.parse(cachedManufacturers);
          console.log("Using cached manufacturers data", manufacturersData);
        } else {
          // No cached data, use mock data
          manufacturersData = [
            { id: 1, name: 'Honda', image: '' },
            { id: 2, name: 'Hero', image: '' },
            { id: 3, name: 'Bajaj', image: '' },
            { id: 4, name: 'TVS', image: '' },
            { id: 5, name: 'Yamaha', image: '' }
          ];
          console.log("Using mock manufacturers data");
        }
      }

      // Attempt to fetch vehicle types
      let vehicleTypesData;
      try {
      const vehicleTypesUrl = API_CONFIG.getApiUrl("vehicle/vehicle-types/");
      console.log("Vehicle Types API URL:", vehicleTypesUrl);

      const vehicleTypesResponse = await axios.get(vehicleTypesUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000, // Add timeout to prevent long-hanging requests
      });

      console.log("Vehicle Types API response:", vehicleTypesResponse.data);
        vehicleTypesData = vehicleTypesResponse.data || [];
        
        // Cache successful response
        if (Array.isArray(vehicleTypesData) && vehicleTypesData.length > 0) {
          localStorage.setItem('cached_vehicle_types', JSON.stringify(vehicleTypesData));
          console.log("Cached vehicle types data");
        }
      } catch (typeError) {
        console.error("Error fetching vehicle types:", typeError);
        // Try to load from cache
        const cachedTypes = localStorage.getItem('cached_vehicle_types');
        if (cachedTypes) {
          vehicleTypesData = JSON.parse(cachedTypes);
          console.log("Using cached vehicle types data", vehicleTypesData);
        } else {
          // No cached data, use mock data
          vehicleTypesData = [
            { id: 1, name: 'Motorcycle', image: '' },
            { id: 2, name: 'Scooter', image: '' },
            { id: 3, name: 'Electric Bike', image: '' },
            { id: 4, name: 'Moped', image: '' }
          ];
          console.log("Using mock vehicle types data");
        }
      }

      // Update state with fetched/cached/mock data
      setManufacturers(manufacturersData);
      setVehicleTypes(vehicleTypesData);

      // Process profile updates
      updateProfileWithVehicleData(manufacturersData, vehicleTypesData);
      
      // Try to fetch all models for dropdown
      fetchAllModels().catch(err => {
        console.error("Failed to fetch all models:", err);
        // Load mocked or cached models if needed
        loadFallbackModels();
      });
      
    } catch (error) {
      console.error("Failed to fetch vehicle data:", error);
      toast.error("Failed to load vehicle data", {
        position: "top-right",
        autoClose: 3000,
      });
      
      // Fall back to cached or mock data
      loadFallbackVehicleData();
    } finally {
      setLoadingVehicleData(false);
    }
  };
  
  // Helper function to load fallback vehicle data
  const loadFallbackVehicleData = () => {
    // Try to load manufacturers from cache
    let manufacturersData;
    const cachedManufacturers = localStorage.getItem('cached_manufacturers');
    if (cachedManufacturers) {
      manufacturersData = JSON.parse(cachedManufacturers);
      console.log("Using cached manufacturers data", manufacturersData);
    } else {
      // No cached data, use mock data
      manufacturersData = [
        { id: 1, name: 'Honda', image: '' },
        { id: 2, name: 'Hero', image: '' },
        { id: 3, name: 'Bajaj', image: '' },
        { id: 4, name: 'TVS', image: '' },
        { id: 5, name: 'Yamaha', image: '' }
      ];
      console.log("Using mock manufacturers data");
    }
    
    // Try to load vehicle types from cache
    let vehicleTypesData;
    const cachedTypes = localStorage.getItem('cached_vehicle_types');
    if (cachedTypes) {
      vehicleTypesData = JSON.parse(cachedTypes);
      console.log("Using cached vehicle types data", vehicleTypesData);
    } else {
      // No cached data, use mock data
      vehicleTypesData = [
        { id: 1, name: 'Motorcycle', image: '' },
        { id: 2, name: 'Scooter', image: '' },
        { id: 3, name: 'Electric Bike', image: '' },
        { id: 4, name: 'Moped', image: '' }
      ];
      console.log("Using mock vehicle types data");
    }
    
    // Update state with fallback data
    setManufacturers(manufacturersData);
    setVehicleTypes(vehicleTypesData);
    
    // Process profile updates with fallback data
    updateProfileWithVehicleData(manufacturersData, vehicleTypesData);
    
    // Also load fallback models
    loadFallbackModels();
  };
  
  // Function to update profile with vehicle data
  const updateProfileWithVehicleData = (manufacturersData: any[], vehicleTypesData: any[]) => {
    if (!profile) return;
    
        let updatedProfile = { ...profile };
        let profileChanged = false;

        // If profile doesn't have a manufacturer but we have manufacturers data, set the first one
    if (!profile.manufacturer && manufacturersData && manufacturersData.length > 0) {
      console.log("Setting default manufacturer:", manufacturersData[0].id);
      updatedProfile.manufacturer = manufacturersData[0].id;
      setSelectedManufacturer(manufacturersData[0].id);
          profileChanged = true;
        }

        // If profile doesn't have a vehicle type but we have vehicle types data, set the first one
    if (!profile.vehicle_type && vehicleTypesData && vehicleTypesData.length > 0) {
      console.log("Setting default vehicle type:", vehicleTypesData[0].id);
      updatedProfile.vehicle_type = vehicleTypesData[0].id;
      setSelectedVehicleType(vehicleTypesData[0].id);
          profileChanged = true;
        }

        // If profile was updated, persist changes
        if (profileChanged) {
          console.log("Updating profile with default vehicle data:", {
            manufacturer: updatedProfile.manufacturer,
            vehicle_type: updatedProfile.vehicle_type,
          });
          setProfile(updatedProfile);
          persistProfileData(updatedProfile);
        }

        // If profile has both manufacturer and vehicle type, fetch matching models
        if ((updatedProfile.manufacturer && updatedProfile.vehicle_type) || 
            (profile.manufacturer && profile.vehicle_type)) {
          const manuId = updatedProfile.manufacturer || profile.manufacturer;
          const typeId = updatedProfile.vehicle_type || profile.vehicle_type;
          
          console.log(`Profile has manufacturer ID: ${manuId} and vehicle type ID: ${typeId}, fetching models`);
      fetchVehicleModels(Number(manuId), Number(typeId))
        .catch(err => {
          console.error("Failed to fetch vehicle models:", err);
          // Try to load models from fallback data
          filterFallbackModels(Number(manuId), Number(typeId));
        });
    }
  };
  
  // Function to load fallback models
  const loadFallbackModels = () => {
    // Try to load models from cache
    const cachedModels = localStorage.getItem('cached_vehicle_models');
    if (cachedModels) {
      const modelsData = JSON.parse(cachedModels);
      console.log("Using cached vehicle models data", modelsData);
      setVehicleModels(modelsData);
    } else {
      // No cached data, use mock data
      const mockModels = [
        { id: 1, name: 'Splendor', manufacturer: 2, manufacturer_name: 'Hero', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null },
        { id: 2, name: 'Activa', manufacturer: 1, manufacturer_name: 'Honda', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
        { id: 3, name: 'Pulsar', manufacturer: 3, manufacturer_name: 'Bajaj', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null },
        { id: 4, name: 'Jupiter', manufacturer: 4, manufacturer_name: 'TVS', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
        { id: 5, name: 'R15', manufacturer: 5, manufacturer_name: 'Yamaha', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null },
        { id: 6, name: 'Shine', manufacturer: 1, manufacturer_name: 'Honda', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null },
        { id: 7, name: 'Access', manufacturer: 5, manufacturer_name: 'Yamaha', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
        { id: 8, name: 'Pleasure', manufacturer: 2, manufacturer_name: 'Hero', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
        { id: 9, name: 'Dio', manufacturer: 1, manufacturer_name: 'Honda', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
        { id: 10, name: 'Xtreme', manufacturer: 2, manufacturer_name: 'Hero', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null }
      ];
      console.log("Using mock vehicle models data");
      setVehicleModels(mockModels);
      
      // Cache the mock data for future use
      localStorage.setItem('cached_vehicle_models', JSON.stringify(mockModels));
    }
  };
  
  // Function to filter fallback models for specific manufacturer and type
  const filterFallbackModels = (manufacturerId: number, vehicleTypeId: number) => {
    // Get all models (either from state or from cache/mock)
    let allModels = vehicleModels;
    
    if (!allModels || allModels.length === 0) {
      // Try to load from cache
      const cachedModels = localStorage.getItem('cached_vehicle_models');
      if (cachedModels) {
        allModels = JSON.parse(cachedModels);
      } else {
        // Use mock data
        allModels = [
          { id: 1, name: 'Splendor', manufacturer: 2, manufacturer_name: 'Hero', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null },
          { id: 2, name: 'Activa', manufacturer: 1, manufacturer_name: 'Honda', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
          { id: 3, name: 'Pulsar', manufacturer: 3, manufacturer_name: 'Bajaj', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null },
          { id: 4, name: 'Jupiter', manufacturer: 4, manufacturer_name: 'TVS', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
          { id: 5, name: 'R15', manufacturer: 5, manufacturer_name: 'Yamaha', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null },
          { id: 6, name: 'Shine', manufacturer: 1, manufacturer_name: 'Honda', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null },
          { id: 7, name: 'Access', manufacturer: 5, manufacturer_name: 'Yamaha', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
          { id: 8, name: 'Pleasure', manufacturer: 2, manufacturer_name: 'Hero', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
          { id: 9, name: 'Dio', manufacturer: 1, manufacturer_name: 'Honda', vehicle_type: 2, vehicle_type_name: 'Scooter', image: null },
          { id: 10, name: 'Xtreme', manufacturer: 2, manufacturer_name: 'Hero', vehicle_type: 1, vehicle_type_name: 'Motorcycle', image: null }
        ];
      }
    }
    
    // Filter by manufacturer and vehicle type
    const filteredModels = allModels.filter(model => 
      model.manufacturer === manufacturerId && model.vehicle_type === vehicleTypeId
    );
    
    console.log(`Filtered ${filteredModels.length} models for manufacturer ${manufacturerId} and type ${vehicleTypeId}`);
    
    // Update model dropdown
    setVehicleModelDropdown(filteredModels);
  };

  const handleManufacturerChange = async (manufacturerId: number) => {
    console.log(`Manufacturer changed to ${manufacturerId}`);

    // Update both the selectedManufacturer state and the profile
    setSelectedManufacturer(manufacturerId);

    // Update the profile with the new manufacturer
    if (profile) {
      // Create updated profile with new manufacturer ID
      const updatedProfile = {
        ...profile,
        manufacturer: manufacturerId,
        // Clear vehicle_name when manufacturer changes to prevent mismatched models
        vehicle_name: null,
      };
      
      // Update state
      setProfile(updatedProfile);
      
      // Persist changes to storage
      persistProfileData(updatedProfile);

      // If vehicle type is already selected, fetch matching models
      if (profile.vehicle_type) {
        console.log(
          `Fetching models for new manufacturer ${manufacturerId} and existing vehicle type ${profile.vehicle_type}`,
        );
        fetchVehicleModels(manufacturerId, Number(profile.vehicle_type));
      } else {
        // Clear vehicle models if no vehicle type selected
        console.log("No vehicle type selected yet, clearing vehicle models");
        setVehicleModels([]);
      }
    }
  };

  const handleVehicleTypeChange = async (vehicleTypeId: number) => {
    console.log(`Vehicle type changed to ${vehicleTypeId}`);

    // Update both the selectedVehicleType state and the profile
    setSelectedVehicleType(vehicleTypeId);

    // Update the profile with the new vehicle type
    if (profile) {
      const updatedProfile = {
        ...profile,
        vehicle_type: vehicleTypeId,
        // Clear vehicle_name when vehicle type changes to prevent mismatched models
        vehicle_name: null,
      };
      
      setProfile(updatedProfile);
      
      // Persist the updated profile to storage
      persistProfileData(updatedProfile);

      // If manufacturer is already selected, fetch matching models
      if (profile.manufacturer) {
        console.log(
          `Fetching models for existing manufacturer ${profile.manufacturer} and new vehicle type ${vehicleTypeId}`,
        );
        fetchVehicleModels(Number(profile.manufacturer), vehicleTypeId);
      } else {
        // Clear vehicle models if no manufacturer selected
        console.log("No manufacturer selected yet, clearing vehicle models");
        setVehicleModels([]);
      }
    }
  };

  // Add this right before the validateForm function
  // Debug function to help with troubleshooting
  const logVehicleState = () => {
    console.log("Current vehicle state:", {
      selectedManufacturer,
      selectedVehicleType,
      profileManufacturer: profile?.manufacturer,
      profileVehicleType: profile?.vehicle_type,
      profileVehicleModel: profile?.vehicle_name,
      vehicleModelsCount: vehicleModels.length,
      vehicleModels: vehicleModels.map((m) => ({
        id: m.id,
        name: m.name,
        manufacturer:
          typeof m.manufacturer === "object" && m.manufacturer !== null
            ? (m.manufacturer as { id: number }).id
            : m.manufacturer,
        vehicle_type:
          typeof m.vehicle_type === "object" && m.vehicle_type !== null
            ? (m.vehicle_type as { id: number }).id
            : m.vehicle_type,
      })),
    });
  };

  // Improved validation function to better check vehicle models
  const validateVehicleSelection = () => {
    logVehicleState(); // Log the current state for debugging

    const errors: { [key: string]: string } = {};

    // Add detailed logging to the validateVehicleSelection function
    console.log("Starting vehicle selection validation");

    // Relax validation rules
    if (!profile?.manufacturer) {
      console.warn("Manufacturer not selected");
      errors.manufacturer = "Please select a manufacturer";
    }

    if (!profile?.vehicle_type) {
      console.warn("Vehicle type not selected");
      errors.vehicle_type = "Please select a vehicle type";
    }

    if (!profile?.vehicle_name) {
      console.warn("Vehicle model not selected");
      errors.vehicle_name = "Please select a vehicle model";
    } else if (profile.manufacturer && profile.vehicle_type) {
      const selectedModel = vehicleModels.find(
        (m) => m.id === Number(profile.vehicle_name),
      );

      if (!selectedModel) {
        console.warn("Selected model not available");
        errors.vehicle_name =
          "The selected model is not available for the chosen manufacturer and vehicle type";
      } else {
        const modelManufacturerId =
          typeof selectedModel.manufacturer === "object" &&
          selectedModel.manufacturer !== null
            ? (selectedModel.manufacturer as { id: number }).id
            : Number(selectedModel.manufacturer);
        const modelVehicleTypeId =
          typeof selectedModel.vehicle_type === "object" &&
          selectedModel.vehicle_type !== null
            ? (selectedModel.vehicle_type as { id: number }).id
            : Number(selectedModel.vehicle_type);

        if (modelManufacturerId !== Number(profile.manufacturer)) {
          console.warn("Model manufacturer mismatch");
          errors.vehicle_name =
            "Selected model does not match the chosen manufacturer";
        }

        if (modelVehicleTypeId !== Number(profile.vehicle_type)) {
          console.warn("Model vehicle type mismatch");
          errors.vehicle_name =
            "Selected model does not match the chosen vehicle type";
        }
      }
    }

    console.log("Validation errors:", errors);
    return errors;
  };

  // Function to persist profile data to storage
  const persistProfileData = (data: any) => {
    try {
      // Save to local storage with the new key
      localStorage.setItem('userData', JSON.stringify(data));
      
      // Also save to original userProfile key for backward compatibility
      localStorage.setItem('userProfile', JSON.stringify(data));
      
      // Save individual fields to separate storage keys for broader app usage
      if (data.phone) {
        localStorage.setItem('userPhone', data.phone);
      }
      
      if (data.email) {
        localStorage.setItem('userEmail', data.email);
      }
      
      if (data.name) {
        localStorage.setItem('userName', data.name);
      }
      
      if (data.address) {
        localStorage.setItem('userAddress', data.address);
      }
      
      // Save location data if available
      if (data.latitude && data.longitude && data.preferredLocation) {
        const locationData = {
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.preferredLocation
        };
        localStorage.setItem('userLocation', JSON.stringify(locationData));
      }
      
      console.log('Profile data saved to storage:', data);
    } catch (error) {
      console.error('Error saving profile data to storage:', error);
    }
  };

  // Fetch user profile with better error handling
  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First try to get from local cached data
      const userDataStr = localStorage.getItem('userData');
      const localUserData = userDataStr ? JSON.parse(userDataStr) : null;
      
      // Get authentication token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('No authentication token found');
        // If no token but we have local data, use that
        if (localUserData) {
          setProfile(prevProfile => ({
            ...createDefaultProfile(),
            ...localUserData
          }));
          setLoading(false);
          return;
        }
        
        throw new Error('Authentication required');
      }
      
      // Try to fetch from API
      const response = await axios.get(`${API_CONFIG.BASE_URL}/accounts/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Profile data from API:', response.data);
      
      // Merge with any existing data
      const apiUserData = response.data;

      // Try to get address and phone from checkout data in sessionStorage/localStorage
      const checkoutData = getCheckoutDataFromStorage();
      console.log('Found checkout data:', checkoutData);
      
      // Use API data as base, enrich with cached checkout data if available
      const enrichedUserData = {
        ...apiUserData,
        phone: apiUserData.phone || localUserData?.phone || checkoutData.phone || '',
        address: apiUserData.address || localUserData?.address || checkoutData.address || '',
        preferredLocation: apiUserData.preferredLocation || localUserData?.preferredLocation || checkoutData.location || '',
        city: apiUserData.city || localUserData?.city || checkoutData.city || '',
        state: apiUserData.state || localUserData?.state || checkoutData.state || '',
        postal_code: apiUserData.postal_code || localUserData?.postal_code || checkoutData.pincode || '',
      };

      // Store the enriched data for future use
      localStorage.setItem('userData', JSON.stringify(enrichedUserData));
      
      // Set profile state with merged data
      setProfile(enrichedUserData);
      
      // Initialize the vehicle dropdown
      if (enrichedUserData.manufacturer && enrichedUserData.vehicle_type) {
        handleManufacturerChange(enrichedUserData.manufacturer);
        handleVehicleTypeChange(enrichedUserData.vehicle_type);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile data');
      
      // If we have data in localStorage, use that as fallback
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          setProfile(userData);
        } catch (parseError) {
          console.error('Error parsing user data from localStorage:', parseError);
          setProfile(createDefaultProfile());
        }
      } else {
        // Otherwise create a default profile
        setProfile(createDefaultProfile());
      }
      
      setLoading(false);
    }
  };

  // Helper function to extract checkout data from storage
  const getCheckoutDataFromStorage = () => {
    // Check various storage keys where user data might be stored
    const result: any = {};
    
    // Try to get phone number from various sources
    try {
      // Check booking data
      const bookingData = sessionStorage.getItem('latest_booking_data');
      if (bookingData) {
        const parsed = JSON.parse(bookingData);
        result.phone = parsed.contact_number || parsed.phoneNumber || parsed.phone || '';
      }
      
      // Check last_submitted_vehicle (used in sell flows)
      const vehicleData = localStorage.getItem('last_submitted_vehicle');
      if (vehicleData) {
        const parsed = JSON.parse(vehicleData);
        result.phone = result.phone || parsed.contact_number || '';
        result.address = result.address || parsed.pickup_address || '';
      }
      
      // Check userPhone direct storage
      const userPhone = localStorage.getItem('userPhone');
      if (userPhone) {
        result.phone = result.phone || userPhone;
      }
      
      // Check for address info
      const userAddress = localStorage.getItem('userAddress');
      if (userAddress) {
        result.address = result.address || userAddress;
      }
      
      // Check cart or checkout data
      const checkoutData = sessionStorage.getItem('checkout_data');
      if (checkoutData) {
        const parsed = JSON.parse(checkoutData);
        result.phone = result.phone || parsed.phone || parsed.phoneNumber || '';
        result.address = result.address || parsed.address || '';
        result.pincode = result.pincode || parsed.pincode || parsed.postalCode || '';
        result.city = result.city || parsed.city || '';
        result.state = result.state || parsed.state || '';
      }
      
      // Check service request data
      const serviceRequest = sessionStorage.getItem('service_request_data');
      if (serviceRequest) {
        const parsed = JSON.parse(serviceRequest);
        result.phone = result.phone || parsed.phone || parsed.phoneNumber || '';
        result.address = result.address || parsed.address || '';
        result.pincode = result.pincode || parsed.pincode || '';
      }
    } catch (error) {
      console.error('Error extracting checkout data:', error);
    }
    
    return result;
  };

  // Function to create a default profile when all else fails
  const createDefaultProfile = (): UserProfile => {
    const userEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail") || "";
    const userName = localStorage.getItem("userName") || sessionStorage.getItem("userName") || "";
    
    return {
      email: userEmail,
      name: userName,
      username: userName || "user",
      address: "",
      profile_photo: null,
      vehicle_name: null,
      vehicle_type: null,
      manufacturer: null,
      phone: ""
    };
  };

  // Helper function to get profile photo URL
  const getProfilePhotoUrl = (photoPath: string | null): string => {
    if (!photoPath) return "https://via.placeholder.com/150?text=Profile";
    
    // If it's already a full URL, return it
    if (photoPath.startsWith('http')) return photoPath;
    
    // Otherwise, prepend the API URL
    return `${API_CONFIG.BASE_URL}${photoPath}`;
  };

  // Register effect to initialize the map after the DOM is ready
  useEffect(() => {
    // Load profile data
    refreshBookings();
    fetchUserProfile();
  }, [refreshTimestamp]);

  // Create a safe profile object for use in the render section
  const safeProfile = profile || createDefaultProfile();
  
  // Simplified Google Maps functions
  const loadGoogleMapsScript = () => {
    console.log("Loading Google Maps script");
    // Simplified implementation since we no longer need it
    setScriptLoaded(true);
  };

  const initAutocomplete = () => {
    console.log("Initializing location autocomplete");
    // Simplified implementation since we no longer need it
    console.log("Location autocomplete initialized");
  };
  
  // Update handlePhotoClick to work even when not in edit mode
  const handlePhotoClick = () => {
    // Remove the edit mode check to allow changing the photo anytime
    // Create and trigger a file input directly instead of showing a modal
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.click();
    
    // When a file is selected, process it
    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        setSelectedFile(file);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
          // Show a success toast
          toast.success("Photo selected. Click 'Save Changes' to update your profile.");
          // If not in edit mode, enable edit mode to allow saving the photo
          if (!isEditing) {
            setIsEditing(true);
          }
        };
        reader.readAsDataURL(file);
      }
    };
  };

  // Add this function to handle the actual file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("userData");
    sessionStorage.removeItem("userProfile");
    window.location.href = "/login";
  };
  
  // Handle password change
  const handlePasswordChange = () => {
    console.log("Password change requested");
    // Implementation or navigate to password change page
    navigate("/change-password");
  };

  // Handle save profile
  const handleSaveProfile = () => {
    if (!profile) return;
    
    setIsSaving(true);
    
    // Validate required fields
    const errors: { [key: string]: string } = {};
    if (!profile.name) errors.name = "Name is required";
    if (!profile.email) errors.email = "Email is required";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSaving(false);
      return;
    }
    
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("You must be logged in to update your profile");
      setIsSaving(false);
      return;
    }
    
    // Save to API
    axios
      .patch(
        API_CONFIG.getApiUrl("accounts/profile/"),
        {
          name: profile.name,
          email: profile.email,
          username: profile.username,
          address: profile.address,
          phone: profile.phone,
          city: profile.city,
          state: profile.state,
          postal_code: profile.postal_code,
          preferredLocation: profile.preferredLocation,
          latitude: profile.latitude,
          longitude: profile.longitude,
          vehicle_name: profile.vehicle_name,
          vehicle_type: profile.vehicle_type,
          manufacturer: profile.manufacturer,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      .then((response) => {
        console.log("Profile updated successfully:", response.data);
        
        // Save to userData in localStorage
        localStorage.setItem("userData", JSON.stringify(profile));
        
        // Also save to individual keys for broader app usage
        if (profile.phone) {
          localStorage.setItem("userPhone", profile.phone);
        }
        
        if (profile.address) {
          localStorage.setItem("userAddress", profile.address);
        }
        
        if (profile.name) {
          localStorage.setItem("userName", profile.name);
        }
        
        if (profile.email) {
          localStorage.setItem("userEmail", profile.email);
        }
        
        // Save location data if available
        if (profile.latitude && profile.longitude && profile.preferredLocation) {
          const locationData = {
            latitude: profile.latitude,
            longitude: profile.longitude, 
            address: profile.preferredLocation
          };
          localStorage.setItem("userLocation", JSON.stringify(locationData));
        }
        
        // Update session storage for checkout data if it exists
        try {
          const checkoutData = sessionStorage.getItem("checkout_data");
          if (checkoutData) {
            const parsedData = JSON.parse(checkoutData);
            parsedData.phone = profile.phone || parsedData.phone;
            parsedData.address = profile.address || parsedData.address;
            parsedData.city = profile.city || parsedData.city;
            parsedData.state = profile.state || parsedData.state;
            parsedData.pincode = profile.postal_code || parsedData.pincode;
            
            sessionStorage.setItem("checkout_data", JSON.stringify(parsedData));
          }
        } catch (e) {
          console.warn("Error updating checkout data:", e);
        }
        
        setIsEditing(false);
        setIsSaving(false);
        toast.success("Profile updated successfully");
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile. Please try again.");
        setIsSaving(false);
      });
  };

  // Add this function after the other helper functions
  const getVehicleModelImage = () => {
    if (!profile?.vehicle_name) return null;
    
    // Check if we have this model in our vehicleModels array
    const modelObj = vehicleModels.find(m => m.id === Number(profile.vehicle_name));
    if (modelObj?.image) return modelObj.image;
    
    // If not found in vehicleModels, check sessionStorage
    try {
      const sessionModel = sessionStorage.getItem("selectedModel");
      if (sessionModel) {
        const parsedModel = JSON.parse(sessionModel);
        if (parsedModel.image) return parsedModel.image;
      }
    } catch (e) {
      console.error("Error getting model image from session:", e);
    }
    
    return null;
  };
  
  // Render the profile page
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <div className="text-center">
                <div 
                  className="h-24 w-24 rounded-full bg-[#FFF5F2] flex items-center justify-center mx-auto overflow-hidden cursor-pointer hover:opacity-90 relative"
                  onClick={handlePhotoClick}
                >
                  {profile && (previewUrl || safeProfile.profile_photo || getVehicleModelImage()) ? (
                    <>
                      <img
                        src={
                          previewUrl || 
                          getProfilePhotoUrl(safeProfile.profile_photo) ||
                          getVehicleModelImage()
                        }
                        alt="Profile"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/assets/default-avatar.png"; // Make sure to add a default avatar image
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 flex items-center justify-center">
                        <Camera className="h-6 w-6 text-white opacity-0 hover:opacity-100" />
                      </div>
                    </>
                  ) : (
                    <>
                      <User className="h-12 w-12 text-[#FF5733]" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 flex items-center justify-center">
                        <Camera className="h-6 w-6 text-white opacity-0 hover:opacity-100" />
                      </div>
                    </>
                  )}
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  {safeProfile.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Member since {safeProfile.memberSince || 'Today'}
                </p>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => handleTabChange("profile")}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                    activeTab === "profile"
                      ? "bg-[#FFF5F2] text-[#FF5733]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <User className="h-5 w-5 mr-3" />
                  Profile Information
                </button>
                <button
                  onClick={() => handleTabChange("services")}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                    activeTab === "services"
                      ? "bg-[#FFF5F2] text-[#FF5733]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Bike className="h-5 w-5 mr-3" />
                  My Services
                </button>
                <button
                  onClick={() => handleTabChange("subscriptions")}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                    activeTab === "subscriptions"
                      ? "bg-[#FFF5F2] text-[#FF5733]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Subscription className="h-5 w-5 mr-3" />
                  My Subscriptions
                </button>
                <button
                  onClick={() => handleTabChange("settings")}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                    activeTab === "settings"
                      ? "bg-[#FFF5F2] text-[#FF5733]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </button>
                <button
                  onClick={() => handleTabChange("bookings")}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                    activeTab === "bookings"
                      ? "bg-[#FFF5F2] text-[#FF5733]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <BookOpen className="h-5 w-5 mr-3" />
                  My Bookings
                </button>
              </nav>

              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Profile Information
                  </h3>
                  <button
                    onClick={() => {
                      const newEditMode = !isEditing;
                      setIsEditing(newEditMode);
                    }}
                    className="text-sm text-[#FF5733] hover:text-[#ff4019]"
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Profile Photo Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div
                        className={`h-24 w-24 rounded-full overflow-hidden bg-gray-100 ${isEditing ? "cursor-pointer" : ""}`}
                        onClick={isEditing ? handlePhotoClick : undefined}
                      >
                        {(previewUrl || safeProfile.profile_photo || getVehicleModelImage()) ? (
                          <img
                            src={
                              previewUrl || 
                              getProfilePhotoUrl(safeProfile.profile_photo) ||
                              getVehicleModelImage()
                            }
                            alt="Profile"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              console.error("Failed to load profile image");
                              const target = e.target as HTMLImageElement;
                              target.src = "https://via.placeholder.com/150?text=Profile";
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-[#FFF5F2]">
                            <User className="h-12 w-12 text-[#FF5733]" />
                          </div>
                        )}
                      </div>
                      
                      {isEditing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <Camera className="text-white" size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {safeProfile.name}
                      </h4>
                      <p className="text-sm text-gray-500">{safeProfile.email}</p>
                    </div>
                  </div>

                  {/* Personal Information Section */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <RequiredLabel text="Full Name" />
                        <input
                          type="text"
                          value={safeProfile.name}
                          onChange={(e) => {
                            setProfile({ ...safeProfile, name: e.target.value });
                            if (formErrors.name) {
                              setFormErrors({ ...formErrors, name: "" });
                            }
                          }}
                          disabled={!isEditing}
                          className={`mt-1 block w-full px-3 py-2 border ${formErrors.name ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]`}
                        />
                        {formErrors.name && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          value={safeProfile.email}
                          onChange={(e) =>
                            setProfile({ ...safeProfile, email: e.target.value })
                          }
                          disabled={true} // Email should not be editable
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                        />
                      </div>
                      <div>
                        <RequiredLabel text="Phone" />
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            value={safeProfile.phone || ""}
                            onChange={(e) => {
                              // Allow only numbers, '+' at the beginning, and limit length
                              const value = e.target.value;
                              const sanitizedValue = value.replace(
                                /[^\d+]/g,
                                "",
                              );

                              // Ensure '+' is only at the beginning
                              const formattedValue = sanitizedValue.startsWith(
                                "+",
                              )
                                ? "+" +
                                  sanitizedValue.substring(1).replace(/\+/g, "")
                                : sanitizedValue.replace(/\+/g, "");

                              // Limit to 15 digits excluding the '+' sign
                              const limitedValue = formattedValue.startsWith(
                                "+",
                              )
                                ? "+" + formattedValue.substring(1).slice(0, 15)
                                : formattedValue.slice(0, 15);

                              setProfile({ ...safeProfile, phone: limitedValue });
                              if (formErrors.phone) {
                                setFormErrors({ ...formErrors, phone: "" });
                              }
                            }}
                            disabled={!isEditing}
                            className={`mt-1 block w-full pl-10 px-3 py-2 border ${formErrors.phone ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]`}
                            placeholder="+919876543210"
                          />
                        </div>
                        {formErrors.phone && (
                          <p className="mt-1 text-sm text-red-500">
                            {formErrors.phone}
                          </p>
                        )}
                        {isEditing && !formErrors.phone && (
                          <p className="mt-1 text-xs text-gray-500">
                            Format: +999999999 (9-15 digits)
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-6">
                      <RequiredLabel text="Address" />
                      <input
                        type="text"
                        value={safeProfile.address}
                        onChange={(e) =>
                          setProfile({ ...safeProfile, address: e.target.value })
                        }
                        disabled={!isEditing}
                        className={`mt-1 block w-full px-3 py-2 border ${formErrors.address ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]`}
                      />
                      {formErrors.address && (
                        <p className="mt-1 text-sm text-red-500">
                          {formErrors.address}
                        </p>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setFormErrors({});
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019] flex items-center"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "services" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-3"
              >
                <MyServicesTab key={refreshTimestamp} />
              </motion.div>
            )}

            {activeTab === "subscriptions" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-3"
              >
                <MySubscriptionsTab key={refreshTimestamp} />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Account Settings
                  </h3>
                  <div className="space-y-4">
                    <button
                      onClick={handlePasswordChange}
                      className="w-full flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <Key className="h-5 w-5 text-gray-400" />
                        <span className="ml-3">Change Password</span>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 text-gray-400" />
                        <span className="ml-3">Notification Settings</span>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <span className="ml-3">Payment Methods</span>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <span className="ml-3">Saved Locations</span>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-gray-400" />
                        <span className="ml-3">Privacy Settings</span>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Danger Zone
                  </h3>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            )}

            {activeTab === "bookings" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-3"
              >
                <MyBookingsTab key={refreshTimestamp} />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
