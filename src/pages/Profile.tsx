import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings, LogOut, Key, Bike, Bell, 
  CreditCard, MapPin, Clock, Shield, Menu, X,
  Loader, Wrench, CreditCard as Subscription
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import ForSaleVehicles from '../components/ForSaleVehicles';
import BookedVehicles from '../components/BookedVehicles';
import MyRepairs from './MyRepairs';
import MySubscription from '../components/subscription/MySubscription';

interface UserProfile {
  username: string;
  email: string;
  created_at: string;
  name?: string;
  phone?: string;
  address?: string;
  preferred_location?: string;
}

interface SidebarProps {
  className?: string;
}

type TabType = 'profile' | 'vehicles' | 'bookings' | 'repairs' | 'subscriptions';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    username: '',
    email: '',
    name: '',
    phone: '',
    address: ''
  });

  // Add debug logs
  console.log('Profile Component State:', {
    isAuthenticated,
    isLoading,
    user,
    activeTab,
    formData
  });

  // Handle authentication check
  useEffect(() => {
    console.log('Auth Check Effect:', { isAuthenticated, isLoading });
    if (!isAuthenticated && !isLoading) {
      console.log('Redirecting to login...');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Update form data when user data changes
  useEffect(() => {
    console.log('User Data Effect:', { user });
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        name: user.profile?.name || user.name || '',
        phone: user.profile?.phone || user.phone || '',
        address: user.profile?.address || user.address || ''
      });
    }
  }, [user]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-[#FF5733] mx-auto" />
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or no user data, show error state
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Authentication Required</h2>
          <p className="mt-2 text-gray-600">Please log in to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#ff4019]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handlePasswordChange = () => {
    navigate('/reset-password');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsDrawerOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const upcomingServices = [
    {
      id: 1,
      service: 'Premium Tune-Up',
      date: '2024-03-15',
      time: '10:00 AM',
      status: 'Scheduled'
    },
    {
      id: 2,
      service: 'Brake Service',
      date: '2024-03-20',
      time: '2:30 PM',
      status: 'Pending'
    }
  ];

  const serviceHistory = [
    {
      id: 3,
      service: 'Basic Maintenance',
      date: '2024-02-10',
      mechanic: 'Mike Smith',
      rating: 5
    },
    {
      id: 4,
      service: 'Tire Replacement',
      date: '2024-01-15',
      mechanic: 'Sarah Johnson',
      rating: 4
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm text-[#FF5733] hover:text-[#ff4019]"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="space-y-6">
              {/* Username and Email inline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733] disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Additional fields when editing */}
              {isEditing && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      case 'vehicles':
        return <ForSaleVehicles />;
      case 'bookings':
        return <BookedVehicles />;
      case 'repairs':
        return <MyRepairs />;
      case 'subscriptions':
        return <MySubscription />;
      default:
        return null;
    }
  };

  const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-lg p-6 space-y-6 ${className}`}>
      <div className="text-center">
        <div className="h-24 w-24 rounded-full bg-[#FFF5F2] flex items-center justify-center mx-auto">
          <User className="h-12 w-12 text-[#FF5733]" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          {user.username}
        </h2>
        <p className="text-sm text-gray-500">
          {user.email}
        </p>
      </div>

      <nav className="space-y-2">
        <button
          onClick={() => handleTabChange('profile')}
          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
            activeTab === 'profile'
              ? 'bg-[#FFF5F2] text-[#FF5733]'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <User className="h-5 w-5 mr-3" />
          Profile Information
        </button>
        <button
          onClick={() => handleTabChange('vehicles')}
          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
            activeTab === 'vehicles'
              ? 'bg-[#FFF5F2] text-[#FF5733]'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Bike className="h-5 w-5 mr-3" />
          Vehicles for Sale
        </button>
        <button
          onClick={() => handleTabChange('bookings')}
          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
            activeTab === 'bookings'
              ? 'bg-[#FFF5F2] text-[#FF5733]'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Clock className="h-5 w-5 mr-3" />
          My Bookings
        </button>
        <button
          onClick={() => handleTabChange('repairs')}
          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
            activeTab === 'repairs'
              ? 'bg-[#FFF5F2] text-[#FF5733]'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Wrench className="h-5 w-5 mr-3" />
          My Repairs
        </button>
        <button
          onClick={() => handleTabChange('subscriptions')}
          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
            activeTab === 'subscriptions'
              ? 'bg-[#FFF5F2] text-[#FF5733]'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Subscription className="h-5 w-5 mr-3" />
          My Subscriptions
        </button>
      </nav>

      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={handlePasswordChange}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
        >
          <Key className="h-5 w-5 mr-3" />
          Change Password
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg mt-2"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm py-4 px-4 flex items-center justify-between">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween' }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white z-50 lg:hidden"
            >
              <div className="p-4 flex justify-end">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <Sidebar className="rounded-none shadow-none" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block lg:col-span-1"
          >
            <Sidebar />
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;