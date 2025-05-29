import React from 'react';
import { Route, Routes } from 'react-router-dom';
import SubscriptionStatus from '../components/subscription/SubscriptionStatus';
import ActiveSubscription from '../components/subscription/ActiveSubscription';
import VisitScheduler from '../components/subscription/VisitScheduler';

const SubscriptionRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="status/:id" element={<SubscriptionStatus />} />
      <Route path="active" element={<ActiveSubscription />} />
      <Route path="schedule" element={<VisitScheduler />} />
    </Routes>
  );
};

export default SubscriptionRoutes; 