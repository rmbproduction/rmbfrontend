import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../config/api.config';

// Types
export interface Cart {
  id: number;
  status: string;
  items: CartItem[];
  total: string;
  total_amount: string;
}

export interface CartItem {
  id: number;
  service_name: string;
  service_price: string;
  quantity: number;
  package_name?: string;
  service: {
    id: string;
    name: string;
  };
  package?: {
    id: string;
    name: string;
  };
}

// Cart count store
type CartCountState = {
  count: number;
  setCount: (count: number) => void;
  incrementCartCount: () => void;
  decrementCartCount: () => void;
  resetCount: () => void;
};

export const useCartCountStore = create<CartCountState>()((set) => ({
  count: 0,
  setCount: (count: number) => set(() => ({ count })),
  incrementCartCount: () => set((state) => ({ count: state.count + 1 })),
  decrementCartCount: () => set((state) => ({ count: Math.max(0, state.count - 1) })),
  resetCount: () => set(() => ({ count: 0 }))
}));

// Active cart query
export const useActiveCart = () => {
  const { data: activeCart, isLoading, error } = useQuery<Cart | null>({
    queryKey: ['activeCart'],
    queryFn: async () => {
      try {
        const response = await apiService.services.getUserCarts();
        const activeCart = response.data?.find((cart: Cart) => cart.status === 'active');
        
        // Update cart count in store
        if (activeCart?.items) {
          useCartCountStore.getState().setCount(activeCart.items.length);
        } else {
          useCartCountStore.getState().resetCount();
        }
        
        return activeCart || null;
      } catch (error) {
        console.error('Error fetching active cart:', error);
        useCartCountStore.getState().resetCount();
        return null;
      }
    },
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
  });

  return {
    activeCart,
    isLoading,
    error,
  };
};

// Add to cart mutation
export const useAddToCartMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, item }: { cartId: number; item: any }) => {
      const response = await apiService.services.addToCart(cartId, item);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeCart'] });
    },
  });
};

// Remove from cart mutation
export const useRemoveFromCartMutation = () => {
  const queryClient = useQueryClient();
  const { decrementCartCount } = useCartCountStore();

  return useMutation({
    mutationFn: async (itemId: number) => {
      const response = await apiService.services.removeCartItem(itemId);
      return response.data;
    },
    onSuccess: () => {
      decrementCartCount();
      queryClient.invalidateQueries({ queryKey: ['activeCart'] });
    },
  });
};

// Update cart item mutation
export const useUpdateCartItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, itemId, quantity }: { cartId: number; itemId: number; quantity: number }) => {
      const response = await apiService.services.updateCartItem(cartId, itemId, quantity);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeCart'] });
    },
  });
};

// Clear cart mutation
export const useClearCartMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartId: number) => {
      const response = await apiService.services.clearCart(cartId);
      return response.data;
    },
    onSuccess: () => {
      useCartCountStore.getState().setCount(0);
      queryClient.invalidateQueries({ queryKey: ['activeCart'] });
    },
  });
}; 