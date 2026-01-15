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
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      const queryString = queryParams.toString();
      const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;
      
      const res = await apiClient.get(endpoint);
      
      // apiClient.get() đã return data đã parse, không phải res.data
      // Backend trả về: { success: true, data: [], pagination: { page, limit, total, totalPages } }
      if (res && res.success) {
        return {
          data: res.data || [],
          pagination: res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
        };
      }
      
      return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    } catch (error: any) {
      console.error('Error in getNotifications:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  async markAsRead(id: number): Promise<Notification> {
    const res = await apiClient.post(`/notifications/${id}/read`, {});
    // Backend dùng ResponseHandler.success => { success, data, message }
    // apiClient.post() đã return data đã parse
    if (res && res.success) {
      return (res.data || null) as Notification;
    }
    throw new Error('Không thể đánh dấu thông báo đã đọc');
  },

  async markAllAsRead(): Promise<MarkAllAsReadResponse> {
    const res = await apiClient.post('/notifications/read-all', {});
    // Hiện BE trả về { success, data: null }, không có count; service chuẩn hóa về updatedCount
    // apiClient.post() đã return data đã parse
    if (res && res.success) {
      return { updatedCount: 0 };
    }
    throw new Error('Không thể đánh dấu tất cả thông báo');
  },

  // Lấy số lượng notifications chưa đọc
  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiClient.get('/notifications/unread-count');
      // Backend trả về: { success: true, data: { unreadCount: number } }
      // apiClient.get() đã return data đã parse
      if (res && res.success && res.data) {
        return res.data.unreadCount || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  },
};


