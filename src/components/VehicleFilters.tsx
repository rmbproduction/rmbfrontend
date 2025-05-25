import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface FilterState {
  search: string;
  status: string[];
  brand: string[];
  priceRange: {
    min: number;
    max: number;
  };
  yearRange: {
    min: number;
    max: number;
  };
}

interface VehicleFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  loading?: boolean;
}

const VehicleFilters: React.FC<VehicleFiltersProps> = ({ onFiltersChange, loading = false }) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    brand: [],
    priceRange: {
      min: 0,
      max: 1000000
    },
    yearRange: {
      min: 2000,
      max: 2025
    }
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleStatusChange = (statusId: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(statusId)
        ? prev.status.filter(id => id !== statusId)
        : [...prev.status, statusId]
    }));
  };

  const handleBrandChange = (brandId: string) => {
    setFilters(prev => ({
      ...prev,
      brand: prev.brand.includes(brandId)
        ? prev.brand.filter(id => id !== brandId)
        : [...prev.brand, brandId]
    }));
  };

  const handlePriceChange = (value: string, type: 'min' | 'max') => {
    const numValue = value === '' ? (type === 'min' ? 0 : 1000000) : parseInt(value);
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: numValue
      }
    }));
  };

  const handleYearChange = (value: string, type: 'min' | 'max') => {
    const numValue = value === '' ? (type === 'min' ? 2000 : 2025) : parseInt(value);
    setFilters(prev => ({
      ...prev,
      yearRange: {
        ...prev.yearRange,
        [type]: numValue
      }
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: [],
      brand: [],
      priceRange: {
        min: 0,
        max: 1000000
      },
      yearRange: {
        min: 2000,
        max: 2025
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Search Bar and Filter Toggle */}
      <div className="flex items-center p-4 gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name, manufacturer, model..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 text-[#FF5733] hover:bg-[#fff8f6] rounded-lg"
        >
          <span className="mr-2">Filters</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border-t border-gray-200 p-4">
          <div className="grid gap-6">
            {/* Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Status</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status.includes('available')}
                    onChange={() => handleStatusChange('available')}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600">Available</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status.includes('sold')}
                    onChange={() => handleStatusChange('sold')}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600">Sold</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status.includes('under_inspection')}
                    onChange={() => handleStatusChange('under_inspection')}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600">Under Inspection</span>
                </label>
              </div>
            </div>

            {/* Brand */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Brand</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.brand.includes('royal_enfield')}
                    onChange={() => handleBrandChange('royal_enfield')}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600">Royal Enfield</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.brand.includes('honda')}
                    onChange={() => handleBrandChange('honda')}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600">Honda</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.brand.includes('hero')}
                    onChange={() => handleBrandChange('hero')}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600">Hero</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.brand.includes('yamaha')}
                    onChange={() => handleBrandChange('yamaha')}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600">Yamaha</span>
                </label>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Price Range (₹)</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filters.priceRange.min}
                  onChange={(e) => handlePriceChange(e.target.value, 'min')}
                  placeholder="0"
                  className="w-24 px-3 py-1 border border-gray-200 rounded-lg text-sm"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="number"
                  value={filters.priceRange.max}
                  onChange={(e) => handlePriceChange(e.target.value, 'max')}
                  placeholder="1000000"
                  className="w-24 px-3 py-1 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Year Range */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Year</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filters.yearRange.min}
                  onChange={(e) => handleYearChange(e.target.value, 'min')}
                  placeholder="2000"
                  min="2000"
                  max="2025"
                  className="w-24 px-3 py-1 border border-gray-200 rounded-lg text-sm"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="number"
                  value={filters.yearRange.max}
                  onChange={(e) => handleYearChange(e.target.value, 'max')}
                  placeholder="2025"
                  min="2000"
                  max="2025"
                  className="w-24 px-3 py-1 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-[#FF5733] text-white text-sm font-medium rounded-lg hover:bg-[#ff4019]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleFilters; 