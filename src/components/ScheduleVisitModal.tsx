import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, X, Check, Clock, AlertCircle, Info } from 'lucide-react';
import { UserSubscription } from '../models/subscription-plan';
import useSubscriptions from '../hooks/useSubscriptions';

interface ScheduleVisitModalProps {
  subscription: UserSubscription;
  onClose: () => void;
  onSuccess: () => void;
}

const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  subscription,
  onClose,
  onSuccess
}) => {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { scheduleVisit } = useSubscriptions();

  // Get tomorrow's date as string in YYYY-MM-DD format for min date
  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Calculate the maximum date (subscription end date or 3 months from now)
  const getMaxDate = (): string => {
    const subscriptionEndDate = new Date(subscription.end_date);
    
    // Also limit to 3 months from now as a reasonable scheduling window
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    // Use the earlier of the two dates
    const maxDate = new Date(Math.min(subscriptionEndDate.getTime(), threeMonthsFromNow.getTime()));
    return maxDate.toISOString().split('T')[0];
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduledDate) {
      setError('Please select a date for your visit');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await scheduleVisit(
        subscription.id,
        scheduledDate,
        scheduledTime,
        notes
      );
      
      if (success) {
        onSuccess();
        onClose();
      } else {
        setError('Failed to schedule your visit. Please try again.');
      }
    } catch (err) {
      console.error('Error scheduling visit:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Schedule Service Visit</h2>
          <button 
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Subscription info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">{subscription.plan_name}</h3>
          <p className="text-sm text-gray-600">
            Remaining visits: <span className="font-semibold">{subscription.remaining_visits}</span>
          </p>
          <p className="text-sm text-gray-600">
            Valid until: <span className="font-semibold">{new Date(subscription.end_date).toLocaleDateString()}</span>
          </p>
        </div>
        
        {/* Information message */}
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg flex items-start">
          <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            Schedule your service visit within your subscription period. Our technician will visit your location at the scheduled time.
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Date picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Calendar className="h-5 w-5" />
              </div>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={getTomorrowDate()}
                max={getMaxDate()}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Time picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Clock className="h-5 w-5" />
              </div>
              <select
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
              >
                <option value="09:00">9:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="13:00">1:00 PM</option>
                <option value="14:00">2:00 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="17:00">5:00 PM</option>
              </select>
            </div>
          </div>
          
          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
              placeholder="Any specific issues or instructions for the technician"
              rows={3}
            />
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading || !scheduledDate}
              className={`
                flex-1 py-3 rounded-lg font-medium text-white 
                ${loading || !scheduledDate ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FF5733] hover:bg-[#ff4019] transition-colors'}
                flex items-center justify-center gap-2
              `}
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Schedule Visit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ScheduleVisitModal;
