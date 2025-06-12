import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Shield, CheckCircle2, RotateCcw, Wrench, Filter, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Spin } from 'antd';
import { axiosInstance, apiService } from '../config/api.config';
import { notification } from 'antd';

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

// Detailed spare part interface
interface SparePartDetail {
  uuid: string;
  name: string;
  slug: string;
  part_number: string;
  category: string;
  category_details: {
    uuid: string;
    name: string;
    slug: string;
    description: string;
  };
  description: string;
  features: string;
  specifications: Record<string, any>;
  price: number;
  discounted_price: number | null;
  stock_quantity: number;
  availability_status: string;
  manufacturers: string[];
  manufacturers_details: Array<{
    uuid: string;
    name: string;
  }>;
  vehicle_models: string[];
  vehicle_models_details: Array<{
    uuid: string;
    name: string;
  }>;
  vehicle_types: string[];
  vehicle_types_details: Array<{
    uuid: string;
    name: string;
  }>;
  main_image: string;
  additional_images: string[];
  average_rating: number | null;
  review_count: number;
}

// Filter Types
interface Filters {
  priceRange: { min: number; max: number };
  brands: string[];
  categories: string[];
  status: string[];
}

// Using apiService from api.config.ts

// Update mock data to match new interface for testing
const MOCK_SPARE_PARTS: SparePart[] = [
  {
    uuid: "1",
    name: "Bicycle Chain",
    slug: "bicycle-chain",
    part_number: "BCP-001",
    category_name: "Drivetrain",
    price: 1299,
    discounted_price: null,
    availability_status: "in_stock",
    main_image: "https://m.media-amazon.com/images/I/71sMlNFzpVL._AC_UF894,1000_QL80_.jpg",
    is_featured: true
  },
  {
    uuid: "2",
    name: "Brake Pads",
    slug: "brake-pads",
    part_number: "BRP-002",
    category_name: "Brakes",
    price: 499,
    discounted_price: null,
    availability_status: "limited_stock",
    main_image: "https://m.media-amazon.com/images/I/61DRe3KYchL._AC_UF894,1000_QL80_.jpg",
    is_featured: false
  },
  {
    uuid: "3",
    name: "Handlebar Grips",
    slug: "handlebar-grips",
    part_number: "HBG-003",
    category_name: "Handlebars",
    price: 799,
    discounted_price: 699,
    availability_status: "in_stock",
    main_image: "https://m.media-amazon.com/images/I/61dCJcGqNhL._AC_UF1000,1000_QL80_.jpg",
    is_featured: true
  },
  {
    uuid: "4",
    name: "Front Derailleur",
    slug: "front-derailleur",
    part_number: "FDR-004",
    category_name: "Drivetrain",
    price: 1899,
    discounted_price: null,
    availability_status: "out_of_stock",
    main_image: "https://m.media-amazon.com/images/I/61XwkXrNUNL._AC_UF894,1000_QL80_.jpg",
    is_featured: false
  }
];

// Updated helper functions for the new interface
const getUniqueValues = (parts: SparePart[], key: keyof SparePart): string[] => {
  // @ts-ignore - This is a workaround to handle dynamic keys
  const values = parts.map(part => part[key]);
  return [...new Set(values)].filter(Boolean) as string[];
};

