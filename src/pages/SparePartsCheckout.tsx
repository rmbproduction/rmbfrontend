import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle2, User, MapPin, Loader2, CreditCard } from 'lucide-react';
import { notification } from 'antd';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

// Local imports
import OrderSuccessModal from '../components/OrderSuccessModal';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { apiService } from '../config/api.config';

// Types
interface SparePartItem {
  uuid: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartData {
  id: number;
  items: any[];
  total_price: number;
  total_items: number;
  total_quantity: number;
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
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  totalAmount: z.number(),
  orderReference: z.string().optional()
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

const SparePartsCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || (location.state?.mode as 'cart' | 'buy-now') || 'cart';
  const cartId = searchParams.get('cartId') || location.state?.cartId || localStorage.getItem('parts_checkout_cart_id');
  
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [items, setItems] = useState<SparePartItem[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
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

  // Load cart data
  useEffect(() => {
    const loadCartData = async () => {
      if (!cartId) {
        notification.error({
          message: 'Error',
          description: 'No cart found for checkout',
          placement: 'bottomRight',
        });
        navigate('/spare-parts');
        return;
      }

      try {
        if (mode === 'buy-now') {
          // For buy now, load the item from localStorage
          const checkoutItemStr = localStorage.getItem('parts_checkout_item');
          if (checkoutItemStr) {
            const checkoutItem = JSON.parse(checkoutItemStr) as SparePartItem;
            setItems([checkoutItem]);
            setValue('totalAmount', checkoutItem.price);
          }
        } else {
          // For cart checkout, load from API
          const response = await apiService.spareParts.getCart(parseInt(cartId));
          setCartData(response);
          
          // Map cart items to SparePartItem
          if (response.items) {
            const cartItems = response.items.map((item: any) => ({
              uuid: item.part,
              name: item.part_details.name,
              price: item.total_price,
              quantity: item.quantity,
              image: item.part_details.main_image
            }));
            setItems(cartItems);
            setValue('totalAmount', response.total_price);
          }
        }
      } catch (error) {
        console.error('Error loading cart data:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to load cart data',
          placement: 'bottomRight',
        });
        navigate('/spare-parts');
      }
    };

    loadCartData();
  }, [cartId, mode, navigate, setValue]);

  // Pre-fill form data when component mounts
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        console.log('Loading profile data for checkout...');
        const defaultData = {
          name: '',
          email: '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: ''
          },
          latitude: undefined,
          longitude: undefined,
          totalAmount: 0,
        };

        const prefilledData = await prefillFormData(defaultData, 'checkout');
        console.log('Received prefilled data:', prefilledData);

        // Set the pre-filled values
        if (prefilledData) {
          // Handle flat fields
          setValue('name', prefilledData.name || '');
          setValue('email', prefilledData.email || '');
          setValue('phone', prefilledData.phone || '');
          
          // Handle nested address fields
          if (prefilledData.address) {
            setValue('address.street', prefilledData.address.street || '');
            setValue('address.city', prefilledData.address.city || '');
            setValue('address.state', prefilledData.address.state || '');
            setValue('address.zipCode', prefilledData.address.zipCode || '');
          }
        }
      } catch (error) {
        console.error('Error prefilling checkout form:', error);
      }
    };

    loadProfileData();
  }, [setValue]);

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/spare-parts/checkout' } });
    }
  }, [user, navigate]);

  // Handle field change to update shared form data
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

  // Get user's current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setValue('latitude', latitude);
          setValue('longitude', longitude);
          
          // Calculate delivery fee based on location
          calculateDeliveryFee(latitude, longitude);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          notification.error({
            message: 'Location Error',
            description: 'Unable to get your current location. Please enter your address manually.',
            placement: 'bottomRight',
          });
          setIsLoadingLocation(false);
        }
      );
    } else {
      notification.error({
        message: 'Location Not Supported',
        description: 'Geolocation is not supported by your browser.',
        placement: 'bottomRight',
      });
      setIsLoadingLocation(false);
    }
  };

  // Calculate delivery fee based on location
  const calculateDeliveryFee = async (latitude: number, longitude: number) => {
    try {
      const response = await apiService.spareParts.calculateDistanceFee(latitude, longitude);
      // Update total amount with delivery fee
      const currentTotal = watch('totalAmount');
      setValue('totalAmount', currentTotal + response.distance_fee);
      
      notification.info({
        message: 'Delivery Fee Calculated',
        description: `Delivery fee of ₹${response.distance_fee} has been added based on your location.`,
        placement: 'bottomRight',
      });
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
    }
  };

  // Handle form submission
  const onSubmit = async (formData: CheckoutFormData) => {
    if (!cartId) {
      notification.error({
        message: 'Error',
        description: 'No cart found for checkout',
        placement: 'bottomRight',
      });
      return;
    }

    try {
      // Prepare shipping info
      const shippingInfo = {
        shipping_address: formData.address.street,
        shipping_city: formData.address.city,
        shipping_state: formData.address.state,
        shipping_pincode: formData.address.zipCode,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        latitude: formData.latitude,
        longitude: formData.longitude,
        purchase_type: mode
      };

      // Create order
      const response = await apiService.spareParts.createOrder(parseInt(cartId), shippingInfo);

      if (response && response.order_number) {
        setValue('orderReference', response.order_number);
        
        // Clear checkout data
        localStorage.removeItem('active_parts_cart_id');
        localStorage.removeItem('parts_checkout_cart_id');
        localStorage.removeItem('parts_checkout_item');
        
        // Show success modal
        setShowSuccessModal(true);
        
        // Reset form
        reset();
        
        // Invalidate cart queries
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      notification.error({
        message: 'Order Failed',
        description: error.response?.data?.error || 'Failed to create order',
        placement: 'bottomRight',
      });
    }
  };

  // Format price
  const getFormattedPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Show loading state if no items
  if (items.length === 0 && !cartData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF5733] mx-auto" />
          <p className="mt-2 text-gray-600">Loading cart information...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Complete Your Order</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-semibold text-xl text-[#FF5733]">
                {getFormattedPrice(watch('totalAmount') || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit(onSubmit)}>
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

                {/* Shipping Address */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#FF5733]" />
                      </div>
                      <h3 className="font-semibold">Shipping Address</h3>
                    </div>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isLoadingLocation}
                      className="text-sm text-[#FF5733] hover:text-[#ff4019] flex items-center gap-1"
                    >
                      {isLoadingLocation ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        'Use Current Location'
                      )}
                    </button>
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
                          onChange={(e) => {
                            register('address.city').onChange(e);
                            handleFieldChange('address.city', e.target.value);
                          }}
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
                          onChange={(e) => {
                            register('address.state').onChange(e);
                            handleFieldChange('address.state', e.target.value);
                          }}
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
                          onChange={(e) => {
                            register('address.zipCode').onChange(e);
                            handleFieldChange('address.zipCode', e.target.value);
                          }}
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
                
                {/* Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          <p className="font-medium">{getFormattedPrice(item.price)}</p>
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
                      <span className="font-medium">{getFormattedPrice(watch('totalAmount') || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-600">Calculated at delivery</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold text-lg">{getFormattedPrice(watch('totalAmount') || 0)}</span>
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
                      <>
                        <CreditCard className="w-4 h-4" />
                        Place Order
                      </>
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
          navigate('/profile');
        }}
        mode="spare-parts"
        bookingReference={watch('orderReference')}
      />
    </>
  );
};

export default SparePartsCheckout;
