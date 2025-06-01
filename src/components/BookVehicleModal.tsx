import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';

interface BookVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  contactNumber: string;
  notes: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isLoading?: boolean;
}

// Phone number validation regex
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

const BookVehicleModal: React.FC<BookVehicleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  contactNumber,
  notes,
  onInputChange,
  isLoading = false
}) => {
  const { profile, updateProfile } = useUserProfile();
  const [error, setError] = useState<string>('');

  // Pre-fill contact number from cache if empty
  useEffect(() => {
    if (isOpen && !contactNumber && profile?.phone) {
      // Simulate an input change event to update the parent's state
      onInputChange({
        target: { name: 'contactNumber', value: profile.phone }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [isOpen, contactNumber, profile?.phone, onInputChange]);

  // Validate and handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'contactNumber') {
      // Clear error when user starts typing
      setError('');
      
      // Remove any spaces, dashes, or parentheses
      const cleanedNumber = value.replace(/[\s\-\(\)]/g, '');
      
      // Basic format validation before sending to server
      if (cleanedNumber && !PHONE_REGEX.test(cleanedNumber)) {
        setError('Please enter a valid phone number (10-15 digits with optional + prefix)');
      }
      
      // Update the profile cache with the new number
      updateProfile({ phone: cleanedNumber });
    }
    
    // Pass the event to parent's handler
    onInputChange(e);
  };

  // Validate before submitting
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Remove any spaces, dashes, or parentheses
    const cleanedNumber = contactNumber.replace(/[\s\-\(\)]/g, '');
    
    if (!cleanedNumber) {
      setError('Contact number is required');
      return;
    }
    
    if (!PHONE_REGEX.test(cleanedNumber)) {
      setError('Please enter a valid phone number (10-15 digits with optional + prefix)');
      return;
    }
    
    // If validation passes, call the parent's submit handler
    onSubmit(e);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Book Vehicle</h2>
        <p className="text-gray-600 text-sm mb-6">
          Fill out the form below to book this vehicle. Our team will contact you soon to guide you through the process.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number*
              </label>
              <input
                type="tel"
                id="contact"
                name="contactNumber"
                value={contactNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent`}
                placeholder="Enter your contact number"
                required
                disabled={isLoading}
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Format: +91XXXXXXXXXX (10-15 digits)</p>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                placeholder="Any specific details or questions about the vehicle..."
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019] transition-colors disabled:opacity-50 flex items-center justify-center"
              disabled={isLoading || !!error}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Submitting...
                </>
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

export default BookVehicleModal; 