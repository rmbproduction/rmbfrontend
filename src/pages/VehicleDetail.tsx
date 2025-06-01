import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Heart, Share2, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import BookVehicleModal from '../components/BookVehicleModal';
import VehicleImageSlider from '../components/VehicleImageSlider';
import VehicleCard from '../components/VehicleCard';
import { Vehicle } from '../types/vehicle';
import { useCreateBooking, BookingResponse } from '../services/bookingService';
import { useAuth } from '../contexts/AuthContext';
import '../styles/swiper-custom.css';

interface BookingFormData {
  contactNumber: string;
  notes: string;
}

const isVehicleBookable = (vehicle: Vehicle | null) => {
  if (!vehicle) return false;
  
  // Check both bookable flags
  if (!vehicle.bookable || !vehicle.is_bookable) return false;
  
  // Check vehicle status
  const nonBookableStatuses = ['under_inspection', 'sold', 'unavailable', 'maintenance'];
  return !nonBookableStatuses.includes(vehicle.status);
};

const VehicleDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [similarVehicles, setSimilarVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    contactNumber: '',
    notes: ''
  });
  const { user } = useAuth();
  const createBooking = useCreateBooking();
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchVehicleDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://repairmybike.up.railway.app/api/marketplace/vehicles/${id}/`);
        if (!response.ok) {
          throw new Error('Vehicle not found');
        }
        const data = await response.json();
        setVehicle(data);

        // Fetch similar vehicles
        try {
          const similarResponse = await fetch(`https://repairmybike.up.railway.app/api/marketplace/vehicles/?brand=${data.brand}&exclude=${id}`);
          if (similarResponse.ok) {
            const similarData = await similarResponse.json();
            // Check if the response has the expected structure
            if (similarData && Array.isArray(similarData)) {
              // If response is an array, use it directly
              setSimilarVehicles(similarData.slice(0, 4));
            } else if (similarData && similarData.results && Array.isArray(similarData.results)) {
              // If response has a results array, use that
              setSimilarVehicles(similarData.results.slice(0, 4));
            } else {
              console.warn('Unexpected similar vehicles response structure:', similarData);
              setSimilarVehicles([]);
            }
          }
        } catch (similarError) {
          console.error('Error fetching similar vehicles:', similarError);
          setSimilarVehicles([]);
        }
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        setError(error instanceof Error ? error.message : 'Failed to load vehicle');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicleDetail();
    }
  }, [id]);

  const getGalleryImages = (vehicle: Vehicle) => {
    const images = [];
    if (vehicle.front_image_url) images.push(vehicle.front_image_url);
    if (vehicle.back_image_url) images.push(vehicle.back_image_url);
    if (vehicle.left_image_url) images.push(vehicle.left_image_url);
    if (vehicle.right_image_url) images.push(vehicle.right_image_url);
    if (vehicle.dashboard_image_url) images.push(vehicle.dashboard_image_url);
    return images;
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const nextImage = () => {
    if (!vehicle) return;
    const images = getGalleryImages(vehicle);
    setActiveImageIndex((prev) => 
      (prev + 1) % images.length
    );
  };

  const prevImage = () => {
    if (!vehicle) return;
    const images = getGalleryImages(vehicle);
    setActiveImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleFavoriteToggle = async () => {
    try {
      setFavoriteLoading(true);
      setIsFavorite(!isFavorite);
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
      setIsFavorite(isFavorite);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setShareLoading(true);
      if (navigator.share) {
        await navigator.share({
          title: `${vehicle?.brand} ${vehicle?.model}`,
          text: vehicle?.short_description,
          url: window.location.href
        });
        toast.success('Shared successfully');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    } finally {
      setShareLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicle) {
      toast.error('Vehicle not found');
      return;
    }

    try {
      // Clean and format the contact number
      const cleanedNumber = formData.contactNumber.replace(/[\s\-\(\)]/g, '');
      
      // Create the booking request with only contact_number
      const response = await createBooking.mutateAsync({
        vehicle_id: vehicle.id,
        contact_number: cleanedNumber
      });

      setSuccessMessage(response.detail);
      setBookingSuccess(true);
    } catch (error: any) {
      console.error('Booking submission error:', error);
      toast.error(error?.response?.data?.detail || 'Failed to submit booking');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
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
            onClick={() => navigate('/vehicles')}
            className="bg-[#FF5733] text-white px-4 py-2 rounded-lg hover:bg-[#ff4019] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const galleryImages = getGalleryImages(vehicle);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/vehicles')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back to Vehicles</span>
        </button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-8">
            {/* Image Slider */}
            <VehicleImageSlider 
              images={galleryImages}
              title={`${vehicle.brand} ${vehicle.model}`}
            />

            {/* Vehicle Details Section */}
            <div className="mt-8 bg-white rounded-lg shadow-sm">
              {/* Features Section */}
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Features</h3>
                <div className="grid grid-cols-2 gap-4">
                  {vehicle.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-gray-50 rounded-lg p-3 text-gray-700"
                    >
                      <div className="h-2 w-2 rounded-full bg-[#FF5733] mr-3"></div>
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specifications */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Registration</h4>
                    <p className="text-base font-semibold text-gray-900">{vehicle.registration_number}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Color</h4>
                    <p className="text-base font-semibold text-gray-900">{vehicle.color}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Engine</h4>
                    <p className="text-base font-semibold text-gray-900">{vehicle.engine_capacity}cc</p>
                  </div>
                  {vehicle.last_service_date && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Last Service</h4>
                      <p className="text-base font-semibold text-gray-900">
                        {new Date(vehicle.last_service_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {vehicle.insurance_valid_till && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Insurance Valid Till</h4>
                      <p className="text-base font-semibold text-gray-900">
                        {new Date(vehicle.insurance_valid_till).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Price, Actions, and Similar Vehicles */}
          <div className="lg:col-span-4 space-y-8">
            {/* Price and Actions Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {/* Vehicle Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {vehicle.brand} {vehicle.model}
              </h1>
              
              {/* Basic Info */}
              <div className="flex items-center text-gray-500 text-sm mb-4">
                <span>{vehicle.year}</span>
                <span className="mx-2">•</span>
                <span>{vehicle.kms_driven.toLocaleString()} km</span>
                <span className="mx-2">•</span>
                <span>{vehicle.fuel_type}</span>
              </div>

              {/* Price */}
              <div className="text-[#FF5733] text-2xl font-bold mb-6">
                {vehicle.display_price.formatted}
                {vehicle.display_price.emi_available && 
                 vehicle.display_price.emi_starting_at && 
                 vehicle.display_price.emi_starting_at !== '₹0/month' && (
                  <div className="text-sm text-gray-500 font-normal">
                    EMI starting at {vehicle.display_price.emi_starting_at}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {isVehicleBookable(vehicle) ? (
                  <button 
                    onClick={() => setShowBookingModal(true)}
                    className="w-full bg-[#FF5733] text-white py-3 rounded-lg hover:bg-[#ff4019] transition-colors"
                  >
                    Book Test Ride
                  </button>
                ) : (
                  <div className="text-center py-2 text-gray-600 bg-gray-100 rounded-lg">
                    {vehicle?.status === 'under_inspection' ? 'Vehicle is under inspection' :
                     vehicle?.status === 'sold' ? 'Vehicle has been sold' :
                     vehicle?.status === 'maintenance' ? 'Vehicle is under maintenance' :
                     'Vehicle is not available for booking'}
                  </div>
                )}
                <button 
                  onClick={() => window.location.href = "tel:+911234567890"}
                  className="w-full border border-[#FF5733] text-[#FF5733] py-3 rounded-lg hover:bg-[#fff8f6] transition-colors"
                >
                  Contact Us
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    className={`flex items-center justify-center py-3 rounded-lg border ${
                      isFavorite 
                        ? 'border-[#FF5733] text-[#FF5733] bg-[#fff8f6]'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart
                      className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`}
                    />
                    <span className="ml-2">
                      {favoriteLoading ? 'Loading...' : 'Favorite'}
                    </span>
                  </button>
                  <button 
                    onClick={handleShare}
                    disabled={shareLoading}
                    className={`flex items-center justify-center py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 ${
                      shareLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Share2 className="h-5 w-5" />
                    <span className="ml-2">
                      {shareLoading ? 'Loading...' : 'Share'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Similar Vehicles Section */}
            {similarVehicles.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">You Might Also Like</h2>
                <div className="space-y-2">
                  {similarVehicles.map((similarVehicle) => (
                    <VehicleCard
                      key={similarVehicle.id}
                      vehicle={similarVehicle}
                      variant="compact"
                    />
                  ))}
                </div>
                <Link 
                  to="/vehicles" 
                  className="inline-block mt-6 text-[#FF5733] hover:text-[#ff4019] font-medium"
                >
                  View all vehicles →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookVehicleModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setBookingSuccess(false);
          setSuccessMessage('');
          setFormData({ contactNumber: '', notes: '' });
        }}
        onSubmit={handleBookingSubmit}
        contactNumber={formData.contactNumber}
        notes={formData.notes}
        onInputChange={handleInputChange}
        isLoading={createBooking.isPending}
        bookingSuccess={bookingSuccess}
        successMessage={successMessage}
      />
    </div>
  );
};

export default VehicleDetail; 