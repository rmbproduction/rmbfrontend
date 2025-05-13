import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import errorReporter from './utils/errorReporter';

// Import main components eagerly (critical path components)
import Hero from './components/Hero';
import Services from './components/Services';
import AboutUsSection from './components/AboutUsSection';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-load non-critical components
const ServiceDetails = lazy(() => import('./pages/ServiceDetails'));
const ServicesPage = lazy(() => import('./pages/Services'));
const ManufacturerSelect = lazy(() => import('./components/ManufacturerSelect'));
const LoginSignupPage = lazy(() => import('./pages/LoginSignupPage'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Pricing = lazy(() => import('./pages/Pricing'));
const CheckoutPage = lazy(() => import('./pages/Checkout'));
const FaqPage = lazy(() => import('./pages/FAQ'));
const Booking = lazy(() => import('./pages/Booking'));
const EmailVerification = lazy(() => import('./pages/EmailVerfication'));
const PasswordResetConfirmation = lazy(() => import('./pages/PasswordResetConfirmation'));
const Profile = lazy(() => import('./pages/ProfilePage'));
const EmailConfirmation = lazy(() => import('./pages/EmailConfirmation'));
const SellVehicle = lazy(() => import('./pages/SellVehicle'));
const SellSuccess = lazy(() => import('./pages/SellSuccess'));
const VehicleSummary = lazy(() => import('./pages/VehicleSummary'));
const VehicleBuyPage = lazy(() => import('./pages/VehicleBuyPage'));
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage'));
const VehiclePurchasePage = lazy(() => import('./pages/VehiclePurchasePage'));
const PurchaseSuccessPage = lazy(() => import('./pages/PurchaseSuccessPage'));
const PreviousVehiclesPage = lazy(() => import('./pages/PreviousVehiclesPage'));
const Cart = lazy(() => import('./pages/Cart'));
const ServiceCheckout = lazy(() => import('./pages/ServiceCheckout'));
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'));
const TestAPI = lazy(() => import('./components/TestAPI'));

// Create a loading fallback component
const PageLoader = () => (
  <div className="flex justify-center items-center h-[50vh]">
    <LoadingSpinner size="lg" message="Loading page..." />
  </div>
);

// Handle unhandled promise rejections globally
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  errorReporter.reportError(
    event.reason, 
    'UnhandledPromiseRejection', 
    { message: event.reason?.message || 'No details available' }
  );
  // Prevent the default browser behavior (console error)
  event.preventDefault();
};

function App() {
  // Set up global error handlers
  useEffect(() => {
    // Set up global unhandled promise rejection handler
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Set up global uncaught exception handler
    const handleError = (event: ErrorEvent) => {
      errorReporter.reportError(
        event.error || event.message,
        'UncaughtException',
        { 
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    };
    
    window.addEventListener('error', handleError);
    
    // Cleanup when component unmounts
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <Router>
      <ErrorBoundary componentName="RootApp">
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <ErrorBoundary componentName="Navbar">
            <Navbar />
          </ErrorBoundary>
          
          <main className="flex-grow">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Home Route */}
                <Route 
                  path="/" 
                  element={
                    <>
                      <ErrorBoundary componentName="Hero">
                        <Hero />
                      </ErrorBoundary>
                      <ErrorBoundary componentName="Services">
                        <Services />
                      </ErrorBoundary>
                      <ErrorBoundary componentName="AboutUsSection">
                        <AboutUsSection />
                      </ErrorBoundary>
                    </>
                  } 
                />

                {/* Redirect from /login to /login-signup */}
                <Route path="/login" element={<Navigate to="/login-signup" replace />} />

                {/* Additional Pages */}
                <Route path="/about" element={
                  <ErrorBoundary componentName="About">
                    <About />
                  </ErrorBoundary>
                } />
                <Route path="/contact" element={
                  <ErrorBoundary componentName="Contact">
                    <Contact />
                  </ErrorBoundary>
                } />
                <Route path="/pricing" element={
                  <ErrorBoundary componentName="Pricing">
                    <Pricing />
                  </ErrorBoundary>
                } />
                <Route path="/login-signup" element={
                  <ErrorBoundary componentName="LoginSignup">
                    <LoginSignupPage />
                  </ErrorBoundary>
                } />
                <Route path="/checkout" element={
                  <ErrorBoundary componentName="Checkout">
                    <CheckoutPage />
                  </ErrorBoundary>
                } />
                <Route path="/faq" element={
                  <ErrorBoundary componentName="FAQ">
                    <FaqPage />
                  </ErrorBoundary>
                } />
                <Route path="/profile" element={
                  <ErrorBoundary componentName="Profile">
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/Password-reset-confirmation" element={
                  <ErrorBoundary componentName="PasswordReset">
                    <PasswordResetConfirmation />
                  </ErrorBoundary>
                } />
                
                {/* Sell Vehicle Routes - Protected */}
                <Route path="/sell-vehicle" element={
                  <ErrorBoundary componentName="SellVehicle">
                    <ProtectedRoute>
                      <SellVehicle />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/sell-success" element={
                  <ErrorBoundary componentName="SellSuccess">
                    <ProtectedRoute>
                      <SellSuccess />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/sell-vehicle/:id/summary" element={
                  <ErrorBoundary componentName="VehicleSummary">
                    <ProtectedRoute>
                      <VehicleSummary />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />

                {/* Buy Vehicle Routes */}
                <Route path="/vehicles" element={
                  <ErrorBoundary componentName="VehicleBuy">
                    <VehicleBuyPage />
                  </ErrorBoundary>
                } />
                <Route path="/vehicles/:id" element={
                  <ErrorBoundary componentName="VehicleDetail">
                    <VehicleDetailPage />
                  </ErrorBoundary>
                } />
                
                {/* Booking */}
                <Route path="/booking" element={
                  <ErrorBoundary componentName="Booking">
                    <Booking />
                  </ErrorBoundary>
                } />

                {/* Services */}
                <Route path="/services" element={
                  <ErrorBoundary componentName="ServicesPage">
                    <ServicesPage />
                  </ErrorBoundary>
                } />
                <Route path="/services/:serviceId" element={
                  <ErrorBoundary componentName="ServiceDetails">
                    <ServiceDetails />
                  </ErrorBoundary>
                } />
                <Route path="/verify-email" element={
                  <ErrorBoundary componentName="EmailVerification">
                    <EmailVerification />
                  </ErrorBoundary>
                } />
                <Route path="/verify-email/:key" element={
                  <ErrorBoundary componentName="EmailConfirmation">
                    <EmailConfirmation />
                  </ErrorBoundary>
                } />

                {/* Cart */}
                <Route path="/cart" element={
                  <ErrorBoundary componentName="Cart">
                    <Cart />
                  </ErrorBoundary>
                } />
                
                {/* Service Checkout */}
                <Route path="/service-checkout" element={
                  <ErrorBoundary componentName="ServiceCheckout">
                    <ServiceCheckout />
                  </ErrorBoundary>
                } />
                <Route path="/booking-confirmation" element={
                  <ErrorBoundary componentName="BookingConfirmation">
                    <BookingConfirmation />
                  </ErrorBoundary>
                } />

                {/* Other Example Pages */}
                <Route 
                  path="/manufacturers" 
                  element={
                    <ErrorBoundary componentName="ManufacturerSelect">
                      <ManufacturerSelect 
                        manufacturers={[]} 
                        onSelect={(manufacturer: any) => {
                          console.log('Manufacturer selected:', manufacturer.id);
                        }} 
                      />
                    </ErrorBoundary>
                  } 
                />
                <Route path="/test-api" element={
                  <ErrorBoundary componentName="TestAPI">
                    <TestAPI />
                  </ErrorBoundary>
                } />

                {/* Purchase pages */}
                <Route path="/vehicles/:id/purchase" element={
                  <ErrorBoundary componentName="VehiclePurchase">
                    <ProtectedRoute>
                      <VehiclePurchasePage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/purchase-success" element={
                  <ErrorBoundary componentName="PurchaseSuccess">
                    <ProtectedRoute>
                      <PurchaseSuccessPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />

                {/* Previous Vehicles Page */}
                <Route path="/previous-vehicles" element={
                  <ErrorBoundary componentName="PreviousVehicles">
                    <ProtectedRoute>
                      <PreviousVehiclesPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                
                {/* 404 catch-all route */}
                <Route path="*" element={
                  <div className="flex flex-col items-center justify-center py-20">
                    <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
                    <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                    <a href="/" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                      Return to Home
                    </a>
                  </div>
                } />
              </Routes>
            </Suspense>
          </main>

          <ErrorBoundary componentName="Footer">
            <Footer />
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
