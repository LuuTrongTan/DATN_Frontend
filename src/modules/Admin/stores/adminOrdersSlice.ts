import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { adminService, UpdateOrderStatusRequest } from '../../../shares/services/adminService';
import { orderService } from '../../../shares/services/orderService';
import type { Order } from '../../../shares/types';
import type { RootState } from '../../../shares/stores';

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

export const fetchAdminOrders = createAsyncThunk<
  Order[],
  void,
  { state: RootState; rejectValue: string }
>('adminOrders/fetchAll', async (_, { getState, rejectWithValue }) => {
  const state = getState();

  // Removed loading check to ensure API call
  const { status, paymentMethod, search } = state.adminOrders.filters;

  try {
    console.log('Fetching admin orders from API...');
    const requestParams: any = {
      limit: 100,
    };
    // Chỉ thêm status nếu có giá trị (không phải undefined hoặc empty string)
    if (status) {
      requestParams.status = status;
    }
    
    const response = await adminService.getAllOrders(requestParams);
    console.log('Admin orders API response:', response);

    if (!response.success) {
      console.error('Admin orders API error:', response.message);
      return rejectWithValue(response.message || 'Không thể tải danh sách đơn hàng');
    }

    // Backend trả về PaginatedResponse: { data: Order[], pagination: {...} }
    let orders: Order[] = [];
    if (response.data) {
      if (Array.isArray(response.data)) {
        orders = response.data as Order[];
      } else if ('data' in response.data && Array.isArray((response.data as any).data)) {
        orders = (response.data as any).data as Order[];
      } else if ('orders' in response.data && Array.isArray((response.data as any).orders)) {
        orders = (response.data as any).orders as Order[];
      }
    }

    console.log('Admin orders received:', orders.length);

    // Filter by payment method
    if (paymentMethod) {
      orders = orders.filter((o) => o.payment_method === paymentMethod);
    }

    // Filter by search
    if (search) {
      const keyword = search.toLowerCase();
      orders = orders.filter((o) => 
        o.order_number?.toLowerCase().includes(keyword) ||
        o.customer_name?.toLowerCase().includes(keyword) ||
        o.customer_phone?.includes(keyword)
      );
    }

    return orders;
  } catch (error: any) {
    console.error('Error in fetchAdminOrders thunk:', error);
    return rejectWithValue(error.message || 'Lỗi khi tải danh sách đơn hàng');
  }
});

export const fetchAdminOrderById = createAsyncThunk<
  Order,
  number,
  { rejectValue: string }
>('adminOrders/fetchById', async (orderId: number, { rejectWithValue }) => {
  const response = await orderService.getOrderById(orderId);
  if (!response.success || !response.data) {
    return rejectWithValue(response.message || 'Không thể tải chi tiết đơn hàng');
  }
  return response.data as Order;
});

export const updateAdminOrderStatus = createAsyncThunk<
  Order,
  { orderId: number; data: UpdateOrderStatusRequest },
  { rejectValue: string }
>('adminOrders/updateStatus', async ({ orderId, data }, { rejectWithValue }) => {
  try {
    console.log('Updating order status:', { orderId, data });
    const response = await adminService.updateOrderStatus(orderId, data);
    console.log('Update order status API response:', response);

    if (!response.success) {
      console.error('Update order status API error:', response.message);
      return rejectWithValue(response.message || 'Không thể cập nhật trạng thái đơn hàng');
    }

    // Backend trả về { order: Order } hoặc Order trực tiếp
    let order: Order;
    if (response.data) {
      if ('order' in response.data) {
        order = (response.data as any).order as Order;
      } else if (Array.isArray(response.data)) {
        // Nếu là array, lấy phần tử đầu tiên (không nên xảy ra)
        order = response.data[0] as Order;
      } else {
        order = response.data as Order;
      }
    } else {
      // Fallback: refetch order
      console.log('No order in response, refetching...');
      const detail = await orderService.getOrderById(orderId);
      if (!detail.success || !detail.data) {
        return rejectWithValue(detail.message || 'Không thể tải lại đơn hàng sau khi cập nhật');
      }
      if ('order' in detail.data) {
        order = (detail.data as any).order as Order;
      } else {
        order = detail.data as Order;
      }
    }

    console.log('Order updated successfully:', order);
    return order;
  } catch (error: any) {
    console.error('Error in updateAdminOrderStatus thunk:', error);
    return rejectWithValue(error.message || 'Lỗi khi cập nhật trạng thái đơn hàng');
  }
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
        console.log('Admin orders fetch pending...');
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.loading = false;
        state.items = action.payload;
        console.log('Admin orders fetch fulfilled, orders count:', action.payload.length);
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        const errorMessage = typeof action.payload === 'string' ? action.payload : action.error.message || 'Không thể tải danh sách đơn hàng';
        state.error = errorMessage;
        console.error('Admin orders fetch rejected:', action.error, action.payload);
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



