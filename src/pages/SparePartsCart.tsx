import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import { notification } from 'antd';
import { apiService } from '../config/api.config';
import { useAuth } from '../contexts/AuthContext';

interface CartItem {
  id: number;
  part: string;
  part_details: {
    uuid: string;
    name: string;
    main_image: string;
    price: number;
    discounted_price: number | null;
  };
  quantity: number;
  total_price: number;
}

interface Cart {
  id: number;
  items: CartItem[];
  total_price: number;
  total_items: number;
  total_quantity: number;
  status: string;
}

const SparePartsCart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);
  
  // Load cart from localStorage or API
  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        const cartId = localStorage.getItem('active_parts_cart_id');
        
        if (!cartId) {
          setCart(null);
          setLoading(false);
          return;
        }
        
        const response = await apiService.spareParts.getCart(parseInt(cartId));
        setCart(response);
      } catch (error) {
        console.error('Error loading cart:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to load your cart',
          placement: 'bottomRight',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadCart();
  }, []);
  
  // Update cart item quantity
  const updateItemQuantity = async (itemId: number, newQuantity: number) => {
    if (!cart) return;
    
    try {
      setUpdatingItem(itemId);
      
      if (newQuantity <= 0) {
        // Remove item
        await apiService.spareParts.removeCartItem(itemId);
      } else {
        // Update quantity
        await apiService.spareParts.updateCartItem(cart.id, itemId, newQuantity);
      }
      
      // Refresh cart
      const updatedCart = await apiService.spareParts.getCart(cart.id);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error updating cart item:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update cart item',
        placement: 'bottomRight',
      });
    } finally {
      setUpdatingItem(null);
    }
  };
  
  // Clear cart
  const clearCart = async () => {
    if (!cart) return;
    
    try {
      setLoading(true);
      await apiService.spareParts.clearCart(cart.id);
      
      // Remove cart ID from localStorage
      localStorage.removeItem('active_parts_cart_id');
      
      // Reset cart state
      setCart(null);
      
      notification.success({
        message: 'Cart Cleared',
        description: 'Your cart has been cleared',
        placement: 'bottomRight',
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to clear cart',
        placement: 'bottomRight',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Proceed to checkout
  const proceedToCheckout = () => {
    if (!cart) return;
    
    if (!user) {
      notification.info({
        message: 'Login Required',
        description: 'Please log in to proceed to checkout',
        placement: 'bottomRight',
      });
      navigate('/login', { state: { returnUrl: '/spare-parts/cart' } });
      return;
    }
    
    // Store cart ID for checkout
    localStorage.setItem('parts_checkout_cart_id', cart.id.toString());
    
    // Navigate to checkout
    navigate('/spare-parts/checkout', { 
      state: { 
        mode: 'cart',
        cartId: cart.id
      }
    });
  };
  
  // Format price
  const getFormattedPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };
  
  // Empty cart view
  if (!loading && (!cart || cart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Cart</h1>
          
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some spare parts to your cart and they will appear here</p>
            <button
              onClick={() => navigate('/spare-parts')}
              className="px-6 py-3 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019] transition-colors"
            >
              Browse Spare Parts
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF5733] mx-auto" />
          <p className="mt-2 text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
          {cart && cart.items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <h2 className="font-semibold text-lg mb-4">Cart Items ({cart?.total_items || 0})</h2>
                
                <div className="space-y-6">
                  {cart?.items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.part_details.main_image} 
                          alt={item.part_details.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium">{item.part_details.name}</h3>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              disabled={updatingItem === item.id}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              disabled={updatingItem === item.id}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            {updatingItem === item.id && (
                              <Loader2 className="w-4 h-4 animate-spin ml-2" />
                            )}
                          </div>
                          <p className="font-medium">
                            {getFormattedPrice(item.total_price)}
                          </p>
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => updateItemQuantity(item.id, 0)}
                            disabled={updatingItem === item.id}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm sticky top-4"
            >
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{getFormattedPrice(cart?.total_price || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-600">Calculated at checkout</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold text-lg">{getFormattedPrice(cart?.total_price || 0)}</span>
                </div>
              </div>
              
              <button
                onClick={proceedToCheckout}
                className="w-full bg-[#FF5733] text-white py-3 rounded-lg hover:bg-[#ff4019] transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/spare-parts')}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Continue Shopping
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SparePartsCart; 