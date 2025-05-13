import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle, XCircle, AlertCircle, Bike, Calendar, 
  MapPin, Tag, Info, Heart, Share2, Phone, Mail, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { API_CONFIG } from '../config/api.config';
import marketplaceService from '../services/marketplaceService';
import { Vehicle } from '../types/vehicles';
import VehicleSuggestions from '../components/VehicleSuggestions';

// Extended vehicle interface with UI-specific properties
interface UIVehicle extends Omit<Vehicle, 'images'> {
  name: string;
  images: {
    main: string;
    gallery: string[];
  };
}

const VehicleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<UIVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showEmiOptions, setShowEmiOptions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  const imagePreloadersRef = useRef<HTMLImageElement[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    contact_number: '',
    notes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVehicleDetails(id);
    } else {
      setError('Invalid vehicle ID');
      setLoading(false);
    }
  }, [id]);

  // Preload images when vehicle data is available
  useEffect(() => {
    if (vehicle?.images?.gallery?.length) {
      // Preload all gallery images in the background
      preloadImages(vehicle.images.gallery);
    }
  }, [vehicle]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showModal) return;
      
      if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, vehicle]);

  // Check if vehicle is in favorites
  useEffect(() => {
    if (id) {
      const favorited = marketplaceService.isVehicleFavorited(id);
      setIsFavorite(favorited);
    }
  }, [id]);

  // This useEffect hook validates and logs image URLs for debugging
  useEffect(() => {
    if (vehicle && vehicle.images) {
      // Log image URLs for debugging
      console.log('[VehicleDetailPage] Vehicle images:', {
        main: vehicle.images.main,
        gallery: vehicle.images.gallery,
        count: vehicle.images.gallery.length
      });
      
      // Add direct DOM inspection for image elements
      setTimeout(() => {
        const mainImage = document.querySelector('.main-vehicle-image img');
        if (mainImage) {
          console.log('[VehicleDetailPage] Main image element src:', (mainImage as HTMLImageElement).src);
        } else {
          console.warn('[VehicleDetailPage] Main image element not found in DOM');
        }
        
        // Check gallery images
        const galleryImages = document.querySelectorAll('.vehicle-gallery img');
        console.log(`[VehicleDetailPage] Found ${galleryImages.length} gallery image elements`);
        
        // Log every gallery image for debugging
        galleryImages.forEach((img, index) => {
          console.log(`[VehicleDetailPage] Gallery image ${index} src:`, (img as HTMLImageElement).src);
        });
      }, 500); // Small delay to ensure DOM is updated
    }
  }, [vehicle]);

  const preloadImages = (imageUrls: string[]) => {
    // Clear any previous preloaders
    imagePreloadersRef.current = [];
    
    // Create image objects to preload all gallery images
    imageUrls.forEach((url, index) => {
      if (!url) {
        console.warn(`Image URL at index ${index} is undefined or null`);
        return;
      }
      
      const img = new Image();
      
      // Add crossorigin attribute for CORS images
      if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
        img.crossOrigin = 'anonymous';
      }
      
      // Set up handlers before setting src
      img.onload = () => handleImageLoad(index, { target: imagePreloadersRef.current[index] } as unknown as React.SyntheticEvent<HTMLImageElement>);
      img.onerror = () => handleImageError(index, { target: img } as unknown as React.SyntheticEvent<HTMLImageElement>);
      
      // Set src after event handlers
      try {
        img.src = url;
      } catch (error) {
        console.error(`Failed to set image source for index ${index}:`, error);
        // Try fallback immediately for critical errors
        img.src = API_CONFIG.getDefaultVehicleImage();
      }
      
      imagePreloadersRef.current.push(img);
    });
  };

  // Enhanced image error handler with detailed logging
  const handleImageError = useCallback((index: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const originalSrc = target.src;
    
    console.warn(`[VehicleDetailPage] Image load error at index ${index}`, {
      originalSrc,
      vehicleId: vehicle?.id,
      vehicleName: vehicle?.name
    });
    
    // Use Cloudinary placeholder as fallback with vehicle name
    const fallbackUrl = API_CONFIG.getCloudinaryPlaceholder(
      vehicle?.name || `Vehicle ${vehicle?.id || ''}`,
      600,
      400
    );
    
    // Only change src if it's different to avoid infinite loops
    if (target.src !== fallbackUrl) {
      console.log(`[VehicleDetailPage] Replacing failed image with fallback:`, fallbackUrl);
      target.src = fallbackUrl;
    }
  }, [vehicle]);
  
  // Debug function to monitor image loading success
  const handleImageLoad = useCallback((index: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    console.log(`[VehicleDetailPage] Image ${index} loaded successfully:`, target.src);
  }, []);

  const fetchVehicleDetails = async (vehicleId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get vehicle from the API
      const vehicleData = await marketplaceService.getVehicleDetails(vehicleId);
      
      // Debug: Log the original vehicle data
      console.log('Original vehicle data:', vehicleData);
      console.log('Image URLs from API:', {
        front: vehicleData.front_image_url,
        back: vehicleData.back_image_url,
        left: vehicleData.left_image_url,
        right: vehicleData.right_image_url,
        dashboard: vehicleData.dashboard_image_url,
        imageUrl: vehicleData.imageUrl
      });
      
      // Get the default image for fallbacks
      const defaultImage = API_CONFIG.getDefaultVehicleImage();
      
      // Process and normalize the data for UI
      const processedVehicle: UIVehicle = {
        ...vehicleData,
        // Create a readable name
        name: `${vehicleData.brand} ${vehicleData.model}`,
        // Organize images for the gallery
        images: {
          // Use the API-provided front image URL OR the imageUrl field OR default
          main: vehicleData.front_image_url || vehicleData.imageUrl || defaultImage,
          // Create a gallery of all available images, filtering out nulls
          gallery: [
            vehicleData.front_image_url,
            vehicleData.back_image_url,
            vehicleData.left_image_url, 
            vehicleData.right_image_url,
            vehicleData.dashboard_image_url
          ].filter(Boolean) as string[]
        }
      };
      
      // If we don't have any gallery images, add at least the main image
      if (processedVehicle.images.gallery.length === 0 && processedVehicle.images.main) {
        processedVehicle.images.gallery = [processedVehicle.images.main];
      }
      
      // Debug: Log the processed vehicle with image URLs
      console.log('Processed vehicle for UI:', processedVehicle);
      console.log('Gallery images:', processedVehicle.images.gallery);
      
      // Pre-load images if possible
      if (processedVehicle.images.gallery.length > 0) {
        preloadImages(processedVehicle.images.gallery);
      }
      
      // Set the processed vehicle to state
      setVehicle(processedVehicle);
      setActiveImageIndex(0);
      setShowModal(false);
      
      // Reset loading state
      setLoading(false);
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      setError('Failed to load vehicle details. Please try again.');
      setLoading(false);
    }
  };

  const openModal = (index: number) => {
    setActiveImageIndex(index);
    setShowModal(true);
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'sold':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'under_inspection':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'sold':
        return 'Sold';
      case 'under_inspection':
        return 'Under Inspection';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-red-100 text-red-800';
      case 'under_inspection':
        return 'bg-amber-100 text-amber-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleContactUs = () => {
    if (!vehicle) return;
    
    // Use phone dialog to call the business number
    window.location.href = "tel:+911234567890"; // Replace with your actual number
  };

  const handleBookVehicle = () => {
    if (!vehicle) return;
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setBookingData({
      contact_number: '',
      notes: ''
    });
    setBookingError(null);
  };

  const handleBookingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !id) return;
    
    // Validate phone number format
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(bookingData.contact_number)) {
      setBookingError('Phone number must be in valid format (10-15 digits with optional + prefix)');
      return;
    }
    
    setBookingLoading(true);
    setBookingError(null);
    
    try {
      // Log the exact front_image_url we're sending for booking
      const originalVehicleData = await marketplaceService.getVehicleDetails(id);
      console.log('Original front_image_url for booking:', originalVehicleData.front_image_url);
      
      // Add original front_image_url to booking data to ensure it's used exactly as is
      const enhancedBookingData = {
        ...bookingData,
        original_front_image_url: originalVehicleData.front_image_url,
        // Store the current location as referrer
        referrer: window.location.pathname
      };
      
      const response = await marketplaceService.bookVehicle(id, enhancedBookingData);
      
      toast.success('Booking request submitted successfully! Our team will contact you shortly.');
      closeBookingModal();
      
      // Navigate to the profile bookings tab
      navigate('/profile', { state: { activeTab: 'bookings' } });
    } catch (error: any) {
      console.error('Error booking vehicle:', error);
      
      // Display a specific error message based on the error
      let errorMessage = 'Failed to submit booking request. Please try again.';
      
      if (error.message) {
        // Check for specific error messages from the marketplaceService
        if (error.message.includes('Contact number')) {
          errorMessage = error.message;
        } else if (error.message.includes('Authentication')) {
          errorMessage = 'Please log in to book this vehicle.';
        } else if (error.message.includes('not found') || error.message.includes('no longer available')) {
          errorMessage = 'This vehicle is no longer available for booking.';
        } else if (error.message.includes('Server error')) {
          errorMessage = 'Our system is currently experiencing issues. Please try again later.';
        } else {
          // Use the error message from the server if it exists
          errorMessage = error.message;
        }
      }
      
      setBookingError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const toggleEmiOptions = () => {
    setShowEmiOptions(!showEmiOptions);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const selectImage = (index: number) => {
    setActiveImageIndex(index);
  };

  const handleFavoriteToggle = async () => {
    if (!vehicle || !id) return;
    
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await marketplaceService.removeFromFavorites(id);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await marketplaceService.addToFavorites(id);
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites. Please try again.');
    } finally {
      setFavoriteLoading(false);
    }
  };
  
  const handleShare = async () => {
    if (!vehicle || !id) return;
    
    setShareLoading(true);
    try {
      const result = await marketplaceService.shareVehicle(id, vehicle.name);
      
      if (result.success) {
        if (result.method === 'clipboard' || result.method === 'execCommand') {
          toast.success('Link copied to clipboard!');
        } else {
          toast.success('Shared successfully!');
        }
      } else {
        toast.error('Failed to share. Please try again.');
      }
    } catch (error) {
      console.error('Error sharing vehicle:', error);
      toast.error('Failed to share. Please try again.');
    } finally {
      setShareLoading(false);
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Back to Vehicles
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Vehicle Images */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Main Image */}
                <div className="relative h-96 bg-gray-100 rounded-t-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {!imagesLoaded[activeImageIndex] && (
                      <div className="animate-pulse rounded-md bg-gray-200 h-full w-full flex items-center justify-center">
                        <span className="text-gray-500">Loading image...</span>
                      </div>
                    )}
                  </div>
                  <img
                    src={vehicle.images.gallery[activeImageIndex] || API_CONFIG.getDefaultVehicleImage()}
                    alt={vehicle.name}
                    className={`w-full h-full object-contain transition-opacity duration-300 ${imagesLoaded[activeImageIndex] ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => openModal(activeImageIndex)}
                    loading="eager"
                    decoding="async"
                    onLoad={() => handleImageLoad(activeImageIndex, { target: imagePreloadersRef.current[activeImageIndex] } as unknown as React.SyntheticEvent<HTMLImageElement>)}
                    onError={(e) => handleImageError(activeImageIndex, e)}
                  />
                  
                  {/* Status Badge */}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusClass(vehicle.status)} z-10`}>
                    {getStatusIcon(vehicle.status)}
                    <span className="ml-1">{getStatusText(vehicle.status)}</span>
                  </div>
                  
                  {/* Navigation Arrows */}
                  {vehicle.images.gallery.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
                
                {/* Thumbnail Gallery */}
                <div className="grid grid-cols-5 gap-2 mt-4 px-4 pb-4">
                  {vehicle.images.gallery.map((image, idx) => (
                    <div 
                      key={idx}
                      className={`relative cursor-pointer h-16 border rounded overflow-hidden ${activeImageIndex === idx ? 'border-[#FF5733] shadow-md' : 'border-gray-200'}`}
                      onClick={() => selectImage(idx)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        {!imagesLoaded[idx] && (
                          <div className="w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></div>
                        )}
                      </div>
                      <img 
                        src={image || API_CONFIG.getDefaultVehicleImage()}
                        alt={`${vehicle.name} thumbnail ${idx + 1}`}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${imagesLoaded[idx] ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => handleImageLoad(idx, { target: imagePreloadersRef.current[idx] } as unknown as React.SyntheticEvent<HTMLImageElement>)}
                        onError={(e) => handleImageError(idx, e)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicle Description */}
              <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700">
                  {vehicle.description || `${vehicle.brand} ${vehicle.model} ${vehicle.year} in ${vehicle.condition || 'good'} condition. 
                  This ${vehicle.fuel_type} ${vehicle.vehicle_type} has been driven for ${vehicle.kms_driven.toLocaleString()} kilometers.`}
                </p>
                
                {/* Vehicle Features */}
                {vehicle.features && vehicle.features.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Features</h3>
                    <ul className="grid grid-cols-2 gap-2">
                      {vehicle.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Vehicle Information */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Only show year if not already in features */}
                    {!vehicle.features?.some(f => f.toLowerCase().includes('year') || f.toLowerCase().includes('2024')) && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Registration Year</span>
                        <span className="text-gray-700 font-medium">{vehicle.year}</span>
                      </div>
                    )}
                    
                    {/* Only show fuel type if not already in features */}
                    {!vehicle.features?.some(f => f.toLowerCase().includes('fuel') || f.toLowerCase().includes('petrol')) && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Fuel Type</span>
                        <span className="text-gray-700 font-medium capitalize">{vehicle.fuel_type}</span>
                      </div>
                    )}
                    
                    {/* Only show engine capacity if not already in features */}
                    {!vehicle.features?.some(f => f.toLowerCase().includes('engine') || f.toLowerCase().includes('cc') || f.toLowerCase().includes('400cc')) && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Engine Capacity</span>
                        <span className="text-gray-700 font-medium">
                          {vehicle.engine_capacity ? `${vehicle.engine_capacity} cc` : 'N/A'}
                        </span>
                      </div>
                    )}
                    
                    {/* Only show kilometers driven if not already in features */}
                    {!vehicle.features?.some(f => f.toLowerCase().includes('km') || f.toLowerCase().includes('kilometer') || f.toLowerCase().includes('driven')) && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Kilometers Driven</span>
                        <span className="text-gray-700 font-medium">{vehicle.kms_driven.toLocaleString()} km</span>
                      </div>
                    )}
                    
                    {/* Only show color if not already in features */}
                    {!vehicle.features?.some(f => f.toLowerCase().includes('color') || f.toLowerCase().includes('blue') || 
                        f.toLowerCase().includes('red') || f.toLowerCase().includes('black')) && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Color</span>
                        <span className="text-gray-700 font-medium capitalize">{vehicle.color || 'N/A'}</span>
                      </div>
                    )}
                    
                    {/* Only show mileage if not already in features */}
                    {!vehicle.features?.some(f => f.toLowerCase().includes('mileage') || f.toLowerCase().includes('km/l') || 
                        f.toLowerCase().match(/\d+\s*km\/l/)) && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Mileage</span>
                        <span className="text-gray-700 font-medium">
                          {vehicle.Mileage ? `${vehicle.Mileage} km/l` : 'N/A'}
                        </span>
                      </div>
                    )}
                    
                    {/* Almost always show service date since it's specific */}
                    {!vehicle.features?.some(f => f.toLowerCase().includes('service date')) && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Last Service Date</span>
                        <span className="text-gray-700 font-medium">{formatDate(vehicle.last_service_date)}</span>
                      </div>
                    )}
                    
                    {/* Almost always show insurance validity since it's specific */}
                    {!vehicle.features?.some(f => f.toLowerCase().includes('insurance valid') || f.toLowerCase().includes('insurance till')) && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Insurance Valid Till</span>
                        <span className="text-gray-700 font-medium">{formatDate(vehicle.insurance_valid_till)}</span>
                      </div>
                    )}

                    {/* Include additional useful information not typically in features */}
                    {vehicle.condition && !vehicle.features?.some(f => f.toLowerCase().includes('condition')) && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Condition</span>
                        <span className="text-gray-700 font-medium capitalize">{vehicle.condition}</span>
                      </div>
                    )}

                    {vehicle.registration_number && !vehicle.features?.some(f => f.toLowerCase().includes('registration') || f.toLowerCase().includes('reg no')) && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Registration Number</span>
                        <span className="text-gray-700 font-medium">{vehicle.registration_number}</span>
                      </div>
                    )}
                    
                    {/* Only show owner count if it exists and not in features */}
                    {('owner_count' in vehicle) && 
                      typeof (vehicle as any).owner_count === 'number' && 
                      (vehicle as any).owner_count > 0 && 
                      !vehicle.features?.some(f => f.toLowerCase().includes('owner')) && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Owner Count</span>
                        <span className="text-gray-700 font-medium">{(vehicle as any).owner_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Vehicle Details */}
            <div className="space-y-6">
              {/* Vehicle Info Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{vehicle.name}</h1>
                <div className="flex items-center text-md text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{vehicle.year}</span>
                  <span className="mx-2">•</span>
                  <Bike className="h-4 w-4 mr-1" />
                  <span>
                    {vehicle.kms_driven.toLocaleString()} km
                  </span>
                </div>
                <div className="mt-4 mb-6">
                  <h2 className="text-3xl font-bold text-[#FF5733]">₹{vehicle.price.toLocaleString()}</h2>
                </div>
                
                {/* EMI Available Badge */}
                {vehicle.emi_available && (
                  <div className="mb-4">
                    <button
                      onClick={toggleEmiOptions}
                      className="flex items-center text-[#FF5733] hover:text-[#ff4019] transition-colors"
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">EMI Available</span>
                      <span className="ml-1 text-xs underline">View options</span>
                    </button>
                    
                    {/* EMI Options Panel */}
                    {showEmiOptions && (
                      <div className="mt-2 bg-gray-50 p-3 rounded-lg text-sm">
                        <h4 className="font-medium mb-2">EMI Options:</h4>
                        <div className="space-y-1">
                          <p>3 months: ₹{Math.round(vehicle.price / 3).toLocaleString()}/month</p>
                          <p>6 months: ₹{Math.round(vehicle.price / 6).toLocaleString()}/month</p>
                          <p>12 months: ₹{Math.round(vehicle.price / 12).toLocaleString()}/month</p>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">*Terms and conditions apply</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {['available', 'inspection_done'].includes(vehicle.status) ? (
                    <button
                      onClick={handleBookVehicle}
                      className="w-full bg-[#FF5733] text-white font-medium py-3 px-4 rounded-lg hover:bg-[#ff4019] transition-colors flex items-center justify-center"
                    >
                      Book {['bike', 'electric_bike'].includes(vehicle.vehicle_type) ? 'Bike' : 'Scooter'}
                    </button>
                  ) : (
                    <button
                      onClick={handleBookVehicle} 
                      className="w-full bg-[#FF5733] text-white font-medium py-3 px-4 rounded-lg hover:bg-[#ff4019] transition-colors flex items-center justify-center"
                    >
                      Book {['bike', 'electric_bike'].includes(vehicle.vehicle_type) ? 'Bike' : 'Scooter'}
                    </button>
                  )}
                  
                  <button
                    onClick={handleContactUs}
                    className="w-full bg-white border-2 border-[#FF5733] text-[#FF5733] font-medium py-2.5 px-4 rounded-lg hover:bg-[#fff8f6] transition-colors flex items-center justify-center"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Us
                  </button>
                  
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleFavoriteToggle}
                      disabled={favoriteLoading}
                      className={`flex-1 ${isFavorite ? 'bg-[#fff8f6] border-[#FF5733] text-[#FF5733]' : 'bg-white border-gray-300 text-gray-700'} border font-medium py-2 px-4 rounded-lg hover:bg-[#fff8f6] transition-colors flex items-center justify-center`}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-[#FF5733]' : ''}`} />
                      {favoriteLoading ? 'Loading...' : (isFavorite ? 'Favorited' : 'Favorite')}
                    </button>
                    <button 
                      onClick={handleShare}
                      disabled={shareLoading}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {shareLoading ? 'Sharing...' : 'Share'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Vehicle Suggestions Card */}
              <div className="mt-6">
                <VehicleSuggestions 
                  currentVehicleId={id} 
                  limit={3} 
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Full-screen Image Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={closeModal}
        >
          <div className="relative w-full max-w-6xl h-[80vh] max-h-[80vh]">
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
              onClick={closeModal}
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Image */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative w-full h-full">
                {!imagesLoaded[activeImageIndex] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                  </div>
                )}
                <img
                  src={vehicle?.images.gallery[activeImageIndex] || API_CONFIG.getDefaultVehicleImage()}
                  alt={vehicle?.name || "Vehicle"}
                  className={`w-full h-full object-contain transition-opacity duration-300 ${imagesLoaded[activeImageIndex] ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => handleImageLoad(activeImageIndex, { target: imagePreloadersRef.current[activeImageIndex] } as unknown as React.SyntheticEvent<HTMLImageElement>)}
                  onError={(e) => handleImageError(activeImageIndex, e)}
                />
              </div>
            </div>
            
            {/* Navigation buttons */}
            {vehicle?.images.gallery.length > 1 && (
              <>
                <button 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-3 rounded-full text-white hover:bg-opacity-70 focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-3 rounded-full text-white hover:bg-opacity-70 focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
            
            {/* Image count indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white text-sm">
              {activeImageIndex + 1} / {vehicle?.images.gallery.length || 0}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={closeBookingModal}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Book {vehicle.brand} {vehicle.model}
            </h3>
            
            <p className="text-gray-600 mb-6">
              Fill out the form below to book this vehicle. Our team will contact you soon to guide you through the process.
            </p>
            
            {bookingError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
                {bookingError}
              </div>
            )}
            
            <form onSubmit={submitBooking}>
              <div className="mb-4">
                <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number*
                </label>
                <input
                  type="tel"
                  id="contact_number"
                  name="contact_number"
                  value={bookingData.contact_number}
                  onChange={handleBookingInputChange}
                  required
                  pattern="^\+?[0-9]{10,15}$"
                  placeholder="+911234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF5733] focus:border-[#FF5733]"
                />
                <p className="mt-1 text-xs text-gray-500">Format: +911234567890 or 1234567890</p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={bookingData.notes}
                  onChange={handleBookingInputChange}
                  rows={3}
                  placeholder="Any specific details or questions about the vehicle..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF5733] focus:border-[#FF5733]"
                ></textarea>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeBookingModal}
                  className="flex-1 bg-gray-100 text-gray-800 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 bg-[#FF5733] text-white font-medium py-2.5 px-4 rounded-lg hover:bg-[#ff4019] transition-colors flex items-center justify-center"
                >
                  {bookingLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    'Submit Booking'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDetailPage; 