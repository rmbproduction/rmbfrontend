import React from 'react';
import SubscriptionOverview from './SubscriptionOverview';
import ForSaleVehicles from '../ForSaleVehicles';

const MySubscription: React.FC = () => {
  return (
    <div className="w-full">
      <SubscriptionOverview />
      <div className="mt-8">
        <ForSaleVehicles />
      </div>
    </div>
  );
};

export default MySubscription; 