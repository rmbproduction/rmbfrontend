import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api.config';

interface VehicleFilters {
  manufacturer?: string;
  model?: string;
  vehicleType?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  year?: {
    min: number;
    max: number;
  };
  fuelType?: string;
  kmsDriven?: {
    min: number;
    max: number;
  };
}

interface VehicleSearchProps {
  onFiltersChange: (filters: VehicleFilters) => void;
  className?: string;
}

const VehicleSearch: React.FC<VehicleSearchProps> = ({ onFiltersChange, className = '' }) => {
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [filters, setFilters] = useState<VehicleFilters>({
    priceRange: { min: 0, max: 1000000 },
    year: { min: 2000, max: new Date().getFullYear() },
    kmsDriven: { min: 0, max: 200000 }
  });

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    try {
      const response = await fetch(API_CONFIG.getApiUrl(API_CONFIG.ENDPOINTS.MANUFACTURERS));
      const data = await response.json();
      setManufacturers(data.map((m: any) => m.name));
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    }
  };

  const fetchModels = async (manufacturer: string) => {
    try {
      const response = await fetch(
        API_CONFIG.getApiUrl(`${API_CONFIG.ENDPOINTS.VEHICLE_MODELS}?manufacturer=${manufacturer}`)
      );
      const data = await response.json();
      setModels(data.map((m: any) => m.name));
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleManufacturerChange = (manufacturer: string) => {
    handleFilterChange('manufacturer', manufacturer);
    fetchModels(manufacturer);
  };

  return (
    <div className={`vehicle-search p-4 bg-white rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Search & Filter Vehicles</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Manufacturer Select */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Manufacturer
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={(e) => handleManufacturerChange(e.target.value)}
            value={filters.manufacturer || ''}
          >
            <option value="">All Manufacturers</option>
            {manufacturers.map((manufacturer) => (
              <option key={manufacturer} value={manufacturer}>
                {manufacturer}
              </option>
            ))}
          </select>
        </div>

        {/* Model Select */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={(e) => handleFilterChange('model', e.target.value)}
            value={filters.model || ''}
            disabled={!filters.manufacturer}
          >
            <option value="">All Models</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* Vehicle Type */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Type
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
            value={filters.vehicleType || ''}
          >
            <option value="">All Types</option>
            <option value="bike">Bike</option>
            <option value="scooter">Scooter</option>
            <option value="electric_bike">Electric Bike</option>
            <option value="electric_scooter">Electric Scooter</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price Range
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              className="w-1/2 p-2 border border-gray-300 rounded-md"
              value={filters.priceRange?.min || ''}
              onChange={(e) => handleFilterChange('priceRange', {
                ...filters.priceRange,
                min: parseInt(e.target.value)
              })}
            />
            <input
              type="number"
              placeholder="Max"
              className="w-1/2 p-2 border border-gray-300 rounded-md"
              value={filters.priceRange?.max || ''}
              onChange={(e) => handleFilterChange('priceRange', {
                ...filters.priceRange,
                max: parseInt(e.target.value)
              })}
            />
          </div>
        </div>

        {/* Year Range */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="From"
              className="w-1/2 p-2 border border-gray-300 rounded-md"
              value={filters.year?.min || ''}
              onChange={(e) => handleFilterChange('year', {
                ...filters.year,
                min: parseInt(e.target.value)
              })}
            />
            <input
              type="number"
              placeholder="To"
              className="w-1/2 p-2 border border-gray-300 rounded-md"
              value={filters.year?.max || ''}
              onChange={(e) => handleFilterChange('year', {
                ...filters.year,
                max: parseInt(e.target.value)
              })}
            />
          </div>
        </div>

        {/* Fuel Type */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fuel Type
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={(e) => handleFilterChange('fuelType', e.target.value)}
            value={filters.fuelType || ''}
          >
            <option value="">All Types</option>
            <option value="petrol">Petrol</option>
            <option value="electric">Electric</option>
          </select>
        </div>

        {/* KMs Driven Range */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            KMs Driven
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              className="w-1/2 p-2 border border-gray-300 rounded-md"
              value={filters.kmsDriven?.min || ''}
              onChange={(e) => handleFilterChange('kmsDriven', {
                ...filters.kmsDriven,
                min: parseInt(e.target.value)
              })}
            />
            <input
              type="number"
              placeholder="Max"
              className="w-1/2 p-2 border border-gray-300 rounded-md"
              value={filters.kmsDriven?.max || ''}
              onChange={(e) => handleFilterChange('kmsDriven', {
                ...filters.kmsDriven,
                max: parseInt(e.target.value)
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleSearch; 