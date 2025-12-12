import { apiClient } from '../api';
import { ApiResponse, PaginatedResponse } from '../types';

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  user_limit: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  applicable_to: 'all' | 'category' | 'product';
  category_id: number | null;
  product_id: number | null;
}

export interface CreateCouponInput {
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  user_limit?: number;
  start_date: string;
  end_date: string;
  applicable_to?: 'all' | 'category' | 'product';
  category_id?: number;
  product_id?: number;
}

export interface ApplyCouponInput {
  code: string;
  order_amount: number;
  product_ids?: number[];
  category_ids?: number[];
}

export interface ApplyCouponResponse {
  coupon: {
    id: number;
    code: string;
    name: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  };
  discount_amount: number;
  final_amount: number;
}

export const couponService = {
  getCoupons: async (params?: {
    page?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<PaginatedResponse<Coupon>>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

    const query = queryParams.toString();
    return apiClient.get(`/coupons${query ? `?${query}` : ''}`);
  },

  getCouponById: async (id: number): Promise<ApiResponse<Coupon>> => {
    return apiClient.get(`/coupons/${id}`);
  },

  createCoupon: async (data: CreateCouponInput): Promise<ApiResponse<Coupon>> => {
    return apiClient.post('/coupons', data);
  },

  updateCoupon: async (id: number, data: Partial<CreateCouponInput>): Promise<ApiResponse<Coupon>> => {
    return apiClient.put(`/coupons/${id}`, data);
  },

  deleteCoupon: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/coupons/${id}`);
  },

  applyCoupon: async (data: ApplyCouponInput): Promise<ApiResponse<ApplyCouponResponse>> => {
    return apiClient.post('/coupons/apply', data);
  },
};

