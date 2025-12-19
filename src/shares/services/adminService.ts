import { apiClient } from '../api';

export interface StatisticsResponse {
  orders?: {
    total?: string;
    revenue?: string;
    delivered?: string;
  };
  users?: {
    total?: string;
  };
  topProducts?: Array<{
    id: number;
    name: string;
    total_sold: string;
    revenue: string;
  }>;
}

export interface UpdateOrderStatusRequest {
  status: string;
  notes?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  image_url?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

export interface CreateStaffRequest {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  password?: string;
}

export const adminService = {
  getStatistics: async (params?: any): Promise<{ statistics: StatisticsResponse }> => {
    const query = new URLSearchParams(params || {}).toString();
    return apiClient.get(`/admin/statistics${query ? `?${query}` : ''}`);
  },
  getAllOrders: async (params?: any): Promise<any> => {
    const query = new URLSearchParams(params || {}).toString();
    return apiClient.get(`/admin/orders${query ? `?${query}` : ''}`);
  },
  updateOrderStatus: async (orderId: number, data: UpdateOrderStatusRequest): Promise<any> => {
    return apiClient.put(`/admin/orders/${orderId}/status`, data);
  },
  createCategory: async (data: CreateCategoryRequest): Promise<any> => {
    return apiClient.post('/admin/categories', data);
  },
  updateCategory: async (categoryId: number, data: UpdateCategoryRequest): Promise<any> => {
    return apiClient.put(`/admin/categories/${categoryId}`, data);
  },
  deleteCategory: async (categoryId: number): Promise<any> => {
    return apiClient.delete(`/admin/categories/${categoryId}`);
  },
  getUsers: async (params?: any): Promise<any> => {
    const query = new URLSearchParams(params || {}).toString();
    return apiClient.get(`/admin/users${query ? `?${query}` : ''}`);
  },
  createStaff: async (data: CreateStaffRequest): Promise<any> => {
    return apiClient.post('/admin/staff', data);
  },
  updateUser: async (userId: number, data: UpdateUserRequest): Promise<any> => {
    return apiClient.put(`/admin/users/${userId}`, data);
  },
};

