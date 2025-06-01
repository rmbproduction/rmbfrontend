import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from '../components/ScrollToTop';
// ... other imports ...

const AppRoutes: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ... existing routes ... */}
      </Routes>
    </>
  );
};

export default AppRoutes; 