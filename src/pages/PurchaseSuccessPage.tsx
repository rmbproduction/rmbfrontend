import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronRight, Home, ShoppingBag } from 'lucide-react';

const PurchaseSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Get purchase ID from session storage
    const lastPurchaseId = sessionStorage.getItem('lastPurchaseId');
    setPurchaseId(lastPurchaseId);

    // Set up countdown for redirection
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewPurchases = () => {
    navigate('/account/purchases');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your vehicle purchase has been successfully initiated. We'll be in touch shortly with next steps.
        </p>

        {purchaseId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Purchase Reference</p>
            <p className="font-medium text-gray-900">{purchaseId}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center space-x-2 bg-[#FF5733] text-white py-3 px-4 rounded-lg hover:bg-[#ff4019] transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Back to Home</span>
          </button>

          <button
            onClick={handleViewPurchases}
            className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>View My Purchases</span>
          </button>
        </div>

        <p className="text-xs text-gray-500">
          You will be redirected to the home page in {countdown} seconds
        </p>
      </motion.div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          If you have any questions about your purchase, please contact our support team.
        </p>
        <p className="mt-1">
          <a href="tel:+919876543210" className="text-[#FF5733] hover:underline">
            +91 987-654-3210
          </a>
        </p>
      </div>
    </div>
  );
};

export default PurchaseSuccessPage; 