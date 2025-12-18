import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { productService } from '../../../shares/services/productService';
import { categoryService } from '../../../shares/services/categoryService';
import type { Product, Category } from '../../../shares/types';

export interface AdminProductsState {
  items: Product[];
  categories: Category[];
  loading: boolean;
  categoriesLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    category_id?: number;
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
  },
};

export const fetchAdminCategories = createAsyncThunk('adminProducts/fetchCategories', async () => {
  const response = await categoryService.getCategories();
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Không thể tải danh mục');
  }
  return response.data as Category[];
});

export const fetchAdminProducts = createAsyncThunk(
  'adminProducts/fetchProducts',
  async (params: { search?: string; category_id?: number; limit?: number }, { getState }) => {
    const state = getState() as { adminProducts?: { filters?: { search?: string; category_id?: number } } };
    const filters = state.adminProducts?.filters || {};

    const requestParams: {
      search?: string;
      category_id?: number;
      limit: number;
    } = {
      search: params.search || filters.search || undefined,
      category_id: params.category_id !== undefined ? params.category_id : filters.category_id,
      limit: params.limit || 100,
    };

    const response = await productService.getProducts(requestParams);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải sản phẩm');
    }

    return response.data.data || [];
  }
);

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
    resetFilters(state) {
      state.filters = {
        search: '',
        category_id: undefined,
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
        state.items = action.payload;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Không thể tải sản phẩm';
      });
  },
});

export const { setSearch, setCategory, resetFilters } = adminProductsSlice.actions;
export default adminProductsSlice.reducer;

