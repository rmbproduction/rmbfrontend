import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';

const ActiveSubscription: React.FC = () => {
  const { subscription, upcomingVisits, loading, error } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error || 'No active subscription found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subscription Overview */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Subscription</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Plan</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">{subscription.plan_name}</p>
                <p className="text-sm text-gray-500">{subscription.plan_type}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">{subscription.duration_type}</p>
                <p className="text-sm text-gray-500">{subscription.remaining_days} days remaining</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Visits</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {subscription.remaining_visits} / {subscription.max_visits}
                </p>
                <p className="text-sm text-gray-500">remaining visits</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Valid Until</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {new Date(subscription.end_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">expiry date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Visits */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Visits</h2>
              {subscription.remaining_visits > 0 && (
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
                  <div key={visit.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(visit.scheduled_date).toLocaleDateString()}
                      </p>
                      {visit.service_notes && (
                        <p className="text-sm text-gray-500 mt-1">{visit.service_notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming visits</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {subscription.remaining_visits > 0
                    ? "Schedule your next visit now"
                    : "You've used all your visits"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Alert */}
        {subscription.remaining_days <= 30 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Subscription Expiring Soon
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your subscription will expire in {subscription.remaining_days} days. Consider renewing to continue enjoying our services.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSubscription; 