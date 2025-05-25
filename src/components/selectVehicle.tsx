import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Search } from 'lucide-react';

// Types
interface Manufacturer {
  id: string;
  name: string;
  logo: string;
}

interface CarModel {
  id: string;
  name: string;
  image: string;
  manufacturerId: string;
}

interface FuelType {
  id: string;
  name: string;
  icon: string;
}

interface Vehicle {
  manufacturer: string;
  model: string;
  fuelType: string;
}

interface SelectVehicleProps {
  onVehicleSelect: (vehicle: Vehicle) => void;
}

// Mock data - Replace with actual API data later
const manufacturers: Manufacturer[] = [
  { 
    id: 'maruti',
    name: 'Maruti Suzuki',
    logo: '/manufacturers/placeholder.svg'
  },
  { 
    id: 'hyundai',
    name: 'Hyundai',
    logo: '/manufacturers/placeholder.svg'
  },
  { 
    id: 'honda',
    name: 'Honda',
    logo: '/manufacturers/placeholder.svg'
  },
  { 
    id: 'tata',
    name: 'Tata',
    logo: '/manufacturers/placeholder.svg'
  },
  { 
    id: 'ford',
    name: 'Ford',
    logo: '/manufacturers/placeholder.svg'
  },
  { 
    id: 'volkswagen',
    name: 'Volkswagen',
    logo: '/manufacturers/placeholder.svg'
  },
  { 
    id: 'mahindra',
    name: 'Mahindra',
    logo: '/manufacturers/placeholder.svg'
  },
  { 
    id: 'chevrolet',
    name: 'Chevrolet',
    logo: '/manufacturers/placeholder.svg'
  },
  { 
    id: 'renault',
    name: 'Renault',
    logo: '/manufacturers/placeholder.svg'
  }
];

const carModels: CarModel[] = [
  { 
    id: 'swift',
    name: 'Swift',
    image: '/models/placeholder.svg',
    manufacturerId: 'maruti'
  },
  { 
    id: 'wagonr',
    name: 'WagonR',
    image: '/models/placeholder.svg',
    manufacturerId: 'maruti'
  },
  { 
    id: 'dzire',
    name: 'Swift Dzire',
    image: '/models/placeholder.svg',
    manufacturerId: 'maruti'
  },
  { 
    id: 'baleno',
    name: 'Baleno',
    image: '/models/placeholder.svg',
    manufacturerId: 'maruti'
  },
  { 
    id: 'alto',
    name: 'Alto',
    image: '/models/placeholder.svg',
    manufacturerId: 'maruti'
  },
  { 
    id: 'ritz',
    name: 'Ritz',
    image: '/models/placeholder.svg',
    manufacturerId: 'maruti'
  }
];

const fuelTypes: FuelType[] = [
  { id: 'petrol', name: 'Petrol', icon: '⛽' },
  { id: 'cng', name: 'CNG', icon: '🔋' },
  { id: 'diesel', name: 'Diesel', icon: '🛢️' }
];

const SelectVehicle = ({ onVehicleSelect }: SelectVehicleProps) => {
  const [step, setStep] = useState<number>(1);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedFuel, setSelectedFuel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredModels = carModels.filter(
    model => model.manufacturerId === selectedManufacturer
  );

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setSearchQuery('');
    }
  };

  const resetSelection = () => {
    setStep(1);
    setSelectedManufacturer(null);
    setSelectedModel(null);
    setSelectedFuel(null);
    setSearchQuery('');
  };

  const handleFuelSelect = (fuelId: string, fuelName: string) => {
    setSelectedFuel(fuelId);
    
    // Get manufacturer and model names
    const manufacturer = manufacturers.find(m => m.id === selectedManufacturer)?.name || '';
    const model = carModels.find(m => m.id === selectedModel)?.name || '';
    
    // Call the parent component's handler with the selected vehicle details
    onVehicleSelect({
      manufacturer,
      model,
      fuelType: fuelName
    });
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Select Manufacturer</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search Brands"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {manufacturers
                .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(manufacturer => (
                  <div
                    key={manufacturer.id}
                    className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:border-[#FF5733] transition-colors"
                    onClick={() => {
                      setSelectedManufacturer(manufacturer.id);
                      setStep(2);
                      setSearchQuery('');
                    }}
                  >
                    <img 
                      src={manufacturer.logo} 
                      alt={manufacturer.name} 
                      className="w-12 h-12 object-contain mb-2" 
                    />
                    <p className="text-sm text-center">{manufacturer.name}</p>
                  </div>
                ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="p-6 space-y-4">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-semibold">Select Model</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search Models"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {filteredModels
                .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(model => (
                  <div
                    key={model.id}
                    className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:border-[#FF5733] transition-colors"
                    onClick={() => {
                      setSelectedModel(model.id);
                      setStep(3);
                      setSearchQuery('');
                    }}
                  >
                    <img 
                      src={model.image} 
                      alt={model.name} 
                      className="w-24 h-16 object-contain mb-2" 
                    />
                    <p className="text-sm text-center">{model.name}</p>
                  </div>
                ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="p-6 space-y-4">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-semibold">Select Fuel Type</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {fuelTypes.map(fuel => (
                <div
                  key={fuel.id}
                  className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:border-[#FF5733] transition-colors"
                  onClick={() => {
                    handleFuelSelect(fuel.id, fuel.name);
                    setStep(4);
                  }}
                >
                  <div className="text-3xl mb-2">{fuel.icon}</div>
                  <p className="text-sm text-center">{fuel.name}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        const selectedModelData = carModels.find(m => m.id === selectedModel);
        const selectedFuelData = fuelTypes.find(f => f.id === selectedFuel);
        
        return (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Selected Vehicle</h2>
              <button
                onClick={resetSelection}
                className="text-[#FF5733] hover:text-[#ff4019] text-sm"
              >
                Change Vehicle
              </button>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedModelData?.image}
                  alt={selectedModelData?.name}
                  className="w-20 h-16 object-contain"
                />
                <div>
                  <h3 className="font-semibold">{selectedModelData?.name}</h3>
                  <p className="text-gray-500 text-sm">{selectedFuelData?.name}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {getStepContent()}
    </motion.div>
  );
};

export default SelectVehicle;
