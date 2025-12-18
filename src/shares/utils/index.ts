// Shared utilities
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * Detect if input is email or phone number
 * @param input - User input (email or phone)
 * @returns 'email' | 'phone' | null
 */
export const detectInputType = (input: string): 'email' | 'phone' | null => {
  if (!input || input.trim().length === 0) {
    return null;
  }

  // Remove all non-digit characters for phone check
  const digitsOnly = input.replace(/\D/g, '');
  
  // Check if it's a valid email
  if (validateEmail(input)) {
    return 'email';
  }
  
  // Check if it's a valid phone (10 digits)
  if (digitsOnly.length === 10 && /^[0-9]+$/.test(digitsOnly)) {
    return 'phone';
  }
  
  return null;
};

// Format price without currency symbol
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
};

// Format date and time
export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

// Validate image file size
export const validateImageSize = (file: File, maxSizeMB: number = 10): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

// Validate video file size
export const validateVideoSize = (file: File, maxSizeMB: number = 100): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

// Validate file type
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

// Export logger
export { logger } from './logger';

