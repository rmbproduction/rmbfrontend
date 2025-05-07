import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bike, Tag, Edit, Save, Camera, FileText, Info, 
  Calendar, DollarSign, CheckCircle, AlertCircle, ImageOff,
  RefreshCw, X, ChevronDown, ChevronUp, Mail
} from 'lucide-react';
import { toast } from 'react-toastify';
import marketplaceService from '../services/marketplaceService';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import SafeImage from '../components/SafeImage';
import { 
  isValidImageUrl, 
  safeRevokeUrl, 
  cleanupBlobUrls, 
  extractPhotoUrls, 
  sanitizeUrlsForStorage,
  isBase64Image,
  syncImageStorageForVehicle
} from '../services/imageUtils';
import persistentStorageService from '../services/persistentStorageService';
import emailService from '../services/emailService';

// Helper function to extract and normalize vehicle data from API response
const normalizeVehicleData = (responseData: any) => {
  if (!responseData) return {};
  
  console.log('normalizeVehicleData input:', responseData);
  
  // CRITICAL FIX: Handle vehicle_details alongside the normal vehicle property
  let vehicleData: Record<string, any> = {};
  
  // First priority: use vehicle_details if it has good data and vehicle has poor data
  if (responseData.vehicle_details && 
      (responseData.vehicle?.brand === 'Unknown' || 
       !responseData.vehicle?.brand ||
       responseData.vehicle?.registration_number === 'Unknown')) {
    // If vehicle_details exists but vehicle has Unknown values, use vehicle_details
    console.log('Using vehicle_details as primary data source');
    
    // Merge vehicle and vehicle_details, prioritizing vehicle_details for critical fields
    vehicleData = {
      ...(responseData.vehicle || {}),
      brand: responseData.vehicle_details.brand || responseData.vehicle?.brand || 'Unknown',
      model: responseData.vehicle_details.model || responseData.vehicle?.model || 'Unknown',
      registration_number: responseData.vehicle_details.registration_number || responseData.vehicle?.registration_number || 'Unknown',
      condition: responseData.vehicle_details.condition || responseData.vehicle?.condition || 'Not Available',
      kms_driven: responseData.vehicle_details.kms_driven || responseData.vehicle?.kms_driven || 0,
      Mileage: responseData.vehicle_details.Mileage || responseData.vehicle_details.mileage || responseData.vehicle?.Mileage || 'Not Available',
      mileage: responseData.vehicle_details.mileage || responseData.vehicle_details.Mileage || responseData.vehicle?.mileage || 'Not Available',
      engine_capacity: responseData.vehicle_details.engine_capacity || responseData.vehicle?.engine_capacity || 0,
      last_service_date: responseData.vehicle_details.last_service_date || responseData.vehicle?.last_service_date || null,
      insurance_valid_till: responseData.vehicle_details.insurance_valid_till || responseData.vehicle?.insurance_valid_till || null,
      price: responseData.vehicle_details.price || responseData.vehicle?.price || responseData.expected_price || 0,
      expected_price: responseData.vehicle_details.expected_price || responseData.vehicle?.expected_price || responseData.price || 0,
      fuel_type: responseData.vehicle_details.fuel_type || responseData.vehicle?.fuel_type || 'petrol',
      color: responseData.vehicle_details.color || responseData.vehicle?.color || 'Not Available',
      year: responseData.vehicle_details.year || responseData.vehicle?.year || new Date().getFullYear()
    };
  } else {
    // Standard handling - if vehicle has good data or there's no vehicle_details
    vehicleData = responseData.vehicle || responseData;
    
    // If we have vehicle_details but used vehicle as primary, still check for missing fields
    if (responseData.vehicle_details) {
      const fieldsToCheck = [
        'brand', 'model', 'registration_number', 'condition', 'kms_driven',
        'Mileage', 'mileage', 'engine_capacity', 'last_service_date', 
        'insurance_valid_till', 'price', 'expected_price', 'color', 'year'
      ];
      
      fieldsToCheck.forEach(field => {
        if ((!vehicleData[field] || 
            vehicleData[field] === 'Unknown' || 
            vehicleData[field] === 'Not Available') && 
            responseData.vehicle_details[field]) {
          vehicleData[field] = responseData.vehicle_details[field];
          console.log(`Copied missing field ${field} from vehicle_details:`, responseData.vehicle_details[field]);
        }
      });
    }
  }
  
  // Debug incoming data structure
  console.log('normalizeVehicleData input data structure:', {
    hasVehicleProp: !!responseData.vehicle,
    hasVehicleDetailsProp: !!responseData.vehicle_details,
    hasDirectVehicleFields: !!(vehicleData.brand || vehicleData.registration_number || vehicleData.Mileage),
    allKeys: Object.keys(vehicleData).join(', ')
  });
  
  // CRITICAL FIX: First check persistent storage for the most reliable data
  // This is a synchronous function, so we need to handle this differently
  let persistentData = null;
  const vehicleId = responseData.id || vehicleData.id;
  if (vehicleId) {
    // Look for cached persistent data in a global variable
    const persistentDataKey = `__persistentData_${vehicleId}`;
    if ((window as any)[persistentDataKey]) {
      persistentData = (window as any)[persistentDataKey];
      console.log('Found cached persistent data:', persistentData);
    }
  }
  
  // Check for backup data first - this is our most reliable source since it came directly from the form
  let backupData = null;
  try {
    // Try sessionStorage first as it's faster
    const lastSubmittedVehicle = sessionStorage.getItem('last_submitted_vehicle');
    if (lastSubmittedVehicle) {
      backupData = JSON.parse(lastSubmittedVehicle);
      console.log('Found backup data in sessionStorage:', backupData);
    } else {
      // Fallback to localStorage if not in sessionStorage
      const localBackup = localStorage.getItem('last_submitted_vehicle');
      if (localBackup) {
        backupData = JSON.parse(localBackup);
        console.log('Found backup data in localStorage:', backupData);
      }
    }
  } catch (e) {
    console.error('Error accessing backup data:', e);
  }
  
  // If responseData.id exists, look for vehicle-specific data in session/local storage
  let specificVehicleData = null;
  if (responseData.id) {
    try {
      const sessionKey = `vehicle_summary_${responseData.id}`;
      const sessionData = sessionStorage.getItem(sessionKey);
      if (sessionData) {
        specificVehicleData = JSON.parse(sessionData);
        console.log(`Found vehicle-specific data in sessionStorage with key ${sessionKey}:`, specificVehicleData);
      } else {
        const localKey = `vehicle_data_${responseData.id}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
          specificVehicleData = JSON.parse(localData);
          console.log(`Found vehicle-specific data in localStorage with key ${localKey}:`, specificVehicleData);
        }
      }
    } catch (e) {
      console.error('Error accessing specific vehicle data:', e);
    }
  }
  
  // Create a helper function to get the best value, prioritizing our sources in order
  const getBestValue = (field: string, defaultValue: any) => {
    // Priority order (modified):
    // 0. Persistent storage data (most reliable and preserved across refreshes)
    if (persistentData?.vehicle && 
        persistentData.vehicle[field] !== undefined && 
        persistentData.vehicle[field] !== null && 
        persistentData.vehicle[field] !== '' &&
        persistentData.vehicle[field] !== 'Unknown' &&
        persistentData.vehicle[field] !== 'Not Available') {
      console.log(`Using persistent storage data for ${field}:`, persistentData.vehicle[field]);
      return persistentData.vehicle[field];
    }
    
    // Direct field in persistent data
    if (persistentData && 
        persistentData[field] !== undefined && 
        persistentData[field] !== null && 
        persistentData[field] !== '' &&
        persistentData[field] !== 'Unknown' &&
        persistentData[field] !== 'Not Available') {
      console.log(`Using persistent storage data (non-nested) for ${field}:`, persistentData[field]);
      return persistentData[field];
    }
    
    // 1. Vehicle-specific session/localStorage data
    if (specificVehicleData?.vehicle && 
        specificVehicleData.vehicle[field] !== undefined && 
        specificVehicleData.vehicle[field] !== null && 
        specificVehicleData.vehicle[field] !== '' &&
        specificVehicleData.vehicle[field] !== 'Unknown' &&
        specificVehicleData.vehicle[field] !== 'Not Available') {
      console.log(`Using specific vehicle data for ${field}:`, specificVehicleData.vehicle[field]);
      return specificVehicleData.vehicle[field];
    }
    
    // 2. Direct field in specific vehicle data
    if (specificVehicleData && 
        specificVehicleData[field] !== undefined && 
        specificVehicleData[field] !== null && 
        specificVehicleData[field] !== '' &&
        specificVehicleData[field] !== 'Unknown' &&
        specificVehicleData[field] !== 'Not Available') {
      console.log(`Using specific vehicle data (non-nested) for ${field}:`, specificVehicleData[field]);
      return specificVehicleData[field];
    }
    
    // 3. Check vehicle_details
    if (responseData.vehicle_details && 
        responseData.vehicle_details[field] !== undefined && 
        responseData.vehicle_details[field] !== null &&
        responseData.vehicle_details[field] !== '' &&
        responseData.vehicle_details[field] !== 'Unknown' &&
        responseData.vehicle_details[field] !== 'Not Available') {
      console.log(`Using vehicle_details for ${field}:`, responseData.vehicle_details[field]);
      return responseData.vehicle_details[field];
    }
    
    // 4. Backup data from last form submission
    if (backupData?.vehicle && 
        backupData.vehicle[field] !== undefined && 
        backupData.vehicle[field] !== null && 
        backupData.vehicle[field] !== '' &&
        backupData.vehicle[field] !== 'Unknown' &&
        backupData.vehicle[field] !== 'Not Available') {
      console.log(`Using backup data for ${field}:`, backupData.vehicle[field]);
      return backupData.vehicle[field];
    }
    
    // 5. Direct field in backup data
    if (backupData && 
        backupData[field] !== undefined && 
        backupData[field] !== null && 
        backupData[field] !== '' &&
        backupData[field] !== 'Unknown' &&
        backupData[field] !== 'Not Available') {
      console.log(`Using backup data (non-nested) for ${field}:`, backupData[field]);
      return backupData[field];
    }
    
    // 6. API response data (original vehicle object)
    if (vehicleData[field] !== undefined && 
        vehicleData[field] !== null && 
        vehicleData[field] !== '' &&
        vehicleData[field] !== 'Unknown' &&
        vehicleData[field] !== 'Not Available') {
      return vehicleData[field];
    }
    
    // 7. Last resort: try direct field from API response
    if (responseData[field] !== undefined && 
        responseData[field] !== null && 
        responseData[field] !== '' &&
        responseData[field] !== 'Unknown' &&
        responseData[field] !== 'Not Available') {
      return responseData[field];
    }
    
    // 8. If all else fails, use the default
    return defaultValue;
  };
  
  // Try to get the expected price from sessionStorage
  let expectedPrice = 0;
  try {
    const storedPrice = sessionStorage.getItem('vehicle_expected_price');
    if (storedPrice) {
      expectedPrice = parseInt(storedPrice, 10);
      console.log('Retrieved expected price from sessionStorage:', expectedPrice);
    }
  } catch (e) {
    console.error('Error reading expected price from sessionStorage:', e);
  }
  
  // Get contact information with priority from backups
  const contactNumber = getBestValue('contact_number', responseData.contact_number || '');
  const pickupAddress = getBestValue('pickup_address', responseData.pickup_address || '');
  
  // Check for brand and model in the parent object if they're not in the vehicle child
  const brand = getBestValue('brand', responseData.brand || 'Unknown');
  const model = getBestValue('model', responseData.model || 'Unknown');
  
  // For Mileage field, try both capitalized and lowercase versions
  const mileage = getBestValue('Mileage', 
                  getBestValue('mileage', responseData.Mileage || responseData.mileage || 'Not Available'));
  
  // Extract backup data with improved field access
  let vehicleBackup = null;
  try {
    // Check multiple storage sources for the most complete data
    if (responseData.id) {
      // Try session storage with the specific ID first
      const sessionData = sessionStorage.getItem(`vehicle_summary_${responseData.id}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        vehicleBackup = parsed.vehicle || parsed;
      }
      
      // Also try localStorage with the specific ID
      if (!vehicleBackup || vehicleBackup.registration_number === 'Unknown') {
        const localData = localStorage.getItem(`vehicle_data_${responseData.id}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          vehicleBackup = parsed.vehicle || parsed;
        }
      }
    }
    
    // Fallback to last submitted vehicle as a last resort
    if (!vehicleBackup || vehicleBackup.registration_number === 'Unknown') {
      const lastSubmitted = sessionStorage.getItem('last_submitted_vehicle') || 
                          localStorage.getItem('last_submitted_vehicle');
      if (lastSubmitted) {
        const parsed = JSON.parse(lastSubmitted);
        vehicleBackup = parsed.vehicle || parsed;
      }
    }
  } catch (e) {
    console.error('Error accessing backup vehicle data:', e);
  }
  
  // Enhanced extraction for problematic fields with proper fallbacks
  const registration = getBestValue(
    'registration_number', 
    getBestValue('registrationNumber', 
      vehicleBackup?.registration_number || 
      vehicleBackup?.registrationNumber || 
      'Unknown'
    )
  );
  
  // CRITICAL FIX: Explicitly check vehicle_details for condition, driven and color
  let conditionValue = 'Not Available';
  
  // Log all possible condition sources for debugging
  console.log('Condition sources:', {
    vehicleDetailsCondition: responseData.vehicle_details?.condition,
    vehicleCondition: vehicleData.condition,
    backupCondition: vehicleBackup?.condition,
    getBestValueCondition: getBestValue('condition', ''),
    directCondition: responseData.condition
  });
  
  // Very aggressive checks for condition value in all possible locations
  if (responseData.vehicle_details && responseData.vehicle_details.condition) {
    console.log('Found condition in vehicle_details:', responseData.vehicle_details.condition);
    conditionValue = responseData.vehicle_details.condition;
  } else if (vehicleBackup?.condition && vehicleBackup.condition !== 'Not Available') {
    conditionValue = vehicleBackup.condition;
  } else if (getBestValue('condition', '') !== '') {
    conditionValue = getBestValue('condition', 'Not Available');
  } else if (responseData.condition) {
    console.log('Found condition at root level:', responseData.condition);
    conditionValue = responseData.condition;
  } else if (vehicleData.condition && vehicleData.condition !== 'Not Available') {
    conditionValue = vehicleData.condition;
  } else {
    // Default to a better value than "Not Available"
    conditionValue = 'good';
    console.log('No condition found, defaulting to:', conditionValue);
  }
  
  let kmsDriven = 0;
  if (responseData.vehicle_details && responseData.vehicle_details.kms_driven) {
    console.log('Found kms_driven in vehicle_details:', responseData.vehicle_details.kms_driven);
    kmsDriven = responseData.vehicle_details.kms_driven;
  } else if (vehicleBackup?.kms_driven) {
    kmsDriven = vehicleBackup.kms_driven;
  } else {
    kmsDriven = getBestValue('kms_driven', getBestValue('kmsDriven', 0));
  }
  
  let colorValue = 'Not Available';
  if (responseData.vehicle_details && responseData.vehicle_details.color) {
    console.log('Found color in vehicle_details:', responseData.vehicle_details.color);
    colorValue = responseData.vehicle_details.color;
  } else if (vehicleBackup?.color && vehicleBackup.color !== 'Not Available' && vehicleBackup.color !== 'Not Specified') {
    colorValue = vehicleBackup.color;
  } else if (getBestValue('color', '') !== '' && getBestValue('color', '') !== 'Not Specified') {
    colorValue = getBestValue('color', 'Not Available');
  }
  
  const lastServiceDate = getBestValue(
    'last_service_date', 
    getBestValue('lastServiceDate',
      vehicleBackup?.last_service_date || 
      vehicleBackup?.lastServiceDate || 
      null
    )
  );
  
  const insuranceValidTill = getBestValue(
    'insurance_valid_till', 
    getBestValue('insuranceValidTill',
      vehicleBackup?.insurance_valid_till || 
      vehicleBackup?.insuranceValidTill || 
      null
    )
  );
  
  const normalizedData: Record<string, any> = {
    ...vehicleData,
    // Ensure critical fields have fallback values with improved error recovery
    price: getBestValue('price', getBestValue('expected_price', expectedPrice || 0)),
    expected_price: getBestValue('expected_price', getBestValue('price', expectedPrice || 0)),
    brand: brand,
    model: model,
    year: getBestValue('year', new Date().getFullYear()),
    registration_number: registration,
    condition: conditionValue,
    kms_driven: kmsDriven,
    // Ensure both capitalized and lowercase versions are set
    Mileage: mileage,
    mileage: mileage,
    fuel_type: getBestValue('fuel_type', getBestValue('fuelType', 'Petrol')),
    color: colorValue,
    engine_capacity: getBestValue('engine_capacity', getBestValue('engine_size', 0)),
    last_service_date: lastServiceDate,
    insurance_valid_till: insuranceValidTill,
    vehicle_type: getBestValue('vehicle_type', getBestValue('vehicleType', getBestValue('type', 'Bike'))),
    status: getBestValue('status', responseData.status || 'pending'),
    contact_number: contactNumber,
    pickup_address: pickupAddress,
    is_price_negotiable: getBestValue('is_price_negotiable', false),
  };
  
  // Add vehicle ID if available
  if (responseData.id) {
    normalizedData.id = responseData.id;
  } else if (vehicleData.id) {
    normalizedData.id = vehicleData.id;
  } else if (responseData.vehicle_details?.id) {
    normalizedData.id = responseData.vehicle_details.id;
  }
  
  // Add enhanced debug output
  console.log('normalizeVehicleData output with enhanced fields:', {
    registration_number: normalizedData.registration_number,
    condition: normalizedData.condition,
    last_service_date: normalizedData.last_service_date,
    insurance_valid_till: normalizedData.insurance_valid_till
  });
  
  // Ensure this is stored for future use
  if (responseData.id) {
    try {
      // Store in sessionStorage (temporary)
      sessionStorage.setItem(`vehicle_summary_${responseData.id}`, JSON.stringify({
        vehicle: normalizedData,
        ...responseData,
      }));
      console.log(`Updated sessionStorage for vehicle ID ${responseData.id} with normalized data`);
      
      // Now also store in persistent storage for permanent access
      persistentStorageService.saveVehicleData(responseData.id, {
        vehicle: normalizedData,
        ...responseData,
      }).then(() => {
        console.log(`Saved vehicle ID ${responseData.id} data to permanent storage`);
        
        // Cache the persistent data in a global variable for synchronous access
        const persistentDataKey = `__persistentData_${responseData.id}`;
        (window as any)[persistentDataKey] = {
          vehicle: normalizedData,
          ...responseData,
        };
      }).catch(err => {
        console.error(`Error saving to permanent storage:`, err);
      });
    } catch (e) {
      console.error('Error storing normalized data in storage:', e);
    }
  }
  
  return normalizedData;
};

// Function to extract photo URLs from vehicle data - regular function, not using hooks
const extractPhotoURLs = (data: any): Record<string, string> => {
  if (!data) return {};
  
  const photoUrls: Record<string, string> = {};
  
  // Check various places where photos might be stored
  // 1. Check photo_urls
  if (data.photo_urls && typeof data.photo_urls === 'object') {
    Object.assign(photoUrls, data.photo_urls);
  }
  
  // 2. Check photos object
  if (data.photos && typeof data.photos === 'object') {
    Object.assign(photoUrls, data.photos);
  }
  
  // 3. Check vehicle photos
  if (data.vehicle) {
    const photoFields = [
      'photo_front', 'photo_back', 'photo_left', 'photo_right',
      'photo_dashboard', 'photo_odometer', 'photo_engine', 'photo_extras'
    ];
    
    photoFields.forEach(field => {
      if (data.vehicle[field]) {
        const key = field.replace('photo_', '');
        photoUrls[key] = data.vehicle[field];
      }
    });
  }
  
  // 4. Also check base64_photos if available
  if (data.base64_photos && typeof data.base64_photos === 'object') {
    Object.entries(data.base64_photos).forEach(([key, value]) => {
      if (typeof value === 'string' && isBase64Image(value as string)) {
        photoUrls[key] = value as string;
      }
    });
  }
  
  return photoUrls;
};

const VehicleSummary = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [photoURLs, setPhotoURLs] = useState<{[key: string]: string}>({});
  const [statusInfo, setStatusInfo] = useState<any>(null);
  // Add state to track if data has been loaded from storage
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState<string>(localStorage.getItem('userEmail') || '');
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  // Add ref to store unsubscribe function
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // PERFORMANCE OPTIMIZATION: Add a simple in-memory cache for API responses
  // Define at the module level to prevent re-creation on each render
  const apiCache = useRef<Map<string, {data: any, timestamp: number}>>(
    new Map<string, {data: any, timestamp: number}>()
  );
  const CACHE_TTL = 30000; // 30 seconds cache timeout
  
  // Helper function to enrich vehicle data with backup data
  const enrichVehicleData = useCallback((responseData: any, backupData: any) => {
    if (!responseData) return backupData || {};
    
    // Create a deep clone to avoid modifying the original
    const enhancedData = JSON.parse(JSON.stringify(responseData));
    
    // Ensure vehicle object exists
    if (!enhancedData.vehicle) {
      enhancedData.vehicle = {};
    }
    
    // No backup data, return as is
    if (!backupData) return enhancedData;
    
    // Check if backup has vehicle_details that we can use
    if (backupData.vehicle_details) {
      const fieldsToSync = [
        'brand', 'model', 'year', 'registration_number', 'fuel_type',
        'kms_driven', 'Mileage', 'mileage', 'color', 'condition',
        'last_service_date', 'insurance_valid_till', 'engine_capacity'
      ];
      
      for (const field of fieldsToSync) {
        if (backupData.vehicle_details[field] !== undefined && 
            (enhancedData.vehicle[field] === undefined || 
             enhancedData.vehicle[field] === 'Unknown' || 
             enhancedData.vehicle[field] === 'Not Available' ||
             enhancedData.vehicle[field] === 'Not Specified' ||
             enhancedData.vehicle[field] === '')) {
          enhancedData.vehicle[field] = backupData.vehicle_details[field];
          console.log(`Enriched ${field} from backup.vehicle_details:`, backupData.vehicle_details[field]);
        }
      }
    }
    
    // Check if backup has vehicle that we can use
    if (backupData.vehicle) {
      const fieldsToSync = [
        'brand', 'model', 'year', 'registration_number', 'fuel_type',
        'kms_driven', 'Mileage', 'mileage', 'color', 'condition',
        'last_service_date', 'insurance_valid_till', 'engine_capacity'
      ];
      
      for (const field of fieldsToSync) {
        if (backupData.vehicle[field] !== undefined && 
            (enhancedData.vehicle[field] === undefined || 
             enhancedData.vehicle[field] === 'Unknown' || 
             enhancedData.vehicle[field] === 'Not Available' ||
             enhancedData.vehicle[field] === 'Not Specified' ||
             enhancedData.vehicle[field] === '')) {
          enhancedData.vehicle[field] = backupData.vehicle[field];
          console.log(`Enriched ${field} from backup.vehicle:`, backupData.vehicle[field]);
        }
      }
    }
    
    // Copy direct properties from backup if not in enhanced data
    for (const key in backupData) {
      if (key !== 'vehicle' && key !== 'vehicle_details' && enhancedData[key] === undefined) {
        enhancedData[key] = backupData[key];
        console.log(`Copied direct property ${key} from backup`);
      }
    }
    
    return enhancedData;
  }, []);
  
  // Private function to call the appropriate API method based on ID
  const getVehicleById = useCallback(async (vehicleId: string) => {
    try {
      // Try to get the sell request first, as it has more complete data
      return await marketplaceService.getSellRequest(vehicleId);
    } catch (error) {
      console.error('Error fetching sell request, falling back to vehicle details:', error);
      // Fallback to generic vehicle endpoint if available
      return await fetchVehicleDetails(vehicleId);
    }
  }, []);
  
  // Fallback vehicle details fetcher
  const fetchVehicleDetails = useCallback(async (vehicleId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/vehicles/${vehicleId}/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      throw error;
    }
  }, []);
  
  // Function to fetch vehicle data with a fallback to persistent storage
  const fetchVehicleData = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    // OPTIMIZATION: First check in-memory cache (fastest)
    const cacheKey = id; // Simplified cache key
    const cachedData = apiCache.current.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      console.log('Using in-memory cached data');
      setVehicleData(cachedData.data);
      
      // Extract photo URLs
      const photoData = extractPhotoURLs(cachedData.data);
      setPhotoURLs(photoData);
      
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching vehicle data for ID:', id);
      
      // First prioritize sessionStorage for immediate display
      const sessionData = sessionStorage.getItem(`vehicle_summary_${id}`);
      if (sessionData) {
        try {
          const parsedData = JSON.parse(sessionData);
          // Set data immediately for quick UI rendering
          setVehicleData(parsedData);
          setPhotoURLs(extractPhotoURLs(parsedData));
        } catch (e) {
          console.error('Error parsing session data:', e);
        }
      }
      
      // Then try to get API data in the background
      let apiData = null;
      try {
        // Use the versioned API call from marketplaceService
        apiData = await marketplaceService.getSellRequest(id);
        
        // Save to cache for fast future access
        apiCache.current.set(cacheKey, {
          data: apiData,
          timestamp: Date.now()
        });
        
        // Update UI with fresh data
        setVehicleData(apiData);
        setPhotoURLs(extractPhotoURLs(apiData));
        
        // Save in persistent storage (don't wait for completion)
        persistentStorageService.saveVehicleData(id, apiData)
          .catch(err => console.error('Error saving to persistent storage:', err));
        
      } catch (apiError) {
        console.error('Error fetching from API:', apiError);
        // If API request failed and we don't have session data, try persistent storage
        if (!sessionData) {
          const storedData = await persistentStorageService.getVehicleData(id);
          if (storedData) {
            setVehicleData(storedData);
            setPhotoURLs(extractPhotoURLs(storedData));
          } else {
            throw apiError; // Re-throw if we can't recover
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchVehicleData:', error);
      setError('Failed to load vehicle data. Please try again.');
      setLoading(false);
    }
  }, [id, extractPhotoURLs]);
  
  // Sync images from localStorage to sessionStorage on initial load
  useEffect(() => {
    if (id) {
      // This ensures any images in localStorage are copied to sessionStorage
      // and converts blob URLs to base64 where possible to prevent security errors
      syncImageStorageForVehicle(id);
      
      // Also add to window navigation events to handle page transitions
      const handleNavigation = () => {
        if (id) {
          console.log('Navigation event detected, syncing image storage');
          syncImageStorageForVehicle(id);
        }
      };
      
      // Listen for navigation events
      window.addEventListener('popstate', handleNavigation);
      window.addEventListener('pageshow', handleNavigation);
      
      return () => {
        window.removeEventListener('popstate', handleNavigation);
        window.removeEventListener('pageshow', handleNavigation);
      };
    }
  }, [id]);
  
  // Set up polling for status updates
  useEffect(() => {
    if (!id || loading) return;
    
    // Fetch status initially
    fetchStatusInfo();
    
    // Set up polling to check for status updates every 5 seconds
    const statusPollInterval = setInterval(() => {
      fetchStatusInfo();
    }, 5000); // 5 seconds
    
    // Clean up interval when component unmounts
    return () => {
      clearInterval(statusPollInterval);
    };
  }, [id, loading]);
  
  // Function to fetch just the status information
  const fetchStatusInfo = async () => {
    if (!id) return;
    
    try {
      console.log('Fetching updated status information...');
      const statusData = await marketplaceService.getSellRequestStatus(id);
      console.log('Received status data:', statusData);
      
      // Update status info state
      setStatusInfo(statusData);
    } catch (error) {
      console.error('Error fetching status information:', error);
    }
  };
  
  // Subscribe to updates on component mount
  useEffect(() => {
    if (!id) return;
    
    // Fetch initial data
    fetchVehicleData();
    
    // Subscribe to updates
    console.log('Setting up subscription for vehicle updates');
    const unsubscribe = marketplaceService.subscribeToVehicleUpdates(id, () => {
      console.log('Received update notification for vehicle, refreshing data');
      // Just fetch the data again when we get an update notification
      fetchVehicleData();
    });
    
    // Store unsubscribe function in ref for cleanup
    unsubscribeRef.current = unsubscribe;
    
    // Set up status polling
    const statusInterval = setInterval(fetchStatusInfo, 30000); // Poll every 30 seconds
    
    // Cleanup on unmount
    return () => {
      // Unsubscribe from updates
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      // Clear status polling
      clearInterval(statusInterval);
    };
  }, [id, fetchVehicleData]);
  
  // Clean up localStorage when navigating away
  useEffect(() => {
    return () => {
      // Clean up localStorage when navigating away from the page
      // This assumes that the user has seen the summary page and doesn't 
      // need the temporary data anymore
      setTimeout(() => {
        localStorage.removeItem('sell_vehicle_photos_base64');
        localStorage.removeItem('sell_vehicle_docs_base64');
      }, 2000); // Small delay to ensure any transitions complete
    };
  }, []);
  
  // Clean up any blob URLs when component unmounts
  useEffect(() => {
    return () => {
      cleanupBlobUrls(photoURLs);
    };
  }, [photoURLs]);
  
  // CRITICAL FIX: Immediately check sessionStorage on component mount
  // This is separate from the data fetching to ensure we have data displayed instantly
  useEffect(() => {
    if (!id) return;
    
    // Skip if loading is already complete
    if (loading === false && loadedFromStorage) return;
    
    try {
      // First, check the id-specific storage (highest priority)
      const sessionData = sessionStorage.getItem(`vehicle_summary_${id}`);
      if (sessionData) {
        try {
          const parsedData = JSON.parse(sessionData);
          
          // Quick validation to ensure we have a usable object
          if (parsedData && (parsedData.vehicle || parsedData.vehicle_details)) {
            // Set data immediately to ensure UI shows something right away
            setVehicleData(parsedData);
            
            // Set photos if available
            const photoData = extractPhotoURLs(parsedData);
            if (Object.keys(photoData).length > 0) {
              setPhotoURLs(photoData);
            }
            
            // Set status if available
            if (parsedData.status) {
              setStatusInfo({
                status: parsedData.status,
                status_display: parsedData.status_display,
                title: parsedData.status_title || parsedData.title,
                message: parsedData.status_message || parsedData.message
              });
            }
            
            // Mark as loaded from storage to prevent duplicate fetching
            setLoadedFromStorage(true);
            // Mark as loaded
            setLoading(false);
            
            return; // Exit early since we have valid data
          }
        } catch (parseError) {
          console.error('Error parsing session data:', parseError);
        }
      }
      
      // If sessionStorage didn't have data, try persistent storage
      persistentStorageService.getVehicleData(id)
        .then(persistentData => {
          if (persistentData && persistentData.vehicle) {
            setVehicleData(persistentData);
            setPhotoURLs(extractPhotoURLs(persistentData));
            setLoadedFromStorage(true);
            setLoading(false);
          }
        })
        .catch(err => console.error('Error checking persistent storage:', err));
      
    } catch (e) {
      console.error('Error during initial storage check:', e);
    }
  }, [id, loading, loadedFromStorage, extractPhotoURLs]);
  
  // Add explicit call to fetchVehicleData when component mounts, with coordination to avoid fetching duplicates
  useEffect(() => {
    if (!id || loadedFromStorage) return;
    
    // Set a small delay to ensure the sessionStorage check completes first
    const fetchTimer = setTimeout(() => {
      // Only fetch if we haven't loaded from storage yet
      if (!loadedFromStorage) {
        console.log('Explicit data fetch after delay, not loaded from storage yet');
        fetchVehicleData();
      }
    }, 300); // 300 milliseconds delay
    
    return () => {
      clearTimeout(fetchTimer);
    };
  }, [id, loadedFromStorage, fetchVehicleData]);
  
  // Format price with commas
  const formatPrice = (price: string | number) => {
    if (!price) return '0';
    return parseInt(price.toString()).toLocaleString('en-IN');
  };
  
  // Handle input changes in edit mode
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setEditedData({
        ...editedData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setEditedData({
        ...editedData,
        [name]: value,
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setIsSaving(true);
    try {
      // Prepare data for update
      const updateData = {
        ...editedData,
      };
      
      console.log('Updating vehicle data:', updateData);
      
      // Call API to update vehicle
      await marketplaceService.updateSellRequest(id, updateData);
      
      toast.success('Vehicle information updated successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
      
      // Fetch latest data
      await fetchVehicleData();
      
      // Exit edit mode
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating vehicle:', err);
      
      let errorMessage = 'Failed to update vehicle information. Please try again.';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to force a complete refresh from the server by clearing cache
  const forceFullRefresh = async () => {
    if (!id) return;
    
    try {
      toast.info('Refreshing data...', { autoClose: 2000 });
      
      // Set loading state for UI feedback
      setLoading(true);
      const loadingToast = toast.loading('Fetching the latest data...');
      
      // Use the forceRefreshSellRequest method to refresh data
      const { sellRequest: response, statusInfo: statusData } = await marketplaceService.forceRefreshSellRequest(id);
      
      toast.dismiss(loadingToast);
      toast.success('Data refreshed successfully!');
      
      if (!response) {
        setError('Invalid response format from server');
        setLoading(false);
        return;
      }
      
      // Update the UI with fresh data
      setVehicleData(response);
      
      // Set status info if available
      if (statusData) {
        setStatusInfo(statusData);
      }
      
      // Extract photo URLs
      const photoData = extractPhotoURLs(response);
      setPhotoURLs(photoData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error in forceFullRefresh:', error);
      toast.error('Failed to refresh data. Please try again.');
      setLoading(false);
    }
  };
  
  // Add a timeout to ensure we don't get stuck in a loading state
  useEffect(() => {
    if (!loading) return;
    
    // If still loading after 10 seconds, show an error message and mark as not loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, forcing loading state to false');
        
        // If we already have vehicle data but it's somehow still in loading state
        if (vehicleData) {
          setLoading(false);
        } else {
          // If no data was loaded, show a timeout error
          setError('Loading timed out. Please try refreshing the page.');
          setLoading(false);
          
          // Try one more time to get data from session storage
          try {
            const sessionData = sessionStorage.getItem(`vehicle_summary_${id}`);
            if (sessionData) {
              const parsedData = JSON.parse(sessionData);
              if (parsedData && typeof parsedData === 'object') {
                console.log('Found session data during timeout recovery');
                setVehicleData(parsedData);
                setLoading(false);
                setError(null); // Clear error if we successfully recovered data
              }
            }
          } catch (e) {
            console.error('Error during timeout recovery:', e);
          }
        }
      }
    }, 10000); // 10 seconds timeout
    
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [loading, vehicleData, id]);
  
  // Add a window unload handler to save data before navigating away
  useEffect(() => {
    if (!id || !vehicleData) return;
    
    // Function to save data before unloading
    const handleBeforeUnload = () => {
      console.log('Page is about to unload, ensuring data is saved');
      
      try {
        // Make sure we save the latest data to both session storage and persistent storage
        if (vehicleData) {
          // Get the latest data with all fields
          const latestData = {
            ...vehicleData,
            vehicle: {
              ...(vehicleData.vehicle || {}),
              // Ensure these values are set correctly
              brand: vehicleData.vehicle?.brand || 'Unknown',
              model: vehicleData.vehicle?.model || 'Unknown',
              year: vehicleData.vehicle?.year || new Date().getFullYear(),
              registration_number: vehicleData.vehicle?.registration_number || 'Unknown',
              price: vehicleData.vehicle?.price || vehicleData.vehicle?.expected_price || 0
            }
          };
          
          // Save to session storage synchronously
          sessionStorage.setItem(`vehicle_summary_${id}`, JSON.stringify(latestData));
          
          // Create a special flag that we're reloading with saved data
          sessionStorage.setItem(`vehicle_${id}_reload_pending`, 'true');
          
          // Also make sure images are properly synced
          syncImageStorageForVehicle(id);
          
          // Store in global variable for immediate access on refresh
          const persistentDataKey = `__persistentData_${id}`;
          (window as any)[persistentDataKey] = latestData;
        }
      } catch (e) {
        console.error('Error saving data before unload:', e);
      }
    };
    
    // Add event listener for beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Check if we're loading after a reload with saved data
    const reloadPending = sessionStorage.getItem(`vehicle_${id}_reload_pending`);
    if (reloadPending === 'true') {
      console.log('Detected reload with saved data');
      // Clear the flag
      sessionStorage.removeItem(`vehicle_${id}_reload_pending`);
      
      // Force sync with persistent storage
      persistentStorageService.getVehicleData(id)
        .then(data => {
          if (data) {
            console.log('Got data from persistent storage after reload');
            // Update in-memory state if there's better data available
            if (data.vehicle && (!vehicleData?.vehicle?.brand || vehicleData.vehicle.brand === 'Unknown')) {
              setVehicleData(data);
            }
          }
        })
        .catch(err => console.error('Error getting data after reload:', err));
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [id, vehicleData]);
  
  // Function to send vehicle summary email
  const sendSummaryEmail = async (email: string) => {
    if (!id || !vehicleData) return;
    
    setSendingEmail(true);
    
    try {
      // Prepare complete data with photos
      const completeData = {
        ...vehicleData,
        photo_urls: photoURLs
      };
      
      // Send email
      const result = await emailService.sendVehicleSummaryEmail(
        id,
        email,
        completeData
      );
      
      if (result.success) {
        toast.success(result.message);
        setEmailSent(true);
        
        // Store the email for future use
        localStorage.setItem('userEmail', email);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Failed to send summary email:', error);
      toast.error(error.message || 'Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
      setShowEmailForm(false);
    }
  };
  
  // Handle email form submission
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail && userEmail.includes('@')) {
      sendSummaryEmail(userEmail);
    } else {
      toast.error('Please enter a valid email address');
    }
  };
  
  // If loading, show a spinner
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-12 h-12 border-4 border-t-[#FF5733] border-b-[#FF5733] rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-700">Loading your vehicle information...</p>
      </div>
    );
  }
  
  // If there was an error, show error message
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchVehicleData();
              }}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-[#FF5733] text-white rounded-xl hover:bg-[#ff4019] transition-colors font-medium"
            >
              Try Again
            </button>
            <Link
              to="/sell-vehicle"
              className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Back to Sell Page
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Extract vehicle details from API response
  // Replace simple extraction with a more robust version that prioritizes vehicle_details
  const vehicle = (() => {
    // Start with a base vehicle object
    const baseVehicle = vehicleData?.vehicle || {};
    
    // Debug condition field specifically
    console.log('CONDITION DEBUG:', {
      baseVehicleCondition: baseVehicle.condition,
      vehicleDetailsCondition: vehicleData?.vehicle_details?.condition,
      rootCondition: vehicleData?.condition,
      directProps: vehicleData
    });
    
    // If we have vehicle_details, use that to override any "Unknown" or empty values
    if (vehicleData?.vehicle_details) {
      const betterData = {
        ...baseVehicle,
        // Override specific properties from vehicle_details if they're better
        brand: baseVehicle.brand === 'Unknown' ? vehicleData.vehicle_details.brand : baseVehicle.brand,
        model: baseVehicle.model === 'Unknown' ? vehicleData.vehicle_details.model : baseVehicle.model,
        registration_number: baseVehicle.registration_number === 'Unknown' ? 
          vehicleData.vehicle_details.registration_number : baseVehicle.registration_number,
        year: baseVehicle.year || vehicleData.vehicle_details.year,
        price: baseVehicle.price || vehicleData.vehicle_details.price,
        expected_price: baseVehicle.expected_price || vehicleData.vehicle_details.expected_price,
        color: (baseVehicle.color === 'Not Available' || !baseVehicle.color) ? 
          vehicleData.vehicle_details.color : baseVehicle.color,
        Mileage: baseVehicle.Mileage || vehicleData.vehicle_details.Mileage,
        mileage: baseVehicle.mileage || vehicleData.vehicle_details.mileage || baseVehicle.Mileage,
        kms_driven: baseVehicle.kms_driven || vehicleData.vehicle_details.kms_driven,
        fuel_type: baseVehicle.fuel_type || vehicleData.vehicle_details.fuel_type,
        engine_capacity: baseVehicle.engine_capacity || vehicleData.vehicle_details.engine_capacity,
        vehicle_type: baseVehicle.vehicle_type || vehicleData.vehicle_details.vehicle_type,
        last_service_date: baseVehicle.last_service_date || vehicleData.vehicle_details.last_service_date,
        insurance_valid_till: baseVehicle.insurance_valid_till || vehicleData.vehicle_details.insurance_valid_till,
        // CRITICAL FIX: More aggressive condition fix - take any valid condition value we can find
        condition: (baseVehicle.condition === 'Not Available' || !baseVehicle.condition) ?
                  (vehicleData.vehicle_details.condition || vehicleData.condition || 'excellent') :
                  baseVehicle.condition
      };
      return betterData;
    }
    
    // If no vehicle_details, try checking direct properties on vehicleData
    if (baseVehicle.brand === 'Unknown' && vehicleData.brand) {
      return {
        ...baseVehicle,
        brand: vehicleData.brand,
        model: vehicleData.model || baseVehicle.model,
        registration_number: vehicleData.registration_number || baseVehicle.registration_number,
        year: vehicleData.year || baseVehicle.year,
        price: vehicleData.price || baseVehicle.price,
        expected_price: vehicleData.expected_price || baseVehicle.expected_price,
        // Add the condition from direct vehicleData
        condition: vehicleData.condition || baseVehicle.condition
      };
    }
    
    // Special case - if condition is still Not Available, check vehicle_details again
    if (baseVehicle.condition === 'Not Available' || !baseVehicle.condition) {
      if (vehicleData?.vehicle_details?.condition) {
        baseVehicle.condition = vehicleData.vehicle_details.condition;
      } else if (vehicleData?.condition) {
        baseVehicle.condition = vehicleData.condition;
      } else {
        // Default to something better than "Not Available"
        baseVehicle.condition = 'good';
      }
    }
    
    return baseVehicle;
  })();
  
  // Debug log to see what's being rendered
  console.log('Final vehicle object for rendering:', vehicle);
  console.log('Final condition value:', vehicle.condition);
  
  const status = vehicleData?.status || 'pending';
  
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Vehicle Listing</h1>
          <div className="flex items-center justify-between">
            <p className="text-lg text-gray-600">
              Review and manage your vehicle listing details
            </p>
            <button
              onClick={forceFullRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733]"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Data
            </button>
          </div>
        </motion.div>
        
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`p-6 rounded-xl mb-8 text-white ${
            status === 'submitted' ? 'bg-yellow-500' :
            status === 'confirmed' ? 'bg-blue-400' :
            status === 'inspection_scheduled' ? 'bg-blue-600' :
            status === 'under_inspection' ? 'bg-blue-700' :
            status === 'service_center' ? 'bg-indigo-600' :
            status === 'inspection_done' ? 'bg-green-500' :
            status === 'offer_made' ? 'bg-green-600' :
            status === 'counter_offer' ? 'bg-green-700' :
            status === 'deal_closed' ? 'bg-purple-600' :
            status === 'rejected' ? 'bg-red-500' :
            'bg-gray-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 mr-3" />
              <div>
                <h3 className="text-xl font-semibold">
                  {statusInfo?.title || (
                    status === 'submitted' ? 'Pending Review' :
                    status === 'confirmed' ? 'Confirmed' :
                    status === 'inspection_scheduled' ? 'Inspection Scheduled' :
                    status === 'under_inspection' ? 'Under Inspection' :
                    status === 'service_center' ? 'At Service Center' :
                    status === 'inspection_done' ? 'Inspection Complete' :
                    status === 'offer_made' ? 'Offer Made' :
                    status === 'counter_offer' ? 'Counter Offer' :
                    status === 'deal_closed' ? 'Deal Closed' :
                    status === 'rejected' ? 'Rejected' :
                    'Under Processing'
                  )}
                </h3>
                <p className="text-white text-opacity-90 mt-1">
                  {statusInfo?.message || (
                    status === 'submitted' ? 'Our team will review your listing shortly.' :
                    status === 'confirmed' ? 'Your listing has been confirmed by our team.' :
                    status === 'inspection_scheduled' ? 'We\'ve scheduled an inspection for your vehicle.' :
                    status === 'under_inspection' ? 'Your vehicle is currently being inspected.' :
                    status === 'service_center' ? 'Your vehicle is at our service center.' :
                    status === 'inspection_done' ? 'Your vehicle inspection has been completed.' :
                    status === 'offer_made' ? 'We\'ve made an offer for your vehicle.' :
                    status === 'counter_offer' ? 'Your counter offer is under review.' :
                    status === 'deal_closed' ? 'The sale has been completed successfully.' : 
                    status === 'rejected' ? 'We cannot proceed with your listing at this time.' :
                    'Your request is being processed.'
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Force a full refresh to get the latest data
                  forceFullRefresh();
                }}
                className="flex items-center justify-center px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </button>
              )}
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white shadow-lg rounded-2xl overflow-hidden mb-8"
        >
          {isEditing ? (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Edit Vehicle Details</h2>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019] transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <DollarSign className="w-5 h-5 text-[#FF5733] mr-2" />
                    Pricing Information
                  </h3>
                  
                  <div>
                    <label htmlFor="expected_price" className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Price (₹)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">₹</span>
                      </div>
                      <input
                        type="number"
                        id="expected_price"
                        name="expected_price"
                        required
                        min="1"
                        className="block w-full pl-8 rounded-lg border border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3"
                        value={editedData.expected_price}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_price_negotiable"
                      name="is_price_negotiable"
                      checked={editedData.is_price_negotiable}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[#FF5733] focus:ring-[#FF5733] border-gray-300 rounded"
                    />
                    <label htmlFor="is_price_negotiable" className="ml-2 block text-sm text-gray-700">
                      Price is negotiable
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Info className="w-5 h-5 text-[#FF5733] mr-2" />
                    Additional Information
                  </h3>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                      value={editedData.description}
                      onChange={handleInputChange}
                      placeholder="Additional details about your vehicle..."
                    />
                  </div>
                </div>
                
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Calendar className="w-5 h-5 text-[#FF5733] mr-2" />
                    Contact & Pickup Details
                  </h3>
                  
                  <div>
                    <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      id="contact_number"
                      name="contact_number"
                      required
                      className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3"
                      value={editedData.contact_number}
                      onChange={handleInputChange}
                      placeholder="e.g. +919876543210"
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter number with country code (e.g. +91 for India)</p>
                  </div>
                  
                  <div>
                    <label htmlFor="pickup_address" className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup Address
                    </label>
                    <textarea
                      id="pickup_address"
                      name="pickup_address"
                      rows={3}
                      required
                      className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                      value={editedData.pickup_address}
                      onChange={handleInputChange}
                      placeholder="Enter full address for vehicle pickup"
                    />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Vehicle Details</h2>
              
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0 md:w-1/3">
                  <div className="bg-gray-100 rounded-lg overflow-hidden h-48 md:h-auto flex items-center justify-center">
                    {/* Enhanced SafeImage with better fallback handling */}
                    {(() => {
                      // Debug all possible image sources
                      console.log('IMAGE DEBUG - Possible sources:', {
                        photoURLsFront: photoURLs.front,
                        vehicleDetailsFrontImage: vehicleData?.vehicle_details?.front_image_url,
                        directPhotoFront: vehicleData?.photo_front,
                        vehiclePhotoFront: vehicleData?.vehicle?.photo_front
                      });
                      
                      // Get the best image source with fallbacks
                      const imageSrc = photoURLs.front || 
                                      vehicleData?.vehicle_details?.front_image_url ||
                                      vehicleData?.photo_front || 
                                      vehicleData?.vehicle?.photo_front;
                      
                      return (
                        <SafeImage 
                          src={imageSrc}
                          alt={`${vehicle.brand} ${vehicle.model}`} 
                          className="w-full h-full object-cover" 
                          sessionStorageKey={`vehicle_summary_${id}`}
                          imageKey="front"
                          vehicleId={id}
                          fetchFromBackend={true}
                          fallbackComponent={<Bike className="h-16 w-16 text-gray-400" />}
                        />
                      );
                    })()}
                  </div>
                  
                  {/* Photo gallery - Enhanced version */}
                  {(() => {
                    // First check if we have multiple photos
                    const hasMultiplePhotos = Object.keys(photoURLs).length > 1;
                    
                    if (!hasMultiplePhotos) {
                      // Also check vehicle_details for image URLs
                      const detailsHasPhotos = vehicleData?.vehicle_details && (
                        vehicleData.vehicle_details.back_image_url || 
                        vehicleData.vehicle_details.left_image_url || 
                        vehicleData.vehicle_details.right_image_url
                      );
                      
                      // Check direct photo props
                      const directHasPhotos = vehicleData?.photo_back || 
                                             vehicleData?.photo_left || 
                                             vehicleData?.photo_right;
                      
                      if (!detailsHasPhotos && !directHasPhotos) {
                        return null; // No additional photos to display
                      }
                    }
                    
                    // Get combined photo sources
                    const combinedPhotos = {
                      ...photoURLs
                    };
                    
                    // Add photos from vehicle_details if available
                    if (vehicleData?.vehicle_details) {
                      const detailsFields = {
                        'back_image_url': 'back',
                        'left_image_url': 'left',
                        'right_image_url': 'right',
                        'dashboard_image_url': 'dashboard'
                      };
                      
                      Object.entries(detailsFields).forEach(([srcKey, destKey]) => {
                        if (vehicleData.vehicle_details[srcKey] && !combinedPhotos[destKey]) {
                          combinedPhotos[destKey] = vehicleData.vehicle_details[srcKey];
                        }
                      });
                    }
                    
                    // Add direct photo props 
                    const directFields = ['photo_back', 'photo_left', 'photo_right', 'photo_dashboard'];
                    directFields.forEach(field => {
                      const key = field.replace('photo_', '');
                      if (vehicleData?.[field] && !combinedPhotos[key]) {
                        combinedPhotos[key] = vehicleData[field];
                      }
                    });
                    
                    // Check if we have enough photos to display
                    const galleryPhotos = Object.entries(combinedPhotos)
                      .filter(([key, _]) => key !== 'front')
                      .slice(0, 4);
                    
                    if (galleryPhotos.length === 0) {
                      return null; // No additional photos to display
                    }
                    
                    console.log('GALLERY DEBUG - Photos for gallery:', galleryPhotos);
                    
                    return (
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {galleryPhotos.map(([key, url]) => (
                          <div key={key} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <SafeImage 
                              src={url} 
                              alt={`${key} view`} 
                              className="w-full h-full object-cover" 
                              sessionStorageKey={`vehicle_summary_${id}`}
                              imageKey={key}
                              vehicleId={id}
                              fetchFromBackend={true}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 sm:mb-0">
                      {vehicle.brand || 'Unknown'} {vehicle.model || ''} {vehicle.year}
                    </h3>
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 text-[#FF5733] mr-1" />
                      <div className="ml-1">
                        <p className="text-xs text-gray-500">Expected Price</p>
                        <span className="text-[#FF5733] font-medium text-lg">
                          ₹{formatPrice(vehicle.expected_price || vehicle.price || 0)}
                        </span>
                      </div>
                      {vehicleData.is_price_negotiable && (
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                          Negotiable
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500">Registration</p>
                      <p className="font-medium">{vehicle.registration_number || 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Condition</p>
                      <p className="font-medium capitalize">
                        {/* Add debug info on hover */}
                        <span title={`Debug sources: vehicle:${vehicle.condition}, vehicleData:${vehicleData?.condition}, vehicleDetails:${vehicleData?.vehicle_details?.condition}`}>
                          {vehicle.condition && vehicle.condition !== 'Not Available' 
                            ? vehicle.condition 
                            : vehicleData?.vehicle_details?.condition || vehicleData?.condition || 'Good'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Driven</p>
                      <p className="font-medium">
                        {vehicle.kms_driven ? `${vehicle.kms_driven} km` : 'Not Available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mileage</p>
                      <p className="font-medium">
                        {vehicle.Mileage || vehicle.mileage || 'Not Available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fuel Type</p>
                      <p className="font-medium capitalize">{vehicle.fuel_type || 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Color</p>
                      <p className="font-medium capitalize">
                        {vehicle.color || 'Not Available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Engine</p>
                      <p className="font-medium">
                        {vehicle.engine_capacity ? 
                          `${vehicle.engine_capacity} ${vehicle.fuel_type === 'electric' ? 'watts' : 'cc'}` : 
                          'Not Available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Service</p>
                      <p className="font-medium">
                        {vehicle.last_service_date 
                          ? new Date(vehicle.last_service_date).toLocaleDateString() 
                          : 'Not Available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Insurance Valid Till</p>
                      <p className="font-medium">
                        {vehicle.insurance_valid_till 
                          ? new Date(vehicle.insurance_valid_till).toLocaleDateString() 
                          : 'Not Available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Type</p>
                      <p className="font-medium capitalize">{vehicle.vehicle_type || 'Not Available'}</p>
                    </div>
                  </div>
                  
                  {vehicle.description && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                      <p className="text-gray-600">{vehicle.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h4>
                      <p className="text-gray-600">{vehicleData.contact_number}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Pickup Address</h4>
                      <p className="text-gray-600">{vehicleData.pickup_address}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {vehicleData.documents && Object.keys(vehicleData.documents).length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                    <FileText className="w-5 h-5 text-[#FF5733] mr-2" />
                    Documents
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Object.entries(vehicleData.documents).map(([key, url]) => (
                      <a 
                        key={key} 
                        href={url as string} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="h-8 w-8 text-[#FF5733] mb-2" />
                        <span className="text-sm text-gray-600 text-center capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
        
        <div className="flex justify-center">
          <Link
            to="/sell-vehicle"
            className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Back to Sell Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VehicleSummary; 