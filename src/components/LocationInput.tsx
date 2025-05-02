import React, { useEffect, useRef, useState } from 'react';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

declare global {
  interface Window {
    initGoogleMapsAutocomplete?: () => void;
    google: any;
  }
}

// Centralize Google Maps API loading logic
const loadGoogleMapsAPI = () => {
  if (document.querySelector('script[src*="maps.googleapis.com"]')) {
    console.log('Google Maps API script already loaded.');
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initGoogleMapsAutocomplete`;
  script.async = true;
  script.defer = true;

  script.onerror = () => {
    console.error('Failed to load Google Maps API');
  };

  document.head.appendChild(script);
};

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter your address',
  className = '',
  required = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Google Maps Places Autocomplete
  useEffect(() => {
    // Define initialization function
    window.initGoogleMapsAutocomplete = () => {
      try {
        setIsLoading(false);
        setIsGoogleLoaded(true);

        if (inputRef.current && window.google && window.google.maps) {
          // Initialize autocomplete
          const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ['geocode', 'establishment']
          });

          // Set up place_changed listener
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place && place.formatted_address) {
              onChange(place.formatted_address);
            }
          });
        }
      } catch (error) {
        console.error('Error initializing Google Maps Places:', error);
      }
    };

    loadGoogleMapsAPI();

    // Clean up
    return () => {
      if (window.initGoogleMapsAutocomplete) {
        delete window.initGoogleMapsAutocomplete;
      }
    };
  }, [onChange]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] ${className}`}
        required={required}
        disabled={isLoading}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-5 w-5 border-2 border-[#FF5733] border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default LocationInput;