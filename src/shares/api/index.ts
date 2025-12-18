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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

