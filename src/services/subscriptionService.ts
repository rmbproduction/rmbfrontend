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
  // Get active subscription
  getActiveSubscription: async () => {
    return axiosInstance.get(API_ENDPOINTS.subscription.activeSubscription);
  },

  // Get upcoming visits
  getUpcomingVisits: async () => {
    return axiosInstance.get<ScheduledVisit[]>(API_ENDPOINTS.subscription.upcomingVisits);
  },

  // Get subscription status
  getStatus: async (requestId: number) => {
    console.log('Making getStatus request for ID:', requestId);
    const endpoint = API_ENDPOINTS.subscription.requestStatus(requestId.toString());
    console.log('Using endpoint:', endpoint);
    console.log('Full URL:', `${API_CONFIG.baseURL}${endpoint}`);
    
    try {
      const response = await axiosInstance.get<SubscriptionStatusResponse>(endpoint);
      console.log('Raw getStatus response:', response);
      return response;
    } catch (error: any) {
      console.error('getStatus error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request config:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
      throw error;
    }
  },

  // Check visit availability and get available dates
  checkVisitAvailability: async () => {
    return axiosInstance.get<VisitAvailabilityResponse>(API_ENDPOINTS.subscription.checkVisitAvailability);
  },

  // Get available dates for the next 30 days
  getAvailableDates: async () => {
    return axiosInstance.get<{ available_dates: AvailableDate[] }>(API_ENDPOINTS.subscription.availableDates);
  },

  // Get available time slots for a specific date
  getAvailableTimeSlots: async (date: string) => {
    return axiosInstance.get<{ date: string; available_times: TimeSlot[] }>(
      API_ENDPOINTS.subscription.availableTimes,
      { params: { date } }
    );
  },

  // Schedule a visit
  scheduleVisit: async (data: VisitScheduleRequest) => {
    return axiosInstance.post<ScheduledVisit>(API_ENDPOINTS.subscription.scheduleVisit, data);
  },

  // Get visit history
  getVisitHistory: async (subscriptionId?: number) => {
    return axiosInstance.get<{ count: number; results: ScheduledVisit[] }>(
      API_ENDPOINTS.subscription.visitHistory,
      { params: subscriptionId ? { subscription_id: subscriptionId } : undefined }
    );
  },

  // Get visit summary
  getVisitSummary: async () => {
    return axiosInstance.get<VisitSummary>(API_ENDPOINTS.subscription.visitSummary);
  },

  // Create subscription request
  createRequest: async (data: SubscriptionRequest) => {
    return axiosInstance.post(API_ENDPOINTS.subscription.requests, data);
  },

  // Cancel a visit
  cancelVisit: async (visitId: string, data: VisitCancellationRequest) => {
    return axiosInstance.post<ScheduledVisit>(API_ENDPOINTS.subscription.cancelVisit(visitId), data);
  }
};

export default subscriptionService; 