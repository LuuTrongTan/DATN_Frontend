import { apiClient } from '../api';
import { ApiResponse } from '../types';

export interface ShippingFeeRequest {
  province: string;
  district: string;
  weight?: number;
  value?: number;
}

export interface ShippingFeeResponse {
  fee: number;
  estimated_days: number;
  provider?: string;
}

export interface Shipping {
  id: number;
  order_id: number;
  shipping_provider: string | null;
  tracking_number: string | null;
  shipping_fee: number;
  estimated_delivery_date: string | null;
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  notes: string | null;
}

export const shippingService = {
  calculateFee: async (data: ShippingFeeRequest): Promise<ApiResponse<ShippingFeeResponse>> => {
    return apiClient.post('/shipping/calculate', data);
  },

  getShippingInfo: async (order_id: number): Promise<ApiResponse<Shipping>> => {
    return apiClient.get(`/shipping/order/${order_id}`);
  },

  updateShippingInfo: async (
    order_id: number,
    data: {
      tracking_number?: string;
      shipping_provider?: string;
      status?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<Shipping>> => {
    return apiClient.put(`/shipping/order/${order_id}`, data);
  },
};

