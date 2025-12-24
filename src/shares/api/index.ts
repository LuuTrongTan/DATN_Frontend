// API configuration and base functions
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3004/api';

/**
 * Lấy token từ storage
 * (hiện tại dùng localStorage; có thể thay đổi sang cookie/httpOnly trong tương lai)
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Get authentication headers cho JSON request
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  code?: string;
  details?: any;
  statusCode?: number;

  constructor(message: string, code?: string, details?: any, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}

/**
 * Handle API response
 */
const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  let data: any = null;
  try {
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }
  } catch {
    // fallback: response body không parse được
    data = null;
  }
  
  if (!response.ok) {
    // Handle 401 Unauthorized - token invalid or expired
    if (response.status === 401) {
      const currentPath = window.location.pathname;
      const authPaths = ['/login', '/register', '/forgot-password', '/verify'];
      const isVerifying = sessionStorage.getItem('isVerifying') === 'true';
      
      // QUAN TRỌNG: Không xóa token khi đang ở trang verify HOẶC đang trong quá trình verify
      // Vì user có thể đang verify OTP và token có thể đã expired nhưng vẫn cần giữ lại
      // để sau khi verify xong có thể refresh hoặc đăng nhập lại
      if (!authPaths.includes(currentPath) && !isVerifying) {
        // Chỉ xóa token khi KHÔNG ở auth pages VÀ không đang verify
        // Clear invalid token and user data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Trigger storage event to notify AuthContext
        window.dispatchEvent(new Event('storage'));
        
        // KHÔNG redirect ở đây vì sẽ gây conflict với React Router
        // Để React Router và RouteGuards xử lý redirect
        // Chỉ redirect nếu đang ở protected route và không phải auth pages
        const protectedPaths = ['/home', '/profile', '/orders', '/cart', '/checkout', '/admin'];
        
        // Chỉ redirect nếu đang ở protected route và không phải auth pages
        if (protectedPaths.some(path => currentPath.startsWith(path))) {
          // Sử dụng window.location.href chỉ khi thực sự cần thiết (tránh conflict với React Router)
          // Nhưng tốt hơn là để RouteGuards xử lý
          // Chỉ redirect nếu không có React Router navigation đang diễn ra
          if (!window.location.pathname.startsWith('/login')) {
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
        }
      }
      // Nếu đang ở auth pages (đặc biệt là /verify) HOẶC đang verify, KHÔNG xóa token
      // Để component có thể tự xử lý logic của nó
    }
    
    const errorCode = data?.error?.code || data?.code;
    const errorDetails = data?.error?.details || data?.details;
    throw new ApiError(
      data?.message || 'Có lỗi xảy ra',
      errorCode,
      errorDetails,
      response.status
    );
  }
  
  return data;
};

export const apiClient = {
  get: async (endpoint: string) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  put: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  delete: async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

