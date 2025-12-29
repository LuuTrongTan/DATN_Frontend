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
  lastFetched: number | null; // Timestamp của lần fetch list cuối cùng
  recentLastFetched: number | null; // Timestamp của lần fetch recent cuối cùng
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
  lastFetched: null,
  recentLastFetched: null,
};

// Fetch tất cả orders (cho OrderList)
export const fetchOrders = createAsyncThunk<
  Order[],
  void,
  { state: { orders: OrdersState } }
>('orders/fetchOrders', async (_, { rejectWithValue }) => {
  try {
    console.log('Fetching orders from API...');
    const response = await orderService.getOrders();
    console.log('Orders API response:', response);
    
    if (!response.success) {
      console.error('Orders API error:', response.message);
      return rejectWithValue(response.message || 'Không thể tải danh sách đơn hàng');
    }
    
    if (!response.data) {
      console.warn('Orders API returned no data');
      return [];
    }
    
    // Backend trả về { orders: Order[] } hoặc PaginatedResponse<Order>
    // Kiểm tra cả 2 format để tương thích
    let orders: Order[] = [];
    if ('orders' in response.data) {
      // Format: { orders: Order[] }
      orders = (response.data as any).orders || [];
    } else if ('data' in response.data) {
      // Format: PaginatedResponse<Order> { data: Order[], pagination: {...} }
      const paginatedData = response.data as PaginatedResponse<Order>;
      orders = paginatedData.data || [];
    } else if (Array.isArray(response.data)) {
      // Format: Order[] (direct array)
      orders = response.data as Order[];
    }
    
    console.log('Orders received:', orders);
    return orders;
  } catch (error: any) {
    console.error('Orders fetch exception:', error);
    return rejectWithValue(error.message || 'Lỗi khi tải danh sách đơn hàng');
  }
});

// Fetch recent orders (cho Home/Dashboard)
export const fetchRecentOrders = createAsyncThunk<
  Order[],
  number,
  { state: { orders: OrdersState } }
>(
  'orders/fetchRecentOrders',
  async (limit: number = 5, { getState }) => {
    const state = getState().orders;
    
    // Nếu đang loading thì không gọi lại
    if (state.recentLoading) {
      return state.recentOrders;
    }
    
    // Nếu đã có data và chưa quá 60 giây thì không gọi lại
    const CACHE_DURATION = 60000; // 60 giây
    if (state.recentOrders.length > 0 && state.recentLastFetched && Date.now() - state.recentLastFetched < CACHE_DURATION) {
      return state.recentOrders;
    }
    
    const response = await orderService.getOrders({ limit });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải danh sách đơn hàng');
    }
    // Backend trả về ApiResponse<PaginatedResponse<Order>>
    const paginatedData = response.data as PaginatedResponse<Order>;
    return paginatedData.data || [];
  }
);

export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (id: number, { rejectWithValue }) => {
  try {
    console.log('Fetching order by ID from API:', id);
    const response = await orderService.getOrderById(id);
    console.log('Order by ID API response:', response);
    
    if (!response.success) {
      console.error('Order by ID API error:', response.message);
      return rejectWithValue(response.message || 'Không thể tải đơn hàng');
    }
    
    if (!response.data) {
      console.warn('Order by ID API returned no data');
      return rejectWithValue('Không tìm thấy đơn hàng');
    }
    
    // Backend trả về { order: Order } hoặc Order trực tiếp
    let order: Order;
    if ('order' in response.data) {
      order = (response.data as any).order as Order;
    } else {
      order = response.data as Order;
    }
    
    console.log('Order received:', order);
    return order;
  } catch (error: any) {
    console.error('Order by ID fetch exception:', error);
    return rejectWithValue(error.message || 'Lỗi khi tải đơn hàng');
  }
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
        console.log('Orders fetch pending...');
      })
      .addCase(fetchOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.listLoading = false;
        state.list = action.payload;
        state.lastFetched = Date.now();
        // đồng bộ byId
        action.payload.forEach((order: Order) => {
          state.byId[order.id] = order;
        });
        console.log('Orders fetch fulfilled, orders count:', action.payload.length);
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.error.message || 'Không thể tải danh sách đơn hàng';
        console.error('Orders fetch rejected:', action.error);
      })
      .addCase(fetchRecentOrders.pending, (state) => {
        state.recentLoading = true;
      })
      .addCase(fetchRecentOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.recentLoading = false;
        state.recentOrders = action.payload;
        state.recentLastFetched = Date.now();
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
        console.log('Order by ID fetch pending...');
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.detailLoading = false;
        const order = action.payload;
        state.byId[order.id] = order;
        console.log('Order by ID fetch fulfilled, order:', order);
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.detailLoading = false;
        const errorMessage = typeof action.payload === 'string' ? action.payload : action.error.message || 'Không thể tải đơn hàng';
        state.detailError = errorMessage;
        console.error('Order by ID fetch rejected:', action.error, action.payload);
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


