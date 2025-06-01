import { axiosInstance } from '../config/api.config';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { useUserProfile } from '../hooks/useUserProfile';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface BookingRequest {
  vehicle: string;
  contact_number: string;
  notes?: string;
  customer_name?: string;
  customer_email?: string;
}

export interface Booking {
  id: string;
  vehicle_details: {
    id: string;
    brand: string;
    model: string;
  };
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  status_display: string;
  booking_date: string;
  booking_date_display: string;
  contact_number: string;
  customer_name?: string;
  customer_email?: string;
  notes?: string;
}

interface ApiErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
}

// API functions
const api = {
  createBooking: async (bookingData: BookingRequest): Promise<Booking> => {
    try {
      const response = await axiosInstance.post(
        `${API_BASE_URL}/marketplace/vehicles/${bookingData.vehicle}/book/`,
        {
          contact_number: bookingData.contact_number,
          customer_name: bookingData.customer_name,
          customer_email: bookingData.customer_email,
          notes: bookingData.notes
        }
      );
      return response.data.booking;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error('Booking creation error:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers
      });
      throw error;
    }
  },

  getBooking: async (id: string): Promise<Booking> => {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/marketplace/bookings/${id}/`
    );
    return response.data;
  },
};

// React Query hooks
export const useCreateBooking = (options?: {
  onSuccess?: (data: Booking) => void;
  onError?: (error: Error) => void;
}) => {
  const { profile, prefillFormData } = useUserProfile();

  return useMutation({
    mutationFn: async (bookingData: BookingRequest) => {
      // Pre-fill booking data with profile information
      const prefilledData = prefillFormData(bookingData, 'booking');
      return api.createBooking(prefilledData);
    },
    onSuccess: (data) => {
      toast.success('Test ride booking submitted successfully! We will contact you shortly.');
      options?.onSuccess?.(data);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorMessage = axiosError.response?.data?.detail || 
                          axiosError.response?.data?.message || 
                          axiosError.response?.data?.error ||
                          axiosError.message || 
                          'Failed to submit booking';
      toast.error(errorMessage);
      if (options?.onError) {
        options.onError(axiosError as Error);
      }
    },
  });
};

export const useBooking = (id: string) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.getBooking(id),
    enabled: !!id,
    retry: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};

export default api; 