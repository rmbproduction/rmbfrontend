import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import marketplaceService from '../services/marketplaceService';
import { Vehicle } from '../types/vehicles';
import { API_CONFIG } from '../config/api.config';
import { ChevronRight } from 'lucide-react';

interface SimilarVehiclesProps {
  vehicleId: string | number;
  className?: string;
}

const SimilarVehicles: React.FC<SimilarVehiclesProps> = ({ vehicleId, className = '' }) => {
  const [similarVehicles, setSimilarVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSimilarVehicles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch similar vehicles from the backend API
        const response = await marketplaceService.getSimilarVehicles(vehicleId);
        setSimilarVehicles(response);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch similar vehicles:', err);
        setError('Could not load similar vehicles');
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchSimilarVehicles();
    }
  }, [vehicleId]);

  const handleCardClick = (id: number) => {
    navigate(`/vehicles/${id}`);
  };

  const getImageUrl = (vehicle: Vehicle): string => {
    if (vehicle.image_url) return vehicle.image_url;
    if (vehicle.image_urls?.main) return vehicle.image_urls.main;
    if (vehicle.image_urls?.thumbnail) return vehicle.image_urls.thumbnail;
    if (vehicle.photo_front) return API_CONFIG.getImageUrl(vehicle.photo_front);
    return API_CONFIG.getDefaultVehicleImage();
  };

  if (loading) {
    return (
      <div className={`${className} bg-white rounded-2xl shadow-lg p-6`}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Similar Vehicles</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse h-40 rounded-xl bg-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || similarVehicles.length === 0) {
    return null;  // Don't render anything if there are no similar vehicles
  }

  return (
    <div className={`${className} bg-white rounded-2xl shadow-lg p-6`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Similar Vehicles</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {similarVehicles.map(vehicle => (
          <div 
            key={vehicle.id}
            className="relative overflow-hidden rounded-xl border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick(vehicle.id)}
          >
            <div className="h-28 w-full overflow-hidden">
              <img 
                src={getImageUrl(vehicle)} 
                alt={`${vehicle.brand} ${vehicle.model}`} 
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = API_CONFIG.getDefaultVehicleImage();
                }}
              />
            </div>
            <div className="p-2">
              <h3 className="font-medium text-sm text-gray-900 truncate">
                {vehicle.brand} {vehicle.model}
              </h3>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-700">
                  {vehicle.year} • {vehicle.kms_driven.toLocaleString()} km
                </p>
                <p className="text-xs font-semibold text-[#FF5733]">
                  {vehicle.display_price?.formatted || `₹${vehicle.price.toLocaleString()}`}
                </p>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-1 bg-black bg-opacity-50 rounded-bl-lg">
              <ChevronRight className="h-4 w-4 text-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarVehicles; 