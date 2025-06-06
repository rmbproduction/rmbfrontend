import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from '../components/ScrollToTop';
import Profile from '../pages/Profile';
import Home from '../pages/Home';
import VehicleList from '../pages/VehicleList';
import SellVehicle from '../pages/SellVehicle';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';
import SparePartList from '../pages/SparePartList';

const AppRoutes: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vehicles" element={<VehicleList />} />
        <Route path="/spare-parts" element={<SparePartList />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sell-vehicle" 
          element={
            <ProtectedRoute>
              <SellVehicle />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default AppRoutes; 