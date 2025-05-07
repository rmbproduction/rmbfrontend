import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ServiceData } from '../data/services';
import { getServiceIcon } from '../data/services';
import { Clock, Shield, CheckCircle2, Car, MessageCircle, Bike } from 'lucide-react';
import { motion } from 'framer-motion';

interface ApiServiceData {
  uuid: string;
  slug: string;
  name: string;
  description?: string;
  features?: string[];
  packages?: Array<{
    id: number;
    name: string;
    price: number;
    duration: string;
    warranty: string;
    recommended: string;
    features: string[];
  }>;
}

const Services = () => {
  const navigate = useNavigate();
  const [servicesData, setServicesData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = 'http://127.0.0.1:8000/api/repairing_service/service-categories/';
        if (!url) {
          throw new Error('Service categories URL is not configured');
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch services: ${response.statusText}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected an array');
        }

        const formattedData: ServiceData[] = data
          .filter((item): item is ApiServiceData => {
            return (
              typeof item === 'object' &&
              item !== null &&
              typeof item.uuid === 'string' &&
              typeof item.slug === 'string' &&
              typeof item.name === 'string'
            );
          })
          .map((item) => ({
            id: item.uuid,
            iconName: item.slug.includes('battery') ? 'battery' : 
                    item.slug.includes('brake') ? 'alert' : 
                    item.slug.includes('engine') ? 'settings' : 
                    item.slug.includes('diag') ? 'gauge' : 
                    item.slug.includes('road') ? 'lifebuoy' : 'tool',
            title: item.name,
            description: item.description || 'No description available',
            features: Array.isArray(item.features) ? item.features : [],
            packages: Array.isArray(item.packages)
              ? item.packages.map((pkg) => ({
                  id: pkg.id,
                  name: pkg.name,
                  price: pkg.price,
                  duration: pkg.duration,
                  warranty: pkg.warranty,
                  recommended: pkg.recommended,
                  features: Array.isArray(pkg.features) ? pkg.features : [],
                }))
              : [],
          }));

        if (formattedData.length === 0) {
          throw new Error('No valid service data found in response');
        }

        if (mounted) {
          setServicesData(formattedData);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        if (mounted) {
          setError(
            error instanceof Error
              ? error.message
              : 'Unable to load services. Please try again later.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchServices();
  }, [mounted]);

  const handleServiceClick = (serviceId: string, event: React.MouseEvent) => {
    event.preventDefault();
    navigate(`/services/${serviceId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] space-y-4">
        <div className="text-red-600 text-center">
          <p className="font-medium">Error loading services</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#FF5733] text-white px-4 py-2 rounded-lg hover:bg-[#ff4019] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!servicesData.length) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] space-y-4">
        <div className="text-gray-600 text-center">
          <p className="font-medium">No services available</p>
          <p className="text-sm">Please check back later for our service offerings.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="py-16 bg-gray-50" id="services">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesData.map((service) => {
              const IconComponent = getServiceIcon(service.iconName);
              return (
                <div
                  key={service.id}
                  onClick={(e) => handleServiceClick(service.id, e)}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border border-transparent hover:border-[#FF5733] hover:border-opacity-20 relative group"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-[#FF5733] bg-opacity-10 rounded-lg">
                      <IconComponent className="w-6 h-6 text-[#FF5733]" />
                    </div>
                    <h3 className="text-xl font-semibold ml-3">{service.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    {service.description || `Complete ${service.title.toLowerCase()} solutions for your bike to keep it running at peak performance.`}
                  </p>
                  {service.features && service.features.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {service.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 bg-[#FF5733] rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                  {service.packages && service.packages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-900">
                        Starting from ₹{Math.min(...service.packages.map((pkg) => pkg.price))}
                      </p>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF5733] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-b-xl"></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Vehicle Services Section */}
      <section className="py-16 bg-gray-50" id="vehicle-services">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#FF5733] opacity-5 rounded-full"></div>
            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-[#FF5733] opacity-5 rounded-full"></div>
            
            <div className="relative">
              <motion.h2 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-3xl font-bold text-center mb-4"
              >
                Vehicle Marketplace
              </motion.h2>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="w-24 h-1 bg-[#FF5733] mx-auto mb-8"
              ></motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-gray-600 text-center text-lg mb-10 max-w-3xl mx-auto"
              >
                Looking to buy or sell a vehicle? Use our trusted marketplace platform to connect with verified buyers and sellers.
              </motion.p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="bg-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1 duration-300"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-[#FF5733] bg-opacity-10 rounded-lg">
                      <Bike className="w-8 h-8 text-[#FF5733]" />
                    </div>
                    <h3 className="text-xl font-semibold ml-4">Buy Vehicle</h3>
                  </div>
                  <p className="text-gray-600 mb-6 min-h-[4rem]">
                    Browse our collection of certified pre-owned and new vehicles from trusted sellers.
                  </p>
                  <div className="flex items-center text-sm text-gray-600 mb-6">
                    <span className="w-1.5 h-1.5 bg-[#FF5733] rounded-full mr-2"></span>
                    <span>Verified sellers</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-6">
                    <span className="w-1.5 h-1.5 bg-[#FF5733] rounded-full mr-2"></span>
                    <span>Detailed inspection reports</span>
                  </div>
                  <Link to="/vehicles" className="transform hover:scale-105 transition-transform inline-block bg-[#FF5733] text-white font-medium px-6 py-3 rounded-xl hover:shadow-xl w-full text-center">
                    Browse Vehicles
                  </Link>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="bg-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1 duration-300"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-[#FF5733] bg-opacity-10 rounded-lg">
                      <Bike className="w-8 h-8 text-[#FF5733]" />
                    </div>
                    <h3 className="text-xl font-semibold ml-4">Sell Vehicle</h3>
                  </div>
                  <p className="text-gray-600 mb-6 min-h-[4rem]">
                    List your vehicle for sale with our simple process and connect with potential buyers.
                  </p>
                  <div className="flex items-center text-sm text-gray-600 mb-6">
                    <span className="w-1.5 h-1.5 bg-[#FF5733] rounded-full mr-2"></span>
                    <span>Simple listing process</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-6">
                    <span className="w-1.5 h-1.5 bg-[#FF5733] rounded-full mr-2"></span>
                    <span>Connect with verified buyers</span>
                  </div>
                  <Link to="/sell-vehicle" className="transform hover:scale-105 transition-transform inline-block bg-[#FF5733] text-white font-medium px-6 py-3 rounded-xl hover:shadow-xl w-full text-center">
                    List Your Vehicle
                  </Link>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="bg-gray-50 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between border border-gray-100"
              >
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="p-3 bg-[#FF5733] bg-opacity-10 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-[#FF5733]" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Need More Information?</h4>
                    <p className="text-gray-600">Our AI chatbot is available 24/7 to answer your questions</p>
                  </div>
                </div>
                <button className="transform hover:scale-105 transition-transform bg-[#FF5733] text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl">
                  Chat With Us
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Services;