// Price range from data
const getPriceRange = (parts: SparePart[]): { min: number; max: number } => {
  const prices = parts.map(part => part.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
};

// Filter Component
const SparePartFilters = ({ 
  filters, 
  setFilters, 
  availableBrands, 
  availableCategories, 
  priceRange, 
  applyFilters 
}: { 
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  availableBrands: string[];
  availableCategories: string[];
  priceRange: { min: number; max: number };
  applyFilters: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: value
      }
    }));
  };

  const handleBrandToggle = (brand: string) => {
    setFilters(prev => {
      const newBrands = prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand];
      
      return {
        ...prev,
        brands: newBrands
      };
    });
  };

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      
      return {
        ...prev,
        categories: newCategories
      };
    });
  };

  const handleStatusToggle = (status: string) => {
    setFilters(prev => {
      const newStatus = prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status];
      
      return {
        ...prev,
        status: newStatus
      };
    });
  };

  const resetFilters = () => {
    setFilters({
      priceRange: { min: priceRange.min, max: priceRange.max },
      brands: [],
      categories: [],
      status: []
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-[#FF5733] hover:underline"
        >
          {isOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
              {/* Price Range */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Price Range</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.priceRange.min}
                    onChange={(e) => handlePriceChange('min', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min={priceRange.min}
                    max={filters.priceRange.max}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    value={filters.priceRange.max}
                    onChange={(e) => handlePriceChange('max', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min={filters.priceRange.min}
                    max={priceRange.max}
                  />
                </div>
              </div>

              {/* Brands */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Brands</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {availableBrands.map(brand => (
                    <div key={brand} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`brand-${brand}`}
                        checked={filters.brands.includes(brand)}
                        onChange={() => handleBrandToggle(brand)}
                        className="mr-2"
                      />
                      <label htmlFor={`brand-${brand}`} className="text-sm text-gray-700">{brand}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Categories</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {availableCategories.map(category => (
                    <div key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`category-${category}`}
                        checked={filters.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="mr-2"
                      />
                      <label htmlFor={`category-${category}`} className="text-sm text-gray-700">{category}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Availability</h4>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="status-in_stock"
                      checked={filters.status.includes('in_stock')}
                      onChange={() => handleStatusToggle('in_stock')}
                      className="mr-2"
                    />
                    <label htmlFor="status-in_stock" className="text-sm text-gray-700">In Stock</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="status-limited_stock"
                      checked={filters.status.includes('limited_stock')}
                      onChange={() => handleStatusToggle('limited_stock')}
                      className="mr-2"
                    />
                    <label htmlFor="status-limited_stock" className="text-sm text-gray-700">Limited Stock</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="status-out_of_stock"
                      checked={filters.status.includes('out_of_stock')}
                      onChange={() => handleStatusToggle('out_of_stock')}
                      className="mr-2"
                    />
                    <label htmlFor="status-out_of_stock" className="text-sm text-gray-700">Out of Stock</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019]"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main component
const SpareParts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use state for parts data
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  
  // Fetch data with React Query
  const { isLoading: isPartsLoading } = useQuery({
    queryKey: ['spareParts'],
    queryFn: async () => {
      try {
        const data = await apiService.spareParts.getAllParts();
        setSpareParts(data);
        return data;
      } catch (err) {
        setError('Failed to load spare parts');
        return [];
      }
    },
  });
  
  // Get available manufacturers from spare parts
  const getManufacturers = (parts: SparePart[]) => {
    const manufacturers = new Set<string>();
    parts.forEach(part => {
      // In a real implementation, we would extract from manufacturers_details
      // For mock data, we'll leave this empty for now
    });
    return Array.from(manufacturers);
  };

  // Get available categories from spare parts
  const getCategories = (parts: SparePart[]) => {
    return [...new Set(parts.map(part => part.category_name))];
  };
  
  // Filter states
  const availableManufacturers = getManufacturers(spareParts.length ? spareParts : MOCK_SPARE_PARTS);
  const availableCategories = getCategories(spareParts.length ? spareParts : MOCK_SPARE_PARTS);
  const defaultPriceRange = getPriceRange(spareParts.length ? spareParts : MOCK_SPARE_PARTS);
  
  const [filters, setFilters] = useState<Filters>({
    priceRange: defaultPriceRange,
    brands: [],
    categories: [],
    status: []
  });
  
  const [filteredParts, setFilteredParts] = useState<SparePart[]>(spareParts.length ? spareParts : MOCK_SPARE_PARTS);

  // Update filtered parts when spareParts changes
  useEffect(() => {
    if (spareParts.length > 0) {
      setFilteredParts(spareParts);
    }
  }, [spareParts]);

  // Apply filters function
  const applyFilters = () => {
    setLoading(true);
    
    setTimeout(() => {
      const filtered = (spareParts.length ? spareParts : MOCK_SPARE_PARTS).filter(part => {
        // Price range filter
        if (part.price < filters.priceRange.min || part.price > filters.priceRange.max) {
          return false;
        }
        
        // Brand/Manufacturer filter - would use manufacturers_details in real implementation
        if (filters.brands.length > 0) {
          // Skip this filter for now as we don't have manufacturer data in SparePart interface
          // In real implementation, check part.manufacturers_details
        }
        
        // Category filter
        if (filters.categories.length > 0 && !filters.categories.includes(part.category_name)) {
          return false;
        }
        
        // Status filter
        if (filters.status.length > 0 && !filters.status.includes(part.availability_status)) {
          return false;
        }
        
        return true;
      });
      
      setFilteredParts(filtered);
      setLoading(false);
    }, 300);
  };

  // Filter spare parts based on search query
  const displayedParts = filteredParts.filter(part => 
    part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.part_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'limited_stock':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormattedPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
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
      {/* Search Bar */}
      <div className="sticky top-0 z-50 bg-gray-50 pt-6 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-xl mx-auto mb-4">
            <input
              type="text"
              placeholder="Search spare parts..."
              className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <SparePartFilters 
          filters={filters}
          setFilters={setFilters}
          availableBrands={availableManufacturers}
          availableCategories={availableCategories}
          priceRange={defaultPriceRange}
          applyFilters={applyFilters}
        />

        {/* Results Count */}
        {displayedParts.length > 0 && (
          <div className="text-sm text-gray-600 mb-4">
            {displayedParts.length} Spare Parts Found
          </div>
        )}

        {/* Spare Parts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isPartsLoading || loading ? (
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
          ) : displayedParts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No spare parts found matching your criteria.</p>
            </div>
          ) : (
            displayedParts.map(part => (
              <motion.div
                key={part.uuid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer"
                onClick={() => navigate(`/spare-parts/${part.uuid}`)}
              >
                <div className="aspect-[16/10] relative">
                  <img
                    src={part.main_image}
                    alt={part.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      part.availability_status
                    )}`}
                  >
                    {part.availability_status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900">{part.name}</h2>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span>{part.category_name}</span>
                    <span className="mx-2">•</span>
                    <span>{part.part_number}</span>
                  </div>
                  <div className="text-[#FF5733] font-semibold">
                    {part.discounted_price ? (
                      <>
                        <span className="line-through text-gray-400 mr-2">{getFormattedPrice(part.price)}</span>
                        {getFormattedPrice(part.discounted_price)}
                      </>
                    ) : (
                      getFormattedPrice(part.price)
                    )}
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

// Detail view component
const SparePartDetail = () => {
  const { partId } = useParams<{ partId: string }>();
  const [loading, setLoading] = useState(true);
  const [sparePart, setSparePart] = useState<SparePartDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Removed cart and purchasing states
  const navigate = useNavigate();
  
  // Fetch part details
  useEffect(() => {
    const fetchPartDetails = async () => {
      if (!partId) return;
      
      setLoading(true);
      try {
        const data = await apiService.spareParts.getPartDetail(partId);
        setSparePart(data);
      } catch (err) {
        setError('Failed to load spare part details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPartDetails();
    
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }, [partId]);

  // Status badge class helper function
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'limited_stock':
      case 'pre_order':
        return 'bg-amber-100 text-amber-800';
      case 'discontinued':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format price
  const getFormattedPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Get status display name
  const getStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Removed cart and purchase functionality
  // Users will now contact directly to buy parts

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-xl text-gray-600">Loading spare part details...</div>
      </div>
    );
  }

  if (error || !sparePart) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Spare part not found'}</p>
          <button
            onClick={() => navigate('/spare-parts')}
            className="bg-[#FF5733] text-white px-4 py-2 rounded-lg hover:bg-[#ff4019] transition-colors"
          >
            Back to Spare Parts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-12 bg-gray-50">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FFF5F2] rounded-xl flex items-center justify-center flex-shrink-0">
                <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF5733]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{sparePart.name}</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">{sparePart.category_details.name} • {sparePart.part_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left column - Image */}
              <div>
                <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  <img 
                    src={sparePart.main_image} 
                    alt={sparePart.name}
                    className="w-full h-auto object-cover"
                  />
                </div>
                {sparePart.additional_images && sparePart.additional_images.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {sparePart.additional_images.slice(0, 4).map((img, index) => (
                      <div key={index} className="rounded-lg overflow-hidden border border-gray-100">
                        <img src={img} alt={`${sparePart.name} ${index + 1}`} className="w-full h-auto object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right column - Details */}
              <div>
                <div className="bg-gray-50 p-6 rounded-xl mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Price</h3>
                    <span className="text-2xl font-bold text-[#FF5733]">
                      {sparePart.discounted_price ? (
                        <>
                          <span className="line-through text-gray-400 mr-2 text-lg">{getFormattedPrice(sparePart.price)}</span>
                          {getFormattedPrice(sparePart.discounted_price)}
                        </>
                      ) : (
                        getFormattedPrice(sparePart.price)
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(sparePart.availability_status)}`}>
                      {getStatusDisplay(sparePart.availability_status)}
                    </span>
                    {sparePart.stock_quantity > 0 && (
                      <span className="text-xs text-gray-500">
                        {sparePart.stock_quantity} in stock
                      </span>
                    )}
                  </div>

                  {/* Display manufacturer info if available */}
                  {sparePart.manufacturers_details && sparePart.manufacturers_details.length > 0 && (
                    <div className="mt-4 text-sm text-gray-600">
                      <span className="font-medium">Manufacturer:</span> {sparePart.manufacturers_details.map(m => m.name).join(', ')}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700">{sparePart.description}</p>
                </div>

                {/* Features section */}
                {sparePart.features && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                    <div className="prose prose-sm max-w-none">
                      {sparePart.features.split('\n').map((feature, index) => (
                        <div key={index} className="flex items-start mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vehicle compatibility */}
                {sparePart.vehicle_models_details && sparePart.vehicle_models_details.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Compatible With</h3>
                    <div className="flex flex-wrap gap-2">
                      {sparePart.vehicle_models_details.map((model, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                          {model.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specifications */}
                {sparePart.specifications && Object.keys(sparePart.specifications).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(sparePart.specifications).map(([key, value], index) => (
                        <div key={index} className="flex flex-col">
                          <span className="text-xs text-gray-500">{key}</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 space-y-4">
                  {/* Message box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <p className="text-blue-800 font-medium">Interested in this part?</p>
                    <p className="text-blue-600 text-sm mt-1">Contact us directly to purchase or inquire about this spare part.</p>
                  </div>
                  
                  {/* Contact buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <a 
                      href="tel:8168121711"
                      className="flex items-center justify-center gap-2 bg-[#FF5733] text-white py-3 rounded-xl font-medium hover:bg-[#ff4019] transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      Call Now
                    </a>
                    <a 
                      href={`https://wa.me/918168121711?text=I'm%20interested%20in%20buying%20the%20spare%20part:%20${encodeURIComponent(sparePart?.name || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Export both components
export { SpareParts as default, SparePartDetail }; 