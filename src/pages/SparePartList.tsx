import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SparePart } from '../types/sparePart';
import apiService from '../config/api.config';
import { SparePartFilters } from '../components';
import type { SparePartFilters as SparePartFiltersType } from '../types/sparePart';
import { PackageSearch } from 'lucide-react';

const SparePartList = () => {
  const navigate = useNavigate();
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partCount, setPartCount] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const fetchSpareParts = async () => {
      try {
        setLoading(true);
        const data = await apiService.spareParts.getAll();
        setSpareParts(data);
        setPartCount(data.length);
      } catch (error) {
        console.error('Error fetching spare parts:', error);
        setError(error instanceof Error ? error.message : 'Failed to load spare parts');
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchSpareParts();
  }, []);

  const handleFiltersChange = async (filters: SparePartFiltersType) => {
    try {
      setLoading(true);
      const data = await apiService.spareParts.filter(filters);
      setSpareParts(data);
      setPartCount(data.length);
    } catch (error) {
      console.error('Error applying filters:', error);
      setError(error instanceof Error ? error.message : 'Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityBadgeClass = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'pre_order':
        return 'bg-amber-100 text-amber-800';
      case 'discontinued':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderEmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <PackageSearch className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Spare Parts Available
        </h3>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {initialLoad 
            ? "We're currently building our spare parts inventory. Please check back soon!"
            : "No spare parts match your current filters. Try adjusting your search criteria."}
        </p>
        {!initialLoad && (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF5733] hover:bg-[#ff4019] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733]"
          >
            Reset Filters
          </button>
        )}
      </motion.div>
    </div>
  );

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#FF5733] text-white px-4 py-2 rounded-lg hover:bg-[#ff4019] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filters Section */}
      <div className="sticky top-0 z-50 bg-gray-50 pt-6 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SparePartFilters onFiltersChange={handleFiltersChange} loading={loading} />
        </div>
      </div>

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {partCount > 0 && (
          <div className="text-sm text-gray-600 mb-4">
            {partCount} Spare Parts Found
          </div>
        )}

        {/* Spare Parts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm animate-pulse">
                <div className="aspect-[16/10] bg-gray-200 rounded-t-lg" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))
          ) : spareParts.length === 0 ? (
            renderEmptyState()
          ) : (
            spareParts.map(part => (
              <motion.div
                key={part.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer"
                onClick={() => navigate(`/spare-parts/${part.id}`)}
              >
                <div className="aspect-[16/10] relative">
                  <img
                    src={part.main_image}
                    alt={part.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityBadgeClass(
                      part.availability_status
                    )}`}
                  >
                    {part.status_display}
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900">{part.name}</h2>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span>{part.part_number}</span>
                    <span className="mx-2">•</span>
                    <span>{part.category.name}</span>
                  </div>
                  <div className="text-[#FF5733] font-semibold">
                    {part.display_price.formatted}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SparePartList;