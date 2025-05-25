import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

interface Vehicle {
  id: string;
  manufacturer: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  price: number;
  status: 'Under Inspection' | 'Available' | 'Sold';
  image: string;
}

const Vehicles = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - replace with actual API call
  const vehicles: Vehicle[] = [
    {
      id: '1',
      manufacturer: 'Royal Enfield',
      model: 'Bullet',
      year: 2021,
      mileage: 34000,
      fuelType: 'petrol',
      price: 34000,
      status: 'Under Inspection',
      image: '/images/vehicles/bullet.jpg'
    },
    {
      id: '2',
      manufacturer: 'Honda',
      model: 'Splender',
      year: 2021,
      mileage: 34000,
      fuelType: 'petrol',
      price: 34000,
      status: 'Under Inspection',
      image: '/images/vehicles/splender.jpg'
    },
    // Add more vehicles here
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Your Perfect Bike</h1>

        {/* Search Bar */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search by name, manufacturer, model..."
            className="w-full px-4 py-3 pl-12 pr-32 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[#FF5733] hover:text-[#ff4019]"
          >
            <Sliders size={18} />
            Filters
          </button>
        </div>

        {/* Results Count */}
        <p className="text-gray-600 mb-6">{vehicles.length} Vehicles Found</p>

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer"
              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
            >
              {/* Vehicle Image */}
              <div className="relative aspect-[4/3] bg-gray-100">
                <img
                  src={vehicle.image}
                  alt={`${vehicle.manufacturer} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
                {vehicle.status === 'Under Inspection' && (
                  <div className="absolute top-4 left-4 bg-white rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Under Inspection
                  </div>
                )}
              </div>

              {/* Vehicle Details */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">
                  {vehicle.manufacturer} {vehicle.model}
                </h3>
                <div className="mt-1 text-sm text-gray-500">
                  {vehicle.year} • {vehicle.mileage.toLocaleString()} km • {vehicle.fuelType}
                </div>
                <div className="mt-2 text-lg font-semibold text-[#FF5733]">
                  ₹{vehicle.price.toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Vehicles; 