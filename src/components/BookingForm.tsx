import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Shield, MapPin } from 'lucide-react';
import { services, ServiceData } from '../data/services';
import LocationPicker from './LocationPicker';

const BookingForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const serviceId = searchParams.get('service');
  const manufacturerId = searchParams.get('manufacturer');

  // Redirect if no service or manufacturer ID
  useEffect(() => {
    if (!serviceId || !manufacturerId) {
      navigate('/services');
    }
  }, [serviceId, manufacturerId, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    comments: '',
    location: {
      lat: 0,
      lng: 0
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Here you would typically make an API call
      console.log('Form submitted:', { ...formData, serviceId, manufacturerId });
      // Navigate to success page or show success message
      navigate('/booking-success');
    } catch (error) {
      console.error('Booking failed:', error);
      // Handle error (show error message to user)
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    setFormData(prev => ({ ...prev, location }));
  };

  // Add proper type definitions for the states
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  
  // Define package type
  type ServicePackage = {
    id: number;
    name: string;
    duration: string;
    warranty: string;
    price: number;
  };
  
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  
  useEffect(() => {
    if (serviceId) {
      const service = services.find((s: ServiceData) => s.id === serviceId);
      setSelectedService(service || null);
      if (service?.packages?.length === 1) {
        setSelectedPackage(service.packages[0]);
      }
    }
  }, [serviceId]);

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Service Summary Card */}
        {selectedService && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900">{selectedService.title}</h3>
            <p className="text-gray-600 mt-2">{selectedService.description}</p>
            {selectedPackage && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{selectedPackage.name}</span>
                  <span className="text-[#FF5733] font-bold">₹{selectedPackage.price}</span>
                </div>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {selectedPackage.duration}
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    {selectedPackage.warranty}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full mr-4"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Book Your Service</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  required
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                  value={formData.time}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Select Service Location
                </div>
              </label>
              <LocationPicker onLocationSelect={handleLocationSelect} />
            </div>

            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700">Additional Comments</label>
              <textarea
                id="comments"
                name="comments"
                rows={4}
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                value={formData.comments}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#FF5733] text-white py-3 px-6 rounded-xl hover:bg-[#ff4019] transition-colors"
            >
              Book Now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;