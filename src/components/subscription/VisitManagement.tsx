import React from 'react';
import { Calendar, Clock, AlertCircle, RefreshCw, XCircle, XSquare } from 'lucide-react';

interface Visit {
  id: number;
  scheduled_date: string;
  status: string;
  service_notes: string;
  plan_name?: string;
  status_display?: string;
  cancellation_notes?: string;
  cancelled_at?: string;
}

interface VisitManagementProps {
  visit: Visit;
  onUpdate: (visitId: number) => void;
  onCancel: (visitId: number) => void;
}

const VisitManagement: React.FC<VisitManagementProps> = ({ visit, onUpdate, onCancel }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isCancelled = visit.status.toLowerCase() === 'cancelled';

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${isCancelled ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {isCancelled ? (
              <XSquare className="w-5 h-5 text-red-400" />
            ) : (
              <Calendar className="w-5 h-5 text-gray-400" />
            )}
            <h3 className={`text-lg font-medium ${isCancelled ? 'text-red-900' : 'text-gray-900'}`}>
              {isCancelled ? 'Cancelled Visit' : 'Scheduled Visit'}
              {visit.plan_name && (
                <span className="ml-2 text-sm text-gray-500">
                  ({visit.plan_name})
                </span>
              )}
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(visit.status)}`}>
            {visit.status_display || visit.status}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
            <div>
              <p className={`text-sm font-medium ${isCancelled ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {formatDate(visit.scheduled_date)}
              </p>
              <p className={`text-sm ${isCancelled ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                {formatTime(visit.scheduled_date)}
              </p>
            </div>
          </div>

          {visit.service_notes && (
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
              <p className="text-sm text-gray-600">{visit.service_notes}</p>
            </div>
          )}

          {isCancelled && visit.cancellation_notes && (
            <div className="flex items-start mt-4 p-3 bg-red-50 rounded-md">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">Cancellation Notes</p>
                <p className="text-sm text-red-600">{visit.cancellation_notes}</p>
                {visit.cancelled_at && (
                  <p className="text-xs text-red-500 mt-1">
                    Cancelled on {formatDate(visit.cancelled_at)} at {formatTime(visit.cancelled_at)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Only show for scheduled visits */}
        {visit.status.toLowerCase() === 'scheduled' && (
          <div className="mt-6 flex items-center space-x-3">
            <button
              onClick={() => onUpdate(visit.id)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reschedule Visit
            </button>
            <button
              onClick={() => onCancel(visit.id)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Visit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitManagement; 