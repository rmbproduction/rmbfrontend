import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import userProfileDataService from '../services/userProfileDataService';
import { API_CONFIG } from '../config/api.config';

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
  // Pre-fill the form with user's phone number immediately when the modal opens
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
          
          console.log('Setting formatted phone number in booking modal:', cleanPhone);
          const mockEvent = {
            target: {
              name: 'contact_number',
              value: cleanPhone
            }
          } as React.ChangeEvent<HTMLInputElement>;
          
          onBookingInputChange(mockEvent);
        } else {
          console.warn('No phone number found in any storage location');
        }
      } catch (error) {
        console.error('Error retrieving phone number for booking modal:', error);
      }
    }
  }, [isOpen, onBookingInputChange]);

  if (!isOpen) return null;

  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove all non-numeric characters except '+'
    value = value.replace(/[^\d+]/g, '');
    
    // Ensure only one '+' at the start
    if (value.includes('+')) {
      value = '+' + value.replace(/\+/g, '');
    }
    
    // Limit length to 15 characters
    value = value.slice(0, 15);
    
    // Validate the phone number format
    const isValid = API_CONFIG.validatePhone(value);
    
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Book Vehicle</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="mb-4">
                <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number*
                </label>
                <input
                  type="tel"
                  id="contact_number"
                  name="contact_number"
                  value={bookingData.contact_number}
                  onChange={handlePhoneChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
                  placeholder="+91XXXXXXXXXX"
                  pattern="\\+?[0-9]{10,15}"
                  title="Phone number must be between 10-15 digits with optional + prefix"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format: +91XXXXXXXXXX (10-15 digits with optional + prefix)
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={bookingData.notes}
                  onChange={onBookingInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
                  placeholder="Any specific requirements or questions..."
                />
              </div>

              {bookingError && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{bookingError}</p>
                </div>
              )}

              <div className="mt-5 sm:mt-6">
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#FF5733] text-base font-medium text-white hover:bg-[#ff4019] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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