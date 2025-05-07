import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Camera, ChevronRight, ChevronLeft, Upload, Tag, 
  FileText, Info, AlertCircle, Check, X, Plus, Trash,
  Bike, Eye, Calendar, DollarSign, Loader,
  Clock
} from 'lucide-react';
import { toast } from 'react-toastify';
import marketplaceService from '../services/marketplaceService';
import { checkUserAuthentication } from '../utils/auth';
import SafeImage from '../components/SafeImage';
import { 
  cleanupBlobUrls, 
  safeRevokeUrl, 
  fileToBase64, 
  filesToBase64,
  safeStoreBase64Image,
  compressBase64Image,
  persistImagesForVehicle
} from '../services/imageUtils';
import { getStatusIcon, getStatusColor, getStatusBadgeColor } from '../utils/statusUtils';
import StatusDisplay from '../components/StatusDisplay';
import LocationInput from '../components/LocationInput';
import persistentStorageService from '../services/persistentStorageService';

const statusDescriptions: { [key: string]: string } = {
  pending: 'Pending Review: Our team will review your listing shortly.',
  inspection_scheduled: 'Inspection Scheduled: We\'ve scheduled an inspection for your vehicle.',
  offer_made: 'Offer Made: We\'ve made an offer for your vehicle.',
  completed: 'Completed: The sale has been completed successfully.',
};

// Helper functions moved outside of component scope
const getVehicleBrand = (vehicle: any) => {
  return vehicle.vehicle?.brand || 
        vehicle.vehicle_details?.brand || 
        vehicle.brand ||
        'Unknown';
};

const getVehicleModel = (vehicle: any) => {
  return vehicle.vehicle?.model || 
        vehicle.vehicle_details?.model || 
        vehicle.model ||
        'Unknown';
};

const getVehicleRegistration = (vehicle: any) => {
  return vehicle.vehicle?.registration_number || 
        vehicle.vehicle_details?.registration_number || 
        vehicle.registration_number ||
        'N/A';
};

const getVehicleCondition = (vehicle: any) => {
  // Add extremely detailed logging to diagnose the condition value source
  console.log('DETAILED CONDITION DEBUG for vehicle:', {
    id: vehicle.id,
    directCondition: vehicle.condition,
    vehicleCondition: vehicle.vehicle?.condition,
    detailsCondition: vehicle.vehicle_details?.condition,
    summaryCondition: vehicle.summary?.condition,
    allProps: Object.keys(vehicle),
    hasVehicle: !!vehicle.vehicle,
    hasVehicleDetails: !!vehicle.vehicle_details,
    hasSummary: !!vehicle.summary
  });
  
  // Get raw condition value from all possible sources
  const rawCondition = vehicle.condition || 
        vehicle.vehicle?.condition || 
        vehicle.vehicle_details?.condition ||
        vehicle.summary?.condition;
  
  console.log(`Raw condition value for vehicle ${vehicle.id}:`, rawCondition);
  
  // If we have a condition value, properly capitalize it
  if (rawCondition && typeof rawCondition === 'string') {
    // Convert to lowercase first then capitalize first letter
    const formatted = rawCondition.toLowerCase();
    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    console.log(`Formatted condition: "${rawCondition}" -> "${capitalized}"`);
    return capitalized;
  }
  
  // Default fallback
  return 'Good';
};

// Get the expected price with fallbacks
const getExpectedPrice = (vehicle: any) => {
  // Check all possible locations for expected price
  return vehicle.vehicle?.expected_price || 
         vehicle.vehicle?.price || 
         vehicle.expected_price || 
         vehicle.price || 
         vehicle.vehicle_details?.expected_price ||
         vehicle.vehicle_details?.price ||
         0;
};

