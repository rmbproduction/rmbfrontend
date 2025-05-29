import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance, API_ENDPOINTS } from '../../config/api.config';
import OrderSuccessModal from '../OrderSuccessModal';
import ErrorModal from '../ErrorModal';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, MapPin, CheckCircle2, Loader2 } from 'lucide-react';

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
}

interface VehicleModel {
  id: number;
  name: string;
  manufacturer: number;
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
  const [showForm, setShowForm] = useState(true);

  // Fetch vehicle types
  const { data: vehicleTypes } = useQuery<VehicleType[]>({
    queryKey: ['vehicleTypes'],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.vehicle.types);
      return response.data;
    }
  });

  // Fetch manufacturers
  const { data: manufacturers } = useQuery<Manufacturer[]>({
    queryKey: ['manufacturers'],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.vehicle.manufacturers);
      return response.data;
    }
  });

  // Fetch vehicle models based on selected manufacturer
  const { data: vehicleModels } = useQuery<VehicleModel[]>({
    queryKey: ['vehicleModels', formData.manufacturer],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.vehicle.models, {
        params: { manufacturer: formData.manufacturer }
      });
      return response.data;
    },
    enabled: !!formData.manufacturer // Only fetch when manufacturer is selected
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
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
      
      if (submitAttempted) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: validateField(name, numValue)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (submitAttempted) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: validateField(name, value)
        }));
      }
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
        // Check for pending subscription error
        if (Array.isArray(err.response.data) && err.response.data[0] === "You already have a pending subscription request.") {
          onError("You already have a pending subscription request. Please wait for it to be processed or contact support for assistance.");
          setShowErrorModal(true);
          setShowForm(false);
          onClose();
          return;
        }

        // Handle other validation errors
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
        setError('Your session has expired. Please log in again.');
        navigate('/login', { state: { from: window.location.pathname } });
      } else if (err.response?.status === 429) {
        onError('Too many requests. Please try again later.');
      } else {
        onError('An unexpected error occurred. Please try again later.');
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
      {showForm && (
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
                  <select
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border ${
                      fieldErrors.vehicle_type ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
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

                  <select
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${
                      fieldErrors.manufacturer ? 'border-red-300' : ''
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select Manufacturer</option>
                    {manufacturers?.map(manufacturer => (
                      <option key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.name}
                      </option>
                    ))}
                  </select>
                  {renderFieldError('manufacturer')}

                  <select
                    name="vehicle_model"
                    value={formData.vehicle_model}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border ${
                      fieldErrors.vehicle_model ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                    disabled={!formData.manufacturer || loading}
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
      )}

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

      {/* Error Modal - Keep it separate from form visibility */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorModalMessage}
        supportPhone="+91 1800 123 4567"
      />
    </>
  );
};

export default SubscriptionForm; 