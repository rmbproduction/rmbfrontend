import { useQueries } from '@tanstack/react-query';
import { axiosInstance, API_ENDPOINTS } from '../config/api.config';

export interface ServicePrice {
  id: number;
  service: number;
  manufacturer: number | null;
  vehicle_model: number | null;
  price: string;
  is_custom_price: boolean;
}

export const useServicePrices = (
  serviceIds: (string | number)[],
  manufacturerId?: number | null,
  modelId?: number | null
) => {
  console.log('useServicePrices called with:', { serviceIds, manufacturerId, modelId });
  
  return useQueries({
    queries: serviceIds.map((serviceId) => ({
      queryKey: ['servicePrice', serviceId, manufacturerId, modelId],
      queryFn: async () => {
        try {
          console.log('Fetching price for service:', serviceId);
          const url = `${API_ENDPOINTS.services.servicePrice(serviceId)}?manufacturer_id=${manufacturerId}&vehicle_model_id=${modelId}`;
          console.log('Request URL:', url);
          
          const response = await axiosInstance.get(url);
          console.log('Price response:', response.data);
          return response.data as ServicePrice;
        } catch (error) {
          console.error('Error fetching service price:', error);
          return null;
        }
      },
      enabled: !!serviceId && !!manufacturerId && !!modelId,
      retry: false,
      keepPreviousData: true,
      staleTime: 30000 // Cache for 30 seconds
    })),
  });
}; 