import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import marketplaceService from '../services/marketplaceService';
import SuggestedVehicleItem from './SuggestedVehicleItem';
import { API_CONFIG } from '../config/api.config';

interface VehicleSuggestionsProps {
  currentVehicleId?: string;
  limit?: number;
}

const VehicleSuggestions: React.FC<VehicleSuggestionsProps> = ({ 
  currentVehicleId,
  limit = 3
}) => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [currentVehicleDetails, setCurrentVehicleDetails] = useState<any>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // First fetch the current vehicle details to know what to filter out
        let currentVehicle = null;
        if (currentVehicleId) {
          try {
            currentVehicle = await marketplaceService.getVehicleDetails(currentVehicleId);
            setCurrentVehicleDetails(currentVehicle);
            console.log('Current vehicle details:', {
              id: currentVehicle.id,
              brand: currentVehicle.brand,
              model: currentVehicle.model,
              type: currentVehicle.vehicle_type,
              price: currentVehicle.price
            });
          } catch (err) {
            console.error('Error fetching current vehicle details:', err);
          }
        }
        
        // Try multiple API calls to ensure we get real vehicles
        let vehiclesData: any[] = [];

        // First get all available vehicles for maximum selection pool
        console.log('Fetching all available vehicles');
        const allVehicles = await marketplaceService.getAvailableVehicles();
        
        if (allVehicles && allVehicles.length > 0) {
          vehiclesData = allVehicles;
          console.log(`Found ${allVehicles.length} available vehicles`);
        }
        
        // If no vehicles found, try popular vehicles
        if (vehiclesData.length === 0) {
          console.log('Fetching popular vehicles as fallback');
          const popularVehicles = await marketplaceService.getPopularVehicles(limit + 5);
          
          if (popularVehicles && popularVehicles.length > 0) {
            vehiclesData = popularVehicles;
            console.log(`Found ${popularVehicles.length} popular vehicles`);
          }
        }
        
        // If we have the current vehicle details, apply smart filtering
        if (currentVehicle && vehiclesData.length > 0) {
          console.log('Filtering vehicles to ensure diversity');
          
          // First, remove the exact same vehicle
          vehiclesData = vehiclesData.filter(v => v.id !== currentVehicleId);
          
          // Then create a scoring system for diversity
          const scoredVehicles = vehiclesData.map(vehicle => {
            let diversityScore = 0;
            
            // Different brand is highly diverse
            if (vehicle.brand !== currentVehicle.brand) {
              diversityScore += 10;
            }
            
            // Different model adds diversity
            if (vehicle.model !== currentVehicle.model) {
              diversityScore += 8;
            } else {
              // Heavily penalize same model
              diversityScore -= 15;
            }
            
            // Different vehicle type adds diversity
            if (vehicle.vehicle_type !== currentVehicle.vehicle_type) {
              diversityScore += 5;
            }
            
            // Different price range adds diversity (>20% difference)
            const priceRatio = Math.abs(vehicle.price - currentVehicle.price) / currentVehicle.price;
            if (priceRatio > 0.2) {
              diversityScore += 3;
            }
            
            // Different year model adds some diversity
            if (vehicle.year !== currentVehicle.year) {
              diversityScore += 2;
            }
            
            return {
              ...vehicle,
              diversityScore
            };
          });
          
          // Sort by diversity score (highest first)
          scoredVehicles.sort((a, b) => b.diversityScore - a.diversityScore);
          
          // Log the diversity scores
          console.log('Vehicles sorted by diversity score:', 
            scoredVehicles.slice(0, 5).map(v => ({
              id: v.id,
              brand: v.brand,
              model: v.model,
              score: v.diversityScore
            }))
          );
          
          // Ensure we don't show vehicles with negative diversity (too similar)
          const diverseVehicles = scoredVehicles.filter(v => v.diversityScore > 0);
          
          // If we have enough diverse vehicles, use them
          if (diverseVehicles.length >= limit) {
            vehiclesData = diverseVehicles;
          } else {
            // Otherwise use the sorted scores but ensure different makes/models
            // Filter out same brand+model combinations
            const filteredVehicles = scoredVehicles.filter(v => 
              v.brand !== currentVehicle.brand || 
              v.model !== currentVehicle.model
            );
            
            // If we have enough after filtering by brand+model, use those
            if (filteredVehicles.length >= limit) {
              vehiclesData = filteredVehicles;
            } else {
              // Last resort: use all vehicles except the current one
              vehiclesData = scoredVehicles;
            }
          }
        }
        
        // Process the vehicles to ensure consistent data structure
        const processedVehicles = vehiclesData.map((vehicle: any) => {
          // Ensure we have all required fields with fallbacks
          const processedVehicle = {
            id: vehicle.id || `unknown-${Math.random().toString(36).substring(7)}`,
            brand: vehicle.brand || 'Unknown Brand',
            model: vehicle.model || 'Unknown Model',
            year: vehicle.year || new Date().getFullYear(),
            price: typeof vehicle.price === 'number' ? vehicle.price : 
                  (vehicle.display_price?.amount || 0),
            kms_driven: vehicle.kms_driven || 0,
            // Normalize the image URL
            front_image_url: getVehicleImageUrl(vehicle)
          };
          
          return processedVehicle;
        });
        
        // Limit the number of vehicles to display
        const limitedVehicles = processedVehicles.slice(0, limit);
        setVehicles(limitedVehicles);
        
        // Log the final selections
        console.log('Final vehicle suggestions:', 
          limitedVehicles.map(v => `${v.brand} ${v.model}`)
        );
        
        // If we didn't get any vehicles at all, show the error state
        if (limitedVehicles.length === 0) {
          setError(true);
        }
      } catch (error) {
        console.error('Failed to fetch vehicle suggestions:', error);
        setError(true);
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentVehicleId, limit]);

  // Helper function to get the best image URL from a vehicle object
  const getVehicleImageUrl = (vehicle: any): string => {
    // Try every possible field where the image URL might be
    let imageUrl = null;
    
    // Check for front_image_url (most common)
    if (vehicle.front_image_url && vehicle.front_image_url !== 'null') {
      imageUrl = vehicle.front_image_url;
    } 
    // Check for imageUrl
    else if (vehicle.imageUrl && vehicle.imageUrl !== 'null') {
      imageUrl = vehicle.imageUrl;
    }
    // Check for photo_front
    else if (vehicle.photo_front && vehicle.photo_front !== 'null') {
      imageUrl = vehicle.photo_front;
    }
    // Check images object structure
    else if (vehicle.images) {
      // Check each possible image field
      if (vehicle.images.front) {
        imageUrl = vehicle.images.front;
      } else if (vehicle.images.main) {
        imageUrl = vehicle.images.main;
      } else if (Array.isArray(vehicle.images.gallery) && vehicle.images.gallery.length > 0) {
        imageUrl = vehicle.images.gallery[0];
      }
    }
    
    // Handle different URL formats
    if (imageUrl) {
      // Handle relative URLs
      if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
        imageUrl = API_CONFIG.getMediaUrl(imageUrl);
      }
      
      // Make sure we have a valid URL
      return imageUrl;
    }
    
    // If no valid image URL is found, create one based on the vehicle's brand and model
    // This creates a dynamic color background with initials, better than a generic placeholder
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(vehicle.brand || 'U')}+${encodeURIComponent(vehicle.model || 'V')}&background=FF5733&color=fff&size=256`;
  };

  const handleViewAll = () => {
    navigate('/vehicles');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">You Might Also Like</h2>
        <div className="space-y-4">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-2">
              <div className="h-16 w-16 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Even if we have no vehicles, we'll still show the container with a message
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">You Might Also Like</h2>
      {vehicles.length > 0 ? (
        <div className="space-y-4">
          {vehicles.map(vehicle => (
            <SuggestedVehicleItem
              key={vehicle.id}
              id={vehicle.id}
              brand={vehicle.brand}
              model={vehicle.model}
              year={vehicle.year}
              price={vehicle.price}
              kmsDriven={vehicle.kms_driven}
              imageUrl={vehicle.front_image_url}
            />
          ))}
          
          <div className="pt-2">
            <button 
              onClick={handleViewAll}
              className="text-[#FF5733] text-sm font-medium hover:underline flex items-center"
            >
              View all vehicles
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-gray-500">No similar vehicles available at the moment.</p>
          <button 
            onClick={handleViewAll}
            className="mt-3 text-[#FF5733] text-sm font-medium hover:underline flex items-center justify-center mx-auto"
          >
            Browse all vehicles
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VehicleSuggestions; 