import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Shield, CheckCircle2, ArrowLeft, Battery, Wrench, AlertTriangle, Gauge, Star, X, MapPin, Info, ShoppingBag } from 'lucide-react';
import { LifeBuoy, Settings, PenTool as Tool } from 'lucide-react';
import ManufacturerSelect from '../components/ManufacturerSelect';
import { toast } from 'react-toastify';
import MultiStepVehicleSelector from '../components/SelectVehicle';
import { checkUserAuthentication } from '../utils/auth';
import { categoryService, serviceService } from '../services/apiService';

// Type definitions
interface ServiceFeature {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  discounted_price?: string;
  duration: string;
  warranty: string;
  recommended: string | boolean;
  category: string;
  manufacturers?: number[];
  vehicles_models?: number[];
  features: ServiceFeature[];
  image?: string;
}

interface ServicePackage {
  id?: number;
  name: string;
  price: string;
  duration: string;
  warranty?: string;
  recommended: string;
  description?: string;
  features: { name: string }[];
  image?: string;
}

interface Category {
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
  icon?: string;
  services?: ServicePackage[];
  rating?: number;
  reviews_count?: number;
}

// Import the Manufacturer type from ManufacturerSelect or define locally
type Manufacturer = {
  id: string;
  name: string;
  logo: string;
  specializations: string[];
  rating?: number;
  experience?: string;
};

// Vehicle data types
interface VehicleModel {
  id: number;
  name: string;
  manufacturer: number;
}

interface VehicleOwnership {
  vehicle_type: number;
  manufacturer: number;
  model: number;
}

// Add an interface for the API response
interface ServicePriceResponse {
  id: number;
  service: number;
  manufacturer: number;
  vehicle_model: number;
    price: string;
}

// First, add the CartItem interface (before CartResponse)
interface CartItem {
  id: number;
  service_id: number;
  service_name: string;
  quantity: number;
  price: string;
}

// Then fix the linter error in addToRepairsBasket function
interface CartResponse {
  id: number;
  status: string;
  cart_item_id?: number;
}

// Icon mapping
const iconMapping = {
  'battery': Battery,
  'brake': AlertTriangle,
  'engine': Settings,
  'diagnostic': Gauge,
  'roadside': LifeBuoy,
  'tool': Tool,
  'wrench': Wrench,
  'default': Tool
};

// Get appropriate icon based on slug or icon property
const getServiceIcon = (category: Category): React.FC<{ className?: string }> => {
  const slug = category.slug || '';
  
  if (category.icon) {
    // If the API provides an icon name that matches our mapping
    return iconMapping[category.icon as keyof typeof iconMapping] || iconMapping.default;
  }
  
  if (slug.includes('battery')) return iconMapping.battery;
  if (slug.includes('brake')) return iconMapping.brake;
  if (slug.includes('engine')) return iconMapping.engine;
  if (slug.includes('diag')) return iconMapping.diagnostic;
  if (slug.includes('road')) return iconMapping.roadside;
  if (slug.includes('wrench') || slug.includes('chain')) return iconMapping.wrench;
  return iconMapping.default;
};

