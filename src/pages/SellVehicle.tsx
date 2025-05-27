import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TokenManager from '../services/tokenManager';
import { useVehicleSelection } from '../hooks/vehicle/useVehicleSelection';

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
  photo_engine: File | null;
  photo_extras: File | null;
}

interface Previews {
  [key: string]: string;
}

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
    photo_engine: null,
    photo_extras: null
  });

  const [previews, setPreviews] = useState<Previews>({});
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/sell-vehicle' } });
    }
  }, [isAuthenticated, navigate]);

  const validatePickupSlot = (dateTimeStr: string): boolean => {
    const pickupDate = new Date(dateTimeStr);
    const now = new Date();
    const hour = pickupDate.getHours();

    // Clear previous error
    setFormErrors(prev => ({ ...prev, pickup_slot: '' }));

    // Check if date is in the past
    if (pickupDate < now) {
      setFormErrors(prev => ({ ...prev, pickup_slot: 'Pickup slot cannot be in the past' }));
      return false;
    }

    // Check business hours (9 AM to 6 PM)
    if (hour < 9 || hour >= 18) {
      setFormErrors(prev => ({ ...prev, pickup_slot: 'Pickup slot must be between 9 AM and 6 PM' }));
      return false;
    }

    return true;
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

    // Validate pickup slot before submission
    if (!validatePickupSlot(formData.pickup_slot)) {
      setLoading(false);
      return;
    }

    try {
      const accessToken = TokenManager.getAccessToken();
      
      if (!accessToken) {
        throw new Error('No access token found');
      }

      // First, create the vehicle
      const vehicleData = {
        vehicle_type: formData.vehicle_type,
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        registration_number: formData.registration_number,
        kms_driven: parseInt(formData.kms_driven),
        fuel_type: formData.fuel_type,
        engine_capacity: parseInt(formData.engine_capacity),
        color: formData.color,
        expected_price: parseFloat(formData.expected_price),
        status: 'pending'  // Initial status for newly created vehicles
      };

      // Create vehicle
      const vehicleResponse = await axios.post(
        'https://repairmybike.up.railway.app/api/marketplace/vehicles/',
        vehicleData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      const vehicleId = vehicleResponse.data.id;

      // Now create the sell request with the vehicle ID
      const sellRequestData = new FormData();
      
      // Add the vehicle ID
      sellRequestData.append('vehicle', vehicleId.toString());

      // Format pickup_slot to ISO string for backend
      const pickupDate = new Date(formData.pickup_slot);
      sellRequestData.append('pickup_slot', pickupDate.toISOString());

      // Add other sell request fields
      sellRequestData.append('pickup_address', formData.pickup_address);
      sellRequestData.append('contact_number', formData.contact_number);

      // Add all files
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          sellRequestData.append(key, file);
        }
      });

      // Debug request data
      console.log('Vehicle created:', vehicleResponse.data);
      console.log('Sell Request Data being sent:', Object.fromEntries(sellRequestData.entries()));
      console.log('Files being sent:', Object.fromEntries(Object.entries(files).filter(([_, file]) => file !== null)));

      // Create sell request
      const sellRequestResponse = await axios.post(
        'https://repairmybike.up.railway.app/api/marketplace/sell-requests/',
        sellRequestData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );

      console.log('Sell Request Response:', sellRequestResponse);
      alert('Vehicle sell request submitted successfully!');
      navigate('/profile');
    } catch (error: any) {
      console.error('Submission error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error details:', error.response?.data?.detail || error.response?.data);
      
      if (error.message === 'No access token found' || error.response?.status === 401) {
        alert('Authentication failed. Please try logging in again.');
        navigate('/login', { state: { from: '/sell-vehicle' } });
      } else {
        const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           Object.entries(error.response?.data || {}).map(([key, value]) => `${key}: ${value}`).join('\n') ||
                           error.message;
        alert(`Failed to submit sell request:\n${errorMessage}`);
      }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Sell Your Vehicle</h1>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Reset Form
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Vehicle Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="vehicle_type"
              value={formData.vehicle_type}
              onChange={handleInputChange}
              className="border rounded p-2"
              required
            >
              <option value="">Select Vehicle Type</option>
              <option value="bike">Bike</option>
              <option value="scooter">Scooter</option>
              <option value="electric_bike">Electric Bike</option>
              <option value="electric_scooter">Electric Scooter</option>
            </select>

            <input
              type="text"
              name="brand"
              placeholder="Brand"
              value={formData.brand}
              onChange={handleInputChange}
              className="border rounded p-2"
              required
            />

            <input
              type="text"
              name="model"
              placeholder="Model"
              value={formData.model}
              onChange={handleInputChange}
              className="border rounded p-2"
              required
            />

            <input
              type="number"
              name="year"
              placeholder="Year"
              value={formData.year}
              onChange={handleInputChange}
              className="border rounded p-2"
              required
            />

            <input
              type="text"
              name="registration_number"
              placeholder="Registration Number"
              value={formData.registration_number}
              onChange={handleInputChange}
              className="border rounded p-2"
              required
            />

            <input
              type="number"
              name="kms_driven"
              placeholder="Kilometers Driven"
              value={formData.kms_driven}
              onChange={handleInputChange}
              className="border rounded p-2"
              required
            />

            <select
              name="fuel_type"
              value={formData.fuel_type}
              onChange={handleInputChange}
              className="border rounded p-2"
              required
            >
              <option value="">Select Fuel Type</option>
              <option value="petrol">Petrol</option>
              <option value="electric">Electric</option>
            </select>

            <input
              type="number"
              name="engine_capacity"
              placeholder="Engine Capacity (cc)"
              value={formData.engine_capacity}
              onChange={handleInputChange}
              className="border rounded p-2"
              required
            />

            <input
              type="text"
              name="color"
              placeholder="Color"
              value={formData.color}
              onChange={handleInputChange}
              className="border rounded p-2"
              required
            />

            <input
              type="number"
              name="expected_price"
              placeholder="Expected Price"
              value={formData.expected_price}
              onChange={handleInputChange}
              className="border rounded p-2"
              required
            />
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Required Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Registration Certificate</label>
              <input
                type="file"
                name="registration_certificate"
                onChange={handleFileChange}
                className="border rounded p-2 w-full"
                accept=".pdf,image/*"
                required
              />
              {previews.registration_certificate && (
                <img src={previews.registration_certificate} alt="RC Preview" className="mt-2 h-32 object-contain" />
              )}
            </div>

            <div>
              <label className="block mb-2">Insurance Document</label>
              <input
                type="file"
                name="insurance_document"
                onChange={handleFileChange}
                className="border rounded p-2 w-full"
                accept=".pdf,image/*"
                required
              />
              {previews.insurance_document && (
                <img src={previews.insurance_document} alt="Insurance Preview" className="mt-2 h-32 object-contain" />
              )}
            </div>

            <div>
              <label className="block mb-2">PUC Certificate</label>
              <input
                type="file"
                name="puc_certificate"
                onChange={handleFileChange}
                className="border rounded p-2 w-full"
                accept=".pdf,image/*"
                required
              />
              {previews.puc_certificate && (
                <img src={previews.puc_certificate} alt="PUC Preview" className="mt-2 h-32 object-contain" />
              )}
            </div>

            <div>
              <label className="block mb-2">Ownership Transfer</label>
              <input
                type="file"
                name="ownership_transfer"
                onChange={handleFileChange}
                className="border rounded p-2 w-full"
                accept=".pdf,image/*"
                required
              />
              {previews.ownership_transfer && (
                <img src={previews.ownership_transfer} alt="Transfer Preview" className="mt-2 h-32 object-contain" />
              )}
            </div>
          </div>
        </div>

        {/* Vehicle Photos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Vehicle Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ['photo_front', 'Front View'],
              ['photo_back', 'Back View'],
              ['photo_left', 'Left Side'],
              ['photo_right', 'Right Side'],
              ['photo_dashboard', 'Dashboard'],
              ['photo_odometer', 'Odometer'],
              ['photo_engine', 'Engine'],
              ['photo_extras', 'Additional Photos']
            ].map(([name, label]) => (
              <div key={name}>
                <label className="block mb-2">{label}</label>
                <input
                  type="file"
                  name={name}
                  onChange={handleFileChange}
                  className="border rounded p-2 w-full"
                  accept="image/*"
                  required={name !== 'photo_extras'}
                />
                {previews[name] && (
                  <img src={previews[name]} alt={label} className="mt-2 h-32 object-contain" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pickup Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Pickup Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {/* Input for pickup slot - minimum date set to now */}
              <input
                type="datetime-local"
                name="pickup_slot"
                value={formData.pickup_slot}
                onChange={handleInputChange}
                className={`border rounded p-2 w-full ${formErrors.pickup_slot ? 'border-red-500' : ''}`}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
              {formErrors.pickup_slot && (
                <p className="text-red-500 text-sm mt-1">{formErrors.pickup_slot}</p>
              )}
            </div>

            <input
              type="tel"
              name="contact_number"
              placeholder="Contact Number (e.g., +919999999999)"
              value={formData.contact_number}
              onChange={handleInputChange}
              className="border rounded p-2"
              required
              pattern="^\+?[1-9]\d{9,14}$"
            />

            <textarea
              name="pickup_address"
              placeholder="Pickup Address"
              value={formData.pickup_address}
              onChange={handleInputChange}
              className="border rounded p-2 md:col-span-2"
              rows={3}
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 rounded-md text-white font-semibold ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Sell Request'}
          </button>
        </div>
      </form>
    </div>
  );
} 