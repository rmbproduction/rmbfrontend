import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wrench, Menu, X, ShoppingCart, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

// Define menu items to avoid duplication
const MENU_ITEMS = [
  { label: 'Services', path: '/', section: 'services' },
  { label: 'How It Works', path: '/', section: 'how-it-works' },
  { label: 'Pricing', path: '/', section: 'pricing' },
  { label: 'Contact', path: '/contact' },
  { label: 'Buy Vehicle', path: '/vehicles' }
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

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

  // Function to handle navigation and section scrolling
  const handleNavigation = (path: string, section?: string) => {
    if (path === '/' && section) {
      // If we're already on home page, just scroll
      if (location.pathname === '/') {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Navigate to home and then scroll after a small delay
        navigate('/');
        setTimeout(() => {
          const element = document.getElementById(section);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      // Regular navigation
      navigate(path);
    }
    // Close mobile menu and user menu if open
    setIsOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Cart count update logic
  useEffect(() => {
    const updateCartCount = () => {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const checkoutItem = JSON.parse(localStorage.getItem('checkoutItem') || 'null');
      const checkoutMode = localStorage.getItem('checkoutMode');

      let totalCount = 0;
      if (checkoutMode === 'cart') {
        totalCount = cartItems.length;
      } else if (checkoutMode === 'buy-now') {
        totalCount = checkoutItem ? 1 : 0;
      } else {
        totalCount = cartItems.length + (checkoutItem ? 1 : 0);
      }
      
      setCartCount(totalCount);
    };

    updateCartCount(); // Initial count
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);
    const interval = setInterval(updateCartCount, 1000);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
      clearInterval(interval);
    };
  }, []);

  // Cart icon component to avoid duplication
  const CartIcon = () => (
    <div 
      className="relative cursor-pointer"
      onClick={() => handleNavigation('/cart')}
    >
      <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-[#FF5733]" />
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-[#FF5733] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </div>
  );

  // User menu component
  const UserMenu = () => (
    <div className="relative" ref={userMenuRef}>
      <button
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-[#FF5733]"
      >
        <div className="h-8 w-8 rounded-full bg-[#FFF5F2] flex items-center justify-center">
          <User className="h-5 w-5 text-[#FF5733]" />
        </div>
        <span className="hidden md:block">{user?.username}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isUserMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50"
          >
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
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Menu items component to avoid duplication
  const MenuItems = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {MENU_ITEMS.map((item) => (
        <button 
          key={item.label}
          onClick={() => handleNavigation(item.path, item.section)}
          className={`text-gray-700 hover:text-[#FF5733] ${isMobile ? 'text-left' : ''}`}
        >
          {item.label}
        </button>
      ))}
    </>
  );

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => handleNavigation('/')}>
            <Wrench className="h-8 w-8 text-[#FF5733]" />
            <span className="ml-2 text-xl font-bold text-gray-900">RepairMyBike</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <MenuItems />
            <CartIcon />
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <button 
                onClick={() => handleNavigation('/login')}
                className="bg-[#FF5733] text-white px-6 py-2 rounded-full hover:bg-[#ff4019] transition-colors"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <CartIcon />
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => handleNavigation('/login')}
                className="text-gray-700 hover:text-[#FF5733]"
              >
                <User size={24} />
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-[#FF5733]"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-4">
              <MenuItems isMobile />
              {!isAuthenticated && (
                <button 
                  onClick={() => handleNavigation('/login')}
                  className="bg-[#FF5733] text-white px-6 py-2 rounded-full hover:bg-[#ff4019] transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;