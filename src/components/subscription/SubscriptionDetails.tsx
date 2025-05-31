import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance, API_ENDPOINTS } from '../../config/api.config';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Subscription {
  id: number;
  plan_name: string;
  plan_type: string;
  duration_type: string;
  start_date: string;
  end_date: string;
  status: string;
  remaining_visits: number;
  max_visits: number;
  is_currently_active: boolean;
  remaining_days: number;
}

const SubscriptionDetails: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: subscription, isLoading, error } = useQuery<Subscription>({
    queryKey: ['activeSubscription'],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.activeSubscription);
      return response.data;
    }
  });

  // Helper function to safely format dates
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            An error occurred while fetching your subscription details. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="w-full py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Active Subscription
            </h3>
            <p className="text-gray-600 mb-4">
              You don't have an active subscription at the moment.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF5733] hover:bg-[#ff4520] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733]"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{subscription.plan_name}</h2>
              <p className="text-gray-600">{subscription.plan_type}</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {subscription.duration_type}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {subscription.start_date ? formatDate(subscription.start_date) : '-'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {subscription.end_date ? formatDate(subscription.end_date) : '-'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Remaining Visits</h3>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">
                    {subscription.remaining_visits}
                  </p>
                  <p className="ml-2 text-sm text-gray-500">
                    of {subscription.max_visits}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Days Remaining</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {subscription.remaining_days} days
                </p>
              </div>

              {subscription.remaining_visits > 0 && (
                <button
                  onClick={() => navigate('/schedule-visit')}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF5733] hover:bg-[#ff4520] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733]"
                >
                  Schedule a Visit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetails; 