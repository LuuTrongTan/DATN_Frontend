import { apiClient } from '../api';
import { Category, ApiResponse } from '../types';

export const categoryService = {
  // Get all categories
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    return apiClient.get('/products/categories');
  },

  // Get category by ID
  getCategoryById: async (id: number): Promise<ApiResponse<Category>> => {
    return apiClient.get(`/products/categories/${id}`);
  },
};

