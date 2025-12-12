import { apiClient } from '../api';
import { ApiResponse } from '../types';

export interface CreatePaymentResponse {
  payment_url: string;
}

export const paymentService = {
  createVNPayPayment: async (order_id: number): Promise<ApiResponse<CreatePaymentResponse>> => {
    return apiClient.post('/payment/vnpay/create', { order_id });
  },

  getPaymentStatus: async (order_id: number): Promise<ApiResponse<{
    payment_status: string;
    payment_method: string;
  }>> => {
    return apiClient.get(`/payment/status/${order_id}`);
  },
};

