import { apiClient } from '../api';

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    refreshToken: string;
    user: {
      id: number;
      email?: string;
      phone?: string;
      full_name?: string;
      role: string;
    };
  };
  error?: {
    code?: string;
    details?: any;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    userId: number;
    email?: string;
    phone?: string;
  };
}

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post('/auth/login', data);
  },
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return apiClient.post('/auth/register', data);
  },
  verify: async (code: string, email?: string, phone?: string) => {
    return apiClient.post('/auth/verify', { code, email, phone });
  },
  resendVerification: async (email?: string, phone?: string) => {
    return apiClient.post('/auth/resend-verification', { email, phone });
  },
  forgotPassword: async (email?: string, phone?: string) => {
    return apiClient.post('/auth/forgot-password', { email, phone });
  },
  resetPassword: async (code: string, newPassword: string) => {
    return apiClient.post('/auth/reset-password', { code, newPassword });
  },
  changePassword: async (oldPassword: string, newPassword: string) => {
    return apiClient.post('/auth/change-password', { oldPassword, newPassword });
  },
  logout: async () => {
    return apiClient.post('/auth/logout', {});
  },
  getCurrentUser: async () => {
    return apiClient.get('/auth/me');
  },
  updateProfile: async (data: { full_name?: string; phone?: string }) => {
    return apiClient.put('/auth/profile', data);
  },
  refreshToken: async (refreshToken: string) => {
    return apiClient.post('/auth/refresh-token', { refreshToken });
  },
  verifyFirebasePhone: async (idToken: string, phone?: string, email?: string, password?: string) => {
    return apiClient.post('/auth/verify-firebase-phone', { idToken, phone, email, password });
  },
};

