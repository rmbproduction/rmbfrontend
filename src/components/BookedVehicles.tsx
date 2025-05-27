import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../config/api.config';
import { Loader2, Info, X } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api.config';

interface BookedVehicle {
  id: string;
  vehicle_details: {
    id: string;
    brand: string;
    model: string;
    year?: string;
    price?: string;
    mileage?: string;
    fuel_type?: string;
    transmission?: string;
    description?: string;
    images?: string[];
  };
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  status_display: string;
  booking_date: string;
  booking_date_display: string;
  contact_number: string;
  notes?: string;
}

interface VehicleDetailsModalProps {
  booking: BookedVehicle;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({ booking, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Vehicle Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Vehicle Information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Vehicle Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Brand</p>
                <p className="font-medium">{booking.vehicle_details.brand}</p>
              </div>
              <div>
                <p className="text-gray-600">Model</p>
                <p className="font-medium">{booking.vehicle_details.model}</p>
              </div>
              {booking.vehicle_details.year && (
                <div>
                  <p className="text-gray-600">Year</p>
                  <p className="font-medium">{booking.vehicle_details.year}</p>
                </div>
              )}
              {booking.vehicle_details.mileage && (
                <div>
                  <p className="text-gray-600">Mileage</p>
                  <p className="font-medium">{booking.vehicle_details.mileage}</p>
                </div>
              )}
              {booking.vehicle_details.fuel_type && (
                <div>
                  <p className="text-gray-600">Fuel Type</p>
                  <p className="font-medium">{booking.vehicle_details.fuel_type}</p>
                </div>
              )}
              {booking.vehicle_details.transmission && (
                <div>
                  <p className="text-gray-600">Transmission</p>
                  <p className="font-medium">{booking.vehicle_details.transmission}</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Booking Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Booking Date</p>
                <p className="font-medium">
                  {new Date(booking.booking_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status_display}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Contact Number</p>
                <p className="font-medium">{booking.contact_number}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
              <p className="text-sm text-gray-600">{booking.notes}</p>
            </div>
          )}

          {/* Vehicle Description */}
          {booking.vehicle_details.description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Vehicle Description</h4>
              <p className="text-sm text-gray-600">{booking.vehicle_details.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BookedVehicles = () => {
  const [selectedBooking, setSelectedBooking] = useState<BookedVehicle | null>(null);

  const { data: bookings, isLoading, error } = useQuery<BookedVehicle[]>({
    queryKey: ['userBookings'],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.marketplace.bookings);
      console.log('Bookings response:', response);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF5733]" />
      </div>
    );
  }

  if (error) {
    console.error('Booking fetch error:', error);
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load bookings. Please try again later.
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        You haven't booked any vehicles yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">My Booked Vehicles</h2>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-[#FF5733] transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-gray-900">
                  {booking.vehicle_details.brand} {booking.vehicle_details.model}
                </h3>
                <p className="text-sm text-gray-600">
                  Booked on: {new Date(booking.booking_date).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  booking.status
                )}`}
              >
                {booking.status_display}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>Contact: {booking.contact_number}</p>
              {booking.notes && <p className="mt-1">Notes: {booking.notes}</p>}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedBooking(booking)}
                className="flex items-center px-3 py-1.5 text-sm text-[#FF5733] hover:bg-[#FFF5F2] rounded-lg transition-colors"
              >
                <Info className="h-4 w-4 mr-1" />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedBooking && (
        <VehicleDetailsModal
          booking={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
};

export default BookedVehicles; 