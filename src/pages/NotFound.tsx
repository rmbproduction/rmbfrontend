import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bike, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="relative h-64 bg-[#FF5733] bg-opacity-10">
            <motion.div
              initial={{ x: -100 }}
              animate={{ x: 0 }}
              transition={{
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Bike className="w-32 h-32 text-[#FF5733]" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
          </div>

          <div className="px-6 py-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-6xl font-bold text-gray-900 mb-4"
            >
              404
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-xl text-gray-600 mb-8"
            >
              Oops! Looks like this page took a wrong turn
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FF5733] text-white rounded-xl hover:bg-[#ff4019] transition-colors"
              >
                <Home className="w-5 h-5" />
                Return Home
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="px-6 py-4 bg-gray-50 text-center text-gray-500 text-sm"
          >
            Need help? <a href="/contact" className="text-[#FF5733] hover:underline">Contact our support team</a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound; 