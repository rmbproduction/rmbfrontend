import { VehicleFormData, VehiclePhotos, VehicleDocuments, FormErrors } from '../types';

/**
 * Validates the form data for vehicle details
 */
export const validateForm = (formData: VehicleFormData): FormErrors => {
  const errors: FormErrors = {};
  
  // Basic validation for required fields
  if (!formData.type) errors.type = 'Vehicle type is required';
  if (!formData.brand) errors.brand = 'Brand is required';
  if (!formData.model) errors.model = 'Model is required';
  if (!formData.year) errors.year = 'Year is required';
  if (!formData.registrationNumber) errors.registrationNumber = 'Registration number is required';
  if (!formData.kmsDriven) errors.kmsDriven = 'Kilometers driven is required';
  if (!formData.fuelType) errors.fuelType = 'Fuel type is required';
  if (!formData.color) errors.color = 'Color is required';
  if (!formData.expectedPrice) errors.expectedPrice = 'Expected price is required';
  if (!formData.contactNumber) errors.contactNumber = 'Contact number is required';
  if (!formData.pickupAddress) errors.pickupAddress = 'Pickup address is required';
  
  // Format validation
  if (formData.registrationNumber && !/^[A-Za-z0-9\s-]+$/.test(formData.registrationNumber)) {
    errors.registrationNumber = 'Invalid registration number format';
  }
  
  if (formData.contactNumber && !/^[0-9+\s-]{10,15}$/.test(formData.contactNumber)) {
    errors.contactNumber = 'Contact number should be 10-15 digits';
  }
  
  if (formData.expectedPrice && isNaN(Number(formData.expectedPrice))) {
    errors.expectedPrice = 'Expected price must be a number';
  }
  
  // Validate year is not greater than current year
  const currentYear = new Date().getFullYear();
  if (formData.year) {
    const year = parseInt(formData.year);
    if (isNaN(year)) {
      errors.year = 'Year must be a valid number';
    } else if (year > currentYear) {
      errors.year = `Year cannot be greater than current year (${currentYear})`;
    } else if (year < 1900) {
      errors.year = 'Year must be 1900 or later';
    }
  }
  
  return errors;
};

/**
 * Validates photo uploads
 */
export const validatePhotos = (photos: VehiclePhotos): string | null => {
  // Check if required photos are uploaded
  const requiredViews = ['front', 'back', 'left', 'right'];
  const missingViews = requiredViews.filter(view => !photos[view as keyof typeof photos]);
  
  if (missingViews.length > 0) {
    const viewNames = missingViews.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
    return `Missing required photos: ${viewNames}`;
  }
  
  return null;
};

/**
 * Validates document uploads
 */
export const validateDocuments = (documents: VehicleDocuments): string | null => {
  // Check if required documents are uploaded
  const requiredDocs = ['rc', 'insurance'];
  const missingDocs = requiredDocs.filter(doc => !documents[doc as keyof typeof documents]);
  
  if (missingDocs.length > 0) {
    const docNames = missingDocs.map(d => {
      if (d === 'rc') return 'Registration Certificate';
      if (d === 'insurance') return 'Insurance Document';
      return d.charAt(0).toUpperCase() + d.slice(1);
    }).join(', ');
    
    return `Missing required documents: ${docNames}`;
  }
  
  return null;
}; 