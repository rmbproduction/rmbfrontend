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

// Add new test function for vehicle creation
async function testCreateVehicle() {
  try {
    // Get auth token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No authentication token found. Please log in first.');
      return;
    }
    
    // Create minimal vehicle data with only required fields
    const minimalVehicleData = {
      vehicle_type: 'bike',
      brand: 'Test Brand',
      model: 'Test Model',
      year: new Date().getFullYear(),
      registration_number: 'TEST' + Math.floor(Math.random() * 10000),
      kms_driven: 1000,
      fuel_type: 'petrol',
      price: 10000
    };
    
    console.log('Sending minimal vehicle data:', minimalVehicleData);
    
    // Make API call
    const response = await fetch('https://repairmybike.up.railway.app/api/marketplace/vehicles/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(minimalVehicleData)
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
    
    if (response.status === 400) {
      console.error('Validation error detected. Field errors:');
      if (typeof responseData === 'object') {
        Object.entries(responseData).forEach(([field, error]) => {
          console.error(`- ${field}: ${JSON.stringify(error)}`);
        });
      }
    }
    
    return { status: response.status, data: responseData };
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Function to debug vehicle creation with interactive fields
function createTestVehicle(options = {}) {
  const data = {
    vehicle_type: options.vehicle_type || 'bike',
    brand: options.brand || 'Test Brand',
    model: options.model || 'Test Model',
    year: options.year || new Date().getFullYear(),
    registration_number: options.registration_number || ('TEST' + Math.floor(Math.random() * 10000)),
    kms_driven: options.kms_driven || 1000,
    fuel_type: options.fuel_type || 'petrol',
    price: options.price || 10000,
    color: options.color || 'Black',
    engine_capacity: options.engine_capacity || 150
  };
  
  console.log('Testing vehicle creation with:', data);
  
  // Get auth token
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.error('No authentication token found. Please log in first.');
    return Promise.reject('No auth token');
  }
  
  // Make API call
  return fetch('https://repairmybike.up.railway.app/api/marketplace/vehicles/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  .then(async response => {
    const responseData = await response.json().catch(() => response.text());
    
    console.log('Response status:', response.status);
    console.log('Response data:', responseData);
    
    if (response.status >= 400) {
      console.error('API Error:', responseData);
    } else {
      console.log('Vehicle created successfully!');
    }
    
    return { status: response.status, data: responseData };
  })
  .catch(error => {
    console.error('Request failed:', error);
    return { error };
  });
}

