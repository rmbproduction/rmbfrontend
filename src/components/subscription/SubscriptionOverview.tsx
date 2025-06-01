import React, { useEffect, useState } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, User, MapPin, Package, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import TokenManager from '../../services/tokenManager';
import subscriptionService from '../../services/subscriptionService';
import CancelVisitModal from './CancelVisitModal';
import { Tab } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosInstance, API_ENDPOINTS, API_CONFIG } from '../../config/api.config';
import { AxiosError } from 'axios';
import ScheduleVisitModal from './ScheduleVisitModal';
import { format } from 'date-fns';
import RescheduleVisitModal from './RescheduleVisitModal';
import VisitHistoryAccordion from './VisitHistoryAccordion';
import ForSaleVehicles from '../ForSaleVehicles';

interface SubscriptionRequest {
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
  rejection_reason: string;
  admin_notes: string;
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
}

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

interface ActiveSubscriptionResponse {
  id: number;
  user: number;
  username: string;
  plan_variant: number;
  plan_name: string;
  plan_type: string;
  duration_type: string;
  start_date: string;
  end_date: string;
  status: string;
  status_display: string;
  remaining_visits: number;
  max_visits: number;
  last_visit_date: string | null;
  is_currently_active: boolean;
  remaining_days: number;
  created_at: string;
}

interface UpcomingVisit {
  id: number;
  subscription: number;
  subscription_id: number;
  username: string;
  plan_name: string;
  scheduled_date: string;
  status: string;
  status_display: string;
  service_notes?: string;
  completion_date: null | string;
  technician_notes: null | string;
  created_at: string;
}

