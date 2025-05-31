import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SubscriptionStatus from '../components/subscription/SubscriptionStatus';
import ActiveSubscription from '../components/subscription/ActiveSubscription';
import ScheduleWrapper from '../components/subscription/ScheduleWrapper';

const SubscriptionRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="active" replace />} />
      <Route path="status/:id" element={<SubscriptionStatus />} />
      <Route path="active" element={<ActiveSubscription />} />
      <Route path="schedule" element={<ScheduleWrapper />} />
      <Route path="*" element={<Navigate to="active" replace />} />
    </Routes>
  );
};

export default SubscriptionRoutes; 