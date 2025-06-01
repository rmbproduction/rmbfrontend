import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VehicleFilters from '../components/VehicleFilters';
import { Vehicle } from '../types/vehicle';
import { motion } from 'framer-motion';

const VehicleList = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicleCount, setVehicleCount] = useState(0);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://repairmybike.up.railway.app/api/marketplace/vehicles/');
        if (!response.ok) {
          throw new Error('Failed to fetch vehicles');
        }
        const data = await response.json();
        setVehicles(data);
        setVehicleCount(data.length);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setError(error instanceof Error ? error.message : 'Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const handleFiltersChange = async (filters: any) => {
    try {
      setLoading(true);
      // TODO: Implement filter params in API call
      const response = await fetch('https://repairmybike.up.railway.app/api/marketplace/vehicles/');
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      const data = await response.json();
      
      // Client-side filtering until API supports filter parameters
      const filteredVehicles = data.filter((vehicle: Vehicle) => {
        // Search filter
        if (filters.search && !`${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }

        // Status filter
        if (filters.status.length > 0 && !filters.status.includes(vehicle.status)) {
          return false;
        }

        // Brand filter
        if (filters.brand.length > 0 && !filters.brand.includes(vehicle.brand.toLowerCase().replace(' ', '_'))) {
          return false;
        }

        // Price range filter
        if (vehicle.display_price.amount < filters.priceRange.min || vehicle.display_price.amount > filters.priceRange.max) {
          return false;
        }

        // Year range filter
        if (vehicle.year < filters.yearRange.min || vehicle.year > filters.yearRange.max) {
          return false;
        }

        return true;
      });

      setVehicles(filteredVehicles);
      setVehicleCount(filteredVehicles.length);
    } catch (error) {
      console.error('Error applying filters:', error);
      setError(error instanceof Error ? error.message : 'Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-red-100 text-red-800';
      case 'under_inspection':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          <VehicleFilters onFiltersChange={handleFiltersChange} loading={loading} />
        </div>
      </div>

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {vehicleCount > 0 && (
          <div className="text-sm text-gray-600 mb-4">
            {vehicleCount} Vehicles Found
          </div>
        )}

        {/* Vehicle Grid */}
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
          ) : vehicles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No vehicles found matching your criteria.</p>
            </div>
          ) : (
            vehicles.map(vehicle => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer"
                onClick={() => navigate(`/vehicles/${vehicle.id}`)}
              >
                <div className="aspect-[16/10] relative">
                  <img
                    src={vehicle.front_image_url}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      vehicle.status
                    )}`}
                  >
                    {vehicle.status_display}
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900">{vehicle.brand} {vehicle.model}</h2>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span>{vehicle.year}</span>
                    <span className="mx-2">•</span>
                    <span>{vehicle.kms_driven.toLocaleString()} km</span>
                    {vehicle.fuel_type && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{vehicle.fuel_type}</span>
                      </>
                    )}
                  </div>
                  <div className="text-[#FF5733] font-semibold">
                    {vehicle.display_price.formatted}
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

export default VehicleList; 