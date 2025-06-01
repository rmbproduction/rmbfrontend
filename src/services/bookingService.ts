import { axiosInstance, API_CONFIG } from '../config/api.config';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

export interface BookingRequest {
  contact_number: string;
  notes?: string;
  vehicle_id: string;
}

export interface BookingResponse {
  detail: string;
  booking: {
    id: number;
    reference: string;
    status: string;
    contact_number: string;
    notes?: string;
    vehicle_details: {
      id: string;
      brand: string;
      model: string;
    };
  };
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
      // Validate contact number format
      const contactNumberRegex = /^\+?[1-9]\d{9,14}$/;
      if (!contactNumberRegex.test(bookingData.contact_number)) {
        throw new Error('Invalid contact number format. Please enter a valid phone number with country code.');
      }

      // First check if the vehicle is available for booking
      const vehicleResponse = await axiosInstance.get(
        API_CONFIG.getApiUrl(`marketplace/vehicles/${bookingData.vehicle_id}/`)
      );
      
      const vehicle = vehicleResponse.data;
      if (!vehicle.bookable || !vehicle.is_bookable || vehicle.status === 'under_inspection') {
        throw new Error('This vehicle is not available for booking at the moment.');
      }
      
      // If validation passes, proceed with booking
      const response = await axiosInstance.post(
        API_CONFIG.getApiUrl(`marketplace/vehicles/${bookingData.vehicle_id}/book/`),
        {
          contact_number: bookingData.contact_number,
          notes: bookingData.notes
        }
      );
      
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
      API_CONFIG.getApiUrl(`marketplace/bookings/${id}/`)
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
                         error.message ||
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