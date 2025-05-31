import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import subscriptionService from '../services/subscriptionService';

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

  const { 
    data: subscription, 
    isLoading: subscriptionLoading,
    error: subscriptionError 
  } = useQuery<SubscriptionData | null, Error>({
    queryKey: ['activeSubscription'],
    queryFn: async () => {
      const response = await subscriptionService.getActiveSubscription();
      return response.data;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const { 
    data: upcomingVisits = [], 
    isLoading: visitsLoading,
    error: visitsError 
  } = useQuery<ScheduledVisit[], Error>({
    queryKey: ['upcomingVisits'],
    queryFn: async () => {
      const response = await subscriptionService.getUpcomingVisits();
      return response.data;
    },
    staleTime: 30000,
    gcTime: 1000 * 60 * 5,
    enabled: !!subscription, // Only fetch visits if there's an active subscription
  });

  const refreshSubscription = async () => {
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