// Types and interfaces for the Sell Vehicle feature

export interface VehicleFormData {
  type: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  registrationNumber: string;
  kmsDriven: string;
  mileage: string;
  condition: string;
  expectedPrice: string;
  description: string;
  fuelType: string;
  engineCapacity: string;
  lastServiceDate: string;
  insuranceValidTill: string;
  contactNumber: string;
  pickupAddress: string;
  pickupSlot?: string;
  features: string[];
  highlights: string[];
  isPriceNegotiable: boolean;
  sellerNotes: string;
  hasPucCertificate: boolean;
  emiAvailable: boolean;
}

export interface VehiclePhotos {
  front: File | null;
  back: File | null;
  left: File | null;
  right: File | null;
  dashboard: File | null;
  odometer: File | null;
  engine: File | null;
  extras: File | null;
}

export interface VehicleDocuments {
  rc: File | null;
  insurance: File | null;
  puc: File | null;
  transfer: File | null;
  additional: File | null;
}

export interface PhotoURLs {
  [key: string]: string;
}

export interface DocumentURLs {
  [key: string]: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface PreviousVehicleProps {
  onClose: () => void;
}

export interface VehicleStatusInfo {
  [key: string]: {
    status: string;
    status_display?: string;
    title?: string;
    message: string;
  };
}

// Constants
export const FORM_STORAGE_KEY = 'sell_vehicle_form_data';
export const PHOTOS_STORAGE_KEY = 'sell_vehicle_photos_preview';
export const DOCUMENTS_STORAGE_KEY = 'sell_vehicle_documents_preview';

export const vehicleTypes = ['Bike', 'Scooter', 'Electric Bike', 'Electric Scooter'];
export const popularBrands = ['Hero', 'Honda', 'Bajaj', 'TVS', 'Royal Enfield', 'Yamaha', 'Suzuki', 'KTM', 'Jawa', 'Other'];
export const vehicleConditions = ['Excellent', 'Good', 'Fair', 'Needs Repair'];
export const colorOptions = ['Black', 'Blue', 'Red', 'White', 'Silver', 'Green', 'Yellow', 'Orange', 'Brown', 'Grey', 'Other'];
export const fuelTypes = ['Petrol', 'Electric'];

export const statusDescriptions: { [key: string]: string } = {
  pending: 'Pending Review: Our team will review your listing shortly.',
  inspection_scheduled: 'Inspection Scheduled: We\'ve scheduled an inspection for your vehicle.',
  offer_made: 'Offer Made: We\'ve made an offer for your vehicle.',
  completed: 'Completed: The sale has been completed successfully.',
}; 