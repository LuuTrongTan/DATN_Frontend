import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { wishlistService, WishlistItem } from '../../../shares/services/wishlistService';
import { cartService } from '../../../shares/services/cartService';

export interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  error: string | null;
  checkedProducts: Record<number, boolean>; // Cache để lưu trạng thái wishlist của từng product
  lastFetched: number | null; // Timestamp của lần fetch cuối cùng
}

const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
  checkedProducts: {},
  lastFetched: null,
};

export const fetchWishlist = createAsyncThunk<
  WishlistItem[],
  void,
  { state: { wishlist: WishlistState } }
>('wishlist/fetchWishlist', async (_, { rejectWithValue }) => {
  try {
    console.log('Fetching wishlist from API...');
    const response = await wishlistService.getWishlist();
    console.log('Wishlist API response:', response);
    
    if (!response.success) {
      console.error('Wishlist API error:', response.message);
      return rejectWithValue(response.message || 'Không thể tải danh sách yêu thích');
    }
    
    if (!response.data) {
      console.warn('Wishlist API returned no data');
      return [];
    }
    
    console.log('Wishlist items received:', response.data);
    return response.data as WishlistItem[];
  } catch (error: any) {
    console.error('Wishlist fetch exception:', error);
    return rejectWithValue(error.message || 'Lỗi khi tải danh sách yêu thích');
  }
});

export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async (productId: number, { dispatch }) => {
    const response = await wishlistService.removeFromWishlist(productId);
    if (!response.success) {
      throw new Error(response.message || 'Không thể xóa khỏi danh sách yêu thích');
    }
    await dispatch(fetchWishlist());
    return;
  }
);

export const addWishlistItemToCart = createAsyncThunk(
  'wishlist/addToCart',
  async (productId: number) => {
    const response = await cartService.addToCart({
      product_id: productId,
      quantity: 1,
    });
    if (!response.success) {
      throw new Error(response.message || 'Không thể thêm vào giỏ hàng');
    }
    return;
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/add',
  async (productId: number, { dispatch }) => {
    const response = await wishlistService.addToWishlist(productId);
    if (!response.success) {
      throw new Error(response.message || 'Không thể thêm vào danh sách yêu thích');
    }
    await dispatch(fetchWishlist());
    return productId;
  }
);

export const checkWishlist = createAsyncThunk(
  'wishlist/check',
  async (productId: number) => {
    const response = await wishlistService.checkWishlist(productId);
    if (!response.success || !response.data) {
      return false;
    }
    return response.data.isInWishlist;
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlistItems(state, action: PayloadAction<WishlistItem[]>) {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Wishlist fetch pending...');
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
        console.log('Wishlist fetch fulfilled, items count:', action.payload.length);
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Không thể tải danh sách yêu thích';
        console.error('Wishlist fetch rejected:', action.error);
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.error = action.error.message || 'Không thể xóa khỏi danh sách yêu thích';
      })
      .addCase(addWishlistItemToCart.rejected, (state, action) => {
        state.error = action.error.message || 'Không thể thêm vào giỏ hàng';
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.checkedProducts[action.payload] = true;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        // Khi xóa khỏi wishlist, cập nhật checkedProducts
        const productId = action.meta.arg;
        state.checkedProducts[productId] = false;
      })
      .addCase(checkWishlist.fulfilled, (state, action) => {
        const productId = action.meta.arg;
        state.checkedProducts[productId] = action.payload;
      });
  },
});

export const { setWishlistItems } = wishlistSlice.actions;
export default wishlistSlice.reducer;


