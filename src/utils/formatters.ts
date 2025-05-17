/**
 * Utility functions for formatting data in the UI
 */

/**
 * Format a price with commas in Indian number format
 * @param price - The price to format 
 * @returns Formatted price string
 */
export const formatPrice = (price: string | number | null | undefined): string => {
  if (price === null || price === undefined) return '0';
  
  // Ensure we have a valid number
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0';
  
  return Number(numPrice).toLocaleString('en-IN');
};

/**
 * Format a date string to a readable format
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Not specified';
  
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

/**
 * Format a time string (HH:MM) to a more readable format
 * @param timeString - The time string to format
 * @returns Formatted time string
 */
export const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  
  // Handle various time formats
  if (timeString.includes(':')) {
    const [hours, minutes] = timeString.split(':');
    
    // Create a date object using the hours and minutes
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  return timeString;
}; 