import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Bike, CheckCircle, XCircle, AlertCircle, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_CONFIG } from '../config/api.config';
import marketplaceService from '../services/marketplaceService';
import { Vehicle, VehicleFilterOptions, VehicleFilters } from '../types/vehicles';
import VehicleImage from '../components/VehicleImage';
import Thumbnail from '../components/Thumbnail';
import Pagination from '../components/Pagination';

// Extended vehicle interface with UI-specific properties
interface UIVehicle extends Vehicle {
  name: string;
  image?: string;
  formatted_price?: string;
  imageUrl?: string; // New field for front_image_url
  thumbnailPath: string | null;
}

const VehicleBuyPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<UIVehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<UIVehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState<VehicleFilterOptions>({
    status: [],
    brand: [],
    vehicle_type: [],
    price_range: {
      min: 0,
      max: 1000000
    },
    year_range: {
      min: 2000,
      max: new Date().getFullYear()
    }
  });

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<VehicleFilters | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 12
  });

  useEffect(() => {
    fetchVehicles();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (vehicles.length > 0) {
      applyFilters();
    }
  }, [searchQuery, filters, vehicles]);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the API service to fetch vehicles
      const availableVehicles = await marketplaceService.getAvailableVehicles();
      
      if (!availableVehicles || availableVehicles.length === 0) {
        setVehicles([]);
        setFilteredVehicles([]);
        setError('No vehicles available at this time.');
        setLoading(false);
        return;
      }
      
      // Normalize data structure with safe access patterns
      const normalizedVehicles = availableVehicles.map((vehicle: any) => {
        if (!vehicle) return null;
        
        // Use safe defaults for all fields
        return {
          ...vehicle,
          id: vehicle.id || '',
          name: vehicle.name || `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle',
          brand: vehicle.brand || '',
          model: vehicle.model || '',
          price: typeof vehicle.price === 'number' ? vehicle.price : 
                 (vehicle.display_price?.amount || 0),
          formatted_price: vehicle.formatted_price || 
                          vehicle.display_price?.formatted || 
                          `₹${(typeof vehicle.price === 'number' ? vehicle.price : 0).toLocaleString()}`,
          imageUrl: vehicle.imageUrl || null,
          year: vehicle.year || new Date().getFullYear(),
          vehicle_type: vehicle.vehicle_type || 'bike',
          status: vehicle.status || 'unavailable'
        };
      }).filter(Boolean); // Remove any null values
      
      setVehicles(normalizedVehicles);
      setFilteredVehicles(normalizedVehicles);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      setError('Failed to fetch vehicles. Please try again later.');
      setLoading(false);
      
      // Show error toast
      toast.error('Failed to load vehicles. Please try again.');
      
      // Set empty arrays to prevent undefined errors in the UI
      setVehicles([]);
      setFilteredVehicles([]);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const options = await marketplaceService.getVehicleFilters();
      setFilterOptions(options);
      
      // Set max price range from the API data
      if (options.price_ranges.length > 0) {
        const maxPrice = options.price_ranges[options.price_ranges.length - 1].max || 1000000;
        setFilters(prev => ({
          ...prev,
          price_range: {
            ...prev.price_range,
            max: maxPrice as number
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
      toast.error('Failed to load filter options.');
    }
  };

  const applyFilters = () => {
    let results = [...vehicles];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(vehicle => 
        `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(query) ||
        vehicle.brand.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        vehicle.registration_number?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      results = results.filter(vehicle => 
        filters.status && filters.status.includes(vehicle.status)
      );
    }
    
    // Apply brand filter
    if (filters.brand && filters.brand.length > 0) {
      results = results.filter(vehicle => 
        filters.brand && filters.brand.includes(vehicle.brand)
      );
    }
    
    // Apply vehicle type filter
    if (filters.vehicle_type && filters.vehicle_type.length > 0) {
      results = results.filter(vehicle => 
        filters.vehicle_type && filters.vehicle_type.includes(vehicle.vehicle_type)
      );
    }
    
    // Apply price range filter
    if (filters.price_range) {
      results = results.filter(vehicle => 
        vehicle.price >= (filters.price_range?.min || 0) && 
        vehicle.price <= (filters.price_range?.max || 1000000)
      );
    }
    
    // Apply year range filter
    if (filters.year_range) {
      results = results.filter(vehicle => 
        vehicle.year >= (filters.year_range?.min || 2000) && 
        vehicle.year <= (filters.year_range?.max || new Date().getFullYear())
      );
    }
    
    // Apply kms driven range filter if present
    if (filters.kms_driven_range) {
      results = results.filter(vehicle => 
        vehicle.kms_driven >= (filters.kms_driven_range?.min || 0) && 
        vehicle.kms_driven <= (filters.kms_driven_range?.max || 100000)
      );
    }
    
    setFilteredVehicles(results);
    
    // Update pagination
    setPagination(prev => ({
      ...prev,
      totalPages: Math.ceil(results.length / prev.pageSize),
      currentPage: 1 // Reset to first page when filters change
    }));
  };

  const handleStatusFilterChange = (status: 'available' | 'sold' | 'under_inspection' | 'pending') => {
    setFilters(prev => {
      const currentStatuses = [...(prev.status || [])];
      
      if (currentStatuses.includes(status)) {
        // Remove the status if already selected
        return {
          ...prev,
          status: currentStatuses.filter(s => s !== status)
        };
      } else {
        // Add the status if not already selected
        return {
          ...prev,
          status: [...currentStatuses, status]
        };
      }
    });
  };

  const handleBrandFilterChange = (brand: string) => {
    setFilters(prev => {
      const currentBrands = [...(prev.brand || [])];
      
      if (currentBrands.includes(brand)) {
        // Remove the brand if already selected
        return {
          ...prev,
          brand: currentBrands.filter(m => m !== brand)
        };
      } else {
        // Add the brand if not already selected
        return {
          ...prev,
          brand: [...currentBrands, brand]
        };
      }
    });
  };

  const handleVehicleTypeFilterChange = (type: string) => {
    setFilters(prev => {
      const currentTypes = [...(prev.vehicle_type || [])];
      
      if (currentTypes.includes(type)) {
        return {
          ...prev,
          vehicle_type: currentTypes.filter(t => t !== type)
        };
      } else {
        return {
          ...prev,
          vehicle_type: [...currentTypes, type]
        };
      }
    });
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      price_range: { min, max }
    }));
  };

  const handleYearRangeChange = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      year_range: { min, max }
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      brand: [],
      vehicle_type: [],
      price_range: {
        min: 0,
        max: filterOptions?.price_ranges[filterOptions.price_ranges.length - 1]?.max || 1000000
      },
      year_range: {
        min: 2000,
        max: new Date().getFullYear()
      }
    });
    setSearchQuery('');
  };

  const handleRefresh = () => {
    fetchVehicles();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'sold':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'under_inspection':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'sold':
        return 'Sold';
      case 'under_inspection':
        return 'Under Inspection';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const handleVehicleClick = (vehicleId: number) => {
    navigate(`/vehicles/${vehicleId}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        currentPage: newPage
      }));
    }
  };

  // Get current page of vehicles
  const getCurrentPageVehicles = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredVehicles.slice(startIndex, endIndex);
  };

  const getImageUrl = (vehicle: UIVehicle) => {
    // Check if vehicle has image_urls from the API response
    if (vehicle.image_urls?.main) {
      return vehicle.image_urls.main.startsWith('http') 
        ? vehicle.image_urls.main 
        : API_CONFIG.getMediaUrl(vehicle.image_urls.main);
    }
    
    // Check for thumbnail
    if (vehicle.image_urls?.thumbnail) {
      return vehicle.image_urls.thumbnail.startsWith('http') 
        ? vehicle.image_urls.thumbnail 
        : API_CONFIG.getMediaUrl(vehicle.image_urls.thumbnail);
    }
    
    // If the image is a full URL, use it
    if (vehicle.image && (vehicle.image.startsWith('http') || vehicle.image.startsWith('/'))) {
      return vehicle.image;
    }
    
    // Use API_CONFIG to generate correct media URL for backend images
    if (vehicle.photo_front) {
      return API_CONFIG.getMediaUrl(vehicle.photo_front);
    }
    
    // Fallback to image_url if available
    if (vehicle.image_url) {
      return API_CONFIG.getMediaUrl(vehicle.image_url);
    }
    
    // Final fallback to placeholder
    return API_CONFIG.getDefaultVehicleImage();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#FF5733] text-white px-4 py-2 rounded-lg hover:bg-[#ff4019] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Find Your Perfect Bike</h1>
          
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Search Box */}
              <div className="relative w-full md:w-1/2">
                <input
                  type="text"
                  placeholder="Search by name, manufacturer, model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-[#FFF5F2] text-[#FF5733] rounded-lg hover:bg-[#FFE5E0] transition-colors"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {/* Expanded Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 border-t border-gray-200 pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Status Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.status?.includes('available') || false}
                          onChange={() => handleStatusFilterChange('available')}
                          className="h-4 w-4 text-[#FF5733] focus:ring-[#FF5733] border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">Available</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.status?.includes('sold') || false}
                          onChange={() => handleStatusFilterChange('sold')}
                          className="h-4 w-4 text-[#FF5733] focus:ring-[#FF5733] border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">Sold</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.status?.includes('under_inspection') || false}
                          onChange={() => handleStatusFilterChange('under_inspection')}
                          className="h-4 w-4 text-[#FF5733] focus:ring-[#FF5733] border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">Under Inspection</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Brand Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Brand</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {filterOptions?.brands.map((brand) => (
                        <label key={brand} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.brand?.includes(brand) || false}
                            onChange={() => handleBrandFilterChange(brand)}
                            className="h-4 w-4 text-[#FF5733] focus:ring-[#FF5733] border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-600">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Price Range Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Price Range (₹)</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.price_range?.min || 0}
                          onChange={(e) => handlePriceRangeChange(Number(e.target.value), filters.price_range?.max || 1000000)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.price_range?.max || 1000000}
                          onChange={(e) => handlePriceRangeChange(filters.price_range?.min || 0, Number(e.target.value))}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Year Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Year</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <input
                          type="number"
                          placeholder="From"
                          value={filters.year_range?.min || 2000}
                          onChange={(e) => handleYearRangeChange(Number(e.target.value), filters.year_range?.max || new Date().getFullYear())}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="number"
                          placeholder="To"
                          value={filters.year_range?.max || new Date().getFullYear()}
                          onChange={(e) => handleYearRangeChange(filters.year_range?.min || 2000, Number(e.target.value))}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Filter Actions */}
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019] transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Results Count */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-900">
              {filteredVehicles.length} {filteredVehicles.length === 1 ? 'Vehicle' : 'Vehicles'} Found
            </h2>
          </div>
          
          {/* Vehicle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getCurrentPageVehicles().map((vehicle) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transform hover:scale-105 transition-transform hover:shadow-lg"
                onClick={() => handleVehicleClick(vehicle.id)}
              >
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {vehicle.imageUrl ? (
                    <img
                      src={vehicle.imageUrl}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/default-vehicle.jpg';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Bike className="h-16 w-16 text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">No image available</p>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex items-center px-2 py-1 bg-white bg-opacity-80 rounded-md shadow-sm">
                    <span className="text-xs font-medium text-gray-700">{getStatusText(vehicle.status)}</span>
                    <span className="ml-1">{getStatusIcon(vehicle.status)}</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-1">{vehicle.brand} {vehicle.model}</h3>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">{vehicle.year}</span>
                    <span className="text-sm text-gray-600">{vehicle.formatted_price || `₹${vehicle.price.toLocaleString()}`}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Bike className="h-4 w-4 mr-1" /> 
                    <span>{(vehicle.kms_driven || 0).toLocaleString()} km</span>
                    <span className="mx-2">•</span>
                    <span>{vehicle.fuel_type || 'Petrol'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {getCurrentPageVehicles().length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                  <img src="/assets/empty-results.svg" alt="No results" className="h-full w-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">No vehicles found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search filters</p>
                
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VehicleBuyPage;