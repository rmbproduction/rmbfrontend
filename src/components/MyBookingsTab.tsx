import React, { useState, useEffect } from 'react';
import { CalendarClock, Bike, User, MapPin, Phone, Clock, Info, Check, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import marketplaceService from '../services/marketplaceService';
import { API_CONFIG } from '../config/api.config';
import { Link } from 'react-router-dom';

interface Booking {
  id: string | number;
  vehicle: {
    id: string | number;
    brand: string;
    model: string;
    year: number;
    vehicle_type: string;
    front_image_url?: string;
    registration_number?: string;
    color?: string;
  };
  status: string;
  status_display: string;
  booking_date: string;
  booking_date_display: string;
  contact_number: string;
  notes: string;
  referrer?: string | null; // Optional referrer path to redirect back to the original page
  schedule_date?: string;
  schedule_time?: string;
}

const MyBookingsTab: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh the bookings list
  const refreshBookings = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const bookingsData = await marketplaceService.getUserBookings();
        console.log('Fetched bookings:', bookingsData);
        setBookings(bookingsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load your bookings. Please try again later.');
        // Try to use cached bookings if available
        try {
          const cachedBookings = sessionStorage.getItem('user_vehicle_bookings');
          if (cachedBookings) {
            setBookings(JSON.parse(cachedBookings));
            setError('Using cached booking data. Some information might be outdated.');
          }
        } catch (cacheErr) {
          console.error('Error reading cached bookings:', cacheErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [refreshKey]);

  const handleCancelBooking = async (bookingId: string | number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await marketplaceService.cancelBooking(String(bookingId));
      toast.success('Booking cancelled successfully');
      refreshBookings();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast.error('Failed to cancel booking. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="w-4 h-4" />;
      case 'confirmed':
        return <Check className="w-4 h-4" />;
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  // Get the exact vehicle image from the buy vehicle page
  const getVehicleImage = (booking: Booking) => {
    const { vehicle } = booking;
    
    // Always use the original front_image_url exactly as it comes from the vehicle detail page
    if (vehicle && vehicle.front_image_url) {
      // Use the URL directly without any transformation
      return vehicle.front_image_url;
    }
    
    // Try to construct an image URL from the API config if vehicle data exists
    if (vehicle && vehicle.id) {
      try {
        // Try to get an image URL from the API config
        const apiImageUrl = API_CONFIG.getVehicleImageUrl(vehicle.id);
        if (apiImageUrl) {
          return apiImageUrl;
        }
      } catch (e) {
        console.warn('Failed to get vehicle image URL from API config:', e);
      }
    }
    
    // Only use placeholder as last resort if no image exists
    const brandInitial = vehicle?.brand?.charAt(0) || 'V';
    const modelInitial = vehicle?.model?.charAt(0) || '';
    const initials = brandInitial + modelInitial;
    
    return `https://via.placeholder.com/640x480/FF5733/FFFFFF?text=${initials}`;
  };

  // Format vehicle specs for display
  const getVehicleSpecs = (vehicle: Booking['vehicle']) => {
    const specs = [];
    
    if (vehicle.year) specs.push(`${vehicle.year}`);
    if (vehicle.vehicle_type) specs.push(vehicle.vehicle_type.charAt(0).toUpperCase() + vehicle.vehicle_type.slice(1));
    if (vehicle.color) specs.push(vehicle.color);
    
    return specs.join(' • ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 p-6">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={refreshBookings}
          className="px-4 py-2 bg-[#FF5733] text-white rounded-md hover:bg-opacity-90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 p-6">
        <CalendarClock className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Yet</h3>
        <p className="text-gray-600 mb-4">You haven't booked any vehicles yet.</p>
        <Link
          to="/buy"
          className="px-4 py-2 bg-[#FF5733] text-white rounded-md hover:bg-opacity-90 transition-colors"
        >
          Browse Vehicles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">My Vehicle Bookings</h2>
        <button
          onClick={refreshBookings}
          className="text-[#FF5733] hover:text-[#E64A19] text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-700">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {bookings.map((booking, index) => (
          <div key={booking.id || index} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="flex flex-col md:flex-row">
              {/* Vehicle Image */}
              <div className="w-full md:w-2/5 lg:w-1/3 h-60 md:h-auto relative">
                <img
                  src={getVehicleImage(booking)}
                  alt={`${booking.vehicle?.brand || 'Vehicle'} ${booking.vehicle?.model || ''}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Use the same default image used in the vehicle detail page
                    const defaultImage = API_CONFIG.getDefaultVehicleImage?.() || 
                      'https://via.placeholder.com/640x480/FF5733/FFFFFF?text=RMB';
                    (e.target as HTMLImageElement).src = defaultImage;
                    console.log('Using default vehicle image due to error');
                  }}
                />
                {/* Status Badge */}
                <div className={`absolute top-3 right-3 ${getStatusColor(booking.status)} px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-sm`}>
                  {getStatusIcon(booking.status)}
                  <span className="ml-1">{booking.status_display}</span>
                </div>
                
                {/* Image Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                
                {/* Vehicle Caption */}
                <div className="absolute bottom-0 left-0 w-full p-3 text-white">
                  <div className="text-lg font-bold drop-shadow-md">
                    {booking.vehicle?.brand || 'Unknown'} {booking.vehicle?.model || 'Model'}
                  </div>
                  <div className="text-sm font-medium drop-shadow-md">
                    {booking.vehicle?.year || ''}
                    {booking.vehicle?.color && ` · ${booking.vehicle.color}`}
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="p-4 flex-grow">
                <div className="flex flex-col h-full">
                  {/* Booking Info Section */}
                  <div>
                    <div className="flex items-center mb-2">
                      <CalendarClock className="h-4 w-4 text-[#FF5733] mr-1" />
                      <span className="text-sm text-gray-600 font-medium">
                        {booking.booking_date_display || new Date(booking.booking_date || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* If schedule date exists, show it */}
                    {booking.schedule_date && (
                      <div className="flex items-center mb-2 text-green-700">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">
                          Scheduled: {new Date(booking.schedule_date).toLocaleDateString()} 
                          {booking.schedule_time && ` at ${booking.schedule_time}`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Add a booking ID */}
                  <div className="mt-1 mb-3">
                    <span className="text-xs text-gray-500">Booking ID: {booking.id || "undefined"}</span>
                  </div>
                  
                  {/* Contact Number */}
                  {booking.contact_number && (
                    <div className="mb-3 flex items-center">
                      <Phone className="h-4 w-4 text-[#FF5733] mr-1" />
                      <a 
                        href={`tel:${booking.contact_number}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {booking.contact_number}
                      </a>
                    </div>
                  )}
                  
                  <div className="mb-4 flex justify-end">
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors flex items-center"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyBookingsTab; 