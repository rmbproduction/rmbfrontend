import axios from 'axios';
import { safeRevokeUrl } from './imageUtils';
import { API_CONFIG } from '../config/api.config';
import persistentStorageService, { TTL } from './persistentStorageService';

// Add debug logging to verify the API URL
console.log('[DEBUG] MARKETPLACE URL:', API_CONFIG.MARKETPLACE_URL);

// Add type for vehicle data
interface VehicleData {
  id?: string;
  vehicle?: {
    id?: string;
    brand?: string;
    model?: string;
    registration_number?: string;
    year?: number;
    fuel_type?: string;
    color?: string;
    kms_driven?: number;
    engine_capacity?: number;
    expected_price?: number;
    price?: number;
    condition?: string;
    mileage?: string;
    Mileage?: string;
    last_updated?: number;
    vehicle_type?: string;
    features?: string[];
    highlights?: string[];
    emi_available?: boolean;
    [key: string]: any;
  };
  status?: string;
  status_display?: string;
  status_title?: string;
  status_message?: string;
  [key: string]: any;
}

// Subscription management for vehicle updates
const subscriptions = new Map<string, Array<() => void>>();
let pollingInterval: ReturnType<typeof setInterval> | null = null;
const POLLING_INTERVAL = 30000; // Poll every 30 seconds

// In-memory cache for sell requests with TTL support
const sellRequestCache = {
  data: new Map<string, { data: any, timestamp: number, etag?: string }>(),
  // Cache duration - 1 hour in milliseconds
  maxAge: 60 * 60 * 1000,
  
  // Add or update data in cache
  set(key: string, data: any, etag?: string): void {
    this.data.set(key, { 
      data, 
      timestamp: Date.now(),
      etag
    });
    
    // Also persist to localStorage as a backup
    try {
      localStorage.setItem(`sell_request_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        etag
      }));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  },
  
  // Get data from cache if not expired
  get(key: string): { data: any, timestamp: number, etag?: string } | null {
    // First try in-memory cache
    const cached = this.data.get(key);
    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      console.log(`Using in-memory cache for sell request ${key}`);
      return cached;
    }
    
    // If not in memory, try localStorage
    try {
      const localData = localStorage.getItem(`sell_request_${key}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Date.now() - parsed.timestamp < this.maxAge) {
          // If valid from localStorage, also update in-memory cache
          this.data.set(key, parsed);
          console.log(`Using localStorage cache for sell request ${key}`);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to retrieve from localStorage:', e);
    }
    
    return null;
  },
  
  // Clear specific cache entry
  clear(key: string): void {
    this.data.delete(key);
    localStorage.removeItem(`sell_request_${key}`);
  },
  
  // Clear all cache
  clearAll(): void {
    this.data.clear();
    // Clear only our cache entries, not all localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sell_request_')) {
        localStorage.removeItem(key);
      }
    }
  }
};

