import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance, API_ENDPOINTS } from '../../config/api.config';
import { toast } from 'react-toastify';

export interface ServiceBookingData {
  cart_id?: number;
  service_id?: number;
  package_id?: string;
  profile?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
  vehicle?: {
    vehicle_type: string;
    manufacturer: string;
    model: string;
  };
  scheduleDate?: string;
  scheduleTime?: string;
  latitude?: number;
  longitude?: number;
  distanceFee?: number;
}

// Changed to export the interface so it can be used elsewhere
export interface ServiceBooking {
  id: string;
  reference_number: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  service: {
    id: string;
    name: string;
    package?: {
      id: string;
      name: string;
    };
  };
  vehicle: {
    manufacturer: string;
    model: string;
  };
  schedule: {
    date: string;
    time: string;
  };
  total_amount: number;
  distance_fee: number;
}

// Hook for creating a new service booking
export const useCreateServiceBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ServiceBookingData) => {
      console.log('Making service booking request with data:', JSON.stringify(data, null, 2));
      
      // Use different endpoints for cart booking vs buy now
      const endpoint = data.cart_id ? 
        API_ENDPOINTS.services.createBooking : 
        API_ENDPOINTS.services.serviceNow;
      
      // Validate required fields based on endpoint
      if (endpoint === API_ENDPOINTS.services.serviceNow) {
        // Buy now flow requires service_id
        if (!data.service_id) {
          throw new Error('service_id is required for buy now flow');
        }
        // Convert service_id to number if it's a string
        if (typeof data.service_id === 'string') {
          data.service_id = parseInt(data.service_id);
        }
      } else {
        // Cart checkout flow requires cart_id
        if (!data.cart_id) {
          throw new Error('cart_id is required for cart checkout');
        }
        // Convert cart_id to number if it's a string
        if (typeof data.cart_id === 'string') {
          data.cart_id = parseInt(data.cart_id);
        }
      }
      
      const response = await axiosInstance.post(endpoint, data);
      console.log('Service booking response:', response.data);
      
      // Store the booking data in localStorage for the success modal
      localStorage.setItem('lastBookingData', JSON.stringify({
        ...response.data,
        reference: response.data.reference,
        status: response.data.status,
        total_amount: response.data.total_amount,
        distance_fee: response.data.distance_fee,
        scheduled_date: response.data.scheduled_date,
        schedule_time: response.data.schedule_time,
        customerInfo: {
          name: response.data.customer_name,
          email: response.data.customer_email,
          phone: response.data.customer_phone,
          address: {
            street: response.data.address,
            city: response.data.city,
            state: response.data.state,
            zipCode: response.data.postal_code
          }
        },
        vehicle: {
          vehicle_type: response.data.vehicle_type_id,
          manufacturer: response.data.manufacturer_id,
          model: response.data.vehicle_model_id,
          manufacturer_name: response.data.manufacturer_name,
          model_name: response.data.model_name
        },
        service: {
          id: response.data.services?.[0]?.id,
          name: response.data.services?.[0]?.name,
          package: response.data.services?.[0]?.package
        }
      }));
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRepairs'] });
      toast.success('Service booked successfully!');
    },
    onError: (error: any) => {
      console.error('Service booking error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message
      });
      
      // More specific error handling
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         error.response?.data?.detail ||
                         'Failed to book service';
                         
      toast.error(errorMessage);
    },
  });
};

// Hook for fetching user's repair bookings
export const useMyRepairs = () => {
  return useQuery({
    queryKey: ['myRepairs'],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.services.myRepairs);
      return response.data;
    },
  });
};

// Hook for cancelling a service booking
export const useCancelServiceBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await axiosInstance.post(API_ENDPOINTS.services.cancelServiceNow(id), {
        reason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRepairs'] });
      toast.success('Service cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel service');
    },
  });
}; 