import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { productService } from '../../../shares/services/productService';
import { categoryService } from '../../../shares/services/categoryService';
import type { Product, Category } from '../../../shares/types';

export interface ProductsFilters {
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name';
  page: number;
  limit: number;
}

export interface ProductsState {
  items: Product[];
  total: number;
  loading: boolean;
  error: string | null;
  categories: Category[];
  categoriesLoading: boolean;
  filters: ProductsFilters;
  compareProducts: Product[]; // Products for comparison
  compareLoading: boolean;
}

const initialState: ProductsState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  categories: [],
  categoriesLoading: false,
  filters: {
    search: '',
    category_id: undefined,
    min_price: 0,
    max_price: 10_000_000,
    sort: 'newest',
    page: 1,
    limit: 20,
  },
  compareProducts: [],
  compareLoading: false,
};

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async () => {
    // Luôn gọi API để đảm bảo dữ liệu danh mục mới nhất cho user
    const response = await categoryService.getCategories();
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải danh mục');
    }
    return response.data as Category[];
  }
);

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { getState }) => {
    const state = getState() as { products: ProductsState };
    const filters: ProductsFilters = state.products.filters;

    const params: {
      page: number;
      limit: number;
      search?: string;
      category_id?: number;
      min_price?: number;
      max_price?: number;
    } = {
      page: filters.page,
      limit: filters.limit,
    };

    if (filters.search) params.search = filters.search;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.min_price && filters.min_price > 0) params.min_price = filters.min_price;
    if (filters.max_price && filters.max_price < 10_000_000) params.max_price = filters.max_price;

    const response = await productService.getProducts(params);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải sản phẩm');
    }

    let products: Product[] = response.data.data || [];

    switch (filters.sort) {
      case 'price_asc':
        products = [...products].sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        products = [...products].sort((a, b) => b.price - a.price);
        break;
      case 'name':
        products = [...products].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    const total = response.data.pagination?.total || products.length;

    return { products, total };
  }
);

export const fetchProductsByIds = createAsyncThunk(
  'products/fetchByIds',
  async (ids: number[]) => {
    if (ids.length === 0) {
      return [];
    }

    const promises = ids.map((id) => productService.getProductById(id));
    const responses = await Promise.all(promises);

    const products: Product[] = responses
      .filter((res) => res.success === true && res.data !== undefined)
      .map((res) => res.data as Product);

    return products;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.filters.search = action.payload;
      state.filters.page = 1;
    },
    setCategory(state, action: PayloadAction<number | undefined>) {
      state.filters.category_id = action.payload;
      state.filters.page = 1;
    },
    setPriceRange(state, action: PayloadAction<[number, number]>) {
      state.filters.min_price = action.payload[0];
      state.filters.max_price = action.payload[1];
      state.filters.page = 1;
    },
    setSort(state, action: PayloadAction<ProductsFilters['sort']>) {
      state.filters.sort = action.payload;
      state.filters.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.filters.page = action.payload;
    },
    resetFilters(state) {
      state.filters = {
        search: '',
        category_id: undefined,
        min_price: 0,
        max_price: 10_000_000,
        sort: 'newest',
        page: 1,
        limit: 20,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.error = action.error.message || 'Không thể tải danh mục';
      })
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchProducts.fulfilled,
        (state, action: PayloadAction<{ products: Product[]; total: number }>) => {
          state.loading = false;
          state.items = action.payload.products;
          state.total = action.payload.total;
        }
      )
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Không thể tải sản phẩm';
      })
      .addCase(fetchProductsByIds.pending, (state) => {
        state.compareLoading = true;
        state.error = null;
      })
      .addCase(fetchProductsByIds.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.compareLoading = false;
        state.compareProducts = action.payload;
      })
      .addCase(fetchProductsByIds.rejected, (state, action) => {
        state.compareLoading = false;
        state.error = action.error.message || 'Không thể tải sản phẩm';
      });
  },
});

export const {
  setSearch,
  setCategory,
  setPriceRange,
  setSort,
  setPage,
  resetFilters,
} = productsSlice.actions;
export default productsSlice.reducer;


