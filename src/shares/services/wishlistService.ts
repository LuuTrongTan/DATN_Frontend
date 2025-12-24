import { apiClient } from '../api';
import { ApiResponse, Product } from '../types';

export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  created_at: string;
  name?: string;
  price?: number;
  image_url?: string | null;
  image_urls?: string[];
  stock_quantity?: number;
  is_active?: boolean;
}

export const wishlistService = {
  getWishlist: async (): Promise<ApiResponse<WishlistItem[]>> => {
    console.log('Calling wishlistService.getWishlist() - API: /wishlist');
    const result = await apiClient.get('/wishlist');
    console.log('wishlistService.getWishlist() response:', result);
    return result;
  },

  addToWishlist: async (product_id: number): Promise<ApiResponse<WishlistItem>> => {
    return apiClient.post('/wishlist', { product_id });
  },

  removeFromWishlist: async (product_id: number): Promise<ApiResponse> => {
    return apiClient.delete(`/wishlist/${product_id}`);
  },

  checkWishlist: async (product_id: number): Promise<ApiResponse<{ isInWishlist: boolean }>> => {
    return apiClient.get(`/wishlist/check/${product_id}`);
  },
};


