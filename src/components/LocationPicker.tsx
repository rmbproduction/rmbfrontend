import { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { googleMapsConfig } from '../config/api.config';

interface LocationPickerProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

const LocationPicker = ({ onLocationSelect }: LocationPickerProps) => {
  const [selectedLocation, setSelectedLocation] = useState(googleMapsConfig.defaultCenter);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setSelectedLocation(newLocation);
      onLocationSelect?.(newLocation);
    }
  }, [onLocationSelect]);

  return (
    <LoadScript googleMapsApiKey={googleMapsConfig.apiKey}>
      <div className="w-full h-[400px] rounded-xl overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={selectedLocation}
          zoom={googleMapsConfig.defaultZoom}
          onClick={handleMapClick}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {selectedLocation && (
            <Marker
              position={selectedLocation}
            />
          )}
        </GoogleMap>
      </div>
    </LoadScript>
  );
};

export default LocationPicker;
