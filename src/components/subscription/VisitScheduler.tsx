import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, AlertCircle, Info } from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';
import { toast } from 'react-toastify';

interface AvailableDate {
  date: string;
  available_slots: number;
}

interface TimeSlot {
  time: string;
  display_time: string;
}

interface VisitSchedulerProps {
  subscriptionId: number;
}

const VisitScheduler: React.FC<VisitSchedulerProps> = ({ subscriptionId }) => {
  const navigate = useNavigate();
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingVisits, setRemainingVisits] = useState<number | null>(null);

  // Get available dates on component mount
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check subscription status and visit availability
        const availabilityRes = await subscriptionService.checkVisitAvailability();
        
        if (!availabilityRes.data.can_schedule) {
          setError(availabilityRes.data.reason || 'Cannot schedule visits at this time.');
          // Set remaining visits to 0 if no active subscription
          setRemainingVisits(0);
        } else if (availabilityRes.data.subscription) {
          setRemainingVisits(availabilityRes.data.subscription.remaining_visits);
        }

        // Get available dates regardless of subscription status
        const datesRes = await subscriptionService.getAvailableDates();
        if (datesRes.data.available_dates.length === 0) {
          toast.warning('No available dates found. Please try again later.');
        } else {
          setAvailableDates(datesRes.data.available_dates);
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch available dates';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableDates();
  }, []);

  // Fetch available time slots when date changes
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedDate) return;

      try {
        setLoading(true);
        const response = await subscriptionService.getAvailableTimeSlots(selectedDate);
        setAvailableTimes(response.data.available_times);
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || 'Failed to fetch available time slots';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, [selectedDate]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if there's an active subscription before submitting
    if (!remainingVisits || remainingVisits <= 0) {
      toast.error('Please purchase or renew your subscription to schedule visits');
      return;
    }

    setLoading(true);

    try {
      // Validate date is a weekday
      const selectedDay = new Date(selectedDate).getDay();
      if (selectedDay === 0 || selectedDay === 6) {
        throw new Error('Visits can only be scheduled on weekdays');
      }

      // Validate time is between 9 AM and 5 PM
      const hour = parseInt(selectedTime.split(':')[0]);
      if (hour < 9 || hour >= 17) {
        throw new Error('Visits can only be scheduled between 9 AM and 5 PM');
      }

      await subscriptionService.scheduleVisit({
        subscription: subscriptionId,
        preferred_date: selectedDate,
        preferred_time: selectedTime,
        notes: notes
      });

      toast.success('Visit scheduled successfully!');
      navigate('/subscription/active');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to schedule visit';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Subscription Status Alert */}
      {error && (
        <div className="mb-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Subscription Required</h3>
              <p className="mt-2 text-sm text-yellow-700">{error}</p>
              <a
                href="/subscription/plans"
                className="mt-2 inline-block text-sm font-medium text-yellow-600 hover:text-yellow-500"
              >
                View Subscription Plans →
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-gray-400 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Schedule a Visit</h2>
          </div>
          {remainingVisits !== null && (
            <div className="flex items-center text-sm text-gray-600">
              <Info className="w-4 h-4 mr-1" />
              {remainingVisits} visits remaining
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Date
            </label>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableDates.map((date) => (
                <button
                  key={date.date}
                  type="button"
                  onClick={() => handleDateSelect(date.date)}
                  className={`p-3 text-sm rounded-md border ${
                    selectedDate === date.date
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-300 hover:border-orange-500'
                  }`}
                >
                  <div className="font-medium">
                    {new Date(date.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {date.available_slots} slots available
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          {selectedDate && availableTimes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Time
              </label>
              <div className="mt-1 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableTimes.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedTime(slot.time)}
                    className={`p-2 text-sm rounded-md border ${
                      selectedTime === slot.time
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-300 hover:border-orange-500'
                    }`}
                  >
                    {slot.display_time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              placeholder="Any special instructions or requests..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !selectedDate || !selectedTime || !remainingVisits || remainingVisits <= 0}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <Clock className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Scheduling...
                </span>
              ) : (
                'Schedule Visit'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Scheduling Rules */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Scheduling Rules</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Visits can only be scheduled on weekdays</li>
          <li>• Available time slots are between 9 AM and 5 PM</li>
          <li>• Maximum 8 visits can be scheduled per day</li>
          <li>• You must have an active subscription with remaining visits</li>
          <li>• You cannot schedule multiple visits on the same day</li>
        </ul>
      </div>
    </div>
  );
};

export default VisitScheduler; 