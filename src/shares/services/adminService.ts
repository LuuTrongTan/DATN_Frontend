import { apiClient } from '../api';
import { User, Category, Order, PaginatedResponse } from '../types';

export interface CreateCategoryRequest {
  name: string;
  image_url?: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  image_url?: string;
  description?: string;
}

export interface CreateStaffRequest {
  email?: string;
  phone?: string;
}

export interface UpdateUserRequest {
  is_active?: boolean;
  is_banned?: boolean;
  role?: string;
  email?: string;
  password?: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
  notes?: string;
}

export interface StatisticsResponse {
  orders: {
    total: string;
    revenue: string;
    delivered: string;
  };
  users: {
    total: string;
  };
  topProducts: Array<{
    id: number;
    name: string;
    total_sold: string;
    revenue: string;
  }>;
}

export interface GetUsersParams {
  role?: string;
  page?: number;
  limit?: number;
}

export interface GetOrdersParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface GetStatisticsParams {
  start_date?: string;
  end_date?: string;
}

export const adminService = {
  // Category Management
  createCategory: async (data: CreateCategoryRequest) => {
    return apiClient.post('/admin/categories', data);
  },

  updateCategory: async (id: number, data: UpdateCategoryRequest) => {
    return apiClient.put(`/admin/categories/${id}`, data);
  },

  deleteCategory: async (id: number) => {
    return apiClient.delete(`/admin/categories/${id}`);
  },

  // Order Management
  getAllOrders: async (params?: GetOrdersParams) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return apiClient.get(`/admin/orders${query ? `?${query}` : ''}`);
  },

  updateOrderStatus: async (id: number, data: UpdateOrderStatusRequest) => {
    return apiClient.put(`/admin/orders/${id}/status`, data);
  },

  // Staff Management
  createStaff: async (data: CreateStaffRequest) => {
    return apiClient.post('/admin/staff', data);
  },

  // User Management
  getUsers: async (params?: GetUsersParams) => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return apiClient.get(`/admin/users${query ? `?${query}` : ''}`);
  },

  updateUser: async (id: number, data: UpdateUserRequest) => {
    return apiClient.put(`/admin/users/${id}`, data);
  },

  // Statistics
  getStatistics: async (params?: GetStatisticsParams) => {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const query = queryParams.toString();
    return apiClient.get(`/admin/statistics${query ? `?${query}` : ''}`);
  },
};

