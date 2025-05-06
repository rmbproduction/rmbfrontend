import React, { useState } from 'react';

interface LocationPickerProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

const LocationPicker = ({ onLocationSelect }: LocationPickerProps) => {
  const [address, setAddress] = useState('');

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    // Use a placeholder location when real maps are removed
    if (onLocationSelect) {
      onLocationSelect({
        lat: 28.6139, // Default coordinates
        lng: 77.2090
      });
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <input
          type="text"
          value={address}
          onChange={handleAddressChange}
          placeholder="Enter your location"
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>
      <div className="w-full h-[400px] rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Map view unavailable</p>
      </div>
    </div>
  );
};

export default LocationPicker;
