import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TokenManager from '../services/tokenManager';
import VehicleDetailsModal from './VehicleDetailsModal';

interface VehicleDetails {
  id: number;
  brand: string;
  model: string;
  year: number;
  vehicle_type: string;
  vehicle_type_display: string;
  registration_number: string;
  status: string;
  status_display: string;
  expected_price: string;
  front_image_url: string;
}

interface SellRequest {
  id: number;
  vehicle_details: VehicleDetails;
  status: string;
  status_display: string;
  rejection_reason: string;
  documents_complete: {
    complete: boolean;
    missing: string[];
  };
  inspection_details: any;
  created_at: string;
}

const StatusBadge: React.FC<{ status: string; statusDisplay: string }> = ({ status, statusDisplay }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inspection_scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'under_inspection':
        return 'bg-purple-100 text-purple-800';
      case 'inspection_done':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
      {statusDisplay}
    </span>
  );
};

export default function ForSaleVehicles() {
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SellRequest | null>(null);

  useEffect(() => {
    const fetchSellRequests = async () => {
      try {
        const accessToken = TokenManager.getAccessToken();
        if (!accessToken) {
          throw new Error('No access token found');
        }

        const response = await axios.get(
          'https://repairmybike.up.railway.app/api/marketplace/sell-requests/',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            withCredentials: true
          }
        );

        setSellRequests(response.data);
      } catch (error: any) {
        console.error('Error fetching sell requests:', error);
        setError(error.response?.data?.message || 'Failed to fetch sell requests');
      } finally {
        setLoading(false);
      }
    };

    fetchSellRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
      </div>
    );
  }

  if (sellRequests.length === 0) {
    return (
      <div className="text-center text-gray-600 p-4">
        <p>You haven't listed any vehicles for sale yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Your Vehicles For Sale</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sellRequests.map((request) => {
          // Check if vehicle_details exists
          if (!request.vehicle_details) {
            return (
              <div key={request.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <p className="text-red-600">Vehicle details not available</p>
                  <StatusBadge 
                    status={request.status} 
                    statusDisplay={request.status_display} 
                  />
                </div>
              </div>
            );
          }

          return (
            <div key={request.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Vehicle Image */}
              <div className="relative h-48">
                <img
                  src={request.vehicle_details.front_image_url || '/default-vehicle.jpg'}
                  alt={`${request.vehicle_details.brand || 'Unknown'} ${request.vehicle_details.model || 'Vehicle'}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-vehicle.jpg';
                  }}
                />
              </div>

              {/* Vehicle Details */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">
                    {request.vehicle_details.brand || 'Unknown'} {request.vehicle_details.model || 'Vehicle'}
                  </h3>
                  <StatusBadge 
                    status={request.status} 
                    statusDisplay={request.status_display} 
                  />
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>Type: {request.vehicle_details.vehicle_type_display || 'Not specified'}</p>
                  <p>Year: {request.vehicle_details.year || 'Not specified'}</p>
                  <p>Registration: {request.vehicle_details.registration_number || 'Not specified'}</p>
                  <p>Expected Price: {request.vehicle_details.expected_price 
                    ? `₹${parseInt(request.vehicle_details.expected_price).toLocaleString()}`
                    : 'Not specified'}</p>
                  <p>Listed on: {new Date(request.created_at).toLocaleDateString()}</p>
                </div>

                {/* Show rejection reason if rejected */}
                {request.status === 'rejected' && request.rejection_reason && (
                  <div className="mt-3 p-2 bg-red-50 text-red-700 rounded">
                    <p className="font-medium">Rejection Reason:</p>
                    <p>{request.rejection_reason}</p>
                  </div>
                )}

                {/* Show missing documents if any */}
                {request.documents_complete && !request.documents_complete.complete && (
                  <div className="mt-3 p-2 bg-yellow-50 text-yellow-700 rounded">
                    <p className="font-medium">Missing Documents:</p>
                    <ul className="list-disc list-inside">
                      {request.documents_complete.missing.map((doc) => (
                        <li key={doc}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* View Details Button */}
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <VehicleDetailsModal
          sellRequest={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
} 