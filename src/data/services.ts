import { PenTool as Tool, Shield, Battery, Wrench, AlertTriangle, Gauge, LifeBuoy } from 'lucide-react';

// Map of icon strings to actual icon components
const iconMap = {
  Tool,
  Shield,
  Battery,
  Wrench,
  AlertTriangle,
  Gauge,
  LifeBuoy,
};

// Function to fetch services
// Add type safety
type ServiceData = {
  icon: string;
  id: string;
  title: string;
  description: string;
  features?: string[];
  packages?: any[];
};

export const fetchServices = async () => {
  try {
    const response = await fetch('http://localhost:3001/services');
    const data = await response.json() as ServiceData[];
    
    // Add null check and validation
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format');
    }
    
    return data.map(service => ({
      ...service,
      icon: iconMap[service.icon as keyof typeof iconMap] || Tool // Fallback to Tool icon
    }));
  } catch (error) {
    console.error('Error fetching services:', error);
    return services;
  }
};

export const services = [
  { 
    id: 'periodic-service',
    icon: Tool, 
    title: 'Periodic Service', 
    description: 'Regular maintenance to keep your bike in top condition',
    packages: [
      {
        id: 'basic-service',
        name: 'Basic Service',
        duration: '4 Hrs',
        warranty: '1000 Kms or 1 Month',
        recommended: 'Every 5000 Kms or 3 Months',
        features: [
          'Wiper Fluid Replacement',
          'Car Wash',
          'Engine Oil Replacement',
          'Battery Water Top Up',
          'Interior Vacuuming (Carpet & Seats)'
        ]
      },
      {
        id: 'standard-service',
        name: 'Standard Service',
        duration: '6 Hrs',
        warranty: '1000 Kms or 1 Month',
        recommended: 'Every 10,000 Kms or 6 Months',
        features: [
          'Car Scanning',
          'Battery Water Top up',
          'Interior Vacuuming',
          'Wiper Fluid Replacement',
          'Car Wash'
        ]
      }
    ]
  },
  { 
    id: 'roadside-assistance',
    icon: LifeBuoy, 
    title: 'Roadside Assistance', 
    description: '24/7 emergency support wherever you are',
    features: [
      'Immediate Response',
      'Nationwide Coverage',
      'Towing Service',
      'Fuel Delivery',
      'Tire Change'
    ]
  },
  { 
    id: 'bike-insurance',
    icon: Shield, 
    title: 'Bike Insurance', 
    description: 'Comprehensive coverage for your peace of mind',
    features: [
      'Accident Coverage',
      'Third-party Liability',
      'Natural Disaster Protection',
      'Theft Coverage',
      'Zero Depreciation'
    ]
  },
  { 
    id: 'battery-replacement',
    icon: Battery, 
    title: 'Battery Replacement', 
    description: 'Quick and reliable battery solutions',
    features: [
      'Free Battery Testing',
      'All Brands Available',
      'Warranty Service',
      'Old Battery Disposal',
      'Emergency Service'
    ]
  },
  { 
    id: 'tyre-care',
    icon: Gauge, 
    title: 'Tyre Care', 
    description: 'Expert tire maintenance and replacement',
    features: [
      'Tire Pressure Check',
      'Wheel Balancing',
      'Tire Rotation',
      'Alignment Service',
      'Puncture Repair'
    ]
  },
  { 
    id: 'engine-repair',
    icon: Wrench, 
    title: 'Engine Repair', 
    description: 'Complete engine diagnostics and repair',
    features: [
      'Engine Diagnostics',
      'Performance Tuning',
      'Parts Replacement',
      'Oil Service',
      'Cooling System'
    ]
  },
  { 
    id: 'accidental-repair',
    icon: AlertTriangle, 
    title: 'Accidental Repair', 
    description: 'Specialized repair for accident damage',
    features: [
      'Damage Assessment',
      'Insurance Coordination',
      'Body Work',
      'Paint Service',
      'Parts Replacement'
    ]
  }
];