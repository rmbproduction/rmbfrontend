import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import subscriptionService from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionData {
  id: number;
  plan_name: string;
  plan_type: string;
  duration_type: string;
  start_date: string;
  end_date: string;
  remaining_visits: number;
  max_visits: number;
  status: string;
  is_currently_active: boolean;
  remaining_days: number;
}

interface ScheduledVisit {
  id: number;
  subscription: number;
  scheduled_date: string;
  status: string;
  service_notes?: string;
}

interface SubscriptionResponse {
  data: SubscriptionData;
}

interface VisitsResponse {
  data: ScheduledVisit[];
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  upcomingVisits: ScheduledVisit[];
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { 
    data: subscription, 
    isLoading: subscriptionLoading,
    error: subscriptionError 
  } = useQuery<SubscriptionData | null>({
    queryKey: ['activeSubscription'],
    queryFn: async (): Promise<SubscriptionData | null> => {
      try {
        const response = await subscriptionService.getActiveSubscription() as SubscriptionResponse;
      return response.data;
      } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Cache for 30 minutes
    enabled: isAuthenticated, // Only fetch if user is authenticated
    retry: false // Don't retry on failure
  });

  const { 
    data: upcomingVisits = [], 
    isLoading: visitsLoading,
    error: visitsError 
  } = useQuery<ScheduledVisit[]>({
    queryKey: ['upcomingVisits'],
    queryFn: async (): Promise<ScheduledVisit[]> => {
      try {
        const response = await subscriptionService.getUpcomingVisits() as VisitsResponse;
      return response.data;
      } catch (error) {
        console.error('Error fetching visits:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Cache for 30 minutes
    enabled: !!subscription && isAuthenticated, // Only fetch if there's an active subscription and user is authenticated
    retry: false // Don't retry on failure
  });

  const refreshSubscription = async () => {
    if (!isAuthenticated) return; // Don't refresh if not authenticated
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['activeSubscription'] }),
      queryClient.invalidateQueries({ queryKey: ['upcomingVisits'] })
    ]);
  };

  const value: SubscriptionContextType = {
    subscription: subscription || null,
    upcomingVisits,
    loading: subscriptionLoading || visitsLoading,
    error: subscriptionError?.message || visitsError?.message || null,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 