import React, { useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import TokenManager from '../services/tokenManager';

interface VehicleDetailsModalProps {
  sellRequest: any;
  onClose: () => void;
}

const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({ sellRequest, onClose }) => {
  const [loadingDocs, setLoadingDocs] = useState<{[key: string]: boolean}>({});
  const [documentErrors, setDocumentErrors] = useState<{[key: string]: string}>({});

  const handleDocumentClick = async (documentType: string) => {
    try {
      setLoadingDocs(prev => ({ ...prev, [documentType]: true }));
      setDocumentErrors(prev => ({ ...prev, [documentType]: '' }));

      const accessToken = TokenManager.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await axios.get(
        `https://repairmybike.up.railway.app/api/marketplace/secure-document/${sellRequest.id}/${documentType}/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.data.url) {
        // Create PDF viewer modal
        const viewerWindow = window.open('', '_blank', 'width=800,height=600');
        if (viewerWindow) {
          viewerWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${response.data.filename}</title>
                <style>
                  body, html {
                    margin: 0;
                    padding: 0;
                    height: 100vh;
                    width: 100vw;
                    overflow: hidden;
                  }
                  #viewer {
                    width: 100%;
                    height: 100%;
                    border: none;
                  }
                </style>
              </head>
              <body>
                <object
                  id="viewer"
                  data="${response.data.url}"
                  type="application/pdf"
                >
                  <embed 
                    src="${response.data.url}" 
                    type="application/pdf"
                    style="width:100%; height:100%;"
                  />
                </object>
              </body>
            </html>
          `);
          viewerWindow.document.close();
        } else {
          // Fallback if popup is blocked
          window.location.href = response.data.url;
        }
      } else {
        throw new Error('No document URL received');
      }
    } catch (error: any) {
      console.error('Error accessing document:', error);
      setDocumentErrors({
        ...documentErrors,
        [documentType]: error.response?.data?.error || 'Failed to access document'
      });
    } finally {
      setLoadingDocs(prev => ({ ...prev, [documentType]: false }));
    }
  };

  if (!sellRequest) return null;

  const renderTimeline = () => {
    const timelineEvents = [
      {
        status: 'submitted',
        label: 'Request Submitted',
        date: new Date(sellRequest.created_at).toLocaleDateString(),
        completed: true
      },
      {
        status: 'inspection_scheduled',
        label: 'Inspection Scheduled',
        date: '',
        completed: ['inspection_scheduled', 'under_inspection', 'inspection_done'].includes(sellRequest.status)
      },
      {
        status: 'under_inspection',
        label: 'Under Inspection',
        date: '',
        completed: ['under_inspection', 'inspection_done'].includes(sellRequest.status)
      },
      {
        status: 'inspection_done',
        label: 'Inspection Complete',
        date: '',
        completed: ['inspection_done'].includes(sellRequest.status)
      }
    ];

    return (
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div className="space-y-6 relative">
          {timelineEvents.map((event) => (
            <div key={event.status} className="flex items-start">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 
                ${event.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                <div className={`w-3 h-3 rounded-full ${event.completed ? 'bg-green-600' : 'bg-gray-400'}`}></div>
              </div>
              <div className="ml-4">
                <h4 className={`font-medium ${event.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                  {event.label}
                </h4>
                {event.date && <p className="text-sm text-gray-500">{event.date}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-50">
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Status and Timeline */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Request Status</h3>
            {renderTimeline()}
          </div>

          {/* Vehicle Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Brand & Model</label>
                  <p className="mt-1">{sellRequest.vehicle_details?.brand} {sellRequest.vehicle_details?.model}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Registration Number</label>
                  <p className="mt-1">{sellRequest.vehicle_details?.registration_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Year</label>
                  <p className="mt-1">{sellRequest.vehicle_details?.year}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Type</label>
                  <p className="mt-1">{sellRequest.vehicle_details?.vehicle_type_display}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Expected Price</label>
                  <p className="mt-1">₹{parseInt(sellRequest.vehicle_details?.expected_price || '0').toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Fuel Type</label>
                  <p className="mt-1">{sellRequest.vehicle_details?.fuel_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Engine Capacity</label>
                  <p className="mt-1">{sellRequest.vehicle_details?.engine_capacity}cc</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Color</label>
                  <p className="mt-1">{sellRequest.vehicle_details?.color}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Photos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Vehicle Photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['front', 'back', 'left', 'right', 'dashboard', 'odometer', 'engine'].map((view) => (
                sellRequest[`photo_${view}`] && (
                  <div key={view} className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={`https://res.cloudinary.com/dz81bjuea/${sellRequest[`photo_${view}`]}`}
                      alt={`${view} view`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(sellRequest.documents || {}).map(([key]) => (
                <div key={key}>
                  <button
                    onClick={() => handleDocumentClick(key)}
                    disabled={loadingDocs[key]}
                    className={`w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors relative ${
                      loadingDocs[key] ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      {loadingDocs[key] ? (
                        <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                      ) : (
                        <FileText className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {loadingDocs[key] ? 'Loading...' : 'Click to view'}
                      </p>
                    </div>
                  </button>
                  {documentErrors[key] && (
                    <p className="mt-2 text-sm text-red-600">
                      {documentErrors[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pickup Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Pickup Details</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Pickup Address</label>
                <p className="mt-1">{sellRequest.pickup_address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Contact Number</label>
                <p className="mt-1">{sellRequest.contact_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Pickup Slot</label>
                <p className="mt-1">{new Date(sellRequest.pickup_slot).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Inspection Details (if available) */}
          {sellRequest.inspection_details && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Inspection Report</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(sellRequest.inspection_details).map(([key, value]) => (
                    key !== 'id' && key !== 'sell_request' && (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-500 capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <p className="mt-1">{String(value)}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsModal; 