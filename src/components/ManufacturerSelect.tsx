import { useState } from 'react';

interface Manufacturer {
  id: string;
  name: string;
  logo: string;
  specializations: string[];
  rating?: number;
  experience?: string;
}

// Add vehicle categories and companies
const vehicleCategories = {
  'Cars': [
    'Maruti Suzuki',
    'Tata Motors',
    'Hyundai',
    'Honda',
    'Toyota',
    'Mahindra',
    'Kia',
    'MG'
  ],
  'Bikes': [
    'Hero',
    'Honda',
    'Bajaj',
    'TVS',
    'Royal Enfield',
    'Yamaha',
    'KTM'
  ],
  'Commercial': [
    'Tata',
    'Ashok Leyland',
    'Eicher',
    'BharatBenz',
    'Mahindra Commercial'
  ]
};

interface ManufacturerSelectProps {
  manufacturers: Manufacturer[];
  onSelect: (manufacturer: Manufacturer) => void;
}

const ManufacturerSelect = ({ manufacturers, onSelect }: ManufacturerSelectProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedManufacturer('');
  };

  const handleManufacturerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = manufacturers.find(m => m.id === e.target.value);
    if (selected) {
      setSelectedManufacturer(selected.id);
      onSelect(selected);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Vehicle Category Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Vehicle Category
        </label>
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
        >
          <option value="">Select Category</option>
          {Object.keys(vehicleCategories).map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Manufacturer Dropdown */}
      {selectedCategory && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Manufacturer
          </label>
          <select
            value={selectedManufacturer}
            onChange={handleManufacturerChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
          >
            <option value="">Select Manufacturer</option>
            {vehicleCategories[selectedCategory as keyof typeof vehicleCategories].map((company) => (
              <option key={company} value={company.toLowerCase().replace(/\s+/g, '-')}>
                {company}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default ManufacturerSelect;