import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { apiService } from '../services/api.service';
import { showNotification } from './NotificationCenter';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
}

interface ServiceSchedulerProps {
  serviceId: string;
  onSchedule: (slot: TimeSlot) => void;
  className?: string;
}

const ServiceScheduler: React.FC<ServiceSchedulerProps> = ({
  serviceId,
  onSchedule,
  className = ''
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      // Format date as YYYY-MM-DD
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await apiService.request<TimeSlot[]>(
        `/repairing_service/available-slots/?service_id=${serviceId}&date=${formattedDate}`
      );
      
      // Convert string dates to Date objects
      const slots = response.data.map(slot => ({
        ...slot,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime)
      }));
      
      setAvailableSlots(slots);
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Failed to fetch available time slots',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    onSchedule(slot);
  };

  const events = availableSlots.map(slot => ({
    title: 'Available',
    start: slot.startTime,
    end: slot.endTime,
    resource: slot,
  }));

  const TimeSlotGrid = () => (
    <div className="grid grid-cols-4 gap-4 mt-6">
      {availableSlots.map(slot => (
        <button
          key={slot.id}
          onClick={() => handleSlotSelect(slot)}
          className={`
            p-3 rounded-lg text-sm font-medium transition-colors
            ${slot.isAvailable
              ? selectedSlot?.id === slot.id
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
          disabled={!slot.isAvailable}
        >
          {format(slot.startTime, 'h:mm a')}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`service-scheduler ${className}`}>
      <div className="mb-6">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 400 }}
          selectable
          onSelectSlot={({ start }) => setSelectedDate(start)}
          views={['month']}
          defaultView="month"
          min={new Date(new Date().setHours(9, 0, 0))}
          max={new Date(new Date().setHours(18, 0, 0))}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Available Time Slots for {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : availableSlots.length > 0 ? (
          <TimeSlotGrid />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No available slots for this date.
            Please select another date.
          </div>
        )}
      </div>

      {selectedSlot && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900">Selected Time Slot</h4>
          <p className="text-blue-700">
            {format(selectedSlot.startTime, 'MMMM d, yyyy h:mm a')} - {format(selectedSlot.endTime, 'h:mm a')}
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceScheduler; 