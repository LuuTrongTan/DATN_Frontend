import { apiClient } from '../api';
import { Product, Category, ApiResponse, PaginatedResponse } from '../types';

export const productService = {
  // Get all products with pagination and filters
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    category_id?: number;
    search?: string;
    min_price?: number;
    max_price?: number;
  }): Promise<ApiResponse<PaginatedResponse<Product>>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.min_price) queryParams.append('min_price', params.min_price.toString());
    if (params?.max_price) queryParams.append('max_price', params.max_price.toString());
    
    const query = queryParams.toString();
    return apiClient.get(`/products${query ? `?${query}` : ''}`);
  },

  // Search products
  searchProducts: async (query: string, params?: {
    page?: number;
    limit?: number;
    category_id?: number;
  }): Promise<ApiResponse<PaginatedResponse<Product>>> => {
    const queryParams = new URLSearchParams({ search: query });
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
    
    return apiClient.get(`/products/search?${queryParams.toString()}`);
  },

  // Get product by ID
  getProductById: async (id: number): Promise<ApiResponse<Product>> => {
    return apiClient.get(`/products/${id}`);
  },

  // Create product (admin/staff only)
  createProduct: async (data: {
    category_id: number;
    name: string;
    description?: string;
    price: number;
    stock_quantity: number;
    is_active?: boolean;
  }): Promise<ApiResponse<Product>> => {
    return apiClient.post('/products', data);
  },

  // Update product (admin/staff only)
  updateProduct: async (id: number, data: {
    category_id?: number;
    name?: string;
    description?: string;
    price?: number;
    stock_quantity?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<Product>> => {
    return apiClient.put(`/products/${id}`, data);
  },

  // Delete product (admin/staff only)
  deleteProduct: async (id: number): Promise<ApiResponse> => {
    return apiClient.delete(`/products/${id}`);
  },
};

