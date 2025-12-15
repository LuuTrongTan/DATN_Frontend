// Frontend Types - Based on Backend Models

// User Types
export type UserRole = 'customer' | 'staff' | 'admin';

export interface User {
  id: number;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  is_banned?: boolean;
  created_at: string;
  updated_at: string;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product Types
export interface Product {
  id: number;
  category_id: number | null;
  category?: Category;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  image_urls: string[] | null;
  video_url: string | null;
  is_active: boolean;
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

// Product Variant Types
export interface ProductVariant {
  id: number;
  product_id: number;
  variant_type: string; // e.g., 'size', 'color'
  variant_value: string; // e.g., 'XL', 'Red'
  price_adjustment: number;
  stock_quantity: number;
  created_at: string;
}

// Cart Types
export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  product?: Product;
  variant_id: number | null;
  variant?: ProductVariant;
  quantity: number;
  created_at: string;
  updated_at: string;
}

// Order Types
export type PaymentMethod = 'online' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled';

export interface Order {
  id: number;
  user_id: number;
  order_number: string;
  total_amount: number;
  shipping_address: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  shipping_fee: number;
  notes: string | null;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product?: Product;
  variant_id: number | null;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  created_at: string;
}

// Review Types
export interface Review {
  id: number;
  user_id: number;
  user?: User;
  product_id: number;
  product?: Product;
  order_id: number;
  rating: number; // 1-5
  comment: string | null;
  image_urls: string[] | null;
  video_url: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
