import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, X, Check, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { SubscriptionPlan } from '../models/subscription-plan';

interface SubscriptionCalendarModalProps {
  plan: SubscriptionPlan;
  onClose: () => void;
  onConfirm: (plan: SubscriptionPlan, selectedDates: Date[]) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

const SubscriptionCalendarModal: React.FC<SubscriptionCalendarModalProps> = ({
  plan,
  onClose,
  onConfirm
}) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Extract the number of visits from the plan data
  // Example format: "2 visits / month"
  const getMaxVisits = (): number => {
    // Default to 1 visit if we can't extract information
    const defaultVisits = 1;
    
    if (!plan || !plan.description) return defaultVisits;
    
    // Try to extract visit information from description
    const visitMatch = plan.description.match(/(\d+)\s*visits?/i);
    if (visitMatch && visitMatch[1]) {
      return parseInt(visitMatch[1], 10);
    }
    
    return defaultVisits;
  };
  
  const maxVisits = getMaxVisits();
  
  // Generate array of days for calendar
  const generateCalendarDays = (): CalendarDay[][] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Get the last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Get the last day of the previous month
    const lastDayOfPrevMonth = new Date(year, month, 0);
    const daysInPrevMonth = lastDayOfPrevMonth.getDate();
    
    // Create calendar grid with days from previous month, current month, and next month
    const days: CalendarDay[] = [];
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        isSelected: isDateSelected(date),
        isDisabled: true
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        isSelected: isDateSelected(date),
        isDisabled: isPastDate
      });
    }
    
    // Add days from next month to complete the grid (6 rows x 7 columns)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        isSelected: isDateSelected(date),
        isDisabled: true
      });
    }
    
    // Split the days into rows (6 rows of 7 days)
    const rows: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    
    return rows;
  };
  
  // Check if a date is already selected
  const isDateSelected = (date: Date): boolean => {
    return selectedDates.some(selectedDate => isSameDay(selectedDate, date));
  };
  
  // Check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };
  
  // Format date as readable string
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Handle date selection
  const handleDateClick = (day: CalendarDay) => {
    if (day.isDisabled) return;
    
    if (isDateSelected(day.date)) {
      // Remove the date if already selected
      setSelectedDates(selectedDates.filter(date => !isSameDay(date, day.date)));
    } else if (selectedDates.length < maxVisits) {
      // Add the date if not at max selection
      setSelectedDates([...selectedDates, day.date]);
    } else {
      // Replace the first date if at max selection
      const newDates = [...selectedDates];
      newDates.shift();
      setSelectedDates([...newDates, day.date]);
    }
  };
  
  // Handle month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Day of week headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Confirm selection
  const handleConfirm = () => {
    if (selectedDates.length > 0) {
      onConfirm(plan, selectedDates);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md"
      >
        <div className="flex justify-between items-center bg-[#FF5733] text-white p-4">
          <h2 className="text-xl font-bold">Schedule Your Services</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800">{plan.name}</h3>
            <p className="text-gray-600">{plan.description}</p>
            <div className="mt-2 flex justify-between">
              <span className="text-[#FF5733] font-bold text-lg">₹{plan.price}</span>
              <span className="text-gray-500">{plan.duration}</span>
            </div>
          </div>
          
          <div className="mb-4 flex items-start bg-blue-50 p-3 rounded-lg">
            <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Please select {maxVisits} preferred date{maxVisits > 1 ? 's' : ''} for your service visits.
              You can adjust these later if needed.
            </p>
          </div>
          
          <div className="mb-4 overflow-hidden">
            {/* Calendar header */}
            <div className="flex justify-between items-center mb-4">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <h4 className="text-lg font-medium text-gray-800">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Calendar grid */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Day names header */}
              <div className="grid grid-cols-7">
                {dayNames.map(day => (
                  <div key={day} className="text-center py-2 text-sm font-medium text-gray-600 bg-gray-50">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div>
                {generateCalendarDays().map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-7">
                    {row.map((day, dayIndex) => (
                      <button
                        key={`${rowIndex}-${dayIndex}`}
                        onClick={() => handleDateClick(day)}
                        disabled={day.isDisabled}
                        className={`
                          p-2 h-14 relative text-center border-t border-gray-100
                          ${!day.isCurrentMonth ? 'text-gray-400' : ''}
                          ${day.isToday ? 'font-bold' : ''}
                          ${day.isSelected ? 'bg-[#FF5733] text-white hover:bg-[#ff4019]' : ''}
                          ${!day.isDisabled && !day.isSelected ? 'hover:bg-gray-100' : ''}
                          ${day.isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                        `}
                      >
                        <span className="block text-sm">{day.date.getDate()}</span>
                        {day.isSelected && (
                          <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Selected dates summary */}
          <div className="mt-6 mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Dates ({selectedDates.length}/{maxVisits})</h4>
            {selectedDates.length > 0 ? (
              <div className="space-y-2">
                {selectedDates.sort((a, b) => a.getTime() - b.getTime()).map((date, index) => (
                  <div key={index} className="flex items-center bg-gray-50 p-2 rounded-md">
                    <Calendar className="h-4 w-4 text-[#FF5733] mr-2" />
                    <span className="text-sm">{formatDate(date)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No dates selected</p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedDates.length === 0}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors
                ${selectedDates.length > 0 
                  ? 'bg-[#FF5733] text-white hover:bg-opacity-90' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionCalendarModal; 