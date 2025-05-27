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

// Types for the API response
type Feature = {
  id: number;
  name: string;
};

type ServiceDetail = {
  id: number;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  duration: string;
  warranty: string;
  recommended: string;
  category: string;
  manufacturers: number[];
  vehicles_models: number[];
  features: Feature[];
  image: string | null;
  image_url: string | null;
};

type ServiceCategory = {
  uuid: string;
  name: string;
  slug: string;
  image: string | null;
  description: string;
  services: ServiceDetail[];
};

// Frontend type that both API and static data will conform to
export type FrontendService = {
  id: string;
  icon: typeof Tool;
  title: string;
  description: string;
  slug: string;
  services: Array<{
    id: string;
    name: string;
    duration: string;
    warranty: string;
    recommended: string;
    base_price?: string;
    features: string[];
    image_url?: string | null;
  }>;
};

// Function to fetch service categories
export const fetchServiceCategories = async (): Promise<FrontendService[]> => {
  try {
    const response = await fetch('https://repairmybike.up.railway.app/api/repairing-service/service-categories/');
    const data = await response.json() as ServiceCategory[];
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format');
    }
    
    // Transform the data to match our frontend structure
    return data.map(category => ({
      id: category.uuid,
      icon: getIconForCategory(category.slug),
      title: category.name,
      description: category.description,
      slug: category.slug,
      services: category.services.map(service => ({
        id: service.id.toString(),
        name: service.name,
        duration: service.duration,
        warranty: service.warranty,
        recommended: service.recommended,
        base_price: service.base_price,
        features: service.features.map(f => f.name),
        image_url: service.image_url
      }))
    }));
  } catch (error) {
    console.error('Error fetching services:', error);
    return services;
  }
};

// Helper function to determine icon based on category slug
export function getIconForCategory(slug: string) {
  switch (slug) {
    case 'periodic-service':
      return Tool;
    case 'roadside-assistance':
      return LifeBuoy;
    case 'bike-insurance':
      return Shield;
    case 'battery-replacement':
      return Battery;
    case 'engine-repair':
      return Wrench;
    case 'accidental-repair':
      return AlertTriangle;
    default:
      return Tool;
  }
}

// Fallback static data in case API fails
export const services: FrontendService[] = [
  { 
    id: 'periodic-service',
    icon: Tool, 
    title: 'Periodic Service', 
    description: 'Regular maintenance to keep your bike in top condition',
    slug: 'periodic-service',
    services: [
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
    slug: 'roadside-assistance',
    services: [{
      id: 'roadside-assistance-1',
      name: 'Roadside Assistance',
      duration: '1 Hr',
      warranty: 'Per Service',
      recommended: 'As Needed',
      features: [
        'Immediate Response',
        'Nationwide Coverage',
        'Towing Service',
        'Fuel Delivery',
        'Tire Change'
      ]
    }]
  },
  { 
    id: 'bike-insurance',
    icon: Shield, 
    title: 'Bike Insurance', 
    description: 'Comprehensive coverage for your peace of mind',
    slug: 'bike-insurance',
    services: [{
      id: 'bike-insurance-1',
      name: 'Bike Insurance',
      duration: 'Annual',
      warranty: '1 Year',
      recommended: 'Yearly Renewal',
      features: [
        'Accident Coverage',
        'Third-party Liability',
        'Natural Disaster Protection',
        'Theft Coverage',
        'Zero Depreciation'
      ]
    }]
  }
];