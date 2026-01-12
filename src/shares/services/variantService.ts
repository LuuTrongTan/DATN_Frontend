import { apiClient } from '../api';
import { ProductVariant, ApiResponse } from '../types';

export const variantService = {
  // Lấy tất cả variants của sản phẩm
  getVariantsByProduct: async (productId: number): Promise<ApiResponse<ProductVariant[]>> => {
    return apiClient.get(`/products/${productId}/variants`);
  },

  // Lấy variant theo ID
  getVariantById: async (id: number): Promise<ApiResponse<ProductVariant>> => {
    return apiClient.get(`/products/variants/${id}`);
  },

  // Tạo variant (admin/staff only)
  createVariant: async (
    productId: number,
    data: {
      sku?: string | null;
      variant_attributes: Record<string, string>; // {"Size": "M", "Color": "Đỏ"}
      price_adjustment?: number;
      stock_quantity?: number;
      image_urls?: string[]; // NEW: Hỗ trợ nhiều ảnh cho variant
      is_active?: boolean;
    }
  ): Promise<ApiResponse<ProductVariant>> => {
    return apiClient.post(`/products/${productId}/variants`, data);
  },

  // Cập nhật variant (admin/staff only)
  updateVariant: async (
    id: number,
    data: {
      sku?: string | null;
      variant_attributes?: Record<string, string>;
      price_adjustment?: number;
      stock_quantity?: number;
      image_urls?: string[]; // NEW: Hỗ trợ nhiều ảnh cho variant
      is_active?: boolean;
    }
  ): Promise<ApiResponse<ProductVariant>> => {
    return apiClient.put(`/products/variants/${id}`, data);
  },

  // Xóa variant (admin/staff only)
  deleteVariant: async (id: number): Promise<ApiResponse> => {
    return apiClient.delete(`/products/variants/${id}`);
  },

};

