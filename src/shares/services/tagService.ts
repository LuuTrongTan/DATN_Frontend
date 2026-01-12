import { apiClient } from '../api';
import { ApiResponse } from '../types';

export interface ProductTag {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
  product_count?: number;
}

export const tagService = {
  // Lấy tất cả tags
  getAllTags: async (): Promise<ApiResponse<ProductTag[]>> => {
    return apiClient.get('/products/tags');
  },

  // Lấy tag theo ID
  getTagById: async (id: number): Promise<ApiResponse<ProductTag>> => {
    return apiClient.get(`/products/tags/${id}`);
  },

  // Tạo tag (admin/staff only)
  createTag: async (data: {
    name: string;
    slug?: string;
  }): Promise<ApiResponse<ProductTag>> => {
    return apiClient.post('/products/tags', data);
  },

  // Cập nhật tag (admin/staff only)
  updateTag: async (
    id: number,
    data: {
      name?: string;
      slug?: string;
    }
  ): Promise<ApiResponse<ProductTag>> => {
    return apiClient.put(`/products/tags/${id}`, data);
  },

  // Xóa tag (admin/staff only)
  deleteTag: async (id: number): Promise<ApiResponse> => {
    return apiClient.delete(`/products/tags/${id}`);
  },

  // Lấy sản phẩm theo tag
  getProductsByTag: async (
    tagId: number,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    tag: ProductTag;
  }>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return apiClient.get(`/products/tags/${tagId}/products${query ? `?${query}` : ''}`);
  },
};
