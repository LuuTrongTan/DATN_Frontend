import { apiClient } from '../api';
import { ApiResponse } from '../types';

export interface RefundItem {
  id: number;
  order_item_id: number;
  quantity: number;
  refund_amount: number;
  reason?: string | null;
}

export interface Refund {
  id: number;
  refund_number: string;
  order_id: number;
  user_id: string;
  type: 'refund' | 'return' | 'exchange';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled';
  refund_amount: number | null;
  admin_notes?: string | null;
  processed_by?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
  items?: RefundItem[];
  order_number?: string;
  order_total?: number;
}

export const refundService = {
  // Tạo refund request
  createRefund: async (data: {
    order_id: number;
    type: 'refund' | 'return' | 'exchange';
    reason: string;
    items: Array<{
      order_item_id: number;
      quantity: number;
      reason?: string;
    }>;
  }): Promise<ApiResponse<Refund>> => {
    return apiClient.post('/refunds', data);
  },

  // Lấy danh sách refunds
  getRefunds: async (params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    data: Refund[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return apiClient.get(`/refunds${query ? `?${query}` : ''}`);
  },

  // Lấy refund theo ID
  getRefundById: async (id: number): Promise<ApiResponse<Refund>> => {
    return apiClient.get(`/refunds/${id}`);
  },

  // Cập nhật refund status (admin)
  updateRefundStatus: async (
    id: number,
    data: {
      status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled';
      admin_notes?: string;
      refund_amount?: number;
    }
  ): Promise<ApiResponse<Refund>> => {
    return apiClient.put(`/refunds/${id}/status`, data);
  },

  // Hủy refund
  cancelRefund: async (id: number): Promise<ApiResponse<Refund>> => {
    // Backend không yêu cầu body, nhưng apiClient.post cần đối số data
    return apiClient.post(`/refunds/${id}/cancel`, {});
  },
};
