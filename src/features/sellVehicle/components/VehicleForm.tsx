import React from 'react';
import { motion } from 'framer-motion';
import LocationInput from '../../../components/LocationInput';
import { VehicleFormData, FormErrors, vehicleTypes, popularBrands, colorOptions, vehicleConditions, fuelTypes } from '../types';

interface VehicleFormProps {
  formData: VehicleFormData;
  formErrors: FormErrors;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addFeature: (feature: string) => void;
  removeFeature: (feature: string) => void;
  addHighlight: (highlight: string) => void;
  removeHighlight: (highlight: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<VehicleFormData>>;
  onNextStep: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  formData,
  formErrors,
  handleInputChange,
  handleCheckboxChange,
  addFeature,
  removeFeature,
  addHighlight,
  removeHighlight,
  setFormData,
  onNextStep
}) => {
  // Track new feature and highlight
  const [newFeature, setNewFeature] = React.useState('');
  const [newHighlight, setNewHighlight] = React.useState('');

  // Handle feature submission
  const handleFeatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFeature.trim()) {
      addFeature(newFeature.trim());
      setNewFeature('');
    }
  };

  // Handle highlight submission
  const handleHighlightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHighlight.trim()) {
      addHighlight(newHighlight.trim());
      setNewHighlight('');
    }
  };

  return (
    <div className="p-8">
      <div className="space-y-8">
        {/* Vehicle Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type <span className="text-red-500">*</span></label>
            <select
              id="type"
              name="type"
              required
              className={`block w-full rounded-lg border ${formErrors.type ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
              value={formData.type}
              onChange={handleInputChange}
            >
              <option value="">Select Type</option>
              {vehicleTypes.map(type => (
                <option key={type} value={type.toLowerCase().replace(' ', '_')}>{type}</option>
              ))}
            </select>
            {formErrors.type && <p className="mt-1 text-sm text-red-500">{formErrors.type}</p>}
          </div>

          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand <span className="text-red-500">*</span></label>
            <select
              id="brand"
              name="brand"
              required
              className={`block w-full rounded-lg border ${formErrors.brand ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
              value={formData.brand}
              onChange={handleInputChange}
            >
              <option value="">Select Brand</option>
              {popularBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            {formErrors.brand && <p className="mt-1 text-sm text-red-500">{formErrors.brand}</p>}
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="model"
              name="model"
              required
              className={`block w-full rounded-lg border ${formErrors.model ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
              value={formData.model}
              onChange={handleInputChange}
              placeholder="e.g. Splendor Plus"
            />
            {formErrors.model && <p className="mt-1 text-sm text-red-500">{formErrors.model}</p>}
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year <span className="text-red-500">*</span></label>
            <input
              type="number"
              id="year"
              name="year"
              required
              min="1900"
              max={new Date().getFullYear()}
              className={`block w-full rounded-lg border ${formErrors.year ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
              value={formData.year}
              onChange={handleInputChange}
              placeholder={`e.g. ${new Date().getFullYear() - 2}`}
            />
            {formErrors.year && <p className="mt-1 text-sm text-red-500">{formErrors.year}</p>}
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <select
              id="color"
              name="color"
              className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3"
              value={formData.color}
              onChange={handleInputChange}
            >
              <option value="">Select Color</option>
              {colorOptions.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">Registration Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="registrationNumber"
              name="registrationNumber"
              required
              className={`block w-full rounded-lg border ${formErrors.registrationNumber ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
              value={formData.registrationNumber}
              onChange={handleInputChange}
              placeholder="e.g. DL5SAB1234"
            />
            {formErrors.registrationNumber && <p className="mt-1 text-sm text-red-500">{formErrors.registrationNumber}</p>}
          </div>

          <div>
            <label htmlFor="kmsDriven" className="block text-sm font-medium text-gray-700 mb-1">Kilometers Driven <span className="text-red-500">*</span></label>
            <input
              type="number"
              id="kmsDriven"
              name="kmsDriven"
              required
              min="0"
              className={`block w-full rounded-lg border ${formErrors.kmsDriven ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
              value={formData.kmsDriven}
              onChange={handleInputChange}
              placeholder="e.g. 5000"
            />
            {formErrors.kmsDriven && <p className="mt-1 text-sm text-red-500">{formErrors.kmsDriven}</p>}
          </div>

          <div>
            <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">Mileage <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="mileage"
              name="mileage"
              required
              className={`block w-full rounded-lg border ${formErrors.mileage ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
              value={formData.mileage}
              onChange={handleInputChange}
              placeholder="e.g. 40 km/l"
            />
            {formErrors.mileage && <p className="mt-1 text-sm text-red-500">{formErrors.mileage}</p>}
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Vehicle Condition <span className="text-red-500">*</span></label>
            <select
              id="condition"
              name="condition"
              required
              className={`block w-full rounded-lg border ${formErrors.condition ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
              value={formData.condition}
              onChange={handleInputChange}
            >
              <option value="">Select Condition</option>
              {vehicleConditions.map(condition => (
                <option key={condition} value={condition.toLowerCase()}>{condition}</option>
              ))}
            </select>
            {formErrors.condition && <p className="mt-1 text-sm text-red-500">{formErrors.condition}</p>}
          </div>

          <div>
            <label htmlFor="expectedPrice" className="block text-sm font-medium text-gray-700 mb-1">Expected Price (₹) <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">₹</span>
              </div>
              <input
                type="number"
                id="expectedPrice"
                name="expectedPrice"
                required
                min="1"
                className={`block w-full pl-8 rounded-lg border ${formErrors.expectedPrice ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                value={formData.expectedPrice}
                onChange={handleInputChange}
                placeholder="e.g. 50000"
              />
            </div>
            {formErrors.expectedPrice && <p className="mt-1 text-sm text-red-500">{formErrors.expectedPrice}</p>}
          </div>

          <div>
            <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-1">Fuel Type <span className="text-red-500">*</span></label>
            <select
              id="fuelType"
              name="fuelType"
              required
              className={`block w-full rounded-lg border ${formErrors.fuelType ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
              value={formData.fuelType}
              onChange={handleInputChange}
            >
              <option value="">Select Fuel Type</option>
              {fuelTypes.map(type => (
                <option key={type} value={type.toLowerCase()}>{type}</option>
              ))}
            </select>
            {formErrors.fuelType && <p className="mt-1 text-sm text-red-500">{formErrors.fuelType}</p>}
          </div>

          <div>
            <label htmlFor="engineCapacity" className="block text-sm font-medium text-gray-700 mb-1">
              {formData.fuelType === 'electric' ? 'Motor Power (Watts)' : 'Engine Capacity (CC)'} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="engineCapacity"
              name="engineCapacity"
              required
              min="1"
              className={`block w-full rounded-lg border ${formErrors.engineCapacity ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
              value={formData.engineCapacity}
              onChange={handleInputChange}
              placeholder={formData.fuelType === 'electric' ? 'e.g. 1500' : 'e.g. 150'}
            />
            {formErrors.engineCapacity && <p className="mt-1 text-sm text-red-500">{formErrors.engineCapacity}</p>}
          </div>

          <div>
            <label htmlFor="lastServiceDate" className="block text-sm font-medium text-gray-700 mb-1">Last Service Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              id="lastServiceDate"
              name="lastServiceDate"
              required
              max={new Date().toISOString().split('T')[0]}
              className={`block w-full rounded-lg border ${formErrors.lastServiceDate ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
              value={formData.lastServiceDate}
              onChange={handleInputChange}
            />
            {formErrors.lastServiceDate && <p className="mt-1 text-sm text-red-500">{formErrors.lastServiceDate}</p>}
          </div>

          <div>
            <label htmlFor="insuranceValidTill" className="block text-sm font-medium text-gray-700 mb-1">Insurance Valid Till <span className="text-red-500">*</span></label>
            <input
              type="date"
              id="insuranceValidTill"
              name="insuranceValidTill"
              required
              min={new Date().toISOString().split('T')[0]}
              className={`block w-full rounded-lg border ${formErrors.insuranceValidTill ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
              value={formData.insuranceValidTill}
              onChange={handleInputChange}
            />
            {formErrors.insuranceValidTill && <p className="mt-1 text-sm text-red-500">{formErrors.insuranceValidTill}</p>}
          </div>

          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                required
                className={`block w-full rounded-lg border ${formErrors.contactNumber ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733] py-3`}
                value={formData.contactNumber}
                onChange={handleInputChange}
                placeholder="e.g. +919876543210"
              />
            </div>
            {formErrors.contactNumber && <p className="mt-1 text-sm text-red-500">{formErrors.contactNumber}</p>}
            <p className="mt-1 text-xs text-gray-500">Enter number with country code (e.g. +91 for India)</p>
          </div>

          {/* Pickup Address */}
          <div className="mb-4">
            <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Address <span className="text-red-500">*</span>
            </label>
            <LocationInput
              value={formData.pickupAddress}
              onChange={(value) => setFormData(prev => ({ ...prev, pickupAddress: value }))}
              placeholder="Enter your pickup address"
              required
            />
            {formErrors.pickupAddress && (
              <p className="mt-1 text-sm text-red-600">{formErrors.pickupAddress}</p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPriceNegotiable"
                  checked={formData.isPriceNegotiable}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-[#FF5733] focus:ring-[#FF5733] mr-2"
                />
                Price is negotiable
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasPucCertificate"
                  checked={formData.hasPucCertificate}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-[#FF5733] focus:ring-[#FF5733] mr-2"
                />
                I have PUC certificate
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="emiAvailable"
                  checked={formData.emiAvailable}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-[#FF5733] focus:ring-[#FF5733] mr-2"
                />
                EMI option available
              </label>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Vehicle Features</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.features.map((feature, index) => (
              <div key={index} className="bg-gray-100 pl-3 pr-2 py-1 rounded-full flex items-center">
                <span>{feature}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(feature)}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleFeatureSubmit} className="flex gap-2">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add a feature (e.g. Disc Brakes)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            />
            <button
              type="submit"
              className="bg-[#FF5733] text-white px-4 py-2 rounded-lg"
            >
              Add
            </button>
          </form>
        </div>

        {/* Highlights Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Highlights</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.highlights.map((highlight, index) => (
              <div key={index} className="bg-gray-100 pl-3 pr-2 py-1 rounded-full flex items-center">
                <span>{highlight}</span>
                <button
                  type="button"
                  onClick={() => removeHighlight(highlight)}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleHighlightSubmit} className="flex gap-2">
            <input
              type="text"
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              placeholder="Add a highlight (e.g. New Tires)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            />
            <button
              type="submit"
              className="bg-[#FF5733] text-white px-4 py-2 rounded-lg"
            >
              Add
            </button>
          </form>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Additional details about your vehicle... For example: any modifications, special features, or maintenance history."
          />
        </div>
      </div>
      
      <div className="mt-8">
        <button
          type="button"
          onClick={onNextStep}
          className="w-full bg-[#FF5733] text-white py-3 px-6 rounded-xl hover:bg-[#ff4019] transition-colors font-semibold text-lg flex items-center justify-center"
        >
          Continue to Upload Photos
        </button>
      </div>
    </div>
  );
};

export default VehicleForm; 