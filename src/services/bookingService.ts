import { axiosInstance } from '../config/api.config';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface BookingRequest {
  contact_number: string;
  notes?: string;
  vehicle_id: string;
}

export interface BookingResponse {
  detail: string;
  booking: Booking;
}

export interface Booking {
  id: string;
  reference: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  status_display: string;
  booking_date: string;
  booking_date_display: string;
  contact_number: string;
  notes?: string;
  vehicle_details: {
    id: string;
    brand: string;
    model: string;
  };
}

// API functions
const api = {
  createBooking: async (bookingData: BookingRequest): Promise<BookingResponse> => {
    try {
      console.log('Creating booking with data:', bookingData);
      
      const response = await axiosInstance.post(
        `${API_BASE_URL}/marketplace/vehicles/${bookingData.vehicle_id}/book/`,
        {
          contact_number: bookingData.contact_number,
          notes: bookingData.notes
        }
      );
      
      console.log('Booking response:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;
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

// Hooks
export const useCreateBooking = () => {
  return useMutation({
    mutationFn: api.createBooking,
    onSuccess: (data) => {
      toast.success('Test ride booking submitted successfully! We will contact you shortly.');
      
      // Store booking data for success modal
      localStorage.setItem('lastBookingData', JSON.stringify({
        reference: data.booking.reference,
        status: data.booking.status,
        contact_number: data.booking.contact_number,
        notes: data.booking.notes,
        vehicle: data.booking.vehicle_details
      }));
    },
    onError: (error: any) => {
      console.error('Booking error:', error);
      const errorMessage = error?.response?.data?.error || 
                         error?.response?.data?.message || 
                         error?.response?.data?.detail ||
                         'Failed to create booking';
      toast.error(errorMessage);
    }
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