import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, ArrowRight, Bike, Settings, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { categoryService } from '../services/apiService';

interface ServiceCategory {
  uuid: string;
  name: string;
  slug: string;
  image: string | null;
  description: string;
}

const ServicesPage = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchServiceCategories = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use the centralized API service
        const data = await categoryService.getCategories();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected an array of categories');
        }
        
        setCategories(data);
      } catch (err: any) {
        console.error('Error fetching service categories:', err);
        setError(err.message || 'An unexpected error occurred');
        toast.error('Failed to load service categories');
        
        // Remove fallback data
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServiceCategories();
  }, []);
  
  const getCategoryIcon = (slug: string) => {
    switch (slug.toLowerCase()) {
      case 'general-maintenance':
      case 'general-services':
        return <Wrench className="h-10 w-10 text-[#FF5733]" />;
      case 'engine-service':
      case 'engine':
        return <Settings className="h-10 w-10 text-[#FF5733]" />;
      case 'brake-service':
      case 'periodic-service':
        return <Bike className="h-10 w-10 text-[#FF5733]" />;
      default:
        return <Wrench className="h-10 w-10 text-[#FF5733]" />;
    }
  };
  
  const filteredCategories = searchQuery.trim() === '' 
    ? categories 
    : categories.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  
  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Our Services</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            We offer a wide range of services to keep your vehicle running at its best.
            Browse our categories below and find the service you need.
          </p>
          
          {/* Search Bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="relative">
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
        </motion.div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
          </div>
        ) : error && categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#FF5733] text-white px-6 py-2 rounded hover:bg-opacity-90 transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((category) => (
              <motion.div
                key={category.uuid}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    {getCategoryIcon(category.slug)}
                    <h2 className="ml-4 text-xl font-bold text-gray-900">{category.name}</h2>
                  </div>
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {category.description && category.description.length > 0 
                      ? category.description 
                      : "No description available"}
                  </p>
                  <Link
                    to={`/services/${category.uuid}`}
                    className="flex items-center text-[#FF5733] font-medium hover:text-[#E64A19] transition-colors"
                  >
                    View Services
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {!loading && filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No service categories found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;