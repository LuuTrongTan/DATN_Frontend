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

export interface PhoneFirebaseConfig {
  enabled: boolean;
}

export const adminService = {
  getStatistics: async (params?: any): Promise<{ statistics: StatisticsResponse }> => {
    const query = new URLSearchParams(params || {}).toString();
    const response = await apiClient.get(`/admin/statistics${query ? `?${query}` : ''}`);
    // Backend trả về dạng { success, message, data }, trong đó data chính là statistics
    return { statistics: (response && response.data) || {} };
  },
  getAllOrders: async (params?: any): Promise<any> => {
    // Chỉ thêm các params có giá trị (không phải undefined, null, hoặc empty string)
    const queryParams = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
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
  restoreProduct: async (productId: number): Promise<any> => {
    return apiClient.post(`/admin/products/${productId}/restore`, {});
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
  getUsers: async (params?: { role?: string; limit?: number }): Promise<any> => {
    const query = new URLSearchParams();

    // Chỉ set role khi thực sự có giá trị (tránh gửi role=undefined)
    if (params?.role) {
      query.set('role', params.role);
    }
    if (typeof params?.limit === 'number') {
      query.set('limit', String(params.limit));
    }

    const qs = query.toString();
    const res: any = await apiClient.get(`/admin/users${qs ? `?${qs}` : ''}`);

    // Chuẩn hóa dữ liệu trả về thành { users, pagination, raw }
    let users: any[] = [];
    if (Array.isArray(res?.users)) {
      users = res.users;
    } else if (Array.isArray(res?.data?.data)) {
      users = res.data.data;
    } else if (Array.isArray(res?.data)) {
      users = res.data;
    }

    const pagination = res?.data?.pagination || res?.pagination || null;

    return { users, pagination, raw: res };
  },
  getPhoneFirebaseConfig: async (): Promise<PhoneFirebaseConfig> => {
    const res = await apiClient.get('/admin/settings/auth/phone-firebase');
    return (res?.data as any) || { enabled: true };
  },
  updatePhoneFirebaseConfig: async (config: PhoneFirebaseConfig): Promise<PhoneFirebaseConfig> => {
    const res = await apiClient.put('/admin/settings/auth/phone-firebase', config);
    return (res?.data as any) || config;
  },
  createStaff: async (data: CreateStaffRequest): Promise<any> => {
    return apiClient.post('/admin/staff', data);
  },
  updateUser: async (userId: number, data: UpdateUserRequest): Promise<any> => {
    return apiClient.put(`/admin/users/${userId}`, data);
  },
};

