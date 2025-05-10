/**
 * Helper functions for vehicle data
 */

// Format date for API
export const formatDateForBackend = (dateString: string): string => {
  if (!dateString) return '';
  
  // Format as YYYY-MM-DD for the backend API
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Format price with commas
export const formatPrice = (price: string | number): string => {
  return Number(price).toLocaleString('en-IN');
};

// Helper functions for vehicle data extraction
export const getVehicleBrand = (vehicle: any): string => {
  return vehicle.vehicle?.brand || 
        vehicle.vehicle_details?.brand || 
        vehicle.brand ||
        'Unknown';
};

export const getVehicleModel = (vehicle: any): string => {
  return vehicle.vehicle?.model || 
        vehicle.vehicle_details?.model || 
        vehicle.model ||
        'Unknown';
};

export const getVehicleRegistration = (vehicle: any): string => {
  return vehicle.vehicle?.registration_number || 
        vehicle.vehicle_details?.registration_number || 
        vehicle.registration_number ||
        'N/A';
};

export const getVehicleCondition = (vehicle: any): string => {
  // Get raw condition value from all possible sources
  const rawCondition = vehicle.condition || 
        vehicle.vehicle?.condition || 
        vehicle.vehicle_details?.condition ||
        vehicle.summary?.condition;
  
  // If we have a condition value, properly capitalize it
  if (rawCondition && typeof rawCondition === 'string') {
    // Convert to lowercase first then capitalize first letter
    const formatted = rawCondition.toLowerCase();
    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    return capitalized;
  }
  
  // Default fallback
  return 'Good';
};

// Get the expected price with fallbacks
export const getExpectedPrice = (vehicle: any): number => {
  // Check all possible locations for expected price
  return vehicle.vehicle?.expected_price || 
         vehicle.vehicle?.price || 
         vehicle.expected_price || 
         vehicle.price || 
         vehicle.vehicle_details?.expected_price ||
         vehicle.vehicle_details?.price ||
         0;
};

// Format summary value based on key type
export const formatSummaryValue = (key: string, value: any): string => {
  if (!value) return 'Not provided';
  
  switch (key) {
    case 'expectedPrice':
      return `₹${parseInt(value).toLocaleString('en-IN')}`;
    case 'lastServiceDate':
    case 'insuranceValidTill':
      return new Date(value).toLocaleDateString();
    case 'isPriceNegotiable':
    case 'hasPucCertificate':
    case 'emiAvailable':
      return value ? 'Yes' : 'No';
    case 'features':
    case 'highlights':
      return Array.isArray(value) && value.length > 0 
        ? value.join(', ') 
        : 'None';
    default:
      return String(value);
  }
}; 