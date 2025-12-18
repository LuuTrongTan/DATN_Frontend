import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { cartService } from '../../../shares/services/cartService';
import type { CartItem } from '../../../shares/types';

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCart = createAsyncThunk('cart/fetchCart', async () => {
  const response = await cartService.getCart();
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Không thể tải giỏ hàng');
  }
  const cartData: any = response.data;
  const items = Array.isArray(cartData) ? cartData : cartData.items || [];
  return items as CartItem[];
});

export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ id, quantity }: { id: number; quantity: number }, { dispatch }) => {
    const response = await cartService.updateCartItem(id, quantity);
    if (!response.success) {
      throw new Error(response.message || 'Không thể cập nhật giỏ hàng');
    }
    await dispatch(fetchCart());
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
    await dispatch(fetchCart());
    return;
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (data: { product_id: number; variant_id?: number | null; quantity: number }, { dispatch }) => {
    const response = await cartService.addToCart(data);
    if (!response.success) {
      throw new Error(response.message || 'Không thể thêm vào giỏ hàng');
    }
    await dispatch(fetchCart());
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


