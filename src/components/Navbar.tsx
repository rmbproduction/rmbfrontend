import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wrench, Menu, X, ShoppingCart, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useActiveCart } from '../hooks/cart/useCartQueries';

// Define menu items to avoid duplication
const MENU_ITEMS = [
  { label: 'Services', path: '/', section: 'services' },
  { label: 'How It Works', path: '/', section: 'how-it-works' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Contact', path: '/contact' },
  { label: 'Buy Vehicle', path: '/vehicles' },
  { label: 'Sell Vehicle', path: '/sell-vehicle' }
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { cartCount } = useActiveCart();

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
  };
  
  const CartIcon = () => (
    <div 
      className="relative cursor-pointer"
      onClick={() => navigate('/cart')}
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
    </div>
  );

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
            <Wrench className="h-8 w-8 text-[#FF5733]" />
            <span className="ml-2 text-xl font-bold text-gray-900">RepairMyBike</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {MENU_ITEMS.map(item => (
              <button 
                key={item.label}
                onClick={() => handleNavigation(item.path, item.section)}
                className="text-gray-700 hover:text-[#FF5733]"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Cart and User Menu */}
          <div className="flex items-center space-x-4">
            <CartIcon />
            
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-[#FF5733]"
                >
                  <User className="h-6 w-6" />
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleNavigation('/bookings')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Bookings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => handleNavigation('/login')}
                className="bg-[#FF5733] text-white px-6 py-2 rounded-full hover:bg-[#ff4019] transition-colors"
              >
                Login
              </button>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-700 hover:text-[#FF5733]"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4">
            {MENU_ITEMS.map(item => (
              <button 
                key={item.label}
                onClick={() => handleNavigation(item.path, item.section)}
                className="block w-full text-left py-2 text-gray-700 hover:text-[#FF5733]"
              >
                {item.label}
              </button>
            ))}
            {!isAuthenticated && (
              <button 
                onClick={() => handleNavigation('/login')}
                className="bg-[#FF5733] text-white px-6 py-2 rounded-full hover:bg-[#ff4019] transition-colors mt-4"
              >
                Login
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;