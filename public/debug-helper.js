/**
 * Debug helper script for diagnosing form submission errors
 * 
 * To use this in the browser console:
 * 1. Open your browser's developer tools (F12 or Ctrl+Shift+I)
 * 2. Go to the Console tab 
 * 3. Copy and paste the test you want to run from below
 * 
 * Examples:
 *   testBasicSellRequest() - Tests a minimal sell request
 *   checkExistingVehicles() - Lists all vehicles
 *   debugLastFormSubmission() - Checks details of last form submission
 */

async function testBasicSellRequest(vehicleId) {
  if (!vehicleId) {
    console.error('Please provide a vehicle ID');
    return;
  }

  try {
    // Create minimal test data
    const testData = {
      vehicle: vehicleId,
      contact_number: '+911234567890',
      pickup_address: 'Test Address, 123 Main St, City, 10001',
      pickup_slot: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    };
    
    console.log('Sending test data:', testData);
    
    // Get auth token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No authentication token found. Please log in first.');
      return;
    }
    
    // Make API call directly
    const response = await fetch('https://repairmybike.up.railway.app/api/marketplace/sell-requests/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    // Check response 
    const responseData = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', responseData);
    
    return { status: response.status, data: responseData };
  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function checkExistingVehicles() {
  try {
    // Get auth token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No authentication token found. Please log in first.');
      return;
    }
    
    // Fetch vehicles
    const response = await fetch('https://repairmybike.up.railway.app/api/marketplace/vehicles/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const vehicles = await response.json();
    console.log('Found vehicles:', vehicles);
    
    // Display in a more readable format
    console.table(vehicles.map(v => ({
      id: v.id,
      registration: v.registration_number,
      brand: v.brand,
      model: v.model
    })));
    
    return vehicles;
  } catch (error) {
    console.error('Error fetching vehicles:', error);
  }
}

function debugLastFormSubmission() {
  try {
    // Get the last form data from storage
    const lastSubmittedVehicle = localStorage.getItem('last_submitted_vehicle');
    if (!lastSubmittedVehicle) {
      console.log('No previous submission data found');
      return;
    }
    
    const parsedData = JSON.parse(lastSubmittedVehicle);
    console.log('Last submitted form data:', parsedData);
    
    // Check critical fields
    console.log('Critical fields check:');
    console.log('- Registration number:', parsedData.vehicle?.registration_number);
    console.log('- Contact number:', parsedData.contact_number);
    console.log('- Pickup address length:', parsedData.pickup_address?.length);
    
    // Check for large data
    const dataSize = new TextEncoder().encode(JSON.stringify(parsedData)).length;
    console.log('Form data size:', (dataSize / 1024).toFixed(2), 'KB');
    
    if (dataSize > 100 * 1024) {
      console.warn('Warning: Form data is very large (> 100KB)');
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error analyzing form data:', error);
  }
}

async function testMinimalMultipartSubmission(vehicleId) {
  if (!vehicleId) {
    console.error('Please provide a vehicle ID');
    return;
  }

  try {
    // Create minimal form data
    const formData = new FormData();
    formData.append('vehicle', vehicleId);
    formData.append('contact_number', '+911234567890');
    formData.append('pickup_address', 'Test Address, 123 Main St, City, 10001');
    
    // Create tomorrow date for pickup slot
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    formData.append('pickup_slot', tomorrow.toISOString());
    
    console.log('Sending test formData with fields:', Array.from(formData.keys()));
    
    // Get auth token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No authentication token found. Please log in first.');
      return;
    }
    
    // Make API call directly
    const response = await fetch('https://repairmybike.up.railway.app/api/marketplace/sell-requests/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Let browser set the content-type for multipart/form-data
      },
      body: formData
    });
    
    // Check response
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = await response.text();
    }
    
    console.log('Response status:', response.status);
    console.log('Response data:', responseData);
    
    return { status: response.status, data: responseData };
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Export functions for easy access in console
window.testBasicSellRequest = testBasicSellRequest;
window.checkExistingVehicles = checkExistingVehicles;
window.debugLastFormSubmission = debugLastFormSubmission;
window.testMinimalMultipartSubmission = testMinimalMultipartSubmission; 