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
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number | null;
  display_order?: number;
  is_active?: boolean;
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
  getAdminProducts: async (params?: { search?: string; category_id?: number; include_deleted?: boolean; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category_id) query.set('category_id', String(params.category_id));
    if (params?.include_deleted) query.set('include_deleted', 'true');
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiClient.get(`/admin/products${qs ? `?${qs}` : ''}`);
  },
  getCategories: async (params?: { include_deleted?: boolean }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.include_deleted) query.set('include_deleted', 'true');
    const qs = query.toString();
    return apiClient.get(`/admin/categories${qs ? `?${qs}` : ''}`);
  },
  getCategoryById: async (categoryId: number, params?: { include_deleted?: boolean }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.include_deleted) query.set('include_deleted', 'true');
    const qs = query.toString();
    return apiClient.get(`/admin/categories/${categoryId}${qs ? `?${qs}` : ''}`);
  },
  createCategory: async (data: CreateCategoryRequest): Promise<any> => {
    return apiClient.post('/admin/categories', data);
  },
  updateCategory: async (categoryId: number, data: UpdateCategoryRequest): Promise<any> => {
    return apiClient.put(`/admin/categories/${categoryId}`, data);
  },
  restoreCategory: async (categoryId: number): Promise<any> => {
    return apiClient.post(`/admin/categories/${categoryId}/restore`, {});
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

