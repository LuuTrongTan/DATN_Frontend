// Product service for API calls
import { apiClient } from '../../../shares/api';

export const productService = {
  getAll: async () => {
    return apiClient.get('/products');
  },
  getById: async (id: number) => {
    return apiClient.get(`/products/${id}`);
  },
  create: async (data: any) => {
    return apiClient.post('/products', data);
  },
  update: async (id: number, data: any) => {
    return apiClient.put(`/products/${id}`, data);
  },
  delete: async (id: number) => {
    return apiClient.delete(`/products/${id}`);
  },
};

