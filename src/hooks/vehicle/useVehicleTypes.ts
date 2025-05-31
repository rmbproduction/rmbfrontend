import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../config/api.config';

export interface VehicleType {
  id: number;
  name: string;
  description?: string;
}

export const useVehicleTypes = () => {
  return useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: async () => {
      const response = await axiosInstance.get('/vehicle/vehicle-types/');
      return response.data as VehicleType[];
    },
  });
};

export const getVehicleTypeId = async (vehicleType: string): Promise<number> => {
  try {
    const response = await axiosInstance.get('/vehicle/vehicle-types/');
    const types = response.data as VehicleType[];
    const type = types.find((t) => t.name.toLowerCase() === vehicleType.toLowerCase());
    if (!type) {
      throw new Error(`Vehicle type ${vehicleType} not found`);
    }
    return type.id;
  } catch (err) {
    console.error('Error getting vehicle type:', err);
    throw err;
  }
}; 