import React, { useState, useEffect, useCallback } from 'react';
import { X, Phone, AlertCircle } from 'lucide-react';
import userProfileDataService from '../services/userProfileDataService';
import { API_CONFIG } from '../config/api.config';
import { toast } from 'react-toastify';

interface BookingVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  bookingData: {
    contact_number: string;
    notes: string;
  };
  onBookingInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  bookingError: string | null;
  bookingLoading: boolean;
}

const BookingVehicleModal: React.FC<BookingVehicleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bookingData,
  onBookingInputChange,
  bookingError,
  bookingLoading
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Handle escape key
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, handleEscapeKey]);

  // Pre-fill the form with user's phone number
  useEffect(() => {
    if (isOpen) {
      // Immediately try to grab the phone number from multiple sources
      const userPhone = userProfileDataService.getUserPhone();
      
      // Try to get phone directly from profile data
      let phoneNumber = '';
      try {
        // First check localStorage - this is where profile page data is stored
        const profileData = localStorage.getItem('userProfileData');
        if (profileData) {
          const parsed = JSON.parse(profileData);
          if (parsed && parsed.phone) phoneNumber = parsed.phone;
        }
        
        // If not found, check userProfile in localStorage
        if (!phoneNumber) {
          const userProfile = localStorage.getItem('userProfile');
          if (userProfile) {
            const parsed = JSON.parse(userProfile);
            if (parsed && parsed.phone) phoneNumber = parsed.phone;
          }
        }
        
        // Check saved profile in sessionStorage
        if (!phoneNumber) {
          const savedProfile = sessionStorage.getItem('savedProfileData');
          if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            if (parsed && parsed.phone) phoneNumber = parsed.phone;
          }
        }
        
        // Last resort - try to get it from the service
        if (!phoneNumber) {
          phoneNumber = userPhone;
        }
        
        // Format the phone number before setting it
        if (phoneNumber) {
          // Clean the phone number
          let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
          
          // Ensure it starts with +
          if (!cleanPhone.startsWith('+')) {
            cleanPhone = '+' + cleanPhone;
          }
          
          // Ensure only one + at start
          cleanPhone = '+' + cleanPhone.replace(/\+/g, '');
          
          // Limit length
          cleanPhone = cleanPhone.slice(0, 15);
          
          const mockEvent = {
            target: {
              name: 'contact_number',
              value: cleanPhone
            }
          } as React.ChangeEvent<HTMLInputElement>;
          
          onBookingInputChange(mockEvent);
        }
      } catch (error) {
        console.error('Error retrieving phone number for booking modal:', error);
      }
    }
  }, [isOpen, onBookingInputChange]);

  if (!isOpen) return null;

  // Format phone number as user types with better UX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove all non-numeric characters except + at the start
    value = value.replace(/[^\d+]/g, '');
    
    // Ensure only one + at start
    if (value.startsWith('+')) {
      value = '+' + value.substring(1).replace(/\+/g, '');
    }
    
    // If no + at start and has numbers, add +
    if (!value.startsWith('+') && value.length > 0) {
      value = '+' + value;
    }
    
    // Limit length to 15 characters
    value = value.slice(0, 15);
    
    // Clear validation error when user types
    setValidationError(null);
    
    // Create a synthetic event with the formatted value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: 'contact_number',
        value
      }
    };
    
    onBookingInputChange(syntheticEvent);
  };

  // Enhanced phone number validation
  const validatePhoneNumber = (phone: string): boolean => {
    // Must start with + and have 10-15 digits
    const phoneRegex = /^\+\d{10,14}$/;
    const isValid = phoneRegex.test(phone);
    
    if (!isValid) {
      if (!phone.startsWith('+')) {
        setValidationError('Phone number must start with country code (e.g., +91)');
      } else if (phone.length < 11) {
        setValidationError('Phone number is too short');
      } else if (phone.length > 15) {
        setValidationError('Phone number is too long');
      } else {
        setValidationError('Please enter a valid phone number');
      }
    } else {
      setValidationError(null);
    }
    
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhoneNumber(bookingData.contact_number)) {
      return;
    }
    onSubmit(e);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          aria-hidden="true"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 
                id="booking-modal-title"
                className="text-lg font-medium text-gray-900 flex items-center"
              >
                Book Vehicle
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors p-2 rounded-full hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="contact_number" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="contact_number"
                    name="contact_number"
                    value={bookingData.contact_number}
                    onChange={handlePhoneChange}
                    className={`w-full pl-10 pr-3 py-2 border ${
                      validationError || bookingError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] transition-colors`}
                    placeholder="+91XXXXXXXXXX"
                    required
                    aria-invalid={!!validationError}
                    aria-describedby={validationError ? "phone-error" : undefined}
                  />
                </div>
                {(validationError || bookingError) && (
                  <div 
                    id="phone-error" 
                    className="mt-1 flex items-center text-sm text-red-600"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>{validationError || bookingError}</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Format: +91XXXXXXXXXX (must start with country code)
                </p>
              </div>

              <div>
                <label 
                  htmlFor="notes" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={bookingData.notes}
                  onChange={onBookingInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] transition-colors"
                  placeholder="Any specific requirements or questions..."
                />
              </div>

              <div className="mt-5 sm:mt-6">
                <button
                  type="submit"
                  disabled={bookingLoading || !!validationError}
                  className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#FF5733] text-base font-medium text-white hover:bg-[#ff4019] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {bookingLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Submit Booking'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingVehicleModal;