import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import ServiceDetails from './pages/ServiceDetails';
import ServicesPage from './pages/Services';
import TestAPI from './components/TestAPI';
import ManufacturerSelect from './components/ManufacturerSelect';
import LoginSignupPage from './pages/LoginSignupPage';
import About from './pages/About';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';
import CheckoutPage from './pages/Checkout';
import { Manufacturer } from './data/services';
import FaqPage from './pages/FAQ';
import Booking from './pages/Booking';
import EmailVerification from './pages/EmailVerfication';
import PasswordResetConfirmation from './pages/PasswordResetConfirmation';
import Profile from './pages/ProfilePage';
import EmailConfirmation from './pages/EmailConfirmation';
import SellVehicle from './pages/SellVehicle';
import SellSuccess from './pages/SellSuccess';
import VehicleSummary from './pages/VehicleSummary';
import VehicleBuyPage from './pages/VehicleBuyPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import VehiclePurchasePage from './pages/VehiclePurchasePage';
import PurchaseSuccessPage from './pages/PurchaseSuccessPage';
import PreviousVehiclesPage from './pages/PreviousVehiclesPage';
import Cart from './pages/Cart';
import AboutUsSection from './components/AboutUsSection';
import ServiceCheckout from './pages/ServiceCheckout';
import BookingConfirmation from './pages/BookingConfirmation';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <Routes>
          {/* Home Route */}
          <Route 
            path="/" 
            element={
              <main>
                <Hero />
                <Services />
                <AboutUsSection />
                <HowItWorks />
                <Testimonials />
              </main>
            } 
          />

          {/* Additional Pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login-signup" element={<LoginSignupPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/Password-reset-confirmation" element={<PasswordResetConfirmation />} />
          
          {/* Sell Vehicle Routes - Protected */}
          <Route path="/sell-vehicle" element={<ProtectedRoute><SellVehicle /></ProtectedRoute>} />
          <Route path="/sell-success" element={<ProtectedRoute><SellSuccess /></ProtectedRoute>} />
          <Route path="/sell-vehicle/:id/summary" element={<ProtectedRoute><VehicleSummary /></ProtectedRoute>} />

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
                onSelect={(manufacturer: Manufacturer) => {
                  console.log('Manufacturer selected:', manufacturer.id);
                }} 
              />
            } 
          />
          <Route path="/test-api" element={<TestAPI />} />

          {/* Purchase pages */}
          <Route path="/vehicles/:id/purchase" element={<ProtectedRoute><VehiclePurchasePage /></ProtectedRoute>} />
          <Route path="/purchase-success" element={<ProtectedRoute><PurchaseSuccessPage /></ProtectedRoute>} />

          {/* Previous Vehicles Page */}
          <Route path="/previous-vehicles" element={<ProtectedRoute><PreviousVehiclesPage /></ProtectedRoute>} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
