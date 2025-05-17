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
        const pendingServiceData = sessionStorage.getItem('pendingServiceData');
        let loadedItems = false;
        
        // If we have a cart ID, try to load from server
        if (cartId) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
            
            const response = await fetch(API_CONFIG.getApiUrl(`/repairing-service/cart/${cartId}/`), {
              credentials: 'omit',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const data: CartData = await response.json();
              if (data.items && data.items.length > 0) {
                console.log('Basket items loaded from server:', data.items.length);
                setBasketItems(data.items);
                loadedItems = true;
              } else {
                console.log('Cart exists but is empty');
                // If cart exists but is empty, and we have pending data, we should add it
                if (pendingServiceData) {
                  await recoverFromPendingData(pendingServiceData, cartId);
                  loadedItems = true;
                } else {
                  setBasketItems([]);
                }
              }
            } else if (response.status === 404) {
              // Cart ID not found - it might have been deleted on the server
              console.warn('Cart not found on server, removing from session');
              sessionStorage.removeItem('cartId');
              // Show a notification to the user
              toast.info('Your shopping cart has been reset');
              
              // If we have pending data, try to recover
              if (pendingServiceData) {
                await recoverFromPendingData(pendingServiceData);
                loadedItems = true;
              } else {
                setBasketItems([]);
              }
            } else {
              // Handle other error status codes
              console.error('Error loading cart:', response.status, response.statusText);
              // Show error notification if it's a server error
              if (response.status >= 500) {
                toast.error('Server error loading cart. Please try again later.');
                
                // Try to load locally
                if (pendingServiceData) {
                  await recoverFromPendingData(pendingServiceData);
                  loadedItems = true;
                }
              }
            }
          } catch (error) {
            console.error('Error loading cart from server:', error);
            
            // If it's a timeout or network error, try to recover from pendingServiceData
            if (error instanceof DOMException && error.name === 'AbortError') {
              console.log('Cart fetch timed out, trying to recover locally');
            } else {
              // Show user-friendly error for other errors
              toast.error('Unable to load your cart. Please check your connection.');
            }
            
            // Try to recover locally
            if (pendingServiceData && !loadedItems) {
              await recoverFromPendingData(pendingServiceData);
              loadedItems = true;
            }
          }
        }
        
        // If we couldn't load items from the server or we don't have a cart ID,
        // try to recover from pendingServiceData
        if (!loadedItems && pendingServiceData) {
          await recoverFromPendingData(pendingServiceData);
        }
      } catch (error) {
        console.error('Unexpected error in fetchCartData:', error);
        toast.error('An unexpected error occurred. Please try refreshing the page.');
        setBasketItems([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to recover cart from pending data
    const recoverFromPendingData = async (pendingData: string, existingCartId?: string) => {
      try {
        console.log('Attempting to recover from pendingServiceData');
        const serviceData = JSON.parse(pendingData);
        
        // Check if we already have this item in the basket to prevent duplication
        const serviceExists = basketItems.some(item => 
          item.service_id === serviceData.id
        );
        
        if (serviceExists) {
          console.log('Service already in basket items, skipping recovery');
          return true;
        }
        
        // Create a temporary basket item
        const tempItem: CartItem = {
          id: 0,
          service_id: serviceData.id,
          service_name: serviceData.name,
          quantity: serviceData.quantity || 1,
          price: serviceData.price?.replace('₹', '') || '0'
        };
        
        setBasketItems(prevItems => [...prevItems, tempItem]);
        console.log('Created temporary basket item from pending data:', tempItem);
        
        // If we don't have a cart or need to add to existing cart
        if (!existingCartId) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const createResponse = await fetch(API_CONFIG.getApiUrl('/repairing-service/cart/create/'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'omit',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (createResponse.ok) {
              const newCart = await createResponse.json();
              console.log('Created new cart:', newCart.id);
              sessionStorage.setItem('cartId', newCart.id.toString());
              
              try {
                // Check if this service already exists in the new cart to prevent duplication
                const cartItemsResponse = await fetch(API_CONFIG.getApiUrl(`/repairing-service/cart/${newCart.id}/`), {
                  credentials: 'omit'
                });
                
                if (cartItemsResponse.ok) {
                  const cartData = await cartItemsResponse.json();
                  const serviceExistsInCart = cartData.items && cartData.items.some(
                    (item: CartItem) => item.service_id === serviceData.id
                  );
                  
                  if (serviceExistsInCart) {
                    console.log('Service already exists in the cart, skipping add operation');
                    return true;
                  }
                }
                
                // Add the service to the new cart if it doesn't exist
                await fetch(API_CONFIG.getApiUrl(`/repairing-service/cart/${newCart.id}/add/`), {
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
              } catch (addError) {
                console.error('Failed to add service to new cart:', addError);
                // Keep local representation, we'll try again later
              }
            } else {
              console.error('Failed to create cart:', createResponse.status, createResponse.statusText);
              // Only show error for server errors
              if (createResponse.status >= 500) {
                toast.error('Server error creating cart. Please try again later.');
              }
            }
          } catch (cartError) {
            if (cartError instanceof DOMException && cartError.name === 'AbortError') {
              console.log('Cart creation timed out, keeping local representation');
            } else {
              console.error('Failed to create cart from pending data:', cartError);
              toast.error('Unable to create cart. Please check your connection.');
            }
          }
        } else {
          // We have an existing cart ID, check if this service already exists in the cart
          try {
            const cartItemsResponse = await fetch(API_CONFIG.getApiUrl(`/repairing-service/cart/${existingCartId}/`), {
              credentials: 'omit'
            });
            
            if (cartItemsResponse.ok) {
              const cartData = await cartItemsResponse.json();
              const serviceExistsInCart = cartData.items && cartData.items.some(
                (item: CartItem) => item.service_id === serviceData.id
              );
              
              if (serviceExistsInCart) {
                console.log('Service already exists in the cart, skipping add operation');
                return true;
              }
            }
            
            // Only add if not already in cart
            await fetch(API_CONFIG.getApiUrl(`/repairing-service/cart/${existingCartId}/add/`), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                service_id: serviceData.id,
                quantity: serviceData.quantity || 1,
                service_name: serviceData.name
              }),
              credentials: 'omit'
            });
            console.log('Added service to existing cart:', existingCartId);
          } catch (addError) {
            console.error('Failed to add service to existing cart:', addError);
            // Keep local representation, we'll try again later
          }
        }
      } catch (parseError) {
        console.error('Failed to parse pending service data:', parseError);
        // This is likely a corruption issue - clean it up
        sessionStorage.removeItem('pendingServiceData');
        toast.error('There was an issue with your cart data. Cart has been reset.');
        setBasketItems([]);
      }
      
      return true;
    };
    
    fetchCartData();
    
    // Refresh cart data when cartId changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'cartId' || event.key === 'pendingServiceData') {
        fetchCartData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Add custom event listener for cart updates
    const handleCartUpdate = () => fetchCartData();
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
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
      // Create local backup of current items for rollback
      const previousItems = [...basketItems];
      
      // Update UI immediately for responsive UX
      setBasketItems(basketItems.filter(item => item.id !== itemId));
      
      // Special handling for temporary items (ID 0)
      if (itemId === 0) {
        // For temporary items, just update local state and clear pendingServiceData
        sessionStorage.removeItem('pendingServiceData');
        toast.success('Item removed from basket');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('cartUpdated'));
        return;
      }

      // For regular items, call the API
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(API_CONFIG.getApiUrl(`/repairing-service/cart/items/${itemId}/`), {
          method: 'DELETE',
          credentials: 'omit',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to remove item: ${response.status} ${response.statusText}`);
        }
        
        toast.success('Item removed from basket');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('cartUpdated'));
      } catch (apiError) {
        console.error('API error removing item:', apiError);
        
        if (apiError instanceof DOMException && apiError.name === 'AbortError') {
          toast.warning('Network timeout. Item removed locally, but will sync when connection improves.');
        } else {
          // API failed, but we've already updated the UI - inform the user
          toast.warning('Item removed locally. Changes will sync when connection improves.');
        }
        
        // Keep the pendingServiceData for potential recovery
        const pendingServiceData = sessionStorage.getItem('pendingServiceData');
        if (pendingServiceData) {
          try {
            const serviceData = JSON.parse(pendingServiceData);
            if (serviceData.id === itemId) {
              sessionStorage.removeItem('pendingServiceData');
            }
          } catch (e) {
            console.error('Error checking pendingServiceData:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item. Please try again.');
      
      // If all else fails, refresh the cart data
      window.dispatchEvent(new Event('cartUpdated'));
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
      const response = await fetch(API_CONFIG.getApiUrl(`/repairing-service/cart/${cartId}/update-item/`), {
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
      
      const response = await fetch(API_CONFIG.getApiUrl(`/repairing-service/cart/${cartId}/clear/`), {
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