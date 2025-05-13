import { useEffect, useState } from 'react';
import { apiService } from '../services/api.service';

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