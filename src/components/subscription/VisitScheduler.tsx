import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { axiosInstance } from '../../config/api.config';
import { format } from 'date-fns';

interface UpcomingVisit {
  id: number;
  scheduled_date: string;
  status: string;
  service_notes?: string;
}

interface AvailableDate {
  date: string;
  available_slots: number;
}

interface ActiveSubscription {
  id: number;
  user: number;
  username: string;
  plan_variant: number;
  plan_name: string;
  plan_type: string;
  duration_type: string;
  start_date: string;
  end_date: string;
  status: string;
  status_display: string;
  remaining_visits: number;
  max_visits: number;
  last_visit_date: string | null;
  is_currently_active: boolean;
  remaining_days: number;
  created_at: string;
}

const VisitScheduler: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch active subscription
  const { data: activeSubscription, isError: subscriptionError } = useQuery<ActiveSubscription[]>({
    queryKey: ['activeSubscription'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/subscription/subscriptions/active/');
        return response.data;
      } catch (error: any) {
        console.error('Error fetching active subscription:', error);
        toast.error('Failed to fetch active subscription');
        throw error;
      }
    }
  });

  // Update subscription ID when active subscription data changes
  useEffect(() => {
    if (activeSubscription?.[0]?.id) {
      setSubscriptionId(activeSubscription[0].id);
      console.log('Active Subscription Details:', {
        subscription: activeSubscription[0],
        id: activeSubscription[0].id,
        startDate: activeSubscription[0].start_date,
        endDate: activeSubscription[0].end_date,
        remainingVisits: activeSubscription[0].remaining_visits,
        status: activeSubscription[0].status
      });
    }
  }, [activeSubscription]);

  // Add this near the top of the component, after the state declarations
  useEffect(() => {
    if (activeSubscription?.[0]) {
      const remainingVisits = activeSubscription[0].remaining_visits;
      const maxVisits = activeSubscription[0].max_visits;
      
      if (remainingVisits === 1) {
        toast.warning(
          '⚠️ This is your last available visit. Please consider renewing your subscription.',
          { autoClose: false }
        );
      } else if (remainingVisits === 0) {
        toast.error(
          '❌ You have no remaining visits. Please renew your subscription to schedule more visits.',
          { autoClose: false }
        );
      } else if (remainingVisits <= maxVisits * 0.25) { // If less than 25% of visits remain
        toast.info(
          `ℹ️ You have ${remainingVisits} visit${remainingVisits !== 1 ? 's' : ''} remaining in your subscription.`,
          { autoClose: 7000 }
        );
      }
    }
  }, [activeSubscription]);

  // Fetch available dates
  const { data: availableDates, isError: datesError } = useQuery<{ available_dates: AvailableDate[] }>({
    queryKey: ['availableDates'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/subscription/visits/available_dates/');
        return response.data;
      } catch (error: any) {
        console.error('Error fetching available dates:', error);
        toast.error('Failed to fetch available dates');
        throw error;
      }
    },
    enabled: !!subscriptionId // Only fetch if we have a subscription ID
  });

  // Fetch upcoming visits
  const { data: upcomingVisits } = useQuery<UpcomingVisit[]>({
    queryKey: ['upcomingVisits'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/subscription/visits/upcoming/');
        return response.data;
      } catch (error: any) {
        console.error('Error fetching upcoming visits:', error);
        toast.error('Failed to fetch upcoming visits');
        throw error;
      }
    },
    enabled: !!subscriptionId
  });

  // Schedule visit mutation
  const scheduleMutation = useMutation({
    mutationFn: async (data: { preferred_date: string; preferred_time: string; subscription: number }) => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.post('/subscription/visits/schedule_preferred_date/', data);
        return response.data;
      } catch (error: any) {
        console.error('Error scheduling visit:', {
          error,
          data: error.response?.data,
          status: error.response?.status,
          message: error.message
        });
        const errorMessage = error.response?.data?.detail || error.response?.data || 'Failed to schedule visit';
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('Visit scheduled successfully!');
      queryClient.invalidateQueries({ queryKey: ['upcomingVisits'] });
      setSelectedDate('');
      setSelectedTime('');
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast.error(error.message);
    }
  });

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !subscriptionId) {
      toast.error('Please select both date and time');
      return;
    }

    try {
      // Format date and time according to backend requirements
      const formattedDate = format(new Date(selectedDate), 'yyyy-MM-dd');
      const formattedTime = selectedTime + ':00'; // Add seconds to match backend format

      await scheduleMutation.mutateAsync({
        preferred_date: formattedDate,
        preferred_time: formattedTime,
        subscription: subscriptionId
      });
    } catch (error) {
      // Error is handled by mutation's onError
    }
  };

  // Available time slots (9 AM to 5 PM, hourly slots)
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00'
  ];

  if (subscriptionError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        Failed to load subscription information. Please try again later.
      </div>
    );
  }

  if (datesError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        Failed to load available dates. Please try again later.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Calendar className="h-6 w-6 text-orange-500 mr-2" />
            Schedule a Visit
          </h2>

          {/* Subscription Status */}
          {activeSubscription?.[0] && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700">Subscription Status</h3>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Remaining Visits</p>
                  <p className={`text-lg font-semibold ${
                    (activeSubscription[0]?.remaining_visits ?? 0) <= 1 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {activeSubscription[0]?.remaining_visits ?? 0} / {activeSubscription[0]?.max_visits ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valid Until</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {activeSubscription[0]?.end_date ? 
                      format(new Date(activeSubscription[0].end_date), 'MMM d, yyyy') :
                      'N/A'
                    }
                  </p>
                </div>
              </div>
              {(activeSubscription[0]?.remaining_visits ?? 0) <= 0 ? (
                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  You have no remaining visits. Please upgrade your subscription to schedule more visits.
                </div>
              ) : (activeSubscription[0]?.remaining_visits ?? 0) === 1 ? (
                <div className="mt-3 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm">
                  ⚠️ This is your last available visit. Consider renewing your subscription soon.
                </div>
              ) : (activeSubscription[0]?.remaining_visits ?? 0) <= (activeSubscription[0]?.max_visits ?? 0) * 0.25 && (
                <div className="mt-3 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                  ℹ️ You're running low on visits. Consider renewing your subscription soon.
                </div>
              )}
            </div>
          )}

          {/* Date Selection */}
          <div className="mb-6">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              id="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              disabled={(activeSubscription?.[0]?.remaining_visits ?? 0) <= 0}
            />
          </div>

          {/* Time Selection */}
          <div className="mb-6">
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
              Select Time
            </label>
            <select
              id="time"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={(activeSubscription?.[0]?.remaining_visits ?? 0) <= 0}
            >
              <option value="">Select a time</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Button */}
          <button
            onClick={handleSchedule}
            disabled={isLoading || !selectedDate || !selectedTime || !subscriptionId || (activeSubscription?.[0]?.remaining_visits ?? 0) <= 0}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isLoading || !selectedDate || !selectedTime || !subscriptionId || (activeSubscription?.[0]?.remaining_visits ?? 0) <= 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isLoading ? 'Scheduling...' : 
             (activeSubscription?.[0]?.remaining_visits ?? 0) <= 0 ? 'No Remaining Visits' : 'Schedule Visit'}
          </button>
        </div>

        {/* Upcoming Visits Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Upcoming Visits</h2>
          {upcomingVisits && upcomingVisits.length > 0 ? (
            <ul className="space-y-4">
              {upcomingVisits.map((visit) => (
                <li
                  key={visit.id}
                  className="p-4 border border-gray-200 rounded-md"
                >
                  <p className="font-medium">
                    {format(new Date(visit.scheduled_date), 'MMMM d, yyyy h:mm a')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Status: {visit.status}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No upcoming visits scheduled</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitScheduler; 