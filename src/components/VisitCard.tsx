import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { VisitSchedule } from '../models/subscription-plan';

interface VisitCardProps {
  visit: VisitSchedule;
  onCancelVisit: (visitId: number) => void;
}

const VisitCard: React.FC<VisitCardProps> = ({ visit, onCancelVisit }) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Format date
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString || 'N/A';
    }
  };
  
  // Format time
  const formatTime = (dateString: string): string => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid time';
      
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'N/A';
    }
  };
  
  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full mr-2 ${getStatusColor(visit.status)}`}>
              {visit.status_display}
            </span>
            <h3 className="text-lg font-semibold text-gray-900">{visit.plan_name}</h3>
          </div>
          
          <div className="flex items-center text-gray-700 mb-1">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>{formatDate(visit.scheduled_date)}</span>
          </div>
          
          <div className="flex items-center text-gray-700 mb-3">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>{formatTime(visit.scheduled_date)}</span>
          </div>
          
          {visit.service_notes && (
            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
              <p className="font-medium mb-1">Service Notes:</p>
              <p>{visit.service_notes}</p>
            </div>
          )}
          
          {visit.technician_notes && (
            <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
              <p className="font-medium mb-1">Technician Notes:</p>
              <p>{visit.technician_notes}</p>
            </div>
          )}
        </div>
        
        {visit.status === 'scheduled' && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="text-red-600 hover:text-red-800 p-1"
            title="Cancel Visit"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div className="mt-3 border-t pt-3">
          <p className="text-sm text-gray-700 mb-2">Are you sure you want to cancel this visit?</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              No, Keep It
            </button>
            <button
              onClick={() => {
                onCancelVisit(visit.id);
                setShowCancelConfirm(false);
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Yes, Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VisitCard;