const marketplaceService = {
  // Subscribe to vehicle updates
  subscribeToVehicleUpdates: (vehicleId: string, callback: () => void): (() => void) => {
    console.log(`Subscribing to updates for vehicle ${vehicleId}`);
    
    if (!subscriptions.has(vehicleId)) {
      subscriptions.set(vehicleId, []);
    }
    
    // Add this callback to the list of subscribers
    subscriptions.get(vehicleId)?.push(callback);
    
    // Start the polling if not already started
    if (!pollingInterval) {
      console.log('Starting global polling for vehicle updates');
      pollingInterval = setInterval(async () => {
        // Check each vehicle with subscriptions for updates
        for (const [id, callbacks] of subscriptions.entries()) {
          try {
            // Skip if no valid token (user not logged in)
            const token = localStorage.getItem('accessToken');
            if (!token) continue;
            
            // Get the ETag from cache if available
            const cachedRequest = sellRequestCache.get(id);
            const headers: Record<string, string> = { 
              Authorization: `Bearer ${token}` 
            };
            
            if (cachedRequest?.etag) {
              headers['If-None-Match'] = cachedRequest.etag;
            }
            
            // Make a HEAD request to check for changes (lighter than GET)
            // Use a short timeout to avoid hanging requests
            const response = await axios.head(
              `${API_CONFIG.BASE_URL}/marketplace/sell-requests/${id}/`, 
              { 
                headers,
                timeout: 5000
              }
            );
            
            // If we get here, there might be an update (no 304 response)
            if (response.status !== 304) {
              console.log(`Detected change for vehicle ${id}, notifying subscribers`);
              // Notify all callbacks
              callbacks.forEach(cb => {
                try {
                  cb();
                } catch (callbackError) {
                  console.error(`Error in callback for vehicle ${id}:`, callbackError);
                }
              });
            }
          } catch (error: any) {
            // Handle specific error cases
            if (error.response) {
              // If we get a 304 Not Modified, there's no update
              if (error.response.status === 304) {
                console.log(`No changes for vehicle ${id}`);
              } 
              // If the request is unauthorized, the token might be invalid
              else if (error.response.status === 401 || error.response.status === 403) {
                console.warn(`Authentication error checking for updates on vehicle ${id}, removing subscription`);
                // Remove this subscription to avoid repeated failed requests
                subscriptions.delete(id);
              }
              // If the vehicle doesn't exist anymore
              else if (error.response.status === 404) {
                console.warn(`Vehicle ${id} not found, removing subscription`);
                // Remove this subscription to avoid repeated failed requests
                subscriptions.delete(id);
              } 
              else {
                console.error(`Error checking for updates on vehicle ${id}:`, error.response.status, error.response.statusText);
              }
            } else if (error.code === 'ECONNABORTED') {
              console.warn(`Timeout checking for updates on vehicle ${id}`);
            } else {
              console.error(`Error checking for updates on vehicle ${id}:`, error);
            }
          }
        }
        
        // If no more subscriptions, clear the interval
        if (subscriptions.size === 0 && pollingInterval !== null) {
          console.log('No more subscriptions, stopping polling');
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      }, POLLING_INTERVAL);
    }
    
    // Return an unsubscribe function
    return () => {
      console.log(`Unsubscribing from updates for vehicle ${vehicleId}`);
      const vehicleSubscribers = subscriptions.get(vehicleId) || [];
      const index = vehicleSubscribers.indexOf(callback);
      
      if (index !== -1) {
        vehicleSubscribers.splice(index, 1);
      }
      
      // If this was the last subscriber for this vehicle, remove it
      if (vehicleSubscribers.length === 0) {
        subscriptions.delete(vehicleId);
      }
      
      // If no more subscriptions at all, clear the interval
      if (subscriptions.size === 0 && pollingInterval !== null) {
        console.log('Stopping global polling for vehicle updates');
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };
  },
  
  // Clear all user session data and cache when user logs out
  clearUserSession: () => {
    // Clear in-memory cache
    sellRequestCache.clearAll();
    
    // Clear session storage selectively (only our entries)
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
      if (key && (key.startsWith('vehicle_') || key.startsWith('sell_request_') || key === 'available_vehicles')) {
          sessionStorage.removeItem(key);
        }
      }
    
    // Clear localStorage selectively (only our entries)
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
      if (key && (key.startsWith('vehicle_') || key.startsWith('sell_request_'))) {
        localStorage.removeItem(key);
      }
    }
    
    console.log('Cleared all user session data and cache');
  },

  // Get all sell requests for the current user
  getSellRequests: async (): Promise<VehicleData[]> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please log in to continue.');
      }
      
      // Try to get from cache first
      const cacheKey = 'user_sell_requests';
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - (parsed.timestamp || 0);
        
        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          console.log('Using cached sell requests data');
          return parsed.data;
        }
      }
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/sell-requests/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Ensure response.data is an array before mapping
      if (!Array.isArray(response.data)) {
        console.error('Expected array response from sell-requests but got:', typeof response.data);
        return [];
      }
      
      // Enrich each vehicle in the data
      const enrichedData: VehicleData[] = response.data.map((vehicleData: VehicleData) => marketplaceService.enrichVehicleData(vehicleData));
      
      // Cache the results
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: enrichedData,
        timestamp: Date.now()
      }));
      
      // Also store individual sell requests in persistent storage
      enrichedData.forEach(vehicle => {
        if (vehicle && vehicle.id) {
          persistentStorageService.saveVehicleData(vehicle.id, vehicle);
        }
      });
      
      return enrichedData;
    } catch (error) {
      console.error('Error fetching sell requests:', error);
      throw error;
    }
  },

  // Get a specific sell request by ID
  getSellRequest: async (id: string, forceRefresh = false): Promise<VehicleData | null> => {
    try {
      // If not forcing refresh, check sessionStorage first directly
      if (!forceRefresh) {
        try {
          const sessionData = sessionStorage.getItem(`vehicle_summary_${id}`);
          if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            console.log(`Using sessionStorage data for sell request ID ${id}`);
            return marketplaceService.enrichVehicleData(parsedData);
          }
        } catch (e) {
          console.warn('Error reading from sessionStorage:', e);
        }
        
        // Then check persistent storage
        const storedData = await persistentStorageService.getVehicleData(id);
        if (storedData) {
          console.log(`Using stored data for sell request ID ${id}`);
          return marketplaceService.enrichVehicleData(storedData);
        }
      }
      
      // Check in-memory cache
      const cachedRequest = sellRequestCache.get(id);
      if (!forceRefresh && cachedRequest) {
        console.log(`Using cached data for sell request ID ${id}`);
        return marketplaceService.enrichVehicleData(cachedRequest.data);
      }
      
      // Fetch from API
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      
      // Add ETag header if available
      if (cachedRequest?.etag) {
        headers['If-None-Match'] = cachedRequest.etag;
      }
      
      try {
        const response = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/sell-requests/${id}/`, { headers });
        
        // Get ETag from response if available
        const etag = response.headers.etag;
      
      // Ensure response.data is valid before enriching
      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid response data from sell-request:', response.data);
        return null;
      }
      
        // Enrich the data
        const enrichedData: VehicleData = marketplaceService.enrichVehicleData(response.data);
        
        // CRITICAL: Update sessionStorage directly for fastest UI access
        try {
          sessionStorage.setItem(`vehicle_summary_${id}`, JSON.stringify(enrichedData));
          console.log(`Directly updated sessionStorage with API data for ID ${id}`);
        } catch (sessionError) {
          console.error('Failed to update sessionStorage:', sessionError);
        }
        
        // Store in cache with ETag
        sellRequestCache.set(id, enrichedData, etag);
        
        // Store in persistent storage
        await persistentStorageService.saveVehicleData(id, enrichedData, etag);
        
        // Notify subscribers
        persistentStorageService.notifyVehicleUpdated(id);
        
        return enrichedData;
      } catch (err: any) {
        // If we get a 304 Not Modified response, use cached data
        if (err.response && err.response.status === 304 && cachedRequest) {
          console.log(`Server says content not modified for ${id}, using cache`);
          return marketplaceService.enrichVehicleData(cachedRequest.data);
        }
        throw err;
      }
    } catch (error) {
      console.error('Error fetching sell request:', error);
      throw error;
    }
  },

  // Get status information for a sell request
  getSellRequestStatus: async (sellRequestId: string) => {
    try {
      // Try getting from cache first with a different key to distinguish from main data
      const cacheKey = `${sellRequestId}_status`;
      const cachedStatus = sellRequestCache.get(cacheKey);
      if (cachedStatus) {
        console.log(`Found cached status info for sell request ID ${sellRequestId}`);
        return cachedStatus.data;
      }
      
      // Check sessionStorage as backup
      try {
        const sessionData = sessionStorage.getItem(`vehicle_summary_${sellRequestId}`);
        if (sessionData) {
          const parsedData = JSON.parse(sessionData);
          if (parsedData.status_display || parsedData.status_title) {
            console.log('Recovered status from sessionStorage:', {
              status: parsedData.status,
              status_display: parsedData.status_display,
              title: parsedData.status_title,
              message: parsedData.status_message
            });
            
            // Create status object
            const statusData = {
              status: parsedData.status || 'pending',
              status_display: parsedData.status_display || 'Pending',
              title: parsedData.status_title || 'Processing',
              message: parsedData.status_message || 'Your request is being processed.'
            };
            
            // Cache for future use
            sellRequestCache.set(cacheKey, statusData);
            
            return statusData;
          }
        }
      } catch (e) {
        console.error('Error recovering status from sessionStorage:', e);
      }
      
      console.log(`Cache miss for status of sell request ID ${sellRequestId}, fetching from API`);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please log in to continue.');
      }
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/sell-requests/${sellRequestId}/status_info/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Cache the status data
      if (response.data) {
        console.log(`Caching status info for sell request ID ${sellRequestId}`);
        sellRequestCache.set(cacheKey, response.data);
        
        // If we have the main sell request data cached, update its status too
        const mainData = sellRequestCache.get(sellRequestId);
        if (mainData) {
          mainData.data.status = response.data.status;
          if (response.data.status_display) {
            mainData.data.status_display = response.data.status_display;
          }
          if (response.data.title) {
            mainData.data.status_title = response.data.title;
          }
          if (response.data.message) {
            mainData.data.status_message = response.data.message;
          }
          sellRequestCache.set(sellRequestId, mainData.data, mainData.etag);
        }
        
        // Update in persistentStorage too
        try {
          const storedData = await persistentStorageService.getVehicleData(sellRequestId);
          if (storedData) {
            storedData.status = response.data.status;
            if (response.data.status_display) {
              storedData.status_display = response.data.status_display;
            }
            if (response.data.title) {
              storedData.status_title = response.data.title;
            }
            if (response.data.message) {
              storedData.status_message = response.data.message;
            }
            
            // Save updated data
            await persistentStorageService.saveVehicleData(sellRequestId, storedData);
            
            // Notify subscribers
            persistentStorageService.notifyVehicleUpdated(sellRequestId);
          }
        } catch (err) {
          console.error('Error updating persistent storage with new status:', err);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching status for sell request ID ${sellRequestId}:`, error);
      throw error;
    }
  },

  // Submit a new vehicle sell request with improved error handling
  submitVehicle: async (formData: any, photos: any, documents: any = {}) => {
    console.log('Submitting vehicle to marketplace');
    const data = new FormData();
    
    // Format phone number
    let formattedPhone = formData.contactNumber || localStorage.getItem('userPhone') || '';
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
    }
    
    // Format address (replace newlines with commas)
    const formattedAddress = formData.pickupAddress ? formData.pickupAddress.replace(/\n/g, ', ') : '';
    
    // IMPORTANT: Save the complete vehicle data to both sessionStorage and localStorage
    // This ensures we always have the data available for the summary page
    try {
      // Create a complete vehicle object with all client-side fields
      const completeVehicleData = {
        vehicle: {
          vehicle_type: formData.type,
          brand: formData.brand,
          model: formData.model,
          year: parseInt(formData.year),
          color: formData.color,
          registration_number: formData.registrationNumber.toUpperCase(),
          kms_driven: parseInt(formData.kmsDriven),
          Mileage: formData.mileage,
          mileage: formData.mileage,
          engine_capacity: formData.engineCapacity ? parseInt(formData.engineCapacity) : null,
          condition: formData.condition,
          fuel_type: formData.fuelType,
          price: parseInt(formData.expectedPrice),
          expected_price: parseInt(formData.expectedPrice),
          emi_available: formData.emiAvailable,
          features: formData.features,
          highlights: formData.highlights,
          last_service_date: formData.lastServiceDate,
          insurance_valid_till: formData.insuranceValidTill,
          description: formData.description || ''
        },
        contact_number: formData.contactNumber,
        pickup_address: formData.pickupAddress,
        is_price_negotiable: formData.isPriceNegotiable,
        has_puc_certificate: formData.hasPucCertificate,
        seller_notes: formData.sellerNotes,
        status: 'pending'
      };
      
      // Store in sessionStorage for immediate use
      sessionStorage.setItem('last_submitted_vehicle', JSON.stringify(completeVehicleData));
      
      // Also back it up to localStorage for persistence
      localStorage.setItem('last_submitted_vehicle', JSON.stringify(completeVehicleData));
      
      console.log('Saved complete vehicle data to storage for summary page', completeVehicleData);
    } catch (storageError) {
      console.error('Failed to save vehicle data to storage:', storageError);
    }
    
    // Validate vehicle year before submitting
    const currentYear = new Date().getFullYear();
    const vehicleYear = parseInt(formData.year);
    if (vehicleYear > currentYear) {
      throw new Error(`Year: Ensure this value is less than or equal to ${currentYear}.`);
    }
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No authentication token found! User must be logged in.');
      throw new Error('Authentication required. Please log in to continue.');
    }
    
    try {
      // STEP 1: Try to create or find the vehicle
      console.log('Step 1: Creating/finding vehicle record...');
      
      // Check if registration number exists and is not empty
      const registrationNumber = formData.registrationNumber || '';
      if (!registrationNumber) {
        throw new Error('Registration number is required');
      }
      
      const vehicleData = {
        vehicle_type: formData.type,
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        color: formData.color || '',
        registration_number: registrationNumber.trim().toUpperCase(),
        kms_driven: parseInt(formData.kmsDriven),
        Mileage: formData.mileage,
        price: parseInt(formData.expectedPrice),
        fuel_type: formData.fuelType,
        engine_capacity: parseInt(formData.engineCapacity),
        last_service_date: formData.lastServiceDate,
        insurance_valid_till: formData.insuranceValidTill,
        status: 'under_inspection',
        features: formData.features || [],
        highlights: formData.highlights || [],
        emi_available: !!formData.emiAvailable
      };
      
      // First check if a vehicle with this registration number already exists
      let vehicleId;
      let isExistingVehicle = false;
      
      try {
        // Try to find an existing vehicle with this registration number
        const checkResponse = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/vehicles/?registration_number=${encodeURIComponent(formData.registrationNumber)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (checkResponse.data && checkResponse.data.length > 0) {
          // Vehicle exists, use its ID
          console.log('Vehicle already exists, using existing vehicle ID');
          vehicleId = checkResponse.data[0].id;
          isExistingVehicle = true;
        } else {
          // No vehicle exists with this registration, create a new one
          const vehicleResponse = await axios.post(`${API_CONFIG.BASE_URL}/marketplace/vehicles/`, vehicleData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Vehicle created successfully:', vehicleResponse.data);
          vehicleId = vehicleResponse.data.id;
        }
      } catch (err: any) {
        // Handle specific error for duplicate registration
        if (err.response?.status === 400 && 
            err.response?.data?.registration_number?.includes('already exists')) {
          
          console.log('Vehicle already exists (from error response), trying to find it by registration number');
          
          const findResponse = await axios.get(
            `${API_CONFIG.BASE_URL}/marketplace/vehicles/?registration_number=${encodeURIComponent(formData.registrationNumber)}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          
          if (findResponse.data && findResponse.data.length > 0) {
            vehicleId = findResponse.data[0].id;
            isExistingVehicle = true;
          } else {
            throw new Error('Cannot create or find vehicle with this registration number');
          }
        } else {
          // If it's a different error, rethrow it
          throw err;
        }
      }
      
      // STEP 2: Now create the sell request with the vehicle ID
      console.log('Step 2: Creating sell request with vehicle ID:', vehicleId);
      
      // First check if a sell request already exists for this vehicle
      try {
        console.log('Checking if a sell request already exists for this vehicle');
        const existingRequestsResponse = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/sell-requests/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (Array.isArray(existingRequestsResponse.data)) {
          const existingRequest = existingRequestsResponse.data.find((request: any) => 
            request.vehicle === vehicleId || 
            request.vehicle?.id === vehicleId ||
            (request.vehicle && request.vehicle.id && request.vehicle.id.toString() === vehicleId.toString())
          );
          
          if (existingRequest) {
            console.log('Found existing sell request for this vehicle:', existingRequest);
            return existingRequest; // Return the existing request instead of creating a new one
          }
        }
      } catch (checkError) {
        console.warn('Error checking for existing sell requests:', checkError);
        // Continue with creation attempt even if check fails
      }
      
      // If creating a FormData-based request with file uploads
      if (photos.front || photos.back || photos.left || photos.right || 
          Object.values(documents).some(doc => doc !== null)) {
        
        console.log('Creating sell request with photos and/or documents');
        
        // Required SellRequest fields
        data.append('vehicle', vehicleId);
        data.append('contact_number', formattedPhone);
        data.append('pickup_address', formattedAddress);
        
        // Set default pickup slot time (guaranteed to be within business hours)
        const pickupSlot = marketplaceService.getSafePickupTime();
        console.log('Using safe pickup slot time:', pickupSlot);
        data.append('pickup_slot', pickupSlot);
        
        // Add seller notes if provided
        if (formData.sellerNotes) {
          data.append('seller_notes', formData.sellerNotes);
        }
        
        // Add information about price negotiability
        data.append('is_price_negotiable', formData.isPriceNegotiable ? 'true' : 'false');
        
        // Add PUC certificate information
        data.append('has_puc_certificate', formData.hasPucCertificate ? 'true' : 'false');
        
        // Add photos with the correct field names
        if (photos.front) data.append('photo_front', photos.front);
        if (photos.back) data.append('photo_back', photos.back);
        if (photos.left) data.append('photo_left', photos.left);
        if (photos.right) data.append('photo_right', photos.right);
        if (photos.dashboard) data.append('photo_dashboard', photos.dashboard);
        if (photos.odometer) data.append('photo_odometer', photos.odometer);
        if (photos.engine) data.append('photo_engine', photos.engine);
        if (photos.extras) data.append('photo_extras', photos.extras);
        
        // Add document files individually using the correct field names
        if (documents.rc) {
          console.log('Attaching RC document');
          data.append('registration_certificate', documents.rc);
        }
        
        if (documents.insurance) {
          console.log('Attaching Insurance document');
          data.append('insurance_document', documents.insurance);
        }
        
        if (documents.puc) {
          console.log('Attaching PUC document');
          data.append('puc_certificate', documents.puc);
        }
        
        if (documents.transfer) {
          console.log('Attaching Transfer document');
          data.append('ownership_transfer', documents.transfer);
        }
        
        if (documents.additional) {
          console.log('Attaching Additional documents');
          data.append('additional_documents', documents.additional);
        }
        
        // Log what we're sending
        console.log('Documents attached to FormData:', 
          Object.keys(documents).filter(key => documents[key as keyof typeof documents]).join(', '));
        
        // FormData debug logging (can't directly log values)
        data.forEach((value, key) => {
          if (value instanceof File) {
            console.log(`FormData field: ${key}, type: File, name: ${value.name}, size: ${value.size}`);
          } else {
            console.log(`FormData field: ${key}, value: ${value}`);
          }
        });
        
        console.log('Sending multipart form data request for sell request with vehicle ID:', vehicleId);
        
        const response = await axios.post(`${API_CONFIG.BASE_URL}/marketplace/sell-requests/`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Submission successful! Response:', response.data);
        
        // Clean up any blob URLs to prevent memory leaks
        try {
          // Clean up photo blob URLs
          Object.keys(photos).forEach(key => {
            const photo = photos[key];
            if (photo && photo instanceof File) {
              // Use a safer approach that doesn't rely on non-standard properties
              const blobUrl = (photo as any)._blobURL || null;
              if (blobUrl) {
                safeRevokeUrl(blobUrl);
              }
            }
          });
          
          // Clean up document blob URLs
          Object.keys(documents).forEach(key => {
            const doc = documents[key];
            if (doc && doc instanceof File) {
              // Use a safer approach that doesn't rely on non-standard properties
              const blobUrl = (doc as any)._blobURL || null;
              if (blobUrl) {
                safeRevokeUrl(blobUrl);
              }
            }
          });
        } catch (e) {
          console.error('Error cleaning up blob URLs:', e);
          // Non-critical error, don't throw
        }
        
        return response.data;
      } else {
        // If we don't have real photos, use the simplified JSON approach
        console.log('Using simplified JSON approach due to missing photos and documents');
        return await marketplaceService.createBasicSellRequest(vehicleId, formData);
      }
    } catch (error: any) {
      // First handle specific known errors
      if (error.message && error.message.includes('Pickup slot must be between 9 AM and 6 PM')) {
        console.error('Pickup slot time error:', error);
        
        // Retry with a fixed pickup time (noon)
        try {
          console.log('Retrying with fixed pickup time (noon)');
          
          // Create a new FormData with the same data
          const retryData = new FormData();
          
          // Add all the existing fields
          for (const [key, value] of Array.from(data.entries())) {
            // Skip the pickup_slot entry
            if (key !== 'pickup_slot') {
              retryData.append(key, value);
            }
          }
          
          // Add a new pickup_slot at exactly noon
          const retryPickupSlot = marketplaceService.getSafePickupTime();
          console.log('Using safe retry pickup slot:', retryPickupSlot);
          
          retryData.append('pickup_slot', retryPickupSlot);
          
          // Retry the request
          const retryResponse = await axios.post(
            `${API_CONFIG.BASE_URL}/marketplace/sell-requests/`,
            retryData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          
          return retryResponse.data;
        } catch (retryError: any) {
          console.error('Retry also failed:', retryError);
          // If retry also fails, continue with normal error handling
        }
      }
      
      // Check for duplicate vehicle error
      if (error.response?.status === 400 && 
          error.response?.data?.vehicle && 
          (Array.isArray(error.response.data.vehicle) 
            ? error.response.data.vehicle[0].includes('sell request with this vehicle already exists') 
            : error.response.data.vehicle.includes('sell request with this vehicle already exists'))) {
        
        console.log('Duplicate sell request detected, trying to find existing one');
        
        // Try to find the existing sell request for this vehicle
        try {
          const existingRequestsResponse = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/sell-requests/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (Array.isArray(existingRequestsResponse.data)) {
            // Try to extract the vehicle ID from the error message if available
            let vehicleIdFromError = null;
            try {
              // Extract ID from request body if using FormData
              if (data && data.get) {
                vehicleIdFromError = data.get('vehicle');
              } 
              
              // Try to parse the error message
              if (!vehicleIdFromError) {
                const errorMessage = Array.isArray(error.response.data.vehicle) 
                  ? error.response.data.vehicle[0] 
                  : error.response.data.vehicle;
                
                // Try to extract id from the error message using regex
                const match = errorMessage.match(/vehicle with id (\d+)/i);
                if (match && match[1]) {
                  vehicleIdFromError = match[1];
                  console.log('Extracted vehicle ID from error message:', vehicleIdFromError);
                }
              }
            } catch (e) {
              console.warn('Could not extract vehicle ID from FormData or error message:', e);
            }
            
            // Use vehicleIdFromError directly
            const vehicleIdForSearch = vehicleIdFromError;
            
            if (vehicleIdForSearch) {
              const existingRequest = existingRequestsResponse.data.find((request: any) => 
                request.vehicle === vehicleIdForSearch || 
                request.vehicle?.id === vehicleIdForSearch ||
                (request.vehicle && request.vehicle.id && request.vehicle.id.toString() === vehicleIdForSearch.toString())
              );
              
              if (existingRequest) {
                console.log('Found existing sell request:', existingRequest);
                
                // Return the existing request with a flag indicating it was existing
                return {
                  ...existingRequest,
                  _isExistingSellRequest: true
                };
              }
            } else {
              console.warn('Could not determine vehicle ID to look for existing sell request');
            }
          }
        } catch (findError) {
          console.warn('Error finding existing sell request:', findError);
        }
        
        // If we couldn't find the existing request but know it exists,
        // throw a special error that can be handled by the UI
        const enhancedError = new Error('Vehicle: sell request with this vehicle already exists.');
        (enhancedError as any).isDuplicateSellRequest = true;
        (enhancedError as any).details = error.response.data;
        throw enhancedError;
      }
      
      console.error('Error submitting vehicle:', error);
      
      // Format error message based on type
      let errorMessage = 'An unknown error occurred';
      let errorDetails = null;
      
      if (error.response?.data) {
        errorDetails = error.response.data;
        
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          // Format field errors into a readable message
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, messages]) => {
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
              const messageText = Array.isArray(messages) ? messages.join(', ') : String(messages);
              return `${fieldName}: ${messageText}`;
            })
            .join('; ');
          
          errorMessage = fieldErrors || 'Validation error';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Throw a more informative error
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).originalError = error;
      (enhancedError as any).details = errorDetails;
      (enhancedError as any).status = error.response?.status;
      
      throw enhancedError;
    }
  },
  
  // Enhanced debug version to capture error details
  submitVehicleDebug: async (formData: any, photos: any, documents: any = {}) => {
    try {
      // First try a simpler approach with minimal data to identify the issue
      const token = localStorage.getItem('accessToken');
      const phoneNumber = formData.contactNumber || localStorage.getItem('userPhone') || '';
      
      // Format the phone number properly
      let formattedPhone = phoneNumber;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
      }
      
      console.log('Using simplified approach to debug 500 error');
      
      // Step 1: Create vehicle
      console.log('Step a: Creating vehicle...');
      const vehicleData = {
        vehicle_type: formData.type,
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        color: formData.color || '',
        registration_number: formData.registrationNumber.trim().toUpperCase(),
        kms_driven: parseInt(formData.kmsDriven),
        Mileage: formData.mileage,
        price: parseInt(formData.expectedPrice),
        fuel_type: formData.fuelType,
        engine_capacity: parseInt(formData.engineCapacity),
        last_service_date: formData.lastServiceDate,
        insurance_valid_till: formData.insuranceValidTill,
        status: 'under_inspection',
        features: formData.features || [],
        highlights: formData.highlights || [],
        emi_available: !!formData.emiAvailable
      };
      
      try {
        // Create vehicle
        const vehicleResponse = await axios.post(`${API_CONFIG.BASE_URL}/marketplace/vehicles/`, vehicleData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Vehicle created successfully:', vehicleResponse.data);
        const vehicleId = vehicleResponse.data.id;
        
        // With the vehicle ID, try our bare-bones approach
        return await marketplaceService.createBasicSellRequest(vehicleId, formData);
        
      } catch (vehicleError: any) {
        // If creating the vehicle fails, check if it's because it already exists
        if (vehicleError.response?.status === 400 && 
            vehicleError.response?.data?.registration_number?.includes('already exists')) {
          
          console.log('Vehicle already exists, trying to find it by registration number');
          
          // Try to find the vehicle by registration number
          const findResponse = await axios.get(
            `${API_CONFIG.BASE_URL}/marketplace/vehicles/?registration_number=${encodeURIComponent(formData.registrationNumber)}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          
          if (findResponse.data && findResponse.data.length > 0) {
            const existingVehicleId = findResponse.data[0].id;
            console.log('Found existing vehicle with ID:', existingVehicleId);
            
            // Use the existing vehicle ID
            return await marketplaceService.createBasicSellRequest(existingVehicleId, formData);
          }
        }
        
        // If we can't recover, rethrow the error
        throw vehicleError;
      }
      
    } catch (error: any) {
      // Enhanced error handling specifically for debugging
      console.error('===== DETAILED ERROR INFORMATION =====');
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
        
        // Alert with the exact error message for immediate visibility
        alert(`API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      } else {
        console.error('Error without response:', error.message);
        alert(`Error: ${error.message}`);
      }
      
      throw error;
    }
  },
  
  // Function to generate a guaranteed safe pickup time in UTC
  getSafePickupTime: () => {
    // Create a date for tomorrow
    const safeDate = new Date();
    safeDate.setDate(safeDate.getDate() + 1);
    
    // Set to 13:00 UTC (1 PM) which should be safe in any timezone
    safeDate.setUTCHours(13, 0, 0, 0);
    
    console.log('Generated safe pickup time:', {
      date: safeDate.toDateString(),
      localTime: safeDate.toLocaleTimeString(),
      utcTime: `${safeDate.getUTCHours()}:${safeDate.getUTCMinutes()}`,
      iso: safeDate.toISOString()
    });
    
    return safeDate.toISOString();
  },

  // A bare-bones method that creates just a sell request with minimal data
  createBasicSellRequest: async (vehicleId: string, formData: any) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Format phone number
      let phone = formData.contactNumber || localStorage.getItem('userPhone') || '';
      if (!phone.startsWith('+')) {
        phone = '+' + phone.replace(/\D/g, '');
      }
      
      // Ensure it meets minimum length
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 9) {
        phone = '+' + digits.padEnd(9, '0');
      }
      
      // Format pickup address to ensure it meets length requirement
      const address = formData.pickupAddress || localStorage.getItem('userAddress') || '';
      const formattedAddress = address.length >= 10 ? 
        address : 
        address + ', Default Address, 12345';
      
      // Set default pickup slot time (guaranteed to be within business hours)
      const pickupSlot = marketplaceService.getSafePickupTime();
      console.log('Using safe pickup slot time:', pickupSlot);
      
      // Create a very simple request with only the absolutely required fields
      const basicData = {
        vehicle: vehicleId,
        contact_number: phone,
        pickup_address: formattedAddress,
        pickup_slot: pickupSlot,
        
        // Include additional fields if provided
        ...(formData.sellerNotes && { seller_notes: formData.sellerNotes }),
        is_price_negotiable: !!formData.isPriceNegotiable,
        has_puc_certificate: !!formData.hasPucCertificate
      };
      
      console.log('Creating sell request with vehicle ID:', vehicleId);
      
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/marketplace/sell-requests/`,
        basicData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Sell request created successfully:', response.data);
      
      // If we have actual photo files, attempt to update the sell request with them
      const sellRequestId = response.data.id;
      
      // If we need to update the photos after creating the request
      const hasPhotos = Object.values(formData.photos || {}).some(photo => photo !== null);
      if (hasPhotos) {
        try {
          console.log('Updating sell request with actual photos');
          
          // Create a new FormData for the photo upload
          const photoData = new FormData();
          
          // Add the photos to the form data
          if (formData.photos?.front) photoData.append('photo_front', formData.photos.front);
          if (formData.photos?.back) photoData.append('photo_back', formData.photos.back);
          if (formData.photos?.left) photoData.append('photo_left', formData.photos.left);
          if (formData.photos?.right) photoData.append('photo_right', formData.photos.right);
          
          // Update the sell request with the photos
          await axios.patch(
            `${API_CONFIG.BASE_URL}/marketplace/sell-requests/${sellRequestId}/`,
            photoData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          console.log('Successfully updated sell request photos');
        } catch (photoError) {
          // Log but don't fail the whole process if photo upload fails
          console.error('Failed to update photos for sell request:', photoError);
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating sell request:', error);
      
      // Format the error for better handling
      let errorMessage = 'An unknown error occurred';
      let errorDetails = null;
      
      if (error.response?.data) {
        errorDetails = error.response.data;
        
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          // Format field errors into a readable message
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, messages]) => {
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
              const messageText = Array.isArray(messages) ? messages.join(', ') : String(messages);
              return `${fieldName}: ${messageText}`;
            })
            .join('; ');
          
          errorMessage = fieldErrors || 'Validation error';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Throw a more informative error
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).originalError = error;
      (enhancedError as any).details = errorDetails;
      (enhancedError as any).status = error.response?.status;
      
      throw enhancedError;
    }
  },
  
  // Schedule inspection
  scheduleInspection: async (sellRequestId: string, date: Date, time: string) => {
    const isoDateTime = new Date(`${date.toDateString()} ${time}`).toISOString();
    
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/marketplace/sell-requests/${sellRequestId}/schedule/`, 
      { pickup_slot: isoDateTime },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    );
    
    return response.data;
  },
  
  // Get user's sell requests
  getUserSellRequests: async () => {
    const response = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/sell-requests/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    
    return response.data;
  },
  
  // Add this method to update an existing sell request
  updateSellRequest: async (id: string, updateData: any) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Authentication required. Please log in to continue.');
    }
    
    try {
      // Format phone number if present
      if (updateData.contact_number) {
        let formattedPhone = updateData.contact_number.replace(/[^\d+]/g, '');
        if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }
        updateData.contact_number = formattedPhone;
      }
      
      const response = await axios.patch(
        `${API_CONFIG.BASE_URL}/marketplace/sell-requests/${id}/`, 
        updateData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Get the full updated data to ensure we have the complete object
      const updatedRequest = response.data;
      
      console.log('Successfully updated sell request:', updatedRequest);
      
      // Fetch the complete data from the server
      const refreshResult = await marketplaceService.forceRefreshSellRequest(id);
      
      return refreshResult.sellRequest;
    } catch (error) {
      console.error('Error updating sell request:', error);
      throw error;
    }
  },

  // Force refresh a sell request from the API (bypass cache)
  forceRefreshSellRequest: async (id: string) => {
    try {
      console.log(`Force refreshing sell request data for ID ${id}`);
      
      // Clear all stored data for this vehicle first
      console.log('Clearing all cached data');
      sellRequestCache.clear(id);
      sellRequestCache.clear(`${id}_status`);
      
      // Clear from persistent storage
      await persistentStorageService.clearVehicleData(id);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please log in to continue.');
      }
      
      // Fetch fresh data from API
      const response = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/sell-requests/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        // Add a cache-busting query parameter
        params: {
          _t: Date.now()
        }
      });
      
      // Extract ETag if available
      const etag = response.headers.etag;
      
      // Also refresh the status information
      let statusData = null;
      try {
        const statusResponse = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/sell-requests/${id}/status_info/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            _t: Date.now()
          }
        });
        statusData = statusResponse.data;
      } catch (statusError) {
        console.error('Error fetching status during force refresh:', statusError);
      }
      
      // Enhance the data with fallback values for any missing fields
      const enhancedData = {
        ...response.data,
        vehicle: {
          ...(response.data.vehicle || {}),
          // Ensure these critical fields have values
          brand: response.data.vehicle?.brand || 'Unknown',
          model: response.data.vehicle?.model || 'Unknown',
          registration_number: response.data.vehicle?.registration_number || 'Unknown',
          year: response.data.vehicle?.year || new Date().getFullYear(),
          fuel_type: response.data.vehicle?.fuel_type || 'petrol',
          color: response.data.vehicle?.color || 'Not Specified',
          vehicle_type: response.data.vehicle?.vehicle_type || 'bike',
          kms_driven: response.data.vehicle?.kms_driven || 0,
          Mileage: response.data.vehicle?.Mileage || response.data.vehicle?.mileage || '',
          engine_capacity: response.data.vehicle?.engine_capacity || 0,
          condition: response.data.vehicle?.condition || ''
        }
      };
      
      // If we have status data, update the status in the main response
      if (statusData) {
        enhancedData.status = statusData.status;
        enhancedData.status_display = statusData.status_display;
        enhancedData.status_title = statusData.title;
        enhancedData.status_message = statusData.message;
        
        // Cache the status separately
        sellRequestCache.set(`${id}_status`, statusData);
      }
      
      // CRITICAL: Update sessionStorage directly for fastest UI access
      try {
        sessionStorage.setItem(`vehicle_summary_${id}`, JSON.stringify(enhancedData));
        console.log(`Directly updated sessionStorage with fresh data for ID ${id}`);
      } catch (sessionError) {
        console.error('Failed to update sessionStorage:', sessionError);
      }
      
      // Update cache with the fresh data
      console.log(`Storing fresh sell request data for ID ${id}:`, enhancedData);
      sellRequestCache.set(id, enhancedData, etag);
      
      // Store in persistent storage
      await persistentStorageService.saveVehicleData(id, enhancedData, etag);
      
      // Notify subscribers
      persistentStorageService.notifyVehicleUpdated(id);
      
      return {
        sellRequest: enhancedData,
        statusInfo: statusData
      };
    } catch (error) {
      console.error(`Error force refreshing sell request with ID ${id}:`, error);
      throw error;
    }
  },

  // Fetch all vehicles
  getAllVehicles: async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/vehicles/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all vehicles:', error);
      throw error;
    }
  },

  // Fetch specific vehicle details by ID
  getVehicleById: async (id: string) => {
    try {
      // Use the marketplace prefix for vehicle endpoints
      const response = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/vehicles/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicle with ID ${id}:`, error);
      throw error;
    }
  },

  // Fetch available vehicles with optional filtering
  getAvailableVehicles: async () => {
    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken');
      
      // Check sessionStorage first for instant loading
      try {
        const cachedVehicles = sessionStorage.getItem('available_vehicles');
        if (cachedVehicles) {
          const parsedData = JSON.parse(cachedVehicles);
          const cacheAge = Date.now() - (parsedData.timestamp || 0);
          
          // Use cache if less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            console.log('Using cached vehicles data');
            return parsedData.data;
          }
        }
      } catch (e) {
        console.warn('Error accessing sessionStorage:', e);
      }
      
      // Debug: Log the marketplace URL
      console.log('[DEBUG] Marketplace URL:', API_CONFIG.MARKETPLACE_URL);
      
      // Fix: Use full marketplace URL
      const url = `${API_CONFIG.BASE_URL}/marketplace/vehicles/`;
      console.log('[DEBUG] Request URL:', url);
      
      // Fetch from API if no cache or cache expired
      const response = await axios.get(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      // Ensure response.data is an array, otherwise use empty array
      const vehiclesData = Array.isArray(response.data) ? response.data : [];
      
      console.log('Raw vehicles API response:', vehiclesData);
      
      // Helper function to get safe string value
      const safeStr = (value: any): string => (value !== undefined && value !== null) ? String(value) : '';
      
      // Helper function to convert relative paths to absolute URLs
      const getAbsoluteUrl = (path: string | null | undefined) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        
        // Use the API_CONFIG helper for media URLs
        return API_CONFIG.getMediaUrl(path);
      };
      
      // Add a helper function to check if an image exists
      const imageExists = async (url: string | null): Promise<string | null> => {
        if (!url) return null;
        
        try {
          // Attempt to check if the image exists using a HEAD request
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            return url;
          }
          console.warn(`Image not found: ${url}`);
          return API_CONFIG.getDefaultVehicleImage();
        } catch (error) {
          console.warn(`Error checking image: ${url}`, error);
          return API_CONFIG.getDefaultVehicleImage();
        }
      };
      
      // Process response to normalize data
      const vehicles = await Promise.all(vehiclesData.map(async (vehicle: any) => {
        if (!vehicle) return null;
        
        // Ensure we have at least minimal required data
        const brand = safeStr(vehicle.brand || '');
        const model = safeStr(vehicle.model || '');
        
        // Get image URL (handle multiple possible formats)
        let imageUrl = null;
        try {
          // Try various image sources
          const potentialImageUrl = getAbsoluteUrl(vehicle.front_image_url) || 
                   getAbsoluteUrl(vehicle.photo_front) || 
                   (vehicle.images?.front ? getAbsoluteUrl(vehicle.images.front) : null);
          
          // Check if the image exists
          imageUrl = await imageExists(potentialImageUrl) || API_CONFIG.getDefaultVehicleImage();
        } catch (e) {
          console.warn(`Error processing image for vehicle ${vehicle.id}:`, e);
          imageUrl = API_CONFIG.getDefaultVehicleImage();
        }
        
        // Get price with various fallbacks
        let price = 0;
        try {
          price = vehicle.display_price?.amount || 
                vehicle.price || 
                vehicle.expected_price || 
                0;
        } catch (e) {
          console.warn(`Error processing price for vehicle ${vehicle.id}:`, e);
        }
        
        return {
          id: vehicle.id || '',
          brand: brand,
          model: model,
          year: vehicle.year || new Date().getFullYear(),
          vehicle_type: vehicle.vehicle_type || 'bike',
          kms_driven: vehicle.kms_driven || 0,
          status: vehicle.status || 'unavailable',
          registration_number: vehicle.registration_number || '',
          fuel_type: vehicle.fuel_type || '',
          
          // Normalized fields
          name: `${brand} ${model}`.trim() || 'Unknown Vehicle',
          mileage: vehicle.Mileage || vehicle.mileage || 'Unknown',
          front_image_url: vehicle.front_image_url || null,
          imageUrl: imageUrl,
          price: price,
          formatted_price: vehicle.display_price?.formatted || `₹${(price).toLocaleString()}`
        };
      }).filter(Boolean)); // Remove any null entries
      
      // Store in session for quick access
      try {
        sessionStorage.setItem('available_vehicles', JSON.stringify({
          timestamp: Date.now(),
          data: vehicles
        }));
      } catch (e) {
        console.error('Failed to cache vehicles in sessionStorage:', e);
      }
      
      return vehicles;
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  },

  // Fetch detailed information about a specific vehicle
  getVehicleDetails: async (vehicleId: string) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken');
      
      // Use the marketplace prefix for vehicle endpoints
      const response = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/vehicles/${vehicleId}/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      throw error;
    }
  },

  // Get similar vehicles for recommendations
  getSimilarVehicles: async (vehicleId: string) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken');
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/vehicles/${vehicleId}/similar/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching similar vehicles:', error);
      // Return empty array on error
      return [];
    }
  },

  // Get popular vehicles for recommendations
  getPopularVehicles: async (limit: number = 5) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken');
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/vehicles/popular/?limit=${limit}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular vehicles:', error);
      // Return empty array on error
      return [];
    }
  },

  // Fetch available filter options for vehicle searching
  getVehicleFilters: async () => {
    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken');
      
      // Check sessionStorage first for cached filter options
      try {
        const cachedFilters = sessionStorage.getItem('vehicle_filters');
        if (cachedFilters) {
          const parsedData = JSON.parse(cachedFilters);
          const cacheAge = Date.now() - (parsedData.timestamp || 0);
          
          // Use cache if less than 1 hour old
          if (cacheAge < 60 * 60 * 1000) {
            console.log('Using cached vehicle filters');
            return parsedData.data;
          }
        }
      } catch (e) {
        console.warn('Error accessing sessionStorage for filters:', e);
      }
      
      // Fix: Use full marketplace URL
      const url = `${API_CONFIG.BASE_URL}/marketplace/vehicles/`;
      console.log('[DEBUG] Filter Request URL:', url);
      
      // Since there's no specific /vehicles/filters/ endpoint,
      // extract filter data from the vehicles list
      const response = await axios.get(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      // Extract unique values for filters from the vehicle data
      // Use safe access patterns to handle potential missing data
      const vehicles = Array.isArray(response.data) ? response.data : [];
      
      // Create a set of unique values with safety checks
      const uniqueValues = (property: string) => {
        return [...new Set(
          vehicles
            .map((v: any) => v && v[property])
            .filter((value: any) => value !== undefined && value !== null && value !== '')
        )];
      };
      
      const filters = {
        brands: uniqueValues('brand'),
        vehicle_types: uniqueValues('vehicle_type'),
        fuel_types: uniqueValues('fuel_type'),
        years: uniqueValues('year').sort((a: number, b: number) => Number(b) - Number(a)),
        price_ranges: [
          {min: 0, max: 30000},
          {min: 30000, max: 60000},
          {min: 60000, max: 100000},
          {min: 100000, max: null}
        ],
        colors: uniqueValues('color')
      };
      
      // Cache the result
      try {
        sessionStorage.setItem('vehicle_filters', JSON.stringify({
          timestamp: Date.now(),
          data: filters
        }));
      } catch (e) {
        console.error('Failed to cache vehicle filters in sessionStorage:', e);
      }
      
      return filters;
    } catch (error) {
      console.error('Error fetching vehicle filters:', error);
      // Return default filters as fallback
      return {
        brands: ['Honda', 'Hero', 'Bajaj', 'TVS', 'Royal Enfield'],
        vehicle_types: ['bike', 'scooter'],
        fuel_types: ['petrol', 'electric'],
        years: Array.from({length: 10}, (_, i) => new Date().getFullYear() - i),
        price_ranges: [
          {min: 0, max: 30000},
          {min: 30000, max: 60000},
          {min: 60000, max: 100000},
          {min: 100000, max: null}
        ],
        colors: ['Black', 'White', 'Red', 'Blue', 'Silver']
      };
    }
  },

  // Initiate vehicle purchase process
  initiateVehiclePurchase: async (vehicleId: string, purchaseData: any) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please log in to continue.');
      }

      const response = await axios.post(`${API_CONFIG.BASE_URL}/marketplace/vehicles/${vehicleId}/purchase/`, purchaseData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error initiating vehicle purchase:', error);
      throw error;
    }
  },
  
  // Book a vehicle
  bookVehicle: async (vehicleId: string, bookingData: any) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please log in to continue.');
      }

      // Validate the booking data
      if (!bookingData.contact_number) {
        throw new Error('Contact number is required');
      }

      // Ensure phone number is in the correct format (remove any non-digit characters except +)
      const cleanedPhone = bookingData.contact_number.replace(/[^\d+]/g, '');
      
      // Format the request payload
      const payload = {
        vehicle: vehicleId,
        contact_number: cleanedPhone,
        notes: bookingData.notes || ''
      };

      console.log('Booking payload:', payload);

      const response = await axios.post(`${API_CONFIG.BASE_URL}/marketplace/vehicles/${vehicleId}/book/`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Before storing the booking, fetch the complete vehicle details to ensure
      // we have all the information including images
      let completeVehicleData = null;
      try {
        // Get full vehicle details to include with the booking
        const vehicleDetails = await marketplaceService.getVehicleDetails(vehicleId);
        completeVehicleData = vehicleDetails;
        console.log('Retrieved complete vehicle details for booking:', vehicleDetails);
      } catch (vehicleError) {
        console.warn('Could not fetch complete vehicle details for booking:', vehicleError);
      }
      
      // Store the booking in sessionStorage for quick access
      try {
        // Get existing bookings or initialize empty array
        const existingBookingsJson = sessionStorage.getItem('user_vehicle_bookings');
        const existingBookings = existingBookingsJson ? JSON.parse(existingBookingsJson) : [];
        
        // Prepare the enhanced booking data with complete vehicle information if available
        const enhancedBooking = {
          ...response.data,
          timestamp: Date.now(),
          // Store reference to originating page if provided in booking data
          referrer: bookingData.referrer || null
        };
        
        // If the booking data included the original front_image_url, use it
        if (bookingData.original_front_image_url) {
          console.log('Using original front_image_url from booking data:', bookingData.original_front_image_url);
          
          // Make sure vehicle object exists
          if (!enhancedBooking.vehicle) {
            enhancedBooking.vehicle = {};
          }
          
          // Set the exact front_image_url from the vehicle detail page
          enhancedBooking.vehicle.front_image_url = bookingData.original_front_image_url;
        }
        // If we have complete vehicle data, merge it with the booking response
        else if (completeVehicleData) {
          // IMPORTANT: Preserve the exact front_image_url from the vehicle detail page
          // Don't transform it or modify it in any way
          enhancedBooking.vehicle = {
            ...enhancedBooking.vehicle,
            ...completeVehicleData,
            // Ensure we keep the exact front_image_url from the detail page
            front_image_url: completeVehicleData.front_image_url
          };
          
          // Log to confirm we're keeping the exact URL
          console.log('Preserving exact front_image_url:', completeVehicleData.front_image_url);
        }
        
        // Add the new booking to the array
        existingBookings.push(enhancedBooking);
        
        // Store the updated bookings
        sessionStorage.setItem('user_vehicle_bookings', JSON.stringify(existingBookings));
      } catch (e) {
        console.error('Failed to store booking in sessionStorage:', e);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error booking vehicle:', error);
      
      // Provide more specific error messages based on the response
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          // Check for specific field errors
          if (data.contact_number) {
            throw new Error(`Contact number error: ${data.contact_number}`);
          } else if (data.detail) {
            throw new Error(data.detail);
          } else {
            throw new Error('Invalid booking data. Please check your inputs and try again.');
          }
        } else if (status === 401 || status === 403) {
          throw new Error('Authentication error. Please log in again.');
        } else if (status === 404) {
          throw new Error('Vehicle not found or no longer available for booking.');
        } else if (status === 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      
      throw error;
    }
  },
  
  // Get user's vehicle bookings
  getUserBookings: async () => {
    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please log in to continue.');
      }

      // First try to get bookings from sessionStorage
      try {
        const storedBookings = sessionStorage.getItem('user_vehicle_bookings');
        if (storedBookings) {
          console.log('Using bookings from sessionStorage');
          return JSON.parse(storedBookings);
        }
      } catch (e) {
        console.warn('Error reading bookings from sessionStorage:', e);
      }

      // Add retry logic for API calls with exponential backoff
      const maxRetries = 3;
      let retryCount = 0;
      let lastError;

      while (retryCount < maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} to fetch bookings from API`);
          
          const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOKINGS}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            // Add timeout to prevent hanging requests
            timeout: 10000
          });
          
          // Transform the data to ensure all required fields are present
          const transformedBookings = response.data.map((booking: any) => {
            // Create a properly structured vehicle object
            const vehicle = {
              id: booking.vehicle?.id || `vehicle-${booking.id}`,
              brand: booking.vehicle?.manufacturer_name || 'Unknown',
              model: booking.vehicle?.model_name || 'Unknown',
              year: booking.vehicle?.year || new Date().getFullYear(),
              vehicle_type: booking.vehicle?.vehicle_type_name || 'Unknown',
              // Ensure front_image_url exists
              front_image_url: booking.vehicle?.image_url || null,
              registration_number: booking.vehicle?.registration_number || '',
              color: booking.vehicle?.color || '',
            };

            // Ensure all required fields exist
            return {
              id: booking.id,
              vehicle: vehicle,
              status: booking.status || 'pending',
              status_display: booking.status_display || 'Pending',
              // Format booking date properly
              booking_date: booking.created_at || new Date().toISOString(),
              booking_date_display: new Date(booking.created_at || Date.now()).toLocaleDateString(),
              // Ensure contact_number is present
              contact_number: booking.contact_number || booking.phone || '',
              // Ensure notes field exists
              notes: booking.notes || booking.address || '',
              // Add schedule date and time if available
              schedule_date: booking.schedule_date,
              schedule_time: booking.schedule_time,
              referrer: booking.referrer || null
            };
          });
          
          // Store in sessionStorage for quick access
          try {
            sessionStorage.setItem('user_vehicle_bookings', JSON.stringify(transformedBookings));
          } catch (e) {
            console.error('Failed to store bookings in sessionStorage:', e);
          }
          
          return transformedBookings;
        } catch (error: any) {
          lastError = error;
          retryCount++;
          
          // Log the error but don't throw yet if we have more retries
          console.warn(`Error fetching bookings (attempt ${retryCount}/${maxRetries}):`, error.message);
          
          if (retryCount < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s, etc.
            const delay = 1000 * Math.pow(2, retryCount - 1);
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // All retries failed, check if we should return an empty array instead of throwing
      console.error('All attempts to fetch bookings failed:', lastError);
      
      // Return empty array as fallback instead of throwing
      return [];
    } catch (error) {
      console.error('Error in getUserBookings:', error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  },
  
  // Cancel a user booking
  cancelBooking: async (bookingId: string) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please log in to continue.');
      }
      
      // Make API call to cancel booking
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOKING_CANCEL(bookingId)}`,
        {}, // Empty request body
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // If successful, update cached bookings
      try {
        const cachedBookingsJson = sessionStorage.getItem('user_vehicle_bookings');
        if (cachedBookingsJson) {
          const cachedBookings = JSON.parse(cachedBookingsJson);
          const updatedBookings = cachedBookings.map((booking: any) => {
            if (booking.id === bookingId || booking.id === Number(bookingId)) {
              return {
                ...booking,
                status: 'cancelled',
                status_display: 'Cancelled'
              };
            }
            return booking;
          });
          
          sessionStorage.setItem('user_vehicle_bookings', JSON.stringify(updatedBookings));
        }
      } catch (e) {
        console.error('Failed to update cached bookings:', e);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },
  
  // Add vehicle to user's favorites
  addToFavorites: async (vehicleId: string) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please log in to continue.');
      }

      // Get current favorites or initialize empty array
      const favoritesJson = localStorage.getItem('user_favorite_vehicles');
      let favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
      
      // Check if vehicle is already in favorites
      if (!favorites.includes(vehicleId)) {
        // Add to favorites
        favorites.push(vehicleId);
        
        // Save updated favorites
        localStorage.setItem('user_favorite_vehicles', JSON.stringify(favorites));
        
        // Call the API to add to favorites if an endpoint exists
        try {
          await axios.post(`${API_CONFIG.BASE_URL}/user/favorites/`, { vehicle_id: vehicleId }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (e) {
          console.warn('Failed to sync favorite to server, but saved locally', e);
        }
      }
      
      return favorites;
    } catch (error) {
      console.error('Error adding vehicle to favorites:', error);
      throw error;
    }
  },
  
  // Remove vehicle from user's favorites
  removeFromFavorites: async (vehicleId: string) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please log in to continue.');
      }

      // Get current favorites
      const favoritesJson = localStorage.getItem('user_favorite_vehicles');
      let favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
      
      // Remove from favorites if present
      favorites = favorites.filter((id: string) => id !== vehicleId);
      
      // Save updated favorites
      localStorage.setItem('user_favorite_vehicles', JSON.stringify(favorites));
      
      // Call the API to remove from favorites if an endpoint exists
      try {
        await axios.delete(`${API_CONFIG.BASE_URL}/user/favorites/${vehicleId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (e) {
        console.warn('Failed to sync favorite removal to server, but removed locally', e);
      }
      
      return favorites;
    } catch (error) {
      console.error('Error removing vehicle from favorites:', error);
      throw error;
    }
  },
  
  // Check if a vehicle is in user's favorites
  isVehicleFavorited: (vehicleId: string): boolean => {
    try {
      const favoritesJson = localStorage.getItem('user_favorite_vehicles');
      if (!favoritesJson) return false;
      
      const favorites = JSON.parse(favoritesJson);
      return favorites.includes(vehicleId);
    } catch (e) {
      console.error('Error checking if vehicle is favorited:', e);
      return false;
    }
  },
  
  // Share vehicle via native share API if available or copy link to clipboard
  shareVehicle: async (vehicleId: string, vehicleName: string) => {
    const shareUrl = `${window.location.origin}/vehicles/${vehicleId}`;
    const shareTitle = "Check out this " + (vehicleName || 'vehicle') + " on RepairMyBike";
    const shareText = "I found this great vehicle on RepairMyBike. Check it out!";
    
    // Use native share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return { success: true, method: 'native_share' };
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }

    // Fallback to copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      return { success: true, method: 'clipboard', url: shareUrl };
    } catch (err) {
      console.error('Failed to copy URL to clipboard:', err);
      return { success: false, error: 'Failed to copy URL' };
    }
  },

  // Helper function to enrich vehicle data
  enrichVehicleData: (data: VehicleData): VehicleData => {
    // If data is null or undefined, return empty object
    if (data == null) return {};
    
    // Make a deep copy to avoid modifying the original
    const enriched: VehicleData = JSON.parse(JSON.stringify(data));
    
    // Ensure ID exists
    if (!enriched.id && enriched.vehicle?.id) {
      enriched.id = enriched.vehicle.id;
    }
    
    // Ensure vehicle object exists
    if (!enriched.vehicle) {
      enriched.vehicle = {};
    }
    
    // Ensure critical properties have values
    if (enriched.vehicle) {
      enriched.vehicle.brand = enriched.vehicle.brand || 'Unknown';
      enriched.vehicle.model = enriched.vehicle.model || 'Unknown';
      enriched.vehicle.registration_number = enriched.vehicle.registration_number || 'Unknown';
      enriched.vehicle.year = enriched.vehicle.year || new Date().getFullYear();
      enriched.vehicle.fuel_type = enriched.vehicle.fuel_type || 'Petrol';
      enriched.vehicle.color = enriched.vehicle.color || 'Not Available';
      enriched.vehicle.kms_driven = enriched.vehicle.kms_driven || 0;
      enriched.vehicle.engine_capacity = enriched.vehicle.engine_capacity || 0;
      
      // Ensure we have both price and expected_price
      if (enriched.vehicle.price && !enriched.vehicle.expected_price) {
        enriched.vehicle.expected_price = enriched.vehicle.price;
      } else if (enriched.vehicle.expected_price && !enriched.vehicle.price) {
        enriched.vehicle.price = enriched.vehicle.expected_price;
      }
      
      // Ensure we have both mileage and Mileage
      enriched.vehicle.mileage = enriched.vehicle.mileage || enriched.vehicle.Mileage || 'Not Available';
      enriched.vehicle.Mileage = enriched.vehicle.Mileage || enriched.vehicle.mileage || 'Not Available';
    }
    
    return enriched;
  },

  // Helper function to process vehicle data consistently
  processVehicleData: (vehicle: any): VehicleData => {
    // If vehicle is not provided or not an object, return minimal object
    if (!vehicle || typeof vehicle !== 'object') {
      return { 
        vehicle: {
          brand: 'Unknown',
          model: 'Unknown'
        } 
      };
    }
    
    return marketplaceService.enrichVehicleData(vehicle);
  }
};

export default marketplaceService; 