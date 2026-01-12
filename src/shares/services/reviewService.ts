import { apiClient } from '../api';
import { ApiResponse, PaginatedResponse, Review } from '../types';

export interface CreateReviewInput {
  product_id: number;
  order_id: number;
  rating: number;
  comment?: string;
  image_urls?: string[];
  video_url?: string;
}

export const reviewService = {
  createReview: async (data: CreateReviewInput): Promise<ApiResponse<Review>> => {
    return apiClient.post('/reviews', data);
  },

  getProductReviews: async (
    productId: number,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<PaginatedResponse<Review>>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get(`/reviews/product/${productId}${query ? `?${query}` : ''}`);
  },

  // Admin methods
  getAllReviews: async (params?: {
    page?: number;
    limit?: number;
    is_approved?: boolean;
    product_id?: number;
  }): Promise<ApiResponse<PaginatedResponse<Review>>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.is_approved !== undefined) queryParams.append('is_approved', params.is_approved.toString());
    if (params?.product_id) queryParams.append('product_id', params.product_id.toString());

    const query = queryParams.toString();
    return apiClient.get(`/reviews/admin/all${query ? `?${query}` : ''}`);
  },

  approveReview: async (id: number): Promise<ApiResponse<Review>> => {
    return apiClient.put(`/reviews/admin/${id}/approve`, {});
  },

  rejectReview: async (id: number, reason?: string): Promise<ApiResponse<Review>> => {
    return apiClient.put(`/reviews/admin/${id}/reject`, { reason });
  },

  deleteReview: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/reviews/admin/${id}`);
  },
};


