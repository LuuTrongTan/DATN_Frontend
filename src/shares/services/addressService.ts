import { apiClient } from '../api';
import { ApiResponse } from '../types';

export interface UserAddress {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street_address: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressInput {
  full_name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street_address: string;
  is_default?: boolean;
}

export interface UpdateAddressInput {
  full_name?: string;
  phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  street_address?: string;
  is_default?: boolean;
}

export const addressService = {
  getAddresses: async (): Promise<ApiResponse<UserAddress[]>> => {
    return apiClient.get('/addresses');
  },

  getAddressById: async (id: number): Promise<ApiResponse<UserAddress>> => {
    return apiClient.get(`/addresses/${id}`);
  },

  createAddress: async (data: CreateAddressInput): Promise<ApiResponse<UserAddress>> => {
    return apiClient.post('/addresses', data);
  },

  updateAddress: async (id: number, data: UpdateAddressInput): Promise<ApiResponse<UserAddress>> => {
    return apiClient.put(`/addresses/${id}`, data);
  },

  deleteAddress: async (id: number): Promise<ApiResponse> => {
    return apiClient.delete(`/addresses/${id}`);
  },
};

