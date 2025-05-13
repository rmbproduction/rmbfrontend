import { useEffect, useState } from 'react';
import { apiService } from '../services/api.service';
import marketplaceService from '../services/marketplaceService';

interface Service {
  id: string;
  name: string;
  description: string;
  [key: string]: any;
}

const TestAPI = () => {
  const [services, setServices] = useState<Service[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debug state
  const [debugResult, setDebugResult] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [existingVehicleId, setExistingVehicleId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getServices();
        setServices(response.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Test functions for diagnosing 400 errors
  const testSubmitWithMinimalData = async () => {
    if (!existingVehicleId) {
      setDebugResult({ error: "Please enter a vehicle ID to test" });
      return;
    }
    
    setDebugLoading(true);
    try {
      // Create test form data
      const testFormData = {
        contactNumber: '+911234567890',
        pickupAddress: 'Test Address, 123 Street, City, 10001'
      };
      
      // Run the debug test
      const result = await marketplaceService.debugSubmitForm(existingVehicleId, testFormData);
      
      setDebugResult(result);
    } catch (err: any) {
      setDebugResult({
        error: err.message,
        details: err.response?.data || 'No details available'
      });
    } finally {
      setDebugLoading(false);
    }
  };
  
  // Retrieve existing vehicles to find a valid ID
  const fetchExistingVehicles = async () => {
    setDebugLoading(true);
    try {
      const vehicles = await marketplaceService.getAllVehicles();
      if (vehicles && vehicles.length > 0) {
        setDebugResult({
          message: 'Found existing vehicles',
          vehicles: vehicles.map((v: any) => ({
            id: v.id,
            brand: v.brand,
            model: v.model,
            registration_number: v.registration_number
          }))
        });
      } else {
        setDebugResult({ message: 'No existing vehicles found' });
      }
    } catch (err: any) {
      setDebugResult({
        error: err.message,
        details: err.response?.data || 'No details available'
      });
    } finally {
      setDebugLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">API Connection Test</h2>
      <pre className="bg-gray-100 p-4 rounded mb-6">
        {JSON.stringify(services, null, 2)}
      </pre>
      
      <div className="mb-6 border-t pt-4">
        <h3 className="text-xl font-bold mb-4">Form Submission Debug Tool</h3>
        <p className="mb-4">Use this tool to debug form submission issues</p>
        
        <div className="mb-4">
          <button 
            onClick={fetchExistingVehicles}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
            disabled={debugLoading}
          >
            Fetch Existing Vehicles
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle ID for Testing
          </label>
          <input 
            type="text"
            value={existingVehicleId}
            onChange={(e) => setExistingVehicleId(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Enter an existing vehicle ID"
          />
          
          <button 
            onClick={testSubmitWithMinimalData}
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={debugLoading || !existingVehicleId}
          >
            Test Minimal Form Submission
          </button>
        </div>
        
        {debugLoading && <div className="text-blue-500">Loading...</div>}
        
        {debugResult && (
          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-2">Debug Result:</h4>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAPI;