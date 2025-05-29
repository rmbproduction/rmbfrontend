import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import subscriptionService, { SubscriptionStatusResponse } from '../../services/subscriptionService';

const StatusIcon = ({ status }: { status: string }) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return <CheckCircle className="w-8 h-8 text-green-500" />;
    case 'rejected':
      return <XCircle className="w-8 h-8 text-red-500" />;
    default:
      return <Clock className="w-8 h-8 text-yellow-500" />;
  }
};

const SubscriptionStatus: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        console.log('Fetching subscription status for ID:', id);
        const response = await subscriptionService.getStatus(Number(id));
        console.log('Subscription status response:', response);
        setStatus(response.data);
      } catch (err: any) {
        console.error('Error fetching subscription status:', err);
        console.error('Error response:', err.response);
        setError(err.response?.data?.detail || 'Failed to fetch subscription status');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStatus();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error || 'Subscription request not found'}
        </div>
      </div>
    );
  }

  const { subscription_request, service_request_status, service_request_reference, active_subscription } = status;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Status Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Subscription Request</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Reference: {service_request_reference}
                </p>
              </div>
              <StatusIcon status={subscription_request.status} />
            </div>
          </div>

          {/* Status Details */}
          <div className="p-6 space-y-6">
            {/* Customer Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
              <dl className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{subscription_request.customer_name}</dd>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{subscription_request.customer_email}</dd>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{subscription_request.customer_phone}</dd>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {subscription_request.address}, {subscription_request.city}, {subscription_request.state} - {subscription_request.postal_code}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Plan Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">Plan Details</h3>
              <dl className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Plan Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{subscription_request.plan_name}</dd>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900">{subscription_request.duration_type}</dd>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    ₹{subscription_request.discounted_price}
                    {subscription_request.price !== subscription_request.discounted_price && (
                      <span className="ml-2 line-through text-gray-500">₹{subscription_request.price}</span>
                    )}
                  </dd>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Request Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(subscription_request.request_date).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Status Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">Status Information</h3>
              <dl className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Request Status</dt>
                  <dd className={`mt-1 text-sm font-medium ${
                    subscription_request.status === 'approved' ? 'text-green-600' :
                    subscription_request.status === 'rejected' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {subscription_request.status_display}
                  </dd>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Service Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {service_request_status}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Rejection Reason (if rejected) */}
            {subscription_request.status === 'rejected' && subscription_request.rejection_reason && (
              <div className="bg-red-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-red-800">Rejection Reason</h3>
                <p className="mt-2 text-sm text-red-700">{subscription_request.rejection_reason}</p>
              </div>
            )}

            {/* Admin Notes (if any) */}
            {subscription_request.admin_notes && (
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-blue-800">Admin Notes</h3>
                <p className="mt-2 text-sm text-blue-700">{subscription_request.admin_notes}</p>
              </div>
            )}

            {/* Active Subscription Details (if approved) */}
            {active_subscription && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Active Subscription</h3>
                <dl className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(active_subscription.start_date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">End Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(active_subscription.end_date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Remaining Visits</dt>
                    <dd className="mt-1 text-sm text-gray-900">{active_subscription.remaining_visits}</dd>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-green-600 font-medium capitalize">{active_subscription.status}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatus; 