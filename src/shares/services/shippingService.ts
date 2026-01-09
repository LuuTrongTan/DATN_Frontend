import { apiClient } from '../api';
import { ApiResponse } from '../types';

export interface ShippingFeeRequest {
  province: string | number;
  district: string | number;
  ward?: string | number;
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

// GHN related types (frontend-side, đơn giản hóa theo response backend)
export interface GHNService {
  service_id: number;
  short_name: string;
  service_type_id: number;
}

export interface GHNLeadtimeRequestBody {
  from_district_id: number;
  from_ward_code: string;
  to_district_id: number;
  to_ward_code: string;
  service_id?: number;
  service_type_id?: number;
}

export interface GHNLeadtimeResponse {
  leadtime: number;
  order_date: string;
}

export interface GHNStation {
  station_id: number;
  station_name: string;
  district_id: number;
  ward_code: string;
  address: string;
  lat: number;
  lng: number;
}

export interface CreateShippingOrderRequest {
  order_id: number;
  from_name?: string;
  from_phone?: string;
  from_address?: string;
  from_province?: string;
  from_district?: string;
  from_ward?: string;
  to_name: string;
  to_phone: string;
  to_address: string;
  to_province: string;
  to_district: string;
  to_ward?: string;
  weight?: number;
  value?: number;
  cod?: number;
  note?: string;
}

export interface CreateShippingOrderResponse {
  shipping_id: number;
  tracking_number: string;
  fee?: number;
}

export interface TrackingHistoryItem {
  status: string;
  time: string;
  location?: string;
}

export interface TrackingResponse {
  status: string;
  tracking_number: string;
  current_location?: string;
  estimated_delivery_date?: string;
  history?: TrackingHistoryItem[];
}

export interface CancelOrderRequest {
  order_codes: string[];
}

export interface UpdateCODRequest {
  order_code: string;
  cod_amount: number;
}

export interface UpdateGHNOrderRequest {
  order_code: string;
  to_name?: string;
  to_phone?: string;
  to_address?: string;
  to_ward_code?: string;
  to_district_id?: number;
  to_province_id?: number;
  note?: string;
  required_note?: string;
}

export const shippingService = {
  // Tính phí vận chuyển (GHN)
  calculateFee: async (data: ShippingFeeRequest): Promise<ApiResponse<ShippingFeeResponse>> => {
    return apiClient.post('/shipping/calculate', data);
  },

  // Lấy thông tin shipping của 1 đơn hàng
  getShippingInfo: async (order_id: number): Promise<ApiResponse<Shipping>> => {
    return apiClient.get(`/shipping/order/${order_id}`);
  },

  // Cập nhật thông tin shipping (admin/staff)
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

  // Lấy danh sách dịch vụ GHN (Nhanh/Chuẩn/Tiết kiệm)
  getServices: async (params: { from_district: number; to_district: number }): Promise<ApiResponse<GHNService[]>> => {
    return apiClient.get('/shipping/services', { params });
  },

  // Tính thời gian giao hàng dự kiến
  calculateLeadtime: async (body: GHNLeadtimeRequestBody): Promise<ApiResponse<GHNLeadtimeResponse>> => {
    return apiClient.post('/shipping/leadtime', body);
  },

  // Lấy danh sách bưu cục
  getStations: async (params?: { district_id?: number }): Promise<ApiResponse<GHNStation[]>> => {
    return apiClient.get('/shipping/stations', { params });
  },

  // Tạo đơn vận chuyển GHN (admin/staff)
  createShippingOrder: async (
    body: CreateShippingOrderRequest
  ): Promise<ApiResponse<CreateShippingOrderResponse>> => {
    return apiClient.post('/shipping/order', body);
  },

  // Tra cứu vận đơn GHN
  trackOrder: async (tracking_number: string): Promise<ApiResponse<TrackingResponse>> => {
    return apiClient.get(`/shipping/track/${encodeURIComponent(tracking_number)}`);
  },

  // Hủy đơn GHN (admin/staff)
  cancelOrder: async (body: CancelOrderRequest): Promise<ApiResponse<any>> => {
    return apiClient.post('/shipping/cancel', body);
  },

  // Cập nhật COD (admin/staff)
  updateCOD: async (body: UpdateCODRequest): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiClient.put('/shipping/cod', body);
  },

  // Cập nhật thông tin đơn GHN (admin/staff)
  updateGHNOrder: async (
    body: UpdateGHNOrderRequest
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiClient.put('/shipping/order-update', body);
  },
};

