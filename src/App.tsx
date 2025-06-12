// React and Router imports
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import MainLayout from './layouts/MainLayout';
import AppRoutes from './routes';
import Pricing from './pages/pricing';
import LoginSignupPage from './pages/LoginSignupPage';
import EmailVerification from './pages/EmailVerification';
import ResetPassword from './pages/ResetPassword';
import PasswordResetConfirmation from './pages/PasswordResetConfirmation';
import NotFound from './pages/NotFound';
import VerifyEmail from './pages/VerifyEmail';
import SpareParts, { SparePartDetail } from './pages/SpareParts';
import SparePartsCheckout from './pages/SparePartsCheckout';
import SparePartsCart from './pages/SparePartsCart';
import Home from './pages/Home';
import VehicleList from './pages/VehicleList';
import Profile from './pages/Profile';
import SellVehicle from './pages/SellVehicle';
import { ProtectedRoute } from './components/ProtectedRoute';
import HowItWorks from './components/HowItWorks';
import Contact from './pages/Contact';
import AboutPage from './pages/AboutPage';

// Temporary: Log the API URL to verify environment variable
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Create router with all routes explicitly defined
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout><Home /></MainLayout>,
    errorElement: <NotFound />
  },
  {
    path: "/vehicles",
    element: <MainLayout><VehicleList /></MainLayout>
  },
  {
    path: "/spare-parts",
    element: <MainLayout><SpareParts /></MainLayout>
  },
  {
    path: "/spare-parts/:partId",
    element: <MainLayout><SparePartDetail /></MainLayout>
  },
  {
    path: "/spare-parts/cart",
    element: <MainLayout><SparePartsCart /></MainLayout>
  },
  {
    path: "/spare-parts/checkout",
    element: <MainLayout><ProtectedRoute><SparePartsCheckout /></ProtectedRoute></MainLayout>
  },
  {
    path: "/profile",
    element: <MainLayout><ProtectedRoute><Profile /></ProtectedRoute></MainLayout>
  },
  {
    path: "/sell-vehicle",
    element: <MainLayout><ProtectedRoute><SellVehicle /></ProtectedRoute></MainLayout>
  },
  {
    path: "verify-email/:token",
    element: <MainLayout><VerifyEmail /></MainLayout>
  },
  {
    path: "login",
    element: <MainLayout><LoginSignupPage /></MainLayout>
  },
  {
    path: "verify-email",
    element: <MainLayout><EmailVerification /></MainLayout>
  },
  {
    path: "reset-password/:token",
    element: <MainLayout><ResetPassword /></MainLayout>
  },
  {
    path: "password-reset-confirmation",
    element: <MainLayout><PasswordResetConfirmation /></MainLayout>
  },
  {
    path: "subscription",
    element: <MainLayout><Pricing /></MainLayout>
  },
  {
    path: "how-it-works",
    element: <MainLayout><HowItWorks /></MainLayout>
  },
  {
    path: "contact-us",
    element: <MainLayout><Contact /></MainLayout>
  },
  {
    path: "about-us",
    element: <MainLayout><AboutPage /></MainLayout>
  },
  {
    path: "*",
    element: <NotFound />
  }
]);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <RouterProvider router={router} />
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;