import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, ChevronRight } from 'lucide-react';

interface CartItem {
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

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const loadCartItems = () => {
    const savedItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(savedItems);
  };

  useEffect(() => {
    // Load cart items initially
    loadCartItems();

    // Listen for cart updates
    window.addEventListener('cartUpdated', loadCartItems);
    window.addEventListener('storage', loadCartItems);

    return () => {
      window.removeEventListener('cartUpdated', loadCartItems);
      window.removeEventListener('storage', loadCartItems);
    };
  }, []);

  const handleRemoveItem = (serviceId: string, packageId: string) => {
    const updatedItems = cartItems.filter(item => 
      !(item.serviceId === serviceId && item.packageId === packageId)
    );
    setCartItems(updatedItems);
    // Update localStorage
    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    // Dispatch cart updated event to refresh the cart count
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleProceed = () => {
    navigate('/checkout?mode=cart');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <p className="text-gray-600 mb-4">Your cart is empty</p>
            <button
              onClick={() => navigate('/')}
              className="text-[#FF5733] hover:text-[#ff4019] font-medium"
            >
              Browse Services
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <motion.div
                  key={`${item.serviceId}-${item.packageId}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{item.serviceName}</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {item.packageName}
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        {item.vehicle.manufacturer} {item.vehicle.model} - {item.vehicle.fuelType}
                      </p>
                      <div className="mt-4 space-y-1">
                        {item.features.map((feature, index) => (
                          <p key={index} className="text-sm text-gray-600">
                            • {feature}
                          </p>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.serviceId, item.packageId)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Summary and Action */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-4">
                <h3 className="font-semibold text-lg mb-4">Service Summary</h3>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Number of Services</span>
                    <span className="font-medium">{cartItems.length}</span>
                  </div>
                </div>
                <button
                  onClick={handleProceed}
                  className="w-full bg-[#FF5733] text-white py-3 rounded-lg hover:bg-[#ff4019] transition-colors flex items-center justify-center gap-2"
                >
                  Proceed
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart; 