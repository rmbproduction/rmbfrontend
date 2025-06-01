import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TokenManager from '../services/tokenManager';
import { useVehicleSelection } from '../hooks/vehicle/useVehicleSelection';
import FormModal from '../components/FormModal';
import { format, addDays, isWeekend, setHours, setMinutes, isBefore, isAfter, addHours } from 'date-fns';
import { API_CONFIG, API_ENDPOINTS } from '../config/api.config';

interface FormData {
  vehicle_type: string;
  brand: string;
  model: string;
  year: string;
  registration_number: string;
  kms_driven: string;
  fuel_type: string;
  engine_capacity: string;
  color: string;
  expected_price: string;
  pickup_address: string;
  contact_number: string;
  pickup_slot: string;
}

interface FileData {
  registration_certificate: File | null;
  insurance_document: File | null;
  puc_certificate: File | null;
  ownership_transfer: File | null;
  additional_documents: File | null;
  photo_front: File | null;
  photo_back: File | null;
  photo_left: File | null;
  photo_right: File | null;
  photo_dashboard: File | null;
  photo_odometer: File | null;
  photo_chassis: File | null;
  photo_engine: File | null;
}

interface Previews {
  [key: string]: string;
}

interface ValidationRule {
  required: boolean;
  message: string;
  pattern?: RegExp;
  min?: number;
  max?: number;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

// Add new interface for time slots
interface TimeSlot {
  value: string;
  label: string;
  disabled: boolean;
}

// Validation rules for form fields
const VALIDATION_RULES: ValidationRules = {
  vehicle_type: { required: true, message: 'Please select a vehicle type' },
  brand: { required: true, message: 'Please enter the brand name' },
  model: { required: true, message: 'Please enter the model name' },
  year: { 
    required: true, 
    pattern: /^\d{4}$/, 
    min: 1900,
    max: new Date().getFullYear(),
    message: 'Please enter a valid year'
  },
  registration_number: { 
    required: true, 
    message: 'Please enter the registration number'
  },
  kms_driven: { 
    required: true, 
    min: 0,
    message: 'Please enter kilometers driven'
  },
  fuel_type: { required: true, message: 'Please select a fuel type' },
  engine_capacity: { 
    required: true,
    min: 1,
    message: 'Please enter engine capacity'
  },
  color: { required: true, message: 'Please enter the vehicle color' },
  expected_price: { 
    required: true,
    min: 1,
    message: 'Please enter expected price'
  },
  pickup_address: { 
    required: true, 
    message: 'Please provide pickup address'
  },
  contact_number: { 
    required: true,
    message: 'Please enter contact number'
  },
  pickup_slot: { 
    required: true, 
    message: 'Please select a pickup slot' 
  }
};

// Required document types
const REQUIRED_DOCUMENTS = [
  'registration_certificate',
  'insurance_document',
  'puc_certificate',
  'ownership_transfer'
];

// Required photos
const REQUIRED_PHOTOS = [
  'photo_front',
  'photo_back',
  'photo_left',
  'photo_right',
  'photo_dashboard',
  'photo_odometer',
  'photo_engine'
];

export default function SellVehicle() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { selectedVehicle, setSelectedVehicle, resetVehicleSelection } = useVehicleSelection();

  // Initialize form data with selected vehicle if available
  const [formData, setFormData] = useState<FormData>({
    vehicle_type: '',
    brand: selectedVehicle?.manufacturer || '',
    model: selectedVehicle?.model || '',
    year: '',
    registration_number: '',
    kms_driven: '',
    fuel_type: '',
    engine_capacity: '',
    color: '',
    expected_price: '',
    pickup_address: '',
    contact_number: '',
    pickup_slot: ''
  });

  const [files, setFiles] = useState<FileData>({
    registration_certificate: null,
    insurance_document: null,
    puc_certificate: null,
    ownership_transfer: null,
    additional_documents: null,
    photo_front: null,
    photo_back: null,
    photo_left: null,
    photo_right: null,
    photo_dashboard: null,
    photo_odometer: null,
    photo_chassis: null,
    photo_engine: null
  });

