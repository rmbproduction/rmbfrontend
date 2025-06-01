import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getIconForCategory } from '../data/services';
import { 
  Bike, 
  MessageCircle
} from 'lucide-react';

interface ServiceCategory {
  uuid: string;
  name: string;
  slug: string;
  image: string | null;
  description: string;
}

const Services: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: categories, isLoading } = useQuery<ServiceCategory[]>({
    queryKey: ['serviceCategories'],
    queryFn: async () => {
      const response = await fetch('https://repairmybike.up.railway.app/api/repairing-service/service-categories/');
      const data = await response.json();
      return data;
    }
  });

  const handleCategoryClick = (uuid: string) => {
    // First scroll to top
    window.scrollTo(0, 0);
    // Then navigate
    navigate(`/service/${uuid}`);
  };

  return (
    <>
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Our Services</h2>
            <p className="mt-4 text-xl text-gray-500">Professional bike care services at your doorstep</p>
          </div>

          {/* Expert Image Section */}
          <div className="relative mt-12 mb-16 rounded-2xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10"></div>
            <img
              src="https://res.cloudinary.com/dz81bjuea/image/upload/v1747031052/bikeExpert_qt2sfa.jpg"
              alt="Bike Expert at Work"
              className="w-full h-[300px] object-cover"
            />
            <div className="absolute top-1/2 left-8 transform -translate-y-1/2 z-20 text-white max-w-lg">
              <h3 className="text-3xl font-bold mb-4">Expert Mechanics</h3>
              <p className="text-lg">Our certified mechanics bring years of experience and expertise to every repair job, ensuring your bike gets the best care possible.</p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {categories?.map((category, index) => {
              const IconComponent = getIconForCategory(category.slug);
              return (
                <motion.div
                  key={category.uuid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isLoading ? 'opacity-50' : ''}`}
                  onClick={() => handleCategoryClick(category.uuid)}
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-[#FFF5F2] rounded-lg text-[#FF5733] mb-4">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-500">{category.description}</p>
                </motion.div>
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