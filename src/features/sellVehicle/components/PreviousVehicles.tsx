import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader, X, Tag, Eye, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import marketplaceService from '../../../services/marketplaceService';
import SafeImage from '../../../components/SafeImage';
import { getStatusIcon, getStatusColor, getStatusBadgeColor } from '../../../utils/statusUtils';
import { PreviousVehicleProps, VehicleStatusInfo } from '../types';
import { getVehicleBrand, getVehicleModel, getVehicleRegistration, getVehicleCondition, getExpectedPrice, formatPrice } from '../utils/helpers';
import persistentStorageService from '../../../services/persistentStorageService';

const PreviousVehicles: React.FC<PreviousVehicleProps> = ({ onClose }) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleStatuses, setVehicleStatuses] = useState<VehicleStatusInfo>({});

  // Add polling interval for status updates
  useEffect(() => {
    // Fetch vehicles initially
    fetchVehicles();
    
    // Set up polling for status updates every 30 seconds
    const statusPollInterval = setInterval(() => {
      refreshVehicleStatuses();
    }, 30000); // 30 seconds
    
    // Clean up interval when component unmounts
    return () => {
      clearInterval(statusPollInterval);
    };
  }, []);

  // Fetch sell requests and their status information
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const sellRequests = await marketplaceService.getSellRequests();
      console.log('Retrieved sell requests:', sellRequests);
      
      // CRITICAL FIX: Sync with vehicle summary data to get latest condition values
      const enhancedSellRequests = await Promise.all(sellRequests.map(async (request: any) => {
        try {
          // Try to get the latest data from sessionStorage first (fastest)
          const sessionData = sessionStorage.getItem(`vehicle_summary_${request.id}`);
          if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            console.log(`Found session data for vehicle ${request.id}:`, parsedData);
            
            // Get the condition from vehicle_summary data
            const condition = parsedData.vehicle?.condition || 
                             parsedData.vehicle_details?.condition || 
                             parsedData.condition;
                             
            if (condition && condition !== 'Not Available') {
              console.log(`Updating condition for vehicle ${request.id} to: ${condition}`);
              
              // Create a deep copy to avoid mutating the original
              const enhancedRequest = JSON.parse(JSON.stringify(request));
              
              // Set the condition in all possible locations
              enhancedRequest.condition = condition;
              if (enhancedRequest.vehicle) {
                enhancedRequest.vehicle.condition = condition;
              }
              if (enhancedRequest.vehicle_details) {
                enhancedRequest.vehicle_details.condition = condition;
              }
              
              return enhancedRequest;
            }
          }
          
          // If no session data, try persistent storage
          const persistentData = await persistentStorageService.getVehicleData(request.id);
          if (persistentData) {
            const condition = persistentData.vehicle?.condition || 
                             persistentData.vehicle_details?.condition || 
                             persistentData.condition;
                             
            if (condition && condition !== 'Not Available') {
              console.log(`Updating condition for vehicle ${request.id} to: ${condition} (from persistent storage)`);
              
              // Create a deep copy
              const enhancedRequest = JSON.parse(JSON.stringify(request));
              
              // Set the condition in all possible locations
              enhancedRequest.condition = condition;
              if (enhancedRequest.vehicle) {
                enhancedRequest.vehicle.condition = condition;
              }
              if (enhancedRequest.vehicle_details) {
                enhancedRequest.vehicle_details.condition = condition;
              }
              
              return enhancedRequest;
            }
          }
        } catch (e) {
          console.error(`Error enhancing vehicle ${request.id}:`, e);
        }
        
        return request;
      }));
      
      setVehicles(enhancedSellRequests);
      
      // Fetch status information for each sell request
      await refreshVehicleStatuses(enhancedSellRequests);
    } catch (fetchError) {
      console.error('Error fetching vehicles:', fetchError);
      toast.error('Failed to load your vehicles');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh just the status information without reloading vehicles
  const refreshVehicleStatuses = async (sellRequestsData?: any[]) => {
    try {
      // Use provided sell requests or the current state
      const sellRequests = sellRequestsData || vehicles;
      
      if (sellRequests.length === 0) return;
      
      // Fetch status information for each sell request
      const statusPromises = sellRequests.map((request: any) => 
        marketplaceService.getSellRequestStatus(request.id)
          .then(statusInfo => ({
            id: request.id,
            statusInfo
          }))
          .catch(() => ({
            id: request.id,
            statusInfo: { 
              status: request.status, 
              message: 'Status information unavailable'
            }
          }))
      );
      
      const statuses = await Promise.all(statusPromises);
      
      // Create a map of id to status info
      const statusMap = statuses.reduce((acc: {[key: string]: any}, { id, statusInfo }: {id: string, statusInfo: any}) => {
        acc[id] = statusInfo;
        return acc;
      }, {});
      
      setVehicleStatuses(statusMap);
    } catch (error) {
      console.error('Error refreshing vehicle statuses:', error);
    }
  };
  
  // Get the status with proper display value
  const getStatusDisplay = (vehicle: any, id: string) => {
    // First check if we have status from the status info
    if (vehicleStatuses[id]?.title) {
      return vehicleStatuses[id].title;
    }
    
    if (vehicleStatuses[id]?.status_display) {
      return vehicleStatuses[id].status_display;
    }
    
    // Fallback to vehicle status
    return vehicle.status === 'sale_vehicle' ? 'For Sale' : vehicle.status;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Your Previous Vehicles</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader className="w-8 h-8 animate-spin text-[#FF5733]" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't listed any vehicles yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {vehicles.map(vehicle => {
              const status = vehicle.status;
              const expectedPrice = getExpectedPrice(vehicle);
              return (
                <div key={vehicle.id} className="border rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                  <div className="flex">
                    <div className="flex-shrink-0 mr-5">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 shadow-sm ${getStatusColor(status)}`}>
                        {vehicle.vehicle?.photo_front ? (
                          <SafeImage 
                            src={vehicle.vehicle.photo_front} 
                            alt={`${vehicle.vehicle?.brand} ${vehicle.vehicle?.model}`}
                            className="w-16 h-16 rounded-full object-cover"
                            fallbackComponent={
                              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100">
                                {getStatusIcon(status)}
                              </div>
                            }
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100">
                            {getStatusIcon(status)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-semibold text-gray-800 text-lg">
                          {getVehicleBrand(vehicle)} {getVehicleModel(vehicle)} {vehicle.vehicle?.year || vehicle.vehicle_details?.year || vehicle.year}
                        </h4>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusBadgeColor(status)}`}>
                          {getStatusDisplay(vehicle, vehicle.id)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 text-sm mb-3">
                        <div className="flex items-center text-gray-600">
                          <Tag className="w-4 h-4 mr-1 text-[#FF5733]" />
                          <span className="font-medium">Registration: </span>
                          <span className="ml-1">
                            {getVehicleRegistration(vehicle)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-1 text-[#FF5733]" />
                          <span className="font-medium">Listed: </span>
                          <span className="ml-1">{new Date(vehicle.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 text-sm mb-3">
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium">Condition: </span>
                          <span className="ml-1 capitalize">
                            <span title={`Sources: direct=${vehicle.condition}, vehicle=${vehicle.vehicle?.condition}, details=${vehicle.vehicle_details?.condition}`}>
                              {getVehicleCondition(vehicle)}
                            </span>
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {vehicleStatuses[vehicle.id]?.message || 'Status loading...'}
                      </p>
                      
                      <div className="flex justify-between items-center pt-3 border-t">
                        <div className="flex items-baseline">
                          <span className="text-sm text-gray-500 mr-2">Expected Price:</span>
                          <span className="font-bold text-lg text-[#FF5733]">₹{formatPrice(expectedPrice)}</span>
                        </div>
                        
                        <Link 
                          to={`/sell-vehicle/${vehicle.id}/summary`}
                          className="flex items-center bg-[#FF5733] text-white px-3 py-1.5 rounded-md hover:bg-[#ff4019] transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviousVehicles; 