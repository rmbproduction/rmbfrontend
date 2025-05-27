import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../config/api.config';

export const useVehicles = (params?: any) => {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => apiService.marketplace.getVehicles(params),
  });
};

export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => apiService.marketplace.getVehicle(id),
    enabled: !!id,
  });
};

export const useCreateSellRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.marketplace.createSellRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.marketplace.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}; 