import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Vehicle {
  manufacturer: string;
  model: string;
  vehicleType: string;
  manufacturerId: number;
  modelId: number;
}

const VEHICLE_SELECTION_KEY = 'selectedVehicle';

export const useVehicleSelection = () => {
  const queryClient = useQueryClient();

  // Query to get the selected vehicle
  const { data: selectedVehicle } = useQuery<Vehicle | null>({
    queryKey: ['vehicleSelection'],
    queryFn: () => {
      const stored = localStorage.getItem(VEHICLE_SELECTION_KEY);
      return stored ? JSON.parse(stored) : null;
    },
    staleTime: Infinity, // Data won't become stale
    gcTime: Infinity, // Cache won't be garbage collected
  });

  // Mutation to update the selected vehicle
  const { mutate: setSelectedVehicle } = useMutation({
    mutationFn: async (vehicle: Vehicle | null) => {
      if (vehicle) {
        localStorage.setItem(VEHICLE_SELECTION_KEY, JSON.stringify(vehicle));
      } else {
        localStorage.removeItem(VEHICLE_SELECTION_KEY);
      }
      return Promise.resolve(vehicle);
    },
    onSuccess: (vehicle) => {
      queryClient.setQueryData(['vehicleSelection'], vehicle);
    },
  });

  // Mutation to reset vehicle selection
  const { mutate: resetVehicleSelection } = useMutation({
    mutationFn: async () => {
      localStorage.removeItem(VEHICLE_SELECTION_KEY);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.setQueryData(['vehicleSelection'], null);
    },
  });

  return {
    selectedVehicle,
    setSelectedVehicle,
    resetVehicleSelection,
  };
}; 