  const [previews, setPreviews] = useState<Previews>({});
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'error',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/sell-vehicle' } });
    }
  }, [isAuthenticated, navigate]);

  // Generate available time slots
  const generateTimeSlots = (selectedDate: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const startHour = 9;
    const endHour = 18;

    // Check if selected date is today
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const slotTime = setMinutes(setHours(selectedDate, hour), minute);
        const isDisabled = isToday && isBefore(slotTime, now);
        
        slots.push({
          value: format(slotTime, "yyyy-MM-dd'T'HH:mm"),
          label: format(slotTime, 'hh:mm a'),
          disabled: isDisabled
        });
      }
    }

    return slots;
  };

  // Validate pickup slot
  const validatePickupSlot = (dateTimeStr: string): string => {
    if (!dateTimeStr) return 'Pickup slot is required';

    const pickupDate = new Date(dateTimeStr);
    const now = new Date();
    const maxDate = addDays(now, 14); // Allow booking up to 14 days in advance

    // Basic date validation
    if (isBefore(pickupDate, now)) {
      return 'Pickup slot cannot be in the past';
    }

    if (isAfter(pickupDate, maxDate)) {
      return 'Pickup slot cannot be more than 14 days in advance';
    }

    if (isWeekend(pickupDate)) {
      return 'Pickup is only available on weekdays (Monday to Friday)';
    }

    // Time validation
    const hours = pickupDate.getHours();
    const minutes = pickupDate.getMinutes();
    
    // Create time boundaries for the selected date
    const startTime = setMinutes(setHours(new Date(pickupDate), 9), 0);  // 9:00 AM
    const endTime = setMinutes(setHours(new Date(pickupDate), 18), 0);   // 6:00 PM

    // Check if the selected time is within business hours
    if (isBefore(pickupDate, startTime) || isAfter(pickupDate, endTime)) {
      return 'Pickup slot must be between 9:00 AM and 6:00 PM';
    }

    // Validate 30-minute intervals
    if (minutes !== 0 && minutes !== 30) {
      return 'Pickup slots are available every 30 minutes';
    }

    // If today, ensure slot is at least 1 hour in the future
    if (format(pickupDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
      const oneHourFromNow = addHours(now, 1);
      if (isBefore(pickupDate, oneHourFromNow)) {
        return 'Pickup slot must be at least 1 hour from now';
      }
    }

    return '';
  };

  // Validate a single field
  const validateField = (name: string, value: any): string => {
    const rules = VALIDATION_RULES[name as keyof typeof VALIDATION_RULES];
    if (!rules) return '';

    if (rules.required && !value) {
      return rules.message;
    }

    if (name === 'pickup_slot') {
      return validatePickupSlot(value);
    }

    if (rules.pattern && !rules.pattern.test(value.toString())) {
      return rules.message;
    }

    if (rules.min !== undefined && Number(value) < rules.min) {
      return rules.message;
    }

    if (rules.max !== undefined && Number(value) > rules.max) {
      return rules.message;
    }

    return '';
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    let isValid = true;

    // Validate form fields
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    // Validate pickup slot
    const pickupSlotError = validatePickupSlot(formData.pickup_slot);
    if (pickupSlotError) {
      newErrors.pickup_slot = pickupSlotError;
      isValid = false;
    }

    // Validate required documents
    REQUIRED_DOCUMENTS.forEach(doc => {
      if (!files[doc as keyof FileData]) {
        newErrors[doc] = 'This document is required';
        isValid = false;
      }
    });

    // Validate required photos
    REQUIRED_PHOTOS.forEach(photo => {
      if (!files[photo as keyof FileData]) {
        newErrors[photo] = 'This photo is required';
        isValid = false;
      }
    });

    setFormErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Update vehicle selection when brand or model changes
    if (name === 'brand' || name === 'model') {
      const updatedVehicle = {
        ...selectedVehicle,
        manufacturer: name === 'brand' ? value : selectedVehicle?.manufacturer || '',
        model: name === 'model' ? value : selectedVehicle?.model || '',
        manufacturerId: selectedVehicle?.manufacturerId || 0,
        modelId: selectedVehicle?.modelId || 0,
        vehicleType: selectedVehicle?.vehicleType || formData.vehicle_type || 'bike'  // Provide a default value
      };
      setSelectedVehicle(updatedVehicle);
    }
    
    // Special handling for pickup_slot
    if (name === 'pickup_slot') {
      validatePickupSlot(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files: fileList } = e.target;
    if (fileList?.[0]) {
      const file = fileList[0];
      setFiles(prev => ({
        ...prev,
        [name]: file
      }));

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviews(prev => ({
        ...prev,
        [name]: previewUrl
      }));
    }
  };

  const handleReset = () => {
    resetVehicleSelection();
    setFormData({
      vehicle_type: '',
      brand: '',
      model: '',
      year: '',
      registration_number: '',
      kms_driven: '',
      fuel_type: '',
      engine_capacity: '',
      color: '',
      expected_price: '',
      pickup_address: '',
      contact_number: '',
      pickup_slot: ''
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields correctly before submitting.'
      });
      setLoading(false);
      return;
    }

    try {
      const accessToken = TokenManager.getAccessToken();
      
      if (!accessToken) {
        throw new Error('No access token found');
      }

      // First check if registration number exists
      try {
        const checkResponse = await axios.get(
          `${API_CONFIG.baseURL}/marketplace/vehicles/check-registration-number/`,
          {
            params: {
              registration_number: formData.registration_number
            },
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        );

        console.log('Registration check response:', checkResponse.data);

        if (checkResponse.data.exists) {
          setModalState({
            isOpen: true,
            type: 'error',
            title: 'Registration Error',
            message: 'This registration number is already registered in our system. Please check the number and try again.'
          });
          setLoading(false);
          return;
        }
      } catch (error: any) {
        // Log the error for debugging
        console.error('Registration check error:', error.response || error);
        
        // Only show error modal if it's not a 404 (not found) error
        if (error.response?.status !== 404) {
          setModalState({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to check registration number. Please try again.'
          });
          setLoading(false);
          return;
        }
        // If it's a 404, the registration number doesn't exist, so we can continue
      }

      // Now create the sell request
      try {
        // Create a proper FormData object
        const sellRequestFormData = new FormData();
        
        // Add all form fields
        Object.entries(formData).forEach(([key, value]) => {
          if (key === 'pickup_slot') {
            // Format the pickup slot to ISO string
            const pickupDate = new Date(value);
            sellRequestFormData.append(key, pickupDate.toISOString());
          } else {
            sellRequestFormData.append(key, value.toString());
          }
        });

        // Add all files with proper field names
        Object.entries(files).forEach(([key, file]) => {
          if (file) {
            // Map the file keys to the expected backend field names
            const fieldName = key.includes('photo_') ? key : key;
            sellRequestFormData.append(fieldName, file);
          }
        });

        const sellRequestResponse = await axios.post(
          `${API_CONFIG.baseURL}/marketplace/sell-requests/`,
          sellRequestFormData,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        // Handle successful submission
        setModalState({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Your vehicle sell request has been submitted successfully. Our team will review it and get back to you soon.'
        });
        
        // Reset form and loading state
        setLoading(false);
        resetForm();
        
      } catch (error: any) {
        setLoading(false);
        let errorMessage = 'Failed to submit sell request. Please try again.';
        
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response?.data) {
          // Format validation errors
          const errors = error.response.data;
          errorMessage = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages[0] : messages}`)
            .join('\n');
        }
        
        setModalState({
          isOpen: true,
          type: 'error',
          title: 'Submission Error',
          message: errorMessage
        });
      }

    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        navigate('/login', { state: { from: '/sell-vehicle' } });
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data) {
        errorMessage = Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      }

      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Cleanup preview URLs when component unmounts
  React.useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  // If not authenticated, don't render the form
  if (!isAuthenticated) {
    return null;
  }

  const renderFieldError = (fieldName: string) => {
    if (!formErrors[fieldName]) return null;
    return (
      <p className="mt-1 text-sm text-red-600">
        {formErrors[fieldName]}
      </p>
    );
  };

  const renderInputField = (
    name: keyof FormData,
    label: string,
    type: string = 'text',
    placeholder: string = '',
    options?: { value: string; label: string }[]
  ) => {
    const hasError = !!formErrors[name];
    const baseClasses = "w-full rounded-lg border p-2.5 text-gray-900 focus:ring-2 focus:ring-[#FF5733] focus:border-transparent";
    const classes = `${baseClasses} ${
      hasError 
        ? 'border-red-500 bg-red-50' 
        : 'border-gray-300 bg-white'
    }`;

    if (name === 'pickup_slot') {
      const selectedDate = formData.pickup_slot 
        ? new Date(formData.pickup_slot)
        : new Date();

      const minDate = format(new Date(), "yyyy-MM-dd");
      const maxDate = format(addDays(new Date(), 14), "yyyy-MM-dd");
      
      return (
        <div className="space-y-4">
          <label className="block mb-2 text-sm font-medium text-gray-900">
            {label}
            <span className="text-red-500 ml-1">*</span>
          </label>
          
          {/* Date Selection */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Select Date</label>
            <input
              type="date"
              name="pickup_date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              min={minDate}
              max={maxDate}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                const currentTime = formData.pickup_slot 
                  ? new Date(formData.pickup_slot)
                  : setHours(setMinutes(new Date(), 0), 9);
                
                newDate.setHours(currentTime.getHours());
                newDate.setMinutes(currentTime.getMinutes());
                
                handleInputChange({
                  target: {
                    name: 'pickup_slot',
                    value: format(newDate, "yyyy-MM-dd'T'HH:mm")
                  }
                } as any);
              }}
              className={classes}
              disabled={loading}
            />
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Select Time Slot</label>
            <div className="grid grid-cols-4 gap-2">
              {generateTimeSlots(selectedDate).map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={slot.disabled || loading}
                  onClick={() => {
                    handleInputChange({
                      target: {
                        name: 'pickup_slot',
                        value: slot.value
                      }
                    } as any);
                  }}
                  className={`p-2 text-sm rounded-lg transition-colors ${
                    formData.pickup_slot === slot.value
                      ? 'bg-[#FF5733] text-white'
                      : slot.disabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Available on weekdays (Monday to Friday)</p>
            <p>• Slots every 30 minutes from 9 AM to 6 PM</p>
            <p>• Book up to 14 days in advance</p>
          </div>
          
          {renderFieldError(name)}
        </div>
      );
    }

    return (
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900">
          {label}
          <span className="text-red-500 ml-1">*</span>
        </label>
        
        {type === 'select' ? (
          <select
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            className={classes}
            disabled={loading}
            required
          >
            <option value="">Select {label}</option>
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'datetime-local' ? (
          <div className="relative">
            <input
              type="datetime-local"
              name={name}
              value={formData[name]}
              onChange={handleInputChange}
              className={classes}
              min={new Date().toISOString().slice(0, 16)}
              required
              disabled={loading}
            />
            <div className="mt-1 text-xs text-gray-500">
              Available slots: 9 AM to 6 PM
            </div>
          </div>
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={classes}
            required
            disabled={loading}
          />
        )}
        {renderFieldError(name)}
      </div>
    );
  };

  const renderFileInput = (
    name: keyof FileData,
    label: string,
    required: boolean = true
  ) => {
    const hasError = !!formErrors[name];
    const baseClasses = "block w-full text-sm text-gray-900 border rounded-lg cursor-pointer focus:outline-none";
    const classes = `${baseClasses} ${
      hasError 
        ? 'border-red-500 bg-red-50' 
        : 'border-gray-300 bg-gray-50'
    }`;

    return (
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="file"
          name={name}
          onChange={handleFileChange}
          className={classes}
          accept={name.includes('photo') ? "image/*" : ".pdf,image/*"}
          required={required}
          disabled={loading}
        />
        {previews[name] && (
          <div className="mt-2">
            <img 
              src={previews[name]} 
              alt={`${label} Preview`} 
              className="h-32 object-contain rounded-lg border border-gray-200"
            />
          </div>
        )}
        {renderFieldError(name)}
      </div>
    );
  };

  const resetForm = () => {
    setFormData({
      vehicle_type: '',
      brand: '',
      model: '',
      year: '',
      registration_number: '',
      kms_driven: '',
      fuel_type: '',
      engine_capacity: '',
      color: '',
      expected_price: '',
      pickup_slot: '',
      pickup_address: '',
      contact_number: ''
    });
    setFiles({
      registration_certificate: null,
      insurance_document: null,
      puc_certificate: null,
      ownership_transfer: null,
      additional_documents: null,
      photo_front: null,
      photo_back: null,
      photo_left: null,
      photo_right: null,
      photo_dashboard: null,
      photo_odometer: null,
      photo_chassis: null,
      photo_engine: null
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sell Your Vehicle</h1>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          type="button"
        >
          Reset Form
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Vehicle Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Vehicle Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInputField('vehicle_type', 'Vehicle Type', 'select', '', [
              { value: 'bike', label: 'Bike' },
              { value: 'scooter', label: 'Scooter' },
              { value: 'electric_bike', label: 'Electric Bike' },
              { value: 'electric_scooter', label: 'Electric Scooter' }
            ])}
            {renderInputField('brand', 'Brand')}
            {renderInputField('model', 'Model')}
            {renderInputField('year', 'Year', 'number', 'YYYY')}
            {renderInputField('registration_number', 'Registration Number', 'text', 'e.g., MH02AB1234')}
            {renderInputField('kms_driven', 'Kilometers Driven', 'number')}
            {renderInputField('fuel_type', 'Fuel Type', 'select', '', [
              { value: 'petrol', label: 'Petrol' },
              { value: 'electric', label: 'Electric' }
            ])}
            {renderInputField('engine_capacity', 'Engine Capacity (cc)', 'number')}
            {renderInputField('color', 'Color')}
            {renderInputField('expected_price', 'Expected Price', 'number')}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Required Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderFileInput('registration_certificate', 'Registration Certificate')}
            {renderFileInput('insurance_document', 'Insurance Document')}
            {renderFileInput('puc_certificate', 'PUC Certificate')}
            {renderFileInput('ownership_transfer', 'Ownership Transfer')}
            {renderFileInput('additional_documents', 'Additional Documents', false)}
          </div>
        </div>

        {/* Vehicle Photos */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Vehicle Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderFileInput('photo_front', 'Front View')}
            {renderFileInput('photo_back', 'Back View')}
            {renderFileInput('photo_left', 'Left Side')}
            {renderFileInput('photo_right', 'Right Side')}
            {renderFileInput('photo_dashboard', 'Dashboard')}
            {renderFileInput('photo_odometer', 'Odometer')}
            {renderFileInput('photo_chassis', 'Chassis')}
            {renderFileInput('photo_engine', 'Engine')}
          </div>
        </div>

        {/* Pickup Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Pickup Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInputField('pickup_slot', 'Preferred Pickup Time', 'datetime-local')}
            {renderInputField('contact_number', 'Contact Number', 'tel', '+91XXXXXXXXXX')}
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Pickup Address
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                name="pickup_address"
                value={formData.pickup_address}
                onChange={handleInputChange}
                className={`w-full rounded-lg border p-2.5 text-gray-900 focus:ring-2 focus:ring-[#FF5733] focus:border-transparent ${
                  formErrors.pickup_address 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 bg-white'
                }`}
                rows={3}
                required
                disabled={loading}
              />
              {renderFieldError('pickup_address')}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 rounded-lg text-white font-semibold ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#FF5733] hover:bg-[#ff4019] transition-colors'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Sell Request'
            )}
          </button>
        </div>
      </form>

      {/* Form Modal */}
      <FormModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        supportPhone="+91 1800 123 4567"
      />
    </div>
  );
} 