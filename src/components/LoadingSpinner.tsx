import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <RefreshCw className={`${sizeClasses[size]} text-[#FF5733] animate-spin`} />
      {message && (
        <p className="mt-2 text-gray-600">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner; 