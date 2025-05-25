import { useEffect, useState } from 'react';
import { apiService } from '../services/api.service';

const TestAPI = () => {
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiService.getServices();
        setServices(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">API Connection Test</h2>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(services, null, 2)}
      </pre>
    </div>
  );
};

export default TestAPI;