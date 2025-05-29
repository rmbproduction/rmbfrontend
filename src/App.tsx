// React and Router imports
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';

// Third-party imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';
import SubscriptionRoutes from './routes/subscriptionRoutes';
import LoginSignupPage from './pages/LoginSignupPage';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
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

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginSignupPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/resend-verification" element={<ResendVerification />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/password-reset-confirmation" element={<PasswordResetConfirmation />} />
            
            {/* Subscription Routes */}
            <Route path="/subscription/*" element={<SubscriptionRoutes />} />
            
            {/* Main App Routes */}
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
          <ToastContainer position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;