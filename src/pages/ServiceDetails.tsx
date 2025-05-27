import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Clock, Shield, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
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

const ServiceDetails = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedVehicle, setSelectedVehicle } = useVehicleSelection();

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
        manufacturerId: vehicle.manufacturerId || 0,
        modelId: vehicle.modelId || 0,
      });
    } else {
      setSelectedVehicle(null);
    }
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
    <div className="py-12 bg-gray-50">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-8">
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

        <div className="flex gap-8">
          {/* Left Side - Service Details */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#FFF5F2] rounded-xl flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-[#FF5733]" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{serviceCategory.name}</h1>
                    <p className="text-gray-600 mt-1">{serviceCategory.description}</p>
                  </div>
                </div>

                {/* Service Packages */}
                {filteredServices.length > 0 ? (
                  <div className="grid gap-8 mt-8">
                    {filteredServices.map((service, index) => {
                      const priceQuery = servicePriceQueries[index];
                      const priceData = priceQuery.data as ServicePrice | null;
                      const isPriceLoading = priceQuery.isLoading;

                      console.log(`Service ${service.id} Price Data:`, priceData);
                      console.log(`Service ${service.id} Loading:`, isPriceLoading);

                      return (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.2 }}
                          className="border border-gray-200 rounded-xl p-6"
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center text-gray-600">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {service.duration}
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Shield className="w-4 h-4 mr-1" />
                                  {service.warranty}
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                Recommended: {service.recommended}
                              </p>
                            </div>
                          </div>

                          {/* Price display logic */}
                          <div className="mt-6">
                            <div className="text-right">
                              <div className="flex flex-col items-end">
                                {!selectedVehicle ? (
                                  <div className="text-sm text-[#FF5733] font-medium">
                                    Select vehicle to view pricing
                                  </div>
                                ) : (
                                  <div className="flex justify-end items-center">
                                    {isPriceLoading ? (
                                      <div className="flex items-center">
                                        <Spin size="small" className="mr-2" />
                                        <span className="text-sm text-gray-500">Loading price...</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-end">
                                        <div className="flex items-center text-lg font-semibold text-gray-900">
                                          {priceData ? (
                                            <>
                                              <span>₹{parseFloat(priceData.price).toLocaleString('en-IN')}</span>
                                              {priceData.is_custom_price ? (
                                                <span className="ml-2 text-xs text-[#FF5733] font-normal">
                                                  Special price for {selectedVehicle.manufacturer} {selectedVehicle.model}
                                                </span>
                                              ) : (
                                                <span className="ml-2 text-xs text-gray-500 font-normal">
                                                  Standard price for {selectedVehicle.manufacturer} {selectedVehicle.model}
                                                </span>
                                              )}
                                            </>
                                          ) : (
                                            <>
                                              <span>₹{parseFloat(service.base_price).toLocaleString('en-IN')}</span>
                                              <span className="ml-2 text-xs text-gray-500 font-normal">
                                                Standard price for {selectedVehicle.manufacturer} {selectedVehicle.model}
                                              </span>
                                            </>
                                          )}
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

                          <div className="grid gap-3">
                            {service.features.map((feature) => (
                              <div key={feature.id} className="flex items-center text-gray-700">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                                {feature.name}
                              </div>
                            ))}
                          </div>
                          
                          {/* PackageActions with proper price passing */}
                          <div className="mt-8">
                            {!selectedVehicle ? (
                              <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <p className="text-gray-600 font-medium">👆 Please select your vehicle from the panel on the right to proceed</p>
                              </div>
                            ) : (
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
          </div>

          {/* Right Side - Vehicle Selection */}
          <div className="w-[400px] sticky top-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <SelectVehicle
                onVehicleSelect={handleVehicleSelect}
                serviceId={serviceId || ''}
                initialVehicle={selectedVehicle}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;