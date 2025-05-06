import { useState, useEffect, useCallback } from 'react';
import { UserSubscription, SubscriptionRequest, VisitSchedule } from '../models/subscription-plan';
import { apiService, handleApiError } from '../services/api.service';
import { toast } from 'react-toastify';

interface UseSubscriptionsReturn {
  activeSubscriptions: UserSubscription[];
  approvedRequests: SubscriptionRequest[];
  pendingRequests: SubscriptionRequest[];
  visits: Record<number, VisitSchedule[]>;
  loading: boolean;
  error: string | null;
  refreshSubscriptions: () => void;
  scheduleVisit: (subscriptionId: number, date: string, time: string, notes?: string) => Promise<boolean>;
  cancelVisit: (visitId: number, notes?: string) => Promise<boolean>;
  cancelSubscription: (subscriptionId: number) => Promise<boolean>;
}

export const useSubscriptions = (): UseSubscriptionsReturn => {
  const [activeSubscriptions, setActiveSubscriptions] = useState<UserSubscription[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<SubscriptionRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<SubscriptionRequest[]>([]);
  const [visits, setVisits] = useState<Record<number, VisitSchedule[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshSubscriptions = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Fetch subscriptions and requests
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch active subscriptions
        const subscriptionsData = await apiService.getUserSubscriptions();
        if (isMounted) {
          setActiveSubscriptions(subscriptionsData.filter(sub => sub.status === 'active'));
        
          // Fetch visits for each active subscription
          const visitsData: Record<number, VisitSchedule[]> = {};
          
          await Promise.all(
            subscriptionsData
              .filter(sub => sub.status === 'active')
              .map(async (subscription) => {
                try {
                  const subscriptionVisits = await apiService.getSubscriptionVisits(subscription.id);
                  if (isMounted) {
                    visitsData[subscription.id] = subscriptionVisits;
                  }
                } catch (error) {
                  console.error(`Error fetching visits for subscription ${subscription.id}:`, error);
                }
              })
          );
          
          if (isMounted) {
            setVisits(visitsData);
          }
        }
        
        // Fetch subscription requests
        const requestsData = await apiService.getSubscriptionRequests();
        if (isMounted) {
          setPendingRequests(requestsData.filter(req => req.status === 'pending'));
          setApprovedRequests(requestsData.filter(req => req.status === 'approved'));
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        if (isMounted) {
          setError('Failed to load subscription data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Schedule a visit
  const scheduleVisit = useCallback(async (
    subscriptionId: number, 
    date: string, 
    time: string, 
    notes?: string
  ): Promise<boolean> => {
    try {
      // Format date and time correctly
      const formattedDate = `${date}T${time}`;
      
      // Schedule the visit
      await apiService.scheduleVisit(subscriptionId, formattedDate, notes);
      
      // Refresh data
      refreshSubscriptions();
      
      return true;
    } catch (error) {
      console.error('Error scheduling visit:', error);
      const errorMsg = handleApiError(error);
      toast.error(errorMsg.message || 'Failed to schedule visit. Please try again.');
      return false;
    }
  }, [refreshSubscriptions]);

  // Cancel a visit
  const cancelVisit = useCallback(async (
    visitId: number, 
    notes?: string
  ): Promise<boolean> => {
    try {
      await apiService.cancelVisit(visitId, notes);
      
      // Refresh data
      refreshSubscriptions();
      
      return true;
    } catch (error) {
      console.error('Error cancelling visit:', error);
      const errorMsg = handleApiError(error);
      toast.error(errorMsg.message || 'Failed to cancel visit. Please try again.');
      return false;
    }
  }, [refreshSubscriptions]);

  // Cancel a subscription
  const cancelSubscription = useCallback(async (
    subscriptionId: number
  ): Promise<boolean> => {
    try {
      await apiService.cancelSubscription(subscriptionId);
      
      // Refresh data
      refreshSubscriptions();
      
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      const errorMsg = handleApiError(error);
      toast.error(errorMsg.message || 'Failed to cancel subscription. Please try again.');
      return false;
    }
  }, [refreshSubscriptions]);

  return {
    activeSubscriptions,
    approvedRequests,
    pendingRequests,
    visits,
    loading,
    error,
    refreshSubscriptions,
    scheduleVisit,
    cancelVisit,
    cancelSubscription
  };
};

export default useSubscriptions; 