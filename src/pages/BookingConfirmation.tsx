import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Clock, Bike, MapPin, ChevronLeft, Home } from 'lucide-react';
import { toast } from 'react-toastify';

interface BookingDetails {
  id: number | string;
  reference: string;
  total_amount: string | number;
  status: string;
  created_at: string;
  service_date?: string;
  address?: string;
  schedule_date?: string;
  schedule_time?: string;
  distance_fee?: number;
  latitude?: number;
  longitude?: number;
}

const BookingConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  // Function to format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Date pending';
    
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
  
  // Function to format time
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

  useEffect(() => {
    // Get booking details from location state or try to fetch
    const bookingDetails = location.state?.booking;
    
    if (bookingDetails) {
      setBooking(bookingDetails);
    } else {
      // If no booking in location state, navigate back to homepage
      toast.error('No booking information found');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [location, navigate]);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#ffe4d4] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Success Header */}
          <div className="bg-[#FF5733] text-white px-6 py-8 text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            </div>
            <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
            <p className="mt-2 text-lg opacity-90">
              Thank you for choosing our service. Our experts will contact you shortly.
            </p>
          </div>
          
          {/* Booking Details */}
          <div className="p-6 md:p-8">
            <div className="mb-6 border-b border-gray-100 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Booking Reference</h2>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <span className="text-lg font-medium text-[#FF5733]">{booking.reference}</span>
              </div>
              <p className="mt-2 text-sm text-gray-500 text-center">
                You'll receive a confirmation email and SMS shortly
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Schedule Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Service Details</h3>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-[#FF5733] mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Scheduled Date</p>
                    <p className="font-medium">
                      {booking.schedule_date 
                        ? formatDate(booking.schedule_date) 
                        : formatDate(new Date().toISOString())}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-[#FF5733] mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Scheduled Time</p>
                    <p className="font-medium">
                      {booking.schedule_time 
                        ? formatTime(booking.schedule_time) 
                        : 'To be confirmed'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Bike className="h-5 w-5 text-[#FF5733] mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {booking.status || 'Confirmed'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Booking Summary</h3>
                
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Service Total</span>
                    <span className="font-medium">₹{Number(booking.total_amount) - (booking.distance_fee || 0)}</span>
                  </div>
                  
                  {(booking.distance_fee !== undefined && booking.distance_fee > 0) && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Distance Fee</span>
                      <span className="font-medium">₹{Number(booking.distance_fee).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Booking Fee</span>
                    <span className="font-medium">₹0.00</span>
                  </div>
                  
                  <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Total</span>
                    <span className="text-lg font-bold text-[#FF5733]">₹{Number(booking.total_amount).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-[#FF5733] mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Service Address</p>
                    <p className="font-medium">{booking.address || 'To be confirmed'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-sm text-gray-500 text-center">
              <p>
                You will receive notifications about your booking status. Our service expert will 
                call you shortly to confirm the details.
              </p>
            </div>
            
            <div className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
              <Link
                to="/"
                className="w-full sm:w-auto flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#FF5733] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733]"
              >
                <Home className="mr-2 h-5 w-5" />
                Return to Home
              </Link>
              
              <Link
                to="/profile"
                state={{ activeTab: "services" }}
                className="w-full sm:w-auto flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733]"
              >
                <Bike className="mr-2 h-5 w-5" />
                View My Services
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingConfirmation; 