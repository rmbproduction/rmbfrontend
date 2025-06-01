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

// Create router with explicit handling of verification route
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <MainLayout>
        <AppRoutes />
      </MainLayout>
    ),
    children: [
      {
        path: "verify-email/:token",
        element: <VerifyEmail />
      },
      {
        path: "login-signup",
        element: <LoginSignupPage />
      },
      {
        path: "verify-email",
        element: <EmailVerification />
      },
      {
        path: "reset-password/:token",
        element: <ResetPassword />
      },
      {
        path: "password-reset-confirmation",
        element: <PasswordResetConfirmation />
      },
      {
        path: "subscription",
        element: <Pricing />
      }
    ]
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