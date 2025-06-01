import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Clock, Shield, CheckCircle2, Car, RotateCcw, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import SelectVehicle from '../components/selectVehicle';
import PackageActions from '../components/PackageActions';
import { getIconForCategory } from '../data/services';
import { SelectedVehicle } from '../types/vehicle';
import { useServicePrices, ServicePrice } from '../hooks/useServicePrice';
import { Spin } from 'antd';
import { useVehicleSelection } from '../hooks/vehicle/useVehicleSelection';

interface ServiceFeature {
  id: number;
  name: string;
}

interface ServiceDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  duration: string;
  warranty: string;
  recommended: string;
  category: string;
  manufacturers: number[];
  vehicles_models: number[];
  features: ServiceFeature[];
  image: string | null;
  image_url: string | null;
}

interface ServiceCategory {
  uuid: string;
  name: string;
  slug: string;
  image: string | null;
  description: string;
  services: ServiceDetail[];
}

// Vehicle Select Button/Card Component
const VehicleSelectButton = ({ 
  selectedVehicle, 
  onOpenModal,
  onReset
}: { 
  selectedVehicle: SelectedVehicle | null;
  onOpenModal: () => void;
  onReset: () => void;
}) => {
  if (!selectedVehicle) {
    return (
      <button
        onClick={onOpenModal}
        className="px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#FF5733]/90 transition-colors ml-2"
      >
        Select Vehicle
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div 
        onClick={onOpenModal}
        className="inline-flex items-center gap-3 px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-[#FF5733] transition-colors"
      >
        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
          <Car className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{selectedVehicle.model}</span>
          <span className="text-xs text-gray-500">{selectedVehicle.manufacturer}</span>
        </div>
      </div>
      <button
        onClick={onReset}
        className="p-2 text-gray-400 hover:text-[#FF5733] hover:bg-gray-50 rounded-full transition-colors"
        title="Reset vehicle selection"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};

// Vehicle Select Modal Component
const VehicleSelectModal = ({
  isOpen,
  onClose,
  onVehicleSelect,
  serviceId,
  initialVehicle
}: {
  isOpen: boolean;
  onClose: () => void;
  onVehicleSelect: (vehicle: SelectedVehicle | null) => void;
  serviceId: string;
  initialVehicle: SelectedVehicle | null;
}) => {
  if (!isOpen) return null;

  const handleVehicleSelect = (vehicle: SelectedVehicle | null) => {
    if (vehicle) {
      onVehicleSelect(vehicle);
    } else {
      onVehicleSelect(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
          <SelectVehicle
            onVehicleSelect={handleVehicleSelect}
            serviceId={serviceId}
            initialVehicle={initialVehicle}
          />
        </div>
      </div>
    </div>
  );
};

const ServiceDetails = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedVehicle, setSelectedVehicle } = useVehicleSelection();
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // Add effect to scroll to top when component mounts or serviceId changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant' // Use instant instead of smooth for immediate scroll
    });
  }, [serviceId]); // Re-run when serviceId changes

  // Fetch service category data
  const { data: serviceCategory, isLoading, error } = useQuery<ServiceCategory>({
    queryKey: ['serviceCategory', serviceId],
    queryFn: async () => {
      try {
        // Use query parameter to filter by UUID
        const response = await fetch(`https://repairmybike.up.railway.app/api/repairing-service/service-categories/?id=${serviceId}`);
        const categories = await response.json();
        
        // Find the matching category
        const category = categories.find((cat: ServiceCategory) => cat.uuid === serviceId);
        
        if (!category) {
          throw new Error('Service category not found');
        }
        
        return category;
      } catch (error) {
        console.error('Error fetching service category:', error);
        throw error;
      }
    },
    enabled: !!serviceId,
    retry: 1, // Only retry once on failure
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (!serviceCategory) return [];
    return serviceCategory.services.filter(service => 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [serviceCategory, searchQuery]);

  // Fetch prices for all filtered services
  const servicePriceQueries = useServicePrices(
    filteredServices.map(service => service.id),
    selectedVehicle?.manufacturerId,
    selectedVehicle?.modelId
  );

  // Add debug logging
  console.log('Selected Vehicle:', selectedVehicle);
  console.log('Service Price Queries:', servicePriceQueries);

  // Handler for when vehicle is selected
  const handleVehicleSelect = (vehicle: SelectedVehicle | null) => {
    if (vehicle) {
      setSelectedVehicle({
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        vehicleType: vehicle.vehicleType,
        manufacturerId: vehicle.manufacturerId ?? 0,
        modelId: vehicle.modelId ?? 0,
      });
    } else {
      setSelectedVehicle(null);
    }
  };

  // Add reset handler
  const handleResetVehicle = () => {
    setSelectedVehicle(null);
    setIsVehicleModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-xl text-gray-600">Loading service details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-600">
          Error loading service details. Please try again later.
        </div>
      </div>
    );
  }

  if (!serviceCategory) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Service category not found</div>
      </div>
    );
  }

  const IconComponent = getIconForCategory(serviceCategory.slug);

  return (
    <div className="py-6 sm:py-12 bg-gray-50">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search services..."
              className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FFF5F2] rounded-xl flex items-center justify-center flex-shrink-0">
                {IconComponent && <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF5733]" />}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{serviceCategory.name}</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">{serviceCategory.description}</p>
              </div>
            </div>

            {/* Service Packages */}
            {filteredServices.length > 0 ? (
              <div className="grid gap-6 sm:gap-8 mt-6 sm:mt-8">
                {filteredServices.map((service, index) => {
                  const priceQuery = servicePriceQueries[index];
                  const priceData = priceQuery.data as ServicePrice | null;
                  const isPriceLoading = priceQuery.isLoading;

                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className="border border-gray-200 rounded-xl p-4 sm:p-6"
                    >
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-4">
                        <div className="w-full lg:w-3/5">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{service.name}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="w-4 h-4 mr-1" />
                              {service.duration}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Shield className="w-4 h-4 mr-1" />
                              {service.warranty}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2 mb-3">
                            Recommended: {service.recommended}
                          </p>

                          <div className="grid gap-2">
                            {service.features.map((feature) => (
                              <div key={feature.id} className="flex items-center text-sm text-gray-700">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                {feature.name}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="w-full lg:w-2/5">
                          <div className="flex flex-col items-center lg:items-end">
                            {!selectedVehicle ? (
                              <div className="text-sm text-[#FF5733] font-medium text-center lg:text-right">
                                <div className="w-full sm:w-48 h-48 rounded-2xl overflow-hidden bg-white mb-2 border-2 border-gray-100 shadow-sm hover:border-[#FF5733]/20 transition-colors mx-auto lg:mx-0">
                                  <img 
                                    src={service.image_url || 'https://res.cloudinary.com/dz81bjuea/image/upload/v1748293273/service_images/w9lk6pnvvhnsp4dxhgop.png'} 
                                    alt="Service illustration"
                                    className="w-full h-full object-contain p-2"
                                  />
                                </div>
                                Select vehicle to view pricing
                              </div>
                            ) : (
                              <div className="flex flex-col items-center lg:items-end">
                                {isPriceLoading ? (
                                  <div className="flex items-center">
                                    <Spin size="small" className="mr-2" />
                                    <span className="text-sm text-gray-500">Loading price...</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center lg:items-end">
                                    <div className="flex flex-col lg:flex-row items-center lg:items-end text-lg font-semibold text-gray-900">
                                      <span>₹{parseFloat(priceData?.price || service.base_price).toLocaleString('en-IN')}</span>
                                      <span className="text-xs text-gray-500 font-normal mt-1 lg:mt-0 lg:ml-2">
                                        {priceData?.is_custom_price ? 'Special' : 'Standard'} price for {selectedVehicle.manufacturer} {selectedVehicle.model}
                                      </span>
                                    </div>
                                    {priceData?.is_custom_price && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Regular price: ₹{parseFloat(service.base_price).toLocaleString('en-IN')}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        {!selectedVehicle ? (
                          <div className="bg-gray-50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <p className="text-sm text-gray-600 font-medium text-center">👆 Please select your vehicle to proceed</p>
                            <VehicleSelectButton 
                              selectedVehicle={null} 
                              onOpenModal={() => setIsVehicleModalOpen(true)}
                              onReset={handleResetVehicle}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 rounded-lg p-4">
                            <VehicleSelectButton 
                              selectedVehicle={selectedVehicle} 
                              onOpenModal={() => setIsVehicleModalOpen(true)}
                              onReset={handleResetVehicle}
                            />
                            <PackageActions
                              serviceId={service.id.toString()}
                              packageId={undefined}
                              serviceName={service.name}
                              vehicleManufacturerId={selectedVehicle.manufacturerId}
                              vehicleModelId={selectedVehicle.modelId}
                              vehicleManufacturer={selectedVehicle.manufacturer}
                              vehicleModel={selectedVehicle.model}
                              vehicleType={selectedVehicle.vehicleType}
                              price={priceData ? priceData.price : service.base_price}
                              features={service.features.map(f => f.name)}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 text-center text-gray-500">
                {searchQuery ? 'No services found matching your search.' : 'No services available at the moment.'}
              </div>
            )}
          </div>
        </motion.div>

        {/* Vehicle Select Modal */}
        <AnimatePresence>
          <VehicleSelectModal
            isOpen={isVehicleModalOpen}
            onClose={() => setIsVehicleModalOpen(false)}
            onVehicleSelect={handleVehicleSelect}
            serviceId={serviceId || ''}
            initialVehicle={selectedVehicle || null}
          />
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ServiceDetails;