// Main component
const ServiceDetails: React.FC = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams<{ serviceId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showManufacturers, setShowManufacturers] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null);
  const [userVehicle, setUserVehicle] = useState<VehicleOwnership | null>(null);
  const [customPrice, setCustomPrice] = useState<string | null>(null);
  const [servicePrices, setServicePrices] = useState<Record<number, string>>({});
  const [isCustomPrice, setIsCustomPrice] = useState<Record<number, boolean>>({});
  const [cartId, setCartId] = useState<number | null>(null);
  const [processingService, setProcessingService] = useState<number | null>(null);

  // New function to fetch service prices for specific vehicle
  const fetchServicePrices = async (vehicleData: VehicleOwnership) => {
    if (!vehicleData || !serviceId || services.length === 0) return;
    
    try {
      // Create a price map to store results
      const priceMap: Record<number, string> = {};
      // Track which prices are custom vs base prices
      const customPriceMap: Record<number, boolean> = {};
      
      // Need to fetch prices for each service
      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        
        // We need the real service ID, not just the index
        const serviceIdForApi = service.id || i + 1;
        
        console.log(`[PRICE] Fetching price for service ${service.name} (ID: ${serviceIdForApi})`);
        
        try {
          // Use the centralized API service
          const data = await serviceService.getServicePrice(serviceIdForApi, vehicleData.manufacturer, vehicleData.model);
          
          // Store the price (custom or base)
          priceMap[i] = `₹${data.price}`;
          // Store whether this is a custom price or base price
          customPriceMap[i] = data.is_custom_price;
          
          console.log(`[PRICE] Price for service ${service.name}: ₹${data.price} (Custom: ${data.is_custom_price})`);
        } catch (priceErr) {
          console.error(`Error fetching price for service ${service.name}:`, priceErr);
          // Fallback to default price on error
          const basePrice = service.price.replace('₹', '');
          priceMap[i] = `₹${basePrice}`;
          customPriceMap[i] = false;
        }
      }
      
      // Store all the prices
      setServicePrices(priceMap);
      setIsCustomPrice(customPriceMap);
      
      // Update the selected service price if there is one
      if (selectedServiceIndex !== null) {
        setCustomPrice(priceMap[selectedServiceIndex]);
      }
      
      // Store in session for persistence
      sessionStorage.setItem('vehicleSpecificPrices', JSON.stringify(priceMap));
      sessionStorage.setItem('customPriceFlags', JSON.stringify(customPriceMap));
    } catch (error) {
      console.error('Error fetching service prices:', error);
      // Don't let the whole component fail if price fetching fails
      toast.error("Could not fetch custom prices. Using standard prices instead.");
    }
  };

  // Update the useEffect dependency array to include all variables used in the function
  useEffect(() => {
    try {
      const vehicleData = sessionStorage.getItem('userVehicleOwnership');
      if (vehicleData) {
        const parsedVehicle = JSON.parse(vehicleData);
        setUserVehicle(parsedVehicle);
        
        // Fetch real service prices from the API
        fetchServicePrices(parsedVehicle);
        
        // Load custom price flags from session storage
        try {
          const customPriceFlagsStr = sessionStorage.getItem('customPriceFlags');
          if (customPriceFlagsStr) {
            setIsCustomPrice(JSON.parse(customPriceFlagsStr));
          }
        } catch (e) {
          console.error('Error loading custom price flags:', e);
        }
      }
    } catch (error) {
      console.error('Error reading vehicle data from session storage:', error);
    }
  }, [vehicleModalOpen, services, serviceId, selectedServiceIndex]);

  // Update the getServicePrice function to use the fetched prices
  const getServicePrice = (index: number): string => {
    if (!userVehicle) return '';
    
    // First check our state for prices
    if (servicePrices[index]) {
      return servicePrices[index];
    }
    
    // Check session storage as fallback
    try {
      const priceMapStr = sessionStorage.getItem('vehicleSpecificPrices');
      if (priceMapStr) {
        const priceMap = JSON.parse(priceMapStr);
        if (priceMap[index]) {
          return priceMap[index];
        }
      }
    } catch (error) {
      console.error('Error getting vehicle-specific price:', error);
    }
    
    // Final fallback - use base price
    return services[index]?.price || '';
  };

  // Helper function to properly format recommendation text with spaces
  const formatRecommendation = (text: string | boolean | undefined): string => {
    // If text is empty, null, undefined or false, return null so fallbacks can be applied
    if (!text) return '';
    
    if (typeof text === 'string') {
      // Remove any extra spaces
      const trimmedText = text.trim();
      
      // If there's no content after trimming, return empty string
      if (trimmedText.length === 0) return '';
      
      // If the text already starts with "Every", return it as is
      if (trimmedText.startsWith('Every')) return trimmedText;
      
      // Otherwise, add "Every " prefix with proper spacing
      return `Every ${trimmedText}`;
    }
    
    // If it's a true boolean, use a default value
    if (text === true) return 'Every 10,000 Kms or 6 Months';
    
    // Default fallback
    return '';
  };

  // Fetch service data
  useEffect(() => {
    const fetchServiceDetails = async () => {
      console.log('[NEW] fetchServiceDetails running with ID:', serviceId);
      
      if (!serviceId) {
        setError('Invalid service ID');
        setLoading(false);
        return;
      }

      try {
        // Use the centralized API service to fetch services by category
        const data = await serviceService.getServicesByCategory(serviceId);
        console.log('[NEW] API response data:', JSON.stringify(data).substring(0, 500) + '...');
        
        // First, check if data is a list of categories or services
        if (Array.isArray(data)) {
          let categoryData = null;
          let servicesList = [];
          
          // If data is an array of categories, find the matching one
          for (const item of data) {
            if (item.uuid === serviceId) {
              categoryData = item;
              if (Array.isArray(item.services)) {
                servicesList = item.services;
              }
              break;
            }
          }
          
          // If we didn't find a category, but data contains services directly
          if (!categoryData && data.length > 0 && data[0].category) {
            // This is a list of services, not categories
            servicesList = data;
            // Fetch the category details separately
            try {
              const categoriesData = await categoryService.getCategoryById(serviceId);
              categoryData = categoriesData;
            } catch (categoryErr) {
              console.error('[NEW] Error fetching category details:', categoryErr);
              // Create a fallback category object instead of throwing an error
              // This allows services to still be displayed even if category details can't be fetched
              categoryData = {
                uuid: serviceId,
                name: "Service Category",
                slug: "service-category",
                description: "",
                image: null,
                icon: null
              };
              console.log('[NEW] Using fallback category data due to API error');
            }
          }
          
          if (categoryData) {
            console.log('[NEW] Found category:', categoryData.name);
            
            setCategory({
              uuid: categoryData.uuid,
              name: categoryData.name,
              slug: categoryData.slug,
              description: categoryData.description || '',
              image: categoryData.image,
              icon: categoryData.icon,
              rating: categoryData.rating || 4.8,
              reviews_count: categoryData.reviews_count || 256
            });
            
            console.log('[NEW] Raw services:', servicesList);
            
            // If no services returned, show empty state instead of creating defaults
            if (servicesList.length === 0) {
              console.log('[NEW] No services found');
              setServices([]);
            } else {
              // Process services to match the expected format
              const processedServices = servicesList.map((service: any, idx: number) => ({
                id: service.id || idx + 1, 
                name: service.name,
                price: service.base_price,
                duration: service.duration,
                warranty: service.warranty,
                recommended: service.recommended ? formatRecommendation(service.recommended) : '',
                description: service.description || '',
                features: Array.isArray(service.features) && service.features.length > 0
                  ? service.features 
                  : [],
                image: service.image_url || service.image
              }));
              
              setServices(processedServices);
              
              // If we have services but no category, use service category ID as fallback
              if (!categoryData && processedServices.length > 0) {
                const firstService = processedServices[0];
                categoryData = {
                  uuid: serviceId,
                  name: firstService.name ? `${firstService.name} Category` : "Service Category",
                  slug: "service-category",
                  description: "",
                  image: null,
                  icon: null
                };
                console.log('[NEW] Created fallback category from service data');
              }
            }
          } else {
            throw new Error('Category not found');
          }
        } else {
          // Response was not an array, which is unexpected
          throw new Error('Invalid API response format: expected an array');
        }
      } catch (err) {
        console.error('[NEW] Error in fetchServiceDetails:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch service details');
        
        // Don't create fallback data, just set empty data
        setCategory(null);
        setServices([]);
        
        // Auto-retry on network errors, but limit attempts
        if (retryCount < 3 && (err instanceof Error && err.message.includes('network'))) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            setLoading(true);
            setError(null);
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId, retryCount]);

  // Add this useEffect to load or create cart ID from sessionStorage
  useEffect(() => {
    const storedCartId = sessionStorage.getItem('cartId');
    if (storedCartId) {
      setCartId(parseInt(storedCartId));
    }
  }, []);

  // Add a function to create a new cart
  const createCart = async (): Promise<number> => {
    try {
      // Use the centralized API service
      const data = await serviceService.createCart();
      // Save cart ID to session storage
      sessionStorage.setItem('cartId', data.id.toString());
      setCartId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating cart:', error);
      toast.error('Failed to create repairs basket. Please try again.');
      throw error;
    }
  };

  // Function to add service to repairs basket
  const addToRepairsBasket = async (serviceId: number, skipExistingCheck = false) => {
    try {
      // Get or create cart ID
      let currentCartId = cartId;
      if (!currentCartId) {
        currentCartId = await createCart();
      }
      
      // Find service details to include the name
      const serviceToAdd = services.find(s => s.id === serviceId);
      if (!serviceToAdd) {
        throw new Error('Service not found');
      }
      
      // If skipExistingCheck is false, check if the service already exists in the cart
      if (!skipExistingCheck) {
        // Check if this service is already in the cart
        try {
          const existingItems = await serviceService.getCartItems(currentCartId);
          const serviceExists = existingItems.some((item: CartItem) => item.service_id === serviceId);
          
          if (serviceExists) {
            console.log('Service already in basket, skipping add operation');
            toast.info('This service is already in your repairs basket');
            return true; // Indicate that the service is already in the basket
          }
        } catch (error) {
          console.error('Error checking existing cart items:', error);
          // Continue with add operation even if check fails
        }
      }
      
      // Now add the service to the cart using the centralized API service
      const data = await serviceService.addToCart(currentCartId, serviceId, 1, serviceToAdd.name);
      console.log('Added service to repairs basket:', data);
      toast.success('Service added to your repairs basket!', {
        position: 'top-center'
      });
      
      // Store service data in session storage as backup
      sessionStorage.setItem('pendingServiceData', JSON.stringify({
        id: serviceId,
        name: serviceToAdd.name,
        price: serviceToAdd.price,
        quantity: 1
      }));
      
      // Dispatch an event to notify other components about the cart update
      window.dispatchEvent(new Event('cartUpdated'));
      return true;
      
    } catch (error) {
      console.error('Error adding to repairs basket:', error);
      toast.error('Failed to add to repairs basket. Please try again.');
      return false;
    }
  };

  // Update the getServiceNow function
  const getServiceNow = async (serviceId: number) => {
    try {
      // First check if user is authenticated
      const isAuthenticated = checkUserAuthentication();
      
      // Find the service by ID for data storage regardless of auth status
      const serviceToBook = services.find(s => s.id === serviceId);
      if (!serviceToBook) {
        toast.error('Service details not found');
        return;
      }
      
      // Set UI state for processing
      setProcessingService(serviceId);
      
      if (!isAuthenticated) {
        // Store service data in sessionStorage for recovery
        const serviceData = {
          id: serviceId,
          name: serviceToBook.name,
          price: serviceToBook.price,
          quantity: 1
        };
        
        console.log('Service selected for booking:', serviceData);
        sessionStorage.setItem('pendingServiceData', JSON.stringify(serviceData));
        
        // Store full vehicle data for post-login processing
        if (userVehicle) {
          sessionStorage.setItem('pendingVehicleData', JSON.stringify(userVehicle));
        }
        
        // Save intended action in sessionStorage for post-login redirect
        sessionStorage.setItem('postLoginRedirect', '/service-checkout');
        sessionStorage.setItem('selectedServiceId', serviceId.toString());
        
        // Show message and redirect to login
        toast.info('Please login to continue with booking');
        navigate('/login-signup');
        return;
      }
      
      // If user is authenticated, add to repairs basket but skip duplicates
      const success = await addToRepairsBasket(serviceId, false);
      
      if (success) {
        // Navigate to checkout immediately, don't wait
        navigate('/service-checkout');
      }
    } catch (error) {
      console.error('Error processing service request:', error);
      toast.error('Failed to process your request. Please try again.');
    } finally {
      // Clear processing state
      setProcessingService(null);
    }
  };

  // Event handlers
  const handleServiceSelect = (serviceName: string) => {
    // Find the selected service based on name
    const service = services.find(s => s.name === serviceName);
    if (service) {
      // Create a service object compatible with our previous implementation
      const selectedServiceData = {
        id: Math.floor(Math.random() * 1000), // Temporary ID
        name: service.name,
        slug: service.name.toLowerCase().replace(/\s+/g, '-'),
        description: '',
        base_price: service.price,
        duration: service.duration,
        warranty: service.warranty || '',
        recommended: service.recommended,
        category: category?.name || '',
        manufacturers: [1, 2, 3], // Mockup manufacturers
        features: service.features,
        image: service.image
      };
      setSelectedService(selectedServiceData as any);
    }
  };

  const handleManufacturerSelect = (manufacturer: Manufacturer) => {
    if (!selectedService) return;
    
    // Store selected service and manufacturer in session storage for the booking flow
    try {
      sessionStorage.setItem('selectedService', JSON.stringify(selectedService));
      sessionStorage.setItem('selectedManufacturer', JSON.stringify(manufacturer));
    } catch (error) {
      console.error('Failed to store selection in session storage:', error);
    }
    
    navigate(`/booking?service=${selectedService.id}&manufacturer=${manufacturer.id}`);
  };

  const handleSelectVehicle = (serviceIndex: number) => {
    setSelectedServiceIndex(serviceIndex);
    setVehicleModalOpen(true);
  };

  const handleVehicleSelected = () => {
    // Vehicle selection was completed in the modal
    setVehicleModalOpen(false);
    toast.success("Vehicle selected successfully!");
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
  };

  // Loading state
  if (loading) {
    return (
      <div className="py-12 min-h-[60vh] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="py-12 min-h-[60vh] flex flex-col justify-center items-center">
        <div className="text-red-500 text-xl font-semibold mb-4">Failed to fetch service details</div>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={handleRetry}
          className="bg-[#FF5733] text-white px-6 py-2 rounded-lg hover:bg-[#ff4019] transition-colors font-medium"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // No category found
  if (!category) {
    return (
      <div className="py-12 min-h-[60vh] flex flex-col justify-center items-center">
        <div className="text-gray-600 text-xl font-semibold mb-4">Service category not found</div>
        <button 
          onClick={handleBack}
          className="bg-[#FF5733] text-white px-6 py-2 rounded-lg hover:bg-[#ff4019] transition-colors font-medium"
        >
          Back to Services
        </button>
      </div>
    );
  }

  // Manufacturer selection view
  if (showManufacturers && selectedService) {
    // Create mock manufacturer data for the ManufacturerSelect component
    const mockManufacturers: Manufacturer[] = [1, 2, 3, 4].map(id => ({
      id: id.toString(),
      name: `Manufacturer ${id}`,
      logo: '/images/logos/default-logo.png',
      specializations: ['General Repairs', 'Maintenance'],
      rating: 4.5 + (id % 5) / 10,
      experience: `${3 + (id % 8)} years`
    }));
    
    return (
      <div className="py-12 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button 
            onClick={() => setShowManufacturers(false)}
            className="flex items-center text-gray-600 hover:text-[#FF5733] mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to service details
          </button>
          
          <h2 className="text-2xl font-bold mb-6">Select a Manufacturer for {selectedService.name}</h2>
          
          {mockManufacturers.length > 0 ? (
          <ManufacturerSelect 
              manufacturers={mockManufacturers}
            onSelect={handleManufacturerSelect} 
          />
          ) : (
            <div className="bg-white rounded-2xl shadow p-8 text-center">
              <p className="text-gray-600 mb-4">No manufacturers available for this service at the moment.</p>
              <button 
                onClick={() => setShowManufacturers(false)}
                className="bg-[#FF5733] text-white px-6 py-2 rounded-lg hover:bg-[#ff4019] transition-colors font-medium"
              >
                Back to Service
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vehicle Selection Modal
  const VehicleSelectionModal = () => {
    if (!vehicleModalOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold">Select Your Vehicle</h2>
            <button 
              onClick={() => setVehicleModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-2">
            <MultiStepVehicleSelector onVehicleSelected={handleVehicleSelected} />
          </div>
        </div>
      </div>
    );
  };

  // Main view - category and services
  const IconComponent = getServiceIcon(category);
  const rating = category.rating || 4.8;
  const reviewsCount = category.reviews_count || 256;

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-[#FF5733] mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to services
        </button>
        
        {/* Category Header Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden p-6 mb-8">
          <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-[#FFF5F2] rounded-xl flex items-center justify-center">
              <IconComponent className="w-8 h-8 text-[#FF5733]" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-gray-700 mt-2">
                {category.description || `Complete ${category.name.toLowerCase()} services and solutions for your vehicle. Professional maintenance to keep your bike running at its best.`}
              </p>
              
              {/* Ratings display - COMMENTED OUT
              <div className="flex items-center mt-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.floor(rating) 
                          ? "text-yellow-400 fill-current" 
                          : star <= rating 
                            ? "text-yellow-400 fill-current opacity-60" 
                            : "text-yellow-400 opacity-30"
                      }`} 
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-700 font-medium">{rating.toFixed(1)}</span>
                <span className="ml-1 text-gray-500">({reviewsCount} reviews)</span>
              </div>
              */}
            </div>
          </div>
        </div>

        {/* Vehicle selection notice if user has selected a vehicle */}
        {userVehicle && (
          <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-xl">
            <div className="flex items-center">
              <MapPin className="text-blue-500 w-5 h-5 mr-2" />
              <p className="text-blue-700">
                Pricing shown is customized for your selected vehicle. 
                <button 
                  onClick={() => {
                    sessionStorage.removeItem('userVehicleOwnership');
                    setUserVehicle(null);
                    setCustomPrice(null);
                    toast.info("Vehicle selection cleared");
                  }}
                  className="ml-2 text-blue-600 underline hover:no-underline"
                >
                  Clear selection
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Vehicle selection required notice */}
        {!userVehicle && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Vehicle Selection Required</h3>
                <div className="mt-1 text-sm text-yellow-700">
                  <p>Please select your vehicle to see customized pricing for these services.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display service packages */}
        {services.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <p className="text-gray-600">No services available in this category yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {services.map((service, index) => (
                  <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-md p-6"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1">
                    {/* Service name */}
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h2>
                    
                    {/* Service description */}
                    <p className="text-gray-600 mb-4">
                      {service.description && service.description.length > 0
                        ? service.description
                        : "No description available"}
                    </p>
                    
                    {/* Service price with customization if available */}
                    <div className="mb-4">
                      {userVehicle ? (
                        <div className="text-2xl font-bold text-[#FF5733]">
                          {getServicePrice(index)}
                          <span className="ml-2 text-sm text-gray-500 font-normal">
                            {isCustomPrice[index] ? 
                              "(Special price for your vehicle)" : 
                              "(Standard price)"}
                          </span>
                        </div>
                      ) : (
                        <div className="text-lg text-gray-700">
                          <span className="italic">Select your vehicle to see pricing</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Service details with labeled icons */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-700">
                        <div className="w-6 flex justify-center">
                          <Clock className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="ml-2 font-medium w-24">Duration:</span>
                        <span>{service.duration}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-700">
                        <div className="w-6 flex justify-center">
                          <Shield className="w-4 h-4 text-gray-500" />
                          </div>
                        <span className="ml-2 font-medium w-24">Warranty:</span>
                        <span>{service.warranty || (service.name.includes('Basic') ? '1000 Kms or 1 Month' : '2000 Kms or 2 Months')}</span>
                          </div>
                      
                      <div className="flex items-center text-gray-700">
                        <div className="w-6 flex justify-center">
                          <MapPin className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="ml-2 font-medium w-24">Recommended:</span>
                        <span className="ml-3">{service.recommended ? formatRecommendation(service.recommended) : 'As needed'}</span>
                      </div>
                    </div>
                    
                    {/* Features list */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">Service Includes:</h3>
                      {service.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center py-1.5">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Service image */}
                  <div className="md:w-1/3 flex flex-col items-center justify-center md:pl-6 mb-6 md:mb-0">
                    <div className="w-full max-w-[200px] rounded-xl overflow-hidden mb-4">
                      <img 
                        src={service.image || "/images/services/default-service.jpg"} 
                        alt={service.name}
                        className="w-full h-auto object-cover aspect-square"
                      />
              </div>
                    
                    {/* Update buttons based on vehicle selection */}
                    {userVehicle ? (
                      <div className="flex items-center justify-between mt-6">
                        <button
                          onClick={() => addToRepairsBasket(service.id || index)}
                          className="flex items-center bg-white text-[#FF5733] border border-[#FF5733] px-4 py-2 rounded-md hover:bg-[#fff3f0] transition-colors"
                          disabled={processingService === (service.id || index)}
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Add to Basket
                        </button>
                        <button
                          onClick={() => getServiceNow(service.id || index)}
                          className="bg-[#FF5733] text-white px-6 py-2 rounded-md hover:bg-opacity-90 transition-colors"
                          disabled={processingService === (service.id || index)}
                        >
                          {processingService === (service.id || index) ? (
                            <>
                              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                              Processing...
                            </>
                          ) : (
                            "Get Service Now"
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectVehicle(index)}
                        className="w-full bg-[#FF5733] text-white py-2.5 px-4 rounded-lg hover:bg-[#ff4019] transition-colors font-medium"
                      >
                        Select Vehicle to See Price
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Vehicle Selection Modal */}
      <VehicleSelectionModal />
    </div>
  );
};

export default ServiceDetails;
