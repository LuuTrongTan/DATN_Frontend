import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { adminService } from '../../../shares/services/adminService';
import type { Product, Category } from '../../../shares/types';
import type { RootState } from '../../../shares/stores';

export interface AdminProductsState {
  items: Product[];
  categories: Category[];
  loading: boolean;
  categoriesLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    category_id?: number;
    include_deleted?: boolean;
  };
}

const initialState: AdminProductsState = {
  items: [],
  categories: [],
  loading: false,
  categoriesLoading: false,
  error: null,
  filters: {
    search: '',
    category_id: undefined,
    include_deleted: false, // Mặc định không hiển thị deleted products
  },
};

export const fetchAdminCategories = createAsyncThunk<
  Category[],
  void,
  { rejectValue: string }
>('adminProducts/fetchCategories', async (_, { rejectWithValue }) => {
  const response = await adminService.getCategories({ include_deleted: true });
  if (!response.success || !response.data) {
    return rejectWithValue(response.message || 'Không thể tải danh mục (admin)');
  }
  return response.data as Category[];
});

interface FetchAdminProductsParams {
  search?: string;
  category_id?: number;
  include_deleted?: boolean;
  limit?: number;
}

export const fetchAdminProducts = createAsyncThunk<
  Product[],
  FetchAdminProductsParams | undefined,
  { state: RootState; rejectValue: string }
>('adminProducts/fetchProducts', async (params, { getState, rejectWithValue }) => {
  const state = getState();
  const filters = state.adminProducts.filters;

  const requestParams: {
    search?: string;
    category_id?: number;
    include_deleted?: boolean;
    limit: number;
  } = {
    // Ưu tiên search từ params, nếu không có thì dùng filters.search; nếu chuỗi rỗng thì để undefined
    search: (params?.search ?? filters.search) || undefined,
    category_id:
      params?.category_id !== undefined ? params.category_id : filters.category_id,
    include_deleted: params?.include_deleted !== undefined ? params.include_deleted : filters.include_deleted,
    limit: params?.limit ?? 100,
  };

  try {
    console.log('[AdminProducts] Fetching products with params:', requestParams);
    
    const response = await adminService.getAdminProducts({
      search: requestParams.search,
      category_id: requestParams.category_id,
      include_deleted: requestParams.include_deleted,
      limit: requestParams.limit,
    });
    
    // Log để debug
    console.log('[AdminProducts] API Response:', {
      success: response?.success,
      hasData: !!response?.data,
      dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
      dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A',
      message: response?.message,
      fullResponse: response,
    });

    if (!response || !response.success) {
      console.error('[AdminProducts] API Error:', response);
      return rejectWithValue(response?.message || 'Không thể tải sản phẩm (admin)');
    }

    if (!response.data) {
      console.warn('[AdminProducts] No data in response');
      return [];
    }

    // Đảm bảo data là mảng
    const products = Array.isArray(response.data) ? response.data : [];
    console.log('[AdminProducts] Products fetched:', products.length);
    return products;
  } catch (error: any) {
    console.error('[AdminProducts] Fetch error:', error);
    return rejectWithValue(error?.message || 'Lỗi khi tải sản phẩm');
  }
});

const adminProductsSlice = createSlice({
  name: 'adminProducts',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.filters.search = action.payload;
    },
    setCategory(state, action: PayloadAction<number | undefined>) {
      state.filters.category_id = action.payload;
    },
    setIncludeDeleted(state, action: PayloadAction<boolean>) {
      state.filters.include_deleted = action.payload;
    },
    resetFilters(state) {
      state.filters = {
        search: '',
        category_id: undefined,
        include_deleted: false,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminCategories.pending, (state) => {
        state.categoriesLoading = true;
      })
      .addCase(fetchAdminCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchAdminCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.error = action.error.message || 'Không thể tải danh mục';
      })
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
        console.log('[AdminProducts] State updated with products:', state.items.length);
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || action.payload || 'Không thể tải sản phẩm';
        console.error('[AdminProducts] Fetch rejected:', state.error);
      });
  },
});

export const { setSearch, setCategory, setIncludeDeleted, resetFilters } = adminProductsSlice.actions;
export default adminProductsSlice.reducer;

