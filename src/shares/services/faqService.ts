import { apiClient } from '../api';
import { ApiResponse } from '../types';

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string | null;
  order_index: number;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export const faqService = {
  getFAQs: async (params?: {
    category?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<FAQ[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

    const query = queryParams.toString();
    return apiClient.get(`/faqs${query ? `?${query}` : ''}`);
  },

  getFAQById: async (id: number): Promise<ApiResponse<FAQ>> => {
    return apiClient.get(`/faqs/${id}`);
  },
};

