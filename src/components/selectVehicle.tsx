import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, Image as ImageIcon, IndianRupee, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService, API_CONFIG, CDN_CONFIG } from '../config/api.config';
import { SelectedVehicle } from '../types/vehicle';

// Updated helper function to construct Cloudinary URL with version and folders
const getCloudinaryUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  
  // If it's already a full URL, return as is
  if (path.startsWith('http')) return path;
  
  // Get the folder based on the type
  let folder = 'vehicle_types'; // default folder
  if (path.includes('manufacturer')) {
    folder = 'manufacturers';
  } else if (path.includes('model')) {
    folder = 'vehicle_models';
  }
  
  // Get current timestamp for version (you should get this from your API)
  const version = Math.floor(Date.now() / 1000);
  
  // Construct Cloudinary URL with version and folder
  return `${CDN_CONFIG.baseURL}/${CDN_CONFIG.cloudName}/image/upload/v${version}/${folder}/${path}`;
};

// Helper function to construct Cloudinary URL
const getImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  
  // If it's already a full URL, return as is
  if (path.startsWith('http')) return path;
  
  // Construct the full Cloudinary URL by combining the base URL with the path from API
  return `https://res.cloudinary.com/dz81bjuea/${path}`;
};

// Enhanced VehicleImage component with exact Cloudinary transformations
const VehicleImage = ({ 
  image, 
  alt, 
  className, 
  size = 'small',
  onClick,
  selected = false
}: { 
  image: string | null | undefined;
  alt: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  selected?: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Fixed dimensions for consistent sizing
  const sizeClasses = {
    small: 'w-[120px] h-[120px]',
    medium: 'w-[180px] h-[180px]',
    large: 'w-[240px] h-[240px]'
  };

  // Construct the full Cloudinary URL
  const imageUrl = useMemo(() => {
    console.log('Constructing image URL for:', image);
    
    if (!image) {
      console.log('No image provided');
      return undefined;
    }
    
    // If it's already a full URL, return as is
    if (image.startsWith('http')) {
      console.log('Image is already a full URL');
      return image;
    }
    
    // Construct the full Cloudinary URL
    const fullUrl = `https://res.cloudinary.com/dz81bjuea/${image}`;
    console.log('Constructed URL:', fullUrl);
    return fullUrl;
  }, [image]);

  // Debug logs
  useEffect(() => {
    console.log('VehicleImage Debug:', {
      originalImage: image,
      constructedUrl: imageUrl,
      alt,
      size
    });
  }, [image, imageUrl, alt, size]);

  const handleImageError = (error: any) => {
    console.error('Image load error:', error);
    console.error('Failed URL:', imageUrl);
    setHasError(true);
    setIsLoading(false);
  };

  // Show placeholder for null images or errors
  if (!imageUrl || hasError) {
    return (
      <div 
        onClick={onClick}
        className={`
          bg-gray-50 rounded-2xl flex flex-col items-center justify-center p-4
          ${className || sizeClasses[size]}
          cursor-pointer transform transition-all duration-300
          hover:shadow-lg hover:scale-102 hover:bg-gray-100
          border-2 ${selected ? 'border-[#FF5733]' : 'border-dashed border-gray-200'}
          ${selected ? 'shadow-[#FF5733]/20 shadow-lg' : ''}
          aspect-square
        `}
      >
        <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
        <span className="text-sm font-medium text-gray-700 text-center line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <motion.div 
      className={`relative group ${className || sizeClasses[size]} aspect-square`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isLoading && (
        <div className={`
          animate-pulse bg-gray-200 rounded-2xl
          ${className || sizeClasses[size]}
          aspect-square
        `} />
      )}
      <div className={`
        relative overflow-hidden rounded-2xl
        cursor-pointer transform transition-all duration-300
        ${selected ? 'ring-2 ring-[#FF5733] shadow-lg shadow-[#FF5733]/20' : 'shadow-md hover:shadow-xl'}
        aspect-square
      `}>
        <img
          src={imageUrl}
          alt={alt}
          className={`
            ${className || sizeClasses[size]}
            object-contain rounded-2xl
            transition-all duration-300
            ${isLoading ? 'opacity-0' : 'opacity-100'}
            aspect-square p-2
          `}
          onLoad={() => {
            console.log('Image loaded successfully:', imageUrl);
            setIsLoading(false);
          }}
          onError={handleImageError}
          loading="lazy"
        />
        <div className={`
          absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent
          flex items-end justify-center p-3
          transition-opacity duration-300
          ${isHovered || selected ? 'opacity-100' : 'opacity-0'}
        `}>
          <span className="text-white text-sm font-semibold line-clamp-2 text-center">{alt}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Types
interface VehicleType {
  id: number;
  name: string;
  image: string | null;
}

interface Manufacturer {
  id: number;
  name: string;
  image: string | null;
}

interface VehicleModel {
  id: number;
  name: string;
  manufacturer: number;
  manufacturer_name: string;
  vehicle_type: number;
  vehicle_type_name: string;
  image: string | null;
}

interface ServicePrice {
  id: number;
  service: number;
  manufacturer: number | null;
  vehicle_model: number | null;
  price: string;
  is_custom_price: boolean;
}

interface Vehicle {
  manufacturer: string;
  model: string;
  vehicleType: string;
  manufacturerId?: number;
  modelId?: number;
}

interface SelectVehicleProps {
  onVehicleSelect: (vehicle: SelectedVehicle | null) => void;
  serviceId: string;
  initialVehicle?: SelectedVehicle | null;
}

// Vehicle Type Card Component
const VehicleTypeCard = ({ type, selected, onClick }: { 
  type: VehicleType; 
  selected: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        border rounded-xl p-4 cursor-pointer transition
        hover:border-[#FF5733] hover:shadow-md
        ${selected ? 'border-[#FF5733] shadow-md' : 'border-gray-200'}
        flex flex-col items-center justify-center
        w-full aspect-[4/3]
      `}
    >
      <div className="flex flex-col items-center justify-center gap-3 w-full">
        <VehicleImage
          image={type.image}
          alt={type.name}
          size="small"
          selected={selected}
        />
        <h3 className="text-base font-medium text-gray-900 text-center line-clamp-2">{type.name}</h3>
      </div>
    </div>
  );
};

// Manufacturer Card Component
const ManufacturerCard = ({ manufacturer, selected, onClick }: {
  manufacturer: Manufacturer;
  selected: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        border rounded-xl p-4 cursor-pointer transition
        hover:border-[#FF5733] hover:shadow-md
        ${selected ? 'border-[#FF5733] shadow-md' : 'border-gray-200'}
        flex flex-col items-center justify-center
        w-full aspect-[4/3]
      `}
    >
      <div className="flex flex-col items-center justify-center gap-3 w-full">
        <VehicleImage
          image={manufacturer.image}
          alt={manufacturer.name}
          size="small"
          selected={selected}
        />
        <h3 className="text-base font-medium text-gray-900 text-center line-clamp-2">{manufacturer.name}</h3>
      </div>
    </div>
  );
};

// Model Card Component
const ModelCard = ({ model, selected, onClick }: {
  model: VehicleModel;
  selected: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        border rounded-xl p-4 cursor-pointer transition
        hover:border-[#FF5733] hover:shadow-md
        ${selected ? 'border-[#FF5733] shadow-md' : 'border-gray-200'}
        flex flex-col items-center justify-center
        w-full aspect-[4/3]
      `}
    >
      <div className="flex flex-col items-center justify-center gap-3 w-full">
        <VehicleImage
          image={model.image}
          alt={model.name}
          size="small"
          selected={selected}
        />
        <div className="flex flex-col items-center">
          <h3 className="text-base font-medium text-gray-900 text-center line-clamp-2">{model.name}</h3>
          <p className="text-xs text-gray-500 text-center line-clamp-1">{model.manufacturer_name}</p>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ type, searchQuery }: { type: 'manufacturer' | 'model'; searchQuery?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-gray-50 rounded-full p-4 mb-4">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
      {searchQuery ? (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {type}s found</h3>
          <p className="text-gray-500 text-center">
            No {type}s match your search "{searchQuery}"
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {type}s available</h3>
          <p className="text-gray-500 text-center">
            {type === 'manufacturer' 
              ? 'No manufacturers are available for this vehicle type'
              : 'No models are available for this manufacturer and vehicle type'}
          </p>
        </>
      )}
    </div>
  );
};

const SelectVehicle = ({ onVehicleSelect, serviceId, initialVehicle }: SelectVehicleProps) => {
  // UI States
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');

  // Selection States
  const [selectedVehicleType, setSelectedVehicleType] = useState<number | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);

  // Data States
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);

  // Fetch vehicle types on mount
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        setLoading(true);
        const response = await apiService.vehicle.getTypes();
        console.log('Vehicle types response:', response.data);
        setVehicleTypes(response.data);
      } catch (err) {
        console.error('Error fetching vehicle types:', err);
        setError('Failed to load vehicle types');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleTypes();
  }, []);

  // Fetch manufacturers when vehicle type is selected
  useEffect(() => {
    const fetchManufacturers = async () => {
      if (!selectedVehicleType) return;
      
      try {
        setLoading(true);
        console.log('Fetching manufacturers...');
        
        // Make direct API call to verify
        const directResponse = await fetch('https://repairmybike.up.railway.app/api/repairing-service/manufacturers/');
        const directData = await directResponse.json();
        console.log('Direct API call response:', directData);
        
        // Use the direct API data since we know it's correct
        const manufacturers = directData.map((mfr: any) => ({
          id: mfr.id,
          name: mfr.name,
          image: mfr.image
        }));
        
        console.log('Processed manufacturers:', manufacturers);
        setManufacturers(manufacturers);
        
      } catch (err) {
        console.error('Error fetching manufacturers:', err);
        setError('Failed to load manufacturers');
      } finally {
        setLoading(false);
      }
    };

    if (step === 2) {
      fetchManufacturers();
    }
  }, [selectedVehicleType, step]);

  // Fetch models when manufacturer is selected
  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedManufacturer || !selectedVehicleType) return;
      
      try {
        setLoading(true);
        console.log('Fetching models...');
        
        // Make direct API call to verify
        const directResponse = await fetch('https://repairmybike.up.railway.app/api/vehicle/vehicle-models/');
        const directData = await directResponse.json();
        console.log('Direct API call response:', directData);
        
        // Filter and process the models
        const filteredModels = directData.filter(
          (model: VehicleModel) =>
            model.manufacturer === selectedManufacturer &&
            model.vehicle_type === selectedVehicleType
        );
        
        console.log('Filtered models:', filteredModels);
        setVehicleModels(filteredModels);
        
      } catch (err) {
        console.error('Error fetching models:', err);
        setError('Failed to load models');
      } finally {
        setLoading(false);
      }
    };

    if (step === 3) {
      fetchModels();
    }
  }, [selectedManufacturer, selectedVehicleType, step]);

  // Session Storage Restoration
  useEffect(() => {
    try {
      const savedVehicleType = sessionStorage.getItem('selectedVehicleType');
      const savedManufacturer = sessionStorage.getItem('selectedManufacturer');
      const savedModel = sessionStorage.getItem('selectedModel');

      if (savedVehicleType) setSelectedVehicleType(JSON.parse(savedVehicleType));
      if (savedManufacturer) setSelectedManufacturer(JSON.parse(savedManufacturer));
      if (savedModel) setSelectedModel(JSON.parse(savedModel));

      // Set step based on available data
      if (savedModel) {
        setStep(4);
      } else if (savedManufacturer) {
        setStep(3);
      } else if (savedVehicleType) {
        setStep(2);
      }
    } catch (err) {
      console.error('Error restoring session data:', err);
      sessionStorage.clear();
    }
  }, []);

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setSearchQuery('');
    }
  };

  const resetSelection = () => {
    setStep(1);
    setSelectedVehicleType(null);
    setSelectedManufacturer(null);
    setSelectedModel(null);
    setSearchQuery('');
    sessionStorage.clear();
    onVehicleSelect(null);
  };

  const handleVehicleTypeSelect = (type: VehicleType) => {
    setSelectedVehicleType(type.id);
    sessionStorage.setItem('selectedVehicleType', JSON.stringify(type.id));
    setStep(2);
  };

  const handleManufacturerSelect = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer.id);
    sessionStorage.setItem('selectedManufacturer', JSON.stringify(manufacturer.id));
    setStep(3);
  };

  const handleModelSelect = (model: VehicleModel) => {
    setSelectedModel(model.id);
    sessionStorage.setItem('selectedModel', JSON.stringify(model.id));
    onVehicleSelect({
      manufacturer: model.manufacturer_name,
      model: model.name,
      vehicleType: model.vehicle_type_name,
      manufacturerId: model.manufacturer,
      modelId: model.id
    });
    setStep(4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => setError(null)}
          className="px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#FF5733]/90 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-md">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 text-gray-600 hover:text-gray-900 active:bg-gray-100 
                           rounded-full touch-manipulation"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-1">
                {step === 1 && 'Select Vehicle Type'}
                {step === 2 && 'Select Manufacturer'}
                {step === 3 && 'Select Model'}
                {step === 4 && 'Vehicle Details'}
              </h2>
            </div>
            <button
              onClick={resetSelection}
              className="text-gray-500 hover:text-[#FF5733] active:bg-gray-50 transition
                       px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Step 1: Vehicle Types */}
        {!loading && !error && step === 1 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {vehicleTypes.map((type) => (
              <VehicleTypeCard
                key={type.id}
                type={type}
                selected={selectedVehicleType === type.id}
                onClick={() => handleVehicleTypeSelect(type)}
              />
            ))}
          </div>
        )}

        {/* Step 2: Manufacturers */}
        {!loading && !error && step === 2 && (
          <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm -mx-4 px-4 py-2 sm:mx-0">
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search manufacturers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                />
              </div>
            </div>
            {manufacturers.length === 0 ? (
              <EmptyState type="manufacturer" searchQuery={searchQuery} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {manufacturers
                  .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((manufacturer) => (
                    <ManufacturerCard
                      key={manufacturer.id}
                      manufacturer={manufacturer}
                      selected={selectedManufacturer === manufacturer.id}
                      onClick={() => handleManufacturerSelect(manufacturer)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Models */}
        {!loading && !error && step === 3 && (
          <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm -mx-4 px-4 py-2 sm:mx-0">
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                />
              </div>
            </div>
            {vehicleModels.length === 0 ? (
              <EmptyState type="model" searchQuery={searchQuery} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {vehicleModels
                  .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((model) => (
                    <ModelCard
                      key={model.id}
                      model={model}
                      selected={selectedModel === model.id}
                      onClick={() => handleModelSelect(model)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Selected Vehicle Details */}
        {!loading && !error && step === 4 && selectedModel && (
          <div className="max-w-xl mx-auto">
            <div className="border rounded-lg overflow-hidden">
              <div className="relative h-48 sm:h-56">
                {vehicleModels.find(m => m.id === selectedModel)?.image ? (
                  <img
                    src={getImageUrl(vehicleModels.find(m => m.id === selectedModel)?.image)}
                    alt="Selected vehicle"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Image load error:', vehicleModels.find(m => m.id === selectedModel)?.image);
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-6 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {vehicleModels.find(m => m.id === selectedModel)?.name}
                </h3>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Manufacturer:</span>{' '}
                  {vehicleModels.find(m => m.id === selectedModel)?.manufacturer_name}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Type:</span>{' '}
                  {vehicleModels.find(m => m.id === selectedModel)?.vehicle_type_name}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectVehicle;
