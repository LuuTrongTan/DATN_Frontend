import { apiClient } from '../api';
import { ApiResponse, PaginatedResponse } from '../types';

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


