// Original models - keep for backward compatibility
export interface PlanService {
  id: number;
  service_name: string;
  order: number;
}

export interface SubscriptionPlanOption {
  id: number;
  duration: string;
  price: string;
  original_price?: string;
  max_services: number;
  discount_percent?: number;
  services: PlanService[];
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  recommended: boolean;
  labour_discount_percent: number;
  options: SubscriptionPlanOption[];
  price?: string;
  duration?: string;
  max_services?: number;
  
  // Added properties for new API compatibility
  plan_type?: 'basic' | 'premium';
  features?: string[];
  discounted_price?: number | string;
  duration_display?: string;
  max_visits?: number;
}

// New models for subscription_plan app
export interface Plan {
  id: number;
  name: string;
  plan_type: 'basic' | 'premium';
  description: string;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanVariant {
  id: number;
  plan: number;
  plan_name: string;
  plan_type: string;
  duration_type: 'quarterly' | 'half_yearly' | 'yearly';
  duration_display: string;
  price: number;
  discounted_price: number | null;
  max_visits: number;
  is_active: boolean;
}

export interface SubscriptionRequest {
  id: number;
  user: number;
  username: string;
  plan_variant: number;
  plan_name: string;
  duration_type: string;
  price: string;
  discounted_price?: string;
  request_date: string;
  status: 'pending' | 'approved' | 'rejected';
  status_display: string;
  approval_date?: string;
  rejection_reason?: string;
  admin_notes?: string;
  
  // Vehicle information
  vehicle_type?: number;
  manufacturer?: number;
  vehicle_model?: number;
  
  // Customer information
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  
  // Schedule information
  schedule_date?: string;
  schedule_time?: string;
  
  // Service request relation
  service_request?: number;
  service_request_id?: number;
  service_reference?: string;
  service_status?: string;
}

export interface UserSubscription {
  id: number;
  user: number;
  username: string;
  plan_variant: number;
  plan_name: string;
  plan_type: string;
  duration_type: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  remaining_visits: number;
  last_visit_date: string | null;
  is_currently_active: boolean;
  remaining_days: number;
  created_at: string;
}

export interface VisitSchedule {
  id: number;
  subscription: number;
  subscription_id: number;
  username: string;
  plan_name: string;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  status_display: string;
  service_notes: string | null;
  completion_date: string | null;
  technician_notes: string | null;
  created_at: string;
}