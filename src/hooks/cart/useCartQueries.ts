import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../config/api.config';

// Types
export interface CartItem {
  id: number;
  service_id: number;
  service_name: string;
  service_price: string;
  quantity: number;
  package_id?: number;
  package_name?: string;
  features?: string[];
}

export interface Cart {
  id: number;
  user?: number;
  items?: CartItem[];
  created_at?: string;
  modified_at?: string;
  status: 'active' | 'abandoned' | 'completed';
  total_amount?: string;
  total_items?: number;
}

export interface CreateCartResponse {
  id: number;
  status: string;
  message: string;
}

export interface AddToCartResponse {
  status: string;
  cart_item_id: number;
  cart: Cart;
}

export interface AddToCartItem {
  service_id: string;
  package_id?: string;
  quantity: number;
  manufacturer_id: number;
  model_id: number;
}

// Query Keys
export const cartKeys = {
  all: ['cart'] as const,
  lists: () => [...cartKeys.all, 'list'] as const,
  detail: (id: number) => [...cartKeys.all, 'detail', id] as const,
};

// Queries
export const useCartsQuery = () => {
  return useQuery({
    queryKey: cartKeys.lists(),
    queryFn: async () => {
      const response = await apiService.services.getUserCarts();
      return response.data as Cart[];
    },
  });
};

// Mutations
export const useCreateCartMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiService.services.createCart();
      return response.data as CreateCartResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
      // Store the active cart ID in localStorage
      localStorage.setItem('activeCartId', data.id.toString());
    },
  });
};

export const useAddToCartMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ cartId, item }: { cartId: number; item: AddToCartItem }) => {
      const response = await apiService.services.addToCart(cartId, item);
      return response.data as AddToCartResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cartKeys.detail(data.cart.id) });
    },
  });
};

export const useUpdateCartItemMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ cartId, itemId, quantity }: { cartId: number; itemId: number; quantity: number }) => {
      const response = await apiService.services.updateCartItem(cartId, itemId, quantity);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cartKeys.detail(variables.cartId) });
    },
  });
};

export const useRemoveCartItemMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itemId: number) => {
      const response = await apiService.services.removeCartItem(itemId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
    },
  });
};

export const useClearCartMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cartId: number) => {
      const response = await apiService.services.clearCart(cartId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
    },
  });
};

// Custom hook for active cart management
export const useActiveCart = () => {
  const { data: carts = [], isLoading, error } = useCartsQuery();
  const createCart = useCreateCartMutation();
  
  // Get active cart ID from localStorage
  const activeCartId = localStorage.getItem('activeCartId');
  
  // Find active cart
  const activeCart = carts.find(cart => 
    cart.id === (activeCartId ? parseInt(activeCartId, 10) : null) && 
    cart.status === 'active'
  ) || carts.find(cart => cart.status === 'active') || null;
  
  // Calculate totals - only from active cart
  const cartCount = activeCart?.total_items || 0;
    
  const cartTotal = activeCart?.total_amount || '0.00';
  
  return {
    activeCart,
    carts: carts.filter(cart => cart.status === 'active'),
    isLoading,
    error,
    cartCount,
    cartTotal,
    createCart: createCart.mutate,
  };
}; 