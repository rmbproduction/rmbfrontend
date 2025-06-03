import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle2, User, MapPin, Calendar, Loader2 } from 'lucide-react';
import { notification } from 'antd';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

// Local imports
import OrderSuccessModal from '../components/OrderSuccessModal';
import { useCreateServiceBooking } from '../hooks/services/useServiceBooking';
import { useAuth } from '../contexts/AuthContext';
import { useVehicleSelection } from '../hooks/vehicle/useVehicleSelection';
import { useActiveCart } from '../hooks/cart/useCartQueries';
import { useUserProfile } from '../hooks/useUserProfile';

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

// Form validation schema
const checkoutFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only digits'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string()
      .min(6, 'Postal code must be at least 6 digits')
      .max(6, 'Postal code must not exceed 6 digits')
      .regex(/^[0-9]+$/, 'Postal code must contain only digits')
  }),
  serviceDate: z.string().min(1, 'Service date is required'),
  serviceTime: z.string().min(1, 'Service time is required'),
  totalAmount: z.string(),
  bookingReference: z.string().optional()
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

interface BookingProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

interface BookingVehicle {
  vehicle_type: string;
  manufacturer: string;
  model: string;
}

interface BaseBookingData {
  profile: BookingProfile;
  vehicle: BookingVehicle;
  scheduleDate: string;
  scheduleTime: string;
}

interface CartBooking extends BaseBookingData {
  mode: 'cart';
  cart_id: number;
}

interface ServiceBooking extends BaseBookingData {
  mode: 'buy-now';
  service_id: number;
  package_id?: string;
}

