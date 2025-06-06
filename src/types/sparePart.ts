export interface SparePart {
  id: string;
  name: string;
  part_number: string;
  description: string;
  features: string;
  specifications: Record<string, any>;
  price: number;
  discounted_price: number | null;
  stock_quantity: number;
  availability_status: 'in_stock' | 'out_of_stock' | 'pre_order' | 'discontinued';
  status_display: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  manufacturers: Array<{
    id: number;
    name: string;
  }>;
  vehicle_models: Array<{
    id: number;
    name: string;
  }>;
  main_image: string;
  additional_images: string[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  display_price: {
    amount: number;
    formatted: string;
  };
}

export interface SparePartFilters {
  search?: string;
  status?: string[];
  category?: string[];
  manufacturer?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: string[];
} 