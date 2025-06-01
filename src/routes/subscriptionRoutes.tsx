import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SubscriptionStatus from '../components/subscription/SubscriptionStatus';
import ScheduleWrapper from '../components/subscription/ScheduleWrapper';

const SubscriptionRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="status/:id" element={<SubscriptionStatus />} />
      <Route path="schedule" element={<ScheduleWrapper />} />
    </Routes>
  );
};

export default SubscriptionRoutes; 