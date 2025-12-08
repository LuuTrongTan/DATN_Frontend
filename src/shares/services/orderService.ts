import { apiClient } from '../api';
import { Order, ApiResponse, PaginatedResponse, PaymentMethod } from '../types';

export const orderService = {
  // Get orders
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Order>>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    return apiClient.get(`/orders${query ? `?${query}` : ''}`);
  },

  // Get order by ID
  getOrderById: async (id: number): Promise<ApiResponse<Order>> => {
    return apiClient.get(`/orders/${id}`);
  },

  // Create order
  createOrder: async (data: {
    shipping_address: string;
    payment_method: PaymentMethod;
    shipping_fee?: number;
    notes?: string;
  }): Promise<ApiResponse<Order>> => {
    return apiClient.post('/orders', data);
  },
};

