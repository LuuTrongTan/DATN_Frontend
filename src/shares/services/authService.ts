import { apiClient } from '../api';

export const authService = {
  login: async (emailOrPhone: string, password: string) => {
    return apiClient.post('/auth/login', { emailOrPhone, password });
  },
  register: async (emailOrPhone: string, password: string) => {
    return apiClient.post('/auth/register', { emailOrPhone, password });
  },
  verify: async (code: string) => {
    return apiClient.post('/auth/verify', { code });
  },
  forgotPassword: async (emailOrPhone: string) => {
    return apiClient.post('/auth/forgot-password', { emailOrPhone });
  },
  resetPassword: async (code: string, newPassword: string) => {
    return apiClient.post('/auth/reset-password', { code, newPassword });
  },
  changePassword: async (oldPassword: string, newPassword: string) => {
    return apiClient.post('/auth/change-password', { oldPassword, newPassword });
  },
};

