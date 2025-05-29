import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';
import { toast } from 'react-toastify';

interface CancelVisitModalProps {
  visitId: number;
  visitDate: string;
  onClose: () => void;
  onCancelled: () => void;
}

const CancelVisitModal: React.FC<CancelVisitModalProps> = ({
  visitId,
  visitDate,
  onClose,
  onCancelled
}) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await subscriptionService.cancelVisit(visitId.toString(), {
        cancellation_notes: notes
      });

      toast.success('Visit cancelled successfully');
      onCancelled();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to cancel visit';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Cancel Visit</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCancel}>
          <div className="p-4 space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded flex items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm text-yellow-700">
                Are you sure you want to cancel your visit scheduled for{' '}
                <span className="font-medium">
                  {new Date(visitDate).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                ?
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cancellation Reason (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="Please provide a reason for cancellation..."
              />
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
              disabled={loading}
            >
              Keep Visit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cancelling...' : 'Cancel Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelVisitModal; 