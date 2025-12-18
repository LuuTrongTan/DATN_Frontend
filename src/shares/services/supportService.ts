import { apiClient } from '../api';
import { ApiResponse, PaginatedResponse } from '../types';

export interface SupportTicket {
  id: number;
  ticket_number: string;
  user_id: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: number | null;
  order_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  order_id?: number;
}

export interface CreateMessageInput {
  message: string;
  is_internal?: boolean;
}

export const supportService = {
  getTickets: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<SupportTicket>>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return apiClient.get(`/support/tickets${query ? `?${query}` : ''}`);
  },

  getTicketById: async (id: number): Promise<ApiResponse<SupportTicket & { messages?: TicketMessage[] }>> => {
    return apiClient.get(`/support/tickets/${id}`);
  },

  createTicket: async (data: CreateTicketInput): Promise<ApiResponse<SupportTicket>> => {
    return apiClient.post('/support/tickets', data);
  },

  getTicketMessages: async (ticketId: number): Promise<ApiResponse<TicketMessage[]>> => {
    return apiClient.get(`/support/tickets/${ticketId}/messages`);
  },

  sendMessage: async (ticketId: number, data: CreateMessageInput): Promise<ApiResponse<TicketMessage>> => {
    return apiClient.post(`/support/tickets/${ticketId}/messages`, data);
  },
};

