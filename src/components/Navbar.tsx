import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Wrench, Menu, X, ShoppingCart, User, ChevronDown, 
  Bike, Clock, LogOut, UserCircle, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCartCountStore } from '../hooks/cart/useCartQueries';

// Define menu items to avoid duplication
const MENU_ITEMS = [
  { label: 'Services', path: '/', section: 'services' },
  { label: 'Spare Parts', path: '/spare-parts' },
  { label: 'Subscription', path: '/subscription' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Contact Us', path: '/contact-us' }
];

// Define vehicle menu items for dropdown
const VEHICLE_MENU_ITEMS = [
  { label: 'Buy Vehicle', path: '/vehicles' },
  { label: 'Sell Vehicle', path: '/sell-vehicle' },
];

// Define user menu items
const USER_MENU_ITEMS = [
  { id: 'profile', label: 'Profile Information', path: '/profile?tab=profile', icon: UserCircle },
  { id: 'vehicles', label: 'Vehicles for Sale', path: '/profile?tab=vehicles', icon: Bike },
  { id: 'repairs', label: 'My Repairs', path: '/profile?tab=repairs', icon: Wrench },
  { id: 'bookings', label: 'My Bookings', path: '/profile?tab=bookings', icon: Clock },
  { id: 'subscriptions', label: 'My Subscriptions', path: '/profile?tab=subscriptions', icon: Wallet },
  // { id: 'change-password', label: 'Change Password', path: '/profile?tab=change-password', icon: Settings },
  { id: 'logout', label: 'Logout', path: '/logout', icon: LogOut },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isVehicleMenuOpen, setIsVehicleMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const vehicleMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { count: cartCount } = useCartCountStore();

  const handleNavigation = (path: string, section?: string) => {
    if (section && path === '/') {
      if (location.pathname === '/') {
        // If we're already on the home page, just scroll
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // If we're not on the home page, navigate and then scroll
        navigate(path);
        setTimeout(() => {
          const element = document.getElementById(section);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      }
    } else {
      navigate(path);
    }
    setIsOpen(false);
    setIsUserMenuOpen(false);
    setIsVehicleMenuOpen(false);
  };
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add click outside handler for vehicle menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vehicleMenuRef.current && !vehicleMenuRef.current.contains(event.target as Node)) {
        setIsVehicleMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => handleNavigation('/')}>
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-white border-2 border-[#FF5733] flex items-center justify-center shadow-md">
                <img 
                  src="https://res.cloudinary.com/dz81bjuea/image/upload/v1747031052/logo_jlugzw.jpg"
                  alt="RepairMyBike Logo"
                  className="h-11 w-11 object-cover transform hover:scale-105 transition-transform duration-200"
                />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">RepairMyBike</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {MENU_ITEMS.map(item => (
              <button 
                key={item.label}
                onClick={() => handleNavigation(item.path, item.section)}
                className="px-3 py-2 text-gray-700 hover:text-[#FF5733] transition-colors rounded-lg hover:bg-gray-50 text-base"
              >
                {item.label}
              </button>
            ))}
            
            {/* Vehicle Buy/Sell Dropdown */}
            <div className="relative" ref={vehicleMenuRef}>
              <button
                onClick={() => setIsVehicleMenuOpen(!isVehicleMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-[#FF5733] transition-colors rounded-lg hover:bg-gray-50"
              >
                <span>Sell/Buy</span>
                <ChevronDown 
                  className={`h-4 w-4 transform transition-transform duration-200 ${
                    isVehicleMenuOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              <AnimatePresence>
                {isVehicleMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl py-1 z-[9999] border border-gray-100"
                  >
                    <div className="relative">
                      <div 
                        className="absolute -top-2 right-4 w-4 h-4 bg-white transform rotate-45 border-t border-l border-gray-100"
                      />
                      <div className="relative bg-white rounded-lg z-10">
                        {VEHICLE_MENU_ITEMS.map((item) => (
                          <motion.button
                            key={item.label}
                            onClick={() => handleNavigation(item.path)}
                            className="flex items-center w-full px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
                            whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                          >
                            <Bike className="h-5 w-5 mr-3" />
                            {item.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Cart and User Menu */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/cart')}
              className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-[#FF5733]" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 bg-[#FF5733] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-[#FF5733] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <User className="h-6 w-6" />
                  <ChevronDown 
                    className={`h-4 w-4 transform transition-transform duration-200 ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl py-1 z-[9999] border border-gray-100"
                    >
                      <div className="relative">
                        <div 
                          className="absolute -top-2 right-4 w-4 h-4 bg-white transform rotate-45 border-t border-l border-gray-100"
                        />
                        <div className="relative bg-white rounded-lg z-10">
                          {USER_MENU_ITEMS.map((item) => (
                            item.id === 'logout' ? (
                              <motion.button
                                key={item.id}
                                onClick={handleLogout}
                                className="flex items-center w-full px-4 py-3 text-base text-red-600 hover:bg-red-50 border-t border-gray-100"
                                whileHover={{ backgroundColor: "rgba(254, 226, 226, 0.5)" }}
                              >
                                <item.icon className="h-5 w-5 mr-3" />
                                {item.label}
                              </motion.button>
                            ) : (
                              <motion.button
                                key={item.id}
                                onClick={() => handleNavigation(item.path)}
                                className="flex items-center w-full px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
                                whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                              >
                                <item.icon className="h-5 w-5 mr-3" />
                                {item.label}
                              </motion.button>
                            )
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button 
                onClick={() => handleNavigation('/login')}
                className="bg-[#FF5733] text-white px-6 py-2.5 rounded-full hover:bg-[#ff4019] transition-colors text-base"
              >
                Login
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-2">
            {MENU_ITEMS.map(item => (
              <button 
                key={item.label}
                onClick={() => handleNavigation(item.path, item.section)}
                className="flex w-full px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
              >
                {item.label}
              </button>
            ))}
            
            {/* Mobile Vehicle Menu */}
            <div className="py-2 border-t border-gray-100 mt-1">
              <div className="px-4 py-2 text-sm font-medium text-gray-500">Vehicles</div>
              {VEHICLE_MENU_ITEMS.map(item => (
                <button 
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  className="flex items-center w-full px-4 py-3 text-base text-gray-700 hover:bg-gray-50"
                >
                  <Bike className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              ))}
            </div>

            {!isAuthenticated && (
              <div className="px-4 py-3 border-t border-gray-100">
                <button 
                  onClick={() => handleNavigation('/login')}
                  className="w-full bg-[#FF5733] text-white py-3 rounded-xl hover:bg-[#ff4019] transition-colors text-base"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;