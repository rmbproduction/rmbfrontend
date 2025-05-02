import { 
  PenTool as Tool, 
  Shield, 
  Battery, 
  Wrench, 
  AlertTriangle, 
  Gauge, 
  LifeBuoy,
  Settings
} from 'lucide-react';

// Define icon type and map
type IconType = typeof Tool;

export const iconComponents: Record<string, IconType> = {
  'tool': Tool,
  'shield': Shield,
  'battery': Battery,
  'wrench': Wrench,
  'alert': AlertTriangle,
  'gauge': Gauge,
  'lifebuoy': LifeBuoy,
  'settings': Settings
};

// Service type definitions
// Update the packages type in ServiceData
// Add manufacturer type
// Add export to the Manufacturer interface
export interface Manufacturer {
  id: string;
  name: string;
  logo: string;
  specializations: string[];
  rating?: number;
  experience?: string;
}

export type ServiceData = {
  id: string;
  iconName: string;
  title: string;
  description: string;
  rating?: number;
  reviews?: number;
  features?: string[];
  packages?: Array<{
    id: number;
    name: string;
    price: number;
    duration: string;
    warranty: string;
    recommended: string;
    features: string[];
  }>;
  manufacturers?: Manufacturer[];
};

// Helper function to get icon
export const getServiceIcon = (iconName: string): IconType => {
  return iconComponents[iconName.toLowerCase()] || Tool;
};

// Fetch services function
export const fetchServices = async (): Promise<ServiceData[]> => {
  try {
    const response = await fetch('http://localhost:3001/services');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching services:', error);
    // Return local services data as fallback
    return services;
  }
};

// Default services data
// Update services data with manufacturers
export const services: ServiceData[] = [
  {
    id: 'periodic-service',
    iconName: 'wrench',
    title: 'Periodic Service',
    description: 'Regular maintenance to keep your bike in top condition',
    rating: 4.8,
    reviews: 256,
    manufacturers: [
      {
        id: 'maruti',
        name: 'Maruti Suzuki',
        logo: '/manufacturers/maruti.png',
        specializations: ['Regular Service', 'Engine Maintenance'],
        rating: 4.9,
        experience: '25+ years'
      },
      {
        id: 'honda',
        name: 'Honda',
        logo: '/manufacturers/honda.png',
        specializations: ['Premium Service', 'Performance Tuning'],
        rating: 4.8,
        experience: '20+ years'
      },
      {
        id: 'tata',
        name: 'Tata',
        logo: '/manufacturers/tata.png',
        specializations: ['Full Service', 'Diagnostic Check'],
        rating: 4.7,
        experience: '30+ years'
      }
    ],
    packages: [
      {
        id: 1,
        name: 'Basic Service',
        price: 2999,
        duration: '4 Hrs',
        warranty: '1000 Kms or 1 Month',
        recommended: 'Every 5000 Kms or 3 Months',
        features: [
          'Engine Oil Replacement',
          'Oil Filter Replacement',
          'Air Filter Cleaning',
          'Chain Lubrication',
          'Basic Inspection'
        ]
      },
      {
        id: 2,
        name: 'Premium Service',
        price: 4999,
        duration: '6 Hrs',
        warranty: '2000 Kms or 2 Months',
        recommended: 'Every 10,000 Kms or 6 Months',
        features: [
          'All Basic Service Features',
          'Deep Engine Cleaning',
          'Brake Adjustment',
          'Chain Adjustment',
          'Complete Diagnostics'
        ]
      }
    ]
  },
  { 
    id: 'roadside-assistance',
    iconName: 'lifebuoy',
    title: 'Roadside Assistance',
    description: '24/7 emergency support wherever you are',
    rating: 4.9,
    reviews: 189,
    features: [
      'Immediate Response',
      'Nationwide Coverage',
      'Towing Service',
      'Fuel Delivery',
      'Tire Change'
    ]
  },
  {
    id: 'battery-service',
    iconName: 'battery',
    title: 'Battery Service',
    description: 'Complete battery check-up and replacement services',
    rating: 4.7,
    reviews: 142,
    manufacturers: [
      {
        id: 'exide',
        name: 'Exide Care',
        logo: '/manufacturers/exide.png',
        specializations: ['Battery Replacement', 'Battery Testing'],
        rating: 4.8,
        experience: '15+ years'
      },
      {
        id: 'amaron',
        name: 'Amaron Service',
        logo: '/manufacturers/amaron.png',
        specializations: ['Quick Charging', 'Battery Health Check'],
        rating: 4.7,
        experience: '12+ years'
      }
    ],
    packages: [
      {
        id: 1,
        name: 'Battery Check-up',
        price: 499,
        duration: '30 Mins',
        warranty: 'NA',
        recommended: 'Every 3 Months',
        features: [
          'Battery Health Check',
          'Terminal Cleaning',
          'Water Level Check',
          'Charging System Test'
        ]
      },
      {
        id: 2,
        name: 'Battery Replacement',
        price: 3999,
        duration: '1 Hr',
        warranty: '12 Months',
        recommended: 'When Required',
        features: [
          'New Battery Installation',
          'Old Battery Disposal',
          'Terminal Protection',
          'Warranty Registration'
        ]
      }
    ]
  },
  {
    id: 'diagnostics',
    iconName: 'gauge',
    title: 'Full Diagnostics',
    description: 'Complete bike health check and diagnostics',
    rating: 4.6,
    reviews: 167,
    packages: [
      {
        id: 1,
        name: 'Basic Diagnostics',
        price: 999,
        duration: '2 Hrs',
        warranty: '7 Days',
        recommended: 'Every 6 Months',
        features: [
          'Engine Performance Check',
          'Error Code Reading',
          'Basic System Scan',
          'Performance Report'
        ]
      }
    ]
  },
  {
    id: 'insurance',
    iconName: 'shield',
    title: 'Bike Insurance',
    description: 'Comprehensive insurance solutions for your bike',
    rating: 4.8,
    reviews: 213,
    features: [
      'Accident Coverage',
      'Third-party Liability',
      'Natural Disaster Protection',
      'Theft Coverage',
      'Zero Depreciation Option'
    ]
  }
];