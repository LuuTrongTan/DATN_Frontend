import { apiClient } from '../api';
import { ProductVariant, VariantAttributeDefinition, VariantAttributeValue, ApiResponse } from '../types';

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
      image_url?: string | null;
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
      image_url?: string | null;
      is_active?: boolean;
    }
  ): Promise<ApiResponse<ProductVariant>> => {
    return apiClient.put(`/products/variants/${id}`, data);
  },

  // Xóa variant (admin/staff only)
  deleteVariant: async (id: number): Promise<ApiResponse> => {
    return apiClient.delete(`/products/variants/${id}`);
  },

  // Lấy định nghĩa thuộc tính của sản phẩm
  getAttributeDefinitions: async (productId: number): Promise<ApiResponse<VariantAttributeDefinition[]>> => {
    return apiClient.get(`/products/${productId}/variant-attributes`);
  },

  // Tạo định nghĩa thuộc tính (admin/staff only)
  createAttributeDefinition: async (
    productId: number,
    data: {
      attribute_name: string;
      display_name: string;
      display_order?: number;
      is_required?: boolean;
    }
  ): Promise<ApiResponse<VariantAttributeDefinition>> => {
    return apiClient.post(`/products/${productId}/variant-attributes`, data);
  },

  // Xóa định nghĩa thuộc tính (admin/staff only)
  deleteAttributeDefinition: async (id: number): Promise<ApiResponse> => {
    return apiClient.delete(`/products/variant-attributes/${id}`);
  },

  // Thêm giá trị cho thuộc tính (admin/staff only)
  createAttributeValue: async (
    definitionId: number,
    data: {
      value: string;
      display_order?: number;
    }
  ): Promise<ApiResponse<VariantAttributeValue>> => {
    return apiClient.post(`/products/variant-attributes/${definitionId}/values`, data);
  },

  // Xóa giá trị thuộc tính (admin/staff only)
  deleteAttributeValue: async (id: number): Promise<ApiResponse> => {
    return apiClient.delete(`/products/variant-attributes/values/${id}`);
  },

  // Lấy tất cả định nghĩa thuộc tính (để dùng lại)
  getAllAttributeDefinitions: async (params?: {
    category_id?: number;
    exclude_product_id?: number;
  }): Promise<ApiResponse<any[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params?.exclude_product_id) queryParams.append('exclude_product_id', params.exclude_product_id.toString());
    const query = queryParams.toString();
    return apiClient.get(`/products/variant-attributes/all${query ? `?${query}` : ''}`);
  },

  // Copy thuộc tính từ sản phẩm khác (admin/staff only)
  copyAttributesFromProduct: async (
    productId: number,
    data: {
      source_product_id: number;
      attribute_names?: string[];
    }
  ): Promise<ApiResponse> => {
    return apiClient.post(`/products/${productId}/variant-attributes/copy`, data);
  },
};

