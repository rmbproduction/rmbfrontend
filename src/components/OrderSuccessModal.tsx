import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Calendar, Clock, MapPin, Wrench } from 'lucide-react';
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
  bookingReference?: string | null;
}

const OrderSuccessModal = ({ isOpen, onClose, mode, bookingReference }: OrderSuccessModalProps) => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        // Get booking data from localStorage
        const checkoutItem = JSON.parse(localStorage.getItem('checkoutItem') || 'null');
        const customerInfo = JSON.parse(localStorage.getItem('customerInfo') || 'null');
        
        console.log('Modal Data:', { checkoutItem, customerInfo, bookingReference });

        if (checkoutItem) {
          setBookingData({
            reference: bookingReference || generateReference(),
            serviceDate: customerInfo?.serviceDate,
            serviceTime: customerInfo?.serviceTime,
            vehicle: checkoutItem.vehicle,
            serviceName: checkoutItem.serviceName,
            packageName: checkoutItem.packageName,
            features: checkoutItem.features,
            customerInfo
          });
        }
      } catch (error) {
        console.error('Error loading booking data:', error);
      }
    }
  }, [isOpen, bookingReference]);

  const handleViewRepairs = () => {
    onClose();
    navigate('/profile?tab=repairs');
  };

  const handleBackToHome = () => {
    onClose();
    navigate('/');
  };

  // Generate a reference number
  const generateReference = () => {
    const prefix = 'BK';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  };

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

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Booking Confirmed!
        </h2>
        
        <p className="text-gray-600 mb-4">
          Your booking reference: <span className="font-semibold">{bookingData?.reference || bookingReference}</span>
        </p>

        {bookingData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm">
                  {formatDate(bookingData.serviceDate)} at {bookingData.serviceTime}
                </span>
              </div>
              {bookingData.vehicle && (
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">
                    {bookingData.vehicle.manufacturer} {bookingData.vehicle.model}
                  </span>
                </div>
              )}
              {bookingData.customerInfo?.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">
                    {bookingData.customerInfo.address.street}, {bookingData.customerInfo.address.city}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleViewRepairs}
            className="w-full bg-[#FF5733] text-white py-3 rounded-lg hover:bg-[#ff4019] transition-colors flex items-center justify-center gap-2"
          >
            View My Repairs
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleBackToHome}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Need help? Contact our support team
        </p>
      </div>
    </Modal>
  );
};

export default OrderSuccessModal; 