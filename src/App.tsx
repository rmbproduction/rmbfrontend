// React and Router imports
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Third-party imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import AppRoutes from './routes';
import Pricing from './pages/pricing';
import LoginSignupPage from './pages/LoginSignupPage';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import PasswordResetConfirmation from './pages/PasswordResetConfirmation';

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

// Create router
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginSignupPage />
  },
  {
    path: "/verify-email/:token",
    element: <VerifyEmail />
  },
  {
    path: "/reset-password/:token",
    element: <ResetPassword />
  },
  {
    path: "/password-reset-confirmation",
    element: <PasswordResetConfirmation />
  },
  {
    path: "/subscription",
    element: <Pricing />
  },
  {
    path: "/*",
    element: <AppRoutes />
  }
]);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <RouterProvider router={router} />
          <ToastContainer position="top-right" />
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;