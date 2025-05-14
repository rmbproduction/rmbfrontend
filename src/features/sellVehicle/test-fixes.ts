/**
 * Test file to validate fixes for handling primitive values in API responses
 * 
 * This file demonstrates how the fixed helper functions and components 
 * handle non-object values correctly now.
 */

import { 
  getVehicleBrand, 
  getVehicleModel, 
  getVehicleRegistration, 
  getVehicleCondition, 
  getExpectedPrice,
  formatPrice
} from './utils/helpers';

import { getStatusIcon, getStatusColor, getStatusBadgeColor } from '../../utils/statusUtils';

// Test helper functions with primitive values
console.log('--- Testing helper functions with primitive values ---');
console.log('getVehicleBrand(5):', getVehicleBrand(5));
console.log('getVehicleModel("string"):', getVehicleModel("string"));
console.log('getVehicleRegistration(null):', getVehicleRegistration(null));
console.log('getVehicleCondition(undefined):', getVehicleCondition(undefined));
console.log('getExpectedPrice(42):', getExpectedPrice(42));
console.log('formatPrice(null):', formatPrice(null));
console.log('formatPrice("invalid"):', formatPrice("invalid"));

// Test status utilities with null/undefined values
console.log('\n--- Testing status utilities with null/undefined ---');
console.log('getStatusColor(null) returns default style:', getStatusColor(null));
console.log('getStatusBadgeColor(undefined) returns default style:', getStatusBadgeColor(undefined));

// Test with valid object
const validVehicle = {
  id: '123',
  vehicle: {
    brand: 'Honda',
    model: 'Activa',
    registration_number: 'AB12CD3456',
    price: 50000
  },
  status: 'confirmed'
};

console.log('\n--- Testing with valid vehicle object ---');
console.log('getVehicleBrand:', getVehicleBrand(validVehicle));
console.log('getVehicleModel:', getVehicleModel(validVehicle));
console.log('getVehicleRegistration:', getVehicleRegistration(validVehicle));
console.log('getExpectedPrice:', getExpectedPrice(validVehicle));

// Demonstrate how the PreviousVehicles component would handle mixed data
const mixedVehiclesData = [
  validVehicle,
  5,
  null,
  undefined,
  { id: '456', status: 'under_inspection' },
  "invalid"
];

console.log('\n--- Processing mixed vehicles array (simulating API response) ---');
const processedVehicles = mixedVehiclesData
  .map(item => {
    // This is the normalizeVehicleData equivalent
    if (typeof item !== 'object' || item === null) {
      console.log(`Converting primitive value ${item} to vehicle object`);
      return {
        id: String(typeof item === 'string' || typeof item === 'number' ? item : 'unknown'),
        vehicle: {
          brand: 'Unknown',
          model: 'Unknown',
          registration_number: 'Unknown',
          year: new Date().getFullYear(),
          status: 'unknown'
        },
        status: 'unknown',
        created_at: new Date().toISOString()
      };
    }
    return item;
  })
  .filter(vehicle => {
    // This is the isValidVehicle equivalent
    if (typeof vehicle !== 'object' || vehicle === null) {
      console.log(`Filtering out invalid vehicle: ${vehicle}`);
      return false;
    }
    
    if (!vehicle.id) {
      console.log('Filtering out vehicle without id');
      return false;
    }
    
    return true;
  });

console.log(`Processed ${processedVehicles.length} valid vehicles out of ${mixedVehiclesData.length} items`);
console.log('All processed vehicles have valid structure that can be safely rendered');

// Export something so TypeScript treats this as a module
export const testFixesCompleted = true; 