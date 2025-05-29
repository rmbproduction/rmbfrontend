import React, { useEffect, useState } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import TokenManager from '../../services/tokenManager';
import subscriptionService from '../../services/subscriptionService';
import CancelVisitModal from './CancelVisitModal';

interface SubscriptionStatusData {
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
  active_subscription: any | null;
}

interface ActiveSubscriptionData {
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

interface UpcomingVisit {
  id: number;
  scheduled_date: string;
  status: string;
  service_notes?: string;
}

const SubscriptionOverview: React.FC = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusData | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscriptionData | null>(null);
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<UpcomingVisit | null>(null);

  const fetchSubscriptionStatus = async () => {
    const requestId = 10; // Updated to use ID 10 as per your request
    try {
      console.log('Fetching subscription status for request ID:', requestId);
      
      const token = TokenManager.getAccessToken();
      if (!token) {
        console.error('No authentication token found');
        setError('Authentication required');
        return null;
      }
      console.log('Using token:', token.substring(0, 20) + '...');

      // Log the full URL being called
      const endpoint = `/subscription/subscription-requests/${requestId}/status/`;
      console.log('Calling endpoint:', endpoint);

      const statusRes = await subscriptionService.getStatus(requestId);
      console.log('Subscription status response:', statusRes.data);
      setSubscriptionStatus(statusRes.data);
      return statusRes.data;
    } catch (err: any) {
      console.error('Error fetching subscription status:', err);
      console.error('Error response:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers
      });
      
      // Only show toast for critical errors
      if (err.response?.status === 404) {
        setError(`Subscription request #${requestId} not found`);
      } else if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Access denied');
      } else {
        // For other errors, just set the error state without showing a toast
        setError('Unable to load subscription status');
      }
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Initial data fetch started');

        // First fetch subscription status - this is critical data
        const statusRes = await fetchSubscriptionStatus();
        if (!statusRes) {
          // Critical data failed to load - error already handled in fetchSubscriptionStatus
          setLoading(false);
          return;
        }
        console.log('Subscription status fetch completed:', statusRes);

        // Then fetch non-critical data
        try {
          const [activeSubRes, visitsRes] = await Promise.all([
            subscriptionService.getActiveSubscription(),
            subscriptionService.getUpcomingVisits()
          ]);

          console.log('Active subscription response:', activeSubRes);
          console.log('Upcoming visits response:', visitsRes);

          if (activeSubRes?.data) {
            console.log('Setting active subscription data:', activeSubRes.data);
            setActiveSubscription(activeSubRes.data);
          }

          if (visitsRes?.data) {
            console.log('Setting upcoming visits data:', visitsRes.data);
            setUpcomingVisits(visitsRes.data);
          }
        } catch (nonCriticalErr) {
          // Log but don't show toast for non-critical data failures
          console.error('Error fetching non-critical data:', nonCriticalErr);
        }
      } catch (err: any) {
        console.error('Error in initial fetch:', err);
        setError('Failed to fetch subscription data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh data after visit cancellation
  const handleVisitCancelled = async () => {
    try {
      const [activeSubRes, visitsRes] = await Promise.all([
        subscriptionService.getActiveSubscription(),
        subscriptionService.getUpcomingVisits()
      ]);

      if (activeSubRes?.data) {
        setActiveSubscription(activeSubRes.data);
      }

      if (visitsRes?.data) {
        setUpcomingVisits(visitsRes.data);
      }
    } catch (err: any) {
      console.error('Error refreshing data:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Subscription Status Section - Move this to the top */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Status</h2>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : subscriptionStatus ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(subscriptionStatus.subscription_request.status)}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {subscriptionStatus.subscription_request.status_display || 
                         subscriptionStatus.subscription_request.status.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Reference Number</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {subscriptionStatus.subscription_request.service_reference}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Plan Details</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {subscriptionStatus.subscription_request.plan_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {subscriptionStatus.subscription_request.duration_type}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Price: ₹{subscriptionStatus.subscription_request.price}
                    {subscriptionStatus.subscription_request.discounted_price && 
                     ` (Discounted: ₹${subscriptionStatus.subscription_request.discounted_price})`}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Request Date</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatDate(subscriptionStatus.subscription_request.request_date)}
                  </p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{subscriptionStatus.subscription_request.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{subscriptionStatus.subscription_request.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{subscriptionStatus.subscription_request.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">
                      {subscriptionStatus.subscription_request.address}, 
                      {subscriptionStatus.subscription_request.city}, 
                      {subscriptionStatus.subscription_request.state} - 
                      {subscriptionStatus.subscription_request.postal_code}
                    </p>
                  </div>
                </div>
              </div>

              {subscriptionStatus.subscription_request.rejection_reason && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-red-800">Rejection Reason</h3>
                  <p className="mt-2 text-sm text-red-700">
                    {subscriptionStatus.subscription_request.rejection_reason}
                  </p>
                </div>
              )}

              {subscriptionStatus.subscription_request.admin_notes && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800">Admin Notes</h3>
                  <p className="mt-2 text-sm text-blue-700">
                    {subscriptionStatus.subscription_request.admin_notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 text-gray-600 p-6 rounded-lg text-center">
              No subscription request status found.
            </div>
          )}
        </div>
      </div>

      {/* Active Subscription Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Subscription</h2>
          {activeSubscription ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Plan</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">{activeSubscription.plan_name}</p>
                <p className="text-sm text-gray-500">{activeSubscription.plan_type}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">{activeSubscription.duration_type}</p>
                <p className="text-sm text-gray-500">{activeSubscription.remaining_days} days remaining</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Visits</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {activeSubscription.remaining_visits} / {activeSubscription.max_visits}
                </p>
                <p className="text-sm text-gray-500">remaining visits</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Valid Until</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {new Date(activeSubscription.end_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">expiry date</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 text-gray-600 p-6 rounded-lg text-center">
              No active subscription found. 
              <Link to="/pricing" className="text-orange-600 hover:text-orange-700 ml-2">
                View available plans
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Visits Section */}
      {activeSubscription && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Visits</h2>
              {activeSubscription.remaining_visits > 0 && (
                <Link
                  to="/subscription/schedule"
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                >
                  Schedule Visit
                </Link>
              )}
            </div>

            {upcomingVisits.length > 0 ? (
              <div className="space-y-4">
                {upcomingVisits.map((visit) => (
                  <div key={visit.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(visit.scheduled_date).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {visit.service_notes && (
                          <p className="text-sm text-gray-500 mt-1">{visit.service_notes}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                          {visit.status}
                        </span>
                        <button
                          onClick={() => setSelectedVisit(visit)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming visits scheduled</p>
            )}
          </div>
        </div>
      )}

      {/* Cancel Visit Modal */}
      {selectedVisit && (
        <CancelVisitModal
          visitId={selectedVisit.id}
          visitDate={selectedVisit.scheduled_date}
          onClose={() => setSelectedVisit(null)}
          onCancelled={handleVisitCancelled}
        />
      )}
    </div>
  );
};

export default SubscriptionOverview; 