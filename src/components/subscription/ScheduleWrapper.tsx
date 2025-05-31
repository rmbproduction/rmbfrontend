import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';
import VisitScheduler from './VisitScheduler';

const ScheduleWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { subscription, loading, error } = useSubscription();

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

  return <VisitScheduler subscriptionId={subscription.id} />;
};

export default ScheduleWrapper; 