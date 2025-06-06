import { useState, useEffect } from 'react';
import { SparePartFilters as SparePartFiltersType } from '../types/sparePart';
import apiService from '../config/api.config';

interface SparePartFiltersProps {
  onFiltersChange: (filters: SparePartFiltersType) => void;
  loading: boolean;
}

const SparePartFilters: React.FC<SparePartFiltersProps> = ({ onFiltersChange, loading }) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [manufacturers, setManufacturers] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categoriesData, manufacturersData] = await Promise.all([
          apiService.spareParts.getCategories(),
          apiService.spareParts.getManufacturers()
        ]);
        setCategories(categoriesData);
        setManufacturers(manufacturersData);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleFilterChange = () => {
    const filters: SparePartFiltersType = {
      search: search || undefined,
      status: selectedStatus.length > 0 ? selectedStatus : undefined,
      category: selectedCategories.length > 0 ? selectedCategories : undefined,
      manufacturer: selectedManufacturers.length > 0 ? selectedManufacturers : undefined,
      priceRange: {
        min: priceRange.min,
        max: priceRange.max
      }
    };

    onFiltersChange(filters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleFilterChange();
            }}
            placeholder="Search parts..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
            disabled={loading}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
          <select
            multiple
            value={selectedStatus}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedStatus(values);
              handleFilterChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
            disabled={loading}
          >
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="pre_order">Pre Order</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>

        {/* Categories Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
          <select
            multiple
            value={selectedCategories}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedCategories(values);
              handleFilterChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
            disabled={loading}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Manufacturers Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturers</label>
          <select
            multiple
            value={selectedManufacturers}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedManufacturers(values);
              handleFilterChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
            disabled={loading}
          >
            {manufacturers.map(manufacturer => (
              <option key={manufacturer.id} value={manufacturer.id}>
                {manufacturer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={priceRange.min}
              onChange={(e) => {
                setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }));
                handleFilterChange();
              }}
              placeholder="Min"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
              disabled={loading}
            />
            <input
              type="number"
              value={priceRange.max}
              onChange={(e) => {
                setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }));
                handleFilterChange();
              }}
              placeholder="Max"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SparePartFilters; 