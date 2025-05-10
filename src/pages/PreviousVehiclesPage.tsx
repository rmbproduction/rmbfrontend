import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bike, Tag, Clock, Eye, Calendar, DollarSign, 
  Loader, RefreshCw, ChevronLeft, Filter, Search,
  ShieldCheck, AlertTriangle, ArrowLeft, X, ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import marketplaceService from '../services/marketplaceService';
import persistentStorageService from '../services/persistentStorageService';
import SafeImage from '../components/SafeImage';
import { getStatusIcon, getStatusColor, getStatusBadgeColor } from '../utils/statusUtils';

const PreviousVehiclesPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleStatuses, setVehicleStatuses] = useState<{[key: string]: {status: string, status_display?: string, title?: string, message: string}}>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'api' | 'local'>('api');
  const [localVehicles, setLocalVehicles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch both API and local storage vehicles
    fetchVehicles();
    fetchLocalVehicleHistory();
    
    // Set up polling for status updates every 30 seconds (only for API vehicles)
    const statusPollInterval = setInterval(() => {
      if (viewMode === 'api') {
        refreshVehicleStatuses();
      }
    }, 30000); // 30 seconds
    
    // Clean up interval when component unmounts
    return () => {
      clearInterval(statusPollInterval);
    };
  }, [viewMode]);

  // Fetch sell requests and their status information
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const sellRequests = await marketplaceService.getSellRequests();
      setVehicles(sellRequests);
      
      // Fetch status information for each sell request
      await refreshVehicleStatuses(sellRequests);
    } catch (fetchError) {
      console.error('Error fetching vehicles:', fetchError);
      toast.error('Failed to load your vehicles');
    } finally {
      setLoading(false);
    }
  };

  // Fetch local vehicle history
  const fetchLocalVehicleHistory = async () => {
    try {
      const history = await persistentStorageService.getVehicleHistory();
      setLocalVehicles(history);
    } catch (error) {
      console.error('Error fetching local vehicle history:', error);
    }
  };

  // Function to refresh just the status information without reloading vehicles
  const refreshVehicleStatuses = async (sellRequestsData?: any[]) => {
    try {
      setIsRefreshing(true);
      
      // Use provided sell requests or the current state
      const sellRequests = sellRequestsData || vehicles;
      
      if (sellRequests.length === 0) {
        setIsRefreshing(false);
        return;
      }
      
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
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      // Refresh API vehicles
      await fetchVehicles();
      
      // Refresh local vehicles
      await fetchLocalVehicleHistory();
      
      toast.success('Vehicles refreshed successfully');
    } catch (error) {
      console.error('Error refreshing vehicles:', error);
      toast.error('Failed to refresh vehicles');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatPrice = (price: string | number) => {
    if (!price) return '0';
    return Number(price).toLocaleString('en-IN');
  };
  
  // Get the expected price with fallbacks
  const getExpectedPrice = (vehicle: any) => {
    // Check all possible locations for expected price
    return vehicle.vehicle?.expected_price || 
           vehicle.vehicle?.price || 
           vehicle.expected_price || 
           vehicle.price || 
           vehicle.summary?.price ||
           0;
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
    
    if (vehicle.summary?.status) {
      return vehicle.summary.status;
    }
    
    // Fallback to vehicle status
    return vehicle.status === 'sale_vehicle' ? 'For Sale' : vehicle.status || 'Unknown';
  };
  
  // Filter vehicles based on search term and status filter
  const filteredVehicles = () => {
    const currentVehicles = viewMode === 'api' ? vehicles : localVehicles;
    
    return currentVehicles.filter(vehicle => {
      // Apply search filter
      const searchFields = [
        vehicle.vehicle?.brand,
        vehicle.vehicle?.model,
        vehicle.vehicle?.registration_number,
        vehicle.summary?.brand,
        vehicle.summary?.model,
        vehicle.summary?.registration_number,
      ].filter(Boolean).join(' ').toLowerCase();
      
      const matchesSearch = searchTerm === '' || searchFields.includes(searchTerm.toLowerCase());
      
      // Apply status filter
      const vehicleStatus = vehicle.status || vehicle.summary?.status || '';
      const matchesStatus = !statusFilter || vehicleStatus.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  };
  
  // Get unique statuses for filter dropdown
  const getUniqueStatuses = () => {
    const currentVehicles = viewMode === 'api' ? vehicles : localVehicles;
    const statuses = currentVehicles.map(v => v.status || v.summary?.status).filter(Boolean);
    return Array.from(new Set(statuses));
  };

  // New helper function to determine if vehicle is completed or inactive
  const canSellSimilarVehicle = (vehicle: any) => {
    // Check if vehicle has a status that indicates the process is complete
    const completedStatuses = ['sold', 'completed', 'cancelled', 'rejected'];
    const currentStatus = vehicle.status?.toLowerCase() || '';
    
    return completedStatuses.includes(currentStatus);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 flex items-center text-gray-600 hover:text-[#FF5733]"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold flex-1">Your Vehicles</h1>
        <button
          onClick={() => navigate('/sell-vehicle')}
          className="flex items-center bg-[#FF5733] text-white px-4 py-2 rounded-md mr-3 hover:bg-[#e04b29] transition-colors"
        >
          <Tag className="w-4 h-4 mr-2" />
          Sell New Vehicle
        </button>
        <button
          onClick={refreshAll}
          disabled={isRefreshing}
          className="flex items-center bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      {/* View mode selector */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('api')}
            className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'api' ? 'bg-white shadow-sm text-[#FF5733]' : 'text-gray-600'}`}
          >
            <ShieldCheck className="w-4 h-4 inline-block mr-2" />
            Server Records
          </button>
          <button
            onClick={() => setViewMode('local')}
            className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'local' ? 'bg-white shadow-sm text-[#FF5733]' : 'text-gray-600'}`}
          >
            <Bike className="w-4 h-4 inline-block mr-2" />
            Viewed Vehicles
          </button>
        </div>
        
        <div className="flex space-x-2">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          
          {/* Status filter */}
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {getUniqueStatuses().map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-60">
          <Loader className="w-10 h-10 animate-spin text-[#FF5733]" />
        </div>
      ) : filteredVehicles().length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
          <Bike className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No vehicles found</h3>
          <p className="text-gray-500 mb-6">
            {viewMode === 'api' 
              ? "You haven't submitted any vehicles for sale yet." 
              : "You haven't viewed any vehicles recently."}
          </p>
          <Link
            to="/sell-vehicle"
            className="inline-flex items-center px-5 py-2 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors"
          >
            Sell a Vehicle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVehicles().map(vehicle => {
            const id = vehicle.id || vehicle.vehicleId;
            const status = vehicle.status || vehicle.summary?.status || 'unknown';
            const expectedPrice = getExpectedPrice(vehicle);
            const photoSrc = vehicle.vehicle?.photo_front || 
                             (vehicle.summary?.thumbnail ? vehicle.summary.thumbnail : null);
            
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex">
                  <div className="flex-shrink-0 mr-5">
                    <div className={`w-24 h-24 rounded-lg flex items-center justify-center border-2 shadow-sm ${getStatusColor(status)}`}>
                      {photoSrc ? (
                        <SafeImage 
                          src={photoSrc} 
                          alt={`${vehicle.vehicle?.brand || vehicle.summary?.brand || 'Unknown'} ${vehicle.vehicle?.model || vehicle.summary?.model || 'Unknown'}`}
                          className="w-20 h-20 rounded-lg object-cover"
                          vehicleId={id}
                          fallbackComponent={
                            <div className="w-20 h-20 rounded-lg flex items-center justify-center bg-gray-100">
                              {getStatusIcon(status)}
                            </div>
                          }
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg flex items-center justify-center bg-gray-100">
                          {getStatusIcon(status)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-semibold text-gray-800 text-lg">
                        {vehicle.vehicle?.brand || vehicle.summary?.brand || 'Unknown'}{' '}
                        {vehicle.vehicle?.model || vehicle.summary?.model || 'Unknown'}{' '}
                        {vehicle.vehicle?.year || vehicle.summary?.year || ''}
                      </h4>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusBadgeColor(status)}`}>
                        {getStatusDisplay(vehicle, id)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 text-sm mb-2">
                      <div className="flex items-center text-gray-600">
                        <Tag className="w-4 h-4 mr-1 text-[#FF5733]" />
                        <span className="font-medium">Registration: </span>
                        <span className="ml-1">{vehicle.vehicle?.registration_number || vehicle.summary?.registration_number || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-1 text-[#FF5733]" />
                        <span className="font-medium">
                          {viewMode === 'api' ? 'Listed: ' : 'Viewed: '}
                        </span>
                        <span className="ml-1">
                          {new Date(vehicle.created_at || vehicle.timestamp || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {viewMode === 'api' && (
                      <p className="text-sm text-gray-600 mb-3">
                        {vehicleStatuses[id]?.message || 'Status information unavailable'}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="flex items-baseline">
                        <span className="text-sm text-gray-500 mr-2">Price:</span>
                        <span className="font-bold text-lg text-[#FF5733]">₹{formatPrice(expectedPrice)}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        {canSellSimilarVehicle(vehicle) && (
                          <button
                            onClick={() => navigate('/sell-vehicle')}
                            className="flex items-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                          >
                            <Tag className="w-4 h-4 mr-1" />
                            Sell Similar
                          </button>
                        )}
                        <Link 
                          to={`/sell-vehicle/${id}/summary`}
                          className="flex items-center bg-[#FF5733] text-white px-3 py-1.5 rounded-md hover:bg-[#ff4019] transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      <div className="mt-8 text-center">
        <Link 
          to="/sell-vehicle" 
          className="inline-flex items-center px-6 py-3 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors font-medium"
        >
          <Bike className="w-5 h-5 mr-2" />
          Sell Another Vehicle
        </Link>
      </div>
    </div>
  );
};

export default PreviousVehiclesPage; 