interface VisitHistoryItem {
  id: number;
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

const SubscriptionOverview: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusData | null>(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState<ActiveSubscriptionResponse[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [visitHistory, setVisitHistory] = useState<VisitHistoryItem[]>([]);
  const [loading, setLoading] = useState({
    requests: true,
    subscriptions: true,
    visits: true,
    history: false
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<UpcomingVisit | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [selectedVisitForReschedule, setSelectedVisitForReschedule] = useState<UpcomingVisit | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [visitSummary, setVisitSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchSubscriptionRequests = async () => {
    try {
      const response = await axiosInstance.get('/subscription/subscription-requests/');
      setSubscriptionRequests(response.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.error('Error fetching subscription requests:', err);
        if (err.response?.status === 404) {
          setSubscriptionRequests([]);
        }
      }
    }
  };

  const fetchSubscriptionStatus = async (requestId: number) => {
    try {
      const statusRes = await subscriptionService.getStatus(requestId);
      if (statusRes?.data) {
        setSubscriptionStatus(statusRes.data);
        if (statusRes.data.active_subscription) {
          setActiveSubscriptions([statusRes.data.active_subscription]);
        }
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.error('Error fetching subscription status:', err);
      }
    }
  };

  const fetchActiveSubscriptions = async () => {
    try {
      const response = await axiosInstance.get('/subscription/subscriptions/active/');
      setActiveSubscriptions(response.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        if (err.response?.status !== 404) {
          console.error('Error fetching active subscriptions:', err);
        }
        setActiveSubscriptions([]);
      }
    }
  };

  const fetchUpcomingVisits = async (showLoading = true) => {
    if (showLoading) {
      setLoading(prev => ({ ...prev, visits: true }));
    }
    try {
      console.log('Fetching upcoming visits...');
      const response = await axiosInstance.get('/subscription/visits/upcoming/');
      console.log('Visits response:', response);
      if (response?.data) {
        setUpcomingVisits(response.data);
      }
    } catch (err) {
      console.error('Error fetching visits:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        status: err instanceof AxiosError ? err.response?.status : undefined,
        data: err instanceof AxiosError ? err.response?.data : undefined
      });
      if (err instanceof AxiosError && err.response?.status !== 404) {
        setError('Failed to fetch upcoming visits');
      }
      // If it's a 404, set empty visits array
      if (err instanceof AxiosError && err.response?.status === 404) {
        setUpcomingVisits([]);
      }
    } finally {
      setLoading(prev => ({ ...prev, visits: false }));
    }
  };

  const fetchVisitHistory = async () => {
    console.log('Fetching visit history...');
    setLoadingHistory(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.visitHistory);
      console.log('Visit history response:', response);
      if (response?.data?.results) {
        setVisitHistory(response.data.results);
      }
    } catch (err) {
      console.error('Error fetching visit history:', err);
      setVisitHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchVisitSummary = async () => {
    console.log('Fetching visit summary...');
    setLoadingSummary(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.visitSummary);
      console.log('Visit summary response:', response);
      if (response?.data) {
        setVisitSummary(response.data);
      }
    } catch (err) {
      console.error('Error fetching visit summary:', err);
      setVisitSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          fetchSubscriptionRequests(),
          fetchActiveSubscriptions(),
          fetchUpcomingVisits(true)
        ]);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };

    fetchInitialData();
  }, []);

  // Handle tab changes
  useEffect(() => {
    const refreshTabData = async () => {
      if (selectedTab === 2) { // Visits tab
        console.log('Selected Visits tab, fetching data...');
        await Promise.all([
          fetchUpcomingVisits(true),
          fetchVisitHistory(),
          fetchVisitSummary()
        ]);
      }
    };

    refreshTabData();
  }, [selectedTab]);

  useEffect(() => {
    if (selectedRequestId) {
      fetchSubscriptionStatus(selectedRequestId);
    }
  }, [selectedRequestId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>{status}</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{status}</span>;
      case 'rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>{status}</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const renderSubscriptionRequests = () => {
    if (subscriptionRequests.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No Subscription Requests Found</h3>
          <p className="mt-2 text-gray-500">Start by selecting a subscription plan.</p>
          <Link
            to="/subscription/plans"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
          >
            View Plans
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6">
        {subscriptionRequests.map((request) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200 
              ${selectedRequestId === request.id ? 'ring-2 ring-orange-500' : ''}`}
            onClick={() => setSelectedRequestId(request.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{request.plan_name}</h3>
                <p className="text-sm text-gray-500">{request.duration_type}</p>
              </div>
              {getStatusBadge(request.status_display)}
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Reference</p>
                <p className="text-sm font-medium text-gray-900">{request.service_reference}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Request Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(request.request_date)}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center text-orange-600">
                <span>View Details</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
              <div>
                <span className="font-medium text-gray-900">₹{request.price}</span>
                {request.discounted_price && (
                  <span className="ml-2 text-green-600">₹{request.discounted_price}</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderActiveSubscriptions = () => {
    if (activeSubscriptions.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No Active Subscription</h3>
          <p className="mt-2 text-gray-500">Get started by subscribing to one of our plans.</p>
          <Link
            to="/subscription/plans"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
          >
            View Plans
          </Link>
        </div>
      );
    }

    return activeSubscriptions.map((subscription) => (
      <motion.div
        key={subscription.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="space-y-8">
          {/* Active Subscription Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{subscription.plan_name}</h2>
              <p className="text-gray-500 mt-1">{subscription.plan_type}</p>
            </div>
            {getStatusBadge(subscription.status_display)}
          </div>

          {/* Subscription Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Duration</h3>
              <p className="mt-2 text-lg font-semibold text-gray-900">{subscription.duration_type}</p>
              <p className="text-sm text-gray-500">{subscription.remaining_days} days remaining</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Visits</h3>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {subscription.remaining_visits} / {subscription.max_visits}
              </p>
              <p className="text-sm text-gray-500">remaining visits</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {new Date(subscription.start_date).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">End Date</h3>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {new Date(subscription.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Last Visit Info */}
          {subscription.last_visit_date && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Last Visit</h3>
              <p className="mt-2 text-gray-900">{formatDate(subscription.last_visit_date)}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            {subscription.remaining_visits > 0 && (
              <Link
                to="/subscription/schedule"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
              >
                Schedule Visit
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    ));
  };

  const renderVisitSummary = () => {
    if (loadingSummary) {
      return (
        <div className="animate-pulse space-y-4 mb-8">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      );
    }

    if (!visitSummary) return null;

    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Visits</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {visitSummary.completed_visits_count} / {visitSummary.total_visits_allowed}
            </p>
            <p className="text-sm text-gray-500">visits completed</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500">Remaining Visits</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {visitSummary.remaining_visits}
            </p>
            <p className="text-sm text-gray-500">visits available</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500">Last Visit</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {visitSummary.last_visit_date ? (
                format(new Date(visitSummary.last_visit_date), 'MMM d')
              ) : (
                'No visits yet'
              )}
            </p>
            <p className="text-sm text-gray-500">
              {visitSummary.last_visit_date ? (
                format(new Date(visitSummary.last_visit_date), 'yyyy')
              ) : ''}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderUpcomingVisits = () => {
    return (
      <div className="space-y-8">
        {/* Visit Summary Section */}
        {renderVisitSummary()}

        {/* Upcoming Visits Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Visits</h2>
            <p className="text-gray-500 mt-1">View and manage your scheduled service visits</p>
          </div>
          
          {upcomingVisits.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900">No Upcoming Visits Scheduled</h3>
              <p className="mt-2 text-gray-500">Schedule a visit from your active subscription.</p>
              {activeSubscriptions.length > 0 && activeSubscriptions[0].remaining_visits > 0 && (
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                >
                  Schedule Visit
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6">
                {upcomingVisits.map((visit) => (
                  <motion.div
                    key={visit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="flex flex-col space-y-4">
                      {/* Header with Plan and Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-100 rounded-full p-2">
                            <Calendar className="h-6 w-6 text-orange-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{visit.plan_name}</h3>
                            <p className="text-sm text-gray-500">Subscription #{visit.subscription_id}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          visit.status === 'scheduled' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {visit.status_display}
                        </span>
                      </div>

                      {/* Date and Time */}
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(visit.scheduled_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(visit.scheduled_date).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Service Notes if any */}
                      {visit.service_notes && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Service Notes</h4>
                          <p className="text-sm text-gray-600">{visit.service_notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end space-x-4 pt-2">
                        <button
                          onClick={() => setSelectedVisit(visit)}
                          className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Cancel Visit
                        </button>
                        <button
                          onClick={() => setSelectedVisitForReschedule(visit)}
                          className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          Reschedule
                        </button>
                        <Link
                          to={`/subscription/visits/${visit.id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Schedule New Visit Button */}
              {activeSubscriptions.length > 0 && activeSubscriptions[0].remaining_visits > 0 && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                  >
                    Schedule New Visit
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Visit History Section */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Visit History</h2>
            <p className="text-gray-500 mt-1">View your past service visits</p>
          </div>
          
          <VisitHistoryAccordion 
            visits={visitHistory} 
            isLoading={loadingHistory} 
          />
        </div>
      </div>
    );
  };

  const handleScheduleVisit = async (date: string, time: string) => {
    try {
      setScheduleError(null);
      const formattedDate = format(new Date(date), 'yyyy-MM-dd');
      const formattedTime = time + ':00';

      const response = await axiosInstance.post('/subscription/visits/schedule_preferred_date/', {
        preferred_date: formattedDate,
        preferred_time: formattedTime,
        subscription: activeSubscriptions[0].id
      });

      if (response.data) {
        toast.success('Visit scheduled successfully!');
        // Refresh visits without showing loading state
        await fetchUpcomingVisits(false);
        setIsScheduleModalOpen(false);
      }
    } catch (err) {
      console.error('Error scheduling visit:', err);
      if (err instanceof AxiosError && err.response?.data?.non_field_errors?.[0]) {
        setScheduleError(err.response.data.non_field_errors[0]);
      } else {
        setScheduleError('Failed to schedule visit. Please try again.');
      }
    }
  };

  const handleRescheduleVisit = async (visitId: number, date: string, time: string) => {
    try {
      setRescheduleError(null);
      const formattedDate = format(new Date(date), 'yyyy-MM-dd');
      const formattedTime = time + ':00';

      const response = await axiosInstance.put(API_ENDPOINTS.subscription.visits.reschedule(visitId), {
        preferred_date: formattedDate,
        preferred_time: formattedTime,
        subscription: activeSubscriptions[0].id
      });

      if (response.data) {
        toast.success('Visit rescheduled successfully!');
        // Refresh visits without showing loading state
        await fetchUpcomingVisits(false);
        setSelectedVisitForReschedule(null);
      }
    } catch (err) {
      console.error('Error rescheduling visit:', err);
      if (err instanceof AxiosError && err.response?.data?.non_field_errors?.[0]) {
        setRescheduleError(err.response.data.non_field_errors[0]);
      } else {
        setRescheduleError('Failed to reschedule visit. Please try again.');
      }
    }
  };

  if (loading.requests && loading.subscriptions && loading.visits) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-orange-900/20 p-1 mb-8">
          <Tab
            className={({ selected }: { selected: boolean }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white text-orange-700 shadow'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-orange-600'
              } transition-all duration-200`
            }
          >
            Subscription Requests
          </Tab>
          <Tab
            className={({ selected }: { selected: boolean }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white text-orange-700 shadow'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-orange-600'
              } transition-all duration-200`
            }
          >
            Active Subscription
          </Tab>
          <Tab
            className={({ selected }: { selected: boolean }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white text-orange-700 shadow'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-orange-600'
              } transition-all duration-200`
            }
          >
            Visits
          </Tab>
          <Tab
            className={({ selected }: { selected: boolean }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white text-orange-700 shadow'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-orange-600'
              } transition-all duration-200`
            }
          >
            Vehicles For Sale
          </Tab>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {renderSubscriptionRequests()}

                {/* Selected Request Details */}
                {selectedRequestId && subscriptionStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 bg-white rounded-xl shadow-lg p-6"
                  >
                    <div className="space-y-8">
                      {/* Status Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
                          <p className="text-gray-500 mt-1">Reference: {subscriptionStatus.subscription_request.service_reference}</p>
                        </div>
                        {getStatusBadge(subscriptionStatus.subscription_request.status_display)}
                      </div>

                      {/* Plan Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <Package className="h-5 w-5 text-orange-500" />
                            <h3 className="font-medium text-gray-900">Plan Details</h3>
                          </div>
                          <div className="space-y-2">
                            <p className="text-gray-600">{subscriptionStatus.subscription_request.plan_name}</p>
                            <p className="text-gray-600">{subscriptionStatus.subscription_request.duration_type}</p>
                            <p className="text-sm text-gray-500">
                              Price: ₹{subscriptionStatus.subscription_request.price}
                              {subscriptionStatus.subscription_request.discounted_price && (
                                <span className="text-green-600 ml-2">
                                  Discounted: ₹{subscriptionStatus.subscription_request.discounted_price}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <User className="h-5 w-5 text-orange-500" />
                            <h3 className="font-medium text-gray-900">Customer Details</h3>
                          </div>
                          <div className="space-y-2">
                            <p className="text-gray-600">{subscriptionStatus.subscription_request.customer_name}</p>
                            <p className="text-gray-600">{subscriptionStatus.subscription_request.customer_email}</p>
                            <p className="text-gray-600">{subscriptionStatus.subscription_request.customer_phone}</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <MapPin className="h-5 w-5 text-orange-500" />
                            <h3 className="font-medium text-gray-900">Address</h3>
                          </div>
                          <div className="space-y-2">
                            <p className="text-gray-600">{subscriptionStatus.subscription_request.address}</p>
                            <p className="text-gray-600">
                              {subscriptionStatus.subscription_request.city}, {subscriptionStatus.subscription_request.state}
                            </p>
                            <p className="text-gray-600">{subscriptionStatus.subscription_request.postal_code}</p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Information */}
                      {(subscriptionStatus.subscription_request.rejection_reason || subscriptionStatus.subscription_request.admin_notes) && (
                        <div className="space-y-4">
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
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </Tab.Panel>

          <Tab.Panel>
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {renderActiveSubscriptions()}
              </motion.div>
            </AnimatePresence>
          </Tab.Panel>

          <Tab.Panel>
            <AnimatePresence mode="wait">
              <motion.div
                key="visits-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {renderUpcomingVisits()}
              </motion.div>
            </AnimatePresence>
          </Tab.Panel>

          <Tab.Panel>
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <ForSaleVehicles />
              </motion.div>
            </AnimatePresence>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Cancel Visit Modal */}
      {selectedVisit && (
        <CancelVisitModal
          visitId={selectedVisit.id}
          visitDate={selectedVisit.scheduled_date}
          onClose={() => setSelectedVisit(null)}
          onCancelled={async () => {
            setSelectedVisit(null);
            await fetchUpcomingVisits(false);
          }}
        />
      )}

      {selectedVisitForReschedule && activeSubscriptions[0] && (
        <RescheduleVisitModal
          isOpen={!!selectedVisitForReschedule}
          onClose={() => {
            setSelectedVisitForReschedule(null);
            setRescheduleError(null);
          }}
          onReschedule={handleRescheduleVisit}
          visitId={selectedVisitForReschedule.id}
          currentDate={selectedVisitForReschedule.scheduled_date}
          currentTime={format(new Date(selectedVisitForReschedule.scheduled_date), 'HH:mm:ss')}
          error={rescheduleError}
          subscriptionEndDate={activeSubscriptions[0].end_date}
        />
      )}

      {activeSubscriptions[0] && (
        <ScheduleVisitModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setScheduleError(null);
          }}
          onSchedule={handleScheduleVisit}
          remainingVisits={activeSubscriptions[0].remaining_visits}
          maxVisits={activeSubscriptions[0].max_visits}
          subscriptionEndDate={activeSubscriptions[0].end_date}
          error={scheduleError}
        />
      )}
    </div>
  );
};

export default SubscriptionOverview; 