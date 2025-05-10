import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

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
    <LoadingSpinner />
    <span className="ml-2 text-gray-600">Loading page...</span>
  </div>
);

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          
          <main className="flex-grow">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Home Route */}
                <Route 
                  path="/" 
                  element={
                    <ErrorBoundary>
                      <>
                        <Hero />
                        <Services />
                        <AboutUsSection />
                      </>
                    </ErrorBoundary>
                  } 
                />

                {/* Redirect from /login to /login-signup */}
                <Route path="/login" element={<Navigate to="/login-signup" replace />} />

                {/* Additional Pages */}
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/login-signup" element={<LoginSignupPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/Password-reset-confirmation" element={<PasswordResetConfirmation />} />
                
                {/* Sell Vehicle Routes - Protected */}
                <Route path="/sell-vehicle" element={
                  <ProtectedRoute>
                    <SellVehicle />
                  </ProtectedRoute>
                } />
                <Route path="/sell-success" element={
                  <ProtectedRoute>
                    <SellSuccess />
                  </ProtectedRoute>
                } />
                <Route path="/sell-vehicle/:id/summary" element={
                  <ProtectedRoute>
                    <VehicleSummary />
                  </ProtectedRoute>
                } />

                {/* Buy Vehicle Routes */}
                <Route path="/vehicles" element={<VehicleBuyPage />} />
                <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
                
                {/* Booking */}
                <Route path="/booking" element={<Booking />} />

                {/* Services */}
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/:serviceId" element={<ServiceDetails />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/verify-email/:key" element={<EmailConfirmation />} />

                {/* Cart */}
                <Route path="/cart" element={<Cart />} />
                
                {/* Service Checkout */}
                <Route path="/service-checkout" element={<ServiceCheckout />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />

                {/* Other Example Pages */}
                <Route 
                  path="/manufacturers" 
                  element={
                    <ManufacturerSelect 
                      manufacturers={[]} 
                      onSelect={(manufacturer: any) => {
                        console.log('Manufacturer selected:', manufacturer.id);
                      }} 
                    />
                  } 
                />
                <Route path="/test-api" element={<TestAPI />} />

                {/* Purchase pages */}
                <Route path="/vehicles/:id/purchase" element={
                  <ProtectedRoute>
                    <VehiclePurchasePage />
                  </ProtectedRoute>
                } />
                <Route path="/purchase-success" element={
                  <ProtectedRoute>
                    <PurchaseSuccessPage />
                  </ProtectedRoute>
                } />

                {/* Previous Vehicles Page */}
                <Route path="/previous-vehicles" element={
                  <ProtectedRoute>
                    <PreviousVehiclesPage />
                  </ProtectedRoute>
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

          <Footer />
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
