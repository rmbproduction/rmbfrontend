import React from 'react';
import { XCircle, Phone } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose?: () => void;  // Made optional since we might not use it
  message: string;
  supportPhone: string;
  className?: string;
  showCloseButton?: boolean; // New prop to control close button visibility
}

const ErrorModal: React.FC<ErrorModalProps> = ({ 
  isOpen, 
  onClose,
  message, 
  supportPhone, 
  className = '',
  showCloseButton = true // Default to true for backward compatibility
}) => {
  if (!isOpen) return null;

  const phone = supportPhone || "8168-1217-11";

  const handleCallSupport = () => {
    window.location.href = `tel:${phone.replace(/-/g, '')}`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`bg-white rounded-lg p-6 max-w-md mx-4 ${className}`}>
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Error</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 whitespace-pre-line">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          {showCloseButton && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Close
            </button>
          )}
          <button
            type="button"
            onClick={handleCallSupport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call Us
          </button>
        </div>
        <div className="mt-4 text-center">
          <span>{phone}</span>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal; 