// Add a comprehensive validation test for vehicle submissions
async function testVehicleSubmissionFlow() {
  console.log('Running comprehensive vehicle submission test');
  
  try {
    // Get auth token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No authentication token found. Please log in first.');
      return { error: 'Authentication required' };
    }
    
    // Generate a unique registration number to avoid duplicates
    const regNumber = 'TEST' + Date.now().toString().slice(-8);
    
    // STEP 1: First try creating a vehicle with minimal valid data
    console.log('STEP 1: Create vehicle with minimal data');
    
    const minimalVehicleData = {
      vehicle_type: 'bike',
      brand: 'Test Brand',
      model: 'Test Model',
      year: new Date().getFullYear(),
      registration_number: regNumber,
      kms_driven: 1000,
      fuel_type: 'petrol',
      price: 10000
    };
    
    console.log('Sending minimal vehicle data:', minimalVehicleData);
    
    // Make vehicle creation API call
    const vehicleResponse = await fetch('https://repairmybike.up.railway.app/api/marketplace/vehicles/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(minimalVehicleData)
    });
    
    // Get response
    const vehicleData = await vehicleResponse.json();
    console.log('Vehicle creation response:', {
      status: vehicleResponse.status,
      data: vehicleData
    });
    
    // Check if vehicle creation was successful
    if (vehicleResponse.status >= 400) {
      console.error('Vehicle creation failed');
      // Try to identify the specific fields causing issues
      if (typeof vehicleData === 'object') {
        console.error('Field errors:');
        Object.entries(vehicleData).forEach(([field, error]) => {
          console.error(`- ${field}: ${JSON.stringify(error)}`);
        });
      }
      return { error: 'Vehicle creation failed', details: vehicleData };
    }
    
    // Extract vehicle ID
    const vehicleId = vehicleData.id;
    console.log('Vehicle created successfully with ID:', vehicleId);
    
    // STEP 2: Create a sell request with minimal data
    console.log('\nSTEP 2: Create sell request with minimal JSON data');
    
    const minimalSellRequestData = {
      vehicle: vehicleId,
      contact_number: '+911234567890',
      pickup_address: 'Test Address, 123 Main St, City, 10001',
      pickup_slot: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      is_price_negotiable: false
    };
    
    console.log('Sending minimal sell request data:', minimalSellRequestData);
    
    // Make sell request API call with JSON data first
    const sellRequestResponse = await fetch('https://repairmybike.up.railway.app/api/marketplace/sell-requests/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(minimalSellRequestData)
    });
    
    // Get response
    let sellRequestData;
    try {
      sellRequestData = await sellRequestResponse.json();
    } catch (e) {
      sellRequestData = await sellRequestResponse.text();
    }
    
    console.log('Sell request response:', {
      status: sellRequestResponse.status,
      data: sellRequestData
    });
    
    // Check if JSON sell request was successful
    if (sellRequestResponse.status >= 400) {
      console.error('JSON sell request failed');
      
      // STEP 3 (fallback): Try multipart/form-data approach
      console.log('\nSTEP 3: Trying multipart/form-data approach as fallback');
      
      const formData = new FormData();
      formData.append('vehicle', vehicleId);
      formData.append('contact_number', '+911234567890');
      formData.append('pickup_address', 'Test Address, 123 Main St, City, 10001');
      
      // Set pickup slot to tomorrow noon
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      formData.append('pickup_slot', tomorrow.toISOString());
      
      // Add boolean fields
      formData.append('is_price_negotiable', 'false');
      
      console.log('Sending multipart form data with fields:', Array.from(formData.keys()));
      
      // Make sell request API call with FormData
      const multipartResponse = await fetch('https://repairmybike.up.railway.app/api/marketplace/sell-requests/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      // Get response
      let multipartData;
      try {
        multipartData = await multipartResponse.json();
      } catch (e) {
        multipartData = await multipartResponse.text();
      }
      
      console.log('Multipart response:', {
        status: multipartResponse.status,
        data: multipartData
      });
      
      if (multipartResponse.status >= 400) {
        return {
          vehicleId,
          error: 'Both JSON and multipart sell request methods failed',
          jsonResult: { status: sellRequestResponse.status, data: sellRequestData },
          multipartResult: { status: multipartResponse.status, data: multipartData }
        };
      }
      
      return {
        success: true,
        vehicleId,
        sellRequestId: multipartData.id,
        message: 'Sell request created successfully using multipart/form-data approach',
        jsonResult: { status: sellRequestResponse.status, data: sellRequestData },
        multipartResult: { status: multipartResponse.status, data: multipartData }
      };
    }
    
    // Original JSON approach succeeded
    return {
      success: true,
      vehicleId,
      sellRequestId: sellRequestData.id,
      message: 'Complete vehicle submission successful using JSON approach',
      data: sellRequestData
    };
  } catch (error) {
    console.error('Test failed:', error);
    return { error: error.message || 'Unknown error' };
  }
}

// Export functions for easy access in console
window.testBasicSellRequest = testBasicSellRequest;
window.checkExistingVehicles = checkExistingVehicles;
window.debugLastFormSubmission = debugLastFormSubmission;
window.testMinimalMultipartSubmission = testMinimalMultipartSubmission;
window.testCreateVehicle = testCreateVehicle;
window.createTestVehicle = createTestVehicle;
window.testVehicleSubmissionFlow = testVehicleSubmissionFlow; 