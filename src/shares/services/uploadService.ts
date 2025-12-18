/**
 * Upload Service - Gửi file lên Backend để upload lên Cloudflare
 */
import { API_BASE_URL, getAuthToken } from '../api';

interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    fileName: string;
    mimeType: string;
  };
}

interface MultipleUploadResponse {
  success: boolean;
  data: {
    urls: string[];
    count: number;
  };
}

/**
 * Upload single file to backend
 * @param file - File object to upload
 * @returns Promise with uploaded URL
 */
export const uploadFile = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Get auth token
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload/single`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    const data: UploadResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.data?.url ? 'Upload failed' : (data as any).message || 'Upload failed');
    }

    return data.data.url;
  } catch (error: any) {
    console.error('Error uploading file:', error);
    throw new Error(error.message || 'Failed to upload file');
  }
};

/**
 * Upload multiple files to backend
 * @param files - Array of File objects to upload
 * @returns Promise with array of uploaded URLs
 */
export const uploadMultipleFiles = async (files: File[]): Promise<string[]> => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    // Get auth token
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload/multiple`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    const data: MultipleUploadResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error((data as any).message || 'Upload failed');
    }

    return data.data.urls;
  } catch (error: any) {
    console.error('Error uploading files:', error);
    throw new Error(error.message || 'Failed to upload files');
  }
};

export default {
  uploadFile,
  uploadMultipleFiles,
};

