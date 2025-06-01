import { axiosInstance } from '../config/api.config';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

// Request type matching the exact API contract
export interface BookingRequest {
  contact_number: string;
  notes?: string;
}

// Response types matching the exact API contract
interface VehicleDisplayPrice {
  amount: number;
  currency: string;
  formatted: string;
  emi_available: boolean;
  emi_starting_at: string;
}

interface VehicleDetails {
  id: number;
  vehicle_type: string;
  vehicle_type_display: string;
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  kms_driven: number;
  Mileage: string;
  fuel_type: string;
  engine_capacity: number;
  color: string;
  last_service_date: string | null;
  insurance_valid_till: string | null;
  status: string;
  status_display: string;
  short_description: string;
  display_price: VehicleDisplayPrice;
  front_image_url: string;
  back_image_url: string;
  left_image_url: string;
  right_image_url: string;
  dashboard_image_url: string;
  features: string[];
  condition_rating: number | null;
  price: string;
  expected_price: string;
  bookable: boolean;
  is_bookable: boolean;
}

export interface BookingResponse {
  detail: string;
  booking: {
    id: number;
    vehicle: number;
    vehicle_details: VehicleDetails;
    user: number;
    user_name: string;
    status: string;
    status_display: string;
    booking_date: string;
    booking_date_display: string;
    contact_number: string;
    notes: string;
  };
}

// API functions
const api = {
  createBooking: async (bookingData: BookingRequest & { vehicle_id: string }): Promise<BookingResponse> => {
    try {
      // Validate contact number format
      const contactNumberRegex = /^\+?[1-9]\d{9,14}$/;
      if (!contactNumberRegex.test(bookingData.contact_number)) {
        throw new Error('Invalid contact number format. Please enter a valid phone number with country code.');
      }

      // Make the booking request with exact API endpoint format
      const response = await axiosInstance.post(
        `marketplace/vehicles/${bookingData.vehicle_id}/book/`,
        {
          contact_number: bookingData.contact_number
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      console.error('Booking creation error:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers,
        url: axiosError.config?.url,
        requestData: axiosError.config?.data
      });
      
      // Throw the exact error message from the API
      if (axiosError.response?.data?.detail) {
        throw new Error(axiosError.response.data.detail);
      }
      
      throw error;
    }
  },

  getBooking: async (id: string): Promise<BookingResponse['booking']> => {
    const response = await axiosInstance.get(`marketplace/bookings/${id}/`);
    return response.data;
  },
};

// Hooks
export const useCreateBooking = () => {
  return useMutation({
    mutationFn: api.createBooking,
    onSuccess: (data) => {
      // Use the exact success message from the API
      toast.success(data.detail);
      
      // Store booking data for success modal
      localStorage.setItem('lastBookingData', JSON.stringify({
        reference: data.booking.id.toString(),
        status: data.booking.status,
        status_display: data.booking.status_display,
        contact_number: data.booking.contact_number,
        notes: data.booking.notes,
        vehicle: data.booking.vehicle_details,
        booking_date_display: data.booking.booking_date_display
      }));
    },
    onError: (error: any) => {
      console.error('Booking error:', error);
      // Use the exact error message from the API
      const errorMessage = error?.response?.data?.detail || error.message || 'Failed to create booking';
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