import React from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '../types/vehicle';

interface VehicleCardProps {
  vehicle: Vehicle;
  className?: string;
  variant?: 'vertical' | 'horizontal' | 'compact';
}

const VehicleCard: React.FC<VehicleCardProps> = ({ 
  vehicle, 
  className = '',
  variant = 'vertical'
}) => {
  if (variant === 'compact') {
    return (
      <Link 
        to={`/vehicles/${vehicle.id}`}
        className={`flex items-center bg-white hover:bg-gray-50 rounded-lg transition-colors p-3 ${className}`}
      >
        {/* Image */}
        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
          <img
            src={vehicle.front_image_url || '/placeholder-vehicle.jpg'}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 ml-3">
          <h3 className="font-medium text-gray-900 truncate">
            {vehicle.brand} {vehicle.model}
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <span className="truncate">{vehicle.year} • {vehicle.kms_driven.toLocaleString()} km</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex-shrink-0 ml-3 text-right">
          <span className="text-sm font-bold text-[#FF5733]">
            {vehicle.display_price.formatted}
          </span>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link 
        to={`/vehicles/${vehicle.id}`}
        className={`flex bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}
      >
        {/* Image Section */}
        <div className="w-32 h-32 flex-shrink-0">
          <img
            src={vehicle.front_image_url || '/placeholder-vehicle.jpg'}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <span>{vehicle.year}</span>
                <span className="mx-2">•</span>
                <span>{vehicle.kms_driven.toLocaleString()} km</span>
              </div>
            </div>
            <span className="text-lg font-bold text-[#FF5733]">
              {vehicle.display_price.formatted}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Original vertical card design
  return (
    <Link 
      to={`/vehicles/${vehicle.id}`}
      className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="aspect-[4/3] relative rounded-t-lg overflow-hidden">
        <img
          src={vehicle.front_image_url || '/placeholder-vehicle.jpg'}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="w-full h-full object-cover"
        />
        {vehicle.display_price.emi_available && vehicle.display_price.emi_starting_at && vehicle.display_price.emi_starting_at !== '₹0/month' && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2">
            EMI from {vehicle.display_price.emi_starting_at}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">
          {vehicle.brand} {vehicle.model}
        </h3>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span>{vehicle.year}</span>
          <span className="mx-2">•</span>
          <span>{vehicle.kms_driven.toLocaleString()} km</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#FF5733]">
            {vehicle.display_price.formatted}
          </span>
          {vehicle.bookable && (
            <span className="text-xs text-[#FF5733] border border-[#FF5733] rounded px-2 py-1">
              Book Now
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default VehicleCard; 