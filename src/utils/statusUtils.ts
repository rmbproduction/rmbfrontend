import React from 'react';
import { 
  Clock, Check, Calendar, Info, Bike, FileText, 
  DollarSign, X, AlertCircle 
} from 'lucide-react';

/**
 * Get the appropriate icon component for a given sell request status
 */
export const getStatusIcon = (status?: string | null): React.ReactNode => {
  // Handle null or undefined status
  if (status === null || status === undefined) {
    return React.createElement(AlertCircle, { className: "w-5 h-5 text-gray-500" });
  }
  
  switch(status) {
    case 'submitted':
      return React.createElement(Clock, { className: "w-5 h-5 text-yellow-500" });
    case 'confirmed':
      return React.createElement(Check, { className: "w-5 h-5 text-blue-500" });
    case 'inspection_scheduled':
      return React.createElement(Calendar, { className: "w-5 h-5 text-blue-600" });
    case 'under_inspection':
      return React.createElement(Info, { className: "w-5 h-5 text-blue-700" });
    case 'service_center':
      return React.createElement(Bike, { className: "w-5 h-5 text-indigo-600" });
    case 'inspection_done':
      return React.createElement(FileText, { className: "w-5 h-5 text-indigo-700" });
    case 'offer_made':
      return React.createElement(DollarSign, { className: "w-5 h-5 text-green-600" });
    case 'counter_offer':
      return React.createElement(DollarSign, { className: "w-5 h-5 text-green-700" });
    case 'deal_closed':
      return React.createElement(Check, { className: "w-5 h-5 text-green-800" });
    case 'rejected':
      return React.createElement(X, { className: "w-5 h-5 text-red-600" });
    default:
      return React.createElement(AlertCircle, { className: "w-5 h-5 text-gray-500" });
  }
};

/**
 * Get the background and border colors for status container
 */
export const getStatusColor = (status?: string | null): string => {
  // Handle null or undefined status
  if (status === null || status === undefined) {
    return 'bg-gray-50 border-gray-300';
  }
  
  switch(status) {
    case 'submitted':
      return 'bg-yellow-50 border-yellow-300';
    case 'confirmed':
      return 'bg-blue-50 border-blue-300';
    case 'inspection_scheduled':
    case 'under_inspection':
      return 'bg-blue-50 border-blue-300';
    case 'service_center':
    case 'inspection_done':
      return 'bg-indigo-50 border-indigo-300';
    case 'offer_made':
    case 'counter_offer':
      return 'bg-green-50 border-green-300';
    case 'deal_closed':
      return 'bg-green-50 border-green-300';
    case 'rejected':
      return 'bg-red-50 border-red-300';
    default:
      return 'bg-gray-50 border-gray-300';
  }
};

/**
 * Get the badge color for status display
 */
export const getStatusBadgeColor = (status?: string | null): string => {
  // Handle null or undefined status
  if (status === null || status === undefined) {
    return 'bg-gray-100 text-gray-800';
  }
  
  switch(status) {
    case 'submitted':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'inspection_scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'under_inspection':
      return 'bg-blue-200 text-blue-900';
    case 'service_center':
      return 'bg-indigo-100 text-indigo-800';
    case 'inspection_done':
      return 'bg-indigo-100 text-indigo-800';
    case 'offer_made':
      return 'bg-green-100 text-green-800';
    case 'counter_offer':
      return 'bg-green-200 text-green-900';
    case 'deal_closed':
      return 'bg-purple-100 text-purple-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}; 