type BookingData = CartBooking | ServiceBooking;

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') as 'cart' | 'buy-now';
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createServiceBooking = useCreateServiceBooking();
  const { selectedVehicle } = useVehicleSelection();
  const { activeCart, isLoading: isCartLoading } = useActiveCart();
  const { prefillFormData, updateSharedFormData } = useUserProfile();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    mode: 'onChange'
  });

  // Pre-fill form data when component mounts
  useEffect(() => {
    const prefilledData = prefillFormData({
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      serviceDate: '',
      serviceTime: '',
      totalAmount: '',
    }, 'checkout');

    // Set the pre-filled values
    Object.entries(prefilledData).forEach(([key, value]) => {
      if (key === 'address' && typeof value === 'object') {
        Object.entries(value).forEach(([addressKey, addressValue]) => {
          setValue(`address.${addressKey as 'street' | 'city' | 'state' | 'zipCode'}`, addressValue);
        });
      } else {
        setValue(key as keyof CheckoutFormData, value);
      }
    });
  }, [setValue]);

  // Update shared data when form fields change
  const handleFieldChange = (name: string, value: string) => {
    if (['name', 'email', 'phone'].includes(name) || name.startsWith('address.')) {
      const addressKey = name.startsWith('address.') ? name.split('.')[1] : null;
      updateSharedFormData({
        name: name === 'name' ? value : watch('name'),
        email: name === 'email' ? value : watch('email'),
        phone: name === 'phone' ? value : watch('phone'),
        address: addressKey === 'street' ? value : watch('address.street'),
        city: addressKey === 'city' ? value : watch('address.city'),
        state: addressKey === 'state' ? value : watch('address.state'),
        postalCode: addressKey === 'zipCode' ? value : watch('address.zipCode')
      });
    }
  };

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [user, navigate]);

  // Load cart data
  useEffect(() => {
    try {
      if (mode === 'cart' && activeCart?.items) {
        const cartServices = activeCart.items.map((item: any) => ({
          serviceId: item?.service?.id || '',
          packageId: item?.package?.id,
          serviceName: item?.service_name || item?.service?.name || '',
          packageName: item?.package_name || item?.package?.name || '',
          price: item.service_price || '0',
          quantity: item.quantity || 1,
          features: [],
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
        setValue('totalAmount', activeCart.total_amount || '0');
      } else if (mode === 'buy-now') {
        const checkoutItem = JSON.parse(localStorage.getItem('checkoutItem') || 'null');
        if (checkoutItem) {
          setServices([checkoutItem]);
          setValue('totalAmount', checkoutItem.price || '0');
        }
      }
    } catch (error) {
      console.error('Error loading cart data:', error);
      setServices([]);
      setValue('totalAmount', '0');
      notification.error({
        message: 'Error Loading Cart',
        description: 'There was an error loading your cart data. Please try refreshing the page.',
      });
    }
  }, [mode, activeCart, selectedVehicle, setValue]);

  // Show loading state
  if (isCartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF5733] mx-auto" />
          <p className="mt-2 text-gray-600">Loading cart information...</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (formData: CheckoutFormData) => {
    try {
      if (!selectedVehicle) {
        notification.error({
          message: 'Vehicle Required',
          description: 'Please select a vehicle to proceed with booking.',
        });
        return;
      }

      const baseBookingData: BaseBookingData = {
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

      let bookingData: BookingData;

      if (mode === 'buy-now') {
        const serviceId = services[0]?.serviceId ? parseInt(services[0].serviceId) : null;
        if (!serviceId) {
          throw new Error('Invalid service information');
        }
        bookingData = {
          ...baseBookingData,
          mode: 'buy-now',
          service_id: serviceId,
          package_id: services[0]?.packageId
        };
      } else {
        if (!activeCart?.id) {
          throw new Error('Invalid cart information');
        }
        bookingData = {
          ...baseBookingData,
          mode: 'cart',
          cart_id: activeCart.id
        };
      }

      // If it's a cart booking, immediately clear the cart UI
      if (bookingData.mode === 'cart') {
        queryClient.setQueryData(['cart'], null);
        queryClient.setQueryData(['cart', 'active'], null);
      }

      // Make the API call with complete data
      const response = await createServiceBooking.mutateAsync(bookingData);

      if (response && response.reference) {
        setValue('bookingReference', response.reference);
        setShowSuccessModal(true);
        reset();
        setTimeout(() => {
          navigate('/profile/?tab=repairs');
        }, 2000);
      }

    } catch (error: any) {
      if (mode === 'cart') {
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }

      console.error('Error submitting form:', error);
      
      const errorMessage = error?.response?.data?.error || 
                         error?.response?.data?.message || 
                         error?.response?.data?.detail ||
                         error.message ||
                         'Unable to complete booking. Please try again.';
                         
      notification.error({
        message: 'Booking Failed',
        description: errorMessage,
      });
    }
  };

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
              <p className="font-semibold text-xl text-[#FF5733]">
                ₹{watch('totalAmount') || '0.00'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit(onSubmit)}>
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
                      <div>
                        <input
                          type="text"
                          placeholder="Full Name *"
                          {...register('name')}
                          onChange={(e) => {
                            register('name').onChange(e);
                            handleFieldChange('name', e.target.value);
                          }}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                            errors.name ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="Email Address *"
                          {...register('email')}
                          onChange={(e) => {
                            register('email').onChange(e);
                            handleFieldChange('email', e.target.value);
                          }}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number *"
                        {...register('phone')}
                        onChange={(e) => {
                          register('phone').onChange(e);
                          handleFieldChange('phone', e.target.value);
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                      )}
                    </div>
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
                    <div>
                      <textarea
                        placeholder="Street Address *"
                        rows={3}
                        {...register('address.street')}
                        onChange={(e) => {
                          register('address.street').onChange(e);
                          handleFieldChange('address.street', e.target.value);
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                          errors.address?.street ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.address?.street && (
                        <p className="mt-1 text-sm text-red-500">{errors.address.street.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <input
                          type="text"
                          placeholder="City *"
                          {...register('address.city')}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                            errors.address?.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.address?.city && (
                          <p className="mt-1 text-sm text-red-500">{errors.address.city.message}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="State *"
                          {...register('address.state')}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                            errors.address?.state ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.address?.state && (
                          <p className="mt-1 text-sm text-red-500">{errors.address.state.message}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Postal Code *"
                          {...register('address.zipCode')}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                            errors.address?.zipCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.address?.zipCode && (
                          <p className="mt-1 text-sm text-red-500">{errors.address.zipCode.message}</p>
                        )}
                      </div>
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
                    <div>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        {...register('serviceDate')}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                          errors.serviceDate ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.serviceDate && (
                        <p className="mt-1 text-sm text-red-500">{errors.serviceDate.message}</p>
                      )}
                    </div>
                    <div>
                      <select
                        {...register('serviceTime')}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                          errors.serviceTime ? 'border-red-500' : ''
                        }`}
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
                      {errors.serviceTime && (
                        <p className="mt-1 text-sm text-red-500">{errors.serviceTime.message}</p>
                      )}
                    </div>
                  </div>
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
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₹{watch('totalAmount')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Service Tax</span>
                      <span className="text-gray-600">Included</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold text-lg">₹{watch('totalAmount')}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="w-full bg-[#FF5733] text-white py-3 rounded-lg hover:bg-[#ff4019] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
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
          navigate('/profile/?tab=repairs');
        }}
        mode={mode || 'buy-now'}
        bookingReference={watch('bookingReference')}
      />
    </>
  );
};

export default Checkout; 