import { apiClient } from '../api';
import { ApiResponse, PaginatedResponse } from '../types';

export interface StockHistory {
  id: number;
  product_id: number | null;
  variant_id: number | null;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  created_by: number | null;
  created_at: string;
}

export interface StockAlert {
  id: number;
  product_id: number | null;
  variant_id: number | null;
  threshold: number;
  current_stock: number;
  is_notified: boolean;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
  product_name?: string;
  variant_attributes?: Record<string, string>; // Mới: JSONB variant_attributes
  // Deprecated: giữ lại để backward compatibility
  variant_type?: string;
  variant_value?: string;
}

export const inventoryService = {
  stockIn: async (data: {
    product_id?: number;
    variant_id?: number;
    quantity: number;
    reason?: string;
  }): Promise<ApiResponse> => {
    return apiClient.post('/admin/inventory/stock-in', data);
  },

  stockAdjustment: async (data: {
    product_id?: number;
    variant_id?: number;
    new_quantity: number;
    reason?: string;
  }): Promise<ApiResponse> => {
    return apiClient.post('/admin/inventory/stock-adjustment', data);
  },

};


