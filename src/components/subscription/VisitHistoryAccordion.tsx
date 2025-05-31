import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface VisitHistoryItem {
  id: number;
  subscription_id: number;
  username: string;
  plan_name: string;
  scheduled_date: string;
  status: string;
  status_display: string;
  service_notes?: string;
  completion_date: string | null;
  technician_notes: string | null;
  created_at: string;
}

interface VisitHistoryAccordionProps {
  visits: VisitHistoryItem[];
  isLoading: boolean;
}

const VisitHistoryAccordion: React.FC<VisitHistoryAccordionProps> = ({ visits, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);

  console.log('VisitHistoryAccordion render:', {
    visitsLength: visits?.length,
    isLoading,
    hasVisits: Boolean(visits?.length)
  });

  if (!Array.isArray(visits) || visits.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">No visit history available</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      case 'scheduled':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900">Past Visits</h3>
          <span className="text-sm text-gray-500">({visits.length} visits)</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-4 space-y-4">
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{visit.plan_name}</h4>
                      <p className="text-sm text-gray-500">Visit #{visit.id}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(visit.status)}
                      <span className={`text-sm font-medium ${getStatusColor(visit.status)}`}>
                        {visit.status_display}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Scheduled Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(visit.scheduled_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Scheduled Time</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(visit.scheduled_date), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(visit.service_notes || visit.technician_notes) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {visit.service_notes && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-500">Service Notes</p>
                          <p className="text-sm text-gray-900">{visit.service_notes}</p>
                        </div>
                      )}
                      {visit.technician_notes && (
                        <div>
                          <p className="text-sm text-gray-500">Technician Notes</p>
                          <p className="text-sm text-gray-900">{visit.technician_notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {visit.completion_date && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Completed On</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(visit.completion_date), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisitHistoryAccordion; 