import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import marketplaceService from '../services/marketplaceService';
import SafeImage from '../components/SafeImage';
import { extractPhotoUrls, isBase64Image } from '../services/imageUtils';
import StatusDisplay from '../components/StatusDisplay';

interface StatusInfo {
  status: string;
  status_display: string;
  title: string;
  message: string;
  updated_at: string;
}

const SellSuccess = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const sellRequestId = params.get('id');
  
  const [isScheduled, setIsScheduled] = useState(false);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null);
  const [sellRequest, setSellRequest] = useState<any>(null);
  
  // Fetch vehicle data from backend
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch sell request details
        const sellRequestData = await marketplaceService.getSellRequest(id);
        setSellRequest(sellRequestData);
        
        // Fetch status information
        const statusData = await marketplaceService.getSellRequestStatus(id);
        setStatusInfo(statusData);
        
        // Set debug info
        setDebugInfo(JSON.stringify(sellRequestData, null, 2));
        
        if (!sellRequestData) {
          console.error('Invalid response format:', sellRequestData);
          setError('Invalid response format from server');
          setLoading(false);
          return;
        }
        
        setVehicleData(sellRequestData);
        
        // Check if inspection is already scheduled
        if (sellRequestData.status === 'inspection_scheduled') {
          setIsScheduled(true);
        }
      } catch (err: any) {
        console.error('Error fetching vehicle data:', err);
        
        // Enhanced error reporting
        let errorMessage = 'Could not load vehicle data. Please try again later.';
        if (err.message) {
          errorMessage = err.message;
        } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        }
        
        setError(errorMessage);
        setDebugInfo(JSON.stringify({
          error: err.message,
          stack: err.stack,
          response: err.response?.data
        }, null, 2));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Set up polling for status updates
  useEffect(() => {
    if (!id || loading) return;
    
    // Set up polling to check for status updates every 30 seconds
    const statusPollInterval = setInterval(() => {
      refreshStatus();
    }, 30000); // 30 seconds
    
    // Clean up interval when component unmounts
    return () => {
      clearInterval(statusPollInterval);
    };
  }, [id, loading]);
  
  // Function to refresh just the status information
  const refreshStatus = async () => {
    if (!id) return;
    
    try {
      // Fetch status information
      const statusData = await marketplaceService.getSellRequestStatus(id);
      setStatusInfo(statusData);
      
      // Update inspection scheduled status if needed
      if (statusData.status === 'inspection_scheduled') {
        setIsScheduled(true);
      }
    } catch (error) {
      console.error('Error refreshing status information:', error);
    }
  };

  // Format price with commas
  const formatPrice = (price: string | number) => {
    if (!price) return '0';
    return parseInt(price.toString()).toLocaleString('en-IN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-[#FF5733] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-700">Loading your vehicle information...</p>
        </div>
      </div>
    );
  }
  
  if (!sellRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sell Request Not Found</h1>
          <p className="text-gray-600 mb-6">The sell request you're looking for does not exist or you don't have permission to view it.</p>
          <Link to="/sell-vehicle" className="inline-flex items-center px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#e64a29]">
            Start New Listing
          </Link>
        </div>
      </div>
    );
  }

  const vehicle = sellRequest.vehicle || {};
  const vehicle_details = sellRequest.vehicle_details || {};
  const status = statusInfo?.status || sellRequest.status || 'unknown';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Listing Submitted Successfully!</h1>
            <p className="text-gray-600 mt-2">Your vehicle has been listed for sale.</p>
          </div>
          
          {/* Status information with StatusDisplay component */}
          <div className="mb-8">
            <StatusDisplay 
              status={status} 
              statusDisplay={statusInfo?.status_display || sellRequest.status}
              title={statusInfo?.title}
              message={statusInfo?.message || 'We have received your listing and will process it shortly.'} 
            />
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 mb-8">
            <h2 className="font-semibold text-lg text-gray-800 mb-4">Vehicle Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  {vehicle.photo_front ? (
                    <SafeImage 
                      src={vehicle.photo_front}
                      alt="Vehicle" 
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-gray-800 text-lg">
                  {vehicle.brand} {vehicle.model} {vehicle.year}
                </h3>
                <p className="text-gray-600">
                  Registration: {vehicle.registration_number}
                </p>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500 text-sm">Expected Price</span>
                  <p className="font-bold text-lg text-[#FF5733]">₹{formatPrice(vehicle.expected_price || vehicle_details.expected_price || vehicleData.expected_price || 0)}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Pickup Address</span>
                  <p className="font-medium">{sellRequest.pickup_address}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Contact Number</span>
                  <p className="font-medium">{sellRequest.contact_number}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Submission Date</span>
                  <p className="font-medium">{new Date(sellRequest.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link to="/dashboard" className="inline-flex items-center px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#e64a29]">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellSuccess;