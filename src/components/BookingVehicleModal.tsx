import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import userProfileDataService from '../services/userProfileDataService';

interface BookingVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
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
        
        // Always update if we have a phone number
        if (phoneNumber) {
          console.log('Setting phone number in booking modal:', phoneNumber);
          const mockEvent = {
            target: {
              name: 'contact_number',
              value: phoneNumber
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Book Vehicle
        </h3>
        
        <p className="text-gray-600 mb-6">
          Fill out the form below to book this vehicle. Our team will contact you soon to guide you through the process.
        </p>
        
        {bookingError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
            {bookingError}
          </div>
        )}
        
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
              onChange={onBookingInputChange}
              required
              pattern="^\+?[0-9]{10,15}$"
              placeholder="+911234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF5733] focus:border-[#FF5733]"
            />
            <p className="mt-1 text-xs text-gray-500">Format: +911234567890 or 1234567890</p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={bookingData.notes}
              onChange={onBookingInputChange}
              rows={3}
              placeholder="Any specific details or questions about the vehicle..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF5733] focus:border-[#FF5733]"
            ></textarea>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-800 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bookingLoading}
              className="flex-1 bg-[#FF5733] text-white font-medium py-2.5 px-4 rounded-lg hover:bg-[#ff4019] transition-colors flex items-center justify-center"
            >
              {bookingLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                'Submit Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingVehicleModal; 