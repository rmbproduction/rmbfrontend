import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VehicleFilters from '../components/VehicleFilters';
import { marketplaceService } from '../services/marketplaceService';

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  status: 'available' | 'sold' | 'under_inspection';
  kms_driven: number;
  image: string;
  fuel_type?: string;
}

const VehicleList = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicleCount, setVehicleCount] = useState(0);

  // Mock data - replace with API call
  const mockVehicles: Vehicle[] = [
    {
      id: '1',
      name: 'Royal Enfield Bullet',
      brand: 'Royal Enfield',
      model: 'Bullet',
      year: 2021,
      price: 34000,
      status: 'under_inspection',
      kms_driven: 34000,
      image: '/images/vehicles/bullet-1.jpg',
      fuel_type: 'petrol'
    },
    {
      id: '2',
      name: 'Honda Splender',
      brand: 'Honda',
      model: 'Splender',
      year: 2021,
      price: 34000,
      status: 'under_inspection',
      kms_driven: 34000,
      image: '/images/vehicles/splender.jpg',
      fuel_type: 'petrol'
    }
  ];

  const handleFiltersChange = (filters: any) => {
    setLoading(true);
    // Here you would make an API call with the filters
    // For now, we'll just simulate filtering the mock data
    const filteredVehicles = mockVehicles.filter(vehicle => {
      // Search filter
      if (filters.search && !vehicle.name.toLowerCase().includes(filters.search.toLowerCase())) {
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
      if (vehicle.price < filters.priceRange.min || vehicle.price > filters.priceRange.max) {
        return false;
      }

      // Year range filter
      if (vehicle.year < filters.yearRange.min || vehicle.year > filters.yearRange.max) {
        return false;
      }

      return true;
    });

    setTimeout(() => {
      setVehicles(filteredVehicles);
      setVehicleCount(filteredVehicles.length);
      setLoading(false);
    }, 300); // Reduced delay for better UX
  };

  useEffect(() => {
    // Initial load
    setVehicles(mockVehicles);
    setVehicleCount(mockVehicles.length);
    setLoading(false);
  }, []);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm animate-pulse">
                <div className="h-64 bg-gray-200 rounded-t-lg" />
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
              <div
                key={vehicle.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/vehicles/${vehicle.id}`)}
              >
                <div className="aspect-[16/10] relative">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      vehicle.status
                    )}`}
                  >
                    {vehicle.status.replace('_', ' ').charAt(0).toUpperCase() +
                      vehicle.status.slice(1)}
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">{vehicle.name}</h2>
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
                    ₹{vehicle.price.toLocaleString()}.00
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleList; 