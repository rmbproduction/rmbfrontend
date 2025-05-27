import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { apiService } from '../../../config/api.config';
import { SellVehicleForm } from '../types/sellVehicle.types';

export const useSellVehicle = () => {
  return useMutation({
    mutationKey: ['sellVehicle'],
    mutationFn: async (data: SellVehicleForm) => {
      try {
        const formData = new FormData();

        // Add basic fields
        Object.entries(data).forEach(([key, value]) => {
          if (value instanceof File) {
            formData.append(key, value);
          } else if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });

        const response = await apiService.marketplace.createSellRequest(formData);
        return response.data;
      } catch (error: any) {
        console.error('Sell request error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Vehicle sell request submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit sell request');
    }
  });
}; 