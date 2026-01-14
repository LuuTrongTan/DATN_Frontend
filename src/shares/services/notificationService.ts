import { apiClient } from '../api';

export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface NotificationsResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MarkAllAsReadResponse {
  updatedCount: number;
}

export const notificationService = {
  async getNotifications(params?: PaginationParams): Promise<NotificationsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;
    
    const res = await apiClient.get(endpoint);
    // Backend trả về: { success: true, data: [], pagination: { page, limit, total, totalPages } }
    if (res.data && res.data.success) {
      return {
        data: res.data.data || [],
        pagination: res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    }
    return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },

  async markAsRead(id: number): Promise<Notification> {
    const res = await apiClient.post(`/notifications/${id}/read`, {});
    // Backend dùng ResponseHandler.success => { success, data, message }
    if (res.data && res.data.success) {
      return (res.data.data || null) as Notification;
    }
    throw new Error('Không thể đánh dấu thông báo đã đọc');
  },

  async markAllAsRead(): Promise<MarkAllAsReadResponse> {
    const res = await apiClient.post('/notifications/read-all', {});
    // Hiện BE trả về { success, data: null }, không có count; service chuẩn hóa về updatedCount
    if (res.data && res.data.success) {
      return { updatedCount: 0 };
    }
    throw new Error('Không thể đánh dấu tất cả thông báo');
  },
};


