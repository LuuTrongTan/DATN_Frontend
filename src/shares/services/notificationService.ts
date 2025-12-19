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

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const res = await apiClient.get('/notifications');
    return res.data || [];
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient.post(`/notifications/${id}/read`, {});
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/read-all', {});
  },
};


