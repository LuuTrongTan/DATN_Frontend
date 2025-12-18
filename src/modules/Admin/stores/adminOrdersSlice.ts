import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { adminService, UpdateOrderStatusRequest } from '../../../shares/services/adminService';
import { orderService } from '../../../shares/services/orderService';
import type { Order } from '../../../shares/types';

export interface AdminOrdersFilters {
  status?: string;
  paymentMethod?: string;
  search?: string;
}

export interface AdminOrdersState {
  items: Order[];
  loading: boolean;
  error: string | null;
  filters: AdminOrdersFilters;
}

const initialState: AdminOrdersState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    status: undefined,
    paymentMethod: undefined,
    search: '',
  },
};

export const fetchAdminOrders = createAsyncThunk<Order[], void, { state: any }>(
  'adminOrders/fetchAll',
  async (_, { getState }) => {
    const state = getState() as { adminOrders: AdminOrdersState };
    const { status, paymentMethod, search } = state.adminOrders?.filters || {};

    const response = await adminService.getAllOrders({
      status: status || undefined,
      limit: 100,
    });

    let orders: Order[] = response.orders || [];

    if (paymentMethod) {
      orders = orders.filter((o) => o.payment_method === paymentMethod);
    }

    if (search) {
      const keyword = search.toLowerCase();
      orders = orders.filter((o) => o.order_number.toLowerCase().includes(keyword));
    }

    return orders;
  }
);

export const fetchAdminOrderById = createAsyncThunk<Order, number>(
  'adminOrders/fetchById',
  async (orderId: number) => {
    const response = await orderService.getOrderById(orderId);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải chi tiết đơn hàng');
    }
    return response.data as Order;
  }
);

export const updateAdminOrderStatus = createAsyncThunk<
  Order,
  { orderId: number; data: UpdateOrderStatusRequest }
>('adminOrders/updateStatus', async ({ orderId, data }) => {
  const response = await adminService.updateOrderStatus(orderId, data);
  if (!response || !response.order) {
    // API hiện trả về gì? Trong code cũ không dùng response, nên chỉ refetch lại
    const detail = await orderService.getOrderById(orderId);
    if (!detail.success || !detail.data) {
      throw new Error(detail.message || 'Không thể tải lại đơn hàng sau khi cập nhật');
    }
    return detail.data as Order;
  }
  return response.order as Order;
});

const adminOrdersSlice = createSlice({
  name: 'adminOrders',
  initialState,
  reducers: {
    setStatusFilter(state, action: PayloadAction<string | undefined>) {
      state.filters.status = action.payload || undefined;
    },
    setPaymentMethodFilter(state, action: PayloadAction<string | undefined>) {
      state.filters.paymentMethod = action.payload || undefined;
    },
    setSearchFilter(state, action: PayloadAction<string>) {
      state.filters.search = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Không thể tải danh sách đơn hàng';
      })
      .addCase(updateAdminOrderStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAdminOrderStatus.fulfilled, (state, action: PayloadAction<Order>) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.items.findIndex((o) => o.id === updated.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updated };
        } else {
          state.items.unshift(updated);
        }
      })
      .addCase(updateAdminOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Không thể cập nhật đơn hàng';
      });
  },
});

export const { setStatusFilter, setPaymentMethodFilter, setSearchFilter } =
  adminOrdersSlice.actions;

export default adminOrdersSlice.reducer;



