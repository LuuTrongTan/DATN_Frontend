import { apiClient } from '../api';

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  idToken: string; // Firebase ID token (bắt buộc)
}

export interface User {
  id: string; // UUID từ database
  email?: string;
  phone?: string;
  full_name?: string;
  role: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  created_at?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    refreshToken: string;
    user: User;
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
    token: string;
    refreshToken: string;
    user: User;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
  };
  error?: {
    code?: string;
    details?: any;
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
  // Quên mật khẩu qua Phone (Firebase) - reset ngay
  forgotPasswordByPhone: async (phone: string, idToken: string, newPassword: string, confirmPassword: string) => {
    return apiClient.post('/auth/forgot-password', { 
      phone, 
      idToken, 
      newPassword, 
      confirmPassword 
    });
  },
  // Quên mật khẩu qua Email (OTP) - bước 1: gửi code
  forgotPasswordByEmail: async (email: string) => {
    return apiClient.post('/auth/forgot-password', { email });
  },
  // Quên mật khẩu qua Email (OTP) - bước 2: reset với code
  resetPassword: async (code: string, email: string, newPassword: string, confirmPassword: string) => {
    return apiClient.post('/auth/reset-password', { 
      code, 
      email, 
      newPassword, 
      confirmPassword 
    });
  },
  // Legacy method for backward compatibility
  forgotPassword: async (email?: string, phone?: string) => {
    return apiClient.post('/auth/forgot-password', { email, phone });
  },
  changePassword: async (oldPassword: string, newPassword: string, confirmPassword: string) => {
    return apiClient.post('/auth/change-password', { oldPassword, newPassword, confirmPassword });
  },
  logout: async () => {
    return apiClient.post('/auth/logout', {});
  },
  getCurrentUser: async () => {
    return apiClient.get('/auth/me');
  },
  updateProfile: async (data: { full_name?: string; phone?: string; email?: string }) => {
    return apiClient.put('/auth/profile', data);
  },
  refreshToken: async (refreshToken: string) => {
    return apiClient.post('/auth/refresh-token', { refreshToken });
  },
  // Thêm email recovery vào tài khoản
  addRecoveryEmail: async (email: string) => {
    return apiClient.post('/auth/add-recovery-email', { email });
  },
  // Xác thực email recovery
  verifyRecoveryEmail: async (code: string, email: string) => {
    return apiClient.post('/auth/verify-recovery-email', { code, email });
  },
  verifyPassword: async (password: string) => {
    return apiClient.post('/auth/verify-password', { password });
  },
  deactivateAccount: async () => {
    return apiClient.post('/auth/deactivate', {});
  },
  deleteAccount: async () => {
    return apiClient.delete('/auth/account');
  },
};