// PreviousVehicles component to display user's previous vehicle submissions
const PreviousVehicles = ({ onClose }: { onClose: () => void }): JSX.Element => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleStatuses, setVehicleStatuses] = useState<{[key: string]: {status: string, status_display?: string, title?: string, message: string}}>({});

  // Add polling interval for status updates
  useEffect(() => {
    // Fetch vehicles initially
    fetchVehicles();
    
    // Set up polling for status updates every 30 seconds
    const statusPollInterval = setInterval(() => {
      refreshVehicleStatuses();
    }, 30000); // 30 seconds
    
    // Clean up interval when component unmounts
    return () => {
      clearInterval(statusPollInterval);
    };
  }, []);

  // Fetch sell requests and their status information
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const sellRequests = await marketplaceService.getSellRequests();
      console.log('Retrieved sell requests:', sellRequests);
      
      // CRITICAL FIX: Sync with vehicle summary data to get latest condition values
      const enhancedSellRequests = await Promise.all(sellRequests.map(async (request: any) => {
        try {
          // Try to get the latest data from sessionStorage first (fastest)
          const sessionData = sessionStorage.getItem(`vehicle_summary_${request.id}`);
          if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            console.log(`Found session data for vehicle ${request.id}:`, parsedData);
            
            // Get the condition from vehicle_summary data
            const condition = parsedData.vehicle?.condition || 
                             parsedData.vehicle_details?.condition || 
                             parsedData.condition;
                             
            if (condition && condition !== 'Not Available') {
              console.log(`Updating condition for vehicle ${request.id} to: ${condition}`);
              
              // Create a deep copy to avoid mutating the original
              const enhancedRequest = JSON.parse(JSON.stringify(request));
              
              // Set the condition in all possible locations
              enhancedRequest.condition = condition;
              if (enhancedRequest.vehicle) {
                enhancedRequest.vehicle.condition = condition;
              }
              if (enhancedRequest.vehicle_details) {
                enhancedRequest.vehicle_details.condition = condition;
              }
              
              return enhancedRequest;
            }
          }
          
          // If no session data, try persistent storage
          const persistentData = await persistentStorageService.getVehicleData(request.id);
          if (persistentData) {
            const condition = persistentData.vehicle?.condition || 
                             persistentData.vehicle_details?.condition || 
                             persistentData.condition;
                             
            if (condition && condition !== 'Not Available') {
              console.log(`Updating condition for vehicle ${request.id} to: ${condition} (from persistent storage)`);
              
              // Create a deep copy
              const enhancedRequest = JSON.parse(JSON.stringify(request));
              
              // Set the condition in all possible locations
              enhancedRequest.condition = condition;
              if (enhancedRequest.vehicle) {
                enhancedRequest.vehicle.condition = condition;
              }
              if (enhancedRequest.vehicle_details) {
                enhancedRequest.vehicle_details.condition = condition;
              }
              
              return enhancedRequest;
            }
          }
        } catch (e) {
          console.error(`Error enhancing vehicle ${request.id}:`, e);
        }
        
        return request;
      }));
      
      setVehicles(enhancedSellRequests);
      
      // Fetch status information for each sell request
      await refreshVehicleStatuses(enhancedSellRequests);
    } catch (fetchError) {
      console.error('Error fetching vehicles:', fetchError);
      toast.error('Failed to load your vehicles');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh just the status information without reloading vehicles
  const refreshVehicleStatuses = async (sellRequestsData?: any[]) => {
    try {
      // Use provided sell requests or the current state
      const sellRequests = sellRequestsData || vehicles;
      
      if (sellRequests.length === 0) return;
      
      // Fetch status information for each sell request
      const statusPromises = sellRequests.map((request: any) => 
        marketplaceService.getSellRequestStatus(request.id)
          .then(statusInfo => ({
            id: request.id,
            statusInfo
          }))
          .catch(() => ({
            id: request.id,
            statusInfo: { 
              status: request.status, 
              message: 'Status information unavailable'
            }
          }))
      );
      
      const statuses = await Promise.all(statusPromises);
      
      // Create a map of id to status info
      const statusMap = statuses.reduce((acc: {[key: string]: any}, { id, statusInfo }: {id: string, statusInfo: any}) => {
        acc[id] = statusInfo;
        return acc;
      }, {});
      
      setVehicleStatuses(statusMap);
    } catch (error) {
      console.error('Error refreshing vehicle statuses:', error);
    }
  };

  const formatPrice = (price: string | number) => {
    return Number(price).toLocaleString('en-IN');
  };
  
  // Get the status with proper display value
  const getStatusDisplay = (vehicle: any, id: string) => {
    // First check if we have status from the status info
    if (vehicleStatuses[id]?.title) {
      return vehicleStatuses[id].title;
    }
    
    if (vehicleStatuses[id]?.status_display) {
      return vehicleStatuses[id].status_display;
    }
    
    // Fallback to vehicle status
    return vehicle.status === 'sale_vehicle' ? 'For Sale' : vehicle.status;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Your Previous Vehicles</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader className="w-8 h-8 animate-spin text-[#FF5733]" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't listed any vehicles yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {vehicles.map(vehicle => {
              const status = vehicle.status;
              const expectedPrice = getExpectedPrice(vehicle);
              return (
                <div key={vehicle.id} className="border rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                  <div className="flex">
                    <div className="flex-shrink-0 mr-5">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 shadow-sm ${getStatusColor(status)}`}>
                        {vehicle.vehicle?.photo_front ? (
                          <SafeImage 
                            src={vehicle.vehicle.photo_front} 
                            alt={`${vehicle.vehicle?.brand} ${vehicle.vehicle?.model}`}
                            className="w-16 h-16 rounded-full object-cover"
                            fallbackComponent={
                              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100">
                                {getStatusIcon(status)}
                              </div>
                            }
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100">
                            {getStatusIcon(status)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-semibold text-gray-800 text-lg">
                          {getVehicleBrand(vehicle)} {getVehicleModel(vehicle)} {vehicle.vehicle?.year || vehicle.vehicle_details?.year || vehicle.year}
                        </h4>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusBadgeColor(status)}`}>
                          {getStatusDisplay(vehicle, vehicle.id)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 text-sm mb-3">
                        <div className="flex items-center text-gray-600">
                          <Tag className="w-4 h-4 mr-1 text-[#FF5733]" />
                          <span className="font-medium">Registration: </span>
                          <span className="ml-1">
                            {getVehicleRegistration(vehicle)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-1 text-[#FF5733]" />
                          <span className="font-medium">Listed: </span>
                          <span className="ml-1">{new Date(vehicle.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 text-sm mb-3">
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium">Condition: </span>
                          <span className="ml-1 capitalize">
                            {/* Add debug title to show all condition sources */}
                            <span title={`Sources: direct=${vehicle.condition}, vehicle=${vehicle.vehicle?.condition}, details=${vehicle.vehicle_details?.condition}`}>
                              {getVehicleCondition(vehicle)}
                            </span>
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {vehicleStatuses[vehicle.id]?.message || 'Status loading...'}
                      </p>
                      
                      <div className="flex justify-between items-center pt-3 border-t">
                        <div className="flex items-baseline">
                          <span className="text-sm text-gray-500 mr-2">Expected Price:</span>
                          <span className="font-bold text-lg text-[#FF5733]">₹{formatPrice(expectedPrice)}</span>
                        </div>
                        
                        <Link 
                          to={`/sell-vehicle/${vehicle.id}/summary`}
                          className="flex items-center bg-[#FF5733] text-white px-3 py-1.5 rounded-md hover:bg-[#ff4019] transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface VehicleFormData {
  type: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  registrationNumber: string;
  kmsDriven: string;
  mileage: string; // Added Mileage field
  condition: string;
  expectedPrice: string;
  description: string;
  fuelType: string;
  engineCapacity: string;
  lastServiceDate: string;
  insuranceValidTill: string;
  contactNumber: string;
  pickupAddress: string;
  pickupSlot?: string;
  features: string[];
  highlights: string[];
  isPriceNegotiable: boolean;
  sellerNotes: string;
  hasPucCertificate: boolean;
  emiAvailable: boolean;
}

// LocalStorage key for form data
const FORM_STORAGE_KEY = 'sell_vehicle_form_data';
const PHOTOS_STORAGE_KEY = 'sell_vehicle_photos_preview';
const DOCUMENTS_STORAGE_KEY = 'sell_vehicle_documents_preview';

const SellVehicle = () => {
  const navigate = useNavigate();
  
  // Calculate tomorrow's date for default pickup
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0); // Default to 10:00 AM
  
  // Remove defaultPickupDate and defaultPickupTime
  
  // Get saved form data from localStorage or use defaults
  const getSavedFormData = (): VehicleFormData => {
    const savedData = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
    
    // Return default values if no saved data exists
    return {
      type: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      registrationNumber: '',
      kmsDriven: '',
      mileage: '',
      condition: '',
      expectedPrice: '',
      description: '',
      fuelType: 'petrol',
      engineCapacity: '',
      lastServiceDate: '',
      insuranceValidTill: '',
      contactNumber: localStorage.getItem('userPhone') || '',
      pickupAddress: localStorage.getItem('userAddress') || '',
      features: [],
      highlights: [],
      isPriceNegotiable: true,
      sellerNotes: '',
      hasPucCertificate: false,
      emiAvailable: false
    };
  };
  
  const [formData, setFormData] = useState<VehicleFormData>(getSavedFormData());

  const [photos, setPhotos] = useState<{
    front: File | null;
    back: File | null;
    left: File | null;
    right: File | null;
    dashboard: File | null;
    odometer: File | null;
    engine: File | null;
    extras: File | null;
  }>({
    front: null,
    back: null,
    left: null,
    right: null,
    dashboard: null,
    odometer: null,
    engine: null,
    extras: null
  });

  const [documents, setDocuments] = useState<{
    rc: File | null;
    insurance: File | null;
    puc: File | null;
    transfer: File | null;
    additional: File | null;
  }>({
    rc: null,
    insurance: null,
    puc: null,
    transfer: null,
    additional: null
  });

  // Get saved photo URLs from localStorage
  const getSavedPhotoURLs = () => {
    const savedURLs = localStorage.getItem(PHOTOS_STORAGE_KEY);
    if (savedURLs) {
      try {
        return JSON.parse(savedURLs);
      } catch (e) {
        console.error('Error parsing saved photo URLs:', e);
      }
    }
    return {};
  };
  
  // Get saved document URLs from localStorage
  const getSavedDocumentURLs = () => {
    const savedURLs = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (savedURLs) {
      try {
        return JSON.parse(savedURLs);
      } catch (e) {
        console.error('Error parsing saved document URLs:', e);
      }
    }
    return {};
  };

  const [photoURLs, setPhotoURLs] = useState<{
    [key: string]: string;
  }>(getSavedPhotoURLs());

  const [documentURLs, setDocumentURLs] = useState<{
    [key: string]: string;
  }>(getSavedDocumentURLs());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [showPreviousVehicles, setShowPreviousVehicles] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [photoErrors, setPhotoErrors] = useState<string | null>(null);
  const [documentErrors, setDocumentErrors] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Add state for previous vehicles
  const [hasPreviousVehicles, setHasPreviousVehicles] = useState(false);
  
  // Add state to track if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);
  
  // Save photo URLs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photoURLs));
  }, [photoURLs]);
  
  // Save document URLs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documentURLs));
  }, [documentURLs]);

  // Check if user has previous vehicles on component mount
  useEffect(() => {
    const checkPreviousVehicles = async () => {
      if (checkUserAuthentication()) {
        try {
          const response = await marketplaceService.getUserSellRequests();
          setHasPreviousVehicles(Array.isArray(response) && response.length > 0);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Error checking previous vehicles:', err);
        }
      } else {
        setIsAuthenticated(false);
      }
    };
    
    checkPreviousVehicles();
  }, []);
  
  // Check authentication when component mounts
  useEffect(() => {
    const authenticated = checkUserAuthentication();
    setIsAuthenticated(authenticated);
    
    if (!authenticated) {
      toast.error('You must be logged in to sell a vehicle', {
        position: 'top-right',
        autoClose: 5000
      });
    // Redirect to login page after a short delay
    setTimeout(() => {
      navigate('/login-signup', { state: { redirectTo: '/sell-vehicle' } });
    }, 2000);
    }
  }, [navigate]);

  // Pre-populated options
  const vehicleTypes = ['Bike', 'Scooter', 'Electric Bike', 'Electric Scooter'];
  const popularBrands = ['Hero', 'Honda', 'Bajaj', 'TVS', 'Royal Enfield', 'Yamaha', 'Suzuki', 'KTM', 'Jawa', 'Other'];
  const vehicleConditions = ['Excellent', 'Good', 'Fair', 'Needs Repair'];
  const colorOptions = ['Black', 'Blue', 'Red', 'White', 'Silver', 'Green', 'Yellow', 'Orange', 'Brown', 'Grey', 'Other'];
  const fuelTypes = ['Petrol', 'Electric'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, view: keyof typeof photos) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // If we already have a URL for this view, revoke it
      if (photoURLs[view]) {
        safeRevokeUrl(photoURLs[view]);
      }

      // Update the file state
      setPhotos(prev => ({
        ...prev,
        [view]: file
      }));

      try {
        // Convert to base64 for storage
        const base64 = await fileToBase64(file);
        
        // Store blob URL for UI
        const blobUrl = URL.createObjectURL(file);
        setPhotoURLs(prev => ({
          ...prev,
          [view]: blobUrl
        }));
        
        // Compress and store base64 in localStorage for persistence
        // Use a smaller size (0.5MB) for photos to ensure they fit in storage
        await safeStoreBase64Image('sell_vehicle_photos_base64', view, base64, 0.5);
      } catch (error) {
        console.error(`Error processing photo for ${view}:`, error);
        toast.error(`Failed to process the image. Please try again with a different image.`);
      }
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: keyof typeof documents) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // If we already have a URL for this document, revoke it
      if (documentURLs[docType]) {
        safeRevokeUrl(documentURLs[docType]);
      }

      // Update the file state
      setDocuments(prev => ({
        ...prev,
        [docType]: file
      }));
      
      try {
        // Convert to base64 for storage
        const base64 = await fileToBase64(file);
        
        // Create blob URL for UI
        const blobUrl = URL.createObjectURL(file);
        setDocumentURLs(prev => ({
          ...prev,
          [docType]: blobUrl
        }));
        
        // Safely store the document with compression if it's an image
        if (file.type.startsWith('image/')) {
          await safeStoreBase64Image('sell_vehicle_docs_base64', docType, base64, 0.5);
        } else {
          // For non-image files, just store as is (or skip if too large)
          const base64Docs = JSON.parse(localStorage.getItem('sell_vehicle_docs_base64') || '{}');
          base64Docs[docType] = base64;
          localStorage.setItem('sell_vehicle_docs_base64', JSON.stringify(base64Docs));
        }
      } catch (error) {
        console.error(`Error processing document for ${docType}:`, error);
        toast.error(`Failed to process the document. Please try again with a different file.`);
      }
    }
  };

  // Add feature handling
  const addFeature = (feature: string) => {
    if (feature && !formData.features.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  // Add highlight handling
  const addHighlight = (highlight: string) => {
    if (highlight && !formData.highlights.includes(highlight)) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, highlight]
      }));
    }
  };

  const removeHighlight = (highlight: string) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter(h => h !== highlight)
    }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    // Basic validation for required fields
    if (!formData.type) errors.type = 'Vehicle type is required';
    if (!formData.brand) errors.brand = 'Brand is required';
    if (!formData.model) errors.model = 'Model is required';
    if (!formData.year) errors.year = 'Year is required';
    if (!formData.registrationNumber) errors.registrationNumber = 'Registration number is required';
    if (!formData.kmsDriven) errors.kmsDriven = 'Kilometers driven is required';
    if (!formData.fuelType) errors.fuelType = 'Fuel type is required';
    if (!formData.color) errors.color = 'Color is required';
    if (!formData.expectedPrice) errors.expectedPrice = 'Expected price is required';
    if (!formData.contactNumber) errors.contactNumber = 'Contact number is required';
    if (!formData.pickupAddress) errors.pickupAddress = 'Pickup address is required';
    
    // Format validation
    if (formData.registrationNumber && !/^[A-Za-z0-9\s-]+$/.test(formData.registrationNumber)) {
      errors.registrationNumber = 'Invalid registration number format';
    }
    
    if (formData.contactNumber && !/^[0-9+\s-]{10,15}$/.test(formData.contactNumber)) {
      errors.contactNumber = 'Contact number should be 10-15 digits';
    }
    
    if (formData.expectedPrice && isNaN(Number(formData.expectedPrice))) {
      errors.expectedPrice = 'Expected price must be a number';
    }
    
    // Validate year is not greater than current year
    const currentYear = new Date().getFullYear();
    if (formData.year) {
      const year = parseInt(formData.year);
      if (isNaN(year)) {
        errors.year = 'Year must be a valid number';
      } else if (year > currentYear) {
        errors.year = `Year cannot be greater than current year (${currentYear})`;
      } else if (year < 1900) {
        errors.year = 'Year must be 1900 or later';
      }
    }
    
    setFormErrors(errors);
    return errors;
  };

  // Validate photo uploads
  const validatePhotos = (): string | null => {
    // Check if required photos are uploaded
    const requiredViews = ['front', 'back', 'left', 'right'];
    const missingViews = requiredViews.filter(view => !photos[view as keyof typeof photos]);
    
    if (missingViews.length > 0) {
      const viewNames = missingViews.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
      setPhotoErrors(`Missing required photos: ${viewNames}`);
      return `Missing required photos: ${viewNames}`;
    }
    
    setPhotoErrors(null);
    return null;
  };
  
  // Validate document uploads
  const validateDocuments = (): string | null => {
    // Check if required documents are uploaded
    const requiredDocs = ['rc', 'insurance'];
    const missingDocs = requiredDocs.filter(doc => !documents[doc as keyof typeof documents]);
    
    if (missingDocs.length > 0) {
      const docNames = missingDocs.map(d => {
        if (d === 'rc') return 'Registration Certificate';
        if (d === 'insurance') return 'Insurance Document';
        return d.charAt(0).toUpperCase() + d.slice(1);
      }).join(', ');
      
      setDocumentErrors(`Missing required documents: ${docNames}`);
      return `Missing required documents: ${docNames}`;
    }
    
    setDocumentErrors(null);
    return null;
  };

  const handleNextStep = () => {
    if (step === 1) {
      const errors = validateForm();
      if (Object.keys(errors).length === 0) {
        setStep(2);
        window.scrollTo(0, 0);
      } else {
        setFormErrors(errors);
        toast.error('Please fix the errors in the form');
      }
    } else if (step === 2) {
      const photoErrorMessage = validatePhotos();
      const documentErrorMessage = validateDocuments();
      
      if (!photoErrorMessage && !documentErrorMessage) {
        const syntheticEvent = {
          preventDefault: () => {},
        } as React.FormEvent;
        handleSubmit(syntheticEvent); // Pass a synthetic event
      } else {
        if (photoErrorMessage) {
          toast.error(photoErrorMessage);
        }
        if (documentErrorMessage) {
          toast.error(documentErrorMessage);
        }
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
    setStep(1);
    }
    window.scrollTo(0, 0);
  };

  // Format date for API
  const formatDateForBackend = (dateString: string): string => {
    if (!dateString) return '';
    
    // Format as YYYY-MM-DD for the backend API
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check user authentication
    const isAuthenticated = await checkUserAuthentication();
    if (!isAuthenticated) {
      toast.error('Please log in to submit your vehicle');
      navigate('/login-signup', { state: { redirectTo: '/sell-vehicle' } });
      return;
    }

    // Validate form data
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the errors in the form');
      return;
    }
    
    // Validate required photos
    const photoErrors = validatePhotos();
    if (photoErrors) {
      toast.error(photoErrors);
      return;
    }
    
    // Validate required documents
    const documentErrors = validateDocuments();
    if (documentErrors) {
      toast.error(documentErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Store expected price in session storage
      try {
        sessionStorage.setItem('vehicle_expected_price', formData.expectedPrice);
        console.log('Expected price saved to session storage:', formData.expectedPrice);
      } catch (storageError) {
        console.error('Failed to save expected price to session storage:', storageError);
      }
      
      // Create vehicle payload
      const vehiclePayload = {
        vehicle_type: formData.type,
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        color: formData.color,
        registration_number: formData.registrationNumber.toUpperCase(),
        kms_driven: parseInt(formData.kmsDriven),
        Mileage: formData.mileage,
        engine_capacity: formData.engineCapacity ? parseInt(formData.engineCapacity) : null,
        condition: formData.condition,
        fuel_type: formData.fuelType,
        price: parseInt(formData.expectedPrice),
        expected_price: parseInt(formData.expectedPrice),
        emi_available: formData.emiAvailable,
        features: formData.features,
        highlights: formData.highlights,
        last_service_date: formData.lastServiceDate ? formatDateForBackend(formData.lastServiceDate) : null,
        insurance_valid_till: formData.insuranceValidTill ? formatDateForBackend(formData.insuranceValidTill) : null,
      };
      
      // Create document and photo FormData
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('vehicle', JSON.stringify(vehiclePayload));
      
      // Append photos
      Object.entries(photos).forEach(([key, file]) => {
        if (file) {
          formDataToSubmit.append(`photo_${key}`, file);
        }
      });
      
      // Append documents
      Object.entries(documents).forEach(([key, file]) => {
        if (file) {
          formDataToSubmit.append(`document_${key}`, file);
        }
      });
      
      // Submit to backend API
      const response = await marketplaceService.submitVehicle(
        // First argument: formData
        {
          type: formData.type,
          brand: formData.brand,
          model: formData.model,
          year: formData.year,
          color: formData.color,
          registrationNumber: formData.registrationNumber,
          kmsDriven: formData.kmsDriven,
          mileage: formData.mileage,
          engineCapacity: formData.engineCapacity,
          condition: formData.condition,
          fuelType: formData.fuelType,
          expectedPrice: formData.expectedPrice,
          emiAvailable: formData.emiAvailable,
          features: formData.features,
          highlights: formData.highlights,
          lastServiceDate: formData.lastServiceDate,
          insuranceValidTill: formData.insuranceValidTill,
          contactNumber: formData.contactNumber,
          pickupAddress: formData.pickupAddress,
          sellerNotes: formData.sellerNotes,
          isPriceNegotiable: formData.isPriceNegotiable,
          hasPucCertificate: formData.hasPucCertificate
        },
        // Second argument: photos
        photos,
        // Third argument: documents
        documents
      );
      
      // CRITICAL IMPROVEMENT: Save response data directly to sessionStorage for immediate access
      try {
        // Use the enrichVehicleData function to ensure consistent data structure
        const enrichedData = marketplaceService.enrichVehicleData(response);
        
        // Save directly to session storage with the proper key for immediate access
        sessionStorage.setItem(`vehicle_summary_${response.id}`, JSON.stringify(enrichedData));
        console.log('Saved vehicle data to sessionStorage after submission:', response.id);
        
        // Also save to persistent storage if available
        await persistentStorageService.saveVehicleData(response.id, enrichedData);
        
        // Save to vehicle history
        // await persistentStorageService.addToVehicleHistory(response.id.toString(), {
        //   brand: formData.brand,
        //   model: formData.model,
        //   year: formData.year,
        //   registration_number: formData.registrationNumber,
        //   price: formData.expectedPrice,
        //   thumbnail: photoURLs.front || null
        // });
      } catch (storageError) {
        console.error('Error saving submission data to storage:', storageError);
        // Non-fatal error, just log it
      }
      
      toast.success('Your vehicle has been submitted successfully!', {
          position: 'top-right',
          autoClose: 5000
        });
      
      // Clean up blobs to prevent memory leaks
      cleanupBlobUrls(photoURLs);
      cleanupBlobUrls(documentURLs);
      
      // Redirect to the submission confirmation page
      navigate(`/sell-vehicle/${response.id}/summary`);
    } catch (error: any) {
      console.error('Error submitting vehicle:', error);
      setSubmitError(error.message || 'An error occurred while submitting your vehicle');
      
      // If network error, try to save locally
      if (error.message?.includes('network') || error.message?.includes('connection')) {
        toast.warning(
          <div>
            <strong>Connection issue detected.</strong>
            <p className="mt-1">Would you like to retry submission?</p>
            <div className="mt-2 flex justify-end space-x-2">
              <button 
                className="px-4 py-1 bg-gray-200 rounded"
                onClick={() => toast.dismiss()}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 bg-[#FF5733] text-white rounded"
                onClick={async () => {
                  toast.dismiss();
                  
                  // Show loading toast
                  const loadingToastId = toast.loading("Retrying submission...");
                  
                  try {
                    // Retry submission
                    const retryResponse = await marketplaceService.submitVehicle(
                      {
                        type: formData.type,
                        brand: formData.brand,
                        model: formData.model,
                        year: formData.year,
                        color: formData.color,
                        registrationNumber: formData.registrationNumber,
                        kmsDriven: formData.kmsDriven,
                        mileage: formData.mileage,
                        engineCapacity: formData.engineCapacity,
                        condition: formData.condition,
                        fuelType: formData.fuelType,
                        expectedPrice: formData.expectedPrice,
                        emiAvailable: formData.emiAvailable,
                        features: formData.features,
                        highlights: formData.highlights,
                        lastServiceDate: formData.lastServiceDate,
                        insuranceValidTill: formData.insuranceValidTill,
                        contactNumber: formData.contactNumber,
                        pickupAddress: formData.pickupAddress,
                        sellerNotes: formData.sellerNotes,
                        isPriceNegotiable: formData.isPriceNegotiable,
                        hasPucCertificate: formData.hasPucCertificate
                      },
                      photos,
                      documents
                    );
                    
                    // Close loading toast
                    toast.dismiss(loadingToastId);
                    
                    // Success toast
                    toast.success('Vehicle submitted successfully!');
                    
                    // Save data to storage
                    if (retryResponse && retryResponse.id) {
                      try {
                        const enrichedData = marketplaceService.enrichVehicleData(retryResponse);
                        sessionStorage.setItem(`vehicle_summary_${retryResponse.id}`, JSON.stringify(enrichedData));
                        await persistentStorageService.saveVehicleData(retryResponse.id, enrichedData);
                        
                        // Add to history
                        // await persistentStorageService.addToVehicleHistory(
                        //   String(retryResponse.id), 
                        //   {
                        //     brand: formData.brand,
                        //     model: formData.model,
                        //     year: formData.year,
                        //     registration_number: formData.registrationNumber,
                        //     price: formData.expectedPrice,
                        //     thumbnail: photoURLs.front || null
                        //   }
                        // );
                      } catch (storageError) {
                        console.error('Error saving to storage:', storageError);
                        // Non-fatal error
                      }
                      
                      // Redirect to summary page
                      navigate(`/sell-vehicle/${retryResponse.id}/summary`);
                    }
                  } catch (retryError) {
                    // Close loading toast
                    toast.dismiss(loadingToastId);
                    
                    // Show error toast
                    toast.error('Failed to submit vehicle. Please try again later.');
                    console.error('Retry submission failed:', retryError);
                  }
                }}
              >
                Retry
              </button>
            </div>
          </div>,
          {
            position: 'top-right',
            autoClose: false,
            closeOnClick: false
          }
        );
      } else {
        toast.error(`Submission failed: ${error.message || 'Unknown error'}`, {
          position: 'top-right',
          autoClose: 5000
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up photo URLs
      cleanupBlobUrls(photoURLs);
      
      // Clean up document URLs
      cleanupBlobUrls(documentURLs);
    };
  }, [photoURLs, documentURLs]);

  // Add this helper function for formatting the values in summary
  const formatSummaryValue = (key: string, value: any): string => {
    if (!value) return 'Not provided';
    
    switch (key) {
      case 'expectedPrice':
        return `₹${parseInt(value).toLocaleString('en-IN')}`;
      case 'lastServiceDate':
      case 'insuranceValidTill':
        return new Date(value).toLocaleDateString();
      case 'isPriceNegotiable':
      case 'hasPucCertificate':
      case 'emiAvailable':
        return value ? 'Yes' : 'No';
      case 'features':
      case 'highlights':
        return Array.isArray(value) && value.length > 0 
          ? value.join(', ') 
          : 'None';
      default:
        return String(value);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sell Your Vehicle</h1>
          <p className="mt-2 text-lg text-gray-600">
            Get the best price for your two-wheeler in just a few easy steps
          </p>
        </div>

        {isAuthenticated && hasPreviousVehicles && showPreviousVehicles && (
          <PreviousVehicles onClose={() => setShowPreviousVehicles(false)} />
        )}
        
        {isAuthenticated && hasPreviousVehicles && !showPreviousVehicles && (
          <div className="mb-6">
            <button
              onClick={() => setShowPreviousVehicles(true)}
              className="text-[#FF5733] hover:text-[#ff4019] flex items-center font-medium"
            >
              <Bike className="w-5 h-5 mr-1" />
              Show my previous vehicles
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}

        {/* Show debug information if available - for development only */}
        {debugInfo && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg overflow-auto">
            <h3 className="text-red-800 font-medium mb-2">Debug Information (API Error):</h3>
            <pre className="text-xs text-red-700 whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF5733] to-[#ff7a5c] p-8 text-white">
            <h1 className="text-3xl font-bold">Sell Your Vehicle</h1>
            <p className="mt-2 text-white text-opacity-80">
              Fill out the details below to list your vehicle for sale
            </p>
            
            {/* Progress Steps */}
            <div className="mt-8 flex items-center">
              <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step >= 1 ? 'bg-white text-[#FF5733]' : 'bg-white bg-opacity-30 text-white'} font-semibold`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-white' : 'bg-white bg-opacity-30'}`}></div>
              <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step >= 2 ? 'bg-white text-[#FF5733]' : 'bg-white bg-opacity-30 text-white'} font-semibold`}>
                2
              </div>
            </div>
            <div className="mt-2 flex justify-between text-sm text-white text-opacity-80">
              <span>Vehicle Details</span>
              <span>Upload Photos</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="p-8">
                <div className="space-y-8">
                  {/* Vehicle Details Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type <span className="text-red-500">*</span></label>
                      <select
                        id="type"
                        name="type"
                        required
                        className={`block w-full rounded-lg border ${formErrors.type ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                        value={formData.type}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Type</option>
                        {vehicleTypes.map(type => (
                          <option key={type} value={type.toLowerCase().replace(' ', '_')}>{type}</option>
                        ))}
                      </select>
                      {formErrors.type && <p className="mt-1 text-sm text-red-500">{formErrors.type}</p>}
                    </div>

                    <div>
                      <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand <span className="text-red-500">*</span></label>
                      <select
                        id="brand"
                        name="brand"
                        required
                        className={`block w-full rounded-lg border ${formErrors.brand ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                        value={formData.brand}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Brand</option>
                        {popularBrands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                      {formErrors.brand && <p className="mt-1 text-sm text-red-500">{formErrors.brand}</p>}
                    </div>

                    <div>
                      <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        id="model"
                        name="model"
                        required
                        className={`block w-full rounded-lg border ${formErrors.model ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                        value={formData.model}
                        onChange={handleInputChange}
                        placeholder="e.g. Splendor Plus"
                      />
                      {formErrors.model && <p className="mt-1 text-sm text-red-500">{formErrors.model}</p>}
                    </div>

                    <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        id="year"
                        name="year"
                        required
                        min="1900"
                        max={new Date().getFullYear()}
                        className={`block w-full rounded-lg border ${formErrors.year ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                        value={formData.year}
                        onChange={handleInputChange}
                        placeholder={`e.g. ${new Date().getFullYear() - 2}`}
                      />
                      {formErrors.year && <p className="mt-1 text-sm text-red-500">{formErrors.year}</p>}
                    </div>

                    <div>
                      <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <select
                        id="color"
                        name="color"
                        className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3"
                        value={formData.color}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Color</option>
                        {colorOptions.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">Registration Number <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        id="registrationNumber"
                        name="registrationNumber"
                        required
                        className={`block w-full rounded-lg border ${formErrors.registrationNumber ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. DL5SAB1234"
                      />
                      {formErrors.registrationNumber && <p className="mt-1 text-sm text-red-500">{formErrors.registrationNumber}</p>}
                    </div>

                    <div>
                      <label htmlFor="kmsDriven" className="block text-sm font-medium text-gray-700 mb-1">Kilometers Driven <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        id="kmsDriven"
                        name="kmsDriven"
                        required
                        min="0"
                        className={`block w-full rounded-lg border ${formErrors.kmsDriven ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                        value={formData.kmsDriven}
                        onChange={handleInputChange}
                        placeholder="e.g. 5000"
                      />
                      {formErrors.kmsDriven && <p className="mt-1 text-sm text-red-500">{formErrors.kmsDriven}</p>}
                    </div>

                    <div>
                      <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">Mileage <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        id="mileage"
                        name="mileage"
                        required
                        className={`block w-full rounded-lg border ${formErrors.mileage ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                        value={formData.mileage}
                        onChange={handleInputChange}
                        placeholder="e.g. 40 km/l"
                      />
                      {formErrors.mileage && <p className="mt-1 text-sm text-red-500">{formErrors.mileage}</p>}
                    </div>

                    <div>
                      <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Vehicle Condition <span className="text-red-500">*</span></label>
                      <select
                        id="condition"
                        name="condition"
                        required
                        className={`block w-full rounded-lg border ${formErrors.condition ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                        value={formData.condition}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Condition</option>
                        {vehicleConditions.map(condition => (
                          <option key={condition} value={condition.toLowerCase()}>{condition}</option>
                        ))}
                      </select>
                      {formErrors.condition && <p className="mt-1 text-sm text-red-500">{formErrors.condition}</p>}
                    </div>

                    <div>
                      <label htmlFor="expectedPrice" className="block text-sm font-medium text-gray-700 mb-1">Expected Price (₹) <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">₹</span>
                        </div>
                        <input
                          type="number"
                          id="expectedPrice"
                          name="expectedPrice"
                          required
                          min="1"
                          className={`block w-full pl-8 rounded-lg border ${formErrors.expectedPrice ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                          value={formData.expectedPrice}
                          onChange={handleInputChange}
                          placeholder="e.g. 50000"
                        />
                      </div>
                      {formErrors.expectedPrice && <p className="mt-1 text-sm text-red-500">{formErrors.expectedPrice}</p>}
                    </div>

                    <div>
                      <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-1">Fuel Type <span className="text-red-500">*</span></label>
                      <select
                        id="fuelType"
                        name="fuelType"
                        required
                        className={`block w-full rounded-lg border ${formErrors.fuelType ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                        value={formData.fuelType}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Fuel Type</option>
                        {fuelTypes.map(type => (
                          <option key={type} value={type.toLowerCase()}>{type}</option>
                        ))}
                      </select>
                      {formErrors.fuelType && <p className="mt-1 text-sm text-red-500">{formErrors.fuelType}</p>}
                    </div>

                    <div>
                      <label htmlFor="engineCapacity" className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.fuelType === 'electric' ? 'Motor Power (Watts)' : 'Engine Capacity (CC)'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="engineCapacity"
                        name="engineCapacity"
                        required
                        min="1"
                        className={`block w-full rounded-lg border ${formErrors.engineCapacity ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                        value={formData.engineCapacity}
                        onChange={handleInputChange}
                        placeholder={formData.fuelType === 'electric' ? 'e.g. 1500' : 'e.g. 150'}
                      />
                      {formErrors.engineCapacity && <p className="mt-1 text-sm text-red-500">{formErrors.engineCapacity}</p>}
                    </div>

                    <div>
                      <label htmlFor="lastServiceDate" className="block text-sm font-medium text-gray-700 mb-1">Last Service Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        id="lastServiceDate"
                        name="lastServiceDate"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        className={`block w-full rounded-lg border ${formErrors.lastServiceDate ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                        value={formData.lastServiceDate}
                        onChange={handleInputChange}
                      />
                      {formErrors.lastServiceDate && <p className="mt-1 text-sm text-red-500">{formErrors.lastServiceDate}</p>}
                    </div>

                    <div>
                      <label htmlFor="insuranceValidTill" className="block text-sm font-medium text-gray-700 mb-1">Insurance Valid Till <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        id="insuranceValidTill"
                        name="insuranceValidTill"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className={`block w-full rounded-lg border ${formErrors.insuranceValidTill ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                        value={formData.insuranceValidTill}
                        onChange={handleInputChange}
                      />
                      {formErrors.insuranceValidTill && <p className="mt-1 text-sm text-red-500">{formErrors.insuranceValidTill}</p>}
                    </div>

                    <div>
                      <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          id="contactNumber"
                          name="contactNumber"
                          required
                          className={`block w-full rounded-lg border ${formErrors.contactNumber ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                          value={formData.contactNumber}
                          onChange={handleInputChange}
                          placeholder="e.g. +919876543210"
                        />
                      </div>
                      {formErrors.contactNumber && <p className="mt-1 text-sm text-red-500">{formErrors.contactNumber}</p>}
                      <p className="mt-1 text-xs text-gray-500">Enter number with country code (e.g. +91 for India)</p>
                    </div>

                    {/* Pickup Address */}
                    <div className="mb-4">
                      <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700 mb-1">
                        Pickup Address <span className="text-red-500">*</span>
                      </label>
                      <LocationInput
                        value={formData.pickupAddress}
                        onChange={(value) => setFormData(prev => ({ ...prev, pickupAddress: value }))}
                        placeholder="Enter your pickup address"
                        required
                      />
                      {formErrors.pickupAddress && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.pickupAddress}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Additional details about your vehicle... For example: any modifications, special features, or maintenance history."
                    />
                  </div>
                </div>
                
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full bg-[#FF5733] text-white py-3 px-6 rounded-xl hover:bg-[#ff4019] transition-colors font-semibold text-lg flex items-center justify-center"
                  >
                    Continue to Upload Photos
                  </button>
                </div>
              </div>
            ) : step === 2 ? (
              <div className="p-8">
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <Camera className="h-6 w-6 text-[#FF5733] mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">Upload Vehicle Photos</h2>
                  </div>
                  <p className="text-gray-600 mb-4">Upload clear photos of your vehicle from different angles. Front view is required.</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                      <span className="font-medium">Tip:</span> Good quality photos greatly increase your chances of selling quickly at the best price.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 mb-2">
                    <h3 className="text-md font-medium text-gray-900">Required Photos</h3>
                  </div>
                  
                  {/* Front View (Required) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Front View <span className="text-red-500">*</span>
                    </label>
                    <div 
                      className={`relative h-48 border-2 ${photos.front ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg overflow-hidden transition-all hover:border-[#FF5733] bg-gray-50`}
                    >
                      {photoURLs.front ? (
                        <>
                          <SafeImage 
                            src={photoURLs.front} 
                            alt="Front view" 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <label htmlFor="front-upload" className="bg-white text-[#FF5733] px-4 py-2 rounded-lg cursor-pointer">
                              Change Photo
                            </label>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center px-4 py-4">
                          <Camera className="h-10 w-10 text-gray-400 mb-2" />
                          <label htmlFor="front-upload" className="cursor-pointer text-center">
                            <span className="text-[#FF5733] font-medium hover:underline">Upload Front View</span>
                            <p className="text-xs text-gray-500 mt-1">Front of the vehicle showing headlights and number plate</p>
                          </label>
                        </div>
                      )}
                      <input
                        id="front-upload"
                        name="front"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'front')}
                      />
                    </div>
                  </div>

                  {/* Other Views */}
                  {['back', 'left', 'right', 'dashboard'].map((view) => (
                    <div key={view}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {view} View
                      </label>
                      <div 
                        className={`relative h-48 border-2 ${photos[view as keyof typeof photos] ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg overflow-hidden transition-all hover:border-[#FF5733] bg-gray-50`}
                      >
                        {photoURLs[view] ? (
                          <>
                            <SafeImage 
                              src={photoURLs[view]} 
                              alt={`${view} view`} 
                              className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <label htmlFor={`${view}-upload`} className="bg-white text-[#FF5733] px-4 py-2 rounded-lg cursor-pointer">
                                Change Photo
                              </label>
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center px-4 py-4">
                            <Camera className="h-10 w-10 text-gray-400 mb-2" />
                            <label htmlFor={`${view}-upload`} className="cursor-pointer text-center">
                              <span className="text-[#FF5733] font-medium hover:underline">Upload {view.charAt(0).toUpperCase() + view.slice(1)} View</span>
                            </label>
                          </div>
                        )}
                        <input
                          id={`${view}-upload`}
                          name={view}
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, view as keyof typeof photos)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Document Upload Section */}
                <div className="mt-10 mb-6">
                  <div className="flex items-center mb-4">
                    <FileText className="h-6 w-6 text-[#FF5733] mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
                  </div>
                  <p className="text-gray-600 mb-4">Please upload the following documents for verification.</p>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start mb-6">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                      <span className="font-medium">Important:</span> Documents for Registration Certificate (RC), Insurance, and PUC certificate are required for verification.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Registration Certificate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Certificate (RC) <span className="text-red-500">*</span>
                      </label>
                      <div className={`relative border-2 ${documents.rc ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg p-4 transition-all hover:border-[#FF5733] bg-gray-50`}>
                        {documentURLs.rc ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-700 truncate max-w-[180px]">RC Document</span>
                            </div>
                            <label htmlFor="rc-upload" className="text-sm text-[#FF5733] cursor-pointer hover:underline">
                              Change
                            </label>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            <FileText className="h-10 w-10 text-gray-400 mb-2" />
                            <label htmlFor="rc-upload" className="cursor-pointer text-center">
                              <span className="mt-2 block text-sm font-medium text-[#FF5733]">Upload RC</span>
                              <span className="mt-1 block text-xs text-gray-500">PDF, JPG or PNG up to 5MB</span>
                            </label>
                          </div>
                        )}
                        <input
                          id="rc-upload"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'rc')}
                        />
                      </div>
                    </div>

                    {/* Insurance Document */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Document <span className="text-red-500">*</span>
                      </label>
                      <div className={`relative border-2 ${documents.insurance ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg p-4 transition-all hover:border-[#FF5733] bg-gray-50`}>
                        {documentURLs.insurance ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-700 truncate max-w-[180px]">Insurance Document</span>
                            </div>
                            <label htmlFor="insurance-upload" className="text-sm text-[#FF5733] cursor-pointer hover:underline">
                              Change
                            </label>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            <FileText className="h-10 w-10 text-gray-400 mb-2" />
                            <label htmlFor="insurance-upload" className="cursor-pointer text-center">
                              <span className="mt-2 block text-sm font-medium text-[#FF5733]">Upload Insurance</span>
                              <span className="mt-1 block text-xs text-gray-500">PDF, JPG or PNG up to 5MB</span>
                            </label>
                          </div>
                        )}
                        <input
                          id="insurance-upload"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'insurance')}
                        />
                      </div>
                    </div>

                    {/* PUC Certificate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PUC Certificate <span className="text-red-500">*</span>
                      </label>
                      <div className={`relative border-2 ${documents.puc ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg p-4 transition-all hover:border-[#FF5733] bg-gray-50`}>
                        {documentURLs.puc ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-700 truncate max-w-[180px]">PUC Certificate</span>
                            </div>
                            <label htmlFor="puc-upload" className="text-sm text-[#FF5733] cursor-pointer hover:underline">
                              Change
                            </label>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            <FileText className="h-10 w-10 text-gray-400 mb-2" />
                            <label htmlFor="puc-upload" className="cursor-pointer text-center">
                              <span className="mt-2 block text-sm font-medium text-[#FF5733]">Upload PUC</span>
                              <span className="mt-1 block text-xs text-gray-500">PDF, JPG or PNG up to 5MB</span>
                            </label>
                          </div>
                        )}
                        <input
                          id="puc-upload"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'puc')}
                        />
                      </div>
                    </div>
                    
                    {/* Other Documents (Optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Other Documents (Optional)
                      </label>
                      <div className={`relative border-2 ${documents.additional ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg p-4 transition-all hover:border-[#FF5733] bg-gray-50`}>
                        {documentURLs.additional ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-700 truncate max-w-[180px]">Additional Document</span>
                            </div>
                            <label htmlFor="additional-upload" className="text-sm text-[#FF5733] cursor-pointer hover:underline">
                              Change
                            </label>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            <FileText className="h-10 w-10 text-gray-400 mb-2" />
                            <label htmlFor="additional-upload" className="cursor-pointer text-center">
                              <span className="mt-2 block text-sm font-medium text-[#FF5733]">Upload Additional</span>
                              <span className="mt-1 block text-xs text-gray-500">Service records, etc.</span>
                            </label>
                          </div>
                        )}
                        <input
                          id="additional-upload"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'additional')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="py-3 px-6 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back to Details
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#FF5733] text-white py-3 px-6 rounded-xl hover:bg-[#ff4019] transition-colors font-semibold flex items-center justify-center disabled:bg-opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Vehicle for Sale'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Step 3 - Summary view
              <div className="p-8">
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <FileText className="h-6 w-6 text-[#FF5733] mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">Review Your Listing</h2>
                  </div>
                  <p className="text-gray-600 mb-4">Please review the information below before submitting your vehicle.</p>
                </div>

                <div className="space-y-6">
                  {/* Vehicle Details Summary */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Bike className="w-5 h-5 text-[#FF5733] mr-2" />
                      Vehicle Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Vehicle Type</p>
                          <p className="font-medium">{formData.type || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Brand & Model</p>
                          <p className="font-medium">{formData.brand} {formData.model}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Year</p>
                          <p className="font-medium">{formData.year}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Registration Number</p>
                          <p className="font-medium">{formData.registrationNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Condition</p>
                          <p className="font-medium">{formData.condition}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Kilometers Driven</p>
                          <p className="font-medium">{formData.kmsDriven} km</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Mileage</p>
                          <p className="font-medium">{formData.mileage}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fuel Type</p>
                          <p className="font-medium">{formData.fuelType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            {formData.fuelType === 'electric' ? 'Motor Power' : 'Engine Capacity'}
                          </p>
                          <p className="font-medium">
                            {formData.engineCapacity} {formData.fuelType === 'electric' ? 'watts' : 'cc'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Expected Price</p>
                          <p className="font-medium text-[#FF5733]">
                            ₹{parseInt(formData.expectedPrice).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Negotiable</p>
                          <p className="font-medium">{formData.isPriceNegotiable ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Documents Summary */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FileText className="w-5 h-5 text-[#FF5733] mr-2" />
                      Documents & Insurance
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Last Service Date</p>
                        <p className="font-medium">{new Date(formData.lastServiceDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Insurance Valid Till</p>
                        <p className="font-medium">{new Date(formData.insuranceValidTill).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">PUC Certificate</p>
                        <p className="font-medium">{formData.hasPucCertificate ? 'Available' : 'Not Available'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Uploaded Documents</p>
                        <p className="font-medium">
                          {Object.entries(documents)
                            .filter(([_, file]) => file !== null)
                            .map(([key]) => key)
                            .join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Photos Summary */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Camera className="w-5 h-5 text-[#FF5733] mr-2" />
                      Photos
                    </h3>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {Object.entries(photoURLs).map(([view, url]) => (
                        url && (
                          <div key={view} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <SafeImage 
                              src={url} 
                              alt={`${view} view`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                  
                  {/* Contact & Pickup Information */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 text-[#FF5733] mr-2" />
                      Contact & Pickup Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Contact Number</p>
                        <p className="font-medium">{formData.contactNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pickup Schedule</p>
                        <p className="font-medium">To be scheduled (9 AM - 6 PM on business days)</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Pickup Address</p>
                        <p className="font-medium">{formData.pickupAddress || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Information */}
                  {(formData.description || formData.features.length > 0 || formData.highlights.length > 0) && (
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Info className="w-5 h-5 text-[#FF5733] mr-2" />
                        Additional Information
                      </h3>
                      
                      {formData.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500">Description</p>
                          <p className="font-medium">{formData.description}</p>
                        </div>
                      )}
                      
                      {formData.features.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500">Features</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {formData.features.map((feature, index) => (
                              <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {formData.highlights.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">Highlights</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {formData.highlights.map((highlight, index) => (
                              <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                                {highlight}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="py-3 px-6 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back to Photos
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#FF5733] text-white py-3 px-6 rounded-xl hover:bg-[#ff4019] transition-colors font-semibold flex items-center justify-center disabled:bg-opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Vehicle for Sale'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SellVehicle;
