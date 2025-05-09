import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Plus, Minus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_CONFIG } from '../config/api.config';

interface CartItem {
  id: number;
  service_id: number;
  service_name: string;
  quantity: number;
  price: string;
}

interface CartData {
  id: number;
  items: CartItem[];
}

const RepairsBasketIcon: React.FC = () => {
  const [basketItems, setBasketItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load cart data when component mounts
  useEffect(() => {
    const fetchCartData = async () => {
      setLoading(true);
      
      try {
        const cartId = sessionStorage.getItem('cartId');
        
        // If we have a cart ID, try to load from server
        if (cartId) {
          try {
            const response = await fetch(API_CONFIG.getApiUrl(`/repairing_service/cart/${cartId}/`), {
              credentials: 'omit'
            });
            
            if (response.ok) {
              const data: CartData = await response.json();
              if (data.items && data.items.length > 0) {
                console.log('Basket items loaded from server:', data.items.length);
                setBasketItems(data.items);
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error('Error loading cart from server:', error);
          }
        }
        
        // If we get here, either cart ID was missing or no items were found
        // Try to recover from pendingServiceData
        const pendingServiceData = sessionStorage.getItem('pendingServiceData');
        if (pendingServiceData) {
          try {
            console.log('Attempting to recover from pendingServiceData');
            const serviceData = JSON.parse(pendingServiceData);
            
            // Create a temporary basket item
            const tempItem: CartItem = {
              id: 0,
              service_id: serviceData.id,
              service_name: serviceData.name,
              quantity: serviceData.quantity || 1,
              price: serviceData.price?.replace('₹', '') || '0'
            };
            
            setBasketItems([tempItem]);
            console.log('Created temporary basket item from pending data:', tempItem);
            
            // If we don't have a cart yet, create one
            if (!cartId) {
              try {
                const createResponse = await fetch(API_CONFIG.getApiUrl('/repairing_service/cart/create/'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'omit'
                });
                
                if (createResponse.ok) {
                  const newCart = await createResponse.json();
                  console.log('Created new cart:', newCart.id);
                  sessionStorage.setItem('cartId', newCart.id.toString());
                  
                  // Add the service to the new cart
                  await fetch(API_CONFIG.getApiUrl(`/repairing_service/cart/${newCart.id}/add/`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      service_id: serviceData.id,
                      quantity: serviceData.quantity || 1,
                      service_name: serviceData.name
                    }),
                    credentials: 'omit'
                  });
                  
                  console.log('Added service to new cart');
                }
              } catch (cartError) {
                console.error('Failed to create cart from pending data:', cartError);
              }
            }
          } catch (parseError) {
            console.error('Failed to parse pending service data:', parseError);
          }
        } else {
          console.log('No pending service data found');
          setBasketItems([]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchCartData();
    
    // Refresh cart data when cartId changes
    window.addEventListener('storage', (event) => {
      if (event.key === 'cartId' || event.key === 'pendingServiceData') {
        fetchCartData();
      }
    });
    
    // Add custom event listener for cart updates
    const handleCartUpdate = () => fetchCartData();
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('storage', () => {});
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Calculate total price
  const calculateTotal = (): string => {
    return basketItems
      .reduce((total, item) => {
        const price = parseFloat(item.price);
        return total + (isNaN(price) ? 0 : price * item.quantity);
      }, 0)
      .toFixed(2);
  };
  
  // Calculate total items (counting quantities)
  const calculateTotalItems = (): number => {
    return basketItems.reduce((total, item) => total + item.quantity, 0);
  };
  
  // Handle removing an item
  const handleRemoveItem = async (itemId: number) => {
    try {
      // Special handling for temporary items (ID 0)
      if (itemId === 0) {
        // For temporary items, just update local state and clear pendingServiceData
        setBasketItems([]);
        sessionStorage.removeItem('pendingServiceData');
        toast.success('Item removed from basket');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('cartUpdated'));
        return;
      }

      // For regular items, call the API
      const response = await fetch(API_CONFIG.getApiUrl(`/repairing_service/cart/items/${itemId}/`), {
        method: 'DELETE',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove item');
      }
      
      // Update local state
      setBasketItems(basketItems.filter(item => item.id !== itemId));
      toast.success('Item removed from basket');
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };
  
  // Handle updating item quantity
  const updateItemQuantity = async (itemId: number, newQuantity: number) => {
    // Don't allow quantities less than 1
    if (newQuantity < 1) return;
    
    try {
      // First update locally for better UX
      setBasketItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
      
      // Special handling for temporary items (ID 0)
      if (itemId === 0) {
        // For temporary items, update the pendingServiceData in sessionStorage
        const pendingServiceData = sessionStorage.getItem('pendingServiceData');
        if (pendingServiceData) {
          try {
            const serviceData = JSON.parse(pendingServiceData);
            serviceData.quantity = newQuantity;
            sessionStorage.setItem('pendingServiceData', JSON.stringify(serviceData));
            
            // Success! No need to call the API
            return;
          } catch (error) {
            console.error('Error updating pending service data:', error);
          }
        }
        return;
      }
      
      // For regular items, call the API
      const cartId = sessionStorage.getItem('cartId');
      if (!cartId) {
        throw new Error('Cart ID not found');
      }
      
      // Then send update to server
      const response = await fetch(API_CONFIG.getApiUrl(`/repairing_service/cart/${cartId}/update-item/`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_item_id: itemId,
          quantity: newQuantity
        }),
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }
      
      // Re-fetch cart data to ensure everything is in sync
      window.dispatchEvent(new Event('cartUpdated'));
      
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };
  
  // Add a function to clear all items from the basket
  const clearBasket = async () => {
    try {
      const confirmed = window.confirm('Are you sure you want to clear all items from your basket?');
      if (!confirmed) return;
      
      // Check if we have any temporary items (ID 0)
      const hasTemporaryItem = basketItems.some(item => item.id === 0);
      if (hasTemporaryItem) {
        // Clear pendingServiceData and update local state
        sessionStorage.removeItem('pendingServiceData');
        setBasketItems([]);
        toast.success('All items removed from your repairs basket');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('cartUpdated'));
        return;
      }
      
      // For regular items, call the API
      const cartId = sessionStorage.getItem('cartId');
      if (!cartId) {
        return;
      }
      
      const response = await fetch(API_CONFIG.getApiUrl(`/repairing_service/cart/${cartId}/clear/`), {
        method: 'DELETE',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear basket');
      }
      
      // Update local state
      setBasketItems([]);
      toast.success('All items removed from your repairs basket');
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error clearing basket:', error);
      toast.error('Failed to clear your repairs basket');
    }
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-700 hover:text-[#FF5733] relative"
        aria-label="Repairs Basket"
      >
        <ShoppingBag className="w-6 h-6" />
        {basketItems.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#FF5733] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {calculateTotalItems()}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Repairs Basket</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {loading ? (
              <div className="py-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#FF5733]"></div>
              </div>
            ) : basketItems.length === 0 ? (
              <div className="py-4 text-center text-gray-500">
                Your repairs basket is empty
              </div>
            ) : (
              <>
                <div className="max-h-60 overflow-y-auto">
                  {basketItems.map(item => (
                    <div key={item.id} className="py-3 border-b border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.service_name}</p>
                          <p className="text-xs text-gray-500 mt-1">Price: ₹{parseFloat(item.price).toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500 ml-2"
                          aria-label="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center mt-2">
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 py-1 text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="ml-auto font-medium text-sm">
                          ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total:</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-gray-500">
                      {calculateTotalItems()} items in basket
                    </div>
                    <button
                      onClick={clearBasket}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <Link 
                    to="/service-checkout" 
                    className="bg-[#FF5733] text-white px-4 py-2 rounded hover:bg-opacity-90 transition w-full text-center text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairsBasketIcon; 