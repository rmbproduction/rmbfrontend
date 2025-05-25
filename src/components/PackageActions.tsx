import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PackageActionsProps {
  serviceId: string;
  packageId: string;
  serviceName: string;
  packageName: string;
  vehicle: {
    manufacturer: string;
    model: string;
    fuelType: string;
  };
  features: string[];
}

interface CartItem extends PackageActionsProps {}

const PackageActions = ({
  serviceId,
  packageId,
  serviceName,
  packageName,
  vehicle,
  features
}: PackageActionsProps) => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateCartItem = (item: CartItem): boolean => {
    return !!(
      item.serviceId &&
      item.packageId &&
      item.serviceName &&
      item.packageName &&
      item.vehicle?.manufacturer &&
      item.vehicle?.model &&
      item.vehicle?.fuelType &&
      Array.isArray(item.features)
    );
  };

  const handleAddToCart = () => {
    try {
      // Create new item
      const newItem = {
        serviceId,
        packageId,
        serviceName,
        packageName,
        vehicle,
        features
      };

      // Validate new item
      if (!validateCartItem(newItem)) {
        throw new Error('Invalid item data');
      }

      // Get existing cart items
      const existingCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');

      // Check for duplicate
      const isDuplicate = existingCartItems.some(
        (item: CartItem) => 
          item.serviceId === serviceId && 
          item.packageId === packageId &&
          item.vehicle.manufacturer === vehicle.manufacturer &&
          item.vehicle.model === vehicle.model
      );

      if (isDuplicate) {
        setErrorMessage('This service is already in your cart');
        setShowError(true);
        setTimeout(() => setShowError(false), 2000);
        return;
      }

      // Add new item
      localStorage.setItem('cartItems', JSON.stringify([...existingCartItems, newItem]));
      
      // Dispatch custom event to update cart count
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

    } catch (error) {
      setErrorMessage('Failed to add item to cart');
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
      console.error('Error adding to cart:', error);
    }
  };

  const handleBuyNow = () => {
    try {
      const newItem = {
        serviceId,
        packageId,
        serviceName,
        packageName,
        vehicle,
        features
      };

      // Validate item before proceeding
      if (!validateCartItem(newItem)) {
        throw new Error('Invalid item data');
      }

      // Store single item in localStorage for checkout
      localStorage.setItem('checkoutItem', JSON.stringify(newItem));
      
      // Navigate to checkout
      navigate('/checkout?mode=buy-now');
    } catch (error) {
      setErrorMessage('Failed to proceed to checkout');
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
      console.error('Error proceeding to checkout:', error);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-white text-[#FF5733] border-2 border-[#FF5733] py-2 px-4 rounded-lg 
                   hover:bg-[#FF5733] hover:text-white transition-colors duration-300 
                   flex items-center justify-center gap-2"
        >
          <ShoppingCart size={20} />
          Add to Cart
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 bg-[#FF5733] text-white py-2 px-4 rounded-lg 
                   hover:bg-[#ff4019] transition-colors duration-300
                   flex items-center justify-center gap-2"
        >
          <CreditCard size={20} />
          Buy Now
        </button>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 left-0 right-0 -mt-12 flex items-center justify-center"
          >
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle2 size={16} />
              Added to cart!
            </div>
          </motion.div>
        )}
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 left-0 right-0 -mt-12 flex items-center justify-center"
          >
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PackageActions; 