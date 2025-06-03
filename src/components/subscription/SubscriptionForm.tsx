import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance, API_ENDPOINTS } from '../../config/api.config';
import OrderSuccessModal from '../OrderSuccessModal';
import ErrorModal from '../ErrorModal';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';

interface SubscriptionFormData {
  plan_variant: number;
  vehicle_type: number;
  manufacturer: number;
  vehicle_model: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
}

interface SubscriptionFormProps {
  planVariantId: number;
  onClose: () => void;
  onError: (message: string) => void;
}

interface VehicleType {
  id: number;
  name: string;
}

interface Manufacturer {
  id: number;
  name: string;
  vehicle_types?: number[];
}

interface VehicleModel {
  id: number;
  name: string;
  manufacturer: number;
  vehicle_type: number;
}

// Add these validation helper functions at the top level
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Accepts formats: +91 1234567890, 1234567890, +91-1234567890
  const phoneRegex = /^(\+\d{1,3}[-\s]?)?\d{10}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

const validatePostalCode = (postalCode: string): boolean => {
  // Indian postal code format
  const postalCodeRegex = /^\d{6}$/;
  return postalCodeRegex.test(postalCode);
};

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ planVariantId, onClose, onError }) => {
  const navigate = useNavigate();
  const { prefillFormData, updateSharedFormData } = useUserProfile();
  const [formData, setFormData] = useState<SubscriptionFormData>({
    plan_variant: planVariantId,
    vehicle_type: 0,
    manufacturer: 0,
    vehicle_model: 0,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  // Pre-fill form data when component mounts
  useEffect(() => {
    const prefilledData = prefillFormData(formData, 'subscription');
    setFormData(prev => ({
      ...prev,
      ...prefilledData
    }));
  }, []);

  // Fetch vehicle types
  const { data: vehicleTypes } = useQuery<VehicleType[]>({
    queryKey: ['vehicleTypes'],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.vehicle.types);
      return response.data;
    }
  });

  // Fetch manufacturers based on selected vehicle type
  const { data: manufacturers } = useQuery<Manufacturer[]>({
    queryKey: ['manufacturers', formData.vehicle_type],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.vehicle.manufacturers, {
        params: { vehicle_type: formData.vehicle_type }
      });
      return response.data;
    },
    enabled: !!formData.vehicle_type
  });

  // Fetch vehicle models based on selected manufacturer and vehicle type
  const { data: vehicleModels } = useQuery<VehicleModel[]>({
    queryKey: ['vehicleModels', formData.manufacturer, formData.vehicle_type],
    queryFn: async () => {
      if (!formData.manufacturer || !formData.vehicle_type) {
        return [];
      }
      const response = await axiosInstance.get(API_ENDPOINTS.vehicle.models, {
        params: {
          manufacturer: formData.manufacturer,
          vehicle_type: formData.vehicle_type
        }
      });
      return response.data;
    },
    enabled: !!formData.manufacturer && !!formData.vehicle_type
  });

  const validateField = (name: string, value: any): string => {
    // Convert number to string for validation if needed
    const stringValue = typeof value === 'string' ? value : String(value);
    
    switch (name) {
      case 'customer_email':
        return !validateEmail(stringValue) ? 'Please enter a valid email address' : '';
      case 'customer_phone':
        return !validatePhone(stringValue) ? 'Please enter a valid 10-digit phone number' : '';
      case 'postal_code':
        return !validatePostalCode(stringValue) ? 'Please enter a valid 6-digit postal code' : '';
      case 'customer_name':
        return stringValue.trim().length < 3 ? 'Name must be at least 3 characters long' : '';
      case 'vehicle_type':
      case 'manufacturer':
      case 'vehicle_model':
        return Number(value) <= 0 ? `Please select a valid ${name.replace('_', ' ')}` : '';
      default:
        return typeof value === 'string' && value.trim().length === 0 ? 'This field is required' : '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert ID fields to numbers
    if (['plan_variant', 'vehicle_type', 'manufacturer', 'vehicle_model'].includes(name)) {
      const numValue = value ? parseInt(value, 10) : 0;
      
      // Reset dependent fields when parent field changes
      if (name === 'vehicle_type') {
        setFormData(prev => ({
          ...prev,
          [name]: numValue,
          manufacturer: 0,
          vehicle_model: 0
        }));
      } else if (name === 'manufacturer') {
        setFormData(prev => ({
          ...prev,
          [name]: numValue,
          vehicle_model: 0
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: numValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Update shared form data
    if (['customer_name', 'customer_email', 'customer_phone', 'address', 'city', 'state', 'postal_code'].includes(name)) {
      updateSharedFormData({
        name: name === 'customer_name' ? value : formData.customer_name,
        email: name === 'customer_email' ? value : formData.customer_email,
        phone: name === 'customer_phone' ? value : formData.customer_phone,
        address: name === 'address' ? value : formData.address,
        city: name === 'city' ? value : formData.city,
        state: name === 'state' ? value : formData.state,
        postalCode: name === 'postal_code' ? value : formData.postal_code
      });
    }
    
    if (submitAttempted) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: validateField(name, value)
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate all fields
    Object.entries(formData).forEach(([key, value]) => {
      // Skip validation for optional fields if they're empty
      if (value === '' && ['service_notes'].includes(key)) {
        return;
      }
      
      const error = validateField(key, value);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setFieldErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      setError('Please correct the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const formattedData = {
        ...formData,
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim().toLowerCase(),
        customer_phone: formData.customer_phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postal_code: formData.postal_code.trim()
      };

      const response = await axiosInstance.post(
        API_ENDPOINTS.subscription.requests,
        formattedData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      setBookingReference(response.data.reference);
      setShowSuccessModal(true);
      
      // Clear form data after successful submission
      setFormData({
        plan_variant: planVariantId,
        vehicle_type: 0,
        manufacturer: 0,
        vehicle_model: 0,
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: ''
      });
      setSubmitAttempted(false);
      setFieldErrors({});
      
    } catch (err: any) {
      console.error('Subscription request error:', err);
      
      // Handle different types of errors
      if (err.response?.status === 400) {
        const errorMessage = Array.isArray(err.response.data) ? err.response.data[0] : err.response.data?.detail;
        
        // Handle active subscription case
        if (errorMessage === "You already have an active subscription. Please cancel it before requesting a new one.") {
          const activeMessage = 
            `⚠️ Active Subscription Detected\n\n` +
            `• You already have an active subscription plan\n` +
            `• Only one active subscription is allowed at a time\n` +
            `• Your current plan must expire before starting a new one\n\n` +
            `What can you do?\n` +
            `• Call us to discuss upgrade options\n` +
            `• Continue with your current plan\n` +
            `• Check your subscription status in dashboard`;

          // First trigger parent's error handler
          onError(activeMessage);
          
          // Then close form modal after a small delay
          setTimeout(() => {
            onClose();
          }, 100);
          
          return;
        }
        
        // Handle pending subscription case
        if (errorMessage === "You already have a pending subscription request.") {
          const pendingMessage = 
            `⏳ Subscription Request In Progress\n\n` +
            `We're currently processing your subscription request. Our team is reviewing the details to ensure everything is in order.\n\n` +
            `What you can do now:\n` +
            `• Check your email for updates about your request\n` +
            `• View your request status in the "Subscription Requests" tab\n` +
            `• Contact our support team if you need immediate assistance\n\n` +
            `Your request is important to us, and we'll process it as quickly as possible.`;

          setErrorModalMessage(pendingMessage);
          setShowErrorModal(true);
          return;
        }

        // Handle validation errors
        const backendErrors = err.response.data;
        if (typeof backendErrors === 'object') {
          const newFieldErrors: Record<string, string> = {};
          Object.entries(backendErrors).forEach(([key, value]) => {
            newFieldErrors[key] = Array.isArray(value) ? value[0] : value as string;
          });
          setFieldErrors(newFieldErrors);
          setError('Please correct the highlighted fields');
        } else {
          setError(err.response.data.detail || 'Validation failed. Please check your input.');
        }
      } else if (err.response?.status === 401) {
        const sessionMessage = 
          `🔑 Session Expired\n\n` +
          `Your login session has expired. For your security, please log in again to continue.\n\n` +
          `Don't worry:\n` +
          `• Your subscription information is safely stored\n` +
          `• You can continue right where you left off after logging in\n` +
          `• All your subscription details will be available after login`;

        setErrorModalMessage(sessionMessage);
        setShowErrorModal(true);
        navigate('/login', { state: { from: window.location.pathname } });
      } else {
        const unexpectedMessage = 
          `❌ Unexpected Error\n\n` +
          `We encountered an unexpected error while processing your request.\n\n` +
          `Troubleshooting steps:\n` +
          `• Check your internet connection\n` +
          `• Refresh the page and try again\n` +
          `• Clear your browser cache\n` +
          `• Contact our support team if the problem persists\n\n` +
          `Error Reference: ${err.response?.status || 'Unknown'}`;

        setErrorModalMessage(unexpectedMessage);
        setShowErrorModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add this function to render field error messages
  const renderFieldError = (fieldName: string) => {
    return fieldErrors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{fieldErrors[fieldName]}</p>
    ) : null;
  };

  return (
    <>
      {/* Error Modal - Moved outside of showForm condition */}
      <ErrorModal
        isOpen={showErrorModal}
        message={errorModalMessage}
        supportPhone="+91 1800 123 4567"
        className="max-w-lg mx-auto"
        showCloseButton={false}
      />

      <div className="bg-gray-50 p-8 rounded-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Subscribe to Plan</h2>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#FFF5F2] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#FF5733]" />
                </div>
                <h3 className="font-semibold">Vehicle Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <select
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                      fieldErrors.vehicle_type ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  >
                    <option value={0}>Select Vehicle Type</option>
                    {vehicleTypes?.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {renderFieldError('vehicle_type')}
                </div>

                <div>
                  <select
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                      fieldErrors.manufacturer ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={!formData.vehicle_type || loading}
                  >
                    <option value={0}>Select Manufacturer</option>
                    {manufacturers?.map(manufacturer => (
                      <option key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.name}
                      </option>
                    ))}
                  </select>
                  {renderFieldError('manufacturer')}
                </div>

                <div>
                  <select
                    name="vehicle_model"
                    value={formData.vehicle_model}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                      fieldErrors.vehicle_model ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={!formData.manufacturer || !formData.vehicle_type || loading}
                  >
                    <option value={0}>Select Model</option>
                    {vehicleModels?.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  {renderFieldError('vehicle_model')}
                </div>
              </div>
            </motion.div>

            {/* Customer Information */}
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
                <h3 className="font-semibold">Customer Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  placeholder="Full Name *"
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                    fieldErrors.customer_name ? 'border-red-300' : ''
                  }`}
                  disabled={loading}
                />
                {renderFieldError('customer_name')}
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  placeholder="Email Address *"
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                    fieldErrors.customer_email ? 'border-red-300' : ''
                  }`}
                  disabled={loading}
                />
                {renderFieldError('customer_email')}
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number *"
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                    fieldErrors.customer_phone ? 'border-red-300' : ''
                  }`}
                  disabled={loading}
                />
                {renderFieldError('customer_phone')}
              </div>
            </motion.div>

            {/* Address Information */}
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
                <h3 className="font-semibold">Address Information</h3>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street Address *"
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                    fieldErrors.address ? 'border-red-300' : ''
                  }`}
                  disabled={loading}
                />
                {renderFieldError('address')}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City *"
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                      fieldErrors.city ? 'border-red-300' : ''
                    }`}
                    disabled={loading}
                  />
                  {renderFieldError('city')}
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State *"
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                      fieldErrors.state ? 'border-red-300' : ''
                    }`}
                    disabled={loading}
                  />
                  {renderFieldError('state')}
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    placeholder="Postal Code *"
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                      fieldErrors.postal_code ? 'border-red-300' : ''
                    }`}
                    disabled={loading}
                  />
                  {renderFieldError('postal_code')}
                </div>
              </div>
            </motion.div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
        mode="cart"
        bookingReference={bookingReference}
      />
    </>
  );
};

export default SubscriptionForm; 