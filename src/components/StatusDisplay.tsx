import React, { useEffect, useState } from 'react';
import { getStatusIcon, getStatusColor, getStatusBadgeColor } from '../utils/statusUtils';

interface StatusDisplayProps {
  status: string;
  statusDisplay?: string;
  title?: string;
  message?: string;
  compact?: boolean;
}

/**
 * A reusable component for displaying status information consistently across the application
 */
const StatusDisplay: React.FC<StatusDisplayProps> = ({
  status,
  statusDisplay,
  title,
  message,
  compact = false
}) => {
  // Use state to keep track of the displayed title to ensure it updates when props change
  const [displayTitle, setDisplayTitle] = useState(title || statusDisplay || status);
  
  // Update the display title whenever any of the props change
  useEffect(() => {
    setDisplayTitle(title || statusDisplay || status);
  }, [title, statusDisplay, status]);
  
  if (compact) {
    return (
      <div className="flex items-center">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-2 border ${getStatusColor(status)}`}>
          {getStatusIcon(status)}
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(status)}`}>
          {displayTitle}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 border-2 ${getStatusColor(status)}`}>
      <div className="flex items-center mb-2">
        <div className="mr-3 h-10 w-10 rounded-full flex items-center justify-center bg-white shadow-sm">
          {getStatusIcon(status)}
        </div>
        <h3 className="font-semibold text-lg flex items-center">
          <span className={`px-3 py-1 text-xs rounded-full font-medium mr-2 ${getStatusBadgeColor(status)}`}>
            {displayTitle}
          </span>
          Current Status
        </h3>
      </div>
      {message && (
        <p className="text-gray-700 ml-13">
          {message}
        </p>
      )}
    </div>
  );
};

export default StatusDisplay; 