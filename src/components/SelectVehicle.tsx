import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '../config/api.config';

// -----------------------------
// Data Types
// -----------------------------
interface VehicleType {
  id: number;
  name: string;
  image: string | null;
}

interface Manufacturer {
  id: number;
  name: string;
  logo: string | null;
}

export interface VehicleModel {
  id: number;
  name: string;
  image: string | null;
  manufacturer: number;
  vehicle_type: number;
}

interface MultiStepVehicleSelectorProps {
  onVehicleSelected?: () => void;
  isModal?: boolean;
}

const MultiStepVehicleSelector: React.FC<MultiStepVehicleSelectorProps> = ({ onVehicleSelected, isModal = true }) => {
  // Steps: 1=Vehicle Types, 2=Manufacturers, 3=Vehicle Models, 4=Model Details
  const [step, setStep] = useState(1);

  // Data states
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);

  // Selections
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state for vehicle selection
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Notification state (to replace native alert)
  const [notification, setNotification] = useState('');

  // -----------------------------
  // Restore Session Storage Data on Mount
  // -----------------------------
  useEffect(() => {
    try {
      const savedVehicleType = sessionStorage.getItem('selectedVehicleType');
      const savedManufacturer = sessionStorage.getItem('selectedManufacturer');
      const savedModel = sessionStorage.getItem('selectedModel');
      const savedOwnership = sessionStorage.getItem("userVehicleOwnership");

      if (savedVehicleType) setSelectedVehicleType(JSON.parse(savedVehicleType));
      if (savedManufacturer) setSelectedManufacturer(JSON.parse(savedManufacturer));
      if (savedModel) setSelectedModel(JSON.parse(savedModel));

      if (savedOwnership) {
        console.log("Ownership data from session:", JSON.parse(savedOwnership));
      }

      // Set step based on available data
      if (savedVehicleType && savedManufacturer && savedModel) {
        setStep(4);
      } else if (savedVehicleType && savedManufacturer) {
        setStep(3);
      } else if (savedVehicleType) {
        setStep(2);
      }
    } catch (err) {
      console.error('Error restoring session data:', err);
      // Clear invalid data
      sessionStorage.removeItem('selectedVehicleType');
      sessionStorage.removeItem('selectedManufacturer');
      sessionStorage.removeItem('selectedModel');
      sessionStorage.removeItem('userVehicleOwnership');
    }
  }, []);

  // -----------------------------
  // Step 1: Fetch Vehicle Types on Mount
  // -----------------------------
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = import.meta.env.VITE_VEHICLE_TYPES_URL || `${API_CONFIG.BASE_URL}/vehicle/vehicle-types/`;
        if (!url) {
          throw new Error('Vehicle types URL is not configured');
        }
        
        // Add authentication headers
        const token = localStorage.getItem('accessToken'); // or wherever you store your token
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          credentials: 'include', // This is important for cookies if you're using session auth
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch vehicle types: ${response.statusText}`);
        }
        const text = await response.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        const data = JSON.parse(text);
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected an array');
        }
        setVehicleTypes(data);
      } catch (err: any) {
        console.error('Error fetching vehicle types:', err);
        setError(err.message || 'Error fetching vehicle types');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleTypes();
  }, []);

  // -----------------------------
  // Step 2: Fetch Manufacturers (when vehicle type selected)
  // -----------------------------
  const handleSelectVehicleType = async (vehicleType: VehicleType) => {
    setSelectedVehicleType(vehicleType);
    sessionStorage.setItem('selectedVehicleType', JSON.stringify(vehicleType));
    setSelectedManufacturer(null);
    setSelectedModel(null);
    setStep(2);

    try {
      setLoading(true);
      setError(null);
      const url = import.meta.env.VITE_MANUFACTURERS_URL || `${API_CONFIG.BASE_URL}/vehicle/manufacturers/`;
      if (!url) {
        throw new Error('Manufacturers URL is not configured');
      }
      
      // Add authentication headers if needed
      const token = localStorage.getItem('accessToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch manufacturers: ${response.statusText}`);
      }
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected an array');
      }
      setManufacturers(data);
    } catch (err: any) {
      console.error('Error fetching manufacturers:', err);
      setError(err.message || 'Error fetching manufacturers');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Step 3: Fetch Models (when manufacturer selected)
  // -----------------------------
  const handleSelectManufacturer = async (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    sessionStorage.setItem('selectedManufacturer', JSON.stringify(manufacturer));
    setSelectedModel(null);
    setStep(3);

    try {
      setLoading(true);
      setError(null);
      const baseUrl = import.meta.env.VITE_VEHICLE_MODELS_URL || `${API_CONFIG.BASE_URL}/vehicle/vehicle-models/`;
      if (!baseUrl) {
        throw new Error('Vehicle models URL is not configured');
      }
      
      // Add query parameters for filtering
      const url = new URL(baseUrl);
      if (manufacturer.id) {
        url.searchParams.append('manufacturer_id', manufacturer.id.toString());
      }
      if (selectedVehicleType?.id) {
        url.searchParams.append('vehicle_type_id', selectedVehicleType.id.toString());
      }
      
      // Add authentication headers if needed
      const token = localStorage.getItem('accessToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch vehicle models: ${response.statusText}`);
      }
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected an array');
      }

      // Filter models based on selected manufacturer and vehicle type
      const filteredModels = data.filter(
        (model) =>
          model.manufacturer === manufacturer.id &&
          model.vehicle_type === (selectedVehicleType?.id ?? 0)
      );
      setVehicleModels(filteredModels);
    } catch (err: any) {
      console.error('Error fetching vehicle models:', err);
      setError(err.message || 'Error fetching vehicle models');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Step 3.5: Handle Model Selection and Store in Session
  // -----------------------------
  const handleSelectModel = (model: VehicleModel) => {
    setSelectedModel(model);
    sessionStorage.setItem('selectedModel', JSON.stringify(model));
    setStep(4);
  };

  // -----------------------------
  // Step 4: Save Ownership of Selected Model in Session (No Backend Call)
  // -----------------------------
  const handleOwnVehicle = () => {
    if (!selectedModel || !selectedManufacturer || !selectedVehicleType) return;

    const ownershipData = {
      vehicle_type: selectedVehicleType.id,
      manufacturer: selectedManufacturer.id,
      model: selectedModel.id,
      registration_number: `AUTO-${Date.now()}`,
      purchase_date: new Date().toISOString().split('T')[0],
    };

    // Save ownership data
    sessionStorage.setItem("userVehicleOwnership", JSON.stringify(ownershipData));

    // Show a non-blocking notification right away
    setNotification("You own this Vehicle");
    
    // Call the callback if provided
    if (onVehicleSelected) {
      onVehicleSelected();
    }
    
    // If in modal mode, don't refresh the page
    if (isModal) {
      setTimeout(() => {
        setNotification('');
      }, 1000);
    } else {
      // For full page mode, refresh the page after 1 second
      setTimeout(() => {
        setNotification('');
        window.location.reload(); // This will refresh the page and close the modal
      }, 1000);
    }
  };

  // -----------------------------
  // Render "Back" button component with step guard
  // -----------------------------
  const BackButton = () => (
    <button
      onClick={() => {
        if (step > 1) setStep((prev) => prev - 1);
      }}
      disabled={step === 1}
      className="mb-4 bg-gray-300 text-gray-800 py-1 px-3 rounded hover:bg-gray-400 transition"
    >
      Back
    </button>
  );

  // -----------------------------
  // Render Steps
  // -----------------------------
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {notification && (
        <div className="fixed top-4 right-4 bg-green-200 text-green-800 px-4 py-2 rounded">
          {notification}
        </div>
      )}

      {/* Step 1: Vehicle Types */}
      {step === 1 && (
        <div>
          <h2 id="modal-title" className="text-xl font-bold mb-4">Select Vehicle Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vehicleTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => handleSelectVehicleType(type)}
                className="border p-4 rounded shadow cursor-pointer hover:bg-gray-50 transition"
              >
                <div className="flex items-center">
                  {type.image ? (
                    <img
                      src={type.image}
                      alt={type.name}
                      className="w-16 h-16 object-cover mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 mr-4 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Image</span>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold">{type.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Manufacturers */}
      {step === 2 && selectedVehicleType && (
        <div>
          <BackButton />
          <h2 className="text-xl font-bold mb-4">
            Selected Type: {selectedVehicleType.name}
          </h2>
          <h3 className="text-lg mb-2">Select Manufacturer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {manufacturers.map((mfr) => (
              <div
                key={mfr.id}
                onClick={() => handleSelectManufacturer(mfr)}
                className="border p-4 rounded shadow cursor-pointer hover:bg-gray-50 transition"
              >
                <div className="flex items-center">
                  {mfr.logo ? (
                    <img
                      src={mfr.logo}
                      alt={mfr.name}
                      className="w-16 h-16 object-cover mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 mr-4 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Logo</span>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold">{mfr.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Vehicle Models */}
      {step === 3 && selectedVehicleType && selectedManufacturer && (
        <div>
          <BackButton />
          <h2 className="text-xl font-bold mb-4">
            Selected: {selectedVehicleType.name} → {selectedManufacturer.name}
          </h2>
          <h3 className="text-lg mb-2">Select Model</h3>
          {vehicleModels.length === 0 ? (
            <p className="text-gray-600">
              No models found for {selectedManufacturer.name} in {selectedVehicleType.name}.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vehicleModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => handleSelectModel(model)}
                  className="border p-4 rounded shadow cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex items-center">
                    {model.image ? (
                      <img
                        src={model.image}
                        alt={model.name}
                        className="w-16 h-16 object-cover mr-4"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 mr-4 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Image</span>
                      </div>
                    )}
                    <h3 className="text-lg font-semibold">{model.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Model Details */}
      {step === 4 && selectedVehicleType && selectedManufacturer && selectedModel && (
        <div>
          <BackButton />
          <h2 className="text-xl font-bold mb-4">
            Selected: {selectedVehicleType.name} → {selectedManufacturer.name} → {selectedModel.name}
          </h2>
          <div className="border p-4 rounded shadow">
            <p className="mb-2">
              <strong>Type:</strong> {selectedVehicleType.name}
            </p>
            <p className="mb-2">
              <strong>Manufacturer:</strong> {selectedManufacturer.name}
            </p>
            <p className="mb-2">
              <strong>Model:</strong> {selectedModel.name}
            </p>
            {selectedModel.image && (
              <div className="mt-4">
                <img
                  src={selectedModel.image}
                  alt={selectedModel.name}
                  className="w-32 h-32 object-cover rounded"
                />
              </div>
            )}
          </div>
          <button
            onClick={handleOwnVehicle}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            I Own This
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiStepVehicleSelector;
