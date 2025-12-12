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
    return apiClient.post('/inventory/stock-in', data);
  },

  stockAdjustment: async (data: {
    product_id?: number;
    variant_id?: number;
    new_quantity: number;
    reason?: string;
  }): Promise<ApiResponse> => {
    return apiClient.post('/inventory/stock-adjustment', data);
  },

  getStockHistory: async (params?: {
    product_id?: number;
    variant_id?: number;
    type?: 'in' | 'out' | 'adjustment';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<StockHistory>>> => {
    const queryParams = new URLSearchParams();
    if (params?.product_id) queryParams.append('product_id', params.product_id.toString());
    if (params?.variant_id) queryParams.append('variant_id', params.variant_id.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get(`/inventory/history${query ? `?${query}` : ''}`);
  },

  getStockAlerts: async (params?: {
    is_notified?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<StockAlert>>> => {
    const queryParams = new URLSearchParams();
    if (params?.is_notified !== undefined) queryParams.append('is_notified', params.is_notified.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get(`/inventory/alerts${query ? `?${query}` : ''}`);
  },

  markAlertAsNotified: async (id: number): Promise<ApiResponse<StockAlert>> => {
    return apiClient.put(`/inventory/alerts/${id}/notify`);
  },
};

