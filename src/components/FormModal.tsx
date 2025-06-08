import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Home, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
  supportPhone?: string;
}

const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  supportPhone
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleHomeClick = () => {
    navigate('/');
    onClose();
  };

  const handleProfileClick = () => {
    navigate('/profile?tab=vehicles');
    onClose();
  };

  const phone = supportPhone || "8168-1217-11";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden p-6"
          >
            {/* Icon */}
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 ${
              type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {type === 'success' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              {title}
            </h3>

            {/* Message */}
            <div className="text-sm text-gray-600 text-center whitespace-pre-line mb-6">
              {message}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {type === 'success' ? (
                <>
                  {/* Home Button */}
                  <button
                    onClick={handleHomeClick}
                    className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-lg font-medium hover:bg-[#ff4019] transition-colors flex items-center justify-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </button>
                  
                  {/* Vehicle Profile Button */}
                  <button
                    onClick={handleProfileClick}
                    className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    My Vehicles
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="w-full py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                  
                  {supportPhone && (
                    <button
                      onClick={() => window.location.href = `tel:${phone.replace(/-/g, '')}`}
                      className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Contact Support
                      <span>{phone}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default FormModal; 