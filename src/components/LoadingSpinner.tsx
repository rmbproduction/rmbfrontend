import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = '#FF5733',
  message = 'Loading...'
}) => {
  // Map size string to specific pixel values
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Loader 
        className={`${sizeClasses[size]} animate-spin`} 
        style={{ color }}
      />
      <p className="mt-4 text-gray-700">{message}</p>
    </div>
  );
};

export default LoadingSpinner; 