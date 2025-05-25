import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle2, User, MapPin, Calendar } from 'lucide-react';
import OrderSuccessModal from '../components/OrderSuccessModal';

interface ServiceItem {
  serviceId: string;
  packageId: string;
  serviceName: string;
  packageName: string;
  vehicle: {
    manufacturer: string;
    model: string;
    fuelType: string;
  };
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
  const [total] = useState(200); // Example fixed price, you can calculate based on services
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    email: '',
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

  useEffect(() => {
    // Set checkout mode in localStorage
    localStorage.setItem('checkoutMode', mode);

    // Load services based on mode
    if (mode === 'cart') {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setServices(cartItems);
    } else if (mode === 'buy-now') {
      const singleItem = JSON.parse(localStorage.getItem('checkoutItem') || 'null');
      if (singleItem) {
        setServices([singleItem]);
      }
    }

    // Cleanup function to remove checkout mode when component unmounts
    return () => {
      localStorage.removeItem('checkoutMode');
    };
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save customer info to localStorage
      localStorage.setItem('customerInfo', JSON.stringify(formData));
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Booking</h1>
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
                        {services[0]?.vehicle && (
                          <p className="text-sm text-gray-600">
                            {services[0].vehicle.manufacturer} {services[0].vehicle.model}
                          </p>
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
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                      value={formData.serviceDate}
                      onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                    />
                    <select
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                      value={formData.serviceTime}
                      onChange={(e) => setFormData({ ...formData, serviceTime: e.target.value })}
                    >
                      <option value="">Select a time slot</option>
                      <option value="morning">Morning (9 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 3 PM)</option>
                      <option value="evening">Evening (3 PM - 6 PM)</option>
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
                
                {/* Service Details */}
                <div className="space-y-4 mb-6">
                  {services.map((service, index) => (
                    <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                      <h4 className="font-medium">{service.serviceName}</h4>
                      <p className="text-sm text-gray-600">{service.packageName}</p>
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
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">₹{total.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    className="w-full bg-[#FF5733] text-white py-3 rounded-lg hover:bg-[#ff4019] transition-colors"
                  >
                    Complete Booking
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
        onClose={() => setShowSuccessModal(false)}
        mode={mode}
      />
    </>
  );
};

export default Checkout; 