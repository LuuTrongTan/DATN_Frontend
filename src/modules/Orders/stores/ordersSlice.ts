import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { orderService } from '../../../shares/services/orderService';
import type { Order, ApiResponse, PaginatedResponse } from '../../../shares/types';

export interface OrdersState {
  list: Order[]; // Tất cả orders (cho OrderList)
  recentOrders: Order[]; // Recent orders (cho Home/Dashboard)
  listLoading: boolean;
  recentLoading: boolean;
  listError: string | null;
  byId: Record<number, Order>;
  detailLoading: boolean;
  detailError: string | null;
}

const initialState: OrdersState = {
  list: [],
  recentOrders: [],
  listLoading: false,
  recentLoading: false,
  listError: null,
  byId: {},
  detailLoading: false,
  detailError: null,
};

// Fetch tất cả orders (cho OrderList)
export const fetchOrders = createAsyncThunk('orders/fetchOrders', async () => {
  const response = await orderService.getOrders();
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Không thể tải danh sách đơn hàng');
  }
  // Backend trả về ApiResponse<PaginatedResponse<Order>>
  const paginatedData = response.data as PaginatedResponse<Order>;
  return paginatedData.data || [];
});

// Fetch recent orders (cho Home/Dashboard)
export const fetchRecentOrders = createAsyncThunk(
  'orders/fetchRecentOrders',
  async (limit: number = 5) => {
    const response = await orderService.getOrders({ limit });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải danh sách đơn hàng');
    }
    // Backend trả về ApiResponse<PaginatedResponse<Order>>
    const paginatedData = response.data as PaginatedResponse<Order>;
    return paginatedData.data || [];
  }
);

export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (id: number) => {
  const response = await orderService.getOrderById(id);
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Không thể tải đơn hàng');
  }
  return response.data as Order;
});

export const fetchOrderByNumber = createAsyncThunk(
  'orders/fetchOrderByNumber',
  async (orderNumber: string) => {
    // Tạm dùng getOrders và filter như logic cũ
    const response = await orderService.getOrders({ page: 1, limit: 100 });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải danh sách đơn hàng');
    }
    // Backend trả về ApiResponse<PaginatedResponse<Order>>
    const paginatedData = response.data as PaginatedResponse<Order>;
    const list = paginatedData.data || [];
    const found = list.find((o) => o.order_number === orderNumber);
    if (!found) {
      throw new Error('Không tìm thấy đơn hàng');
    }
    return found;
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders(state, action: PayloadAction<Order[]>) {
      state.list = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.listLoading = false;
        state.list = action.payload;
        // đồng bộ byId
        action.payload.forEach((order: Order) => {
          state.byId[order.id] = order;
        });
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.error.message || 'Không thể tải danh sách đơn hàng';
      })
      .addCase(fetchRecentOrders.pending, (state) => {
        state.recentLoading = true;
      })
      .addCase(fetchRecentOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.recentLoading = false;
        state.recentOrders = action.payload;
        // đồng bộ byId
        action.payload.forEach((order: Order) => {
          state.byId[order.id] = order;
        });
      })
      .addCase(fetchRecentOrders.rejected, (state, action) => {
        state.recentLoading = false;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.detailLoading = false;
        const order = action.payload;
        state.byId[order.id] = order;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.error.message || 'Không thể tải đơn hàng';
      })
      .addCase(fetchOrderByNumber.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchOrderByNumber.fulfilled, (state, action) => {
        state.detailLoading = false;
        const order = action.payload;
        state.byId[order.id] = order;
      })
      .addCase(fetchOrderByNumber.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.error.message || 'Không thể tải đơn hàng';
      });
  },
});

export const { setOrders } = ordersSlice.actions;
export default ordersSlice.reducer;


