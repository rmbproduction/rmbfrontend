import { axiosInstance, API_ENDPOINTS, API_CONFIG } from '../config/api.config';

export interface SubscriptionRequest {
  plan_variant: number;
  vehicle_type: number;
  manufacturer: number;
  vehicle_model: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
}

export interface SubscriptionStatusResponse {
  subscription_request: {
    id: number;
    user: number;
    username: string;
    plan_variant: number;
    plan_name: string;
    duration_type: string;
    price: string;
    discounted_price: string;
    request_date: string;
    status: string;
    status_display: string;
    approval_date: string | null;
    rejection_reason: string | null;
    admin_notes: string | null;
    vehicle_type: number;
    manufacturer: number;
    vehicle_model: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    service_request: number;
    service_request_id: number;
    service_reference: string;
    service_status: string;
  };
  service_request_status: string;
  service_request_reference: string;
  active_subscription: {
    id: number;
    start_date: string;
    end_date: string;
    remaining_visits: number;
    status: string;
  } | null;
}

export interface VisitScheduleRequest {
  preferred_date: string;
  preferred_time: string;
  subscription: number;
  notes?: string;
}

export interface AvailableDate {
  date: string;
  available_slots: number;
}

export interface TimeSlot {
  time: string;
  display_time: string;
}

export interface VisitAvailabilityResponse {
  can_schedule: boolean;
  reason?: string;
  subscription: {
    id: number;
    plan_name: string;
    start_date: string;
    end_date: string;
    status: string;
    remaining_visits: number;
  } | null;
}

export interface ScheduledVisit {
  id: number;
  subscription: number;
  subscription_id: number;
  username: string;
  plan_name: string;
  scheduled_date: string;
  status: string;
  status_display: string;
  service_notes?: string;
  completion_date: string | null;
  technician_notes: string | null;
  created_at: string;
}

export interface VisitSummary {
  subscription: {
    id: number;
    plan_name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  total_visits_allowed: number;
  completed_visits_count: number;
  remaining_visits: number;
  last_visit_date: string | null;
  recent_completed_visits: ScheduledVisit[];
  upcoming_visits: ScheduledVisit[];
}

export interface VisitCancellationRequest {
  cancellation_notes?: string;
}

const subscriptionService = {
  // Get active subscription with better error handling
  getActiveSubscription: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.activeSubscription);
      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: null }; // Return null for no active subscription
      }
      console.error('Error fetching active subscription:', error);
      throw error;
    }
  },

  // Get upcoming visits with validation
  getUpcomingVisits: async () => {
    try {
      const response = await axiosInstance.get<ScheduledVisit[]>(API_ENDPOINTS.subscription.upcomingVisits);
      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [] }; // Return empty array if no visits
      }
      console.error('Error fetching upcoming visits:', error);
      throw error;
    }
  },

  // Get subscription status with detailed error logging
  getStatus: async (requestId: number) => {
    if (!requestId) {
      throw new Error('Request ID is required');
    }

    try {
      const endpoint = API_ENDPOINTS.subscription.requestStatus(requestId.toString());
      console.log('Calling endpoint:', endpoint);
      
      const response = await axiosInstance.get(endpoint);
      return response;
    } catch (error: any) {
      console.error('getStatus error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        requestId
      });
      throw error;
    }
  },

  // Check visit availability with retry logic
  checkVisitAvailability: async (retryCount = 3) => {
    let lastError;
    for (let i = 0; i < retryCount; i++) {
      try {
        return await axiosInstance.get<VisitAvailabilityResponse>(
          API_ENDPOINTS.subscription.checkVisitAvailability
        );
      } catch (error: any) {
        lastError = error;
        if (error.response?.status !== 503) { // Don't retry if not a service error
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
    throw lastError;
  },

  // Get available dates with validation
  getAvailableDates: async () => {
    try {
      const response = await axiosInstance.get<{ available_dates: AvailableDate[] }>(
        API_ENDPOINTS.subscription.availableDates
      );
      
      // Validate dates are in the future
      const now = new Date();
      response.data.available_dates = response.data.available_dates.filter(date => 
        new Date(date.date) > now
      );
      
      return response;
    } catch (error: any) {
      console.error('Error fetching available dates:', error);
      throw error;
    }
  },

  // Get available time slots with parameter validation
  getAvailableTimeSlots: async (date: string, subscriptionId: number) => {
    if (!date || !subscriptionId) {
      throw new Error('Date and subscription ID are required');
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date format');
    }

    // Format date to ensure consistent format (YYYY-MM-DD)
    const formattedDate = dateObj.toISOString().split('T')[0];
    
    try {
      const response = await axiosInstance.get<{ date: string; available_times: TimeSlot[] }>(
        API_ENDPOINTS.subscription.availableTimes,
        { 
          params: { 
            date: formattedDate,
            subscription: subscriptionId
          } 
        }
      );

      // Filter out past times if date is today
      if (formattedDate === new Date().toISOString().split('T')[0]) {
        const now = new Date();
        response.data.available_times = response.data.available_times.filter(slot => {
          const [hours, minutes] = slot.time.split(':');
          const slotTime = new Date();
          slotTime.setHours(parseInt(hours), parseInt(minutes));
          return slotTime > now;
        });
      }

      return response;
    } catch (error: any) {
      console.error('Error fetching time slots:', {
        date: formattedDate,
        subscriptionId,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  },

  // Schedule visit with comprehensive validation
  scheduleVisit: async (data: VisitScheduleRequest) => {
    // Validate required fields
    if (!data.preferred_date || !data.preferred_time || !data.subscription) {
      throw new Error('Date, time and subscription ID are required');
    }

    // Validate date is in the future
    const visitDate = new Date(`${data.preferred_date}T${data.preferred_time}`);
    if (visitDate <= new Date()) {
      throw new Error('Visit must be scheduled for a future date and time');
    }

    try {
      const response = await axiosInstance.post<ScheduledVisit>(
        API_ENDPOINTS.subscription.scheduleVisit,
        data
      );
      return response;
    } catch (error: any) {
      console.error('Error scheduling visit:', {
        data,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  },

  // Get visit history with pagination support
  getVisitHistory: async (subscriptionId?: number, page = 1, limit = 10) => {
    try {
      const params: any = { page, limit };
      if (subscriptionId) {
        params.subscription_id = subscriptionId;
      }

      return await axiosInstance.get<{ count: number; results: ScheduledVisit[] }>(
        API_ENDPOINTS.subscription.visitHistory,
        { params }
      );
    } catch (error: any) {
      console.error('Error fetching visit history:', error);
      throw error;
    }
  },

  // Get visit summary with error handling
  getVisitSummary: async () => {
    try {
      return await axiosInstance.get<VisitSummary>(API_ENDPOINTS.subscription.visitSummary);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: null }; // Return null if no summary available
      }
      console.error('Error fetching visit summary:', error);
      throw error;
    }
  },

  // Create subscription request
  createRequest: async (data: SubscriptionRequest) => {
    return axiosInstance.post(API_ENDPOINTS.subscription.requests, data);
  },

  // Cancel visit with validation
  cancelVisit: async (visitId: string, data: VisitCancellationRequest) => {
    if (!visitId) {
      throw new Error('Visit ID is required');
    }

    try {
      return await axiosInstance.post<ScheduledVisit>(
        API_ENDPOINTS.subscription.cancelVisit(visitId),
        data
      );
    } catch (error: any) {
      console.error('Error cancelling visit:', {
        visitId,
        data,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }
};

export default subscriptionService; 