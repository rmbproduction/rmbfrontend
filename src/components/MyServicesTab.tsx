import React, { useState, useEffect } from 'react';
import { Bike, Calendar, Clock, MapPin, Check, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

interface ServiceItem {
  id: number;
  name: string;
  quantity: number;
  price: string;
}

interface ServiceBooking {
  id: string | number;
  reference?: string;
  created_at: string;
  status: string;
  status_display?: string;
  total_amount?: string | number;
  schedule_date?: string;
  schedule_time?: string;
  services: ServiceItem[];
  vehicle?: {
    vehicle_type: number;
    manufacturer: number;
    model: number;
    vehicle_type_name?: string;
    manufacturer_name?: string;
    model_name?: string;
  };
  address?: string;
  timestamp?: number;
}

const MyServicesTab: React.FC = () => {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh the bookings list
  const refreshBookings = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      return 'Date pending';
    }
  };
  
  // Format time
  const formatTime = (timeString?: string): string => {
    if (!timeString) return 'Time pending';
    
    try {
      // Convert 24-hour format to 12-hour format with AM/PM
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12; // Convert 0 to 12
      
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    status = status.toLowerCase();
    if (status === 'completed' || status === 'confirmed') return 'text-green-600 bg-green-50';
    if (status === 'cancelled' || status === 'rejected') return 'text-red-600 bg-red-50';
    if (status === 'scheduled') return 'text-blue-600 bg-blue-50';
    return 'text-orange-600 bg-orange-50'; // Default for pending or other statuses
  };

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const allBookings: ServiceBooking[] = [];
      
      try {
        // First try to load from API
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          try {
            const response = await fetch('http://127.0.0.1:8000/api/repairing_service/bookings/', {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              credentials: 'omit'
            });
            
            if (response.ok) {
              const apiBookings = await response.json();
              console.log('Fetched service bookings from API:', apiBookings);
              
              if (Array.isArray(apiBookings)) {
                allBookings.push(...apiBookings);
              }
            }
          } catch (apiError) {
            console.error('Error fetching service bookings from API:', apiError);
          }
        }
        
        // Then try to load from sessionStorage
        try {
          const storedBookings = sessionStorage.getItem('user_service_bookings');
          if (storedBookings) {
            const parsedBookings = JSON.parse(storedBookings);
            console.log('Found stored service bookings:', parsedBookings);
            
            if (Array.isArray(parsedBookings)) {
              // Filter out duplicates (items already loaded from API)
              const newBookings = parsedBookings.filter(
                stored => !allBookings.some(api => api.id === stored.id)
              );
              
              allBookings.push(...newBookings);
            }
          }
        } catch (storageError) {
          console.error('Error loading stored service bookings:', storageError);
        }
        
        // Sort by date, newest first
        allBookings.sort((a, b) => {
          const dateA = a.timestamp || new Date(a.created_at).getTime();
          const dateB = b.timestamp || new Date(b.created_at).getTime();
          return dateB - dateA;
        });
        
        setBookings(allBookings);
        setError(null);
      } catch (err) {
        console.error('Error fetching service bookings:', err);
        setError('Failed to load your service bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [refreshKey]);

  // Handle cancel booking
  const handleCancelBooking = async (bookingId: string | number) => {
    if (!confirm('Are you sure you want to cancel this service booking?')) {
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`http://127.0.0.1:8000/api/repairing_service/bookings/${bookingId}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id.toString() === bookingId.toString() 
          ? { ...booking, status: 'cancelled', status_display: 'Cancelled' } 
          : booking
      ));
      
      // Also update in session storage
      try {
        const storedBookings = sessionStorage.getItem('user_service_bookings');
        if (storedBookings) {
          const parsedBookings = JSON.parse(storedBookings);
          const updatedBookings = parsedBookings.map((booking: any) => 
            booking.id.toString() === bookingId.toString() 
              ? { ...booking, status: 'cancelled', status_display: 'Cancelled' } 
              : booking
          );
          sessionStorage.setItem('user_service_bookings', JSON.stringify(updatedBookings));
        }
      } catch (storageError) {
        console.error('Error updating stored bookings:', storageError);
      }
      
      toast.success('Service booking cancelled successfully');
    } catch (err) {
      console.error('Error cancelling service booking:', err);
      toast.error('Failed to cancel booking. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">My Service Bookings</h2>
        <button
          onClick={refreshBookings}
          className="text-sm text-[#FF5733] hover:underline flex items-center"
        >
          <RefreshIcon className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="py-8 text-center">
          <Bike className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">You don't have any service bookings yet.</p>
          <Link
            to="/services"
            className="mt-4 inline-block text-[#FF5733] hover:underline"
          >
            Browse our services
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <span className="text-sm text-gray-500">Booking Reference</span>
                  <h3 className="font-semibold">{booking.reference || `RMB-${booking.id}`}</h3>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium mt-2 md:mt-0 inline-flex items-center ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {booking.status_display || booking.status}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Service Date & Time */}
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-500 block">Scheduled Date</span>
                    <span>
                      {booking.schedule_date 
                        ? formatDate(booking.schedule_date) 
                        : 'To be confirmed'}
                    </span>
                    {booking.schedule_time && (
                      <span className="text-gray-500 ml-2">
                        at {formatTime(booking.schedule_time)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Vehicle */}
                <div className="flex items-start">
                  <Bike className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-500 block">Vehicle</span>
                    {booking.vehicle ? (
                      <span>
                        {booking.vehicle.manufacturer_name || `Manufacturer ${booking.vehicle.manufacturer}`} {' '}
                        {booking.vehicle.model_name || `Model ${booking.vehicle.model}`}
                      </span>
                    ) : (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <span className="text-sm text-gray-500 block mb-2">Services</span>
                <div className="space-y-2">
                  {booking.services?.map((service, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>
                        {service.name || `Service #${service.id}`}
                        {service.quantity > 1 && ` (x${service.quantity})`}
                      </span>
                      <span className="font-medium">
                        ₹{parseFloat(service.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-bold text-[#FF5733]">
                    ₹
                    {booking.total_amount ||
                      booking.services?.reduce(
                        (sum, item) => sum + parseFloat(item.price) * (item.quantity || 1),
                        0
                      ).toFixed(2) ||
                      '0.00'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {booking.status.toLowerCase() !== 'cancelled' &&
                booking.status.toLowerCase() !== 'completed' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel Booking
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple refresh icon component
const RefreshIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

export default MyServicesTab; 