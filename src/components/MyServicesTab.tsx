import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
import { Bike, Calendar, Clock, MapPin, Check, X, AlertTriangle, ExternalLink, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api.config';

// Add proper typing for service item
interface ServiceItem {
  id: number;
  name: string;
  quantity: number;
  price: string;
}

// Improve type safety for service booking
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

// Add default values for service items
const DEFAULT_SERVICE_ITEM: ServiceItem = {
  id: 0,
  name: 'Unknown Service',
  quantity: 1,
  price: '0.00'
};

// Add a reusable error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback?: React.ReactNode }> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error('[CRITICAL] Component error caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-red-600 text-sm mt-1">
            We couldn't display this section. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm bg-red-100 px-3 py-1 rounded text-red-800 hover:bg-red-200"
          >
            Refresh
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Improve the API error handling with a custom function
const handleApiError = (error: any, fallbackMessage: string): string => {
  console.error('[ERROR]', error);
  
  if (error instanceof Response) {
    return `Server error: ${error.status} ${error.statusText}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return fallbackMessage;
};

// Create a safer fetch function
const safeFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
};

const MyServicesTab: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Add state for the cancel confirmation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<string | number | null>(null);
  const [cancelingBooking, setCancelingBooking] = useState(false);

  // Use refs to prevent race conditions
  const bookingsRef = useRef<ServiceBooking[]>([]);
  
  // Update ref when state changes
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  // Memoize expensive calculations
  const hasCancelledBookings = useMemo(() => 
    bookings.some(booking => 
      booking?.status === 'cancelled' || booking?.status_display?.toLowerCase() === 'cancelled'
    ), 
    [bookings]
  );

  // Convert to useCallback for better performance
  const refreshBookings = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  // Add a debounce function for frequent operations
  const debounce = useCallback((fn: Function, ms = 300) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function(this: any, ...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
  }, []);

  // Safely update session storage
  const updateSessionStorage = useCallback((key: string, data: any) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('[ERROR] Failed to update session storage:', error);
      return false;
    }
  }, []);

  // Improved clear cancelled bookings function with better error handling
  const clearCancelledBookings = useCallback(async () => {
    try {
      // Get access token for potential API calls
      const accessToken = localStorage.getItem('accessToken');
      
      // Use ref for up-to-date bookings state
      const currentBookings = bookingsRef.current;
      
      // Filter out the cancelled bookings locally with null safety
      const cancelledBookings = currentBookings.filter(booking => 
        booking?.status === 'cancelled' || booking?.status_display?.toLowerCase() === 'cancelled'
      );
      
      const updatedBookings = currentBookings.filter(booking => 
        booking?.status !== 'cancelled' && booking?.status_display?.toLowerCase() !== 'cancelled'
      );
      
      // Update state immediately for responsive UI
      setBookings(updatedBookings);
      
      // Also update in session storage
      updateSessionStorage('user_service_bookings', updatedBookings);
      
      // If authenticated, also clear from backend
      if (accessToken && cancelledBookings.length > 0) {
        try {
          console.log('[DEBUG] Attempting to clear cancelled bookings from backend');
          
          // Collect IDs of cancelled bookings, with null safety
          const cancelledIds = cancelledBookings
            .filter(booking => booking?.id)
            .map(booking => booking.id);
          
          if (cancelledIds.length === 0) {
            console.log('[DEBUG] No valid booking IDs to clear');
            return;
          }
          
          // Make API call to backend to clear cancelled bookings
          const response = await safeFetch(`${API_CONFIG.BASE_URL}/repairing_service/bookings/clear-cancelled/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            credentials: 'omit',
            body: JSON.stringify({ booking_ids: cancelledIds })
          });
          
          if (!response.ok) {
            console.warn(`[WARN] Backend returned ${response.status} when clearing cancelled bookings`);
            // Even if backend fails, we keep the UI updated
          } else {
            console.log('[DEBUG] Successfully cleared cancelled bookings from backend');
          }
        } catch (apiError) {
          console.error('[ERROR] API call to clear cancelled bookings failed:', apiError);
          // Do not show error to user as the UI is already updated
        }
      }
      
      toast.success('Cancelled service requests cleared');
    } catch (error) {
      console.error('[ERROR] Error clearing cancelled bookings:', error);
      toast.error('Failed to clear cancelled bookings. Please try again.');
    }
  }, [updateSessionStorage]);

  // Format date with better error handling
  const formatDate = useCallback((dateString?: string): string => {
    if (!dateString) return 'Date pending';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      console.error('[ERROR] Error formatting date:', error);
      return 'Date error';
    }
  }, []);
  
  // Format time with better error handling
  const formatTime = useCallback((timeString?: string): string => {
    if (!timeString) return 'Time pending';
    
    try {
      // Check if timeString has the expected format (HH:MM)
      if (!/^\d{1,2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      
      // Convert 24-hour format to 12-hour format with AM/PM
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      
      // Validate hours and minutes
      if (isNaN(hour) || hour < 0 || hour > 23) {
        return timeString;
      }
      
      const minutesNum = parseInt(minutes);
      if (isNaN(minutesNum) || minutesNum < 0 || minutesNum > 59) {
        return timeString;
      }
      
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12; // Convert 0 to 12
      
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('[ERROR] Error formatting time:', error);
      return timeString;
    }
  }, []);

  // Get status color with null safety
  const getStatusColor = useCallback((status?: string): string => {
    if (!status) return 'text-gray-600 bg-gray-50';
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'confirmed') return 'text-green-600 bg-green-50';
    if (statusLower === 'cancelled' || statusLower === 'rejected') return 'text-red-600 bg-red-50';
    if (statusLower === 'scheduled') return 'text-blue-600 bg-blue-50';
    return 'text-orange-600 bg-orange-50'; // Default for pending or other statuses
  }, []);

  // Create a retry mechanism for API calls
  const fetchWithRetry = useCallback(async (url: string, options: RequestInit, retries = 2): Promise<Response> => {
    try {
      return await safeFetch(url, options);
    } catch (error) {
      if (retries <= 0) throw error;
      
      // Wait for 1s before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`[INFO] Retrying API call, ${retries} attempts left`);
      
      return fetchWithRetry(url, options, retries - 1);
    }
  }, []);

  // Use a safe API fetch for bookings
  useEffect(() => {
    let isMounted = true;
    
    const fetchBookings = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      const allBookings: ServiceBooking[] = [];
      let fetchError = null;
      
      try {
        // First try to load from API
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          try {
            console.log('[DEBUG] Fetching bookings from API');
            const response = await fetchWithRetry(`${API_CONFIG.BASE_URL}/repairing_service/bookings/`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              credentials: 'omit'
            });
            
            if (response.ok) {
              const apiBookings = await response.json();
              console.log('[DEBUG] Fetched service bookings from API:', apiBookings);
              
              if (Array.isArray(apiBookings)) {
                // Ensure all required fields are present
                const validatedBookings = apiBookings.map(booking => {
                  // Make sure services array is always defined
                  return {
                    ...booking,
                    services: Array.isArray(booking.services) 
                      ? booking.services.map((s: any) => ({ ...DEFAULT_SERVICE_ITEM, ...s }))
                      : []
                  };
                });
                
                allBookings.push(...validatedBookings);
                
                // Cache the successful API response
                updateSessionStorage('user_service_bookings', validatedBookings);
                sessionStorage.setItem('user_service_bookings_timestamp', Date.now().toString());
              }
            } else {
              console.error(`[ERROR] API returned ${response.status}: ${response.statusText}`);
              fetchError = `Server error: ${response.status}`;
              
              if (response.status !== 404) { // Ignore 404s as the endpoint might not exist yet
                const errorText = await response.text();
                console.error('[ERROR] API response:', errorText);
              }
            }
          } catch (apiError) {
            console.error('[ERROR] Error fetching service bookings from API:', apiError);
            fetchError = handleApiError(apiError, 'Failed to load your service bookings from server');
          }
        }
        
        // If API call failed or returned no results, try to load from sessionStorage
        if (allBookings.length === 0) {
        try {
          console.log('[DEBUG] Checking sessionStorage for bookings');
          const storedBookings = sessionStorage.getItem('user_service_bookings');
          if (storedBookings) {
            const parsedBookings = JSON.parse(storedBookings);
            console.log('[DEBUG] Found stored service bookings:', parsedBookings);
            
            if (Array.isArray(parsedBookings)) {
                // Add timestamp to each booking for sorting
                const bookingsWithTimestamp = parsedBookings.map(booking => ({
                  ...booking,
                  timestamp: booking.timestamp || new Date(booking.created_at || Date.now()).getTime()
                }));
                
                allBookings.push(...bookingsWithTimestamp);
            }
          } else {
            console.log('[DEBUG] No stored bookings found in sessionStorage');
          }
        } catch (storageError) {
          console.error('[ERROR] Error loading stored service bookings:', storageError);
            // If we couldn't load from storage either, let's set the error
            if (fetchError && allBookings.length === 0) {
              if (isMounted) setError(fetchError);
            }
          }
        }
        
        // Sort by date, newest first
        allBookings.sort((a, b) => {
          const dateA = a.timestamp || new Date(a.created_at || Date.now()).getTime();
          const dateB = b.timestamp || new Date(b.created_at || Date.now()).getTime();
          return dateB - dateA;
        });
        
        console.log(`[DEBUG] Total bookings after merging: ${allBookings.length}`);
        
        if (isMounted) {
          if (allBookings.length > 0) {
        setBookings(allBookings);
            // Clear error if we have bookings
        setError(null);
          } else if (fetchError) {
            // Only set error if we have no bookings
            setError(fetchError);
          }
        }
      } catch (err) {
        console.error('[ERROR] Error fetching service bookings:', err);
        if (isMounted) {
        setError('Failed to load your service bookings. Please try again later.');
        }
      } finally {
        if (isMounted) {
        setLoading(false);
        }
      }
    };

    fetchBookings();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [refreshKey, fetchWithRetry, updateSessionStorage]);

  // Update to open the confirmation modal instead of using browser confirm
  const openCancelConfirmation = useCallback((bookingId: string | number) => {
    if (!bookingId) {
      console.error('[ERROR] Attempted to cancel booking with invalid ID');
      toast.error('Cannot cancel booking with invalid ID');
      return;
    }
    
    setCancelBookingId(bookingId);
    setShowCancelModal(true);
  }, []);

  // Cancel booking function with better error handling
  const confirmCancelBooking = useCallback(async () => {
    if (!cancelBookingId) {
      console.error('[ERROR] No booking ID set for cancellation');
      setShowCancelModal(false);
      return;
    }
    
    setCancelingBooking(true);
    console.log(`[DEBUG] Attempting to cancel booking ID: ${cancelBookingId}`);
    
    try {
      // Get the access token
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('You need to be logged in to cancel a booking');
      }
      
      // Make API call to cancel the booking
      const response = await fetchWithRetry(`${API_CONFIG.BASE_URL}/repairing_service/bookings/${cancelBookingId}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'omit'
      }, 1); // Only retry once for cancellation
      
      // Convert to text first so we can log it in case of error
      const responseText = await response.text();
      
      if (!response.ok) {
        // Handle error
        console.error(`[ERROR] Failed to cancel booking: ${responseText}`);
        
        let errorData;
        try {
          // Try to parse as JSON
          errorData = JSON.parse(responseText);
        } catch (e) {
          // If not JSON, use as plain text
          errorData = { error: responseText };
        }
        
        throw new Error(errorData.error || errorData.message || `Failed to cancel booking (${response.status})`);
      }
      
      // Try to parse the response body
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (err) {
        console.log("[DEBUG] Could not parse response as JSON, using default success object");
        responseData = { status: "success" };
      }
      
      console.log('[DEBUG] API response body:', responseData);
      console.log('[DEBUG] Successfully cancelled booking, updating UI state');
      
      // Update local state - Fix the toString() error with null checks
      setBookings(prev => {
        const updated = prev.map(booking => {
          // Safely convert IDs to strings for comparison
          const bookingIdStr = booking?.id?.toString() || '';
          const cancelIdStr = cancelBookingId?.toString() || '';
          
          if (bookingIdStr === cancelIdStr) {
            return { 
              ...booking, 
              status: 'cancelled', 
              status_display: 'Cancelled',
              timestamp: Date.now() // Update timestamp for consistent sorting
            };
          }
          return booking;
        });
        console.log('[DEBUG] Updated bookings state:', updated);
        return updated;
      });
      
      // Also update in session storage - Fix the toString() error with null checks
      updateSessionStorage('user_service_bookings', bookingsRef.current.map(booking => {
        // Safely convert IDs to strings for comparison
        const bookingIdStr = booking?.id?.toString() || '';
        const cancelIdStr = cancelBookingId?.toString() || '';
        
        if (bookingIdStr === cancelIdStr) {
          return { 
            ...booking, 
            status: 'cancelled', 
            status_display: 'Cancelled',
            timestamp: Date.now() // Update timestamp for consistent sorting
          };
        }
        return booking;
      }));
      
      // Success notification
      toast.success('Service booking cancelled successfully');
      console.log('[DEBUG] Booking cancellation complete');
    } catch (err) {
      console.error('Error cancelling service booking:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to cancel booking. Please try again.');
    } finally {
      // Always clean up state regardless of success or failure
      console.log('[DEBUG] Cleaning up state after cancellation attempt');
      setCancelingBooking(false);
      setShowCancelModal(false);
      setCancelBookingId(null);
    }
  }, [cancelBookingId, fetchWithRetry, updateSessionStorage]);

  // Wrap the Link with a safety check
  const SafeLink = useCallback(({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) => {
    try {
      return (
        <Link to={to} className={className}>
          {children}
        </Link>
      );
    } catch (error) {
      console.error('[ERROR] React Router context error:', error);
      return (
        <a 
          href={to} 
          className={className}
          onClick={(e) => {
            e.preventDefault();
            try {
              navigate(to);
            } catch (navError) {
              console.error('[ERROR] Navigation failed:', navError);
              window.location.href = to;
            }
          }}
        >
          {children}
        </a>
      );
    }
  }, [navigate]);

  // Display a loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }

  // Render the rest of the component
  return (
    <ErrorBoundary>
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Services</h2>
          <div className="flex space-x-2">
            {hasCancelledBookings && (
              <button
                onClick={clearCancelledBookings}
                className="flex items-center bg-red-50 text-red-600 px-3 py-1 rounded-md text-sm hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} className="mr-2" />
                Clear Cancelled
              </button>
            )}
        <button
          onClick={refreshBookings}
              className="flex items-center bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm hover:bg-blue-100 transition-colors"
        >
              <RefreshIcon className="mr-2" />
          Refresh
        </button>
          </div>
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
            <SafeLink
            to="/services"
            className="mt-4 inline-block text-[#FF5733] hover:underline"
          >
            Browse our services
            </SafeLink>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
                key={booking?.id || Math.random().toString(36).substr(2, 9)}
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
                      {typeof booking.total_amount === 'string' || typeof booking.total_amount === 'number'
                        ? parseFloat(booking.total_amount as string).toFixed(2)
                        : booking.services?.reduce(
                        (sum, item) => sum + parseFloat(item.price) * (item.quantity || 1),
                        0
                          ).toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              {/* Actions */}
                {booking.status?.toLowerCase() !== 'cancelled' &&
                  booking.status?.toLowerCase() !== 'completed' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => openCancelConfirmation(booking.id)}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center transition-colors bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel Booking
                    </button>
                    </div>
                  )}

                {booking.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <SafeLink
                      to={`/review/${booking.id}`}
                      className="text-[#FF5733] hover:underline text-sm flex items-center"
                    >
                      <Rate className="mr-1" size={14} />
                      Rate Service
                    </SafeLink>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Add the cancel confirmation modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Only close if clicking directly on the backdrop
            if (e.target === e.currentTarget) {
              setShowCancelModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 animate-fade-in" 
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
          >
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Service Booking</h3>
              <p className="text-gray-600">
                Are you sure you want to cancel this service booking? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-center gap-3 mt-6" style={{ zIndex: 100 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCancelModal(false);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={cancelingBooking}
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  confirmCancelBooking();
                }}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                disabled={cancelingBooking}
              >
                {cancelingBooking ? (
                    <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Cancelling...
                  </div>
                ) : (
                    <div className="flex items-center">
                    <X className="w-4 h-4 mr-1" />
                    Yes, Cancel
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
};

// Simple refresh icon component
const RefreshIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 16}
    height={props.size || 16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </svg>
);

const Rate = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default MyServicesTab; 