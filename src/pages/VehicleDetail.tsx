import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Share2, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import BookVehicleModal from '../components/BookVehicleModal';

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  status: 'available' | 'sold' | 'under_inspection' | 'pending';
  kms_driven: number;
  fuel_type: string;
  color: string;
  condition: string;
  seller_notes: string;
  vehicle_type: 'bike' | 'scooter' | 'electric_bike';
  engine_capacity: number;
  mileage: string;
  location: string;
  emi_available?: boolean;
  images: {
    main: string;
    gallery: string[];
  };
}

interface SimilarVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  kms_driven: number;
  price: number;
  image: string;
}

const VehicleDetail = () => {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    contactNumber: '',
    notes: ''
  });

  // Mock data - replace with API call
  const mockVehicle: Vehicle = {
    id: '1',
    name: 'Royal Enfield Bullet',
    brand: 'Royal Enfield',
    model: 'Bullet',
    year: 2021,
    price: 34000,
    status: 'available',
    kms_driven: 34000,
    fuel_type: 'petrol',
    color: 'Black',
    condition: 'Used',
    seller_notes: 'Well maintained bike with all service records',
    vehicle_type: 'bike',
    engine_capacity: 350,
    mileage: '35 kmpl',
    location: 'Mumbai',
    emi_available: true,
    images: {
      main: '/images/vehicles/bullet-1.jpg',
      gallery: [
        '/images/vehicles/bullet-1.jpg',
        '/images/vehicles/bullet-2.jpg',
        '/images/vehicles/bullet-3.jpg',
        '/images/vehicles/bullet-4.jpg',
      ]
    }
  };

  const similarVehicles: SimilarVehicle[] = [
    {
      id: '2',
      brand: 'Yamaha',
      model: 'yamaha',
      year: 2001,
      kms_driven: 56000,
      price: 45000,
      image: '/images/vehicles/yamaha.jpg'
    },
    {
      id: '3',
      brand: 'Hero',
      model: 'Splender',
      year: 2013,
      kms_driven: 54000,
      price: 78000,
      image: '/images/vehicles/splender.jpg'
    },
    {
      id: '4',
      brand: 'Honda',
      model: 'splender',
      year: 2012,
      kms_driven: 45000,
      price: 49999,
      image: '/images/vehicles/splender.jpg'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setVehicle(mockVehicle);
      setLoading(false);
    }, 1000);
  }, []);

  const closeModal = () => {
    setShowModal(false);
  };

  const nextImage = () => {
    if (!vehicle?.images.gallery.length) return;
    setActiveImageIndex((prev) => 
      (prev + 1) % vehicle.images.gallery.length
    );
  };

  const prevImage = () => {
    if (!vehicle?.images.gallery.length) return;
    setActiveImageIndex((prev) => 
      prev === 0 ? vehicle.images.gallery.length - 1 : prev - 1
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
          text: `Check out this ${vehicle?.brand} ${vehicle?.model} on RepairMyBike!`,
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

  const getBrandInitials = (brand: string) => {
    return brand.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRegex = /^(\+91|0)?[6789]\d{9}$/;
    if (!phoneRegex.test(bookingData.contactNumber)) {
      toast.error('Please enter a valid Indian phone number');
      return;
    }

    try {
      console.log('Booking submitted:', bookingData);
      toast.success('Booking submitted successfully!');
      setShowBookingModal(false);
      setBookingData({ contactNumber: '', notes: '' });
    } catch (error) {
      toast.error('Failed to submit booking. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-8">
            {/* Main Image */}
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
              <img
                src={vehicle.images.gallery[activeImageIndex]}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Gallery */}
            <div className="mt-4 grid grid-cols-5 gap-4">
              {vehicle.images.gallery.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden ${
                    selectedImage === index ? 'ring-2 ring-[#FF5733]' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${vehicle.brand} ${vehicle.model} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Vehicle Info */}
          <div className="lg:col-span-4">
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
              </div>

              {/* Price */}
              <div className="text-[#FF5733] text-2xl font-bold mb-6">
                ₹{vehicle.price.toLocaleString()}.00
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  onClick={() => setShowBookingModal(true)}
                  className="w-full bg-[#FF5733] text-white py-3 rounded-lg hover:bg-[#ff4019] transition-colors"
                >
                  Book Bike
                </button>
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

            {/* Similar Vehicles */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                You Might Also Like
              </h2>
              <div className="space-y-4">
                {similarVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center space-x-4 bg-white p-4 rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                  >
                    <div className="w-12 h-12 bg-[#FF5733] text-white rounded-lg flex items-center justify-center font-bold">
                      {getBrandInitials(vehicle.brand)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {vehicle.year} • {vehicle.kms_driven.toLocaleString()} km
                      </div>
                      <div className="text-[#FF5733] font-medium">
                        ₹{vehicle.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => navigate('/vehicles')}
                  className="text-[#FF5733] hover:text-[#ff4019] font-medium"
                >
                  View all vehicles →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen Image Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={closeModal}
        >
          <button 
            className="absolute top-4 right-4 text-white p-2"
            onClick={closeModal}
          >
            <X className="h-6 w-6" />
          </button>
          
          <img
            src={vehicle.images.gallery[activeImageIndex]}
            alt={vehicle.name}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {vehicle.images.gallery.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-2"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-2"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Booking Modal */}
      <BookVehicleModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSubmit={handleBookingSubmit}
        contactNumber={bookingData.contactNumber}
        notes={bookingData.notes}
        onInputChange={handleInputChange}
      />
    </div>
  );
};

export default VehicleDetail; 