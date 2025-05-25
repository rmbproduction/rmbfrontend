import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Clock, Shield, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { services } from '../data/services';
import SelectVehicle from '../components/selectVehicle';
import PackageActions from '../components/PackageActions';

interface Vehicle {
  manufacturer: string;
  model: string;
  fuelType: string;
}

interface ServicePackage {
  id: string;
  name: string;
  duration: string;
  warranty: string;
  recommended: string;
  features: string[];
}

interface Service {
  id: string;
  icon: any;
  title: string;
  description: string;
  packages?: ServicePackage[];
  features?: string[];
}

const ServiceDetails = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Find the service data based on the ID
  const service = services.find(s => s.id === serviceId) as Service | undefined;

  if (!service) {
    return <div>Service not found</div>;
  }

  const IconComponent = service.icon;

  // Handler for when vehicle is selected
  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

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
                    <h1 className="text-3xl font-bold text-gray-900">{service.title}</h1>
                    <p className="text-gray-600 mt-1">{service.description}</p>
                  </div>
                </div>

                {/* Service Packages */}
                {service.packages ? (
                  <div className="grid gap-8 mt-8">
                    {service.packages.map((pkg: ServicePackage, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="border border-gray-200 rounded-xl p-6"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{pkg.name}</h3>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center text-gray-600">
                                <Clock className="w-4 h-4 mr-1" />
                                {pkg.duration} Taken
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Shield className="w-4 h-4 mr-1" />
                                {pkg.warranty}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Recommended: {pkg.recommended}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          {pkg.features.map((feature, i) => (
                            <div key={i} className="flex items-center text-gray-700">
                              <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                              {feature}
                            </div>
                          ))}
                        </div>
                        
                        {/* Add PackageActions */}
                        {selectedVehicle && serviceId && (
                          <PackageActions
                            serviceId={serviceId}
                            packageId={pkg.id}
                            serviceName={service.title}
                            packageName={pkg.name}
                            vehicle={selectedVehicle}
                            features={pkg.features}
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Features</h3>
                    <div className="grid gap-3">
                      {service.features?.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center text-gray-700"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                          {feature}
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Add PackageActions for non-package services */}
                    {selectedVehicle && serviceId && service.features && (
                      <div className="mt-6">
                        <PackageActions
                          serviceId={serviceId}
                          packageId={serviceId} // Using serviceId as packageId for non-package services
                          serviceName={service.title}
                          packageName={service.title} // Using service title as package name
                          vehicle={selectedVehicle}
                          features={service.features}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Side - Vehicle Selection */}
          <div className="w-[400px] sticky top-4 h-fit">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <SelectVehicle onVehicleSelect={handleVehicleSelect} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;