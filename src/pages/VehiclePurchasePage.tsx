import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle, Bike, Calendar, 
  CreditCard, Truck, MapPin, Phone, User, ChevronRight, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import { API_CONFIG } from '../config/api.config';
import marketplaceService from '../services/marketplaceService';
import { Vehicle } from '../types/vehicles';

// Step interface for the purchase flow
interface PurchaseStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

// Purchase form data interface
interface PurchaseFormData {
  delivery_address: string;
  contact_number: string;
  full_name: string;
  payment_method: 'cash' | 'online' | 'emi';
  emi_months?: number;
  delivery_date: string;
  special_instructions?: string;
}

const VehiclePurchasePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [purchaseSteps, setPurchaseSteps] = useState<PurchaseStep[]>([
    {
      id: 1,
      title: 'Vehicle Information',
      description: 'Confirm vehicle details',
      completed: false,
      current: true
    },
    {
      id: 2,
      title: 'Delivery Information',
      description: 'Address and contact details',
      completed: false,
      current: false
    },
    {
      id: 3,
      title: 'Payment Method',
      description: 'Choose how to pay',
      completed: false,
      current: false
    },
    {
      id: 4,
      title: 'Review & Confirm',
      description: 'Finalize your purchase',
      completed: false,
      current: false
    }
  ]);
  
  // Form data state
  const [formData, setFormData] = useState<PurchaseFormData>({
    delivery_address: '',
    contact_number: '',
    full_name: '',
    payment_method: 'cash',
    delivery_date: getTomorrowDate(),
    special_instructions: ''
  });
  
  // Get tomorrow's date for default delivery date
  function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }
  
  useEffect(() => {
    if (id) {
      fetchVehicleDetails(id);
    } else {
      setError('Invalid vehicle ID');
      setLoading(false);
    }
    
    // Try to prefill user data if available
    const phone = localStorage.getItem('userPhone');
    const name = localStorage.getItem('userName');
    const address = localStorage.getItem('userAddress');
    
    if (phone || name || address) {
      setFormData(prev => ({
        ...prev,
        contact_number: phone || prev.contact_number,
        full_name: name || prev.full_name,
        delivery_address: address || prev.delivery_address
      }));
    }
  }, [id]);
  
  const fetchVehicleDetails = async (vehicleId: string) => {
    setVehicleLoading(true);
    
    try {
      const vehicleData = await marketplaceService.getVehicleDetails(vehicleId);
      
      // Verify that the vehicle is available for purchase
      if (vehicleData.status !== 'available') {
        setError('This vehicle is no longer available for purchase.');
        setVehicleLoading(false);
        setLoading(false);
        return;
      }
      
      setVehicle(vehicleData);
      setVehicleLoading(false);
    } catch (error) {
      console.error('Failed to fetch vehicle details:', error);
      setError('Failed to fetch vehicle details. Please try again later.');
      setVehicleLoading(false);
    }
    
    setLoading(false);
  };
  
  const goToNextStep = () => {
    if (currentStep < purchaseSteps.length) {
      // Mark current step as completed
      const updatedSteps = purchaseSteps.map(step => {
        if (step.id === currentStep) {
          return { ...step, completed: true, current: false };
        } else if (step.id === currentStep + 1) {
          return { ...step, current: true };
        }
        return step;
      });
      
      setPurchaseSteps(updatedSteps);
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      // Mark next step as not current
      const updatedSteps = purchaseSteps.map(step => {
        if (step.id === currentStep) {
          return { ...step, current: false };
        } else if (step.id === currentStep - 1) {
          return { ...step, completed: false, current: true };
        }
        return step;
      });
      
      setPurchaseSteps(updatedSteps);
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      if (!vehicle || !id) {
        throw new Error('Vehicle information is missing');
      }
      
      // Format phone number if needed
      let formattedPhone = formData.contact_number;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
      }
      
      // Prepare the purchase data
      const purchaseData = {
        ...formData,
        contact_number: formattedPhone,
        vehicle: id
      };
      
      // Initiate purchase through API
      const response = await marketplaceService.initiateVehiclePurchase(id, purchaseData);
      
      // Store purchase ID in session storage
      sessionStorage.setItem('lastPurchaseId', response.id);
      
      // Navigate to success page
      toast.success('Purchase initiated successfully!');
      navigate('/purchase-success');
    } catch (error) {
      console.error('Failed to submit purchase:', error);
      toast.error('Failed to complete purchase. Please try again.');
    }
    
    setLoading(false);
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  if (loading || vehicleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }
  
  if (error || !vehicle) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Vehicle not found'}</p>
          <button
            onClick={handleBack}
            className="bg-[#FF5733] text-white px-4 py-2 rounded-lg hover:bg-[#ff4019] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="mb-6 flex items-center text-gray-600 hover:text-[#FF5733] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Vehicle Details
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase {`${vehicle.brand} ${vehicle.model}`}</h1>
            <p className="text-gray-500">Complete the following steps to purchase this vehicle.</p>
          </div>
          
          {/* Progress Steps */}
          <div className="flex justify-between mb-8 px-2">
            {purchaseSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center relative">
                {/* Connector Line */}
                {index < purchaseSteps.length - 1 && (
                  <div 
                    className={`absolute top-4 left-1/2 w-full h-0.5 ${
                      step.completed ? 'bg-[#FF5733]' : 'bg-gray-300'
                    }`}
                    style={{ transform: 'translateY(-50%)' }}
                  ></div>
                )}
                
                {/* Step Circle */}
                <div 
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step.completed ? 'bg-[#FF5733] text-white' : 
                    step.current ? 'border-2 border-[#FF5733] text-[#FF5733]' : 
                    'bg-gray-200 text-gray-600'
                  } z-10`}
                >
                  {step.completed ? <CheckCircle size={16} /> : step.id}
                </div>
                
                {/* Step Title */}
                <p className={`text-xs font-medium mt-2 ${
                  step.current ? 'text-[#FF5733]' : 'text-gray-600'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>
          
          {/* Main Content Based on Current Step */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Step Form */}
            <div className="lg:col-span-2 space-y-6">
              {currentStep === 1 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Information</h2>
                  <p className="text-gray-600 mb-6">
                    Please review the vehicle details before proceeding with your purchase.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Brand</p>
                      <p className="font-medium">{vehicle.brand}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Model</p>
                      <p className="font-medium">{vehicle.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Year</p>
                      <p className="font-medium">{vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Color</p>
                      <p className="font-medium capitalize">{vehicle.color || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Registration Number</p>
                      <p className="font-medium">{vehicle.registration_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Kilometers Driven</p>
                      <p className="font-medium">{vehicle.kms_driven.toLocaleString()} km</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={goToNextStep}
                      className="px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019] transition-colors"
                    >
                      Confirm & Continue
                    </button>
                  </div>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Information</h2>
                  <p className="text-gray-600 mb-6">
                    Please provide the details for vehicle delivery.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        id="contact_number"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="delivery_address" className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Address
                      </label>
                      <textarea
                        id="delivery_address"
                        name="delivery_address"
                        value={formData.delivery_address}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Delivery Date
                      </label>
                      <input
                        type="date"
                        id="delivery_date"
                        name="delivery_date"
                        value={formData.delivery_date}
                        onChange={handleInputChange}
                        min={getTomorrowDate()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700 mb-1">
                        Special Instructions (Optional)
                      </label>
                      <textarea
                        id="special_instructions"
                        name="special_instructions"
                        value={formData.special_instructions}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={goToPreviousStep}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={goToNextStep}
                      className="px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019] transition-colors"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}
              
              {currentStep === 3 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                  <p className="text-gray-600 mb-6">
                    Choose how you would like to pay for your vehicle.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <label className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="payment_method"
                          value="cash"
                          checked={formData.payment_method === 'cash'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-[#FF5733] focus:ring-[#FF5733]"
                        />
                        <div className="ml-3">
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-gray-500">Pay when the vehicle is delivered to you</p>
                        </div>
                      </label>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <label className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="payment_method"
                          value="online"
                          checked={formData.payment_method === 'online'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-[#FF5733] focus:ring-[#FF5733]"
                        />
                        <div className="ml-3">
                          <p className="font-medium">Online Payment</p>
                          <p className="text-sm text-gray-500">Pay now using credit/debit card or net banking</p>
                        </div>
                      </label>
                    </div>
                    
                    {vehicle.emi_available && (
                      <div className="border rounded-lg overflow-hidden">
                        <label className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="payment_method"
                            value="emi"
                            checked={formData.payment_method === 'emi'}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-[#FF5733] focus:ring-[#FF5733]"
                          />
                          <div className="ml-3">
                            <p className="font-medium">EMI</p>
                            <p className="text-sm text-gray-500">Pay in monthly installments</p>
                          </div>
                        </label>
                        
                        {formData.payment_method === 'emi' && (
                          <div className="p-4 pt-0 pl-11">
                            <label htmlFor="emi_months" className="block text-sm font-medium text-gray-700 mb-1">
                              EMI Duration
                            </label>
                            <select
                              id="emi_months"
                              name="emi_months"
                              value={formData.emi_months || 3}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
                            >
                              <option value={3}>3 months (₹{Math.round(vehicle.price / 3).toLocaleString()}/month)</option>
                              <option value={6}>6 months (₹{Math.round(vehicle.price / 6).toLocaleString()}/month)</option>
                              <option value={12}>12 months (₹{Math.round(vehicle.price / 12).toLocaleString()}/month)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">*Terms and conditions apply</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={goToPreviousStep}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={goToNextStep}
                      className="px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019] transition-colors"
                    >
                      Review Purchase
                    </button>
                  </div>
                </div>
              )}
              
              {currentStep === 4 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Review & Confirm</h2>
                  <p className="text-gray-600 mb-6">
                    Please review your purchase details before confirming.
                  </p>
                  
                  <div className="border-t border-b py-4 mb-4">
                    <h3 className="font-medium mb-3">Vehicle Details</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Vehicle</p>
                        <p className="font-medium">{`${vehicle.brand} ${vehicle.model} (${vehicle.year})`}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Registration</p>
                        <p className="font-medium">{vehicle.registration_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Color</p>
                        <p className="font-medium capitalize">{vehicle.color || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Kilometers</p>
                        <p className="font-medium">{vehicle.kms_driven.toLocaleString()} km</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-b py-4 mb-4">
                    <h3 className="font-medium mb-3">Delivery Details</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{formData.full_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact</p>
                        <p className="font-medium">{formData.contact_number}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Delivery Address</p>
                        <p className="font-medium">{formData.delivery_address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Delivery Date</p>
                        <p className="font-medium">{new Date(formData.delivery_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}</p>
                      </div>
                    </div>
                    
                    {formData.special_instructions && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Special Instructions</p>
                        <p className="font-medium">{formData.special_instructions}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-b py-4 mb-4">
                    <h3 className="font-medium mb-3">Payment Details</h3>
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium">
                        {formData.payment_method === 'cash' && 'Cash on Delivery'}
                        {formData.payment_method === 'online' && 'Online Payment'}
                        {formData.payment_method === 'emi' && `EMI (${formData.emi_months} months)`}
                      </p>
                    </div>
                    
                    {formData.payment_method === 'emi' && formData.emi_months && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Monthly Payment</p>
                        <p className="font-medium">₹{Math.round(vehicle.price / formData.emi_months).toLocaleString()}/month</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="py-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <p className="font-medium">Vehicle Price</p>
                      <p className="font-medium">₹{vehicle.price.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between mb-2 text-sm text-gray-500">
                      <p>Delivery Fee</p>
                      <p>₹0</p>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
                      <p>Total Amount</p>
                      <p className="text-[#FF5733]">₹{vehicle.price.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex items-start">
                      <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm text-gray-600">
                        By completing this purchase, you agree to our terms and conditions.
                        All vehicles come with a 7-day money-back guarantee.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={goToPreviousStep}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 bg-[#FF5733] text-white font-medium rounded-lg hover:bg-[#ff4019] transition-colors"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Confirm Purchase'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <img
                      src={vehicle.photo_front ? API_CONFIG.getMediaUrl(vehicle.photo_front) : API_CONFIG.getDefaultVehicleImage()}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = API_CONFIG.getDefaultVehicleImage();
                      }}
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{`${vehicle.brand} ${vehicle.model}`}</h3>
                    <p className="text-sm text-gray-500">{vehicle.year}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="text-sm font-medium">₹{vehicle.price.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm text-gray-500">Delivery Fee</p>
                    <p className="text-sm font-medium">₹0</p>
                  </div>
                  <div className="flex justify-between pt-4 border-t">
                    <p className="text-base font-medium">Total</p>
                    <p className="text-base font-bold text-[#FF5733]">₹{vehicle.price.toLocaleString()}</p>
                  </div>
                </div>
                
                {/* Key Benefits */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Purchase Benefits</h3>
                  <ul className="space-y-3">
                    <li className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600">7-day money-back guarantee</span>
                    </li>
                    <li className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Free doorstep delivery</span>
                    </li>
                    <li className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Verified vehicle history</span>
                    </li>
                    <li className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600">All paperwork handled for you</span>
                    </li>
                  </ul>
                </div>
                
                {/* Need Help */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-2">Need help?</p>
                  <a href="tel:+919876543210" className="text-sm text-[#FF5733] flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    <span>Call our support team</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VehiclePurchasePage; 