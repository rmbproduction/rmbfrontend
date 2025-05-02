import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Home, ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ThankYouModalProps {
  title?: string;
  message?: string;
  type: 'subscription' | 'booking';
  onClose: () => void;
  bookingData?: {
    reference?: string;
    date?: string;
    time?: string;
  };
  subscriptionData?: {
    name?: string;
    price?: string;
    duration?: string;
    visits?: number;
  };
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({
  title = 'Thank You!',
  message = 'We appreciate your business and look forward to serving you.',
  type,
  onClose,
  bookingData,
  subscriptionData
}) => {
  const defaultTitle = type === 'subscription' ? 'Subscription Confirmed!' : 'Booking Confirmed!';
  const defaultMessage = type === 'subscription' 
    ? 'Thank you for subscribing to our service plan. We\'ll contact you shortly to confirm your selected dates.'
    : 'Thank you for booking our service. Our experts will contact you shortly.';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md"
      >
        {/* Success Header */}
        <div className="bg-[#FF5733] text-white px-6 py-8 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
          </div>
          <h1 className="text-3xl font-bold">{title || defaultTitle}</h1>
          <p className="mt-2 text-lg opacity-90">
            {message || defaultMessage}
          </p>
        </div>
        
        {/* Details Section */}
        <div className="p-6">
          {type === 'subscription' && subscriptionData && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">{subscriptionData.name} Subscription</h3>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">₹{subscriptionData.price}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{subscriptionData.duration}</span>
                </div>
                {subscriptionData.visits && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Visits:</span>
                    <span className="font-medium">{subscriptionData.visits} visits</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Next Steps</p>
                  <p className="text-sm text-blue-600">
                    We'll email you shortly to confirm your preferred service dates.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {type === 'booking' && bookingData && (
            <div className="space-y-4">
              {bookingData.reference && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Booking Reference</h3>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <span className="text-lg font-medium text-[#FF5733]">{bookingData.reference}</span>
                  </div>
                </div>
              )}
              
              {(bookingData.date || bookingData.time) && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <h3 className="font-medium text-green-800 mb-2">Scheduled Service</h3>
                  {bookingData.date && (
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{bookingData.date}</span>
                    </div>
                  )}
                  {bookingData.time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">{bookingData.time}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              to="/"
              className="flex-1 py-3 px-4 bg-[#FF5733] text-white rounded-lg text-center font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center"
              onClick={onClose}
            >
              <Home size={18} className="mr-2" />
              Go to Home
            </Link>
            
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg text-center font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <ArrowRight size={18} className="mr-2" />
              Continue
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ThankYouModal; 