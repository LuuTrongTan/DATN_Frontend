import { apiClient } from '../api';
import { CartItem, ApiResponse } from '../types';

export const cartService = {
  // Get cart items
  getCart: async (): Promise<ApiResponse<CartItem[]>> => {
    return apiClient.get('/cart');
  },

  // Add item to cart
  addToCart: async (data: {
    product_id: number;
    variant_id?: number | null;
    quantity: number;
  }): Promise<ApiResponse<CartItem>> => {
    return apiClient.post('/cart', data);
  },

  // Update cart item
  updateCartItem: async (
    id: number, 
    data: { quantity?: number; variant_id?: number | null }
  ): Promise<ApiResponse<CartItem>> => {
    return apiClient.put(`/cart/${id}`, data);
  },

  // Remove item from cart
  removeFromCart: async (id: number): Promise<ApiResponse> => {
    return apiClient.delete(`/cart/${id}`);
  },
};

