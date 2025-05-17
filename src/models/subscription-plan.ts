/**
 * Represents a subscription plan
 */
export interface SubscriptionPlan {
  id: string | number;
  name: string;
  description: string;
  price: number;
  discounted_price?: number;
  duration: number;
  duration_type: 'day' | 'week' | 'month' | 'year';
  duration_display: string;
  max_services: number;
  max_visits: number;
  features?: string[];
  isPopular?: boolean;
  activeSubscribers?: number;
  status?: 'active' | 'inactive' | 'limited';
  plan_type?: 'standard' | 'premium' | 'basic';
  imageUrl?: string;
  options?: any[];
  recommended?: boolean;
  labour_discount_percent?: number;
}

/**
 * Represents a plan variant
 */
export interface PlanVariant {
  id: string | number;
  plan_id: string | number;
  plan_name: string;
  price: number;
  discounted_price?: number;
  duration: number;
  duration_type: 'day' | 'week' | 'month' | 'year';
  description?: string;
  isPopular?: boolean;
  plan?: any;
  duration_display?: string;
  max_visits?: number;
}

/**
 * Represents a user subscription
 */
export interface UserSubscription {
  id: string | number;
  user_id: string;
  plan_id: string | number;
  plan_name: string;
  plan_type: 'standard' | 'premium' | 'basic';
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'canceled' | 'scheduled';
  services_used: number;
  services_remaining: number;
  price_paid: number;
  payment_method?: string;
  purchase_date: string;
  duration: number;
  duration_type: 'day' | 'week' | 'month' | 'year';
  auto_renew?: boolean;
  next_billing_date?: string;
  remaining_visits?: number;
}

/**
 * Represents a subscription request
 */
export interface SubscriptionRequest {
  id: string | number;
  user_id: string;
  plan_id: string | number;
  plan_name: string;
  request_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  status_display: string;
  price: number;
  discounted_price?: number;
  payment_method?: string;
  rejection_reason?: string;
  duration: number;
  duration_type: 'day' | 'week' | 'month' | 'year';
}

/**
 * Extended subscription request with additional data
 */
export interface ExtendedSubscriptionRequest extends SubscriptionRequest {
  user_name?: string;
  user_email?: string;
  user_phone?: string;
}

/**
 * Extended user subscription with additional data
 */
export interface ExtendedUserSubscription extends UserSubscription {
  visit_count?: number;
  remaining_visits: number;
  upcoming_visits?: any[];
}

/**
 * Legacy Plan interface for backward compatibility
 */
export interface Plan {
  id: number;
  name: string;
  description: string;
  plan_type: string;
  features: string[];
}

/**
 * Visit schedule interface for subscription visits
 */
export interface VisitSchedule {
  id: number;
  subscription: number;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'canceled';
  service_notes?: string;
  service_report?: string;
  created_at: string;
  status_display?: string;
  plan_name?: string;
  technician_notes?: string;
}