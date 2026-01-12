import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { cartService } from '../../../shares/services/cartService';
import type { CartItem } from '../../../shares/types';
import type { RootState } from '../../../shares/stores';

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null; // Timestamp của lần fetch cuối cùng
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchCart = createAsyncThunk<
  CartItem[],
  void,
  { state: RootState; rejectValue: string }
>('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const response = await cartService.getCart();
    
    if (!response.success) {
      return rejectWithValue(response.message || 'Không thể tải giỏ hàng');
    }
    
    if (!response.data) {
      return [];
    }
    
    const cartData: any = response.data;
    const items = Array.isArray(cartData) ? cartData : cartData.items || [];
    return items as CartItem[];
  } catch (error: any) {
    return rejectWithValue(error.message || 'Lỗi khi tải giỏ hàng');
  }
});

export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ id, quantity }: { id: number; quantity: number }, { dispatch }) => {
    const response = await cartService.updateCartItem(id, quantity);
    if (!response.success) {
      const err: any = new Error(response.message || 'Không thể cập nhật giỏ hàng');
      if (response.error?.code) {
        err.code = response.error.code;
        err.details = response.error.details;
      }
      throw err;
    }
    await (dispatch as any)(fetchCart());
    return;
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async (id: number, { dispatch }) => {
    const response = await cartService.removeFromCart(id);
    if (!response.success) {
      throw new Error(response.message || 'Không thể xóa sản phẩm khỏi giỏ hàng');
    }
    await (dispatch as any)(fetchCart());
    return;
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (data: { product_id: number; variant_id?: number | null; quantity: number }, { dispatch }) => {
    const response = await cartService.addToCart(data);
    if (!response.success) {
      const err: any = new Error(response.message || 'Không thể thêm vào giỏ hàng');
      if (response.error?.code) {
        err.code = response.error.code;
        err.details = response.error.details;
      }
      throw err;
    }
    await (dispatch as any)(fetchCart());
    return;
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
    },
    clearCart(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Không thể tải giỏ hàng';
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.error = action.error.message || 'Không thể cập nhật giỏ hàng';
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.error = action.error.message || 'Không thể xóa sản phẩm khỏi giỏ hàng';
      });
  },
});

export const { setCartItems, clearCart } = cartSlice.actions;
export default cartSlice.reducer;


