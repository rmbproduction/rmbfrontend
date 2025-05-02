import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_CONFIG, googleMapsConfig } from "../config/api.config";
import marketplaceService from "../services/marketplaceService";

// Define the Google Maps type to avoid TypeScript errors
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface UserProfile {
  [key: string]: any; // Add index signature to allow string indexing
  id?: number;
  email: string;
  name: string;
  username: string;
  address: string;
  profile_photo?: string;
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

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "profile" | "services" | "settings"
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

  // Reference for the location input element
  const locationInputRef = useRef<HTMLInputElement>(null);
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

  // Add this function before fetchVehicleModels
  const fetchAllModels = async () => {
    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/";
      const accessToken = localStorage.getItem("accessToken");

      console.log("Fetching all vehicle models for debugging");

      const response = await axios.get(`${baseUrl}vehicle/vehicle-models/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("All vehicle models:", response.data);

      // Create a mapping of manufacturer ID to models with proper typing
      const modelsByManufacturer: Record<number, VehicleModel[]> = {};
      if (Array.isArray(response.data)) {
        response.data.forEach((model: any) => {
          // Handle manufacturer being an object
          let manufacturerId: number;
          if (
            typeof model.manufacturer === "object" &&
            model.manufacturer !== null
          ) {
            manufacturerId = model.manufacturer.id;
          } else {
            manufacturerId = Number(model.manufacturer);
          }

          if (!modelsByManufacturer[manufacturerId]) {
            modelsByManufacturer[manufacturerId] = [];
          }

          // Normalize model before adding to the group
          const normalizedModel = {
            ...model,
            manufacturer: manufacturerId,
          };

          modelsByManufacturer[manufacturerId].push(normalizedModel);
        });

        console.log("Models grouped by manufacturer:", modelsByManufacturer);
      }
    } catch (error) {
      console.error("Failed to fetch all vehicle models:", error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchVehicleData();
    fetchAllModels(); // Add this line to debug models

    // We'll initialize the Google Maps API when the component mounts
    if (!window.google) {
      loadGoogleMapsScript();
    } else {
      // If Google Maps is already loaded, initialize autocomplete
      initAutocomplete();
    }
  }, []);

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
    } else {
      // Clear vehicle models if either manufacturer or vehicle type is missing
      console.log(
        "Missing manufacturer or vehicle type, clearing vehicle models",
      );
      setVehicleModels([]);
    }
  }, [profile?.manufacturer, profile?.vehicle_type]);

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

  const fetchVehicleData = async () => {
    setLoadingVehicleData(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) throw new Error("No access token found");

      console.log("Fetching vehicle data (manufacturers and types)");

      // Fetch manufacturers
      const manufacturersUrl = API_CONFIG.getApiUrl("vehicle/manufacturers/");
      console.log("Manufacturers API URL:", manufacturersUrl);

      const manufacturersResponse = await axios.get(manufacturersUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("Manufacturers API response:", manufacturersResponse.data);

      if (Array.isArray(manufacturersResponse.data)) {
        console.log("Available manufacturers:");
        manufacturersResponse.data.forEach((manufacturer: Manufacturer) => {
          console.log(`- ID: ${manufacturer.id}, Name: ${manufacturer.name}`);
        });
      }

      // Fetch vehicle types
      const vehicleTypesUrl = API_CONFIG.getApiUrl("vehicle/vehicle-types/");
      console.log("Vehicle Types API URL:", vehicleTypesUrl);

      const vehicleTypesResponse = await axios.get(vehicleTypesUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("Vehicle Types API response:", vehicleTypesResponse.data);

      // Update state with fetched data
      setManufacturers(manufacturersResponse.data || []);
      setVehicleTypes(vehicleTypesResponse.data || []);

      // Set manufacturer and vehicle type in profile if available but not set in profile
      if (profile) {
        let updatedProfile = { ...profile };
        let profileChanged = false;

        // If profile doesn't have a manufacturer but we have manufacturers data, set the first one
        if (!profile.manufacturer && manufacturersResponse.data && manufacturersResponse.data.length > 0) {
          console.log("Setting default manufacturer:", manufacturersResponse.data[0].id);
          updatedProfile.manufacturer = manufacturersResponse.data[0].id;
          setSelectedManufacturer(manufacturersResponse.data[0].id);
          profileChanged = true;
        }

        // If profile doesn't have a vehicle type but we have vehicle types data, set the first one
        if (!profile.vehicle_type && vehicleTypesResponse.data && vehicleTypesResponse.data.length > 0) {
          console.log("Setting default vehicle type:", vehicleTypesResponse.data[0].id);
          updatedProfile.vehicle_type = vehicleTypesResponse.data[0].id;
          setSelectedVehicleType(vehicleTypesResponse.data[0].id);
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
          await fetchVehicleModels(Number(manuId), Number(typeId));
        }
      }
    } catch (error) {
      console.error("Failed to fetch vehicle data:", error);
      toast.error("Failed to load vehicle data", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoadingVehicleData(false);
    }
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
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) throw new Error("No access token found");

      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/";
      const url = `${baseUrl}vehicle/vehicle-models/?manufacturer=${manufacturerId}&vehicle_type=${vehicleTypeId}`;
      console.log("Vehicle Models API URL:", url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("Vehicle models API response:", response.data);

      if (Array.isArray(response.data)) {
        // Filter models to ensure they match both manufacturer and vehicle type
        const filteredModels = response.data.filter((model) => {
          const modelManufacturerId =
            typeof model.manufacturer === "object"
              ? model.manufacturer.id
              : Number(model.manufacturer);

          const modelVehicleTypeId =
            typeof model.vehicle_type === "object"
              ? model.vehicle_type.id
              : Number(model.vehicle_type);

          return (
            modelManufacturerId === Number(manufacturerId) &&
            modelVehicleTypeId === Number(vehicleTypeId)
          );
        });

        console.log("Filtered vehicle models:", {
          total: response.data.length,
          filtered: filteredModels.length,
          models: filteredModels.map((m) => ({
            id: m.id,
            name: m.name,
            manufacturer:
              typeof m.manufacturer === "object"
                ? m.manufacturer.id
                : m.manufacturer,
            vehicle_type:
              typeof m.vehicle_type === "object"
                ? m.vehicle_type.id
                : m.vehicle_type,
          })),
        });

        setVehicleModels(filteredModels);

        // Reset vehicle_name if current selection is not in filtered results
        if (profile?.vehicle_name) {
          const currentModelExists = filteredModels.some(
            (model) => model.id === Number(profile.vehicle_name),
          );
          if (!currentModelExists) {
            console.log(
              "Current vehicle model not found in filtered results, resetting selection",
            );
            setProfile({
              ...profile,
              vehicle_name: null,
            });
          }
        }
      } else {
        console.warn(
          "Unexpected API response format for vehicle models:",
          response.data,
        );
        setVehicleModels([]);
        if (profile?.vehicle_name) {
          setProfile({
            ...profile,
            vehicle_name: null,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch vehicle models:", error);
      setVehicleModels([]);
      if (profile?.vehicle_name) {
        setProfile({
          ...profile,
          vehicle_name: null,
        });
      }
      toast.error("Failed to load vehicle models. Please try again.");
    } finally {
      setLoadingVehicleData(false);
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

  const persistProfileData = (data: any) => {
    try {
      // 1. Save to localStorage for faster retrieval on page reload
      localStorage.setItem("userProfile", JSON.stringify(data));

      // 2. Also save to sessionStorage as backup
      sessionStorage.setItem("userProfile", JSON.stringify(data));

      // 3. Try to save to IndexedDB for longer-term storage
      try {
        const request = indexedDB.open("RepairMyBikeDB", 1);

        request.onupgradeneeded = (event) => {
          const db = request.result;
          if (!db.objectStoreNames.contains("userProfiles")) {
            db.createObjectStore("userProfiles", { keyPath: "email" });
          }
        };

        request.onsuccess = (event) => {
          const db = request.result;
          const transaction = db.transaction(["userProfiles"], "readwrite");
          const store = transaction.objectStore("userProfiles");
          store.put({ ...data, lastUpdated: new Date().toISOString() });
        };
      } catch (dbError) {
        console.error("IndexedDB storage failed:", dbError);
        // Not critical, as we already saved to localStorage and sessionStorage
      }

      console.log("Profile data successfully cached");
    } catch (error) {
      console.error("Error saving profile data to storage:", error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        navigate("/login-signup");
        return;
      }

      console.log("Starting profile data retrieval");

      // First, always load data from client-side storage if available
      let profileFromStorage = loadProfileFromStorage();
      let shouldFetchFromServer = true;

      // If we have profile data in storage, use it immediately
      if (profileFromStorage) {
        console.log("Loading profile from client storage", profileFromStorage);
        setProfile(profileFromStorage);
        setLoading(false);

        // Check if data is pending - if so, try to save it to server
        if (profileFromStorage.pending) {
          console.log(
            "Found pending profile changes, attempting to save to server",
          );
          try {
            await saveProfileToServer(profileFromStorage);
            // If successful, remove pending flag
            delete profileFromStorage.pending;
            persistProfileData(profileFromStorage);
          } catch (error) {
            console.error("Failed to save pending changes:", error);
            // Keep the pending flag for next attempt
          }
        }
      }

      // Then try to fetch the latest data from server if we didn't just save
      if (shouldFetchFromServer && !profileFromStorage?.pending) {
        console.log("Fetching user profile from server...");
        try {
          const response = await axios.get(
            API_CONFIG.getApiUrl("accounts/profile/"),
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            },
          );

          console.log("Profile fetch response:", response);
          const userData = response.data;
          if (!userData) {
            throw new Error("No profile data received");
          }

          // Ensure country is set to India if not specified
          const updatedUserData = {
            ...userData,
            country: userData.country || "India",
            memberSince: new Date(
              userData.date_joined || Date.now(),
            ).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            }),
          };

          setProfile(updatedUserData);

          // Update cached data
          persistProfileData(updatedUserData);
          setLoading(false);
        } catch (error: any) {
          console.error("Profile fetch error:", error);

          // If we already loaded from storage, don't treat 404 as needing profile creation
          if (
            profileFromStorage &&
            error.response &&
            error.response.status === 404
          ) {
            console.log(
              "Server doesn't have profile yet, but we have local data",
            );
            // Try to save the locally cached profile to the server
            try {
              await saveProfileToServer(profileFromStorage);
              toast.success("Successfully saved profile to server", {
                position: "top-right",
                autoClose: 3000,
              });
            } catch (saveError) {
              console.error(
                "Failed to save local profile to server:",
                saveError,
              );
              toast.warning(
                "Using locally saved profile data. Changes will be saved when connection is restored.",
                {
                  position: "top-right",
                  autoClose: 5000,
                },
              );
            }
          }
          // If we got a 404 and no cached profile, it means the profile doesn't exist yet
          else if (
            error.response &&
            (error.response.status === 404 ||
              error.response.data?.error === "Profile not found")
          ) {
            console.log("Profile not found, creating a new one...");
            await createUserProfile();
          } else {
            handleApiError(error);
          }
        }
      }
    } catch (error: any) {
      console.error("Error in fetchUserProfile:", error);
      setLoading(false);
    }
  };

  // Helper function to load profile from client-side storage
  const loadProfileFromStorage = () => {
    // Try localStorage first
    const cachedProfile = localStorage.getItem("userProfile");
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        return {
          ...parsed,
          memberSince: new Date(
            parsed.date_joined || Date.now(),
          ).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
        };
      } catch (e) {
        console.error("Error parsing localStorage profile:", e);
      }
    }

    // Then try sessionStorage
    const sessionProfile = sessionStorage.getItem("userProfile");
    if (sessionProfile) {
      try {
        const parsed = JSON.parse(sessionProfile);
        return {
          ...parsed,
          memberSince: new Date(
            parsed.date_joined || Date.now(),
          ).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
        };
      } catch (e) {
        console.error("Error parsing sessionStorage profile:", e);
      }
    }

    // Try IndexedDB as a last resort
    try {
      const request = indexedDB.open("RepairMyBikeDB", 1);
      request.onsuccess = (event) => {
        try {
          const db = request.result;
          const transaction = db.transaction(["userProfiles"], "readonly");
          const store = transaction.objectStore("userProfiles");
          const userEmail = JSON.parse(
            atob((localStorage.getItem("accessToken") || "").split(".")[1]),
          ).email;

          const getRequest = store.get(userEmail);
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              console.log("Profile loaded from IndexedDB");
              return {
                ...getRequest.result,
                memberSince: new Date(
                  getRequest.result.date_joined || Date.now(),
                ).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                }),
              };
            }
          };
        } catch (e) {
          console.error("Error retrieving from IndexedDB:", e);
        }
      };
    } catch (dbError) {
      console.log("IndexedDB not available:", dbError);
    }

    return null;
  };

  // Helper function to save profile to server
  const saveProfileToServer = async (profileData: any) => {
    console.log("Attempting to save profile to server:", profileData);
    
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        console.error("No access token available, can't save profile");
        return false;
      }

      // Prepare data for API - ensure we're sending the right format
      // Create a clean version of the profile with only the fields we want to update
      const cleanProfileData = {
        email: profileData.email,
        username: profileData.username,
        name: profileData.name,
        address: profileData.address || "",
        phone: profileData.phone || "",
        preferredLocation: profileData.preferredLocation || "",
        // Convert to numbers or null - don't send empty strings
        latitude: profileData.latitude ? Number(profileData.latitude) : null,
        longitude: profileData.longitude ? Number(profileData.longitude) : null,
        city: profileData.city || "",
        state: profileData.state || "",
        country: profileData.country || "",
        postal_code: profileData.postal_code || "",
        // Convert to numbers or null - don't send empty strings
        manufacturer: profileData.manufacturer ? Number(profileData.manufacturer) : null,
        vehicle_type: profileData.vehicle_type ? Number(profileData.vehicle_type) : null,
        vehicle_name: profileData.vehicle_name ? Number(profileData.vehicle_name) : null,
      };

      console.log("Sending clean profile data to server:", cleanProfileData);

      // Create form data for profile photo if available
      const formData = new FormData();
      
      // Append profile photo if exists
      if (selectedFile) {
        formData.append("profile_photo", selectedFile);
        console.log("Appending profile photo to form data");
      }
      
      // Append profile data as JSON
      formData.append(
        "data",
        JSON.stringify(cleanProfileData)
      );

      const response = await axios.put(
        API_CONFIG.getApiUrl("accounts/profile/"),
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            // Let axios set the content type for the FormData
            // It will automatically set it to multipart/form-data with the boundary
          },
        }
      );

      console.log("Profile update response:", response.data);

      // Get updated profile with any server-side changes
      const updatedProfile = response.data;
      
      // Ensure the updated data includes the form data we just sent
      const mergedProfile = {
        ...cleanProfileData,
        ...updatedProfile,
        // Make sure to keep these fields in the correct format
        manufacturer: updatedProfile.manufacturer ? Number(updatedProfile.manufacturer) : null,
        vehicle_type: updatedProfile.vehicle_type ? Number(updatedProfile.vehicle_type) : null,
        vehicle_name: updatedProfile.vehicle_name ? Number(updatedProfile.vehicle_name) : null,
        latitude: updatedProfile.latitude ? Number(updatedProfile.latitude) : null,
        longitude: updatedProfile.longitude ? Number(updatedProfile.longitude) : null,
      };
      
      console.log("Merged profile after server update:", mergedProfile);
      
      // Update local storage with the merged profile
      persistProfileData(mergedProfile);
      
      // Update state with the merged profile
      setProfile(mergedProfile);
      
      return true;
    } catch (error: any) {
      console.error("Error saving profile:", error);
      
      // Store any error for retry logic
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      const updatedProfile = {
        ...profileData,
        pending: true,
        lastError: errorMessage,
        lastErrorTime: new Date().toISOString(),
      };
      
      // Persist even with error to enable retry later
      persistProfileData(updatedProfile);
      
      return false;
    }
  };

  const createUserProfile = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        navigate("/login-signup");
        return;
      }

      let name = "";
      let email = "";
      let username = "";

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          name = userObj.name || userObj.username || "";
          email = userObj.email || "";
          username = userObj.username || "";
        } catch (e) {
          console.error("Error parsing stored user data:", e);
        }
      }

      if (!email || !username) {
        try {
          const payload = accessToken.split(".")[1];
          const decodedPayload = JSON.parse(atob(payload));
          email = decodedPayload.email || "";
          username = decodedPayload.username || "";
          name = decodedPayload.username || "";
        } catch (e) {
          console.error("Error decoding JWT:", e);
        }
      }

      // Create a new profile with default values
      const newProfile = {
        email: email,
        name: name || username || "User",
        username: username || email.split("@")[0],
        address: "",
        phone: "",
        preferredLocation: "",
        country: "India",
        city: "",
        state: "",
        postal_code: "",
        vehicle_name: null,
        vehicle_type: null,
        manufacturer: null,
      };

      // Store in localStorage to prevent data loss on refresh
      localStorage.setItem("tempUserProfile", JSON.stringify(newProfile));

      setProfile({
        ...newProfile,
        memberSince: new Date().toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        vehicle_name: null,
        vehicle_type: null,
        manufacturer: null,
      });

      console.log("Creating user profile with data:", newProfile);
      console.log("API URL:", API_CONFIG.getApiUrl("accounts/profile/"));

      try {
        const response = await axios.post(
          API_CONFIG.getApiUrl("accounts/profile/"),
          newProfile,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        console.log("Profile creation response:", response);

        // Update localStorage with server response
        localStorage.setItem("userProfile", JSON.stringify(response.data));
        localStorage.removeItem("tempUserProfile"); // Clean up temp data

        // Update profile state with the returned data
        setProfile({
          ...response.data,
          memberSince: new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
        });
      } catch (error: any) {
        console.error("Failed to create profile on server:", error);
        console.error("Server response:", error.response?.data);
        if (error.response?.status !== 500) {
          toast.error(
            error.response?.data?.detail ||
              "Error creating profile. Try updating your information.",
            {
              position: "top-right",
              autoClose: 5000,
            },
          );
        }
      }

      setIsEditing(true);
      setLoading(false);

      toast.info("Please complete your profile information", {
        position: "top-right",
        autoClose: 5000,
      });
    } catch (error) {
      console.error("Error in createUserProfile:", error);
      setLoading(false);
    }
  };

  const validateForm = () => {
    console.log("Running form validation...");
    
    if (!profile) {
      console.error("No profile to validate");
      return { general: "Profile data missing" };
    }

    const errors: { [key: string]: string } = {};

    // Check required fields
    if (!profile.name) {
      errors.name = "Name is required";
    }

    if (!profile.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
      errors.email = "Email is invalid";
    }

    if (!profile.phone) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(profile.phone.replace(/\D/g, ""))) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!profile.address) {
      errors.address = "Address is required";
    }

    // Validate vehicle data - be more permissive, just ensure types are correct
    if (profile.manufacturer && typeof Number(profile.manufacturer) !== 'number') {
      console.warn("Invalid manufacturer format:", profile.manufacturer);
      errors.manufacturer = "Invalid manufacturer selection";
    }

    if (profile.vehicle_type && typeof Number(profile.vehicle_type) !== 'number') {
      console.warn("Invalid vehicle type format:", profile.vehicle_type);
      errors.vehicle_type = "Invalid vehicle type selection";
    }

    if (profile.vehicle_name && typeof Number(profile.vehicle_name) !== 'number') {
      console.warn("Invalid vehicle model format:", profile.vehicle_name);
      errors.vehicle_name = "Invalid vehicle model selection";
    }

    // Only log validation output if there are errors
    if (Object.keys(errors).length > 0) {
      console.log("Form validation failed with errors:", errors);
    } else {
      console.log("Form validation passed successfully");
    }

    return errors;
  };

  const handleSaveProfile = async () => {
    console.log("Starting save profile process...");
    
    if (!profile) {
      console.error("No profile to save");
      toast.error("No profile data to save");
      return;
    }

    // Log the current state for debugging
    console.log("Current profile state:", {
      email: profile.email,
      name: profile.name,
      manufacturer: profile.manufacturer,
      vehicle_type: profile.vehicle_type,
      vehicle_name: profile.vehicle_name,
      latitude: profile.latitude,
      longitude: profile.longitude
    });
    
    // Set saving state
    setIsSaving(true);
    setError(null);

    try {
      // Run validation checks
      const validationErrors = validateForm();
      
      // If validation fails, show errors and stop
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        console.log("Validation failed:", validationErrors);
        
        // Show the first error in a toast
        const firstError = Object.values(validationErrors)[0];
        toast.error(firstError, {
          position: "top-right",
          autoClose: 3000,
        });
        
        setIsSaving(false);
        return;
      }
      
      // Clear form errors
      setFormErrors({});
      
      // Prepare data for saving - ensure all fields are in the right format
      const profileData = {
        ...profile,
        // Parse numeric fields to ensure they're stored as numbers or null
        manufacturer: profile.manufacturer ? Number(profile.manufacturer) : null,
        vehicle_type: profile.vehicle_type ? Number(profile.vehicle_type) : null,
        vehicle_name: profile.vehicle_name ? Number(profile.vehicle_name) : null,
        latitude: profile.latitude ? Number(profile.latitude) : null,
        longitude: profile.longitude ? Number(profile.longitude) : null,
      };
      
      // Always persist locally first to prevent data loss
      persistProfileData(profileData);
      
      console.log("Saving profile data to server:", profileData);
      
      // Try to save to server
      const saved = await saveProfileToServer(profileData);
      
      if (saved) {
        console.log("Profile saved successfully");
        toast.success("Profile saved successfully", {
          position: "top-right",
          autoClose: 2000,
        });
        
        // Refresh vehicle data after successful save
        if (profile.manufacturer && profile.vehicle_type) {
          console.log("Refreshing vehicle models after save");
          fetchVehicleModels(Number(profile.manufacturer), Number(profile.vehicle_type));
        }
        
        // Exit editing mode
        setIsEditing(false);
      } else {
        console.warn("Failed to save to server, but data is persisted locally");
        toast.warning("Changes saved locally. We'll sync when you're back online.", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (err: any) {
      console.error("Error in handleSaveProfile:", err);
      
      // Set error state
      setError(err.message || "Failed to save profile");
      
      // Show error toast
      toast.error(err.message || "Failed to save profile", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      // Always exit saving state
      setIsSaving(false);
    }
  };

  const handlePhotoClick = () => {
    if (isEditing) {
      // Trigger the file input
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        // Clear all user session data first
        marketplaceService.clearUserSession();
        localStorage.clear();
        navigate("/login-signup");
        return;
      }

      await axios.post("http://localhost:8000/api/accounts/logout/", {
        refresh: refreshToken,
      });

      // Clear all user session data before clearing localStorage
      marketplaceService.clearUserSession();
      
      // Clear specific auth tokens and metadata
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userProfile");
      localStorage.removeItem("tokenExpiration");
      localStorage.removeItem("rememberMe");
      
      // Clear any remaining data
      localStorage.clear();

      toast.success("Logged out successfully", {
        position: "top-right",
        autoClose: 3000,
      });

      navigate("/login-signup");
    } catch (error: any) {
      console.error("Logout error:", error);

      // Even on error, clear all sessionStorage data
      marketplaceService.clearUserSession();
      localStorage.clear();
      navigate("/login-signup");

      toast.error(
        error.response?.data?.error || "An error occurred during logout",
        {
          position: "top-right",
          autoClose: 5000,
        },
      );
    }
  };

  const handlePasswordChange = () => {
    navigate("/reset-password");
  };

  // Modify the loadGoogleMapsScript error handler to set the error state
  const loadGoogleMapsScript = useCallback(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log("Google Maps API already loaded");
      setMapsApiError(false);
      initAutocomplete();
      return;
    }

    console.log("Loading Google Maps API script");

    // Define the callback function on the window object
    window.initMap = function () {
      console.log("Google Maps API loaded successfully via callback");
      setMapsApiError(false);
      initAutocomplete();
    };

    // Create script element
    const script = document.createElement("script");

    // Make sure we're using a valid API key and the correct callback name
    const apiKey = googleMapsConfig.apiKey;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    // Add error handling
    script.onerror = () => {
      console.error(
        "Failed to load Google Maps API script. Check your API key and network connection.",
      );
      setMapsApiError(true);
      toast.error(
        "Location search functionality is limited. Please enter your location manually.",
        {
          position: "top-right",
          autoClose: 5000,
        },
      );
    };

    // Add timeout check in case the API takes too long to load
    const timeoutId = setTimeout(() => {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.warn("Google Maps API took too long to load, using fallback");
        setMapsApiError(true);
      }
    }, 10000); // 10 seconds timeout

    // Append script to document
    document.head.appendChild(script);
    console.log("Google Maps API script added to document head");

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Update the initAutocomplete function to only initialize when the field is visible and editable
  const initAutocomplete = () => {
    if (
      !locationInputRef.current ||
      !window.google ||
      !window.google.maps ||
      !window.google.maps.places
    ) {
      console.log(
        "Cannot initialize autocomplete: Google Maps API not loaded or location input not found",
      );
      return;
    }

    // Only initialize autocomplete if we're on the profile tab, editing, and the input is visible
    if (!isEditing || activeTab !== "profile") {
      console.log(
        "Not initializing autocomplete: User is not in edit mode or not on profile tab",
      );
      return;
    }

    console.log("Initializing Places Autocomplete");

    try {
      // First, remove any existing autocomplete to avoid duplicates
      const existingAutocomplete = locationInputRef.current.getAttribute(
        "data-autocomplete-initialized",
      );
      if (existingAutocomplete === "true") {
        console.log("Autocomplete already initialized on this input, skipping");
        return;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ["geocode", "establishment"],
          // Request more fields to ensure we get complete data
          fields: [
            "address_components",
            "formatted_address",
            "geometry",
            "name",
            "place_id",
          ],
          componentRestrictions: { country: "in" }, // Restrict to India
        },
      );

      // Mark the input as having autocomplete initialized
      locationInputRef.current.setAttribute(
        "data-autocomplete-initialized",
        "true",
      );

      // Handle place selection
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        console.log("Selected place:", place);

        // Check if we have a valid place with geometry
        if (!place || !place.geometry) {
          console.warn(
            "No details available for selected place or place has no geometry",
          );
          return;
        }

        // Get the formatted address
        const formattedAddress = place.formatted_address || place.name || "";

        // Get latitude and longitude
        const lat = place.geometry.location
          ? place.geometry.location.lat()
          : null;
        const lng = place.geometry.location
          ? place.geometry.location.lng()
          : null;

        if (!lat || !lng) {
          console.warn(
            "Location coordinates not available for the selected place",
          );
          return;
        }

        if (profile) {
          // Extract address components
          let city = "";
          let state = "";
          let country = "India";
          let postalCode = "";

          // Extract address components if available
          if (
            place.address_components &&
            Array.isArray(place.address_components)
          ) {
            for (const component of place.address_components) {
              if (!component.types || !Array.isArray(component.types)) continue;

              if (component.types.includes("locality")) {
                city = component.long_name;
              } else if (
                component.types.includes("administrative_area_level_1")
              ) {
                state = component.long_name;
              } else if (component.types.includes("country")) {
                country = component.long_name;
              } else if (component.types.includes("postal_code")) {
                postalCode = component.long_name;
              }
            }
          }

          // Update profile with the new location data
          // We must directly update the input value to ensure it shows the selection
          if (locationInputRef.current) {
            locationInputRef.current.value = formattedAddress;
          }

          setProfile({
            ...profile,
            preferredLocation: formattedAddress,
            latitude: lat,
            longitude: lng,
            city: city || profile.city || "",
            state: state || profile.state || "",
            country: country || profile.country || "India",
            postal_code: postalCode || profile.postal_code || "",
          });

          console.log("Location updated from autocomplete:", formattedAddress);

          // Clear form errors if any
          if (formErrors.preferredLocation) {
            setFormErrors({
              ...formErrors,
              preferredLocation: "",
              city: "",
              state: "",
              postal_code: "",
            });
          }
        }
      });

      setLocationLoaded(true);
      console.log("Places Autocomplete initialized successfully");
    } catch (error) {
      console.error("Error initializing Places Autocomplete:", error);
    }
  };

  // Initialize the map when showMap is true
  useEffect(() => {
    if (
      showMap &&
      window.google &&
      window.google.maps &&
      mapContainerRef.current &&
      profile
    ) {
      const defaultLocation = { lat: 20.5937, lng: 78.9629 }; // Default to center of India
      const mapOptions = {
        zoom: 13,
        center:
          profile.latitude && profile.longitude
            ? { lat: Number(profile.latitude), lng: Number(profile.longitude) }
            : defaultLocation,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
        mapTypeId: "roadmap",
      };

      const newMap = new window.google.maps.Map(
        mapContainerRef.current,
        mapOptions,
      );
      setMap(newMap);

      // Add a marker if we have coordinates
      if (profile.latitude && profile.longitude) {
        const newMarker = new window.google.maps.Marker({
          position: { lat: profile.latitude, lng: profile.longitude },
          map: newMap,
          draggable: isEditing,
          animation: window.google.maps.Animation.DROP,
        });
        setMarker(newMarker);

        // Add listener for marker drag events if in edit mode
        if (isEditing) {
          newMarker.addListener("dragend", () => {
            const position = newMarker.getPosition();
            if (position) {
              updateLocationFromCoordinates(position.lat(), position.lng());
            }
          });
        }
      } else if (isEditing) {
        // If no existing marker but in edit mode, allow clicking on map to set location
        newMap.addListener("click", (e: any) => {
          placeMarkerAndUpdateLocation(e.latLng);
        });
      }

      // For cleanup
      return () => {
        if (marker) {
          marker.setMap(null);
        }
      };
    }
  }, [showMap, profile, isEditing]);

  // Function to place a marker and update location
  const placeMarkerAndUpdateLocation = (latLng: any) => {
    if (map) {
      // Clear any existing marker
      if (marker) {
        marker.setMap(null);
      }

      // Create new marker
      const newMarker = new window.google.maps.Marker({
        position: latLng,
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });

      // Add listener for drag events
      newMarker.addListener("dragend", () => {
        const position = newMarker.getPosition();
        if (position) {
          updateLocationFromCoordinates(position.lat(), position.lng());
        }
      });

      setMarker(newMarker);

      // Update location data
      updateLocationFromCoordinates(latLng.lat(), latLng.lng());
    }
  };

  // Function to update location data from coordinates using reverse geocoding
  const updateLocationFromCoordinates = (lat: number, lng: number) => {
    console.log("Updating location from coordinates:", { lat, lng });
    if (!profile) return;

    // Ensure the coordinates are valid numbers
    if (isNaN(lat) || isNaN(lng)) {
      console.error("Invalid coordinates:", { lat, lng });
      return;
    }

    // First update coordinates
    const updatedProfile = {
      ...profile,
      latitude: lat,
      longitude: lng,
    };

    console.log("Updated profile with new coordinates:", {
      latitude: updatedProfile.latitude,
      longitude: updatedProfile.longitude
    });

    setProfile(updatedProfile);
    
    // Make sure to persist the updated profile to storage
    persistProfileData(updatedProfile);

    // Now use reverse geocoding to get address details
    if (window.google) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat, lng } },
          (results: any, status: any) => {
            if (status === "OK" && results[0]) {
              const addressComponents = results[0].address_components;
              let city = "";
              let state = "";
              let country = "";
              let postalCode = "";

              // Extract address components
              for (const component of addressComponents) {
                const componentType = component.types[0];

                switch (componentType) {
                  case "locality":
                    city = component.long_name;
                    break;
                  case "administrative_area_level_1":
                    state = component.long_name;
                    break;
                  case "country":
                    country = component.long_name;
                    break;
                  case "postal_code":
                    postalCode = component.long_name;
                    break;
                }
              }

              // Update profile with address details - parse coordinates to number
              const geocodedProfile = {
                ...profile,
                preferredLocation: results[0].formatted_address,
                latitude: lat,
                longitude: lng,
                city,
                state,
                country,
                postal_code: postalCode,
              };
              
              console.log("Updated profile with geocoded address:", {
                preferredLocation: geocodedProfile.preferredLocation,
                city: geocodedProfile.city,
                state: geocodedProfile.state
              });

              setProfile(geocodedProfile);
              persistProfileData(geocodedProfile);
            } else {
              console.error("Geocoding failed:", status);
            }
          },
        );
      } catch (error) {
        console.error("Error during geocoding:", error);
      }
    } else {
      console.warn("Google Maps API not available for geocoding");
    }
  };

  // Re-initialize autocomplete when editing mode changes
  useEffect(() => {
    if (isEditing && window.google && window.google.maps) {
      console.log("Editing mode enabled, initializing Places autocomplete");
      initAutocomplete();
    }
  }, [isEditing]);

  const handleApiError = useCallback(
    (error: any) => {
      console.error("API Error:", error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/login-signup");
      } else {
        const errorMessage =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          "An unexpected error occurred";
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
        setError(errorMessage);
      }
      setLoading(false);
    },
    [navigate],
  );

  // Update getProfilePhotoUrl to also handle File objects
  const getProfilePhotoUrl = useCallback((photoPath: string | undefined) => {
    // If it's already a URL or base64 string, return it directly
    if (
      photoPath &&
      (photoPath.startsWith("http") || photoPath.startsWith("data:"))
    ) {
      return photoPath;
    }
    // Otherwise, construct the media URL
    return photoPath ? API_CONFIG.getMediaUrl(photoPath) : "";
  }, []);

  useEffect(() => {
    if (map) {
      return () => {
        if (marker) {
          marker.setMap(null);
        }
        // Clear the map and marker state using their setter functions
        setMap(null);
        setMarker(null);
      };
    }
  }, [map]);

  // First add this helper function somewhere before the return statement
  const RequiredLabel = ({ text }: { text: string }) => (
    <label className="block text-sm font-medium text-gray-700">
      {text} <span className="text-red-500">*</span>
    </label>
  );

  // Add cleanup for Google Maps script and autocomplete instances
  useEffect(() => {
    // Cleanup function to run when component unmounts
    return () => {
      // Remove the global callback to prevent memory leaks
      if (window.initMap) {
        // @ts-ignore - Delete the property
        delete window.initMap;
      }

      // If there's a marker on the map, remove it
      if (marker) {
        marker.setMap(null);
      }

      // Clear map instance
      setMap(null);
      setMarker(null);

      console.log("Cleaned up Google Maps resources");
    };
  }, []);

  // Update the renderLocationInput function to include click handling
  const renderLocationInput = () => {
    if (mapsApiError) {
      // Simple text input as fallback
      return (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={profile?.preferredLocation || ""}
            onChange={(e) =>
              profile &&
              setProfile({ ...profile, preferredLocation: e.target.value })
            }
            disabled={!isEditing}
            className={`mt-1 block w-full pl-10 pr-10 px-3 py-2 border ${formErrors.preferredLocation ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]`}
            placeholder="Enter your location manually"
          />
          {isEditing && profile?.preferredLocation && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={() => {
                  // Clear location data
                  profile &&
                    setProfile({
                      ...profile,
                      preferredLocation: "",
                      latitude: undefined,
                      longitude: undefined,
                    });
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      );
    }

    // Google Maps autocomplete enabled input
    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={locationInputRef}
          type="text"
          value={profile?.preferredLocation || ""}
          onChange={(e) =>
            profile &&
            setProfile({ ...profile, preferredLocation: e.target.value })
          }
          onFocus={() => {
            // Reinitialize autocomplete on focus to ensure it works
            if (isEditing && locationInputRef.current) {
              locationInputRef.current.setAttribute(
                "data-autocomplete-initialized",
                "false",
              );
              setTimeout(() => initAutocomplete(), 10);
            }
          }}
          onClick={() => {
            // Force focus to help with suggestion visibility
            if (isEditing && locationInputRef.current) {
              // If there's no existing autocomplete, initialize it
              if (
                locationInputRef.current.getAttribute(
                  "data-autocomplete-initialized",
                ) !== "true"
              ) {
                console.log("Input clicked, initializing autocomplete");
                setTimeout(() => initAutocomplete(), 10);
              }
            }
          }}
          disabled={!isEditing}
          className={`mt-1 block w-full pl-10 pr-10 px-3 py-2 border ${formErrors.preferredLocation ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]`}
          placeholder="Search for a location or address"
        />
        {isEditing && profile?.preferredLocation && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={() => {
                // Clear location data
                profile &&
                  setProfile({
                    ...profile,
                    preferredLocation: "",
                    latitude: undefined,
                    longitude: undefined,
                  });
                // Set focus back to the input
                if (locationInputRef.current) {
                  locationInputRef.current.focus();

                  // Reinitialize autocomplete
                  locationInputRef.current.setAttribute(
                    "data-autocomplete-initialized",
                    "false",
                  );
                  setTimeout(() => initAutocomplete(), 10);
                }
              }}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Handle autocomplete initialization when tab changes
  useEffect(() => {
    // If switching to profile tab and in edit mode, initialize autocomplete
    if (activeTab === "profile" && isEditing) {
      console.log(
        "Active tab is profile and edit mode is on, initializing autocomplete",
      );

      // Small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        initAutocomplete();
      }, 100);

      return () => clearTimeout(timer);
    }

    // When switching away from profile tab, cleanup any autocomplete instances
    if (activeTab !== "profile" && locationInputRef.current) {
      console.log("Leaving profile tab, cleaning up autocomplete");
      locationInputRef.current.setAttribute(
        "data-autocomplete-initialized",
        "false",
      );
    }
  }, [activeTab, isEditing]);

  // Add handler function for tab switching to ensure proper cleanup
  const handleTabChange = (tab: "profile" | "services" | "settings") => {
    // If switching away from profile, clean up
    if (activeTab === "profile" && tab !== "profile") {
      if (locationInputRef.current) {
        locationInputRef.current.setAttribute(
          "data-autocomplete-initialized",
          "false",
        );
      }
    }

    // Change the tab
    setActiveTab(tab);

    // If switching to profile and editing, initialize after a small delay
    if (tab === "profile" && isEditing) {
      setTimeout(() => {
        initAutocomplete();
      }, 100);
    }
  };

  // Add effect to ensure Google Maps autocomplete works properly
  useEffect(() => {
    // Only run this when in edit mode on the profile tab
    if (!isEditing || activeTab !== "profile" || !locationInputRef.current) {
      return;
    }

    console.log("Setting up mutation observer for autocomplete");

    // Use MutationObserver to detect when Google Maps adds its autocomplete dropdown
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // Check if any of the added nodes are the autocomplete dropdown
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i] as HTMLElement;
            if (node.classList && node.classList.contains("pac-container")) {
              console.log("Google autocomplete dropdown detected");

              // Make sure clicks on suggestions work by preventing default handling
              const suggestions = node.querySelectorAll(".pac-item");
              suggestions.forEach((item) => {
                item.addEventListener("click", (e) => {
                  console.log("Suggestion clicked");
                  // Allow a moment for Google's own handlers to work
                  setTimeout(() => {
                    if (
                      locationInputRef.current &&
                      (!profile?.preferredLocation ||
                        profile.preferredLocation ===
                          locationInputRef.current.value)
                    ) {
                      // Force a change event to make sure the selection is picked up
                      const event = new Event("change", { bubbles: true });
                      locationInputRef.current.dispatchEvent(event);
                    }
                  }, 200);
                });
              });
            }
          }
        }
      }
    });

    // Start observing the document for added nodes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Clean up the observer when the component unmounts or edit mode changes
    return () => {
      observer.disconnect();
    };
  }, [isEditing, activeTab, profile?.preferredLocation]);

  // Add a useEffect to retry pending profile saves when online
  useEffect(() => {
    if (!profile?.pending) return;

    // Function to retry saving profile
    const retrySave = async () => {
      if (!profile) return;

      console.log("Retrying to save pending profile changes...");

      try {
        // Clone profile to avoid modifying the state directly
        const profileToSave = { ...profile };

        // Remove pending flag before saving
        delete profileToSave.pending;
        delete profileToSave.lastError;
        delete profileToSave.lastErrorTime;

        // Attempt to save to server
        await saveProfileToServer(profileToSave);

        // Update profile state to remove pending flag
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                pending: false,
                lastError: undefined,
                lastErrorTime: undefined,
              }
            : null,
        );

        // Show success message
        toast.success("Successfully saved pending profile changes!", {
          position: "top-right",
          autoClose: 3000,
        });
      } catch (error) {
        console.error("Failed to save pending profile changes:", error);
        // We'll try again next time the user is online
      }
    };

    // Check if we're online
    if (navigator.onLine) {
      // If we're online, try to save immediately
      retrySave();
    }

    // Also listen for online events to retry when the connection is restored
    const handleOnline = () => {
      console.log("Network connection restored, retrying pending save...");
      retrySave();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [profile?.pending]);

  // Add this effect to load vehicle models when profile is loaded and has a manufacturer
  useEffect(() => {
    if (!profile) return;

    // If profile has a manufacturer and we don't have that manufacturer selected, update it
    if (profile.manufacturer) {
      const manufacturerId = Number(profile.manufacturer);

      // Only update if the selected manufacturer is different
      if (manufacturerId !== selectedManufacturer) {
        console.log(
          `Profile has manufacturer ${manufacturerId}, updating selected manufacturer`,
        );
        setSelectedManufacturer(manufacturerId);

        // Fetch vehicle models for this manufacturer if we don't have any yet
        if (vehicleModels.length === 0) {
          console.log(
            `No vehicle models loaded for manufacturer ${manufacturerId}, fetching them now`,
          );
          fetchVehicleModels(manufacturerId, selectedVehicleType);
        }
      }
    }
  }, [
    profile,
    selectedManufacturer,
    vehicleModels.length,
    selectedVehicleType,
  ]);

  // Add logging to the main vehicle model dropdown render function
  // At the beginning of the return statement in the ProfilePage component, before the JSX
  console.log("Rendering ProfilePage with state:", {
    selectedManufacturer,
    vehicleModelsCount: vehicleModels.length,
    profileManufacturer: profile ? profile.manufacturer : null,
    profileVehicleModel: profile ? profile.vehicle_name : null,
    loadingVehicleData,
    isEditing,
  });

  // Add a specific effect to handle Hero models loading since we know they exist
  useEffect(() => {
    // If manufacturers are loaded and we have Hero but no models are available
    if (manufacturers.length > 0 && vehicleModels.length === 0) {
      // Find Hero in the manufacturers list
      const heroManufacturer = manufacturers.find(
        (m) =>
          m.name?.toLowerCase() === "hero" ||
          m.name?.toLowerCase().includes("hero"),
      );

      if (heroManufacturer) {
        console.log(
          `Found Hero manufacturer with ID ${heroManufacturer.id}, fetching its models`,
        );
        setSelectedManufacturer(heroManufacturer.id);
        fetchVehicleModels(heroManufacturer.id, selectedVehicleType);
      }
    }
  }, [manufacturers, vehicleModels.length, selectedVehicleType]);

  // Function to get vehicle name by ID
  const getVehicleModelName = useCallback(
    (modelId: string | number | null) => {
      if (!modelId) return "";
      const model = vehicleModels.find((m) => m.id === Number(modelId));
      return model ? model.name : `Model ${modelId}`;
    },
    [vehicleModels],
  );

  // Function to get manufacturer name by ID
  const getManufacturerName = useCallback(
    (manufacturerId: string | number | null) => {
      if (!manufacturerId) return "";
      const manufacturer = manufacturers.find(
        (m) => m.id === Number(manufacturerId),
      );
      return manufacturer
        ? manufacturer.name
        : `Manufacturer ${manufacturerId}`;
    },
    [manufacturers],
  );

  // Function to get vehicle type name by ID
  const getVehicleTypeName = useCallback(
    (typeId: string | number | null) => {
      if (!typeId) return "";
      const type = vehicleTypes.find((t) => t.id === Number(typeId));
      return type ? type.name : `Type ${typeId}`;
    },
    [vehicleTypes],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormErrors({});

    if (!profile) return;

    // Validate required fields
    const errors: { [key: string]: string } = {};
    if (!profile.manufacturer) errors.manufacturer = "Manufacturer is required";
    if (!profile.vehicle_type) errors.vehicle_type = "Vehicle type is required";
    if (!profile.vehicle_name)
      errors.vehicle_name = "Vehicle model is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSaving(false);
      return;
    }

    try {
      const response = await axios.post(
        API_CONFIG.getApiUrl(API_CONFIG.ENDPOINTS.PROFILE),
        {
          ...profile,
          vehicle_name: Number(profile.vehicle_name),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.status === 200 || response.status === 201) {
        // Success handling
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        setFormErrors(response.data);
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchManufacturersAndTypes = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) throw new Error("No access token found");

        // Fetch manufacturers
        const manufacturersResponse = await axios.get(
          "http://127.0.0.1:8000/api/repairing_service/manufacturers/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        console.log("Manufacturers:", manufacturersResponse.data);
        setManufacturers(manufacturersResponse.data);

        // Fetch vehicle types
        const vehicleTypesResponse = await axios.get(
          "http://127.0.0.1:8000/api/vehicle/vehicle-types/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        console.log("Vehicle Types:", vehicleTypesResponse.data);
        setVehicleTypes(vehicleTypesResponse.data);
      } catch (error) {
        console.error("Error fetching manufacturers or vehicle types:", error);
        toast.error("Failed to load vehicle data. Please try again later.");
      }
    };

    fetchManufacturersAndTypes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#FF5733] text-white px-4 py-2 rounded-lg hover:bg-[#ff4019] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile data</p>
          <button
            onClick={() => navigate("/login-signup")}
            className="mt-4 px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019]"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const upcomingServices = [
    {
      id: 1,
      service: "Premium Tune-Up",
      date: "2024-03-15",
      time: "10:00 AM",
      status: "Scheduled",
    },
    {
      id: 2,
      service: "Brake Service",
      date: "2024-03-20",
      time: "2:30 PM",
      status: "Pending",
    },
  ];

  const serviceHistory = [
    {
      id: 3,
      service: "Basic Maintenance",
      date: "2024-02-10",
      mechanic: "Mike Smith",
      rating: 5,
    },
    {
      id: 4,
      service: "Tire Replacement",
      date: "2024-01-15",
      mechanic: "Sarah Johnson",
      rating: 4,
    },
  ];

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
                <div className="h-24 w-24 rounded-full bg-[#FFF5F2] flex items-center justify-center mx-auto overflow-hidden">
                  {profile.profile_photo || previewUrl ? (
                    <img
                      src={
                        previewUrl || getProfilePhotoUrl(profile.profile_photo)
                      }
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/assets/default-avatar.png"; // Make sure to add a default avatar image
                      }}
                    />
                  ) : (
                    <User className="h-12 w-12 text-[#FF5733]" />
                  )}
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  {profile.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Member since {profile.memberSince}
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

                      // If enabling edit mode, initialize autocomplete with a delay
                      if (newEditMode && activeTab === "profile") {
                        setTimeout(() => {
                          // Reset the autocomplete initialized flag
                          if (locationInputRef.current) {
                            locationInputRef.current.setAttribute(
                              "data-autocomplete-initialized",
                              "false",
                            );
                          }
                          initAutocomplete();
                        }, 100);
                      }
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
                        onClick={handlePhotoClick}
                      >
                        {profile.profile_photo || previewUrl ? (
                          <img
                            src={
                              previewUrl ||
                              getProfilePhotoUrl(profile.profile_photo)
                            }
                            alt="Profile"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/assets/default-avatar.png"; // Make sure to add a default avatar image
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-[#FFF5F2]">
                            <User className="h-12 w-12 text-[#FF5733]" />
                          </div>
                        )}

                        {isEditing && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <label
                          htmlFor="profile_photo"
                          className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#FF5733] flex items-center justify-center cursor-pointer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="h-4 w-4 text-white"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          <input
                            type="file"
                            id="profile_photo"
                            name="profile_photo"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedFile(file);
                                // Create a preview URL and update the state immediately
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setPreviewUrl(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {profile.name}
                      </h4>
                      <p className="text-sm text-gray-500">{profile.email}</p>
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
                          value={profile.name}
                          onChange={(e) => {
                            setProfile({ ...profile, name: e.target.value });
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
                          value={profile.email}
                          onChange={(e) =>
                            setProfile({ ...profile, email: e.target.value })
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
                            value={profile.phone || ""}
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

                              setProfile({ ...profile, phone: limitedValue });
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
                      <h4 className="text-base font-medium text-gray-700 mb-4">
                        Additional Contact Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            City
                          </label>
                          <input
                            type="text"
                            value={profile.city || ""}
                            onChange={(e) =>
                              setProfile({ ...profile, city: e.target.value })
                            }
                            disabled={!isEditing}
                            className={`mt-1 block w-full px-3 py-2 border ${formErrors.city ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            State
                          </label>
                          <input
                            type="text"
                            value={profile.state || ""}
                            onChange={(e) =>
                              setProfile({ ...profile, state: e.target.value })
                            }
                            disabled={!isEditing}
                            className={`mt-1 block w-full px-3 py-2 border ${formErrors.state ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Country
                          </label>
                          <input
                            type="text"
                            value={profile.country || ""}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                country: e.target.value,
                              })
                            }
                            disabled={!isEditing}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={profile.postal_code || ""}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                postal_code: e.target.value,
                              })
                            }
                            disabled={!isEditing}
                            className={`mt-1 block w-full px-3 py-2 border ${formErrors.postal_code ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <RequiredLabel text="Address" />
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) =>
                          setProfile({ ...profile, address: e.target.value })
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

                    <div className="mt-6">
                      <RequiredLabel text="Preferred Location" />
                      <input
                        type="text"
                        ref={locationInputRef}
                        value={profile?.preferredLocation || ""}
                        onChange={(e) => {
                          setProfile((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  preferredLocation: e.target.value,
                                }
                              : null,
                          );
                          if (formErrors.preferredLocation) {
                            setFormErrors({
                              ...formErrors,
                              preferredLocation: "",
                            });
                          }
                        }}
                        disabled={!isEditing}
                        placeholder="Enter your preferred location"
                        className={`mt-1 block w-full px-3 py-2 border ${
                          formErrors.preferredLocation
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]`}
                      />
                      {formErrors.preferredLocation && (
                        <p className="mt-1 text-sm text-red-500">
                          {formErrors.preferredLocation}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Information Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Vehicle Information{" "}
                      <span className="text-red-500">*</span>
                    </h4>

                    {loadingVehicleData ? (
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#FF5733]"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Manufacturer Selection */}
                        <div>
                          <RequiredLabel text="Manufacturer" />
                          <select
                            value={profile?.manufacturer || ""}
                            onChange={(e) =>
                              handleManufacturerChange(Number(e.target.value))
                            }
                            disabled={!isEditing}
                            className={`mt-1 block w-full px-3 py-2 border ${formErrors.manufacturer ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]`}
                          >
                            <option value="">Select Manufacturer</option>
                            {manufacturers.map((manufacturer: Manufacturer) => (
                              <option
                                key={manufacturer.id}
                                value={manufacturer.id}
                              >
                                {manufacturer.name}
                              </option>
                            ))}
                          </select>
                          {formErrors.manufacturer && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.manufacturer}
                            </p>
                          )}
                        </div>

                        {/* Vehicle Type Selection */}
                        <div>
                          <RequiredLabel text="Vehicle Type" />
                          <select
                            value={profile?.vehicle_type || ""}
                            onChange={(e) =>
                              handleVehicleTypeChange(Number(e.target.value))
                            }
                            disabled={!isEditing}
                            className={`mt-1 block w-full px-3 py-2 border ${formErrors.vehicle_type ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]`}
                          >
                            <option value="">Select Vehicle Type</option>
                            {vehicleTypes.map((type: VehicleType) => (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            ))}
                          </select>
                          {formErrors.vehicle_type && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.vehicle_type}
                            </p>
                          )}
                        </div>

                        {/* Vehicle Model Selection */}
                        <div>
                          <RequiredLabel text="Vehicle Model" />
                          <select
                            value={profile?.vehicle_name || ""}
                            onChange={(e) =>
                              handleVehicleModelChange(Number(e.target.value))
                            }
                            disabled={
                              !isEditing ||
                              !profile?.manufacturer ||
                              !profile?.vehicle_type ||
                              vehicleModels.length === 0
                            }
                            className={`mt-1 block w-full px-3 py-2 border ${formErrors.vehicle_name ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]`}
                          >
                            <option value="">
                              {!profile?.manufacturer || !profile?.vehicle_type
                                ? "Select Vehicle Model"
                                : vehicleModels.length === 0
                                  ? "No models available"
                                  : "Select Vehicle Model"}
                            </option>
                            {vehicleModels.map((model: VehicleModel) => (
                              <option key={model.id} value={model.id}>
                                {model.name}
                              </option>
                            ))}
                          </select>
                          {formErrors.vehicle_name && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.vehicle_name}
                            </p>
                          )}
                          {!profile?.manufacturer && !profile?.vehicle_type && (
                            <p className="mt-1 text-sm text-gray-500">
                              Select manufacturer and vehicle type first
                            </p>
                          )}
                          {profile?.manufacturer &&
                            profile?.vehicle_type &&
                            vehicleModels.length === 0 && (
                              <p className="mt-1 text-sm text-gray-500">
                                No {getVehicleTypeName(profile.vehicle_type)}{" "}
                                models available for{" "}
                                {getManufacturerName(profile.manufacturer)}
                              </p>
                            )}
                        </div>
                      </div>
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
            )}

            {activeTab === "services" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Upcoming Services
                  </h3>
                  <div className="space-y-4">
                    {upcomingServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#FFF5F2] flex items-center justify-center">
                            <Bike className="h-5 w-5 text-[#FF5733]" />
                          </div>
                          <div className="ml-4">
                            <h4 className="font-medium text-gray-900">
                              {service.service}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {service.date} at {service.time}
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                          {service.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Service History
                  </h3>
                  <div className="space-y-4">
                    {serviceHistory.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#FFF5F2] flex items-center justify-center">
                            <Clock className="h-5 w-5 text-[#FF5733]" />
                          </div>
                          <div className="ml-4">
                            <h4 className="font-medium text-gray-900">
                              {service.service}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {service.date} • {service.mechanic}
                            </p>
                          </div>
                        </div>
                        <div className="flex text-yellow-400">
                          {[...Array(service.rating)].map((_, i) => (
                            <svg
                              key={i}
                              className="h-5 w-5 fill-current"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
