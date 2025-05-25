import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, ArrowRight, Calendar, Clock, MapPin } from 'lucide-react';
import Modal from './Modal';

interface BookingData {
  reference?: string;
  serviceDate?: string;
  serviceTime?: string;
  vehicle?: {
    manufacturer: string;
    model: string;
    fuelType: string;
  };
  serviceName?: string;
  packageName?: string;
  features?: string[];
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
}

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'cart' | 'buy-now';
}

const OrderSuccessModal = ({ isOpen, onClose, mode }: OrderSuccessModalProps) => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Generate a random reference number
      const generateReference = () => {
        const prefix = 'BK';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
      };

      // Get booking data from localStorage
      let data;
      if (mode === 'cart') {
        data = JSON.parse(localStorage.getItem('cartItems') || '[]')[0];
      } else {
        data = JSON.parse(localStorage.getItem('checkoutItem') || 'null');
      }

      const customerInfo = JSON.parse(localStorage.getItem('customerInfo') || 'null');
      
      if (data) {
        setBookingData({
          reference: generateReference(),
          serviceDate: customerInfo?.serviceDate || new Date().toISOString(),
          serviceTime: customerInfo?.serviceTime || '9 AM - 12 PM',
          vehicle: data.vehicle,
          serviceName: data.serviceName,
          packageName: data.packageName,
          features: data.features,
          customerInfo
        });
      }
    }
  }, [isOpen, mode]);

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'To be confirmed';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'long', 
        year: 'numeric'
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  if (!bookingData) {
    return null;
  }

  const handleClose = () => {
    onClose();
    // Clear localStorage
    if (mode === 'cart') {
      localStorage.removeItem('cartItems');
    } else {
      localStorage.removeItem('checkoutItem');
    }
    localStorage.removeItem('customerInfo');
    localStorage.removeItem('checkoutMode');
    
    // Dispatch cart updated event to refresh the cart count
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
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
      
      {/* Details Section */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Booking Reference */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Booking Reference</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <span className="text-lg font-medium text-[#FF5733]">{bookingData.reference}</span>
            </div>
          </div>
          
          {/* Service Information */}
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
            <h3 className="font-medium text-gray-800 mb-3">Service Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">{bookingData.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Package:</span>
                <span className="font-medium">{bookingData.packageName}</span>
              </div>
              {bookingData.features && bookingData.features.length > 0 && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Service Includes:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {bookingData.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-3 w-3 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {bookingData.features.length > 3 && (
                      <li className="text-xs text-orange-600 ml-5">
                        +{bookingData.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Information */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center mb-3">
              <Clock className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium text-gray-800">Scheduled Service</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{formatDate(bookingData.serviceDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Slot:</span>
                <span className="font-medium">{bookingData.serviceTime}</span>
              </div>
            </div>
          </div>
          
          {/* Vehicle Information */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center mb-3">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-gray-800">Vehicle Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle:</span>
                <span className="font-medium">
                  {bookingData.vehicle?.manufacturer} {bookingData.vehicle?.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fuel Type:</span>
                <span className="font-medium">{bookingData.vehicle?.fuelType}</span>
              </div>
            </div>
          </div>

          {/* Service Location */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-center mb-3">
              <MapPin className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-medium text-gray-800">Service Location</h3>
            </div>
            <p className="text-sm text-gray-600">
              {bookingData.customerInfo?.address.street}, {bookingData.customerInfo?.address.city},
              {bookingData.customerInfo?.address.state} - {bookingData.customerInfo?.address.zipCode}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="flex-1 py-3 px-4 bg-[#FF5733] text-white rounded-lg text-center font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center"
            onClick={handleClose}
          >
            <Home size={18} className="mr-2" />
            Go to Home
          </Link>
          
          <button
            type="button"
            onClick={() => {
              handleClose();
              navigate('/bookings');
            }}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg text-center font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <ArrowRight size={18} className="mr-2" />
            View Bookings
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderSuccessModal; 