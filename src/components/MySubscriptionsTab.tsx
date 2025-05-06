import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Check, Clock, ShoppingBag, AlertCircle, X, Info, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { UserSubscription, VisitSchedule, SubscriptionRequest } from '../models/subscription-plan';
import { handleApiError } from '../services/api.service';
import ScheduleVisitModal from './ScheduleVisitModal';
import VisitCard from './VisitCard';
import useSubscriptions from '../hooks/useSubscriptions';

// Extended interfaces with timestamp property
interface ExtendedUserSubscription extends UserSubscription {
  timestamp?: number;
}

interface ExtendedSubscriptionRequest extends SubscriptionRequest {
  timestamp?: number;
}

const MySubscriptionsTab: React.FC = () => {
  // Use the subscription hook for centralized data management
  const { 
    activeSubscriptions, 
    approvedRequests, 
    pendingRequests, 
    visits, 
    loading, 
    error, 
    refreshSubscriptions,
    cancelVisit,
    cancelSubscription
  } = useSubscriptions();

  // Convert to extended interfaces with timestamp
  const [subscriptions, setSubscriptions] = useState<ExtendedUserSubscription[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<ExtendedSubscriptionRequest[]>([]);
  
  // State for visit scheduling
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Use refs to prevent race conditions
  const subscriptionsRef = useRef<ExtendedUserSubscription[]>([]);
  const subscriptionRequestsRef = useRef<ExtendedSubscriptionRequest[]>([]);
  
  // Update refs when state changes
  useEffect(() => {
    subscriptionsRef.current = subscriptions;
  }, [subscriptions]);
  
  useEffect(() => {
    subscriptionRequestsRef.current = subscriptionRequests;
  }, [subscriptionRequests]);

  // Update local state from hook data
  useEffect(() => {
    // Add timestamp property to subscriptions
    const extendedSubscriptions = activeSubscriptions.map(sub => ({
      ...sub,
      timestamp: Date.now()
    }));
    setSubscriptions(extendedSubscriptions);
    
    // Combine approved and pending requests with timestamp
    const allRequests = [
      ...approvedRequests.map(req => ({ ...req, timestamp: Date.now() })),
      ...pendingRequests.map(req => ({ ...req, timestamp: Date.now() }))
    ];
    setSubscriptionRequests(allRequests);
  }, [activeSubscriptions, approvedRequests, pendingRequests]);
  
  // Safely update session storage
  const updateSessionStorage = useCallback((key: string, data: any) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('[ERROR] Failed to update session storage:', error);
      return false;
    }
  }, []);

  // Handle subscription cancellation with local state update
  const handleCancelSubscription = async (subscriptionId: number) => {
    const confirmed = window.confirm('Are you sure you want to cancel this subscription? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      const success = await cancelSubscription(subscriptionId);
      
      if (success) {
        // Update the subscription in the UI (will be handled by the hook's effect)
        toast.success('Subscription cancelled successfully');
      } else {
        toast.error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  // Schedule a visit
  const handleScheduleVisit = (subscription: UserSubscription) => {
    if (!subscription.remaining_visits || subscription.remaining_visits <= 0) {
      toast.error('No remaining visits available for this subscription');
      return;
    }
    
    if (subscription.status !== 'active') {
      toast.error('This subscription is not active');
      return;
    }
    
    console.log('Scheduling visit for subscription:', subscription);
    setSelectedSubscription(subscription);
    setShowScheduleModal(true);
  };
  
  // Handle visit cancellation (use the hook's cancelVisit function)
  const handleCancelVisit = async (visitId: number) => {
    try {
      console.log('Cancelling visit:', visitId);
      const success = await cancelVisit(visitId);
      
      if (success) {
        console.log('Visit cancelled successfully');
        toast.success('Visit cancelled successfully');
      } else {
        toast.error('Failed to cancel visit');
      }
    } catch (error) {
      console.error('Error cancelling visit:', error);
      toast.error('Failed to cancel visit: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Helper function to format date strings
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render an error message
  const renderError = () => (
    <div className="text-center py-8">
      <div className="bg-red-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Subscriptions</h3>
      <p className="text-gray-500 mb-4">{error || 'Could not load your subscription data.'}</p>
      <button 
        onClick={refreshSubscriptions}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#FF5733] hover:bg-[#ff4019]"
      >
        Try Again
      </button>
    </div>
  );

  // Render loading state
  const renderLoading = () => (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF5733]"></div>
      <span className="ml-3 text-gray-600">Loading subscriptions...</span>
    </div>
  );

  // Render no subscriptions message
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="bg-gray-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
        <ShoppingBag className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">No Subscriptions Found</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        You don't have any active subscription plans yet.
        Check out our subscription plans to enjoy regular bike services at a discounted price.
      </p>
      <a 
        href="/pricing" 
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#FF5733] hover:bg-[#ff4019]"
      >
        View Subscription Plans
      </a>
    </div>
  );

  // Render subscription requests
  const renderSubscriptionRequestCard = (request: ExtendedSubscriptionRequest) => {
    return (
      <motion.div
        key={request.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-4"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{request.plan_name}</h3>
              <span className={`ml-2 px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                {request.status_display}
              </span>
            </div>
            <p className="text-gray-600">{request.duration_type} subscription</p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">Requested on</p>
            <p className="font-medium">{formatDate(request.request_date)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Regular Price</p>
            <p className="font-semibold">₹{request.price}</p>
          </div>
          
          {request.discounted_price && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Discounted Price</p>
              <p className="font-semibold">₹{request.discounted_price}</p>
            </div>
          )}
        </div>
        
        {request.status === 'pending' && (
          <div className="bg-yellow-50 p-3 rounded-lg flex items-start">
            <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              Your subscription request is pending approval. We'll notify you once it's approved.
            </p>
          </div>
        )}
        
        {request.status === 'approved' && (
          <div className="bg-green-50 p-3 rounded-lg flex items-start">
            <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-green-600" />
            <p className="text-sm text-green-700">
              Your subscription request has been approved! Your subscription is now active.
            </p>
          </div>
        )}
        
        {request.status === 'rejected' && request.rejection_reason && (
          <div className="bg-red-50 p-3 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-700">Your subscription request was rejected</p>
              <p className="text-sm text-red-700 mt-1">{request.rejection_reason}</p>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Render subscription card
  const renderSubscriptionCard = (subscription: ExtendedUserSubscription) => {
    // Get visits with fallback to empty array
    const subscriptionVisits = visits[subscription.id] || [];
    console.log(`Visits for subscription ${subscription.id}:`, subscriptionVisits);
    
    // Split visits by status with safe checks
    const upcomingVisits = subscriptionVisits.filter(visit => 
      visit && visit.status === 'scheduled'
    );
    const pastVisits = subscriptionVisits.filter(visit => 
      visit && (visit.status === 'completed' || visit.status === 'cancelled')
    );
    
    // Calculate total visits
    const totalVisitsCompleted = pastVisits.filter(visit => visit.status === 'completed').length;
    const totalVisits = subscription.remaining_visits + totalVisitsCompleted;
    
    return (
      <div key={subscription.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
          <div>
            <div className="flex items-center mb-1">
              <ShoppingBag className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-xl font-semibold text-gray-900">{subscription.plan_name}</h3>
              <span className={`ml-2 px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                {subscription.status.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 mb-2">{subscription.plan_type} Plan</p>
          </div>
          
          <div className="mt-2 md:mt-0 flex flex-wrap gap-2">
            {subscription.remaining_visits > 0 && (
              <button
                onClick={() => handleScheduleVisit(subscription)}
                className="px-4 py-2 bg-[#FF5733] text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Schedule Visit
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Plan Duration</p>
            <p className="font-semibold">{subscription.duration_type}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Remaining Visits</p>
            <p className="font-semibold">{subscription.remaining_visits} / {totalVisits}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Valid Until</p>
            <p className="font-semibold">{formatDate(subscription.end_date)}</p>
          </div>
        </div>
        
        {/* Upcoming Visits Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-md font-semibold text-gray-900 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-600" />
              Upcoming Visits ({upcomingVisits.length})
            </h4>
          </div>
          
          {upcomingVisits.length > 0 ? (
            <div className="space-y-3">
              {upcomingVisits.map(visit => (
                <VisitCard 
                  key={visit.id} 
                  visit={visit} 
                  onCancelVisit={handleCancelVisit} 
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm p-3 bg-gray-50 rounded-lg">
              No upcoming visits scheduled. 
              {subscription.remaining_visits > 0 && " Click on 'Schedule Visit' to book a service visit."}
            </p>
          )}
        </div>
        
        {/* Past Visits Section */}
        {pastVisits.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-semibold text-gray-900 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-600" />
                Past Visits ({pastVisits.length})
              </h4>
            </div>
            
            <div className="space-y-3">
              {pastVisits.map(visit => (
                <VisitCard 
                  key={visit.id} 
                  visit={visit} 
                  onCancelVisit={handleCancelVisit} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">My Subscriptions</h3>
          <button 
            onClick={refreshSubscriptions}
            className="text-sm text-[#FF5733] hover:underline"
          >
            Refresh
          </button>
        </div>
        
        {loading ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : subscriptions.length === 0 && subscriptionRequests.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Active Subscriptions Section */}
            {subscriptions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Active Subscriptions</h2>
                {subscriptions.map(subscription => renderSubscriptionCard(subscription))}
              </div>
            )}
            
            {/* Subscription Requests Section */}
            {subscriptionRequests.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Requests</h2>
                {subscriptionRequests.map(request => renderSubscriptionRequestCard(request))}
              </div>
            )}
            
            {/* Schedule Visit Modal */}
            {showScheduleModal && selectedSubscription && (
              <ScheduleVisitModal
                subscription={selectedSubscription}
                onClose={() => setShowScheduleModal(false)}
                onSuccess={refreshSubscriptions}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MySubscriptionsTab; 