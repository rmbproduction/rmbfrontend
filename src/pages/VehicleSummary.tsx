import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bike, Tag, Edit, Save, Camera, FileText, Info, 
  Calendar, DollarSign, CheckCircle, AlertCircle, ImageOff,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import marketplaceService from '../services/marketplaceService';
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

// Helper function to extract and normalize vehicle data from API response
const normalizeVehicleData = (responseData: any) => {
  if (!responseData) return {};
  
  // Handle both nested and direct structures
  const vehicleData = responseData.vehicle || responseData;
  
  // Debug incoming data structure
  console.log('normalizeVehicleData input data structure:', {
    hasVehicleProp: !!responseData.vehicle,
    hasDirectVehicleFields: !!(vehicleData.brand || vehicleData.registration_number || vehicleData.Mileage),
    allKeys: Object.keys(vehicleData).join(', ')
  });
  
  // Deep fallback - check localStorage for critical fields if they're missing
  const getFieldWithFallback = (field: string, defaultValue: any) => {
    // Check direct field
    if (vehicleData[field] !== undefined && vehicleData[field] !== null && vehicleData[field] !== '') {
      return vehicleData[field];
    }
    
    // Try localStorage backup for this vehicle if ID is available
    if (responseData.id) {
      try {
        const localData = localStorage.getItem(`vehicle_data_${responseData.id}`);
        if (localData) {
          const parsedData = JSON.parse(localData);
          if (parsedData[field] !== undefined && parsedData[field] !== null && parsedData[field] !== '') {
            console.log(`Recovered ${field} from localStorage:`, parsedData[field]);
            return parsedData[field];
          }
        }
      } catch (e) {
        console.error(`Error reading ${field} from localStorage:`, e);
      }
    }
    
    // Check sessionStorage as another fallback
    if (responseData.id) {
      try {
        const sessionData = sessionStorage.getItem(`vehicle_summary_${responseData.id}`);
        if (sessionData) {
          const parsedData = JSON.parse(sessionData);
          if (parsedData.vehicle && parsedData.vehicle[field] !== undefined && 
              parsedData.vehicle[field] !== null && parsedData.vehicle[field] !== '') {
            console.log(`Recovered ${field} from sessionStorage:`, parsedData.vehicle[field]);
            return parsedData.vehicle[field];
          }
        }
      } catch (e) {
        console.error(`Error reading ${field} from sessionStorage:`, e);
      }
    }
    
    // If all else fails, use the default
    return defaultValue;
  };
  
  const normalizedData = {
    ...vehicleData,
    // Ensure critical fields have fallback values with improved error recovery
    price: getFieldWithFallback('price', vehicleData.expected_price || 0),
    brand: getFieldWithFallback('brand', 'Unknown'),
    model: getFieldWithFallback('model', 'Unknown'),
    year: getFieldWithFallback('year', new Date().getFullYear()),
    registration_number: getFieldWithFallback('registration_number', 'Unknown'),
    condition: getFieldWithFallback('condition', ''),
    kms_driven: getFieldWithFallback('kms_driven', 0),
    // Check both capitalized and lowercase versions of mileage field with fallbacks
    Mileage: getFieldWithFallback('Mileage', getFieldWithFallback('mileage', '')),
    mileage: getFieldWithFallback('mileage', getFieldWithFallback('Mileage', '')),
    fuel_type: getFieldWithFallback('fuel_type', 'Petrol'),
    color: getFieldWithFallback('color', 'Not Specified'),
    engine_capacity: getFieldWithFallback('engine_capacity', getFieldWithFallback('engine_size', 0)),
    last_service_date: getFieldWithFallback('last_service_date', null),
    insurance_valid_till: getFieldWithFallback('insurance_valid_till', null),
    vehicle_type: getFieldWithFallback('vehicle_type', getFieldWithFallback('type', 'Bike')),
  };
  
  // Debug output
  console.log('normalizeVehicleData output:', {
    brand: normalizedData.brand,
    model: normalizedData.model,
    registration_number: normalizedData.registration_number,
    Mileage: normalizedData.Mileage,
    mileage: normalizedData.mileage,
    condition: normalizedData.condition
  });
  
  return normalizedData;
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
  
  // Sync images from localStorage to sessionStorage on initial load
  useEffect(() => {
    if (id) {
      // This ensures any images in localStorage are copied to sessionStorage
      syncImageStorageForVehicle(id);
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
      
      // Also update the vehicle data's status
      if (vehicleData) {
        console.log('Updating vehicle status from:', vehicleData.status, 'to:', statusData.status);
        
        // Update in-memory state
        setVehicleData((prev: any) => {
          const updated = {
            ...prev,
            status: statusData.status
          };
          
          return updated;
        });
        
        // Update session storage with the new status to persist it
        try {
          const sessionData = sessionStorage.getItem(`vehicle_summary_${id}`);
          if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            parsedData.status = statusData.status;
            parsedData.status_display = statusData.status_display;
            parsedData.status_title = statusData.title;
            parsedData.status_message = statusData.message;
            
            // If the data has vehicle property, update that as well
            if (parsedData.vehicle) {
              parsedData.vehicle.status = statusData.status;
            }
            
            // Save updated data back to session storage
            sessionStorage.setItem(`vehicle_summary_${id}`, JSON.stringify(parsedData));
            console.log('Session storage updated with new status:', statusData.status);
          }
        } catch (err) {
          console.error('Error updating session storage with new status:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching status information:', error);
    }
  };
  
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
    
    try {
      console.log('Performing initial sessionStorage check...');
      const sessionData = sessionStorage.getItem(`vehicle_summary_${id}`);
      if (sessionData) {
        const parsedData = JSON.parse(sessionData);
        console.log('Found data in sessionStorage during initial check:', parsedData);
        
        // Verify the data is usable
        if (parsedData.vehicle && (parsedData.vehicle.brand || parsedData.vehicle.registration_number)) {
          console.log('Using sessionStorage data for initial render');
          
          // Set data immediately to ensure UI shows something right away
          setVehicleData(parsedData);
          
          // Set photos if available
          if (parsedData.photo_urls) {
            setPhotoURLs(parsedData.photo_urls);
          }
          
          // Set status if available
          if (parsedData.status) {
            setStatusInfo({
              status: parsedData.status,
              status_display: parsedData.status_display,
              title: parsedData.status_title,
              message: parsedData.status_message
            });
          }
          
          // Initialize edit data
          setEditedData({
            expected_price: parsedData.vehicle?.price || parsedData.vehicle?.expected_price || '',
            description: parsedData.vehicle?.description || '',
            is_price_negotiable: parsedData.is_price_negotiable || false,
            contact_number: parsedData.contact_number || '',
            pickup_address: parsedData.pickup_address || '',
          });
          
          // Mark as loaded
          setLoading(false);
        }
      }
    } catch (e) {
      console.error('Error during initial sessionStorage check:', e);
    }
  }, [id]);
  
  // Fetch vehicle data from backend
  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!id) {
        setError('No vehicle ID provided');
        setLoading(false);
        return;
      }
      
      try {
        // CRITICAL FIX: First directly check sessionStorage for data to render immediately
        // This prevents the "Unknown" values after page refresh
        let directSessionData = null;
        try {
          const sessionDataStr = sessionStorage.getItem(`vehicle_summary_${id}`);
          if (sessionDataStr) {
            directSessionData = JSON.parse(sessionDataStr);
            console.log('Found data directly in sessionStorage:', directSessionData);
            
            // Check if data is valid and can be used for immediate rendering
            if (directSessionData && 
                directSessionData.vehicle && 
                (directSessionData.vehicle.brand || 
                 directSessionData.vehicle.registration_number)) {
              console.log('Using session data for immediate rendering');
              setVehicleData(directSessionData);
              
              // Get photos if available
              if (directSessionData.photo_urls) {
                setPhotoURLs(directSessionData.photo_urls);
              }
              
              // Set status info if available
              if (directSessionData.status) {
                setStatusInfo({
                  status: directSessionData.status,
                  status_display: directSessionData.status_display,
                  title: directSessionData.status_title,
                  message: directSessionData.status_message
                });
              }
              
              // Initialize edited data
              setEditedData({
                expected_price: directSessionData.vehicle?.price || directSessionData.vehicle?.expected_price || '',
                description: directSessionData.vehicle?.description || '',
                is_price_negotiable: directSessionData.is_price_negotiable || false,
                contact_number: directSessionData.contact_number || '',
                pickup_address: directSessionData.pickup_address || '',
              });
              
              // Still continue with API fetch in background, but data already displayed
              console.log('Data loaded from sessionStorage, continuing with API fetch in background');
            }
          }
        } catch (e) {
          console.error('Error retrieving directly from sessionStorage:', e);
        }

        // Debug mode - show what data we currently have in storage
        console.log('Checking existing data sources:');
        try {
          // Check sessionStorage
          const sessionData = sessionStorage.getItem(`vehicle_summary_${id}`);
          if (sessionData) {
            console.log('Found data in sessionStorage:', JSON.parse(sessionData));
          } else {
            console.log('No data in sessionStorage');
          }
          
          // Check localStorage backups
          const vehicleData = localStorage.getItem(`vehicle_data_${id}`);
          if (vehicleData) {
            console.log('Found backup in localStorage:', JSON.parse(vehicleData));
          } else {
            console.log('No backup in localStorage');
          }
        } catch (e) {
          console.error('Error checking storage:', e);
        }
        
        // First try fetching from our cache (which now has localStorage fallback)
        console.log('Attempting to fetch vehicle data from cache or API');
        
        const response = await marketplaceService.getSellRequest(id);
        console.log('Got vehicle data:', response);
        
        if (!response) {
          // If we already have data from sessionStorage, don't show error
          if (!directSessionData) {
            setError('Invalid response format from server');
            setLoading(false);
          }
          return;
        }
          
        // Try to get status info (will use cache if available)
        const statusData = await marketplaceService.getSellRequestStatus(id);
        console.log('Got status data:', statusData);
        
        if (statusData) {
          setStatusInfo(statusData);
        }
        
        // Debug the response structure
        console.log('Vehicle data details:', {
          vehicle: response.vehicle,
          price: response.vehicle?.price,
          expectedPrice: response.vehicle?.expected_price,
          kms_driven: response.vehicle?.kms_driven,
          mileageCapitalized: response.vehicle?.Mileage,
          mileageLowercase: response.vehicle?.mileage,
          registration: response.vehicle?.registration_number,
          condition: response.vehicle?.condition
        });
        
        // Normalize the vehicle data - pass entire response for ID access
        const normalizedVehicleData = {
          ...response,
          vehicle: normalizeVehicleData(response)
        };
        
        // Debug the normalized data
        console.log('Normalized vehicle data:', {
          vehicle: normalizedVehicleData.vehicle,
          mileage: normalizedVehicleData.vehicle?.Mileage
        });
        
        setVehicleData(normalizedVehicleData);
        
        // Initialize edited data with current values
        setEditedData({
          expected_price: normalizedVehicleData.vehicle?.price || normalizedVehicleData.vehicle?.expected_price || '',
          description: normalizedVehicleData.vehicle?.description || '',
          is_price_negotiable: normalizedVehicleData.is_price_negotiable || false,
          contact_number: normalizedVehicleData.contact_number || '',
          pickup_address: normalizedVehicleData.pickup_address || '',
        });
        
        // Process photo URLs using our utility function - these are server URLs
        const photos = extractPhotoUrls(response);
        setPhotoURLs(photos);
        
        // Save the data to sessionStorage for future quick access
        // Make sure we're not storing blob URLs
        const photoFields = [
          'photo_front', 'photo_back', 'photo_left', 'photo_right',
          'photo_dashboard', 'photo_odometer', 'photo_engine'
        ];
        const storageData = sanitizeUrlsForStorage(normalizedVehicleData, photoFields);
        
        // Store status information
        if (statusData) {
          storageData.status = statusData.status;
          storageData.status_display = statusData.status_display;
          storageData.status_title = statusData.title;
          storageData.status_message = statusData.message;
          storageData.updated_at = statusData.updated_at;
        }
        
        // Add photo URLs to the sessionStorage data (excluding blob URLs)
        storageData.photo_urls = Object.entries(photos).reduce((acc, [key, url]) => {
          // Only keep valid non-blob URLs
          if (isValidImageUrl(url)) {
            acc[key] = url;
          }
          return acc;
        }, {} as Record<string, string>);
        
        // Also explicitly store critical fields in localStorage for redundancy
        try {
          localStorage.setItem(`vehicle_data_${id}`, JSON.stringify({
            brand: normalizedVehicleData.vehicle.brand,
            model: normalizedVehicleData.vehicle.model,
            registration_number: normalizedVehicleData.vehicle.registration_number,
            year: normalizedVehicleData.vehicle.year,
            vehicle_type: normalizedVehicleData.vehicle.vehicle_type,
            color: normalizedVehicleData.vehicle.color,
            fuel_type: normalizedVehicleData.vehicle.fuel_type,
            kms_driven: normalizedVehicleData.vehicle.kms_driven,
            engine_capacity: normalizedVehicleData.vehicle.engine_capacity,
            last_service_date: normalizedVehicleData.vehicle.last_service_date,
            insurance_valid_till: normalizedVehicleData.vehicle.insurance_valid_till,
            Mileage: normalizedVehicleData.vehicle.Mileage || normalizedVehicleData.vehicle.mileage,
            price: normalizedVehicleData.vehicle.price || response.expected_price || 0,
            status: normalizedVehicleData.status || 'pending',
            condition: normalizedVehicleData.vehicle.condition || ''
          }));
          console.log('Successfully saved backup data to localStorage');
        } catch (e) {
          console.error('Failed to save backup vehicle data to localStorage:', e);
        }
        
        // Also include base64 photos if we have them (from localStorage)
        try {
          const localData = localStorage.getItem('sell_vehicle_photos_base64');
          if (localData) {
            const base64Photos = JSON.parse(localData);
            if (base64Photos && typeof base64Photos === 'object') {
              storageData.base64_photos = base64Photos;
            }
          }
        } catch (err) {
          console.error('Error retrieving base64 photos from localStorage:', err);
        }
        
        sessionStorage.setItem(`vehicle_summary_${id}`, JSON.stringify(storageData));
        console.log('Successfully saved data to sessionStorage');
      } catch (err: any) {
        console.error('Error fetching vehicle data:', err);
        
        // Try to recover from session storage if possible
        console.log('Attempting to recover from sessionStorage...');
        try {
          const sessionData = sessionStorage.getItem(`vehicle_summary_${id}`);
          if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            console.log('Found data in sessionStorage for recovery:', parsedData);
            setVehicleData(parsedData);
            
            // Extract photos if available
            if (parsedData.photo_urls) {
              setPhotoURLs(parsedData.photo_urls);
            }
            
            // Also initialize edited data
            setEditedData({
              expected_price: parsedData.vehicle?.price || parsedData.vehicle?.expected_price || '',
              description: parsedData.vehicle?.description || '',
              is_price_negotiable: parsedData.is_price_negotiable || false,
              contact_number: parsedData.contact_number || '',
              pickup_address: parsedData.pickup_address || '',
            });
            
            // Recovered successfully, no error
            setError(null);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Recovery from sessionStorage failed:', e);
        }
        
        // Try to recover from localStorage backup
        console.log('Attempting to recover from localStorage backup...');
        try {
          const backupData = localStorage.getItem(`vehicle_data_${id}`);
          if (backupData) {
            const parsedBackup = JSON.parse(backupData);
            console.log('Found backup in localStorage:', parsedBackup);
            
            // Construct a minimal vehicle data object
            const recoveredData = {
              id,
              status: parsedBackup.status || 'pending',
              vehicle: parsedBackup,
              contact_number: localStorage.getItem('userPhone') || '',
              pickup_address: localStorage.getItem('userAddress') || ''
            };
            
            setVehicleData(recoveredData);
            
            // Initialize edited data
            setEditedData({
              expected_price: parsedBackup.price || '',
              description: parsedBackup.description || '',
              is_price_negotiable: true,
              contact_number: localStorage.getItem('userPhone') || '',
              pickup_address: localStorage.getItem('userAddress') || '',
            });
            
            // Recovered successfully, no error
            setError(null);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Recovery from localStorage backup failed:', e);
        }
        
        // If all recovery attempts failed, show error
        let errorMessage = 'Could not load vehicle data. Please try again later.';
        if (err.message) {
          errorMessage = err.message;
        } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVehicleData();
  }, [id]);
  
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
      
      // Refresh the data
      const updatedData = await marketplaceService.getSellRequest(id);
      
      // Update the normalized data
      const normalizedVehicleData = {
        ...updatedData,
        vehicle: normalizeVehicleData(updatedData.vehicle || updatedData)
      };
      
      setVehicleData(normalizedVehicleData);
      
      // Update sessionStorage with the latest data, ensuring we don't store blob URLs
      const photoFields = [
        'photo_front', 'photo_back', 'photo_left', 'photo_right',
        'photo_dashboard', 'photo_odometer', 'photo_engine'
      ];
      const storageData = sanitizeUrlsForStorage(normalizedVehicleData, photoFields);
      
      sessionStorage.setItem(`vehicle_summary_${id}`, JSON.stringify(storageData));
      
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
      
      // Use the new force refresh method to get fresh data
      console.log('Forcing full data refresh from API...');
      const { sellRequest: response, statusInfo: statusData } = await marketplaceService.forceRefreshSellRequest(id);
      
      if (!response) {
        setError('Invalid response format from server');
        toast.dismiss(loadingToast);
        toast.error('Failed to refresh data');
        setLoading(false);
        return;
      }
      
      console.log('Received updated sell request data:', response);
      console.log('Received updated status data:', statusData);
      
      // Set status info if available
      if (statusData) {
        setStatusInfo(statusData);
      }
      
      // Normalize the vehicle data - IMPORTANT! Pass the entire response object
      const normalizedVehicleData = {
        ...response,
        vehicle: normalizeVehicleData(response)
      };
      
      // Debug the normalized data structure
      console.log('After refresh - normalized vehicle data:', {
        brand: normalizedVehicleData.vehicle.brand,
        model: normalizedVehicleData.vehicle.model,
        registration: normalizedVehicleData.vehicle.registration_number,
        mileage: normalizedVehicleData.vehicle.Mileage,
        fuel_type: normalizedVehicleData.vehicle.fuel_type
      });
      
      // Update state with fresh data
      setVehicleData(normalizedVehicleData);
      
      // Process photo URLs
      const photos = extractPhotoUrls(response);
      setPhotoURLs(photos);
      
      // Update edited data too
      setEditedData({
        expected_price: normalizedVehicleData.vehicle?.price || normalizedVehicleData.vehicle?.expected_price || '',
        description: normalizedVehicleData.vehicle?.description || '',
        is_price_negotiable: normalizedVehicleData.is_price_negotiable || false,
        contact_number: normalizedVehicleData.contact_number || '',
        pickup_address: normalizedVehicleData.pickup_address || '',
      });
      
      // Save fresh data to sessionStorage again for extra safety
      // This ensures any previous modifications are preserved
      try {
        const sessionData = sessionStorage.getItem(`vehicle_summary_${id}`);
        let newStorageData;
        
        if (sessionData) {
          const parsedData = JSON.parse(sessionData);
          
          // Merge data, giving priority to new data
          newStorageData = {
            ...parsedData,
            ...normalizedVehicleData,
            // Make sure vehicle data is merged properly too
            vehicle: {
              ...(parsedData.vehicle || {}),
              ...normalizedVehicleData.vehicle
            },
            // Preserve status data
            status: statusData?.status || normalizedVehicleData.status,
            status_display: statusData?.status_display || parsedData.status_display,
            status_title: statusData?.title || parsedData.status_title,
            status_message: statusData?.message || parsedData.status_message,
            updated_at: statusData?.updated_at || new Date().toISOString()
          };
        } else {
          // Create new data structure if no existing data
          newStorageData = {
            ...normalizedVehicleData,
            status: statusData?.status || normalizedVehicleData.status,
            status_display: statusData?.status_display || '',
            status_title: statusData?.title || '',
            status_message: statusData?.message || '',
            updated_at: statusData?.updated_at || new Date().toISOString()
          };
        }
        
        // Add photo URLs to the storage data
        newStorageData.photo_urls = Object.entries(photos).reduce((acc, [key, url]) => {
          if (isValidImageUrl(url)) {
            acc[key] = url;
          }
          return acc;
        }, {} as Record<string, string>);
        
        // Save to sessionStorage
        sessionStorage.setItem(`vehicle_summary_${id}`, JSON.stringify(newStorageData));
        console.log('Updated sessionStorage after refresh');
      } catch (e) {
        console.error('Error updating sessionStorage after refresh:', e);
      }
      
      toast.dismiss(loadingToast);
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error doing full refresh:', error);
      toast.error('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
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
              onClick={() => window.location.reload()}
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
  const vehicle = vehicleData?.vehicle || {};
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
                    <SafeImage 
                      src={photoURLs.front} 
                      alt={`${vehicle.brand} ${vehicle.model}`} 
                      className="w-full h-full object-cover" 
                      sessionStorageKey={`vehicle_summary_${id}`}
                      imageKey="front"
                      vehicleId={id}
                      fetchFromBackend={true}
                      fallbackComponent={<Bike className="h-16 w-16 text-gray-400" />}
                    />
                  </div>
                  
                  {/* Photo gallery */}
                  {Object.keys(photoURLs).length > 1 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {Object.entries(photoURLs)
                        .filter(([key, _]) => key !== 'front')
                        .slice(0, 4)
                        .map(([key, url]) => (
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
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 sm:mb-0">
                      {vehicle.brand || 'Unknown'} {vehicle.model || ''} {vehicle.year || ''}
                    </h3>
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 text-[#FF5733] mr-1" />
                      <div className="ml-1">
                        <p className="text-xs text-gray-500">Expected Price</p>
                        <span className="text-[#FF5733] font-medium text-lg">
                          ₹{formatPrice(vehicle.price || 0)}
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
                      <p className="font-medium capitalize">{vehicle.condition || 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Driven</p>
                      <p className="font-medium">{vehicle.kms_driven ? `${vehicle.kms_driven} km` : 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mileage</p>
                      <p className="font-medium">
                        {vehicle.Mileage || vehicle.mileage || vehicleData?.vehicle?.Mileage || vehicleData?.vehicle?.mileage || 'Not Available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fuel Type</p>
                      <p className="font-medium capitalize">{vehicle.fuel_type || 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Color</p>
                      <p className="font-medium capitalize">
                        {vehicle.color && vehicle.color !== 'Not Specified' ? vehicle.color : 'Not Available'}
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