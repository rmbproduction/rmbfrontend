import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 8, 
  color = '#FF5733',
  message = 'Loading...'
}) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <Loader 
        className={`w-${size} h-${size} animate-spin`} 
        style={{ color }}
      />
      <p className="mt-4 text-gray-700">{message}</p>
    </div>
  );
};

export default LoadingSpinner; 