// React and Router imports
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Third-party imports
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Page Components
import Hero from './components/Hero';
import Services from './components/Services';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';

// Page Routes
import ServiceDetails from './pages/ServiceDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import Contact from './pages/Contact';
import LoginSignupPage from './pages/LoginSignupPage';
import Profile from './pages/Profile';
import EmailVerification from './pages/EmailVerification';
import ResendVerification from './pages/ResendVerification';
import ResetPassword from './pages/ResetPassword';
import PasswordResetConfirmation from './pages/PasswordResetConfirmation';

// Layout wrapper for consistent layout
const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    <main className="min-h-[calc(100vh-64px)]">{children}</main>
    <Footer />
  </>
);

import { AuthProvider } from './contexts/AuthContext';

// Temporary: Log the API URL to verify environment variable
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={<LoginSignupPage />}
            />

            {/* Email Verification Routes */}
            <Route 
              path="/verify-email" 
              element={<Navigate to="/resend-verification" replace />} 
            />
            <Route 
              path="/verify-email/:token" 
              element={<EmailVerification />}
            />
            <Route 
              path="/resend-verification" 
              element={<ResendVerification />}
            />

            {/* Password Reset Routes */}
            <Route 
              path="/reset-password/:token" 
              element={<ResetPassword />}
            />
            <Route 
              path="/password-reset-confirmation" 
              element={<PasswordResetConfirmation />}
            />

            {/* Home Route */}
            <Route path="/" element={
              <MainLayout>
                <Hero />
                <Services />
                <HowItWorks />
                <Testimonials />
              </MainLayout>
            } />
            
            {/* User Routes */}
            <Route path="/profile" element={
              <MainLayout>
                <Profile />
              </MainLayout>
            } />

            <Route path="/cart" element={
              <MainLayout>
                <Cart />
              </MainLayout>
            } />

            <Route path="/checkout" element={
              <MainLayout>
                <Checkout />
              </MainLayout>
            } />

            {/* Public Routes */}
            <Route path="/vehicles" element={
              <MainLayout>
                <Vehicles />
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

            <Route path="/contact" element={
              <MainLayout>
                <Contact />
              </MainLayout>
            } />
          </Routes>

          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;