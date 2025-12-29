import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { adminService } from '../../../shares/services/adminService';
import type { Category } from '../../../shares/types';

export interface AdminCategoriesState {
  items: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminCategoriesState = {
  items: [],
  loading: false,
  error: null,
};

// Luôn gọi API admin, không cache trong state để tránh dữ liệu cũ
export const fetchAdminCategories = createAsyncThunk<
  Category[],
  { includeDeleted?: boolean } | undefined
>('adminCategories/fetchAll', async (params, { rejectWithValue }) => {
  const response = await adminService.getCategories({
    include_deleted: params?.includeDeleted,
  });
  if (!response.success || !response.data) {
    return rejectWithValue(response.message || 'Không thể tải danh mục (admin)');
  }
  return response.data as Category[];
});

const adminCategoriesSlice = createSlice({
  name: 'adminCategories',
  initialState,
  reducers: {
    setAdminCategories(state, action: PayloadAction<Category[]>) {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAdminCategories.fulfilled,
        (state, action: PayloadAction<Category[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchAdminCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Không thể tải danh mục (admin)';
      });
  },
});

export const { setAdminCategories } = adminCategoriesSlice.actions;
export default adminCategoriesSlice.reducer;


