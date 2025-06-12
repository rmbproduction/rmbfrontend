import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Spin } from 'antd';
import { apiService } from '../config/api.config';

// Types
interface SparePart {
  uuid: string;
  name: string;
  slug: string;
  part_number: string;
  category_name: string;
  price: number;
  discounted_price: number | null;
  availability_status: string;
  main_image: string;
  is_featured: boolean;
}

const FeaturedSpareParts = () => {
  const navigate = useNavigate();
  const [featuredParts, setFeaturedParts] = useState<SparePart[]>([]);
  
  // Query for getting spare parts
  const { isLoading, isError } = useQuery({
    queryKey: ['featuredSpareParts'],
    queryFn: async () => {
      try {
        // Get all parts first
        const data = await apiService.spareParts.getAllParts();
        // Filter to get featured parts or first 4 if not enough featured
        const featured = data.filter((part: SparePart) => part.is_featured);
        // If we have fewer than 4 featured parts, add non-featured until we reach 4
        const toDisplay = featured.length >= 4 ? featured.slice(0, 4) : 
          [...featured, ...data.filter((part: SparePart) => !part.is_featured).slice(0, 4 - featured.length)];
        setFeaturedParts(toDisplay);
        return data;
      } catch (error) {
        console.error("Failed to fetch spare parts:", error);
        throw error;
      }
    },
    enabled: true
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'limited_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormattedPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleViewPart = (uuid: string) => {
    navigate(`/spare-parts/${uuid}`);
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Featured Spare Parts</h2>
          <p className="mt-4 text-xl text-gray-500">Quality parts for your bike maintenance needs</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-red-500">Failed to load spare parts. Please try again later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredParts.map((part, index) => (
              <motion.div
                key={part.uuid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={part.main_image}
                    alt={part.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                  {part.discounted_price && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Sale
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#FF5733] transition-colors">{part.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{part.category_name}</p>
                  <div className="flex items-center mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(part.availability_status)}`}>
                      {part.availability_status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      {part.discounted_price ? (
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-gray-900">{getFormattedPrice(part.discounted_price)}</span>
                          <span className="ml-2 text-sm line-through text-gray-500">{getFormattedPrice(part.price)}</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">{getFormattedPrice(part.price)}</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleViewPart(part.uuid)}
                      className="flex-1 bg-[#FF5733] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#E64A19] transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        <div className="text-center mt-10">
          <button 
            onClick={() => navigate('/spare-parts')}
            className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            View All Parts
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSpareParts; 