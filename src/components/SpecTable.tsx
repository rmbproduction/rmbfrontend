import React from 'react';
import { Vehicle } from '../types/vehicles';

interface SpecTableProps {
  vehicle: Vehicle | any;
  className?: string;
}

/**
 * SpecTable component to display vehicle specifications in a table format
 */
const SpecTable: React.FC<SpecTableProps> = ({ vehicle, className = '' }) => {
  if (!vehicle) return null;

  // Helper function to format spec values
  const formatSpecValue = (key: string, value: any): string => {
    if (value === undefined || value === null) return 'Not specified';
    
    switch (key) {
      case 'kms_driven':
        return `${value.toLocaleString()} km`;
      case 'price':
      case 'expected_price':
        return `₹${value.toLocaleString()}`;
      case 'year':
        return String(value);
      case 'status':
        return getStatusText(value);
      case 'fuel_type':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'vehicle_type':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'condition':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'emi_available':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  };

  // Get status text
  const getStatusText = (status: string): string => {
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
  
  // Define specs that should be displayed
  const specs = [
    { key: 'brand', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'year', label: 'Year' },
    { key: 'vehicle_type', label: 'Vehicle Type' },
    { key: 'fuel_type', label: 'Fuel Type' },
    { key: 'color', label: 'Color' },
    { key: 'kms_driven', label: 'Kilometers Driven' },
    { key: 'engine_capacity', label: 'Engine Capacity' },
    { key: 'mileage', label: 'Mileage' },
    { key: 'condition', label: 'Condition' },
    { key: 'registration_number', label: 'Registration Number' },
    { key: 'emi_available', label: 'EMI Available' },
  ];

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}>
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium text-gray-900">Vehicle Specifications</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Detailed information about this vehicle.</p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {specs.map(spec => {
            const value = vehicle[spec.key];
            if (value === undefined || value === null) return null;
            
            return (
              <div key={spec.key} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">{spec.label}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {formatSpecValue(spec.key, value)}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
};

export default SpecTable; 