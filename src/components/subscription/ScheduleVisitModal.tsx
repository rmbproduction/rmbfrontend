import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: string, time: string) => void;
  remainingVisits: number;
  maxVisits: number;
  subscriptionEndDate: string;
  error?: string | null;
}

const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  remainingVisits,
  maxVisits,
  subscriptionEndDate,
  error
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Available time slots (9 AM to 5 PM, hourly slots)
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate && selectedTime) {
      onSchedule(selectedDate, selectedTime);
      setSelectedDate('');
      setSelectedTime('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Visit</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-md flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Subscription Status */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700">Subscription Status</h4>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Remaining Visits</p>
                    <p className={`text-lg font-semibold ${
                      remainingVisits <= 1 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {remainingVisits} / {maxVisits}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valid Until</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {format(new Date(subscriptionEndDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date Selection */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="date"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time
                  </label>
                  <div className="relative">
                    <select
                      id="time"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      required
                    >
                      <option value="">Select a time</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                        </option>
                      ))}
                    </select>
                    <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!selectedDate || !selectedTime || remainingVisits <= 0}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                    !selectedDate || !selectedTime || remainingVisits <= 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  Schedule Visit
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ScheduleVisitModal; 