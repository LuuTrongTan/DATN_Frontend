// ProductManagement types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_urls: string[];
  video_url?: string;
  category_id: number;
  is_active: boolean;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  variant_type: string;
  variant_value: string;
  price_adjustment: number;
  stock_quantity: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  variant_id?: number;
  quantity: number;
}

export interface Category {
  id: number;
  name: string;
  image_url?: string;
  description?: string;
  is_active: boolean;
}

