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
};

