import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle2, User, MapPin, Calendar, Loader2 } from 'lucide-react';
import { notification } from 'antd';
import OrderSuccessModal from '../components/OrderSuccessModal';
import { useCreateServiceBooking } from '../hooks/services/useServiceBooking';
import { useAuth } from '../contexts/AuthContext';
import { useVehicleSelection } from '../hooks/vehicle/useVehicleSelection';
import { useActiveCart, useClearCartMutation } from '../hooks/cart/useCartQueries';
import { useQueryClient } from '@tanstack/react-query';

interface ServiceItem {
  serviceId: string;
  packageId?: string;
  serviceName: string;
  packageName: string;
  vehicle: {
    manufacturerId: string | number;
    modelId: string | number;
    manufacturer: string;
    model: string;
  };
  price: string;
  quantity?: number;
  features: string[];
}

interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  serviceDate: string;
  serviceTime: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') as 'cart' | 'buy-now';
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const clearCart = useClearCartMutation();
  const createServiceBooking = useCreateServiceBooking();
  const { selectedVehicle } = useVehicleSelection();
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    serviceDate: '',
    serviceTime: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);

  const { activeCart } = useActiveCart();

    useEffect(() => {
    // Set checkout mode in localStorage
    localStorage.setItem('checkoutMode', mode);

    // Load services based on mode
    if (mode === 'cart' && activeCart?.items) {
      const cartServices = activeCart.items.map(item => ({
        serviceId: item.service_id.toString(),
        packageId: item.package_id?.toString(),
        serviceName: item.service_name,
        packageName: item.package_name || '',
        price: item.service_price,
        quantity: item.quantity,
        features: item.features || [],
        vehicle: selectedVehicle ? {
          manufacturerId: selectedVehicle.manufacturerId,
          modelId: selectedVehicle.modelId,
          manufacturer: selectedVehicle.manufacturer,
          model: selectedVehicle.model
        } : {
          manufacturerId: '0',
          modelId: '0',
          manufacturer: '',
          model: ''
        }
      }));
      setServices(cartServices);
      
      // Update total in localStorage for persistence
      const total = activeCart.items.reduce((sum, item) => 
        sum + (parseFloat(item.service_price) * (item.quantity || 1)), 0);
      localStorage.setItem('checkoutTotal', total.toString());
    } else if (mode === 'buy-now') {
      const checkoutItem = JSON.parse(localStorage.getItem('checkoutItem') || 'null');
      if (checkoutItem) {
        setServices([checkoutItem]);
      }
    }

    // Cleanup function to remove checkout mode when component unmounts
    return () => {
      localStorage.removeItem('checkoutMode');
    };
  }, [mode, activeCart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);

    try {
      // Create the booking data object with all required fields
      if (!selectedVehicle) {
        notification.error({
          message: 'Vehicle Required',
          description: 'Please select a vehicle to proceed with booking.',
        });
        return;
      }

      const bookingData = {
        // For buy now flow, use service_id; for cart flow, use cart_id
        ...(mode === 'buy-now' 
          ? { service_id: parseInt(services[0]?.serviceId) }
          : { cart_id: parseInt(activeCart?.id.toString() || '') }
        ),
        package_id: mode === 'buy-now' ? services[0]?.packageId : undefined,
        profile: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address.street,
          city: formData.address.city,
          state: formData.address.state,
          postalCode: formData.address.zipCode
        },
        vehicle: {
          vehicle_type: selectedVehicle.vehicleType,
          manufacturer: selectedVehicle.manufacturerId.toString(),
          model: selectedVehicle.modelId.toString()
        },
        scheduleDate: formData.serviceDate,
        scheduleTime: formData.serviceTime
      };

      // Make the API call with complete data
      const response = await createServiceBooking.mutateAsync(bookingData);

      console.log('Booking response:', response);

      // Clear cart if this was a cart checkout
      if (mode === 'cart' && activeCart?.id) {
        await clearCart.mutateAsync(activeCart.id);
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }

      // Clear checkout data
      localStorage.removeItem('checkoutCartId');
      localStorage.removeItem('checkoutMode');
      localStorage.removeItem('cartItems');
      
      // Show success modal with booking reference
      if (response && response.reference) {
        setBookingReference(response.reference);
        setShowSuccessModal(true);
      }

    } catch (error: any) {
      if (error.name === 'GeolocationPositionError') {
        notification.error({
          message: 'Location Required',
          description: 'Please enable location services to proceed with the booking.',
        });
      } else {
        console.error('Error submitting form:', error);
        console.error('Response data:', error?.response?.data);
        
        // Show specific error message from backend if available
        const errorMessage = error?.response?.data?.error || 
                           error?.response?.data?.message || 
                           error?.response?.data?.detail ||
                           'Unable to complete booking. Please try again.';
                           
        notification.error({
          message: 'Booking Failed',
          description: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add useEffect to handle modal state cleanup
  useEffect(() => {
    return () => {
      setShowSuccessModal(false);
      setBookingReference(null);
    };
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Complete Your Booking</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-semibold text-xl text-[#FF5733]">₹{mode === 'cart' && activeCart?.total_amount ? activeCart.total_amount : services.reduce((total, service) => total + parseFloat(service.price), 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Booking Form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit}>
                {/* Vehicle Selection Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#FFF9F2] rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FFE5D1] rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-[#FF5733]" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Choose Your Vehicle</h3>
                        {selectedVehicle ? (
                          <p className="text-sm text-gray-600">
                            {selectedVehicle.manufacturer} {selectedVehicle.model}
                          </p>
                        ) : (
                          <p className="text-sm text-red-500">Please select a vehicle</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-[#FF5733] text-sm hover:text-[#ff4019]"
                      onClick={() => navigate(-1)}
                    >
                      Change
                    </button>
                  </div>
                </motion.div>

                {/* Personal Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-[#FF5733]" />
                    </div>
                    <h3 className="font-semibold">Personal Information</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </motion.div>

                {/* Service Address */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#FF5733]" />
                    </div>
                    <h3 className="font-semibold">Service Address</h3>
                  </div>
                  <div className="space-y-4">
                    <textarea
                      placeholder="Street Address *"
                      required
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value }
                      })}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="City"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                        value={formData.address.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value }
                        })}
                      />
                      <input
                        type="text"
                        placeholder="State"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                        value={formData.address.state}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, state: e.target.value }
                        })}
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, zipCode: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Schedule Service */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#FF5733]" />
                    </div>
                    <h3 className="font-semibold">Schedule Service</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]} // Set minimum date to today
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                      value={formData.serviceDate}
                      onChange={(e) => {
                        // Format the date to YYYY-MM-DD
                        const selectedDate = new Date(e.target.value);
                        const formattedDate = selectedDate.toISOString().split('T')[0];
                        setFormData({ ...formData, serviceDate: formattedDate });
                      }}
                    />
                    <select
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                      value={formData.serviceTime}
                      onChange={(e) => setFormData({ ...formData, serviceTime: e.target.value })}
                    >
                      <option value="">Select a time slot</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                    </select>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Our service technicians are available from 9AM to 5PM daily. Please choose a convenient time slot.
                  </p>
                </motion.div>
              </form>
            </div>

            {/* Right Side - Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm sticky top-4"
              >
                <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                
                {/* Vehicle Details */}
                {selectedVehicle && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700">Selected Vehicle</h4>
                    <p className="text-sm text-gray-600">
                      {selectedVehicle.manufacturer} {selectedVehicle.model}
                    </p>
                  </div>
                )}

                {/* Service Details */}
                <div className="space-y-4 mb-6">
                  {services.map((service, index) => (
                    <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{service.serviceName}</h4>
                          <p className="text-sm text-gray-600">{service.packageName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{service.price}</p>
                          <p className="text-sm text-gray-500">Qty: 1</p>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {service.features.slice(0, 3).map((feature, i) => (
                          <div key={i} className="flex items-center text-sm text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                            {feature}
                          </div>
                        ))}
                        {service.features.length > 3 && (
                          <p className="text-sm text-[#FF5733]">
                            +{service.features.length - 3} more features
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₹{mode === 'cart' && activeCart?.total_amount ? activeCart.total_amount : services.reduce((total, service) => total + parseFloat(service.price), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Service Tax</span>
                      <span className="text-gray-600">Included</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold text-lg">₹{services.reduce((total, service) => total + parseFloat(service.price), 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-[#FF5733] text-white py-3 rounded-lg hover:bg-[#ff4019] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Booking'
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    By confirming, you agree to our{' '}
                    <a href="/terms" className="text-[#FF5733]">Terms & Conditions</a>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          // Clear localStorage data
          localStorage.removeItem('customerInfo');
          localStorage.removeItem('checkoutItem');
          // Navigate to repairs page after modal closes
          navigate('/profile/repairs');
        }}
        mode={mode || 'buy-now'}
        bookingReference={bookingReference}
      />
    </>
  );
};

export default Checkout; 