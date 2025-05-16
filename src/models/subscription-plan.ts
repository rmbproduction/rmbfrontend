/**
 * Subscription plan models
 */

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  recommended?: boolean;
  labour_discount_percent?: number;
  options: SubscriptionOption[];
  plan_type?: string;
  features?: string[];
}

export interface SubscriptionOption {
  id: number;
  duration: string;
  price: string;
  original_price?: string;
  max_services: number;
  discount_percent?: number;
  services: any[];
}

export interface Plan {
  id: number;
  name: string;
  description: string;
  plan_type: string;
  features: string[];
}

export interface PlanVariant {
  id: number;
  plan: number;
  name: string;
  duration: number;
  duration_display: string;
  price: number;
  discounted_price: number | null;
  max_visits: number;
}

export interface SubscriptionRequest {
  id: number;
  plan_variant: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  vehicle_type?: number;
  manufacturer?: number;
  vehicle_model?: number;
  schedule_date?: string;
  schedule_time?: string;
}

export interface UserSubscription {
  id: number;
  user: number;
  plan_variant: PlanVariant;
  start_date: string;
  end_date: string;
  remaining_visits: number;
  status: 'active' | 'canceled' | 'expired';
  has_upcoming_visits: boolean;
}

export interface VisitSchedule {
  id: number;
  subscription: number;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'canceled';
  service_notes?: string;
  service_report?: string;
  created_at: string;
}