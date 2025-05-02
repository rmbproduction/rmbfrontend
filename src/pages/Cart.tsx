import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trash2, ArrowLeft, ShoppingCart } from 'lucide-react';
import { toast } from 'react-toastify';

interface Feature {
  id: string;
  name: string;
}

interface ServiceData {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: string;
  discount: string;
  discounted_price: number;
  description: string;
  duration: string;
  warranty: string;
  recommended: string;
  features: Feature[];
  image?: string;
  manufacturer?: string;
  vehicle_type?: number;
}

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  useEffect(() => {
    try {
      // Load cart from sessionStorage
      const storedCart = sessionStorage.getItem('cart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
      
      // Load selected vehicle
      const ownershipData = sessionStorage.getItem('userVehicleOwnership');
      if (ownershipData) {
        setSelectedVehicle(JSON.parse(ownershipData));
      }
    } catch (err) {
      console.error('Error loading cart data:', err);
      toast.error('Error loading your cart');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromCart = (index: number) => {
    try {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
      sessionStorage.setItem('cart', JSON.stringify(newCart));
      toast.success('Item removed from cart');
    } catch (err) {
      console.error('Error removing item from cart:', err);
      toast.error('Failed to remove item from cart');
    }
  };

  const clearCart = () => {
    try {
      setCart([]);
      sessionStorage.removeItem('cart');
      toast.success('Cart cleared');
    } catch (err) {
      console.error('Error clearing cart:', err);
      toast.error('Failed to clear cart');
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price);
      return total + (isNaN(price) ? 0 : price);
    }, 0).toFixed(2);
  };

  const handleCheckout = async () => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please log in to proceed with checkout');
        return;
      }

      // Check if vehicle is selected
      if (!selectedVehicle) {
        toast.error('Please select a vehicle before checkout');
        return;
      }

      // Here you would call your backend API to create an order
      // For now, we'll just simulate success
      toast.success('Order placed successfully!');
      
      // Clear the cart after successful checkout
      clearCart();
      
      // Navigate to order confirmation or profile
      navigate('/profile', { state: { activeTab: 'orders' } });
    } catch (err) {
      console.error('Error during checkout:', err);
      toast.error('Checkout failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-[#FF5733]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold">Your Cart</h1>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-8 text-center"
          >
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some services to get started.</p>
            <button
              onClick={() => navigate('/services')}
              className="bg-[#FF5733] text-white px-6 py-2 rounded hover:bg-opacity-90 transition"
            >
              Browse Services
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cart.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{item.duration}</div>
                          <div className="text-xs text-gray-500">{item.warranty}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">₹{item.price}</div>
                          {item.discount && (
                            <div className="text-xs text-green-500">Save ₹{item.discount}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between mb-4">
                <div className="text-gray-600">Total</div>
                <div className="text-xl font-bold">₹{calculateTotal()}</div>
              </div>
              
              {selectedVehicle ? (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">Selected Vehicle</div>
                  <div className="text-sm text-gray-600">
                    Type: {selectedVehicle.vehicle_type_name || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Registration: {selectedVehicle.registration_number || 'N/A'}
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
                  Please select a vehicle before checkout
                </div>
              )}

              <button
                onClick={handleCheckout}
                className="w-full bg-[#FF5733] text-white py-3 rounded-lg hover:bg-opacity-90 transition font-medium"
                disabled={!selectedVehicle || cart.length === 0}
              >
                Proceed to Checkout
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
