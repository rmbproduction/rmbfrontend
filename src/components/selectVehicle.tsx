import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, Image as ImageIcon, IndianRupee, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { SelectedVehicle } from '../types/vehicle';

// Helper function to get image URL
const getImageUrl = (image: string | null | undefined): string | null => {
  if (!image) return null;
  
  // If it's already a full URL, return as is
  if (image.startsWith('http')) {
    return image;
  }
  
  // If it's a relative path, prepend the API base URL
  return `https://repairmybike.up.railway.app${image}`;
};

// Default placeholder component when no image is available
const ImagePlaceholder = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
    <ImageIcon className="w-6 h-6 text-gray-400" />
  </div>
);

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

const SelectVehicle = ({ onVehicleSelect, serviceId, initialVehicle }: SelectVehicleProps) => {
  const [step, setStep] = useState<number>(initialVehicle ? 3 : 1);
  const [selectedVehicleType, setSelectedVehicleType] = useState<number | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<number | null>(initialVehicle?.manufacturerId || null);
  const [selectedModel, setSelectedModel] = useState<number | null>(initialVehicle?.modelId || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<ServicePrice | null>(null);

  // Effect to handle initial vehicle
  useEffect(() => {
    if (initialVehicle) {
      setSelectedManufacturer(initialVehicle.manufacturerId || null);
      setSelectedModel(initialVehicle.modelId || null);
      setStep(3);
    }
  }, [initialVehicle]);

  // Fetch vehicle types
  const { data: vehicleTypes } = useQuery<VehicleType[]>({
    queryKey: ['vehicleTypes'],
    queryFn: async () => {
      const response = await fetch('https://repairmybike.up.railway.app/api/vehicle/vehicle-types/');
      return response.json();
    }
  });

  // Fetch manufacturers
  const { data: manufacturers } = useQuery<Manufacturer[]>({
    queryKey: ['manufacturers'],
    queryFn: async () => {
      const response = await fetch('https://repairmybike.up.railway.app/api/repairing-service/manufacturers/');
      return response.json();
    }
  });

  // Fetch vehicle models
  const { data: vehicleModels } = useQuery<VehicleModel[]>({
    queryKey: ['vehicleModels'],
    queryFn: async () => {
      const response = await fetch('https://repairmybike.up.railway.app/api/vehicle/vehicle-models/');
      return response.json();
    }
  });

  // Add price query
  const { data: priceData, isLoading: isPriceLoading } = useQuery<ServicePrice>({
    queryKey: ['servicePrice', serviceId, selectedManufacturer, selectedModel],
    queryFn: async () => {
      if (!serviceId || !selectedManufacturer || !selectedModel) return null;
      const response = await fetch(
        `https://repairmybike.up.railway.app/api/repairing-service/service-price/${serviceId}/?manufacturer_id=${selectedManufacturer}&vehicle_model_id=${selectedModel}`
      );
      return response.json();
    },
    enabled: !!(serviceId && selectedManufacturer && selectedModel),
  });

  const filteredManufacturers = manufacturers?.filter(m => 
    vehicleModels?.some(model => 
      model.manufacturer === m.id && 
      model.vehicle_type === selectedVehicleType
    )
  );

  const filteredModels = vehicleModels?.filter(
    model => 
      model.manufacturer === selectedManufacturer &&
      model.vehicle_type === selectedVehicleType &&
      model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    onVehicleSelect(null);
  };

  const handleModelSelect = (model: VehicleModel) => {
    setSelectedModel(model.id);
    
    // Call the parent component's handler with the selected vehicle details
    onVehicleSelect({
      manufacturer: model.manufacturer_name,
      model: model.name,
      vehicleType: model.vehicle_type_name,
      manufacturerId: model.manufacturer,
      modelId: model.id
    });

    // Store price data if available
    if (priceData) {
      setSelectedPrice(priceData);
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {vehicleTypes?.map(type => (
                <div
                  key={type.id}
                  className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:border-[#FF5733] transition-colors"
                  onClick={() => {
                    setSelectedVehicleType(type.id);
                    setStep(2);
                  }}
                >
                  {getImageUrl(type.image) ? (
                    <img 
                      src={getImageUrl(type.image) || ''} 
                      alt={type.name}
                      className="w-12 h-12 object-contain mb-2 rounded-lg" 
                    />
                  ) : (
                    <ImagePlaceholder />
                  )}
                  <p className="text-sm text-center">{type.name}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search Manufacturers"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {filteredManufacturers
                ?.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(manufacturer => (
                  <div
                    key={manufacturer.id}
                    className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:border-[#FF5733] transition-colors"
                    onClick={() => {
                      setSelectedManufacturer(manufacturer.id);
                      setStep(3);
                      setSearchQuery('');
                    }}
                  >
                    {getImageUrl(manufacturer.image) ? (
                      <img 
                        src={getImageUrl(manufacturer.image) || ''} 
                        alt={manufacturer.name}
                        className="w-12 h-12 object-contain mb-2 rounded-lg" 
                      />
                    ) : (
                      <ImagePlaceholder />
                    )}
                    <p className="text-sm text-center">{manufacturer.name}</p>
                  </div>
                ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search Models"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {filteredModels?.map(model => (
                <div
                  key={model.id}
                  className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:border-[#FF5733] transition-colors"
                  onClick={() => {
                    handleModelSelect(model);
                    setStep(4);
                  }}
                >
                  {getImageUrl(model.image) ? (
                    <img 
                      src={getImageUrl(model.image) || ''} 
                      alt={model.name}
                      className="w-24 h-16 object-contain mb-2 rounded-lg" 
                    />
                  ) : (
                    <ImagePlaceholder className="w-24 h-16" />
                  )}
                  <p className="text-sm text-center">{model.name}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        const selectedModelData = vehicleModels?.find(m => m.id === selectedModel);
        
        return (
          <div className="p-6 space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-4">
                {getImageUrl(selectedModelData?.image) ? (
                  <img
                    src={getImageUrl(selectedModelData?.image) || ''}
                    alt={selectedModelData?.name || ''}
                    className="w-20 h-16 object-contain rounded-lg"
                  />
                ) : (
                  <ImagePlaceholder className="w-20 h-16" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedModelData?.name}</h3>
                  <p className="text-gray-500 text-sm">
                    {selectedModelData?.manufacturer_name} - {selectedModelData?.vehicle_type_name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          <h2 className="text-lg font-semibold">
            {step === 1 && 'Choose Vehicle Type'}
            {step === 2 && 'Select Manufacturer'}
            {step === 3 && 'Select Model'}
            {step === 4 && 'Selected Vehicle'}
          </h2>
          <button
            onClick={resetSelection}
            className="text-gray-500 hover:text-[#FF5733] transition-colors flex items-center gap-1 text-sm"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {getStepContent()}
      </motion.div>
    </div>
  );
};

export default SelectVehicle;
