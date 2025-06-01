import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Page Components
import Hero from './components/Hero';
import Services from './components/Services';
import HowItWorks from './components/HowItWorks';
import ServiceDetails from './pages/ServiceDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import VehicleList from './pages/VehicleList';
import VehicleDetail from './pages/VehicleDetail';
import Contact from './pages/Contact';
import LoginSignupPage from './pages/LoginSignupPage';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
import ResetPassword from './pages/ResetPassword';
import PasswordResetConfirmation from './pages/PasswordResetConfirmation';
import SellVehicle from './pages/SellVehicle';
import AboutPage from './pages/AboutPage';

// Layout wrapper for consistent layout
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navbar />
    <main className="min-h-[calc(100vh-64px)]">
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </main>
    <Footer />
  </>
);

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <MainLayout>
          <Hero />
          <Services />
          <HowItWorks />
        </MainLayout>
      } />

      <Route path="/about-us" element={
        <MainLayout>
          <AboutPage />
        </MainLayout>
      } />

      <Route path="/vehicles" element={
        <MainLayout>
          <VehicleList />
        </MainLayout>
      } />

      <Route path="/vehicles/:id" element={
        <MainLayout>
          <VehicleDetail />
        </MainLayout>
      } />

      <Route path="/service/:serviceId" element={
        <MainLayout>
          <ServiceDetails />
        </MainLayout>
      } />

      {/* Auth Routes */}
      <Route path="/login" element={
        <ProtectedRoute requireAuth={false}>
          <LoginSignupPage />
        </ProtectedRoute>
      } />

      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/password-reset-confirmation" element={<PasswordResetConfirmation />} />

      {/* Protected Routes */}
      <Route path="/profile" element={
        <ProtectedRoute requireAuth={true}>
          <MainLayout>
            <Profile />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/cart" element={
        <ProtectedRoute requireAuth={true}>
          <MainLayout>
            <Cart />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/checkout" element={
        <ProtectedRoute requireAuth={true}>
          <MainLayout>
            <Checkout />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/sell-vehicle" element={
        <ProtectedRoute requireAuth={true}>
          <MainLayout>
            <SellVehicle />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/contact" element={
        <MainLayout>
          <Contact />
        </MainLayout>
      } />
    </Routes>
  );
};

export default AppRoutes; 