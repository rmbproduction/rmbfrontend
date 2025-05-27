import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../config/api.config';

export const useManufacturers = () => {
  return useQuery({
    queryKey: ['manufacturers'],
    queryFn: apiService.services.getManufacturers,
  });
};

export const useVehicleModels = (params?: any) => {
  return useQuery({
    queryKey: ['vehicleModels', params],
    queryFn: () => apiService.services.getVehicleModels(params),
    enabled: !!params,
  });
};

export const useServiceCategories = () => {
  return useQuery({
    queryKey: ['serviceCategories'],
    queryFn: apiService.services.getServiceCategories,
  });
};

export const useServices = (params?: any) => {
  return useQuery({
    queryKey: ['services', params],
    queryFn: () => apiService.services.getServices(params),
  });
};

export const useCreateCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.services.createCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartId, data }: { cartId: number; data: any }) => 
      apiService.services.addToCart(cartId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.services.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

export const useUserBookings = () => {
  return useQuery({
    queryKey: ['userBookings'],
    queryFn: apiService.services.getUserBookings,
  });
}; 