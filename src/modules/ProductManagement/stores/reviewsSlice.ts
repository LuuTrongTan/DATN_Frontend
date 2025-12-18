import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { reviewService, CreateReviewInput } from '../../../shares/services/reviewService';
import type { Review } from '../../../shares/types';

export interface ReviewsState {
  productId: number | null;
  items: Review[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  stats: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
  };
}

const initialState: ReviewsState = {
  productId: null,
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
  stats: {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  },
};

export const fetchProductReviews = createAsyncThunk<
  { reviews: Review[]; total: number; productId: number },
  { productId: number; page?: number; limit?: number }
>('reviews/fetchByProduct', async ({ productId, page, limit }, { getState }) => {
  const state = getState() as any;
  const current: ReviewsState = state.reviews || initialState;
  const currentPage = page ?? current.page;
  const currentLimit = limit ?? current.limit;

  const response = await reviewService.getProductReviews(productId, {
    page: currentPage,
    limit: currentLimit,
  });

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Không thể tải đánh giá sản phẩm');
  }

  const data = response.data;
  const reviews = data.data || [];
  const total = data.pagination?.total || 0;

  return { reviews, total, productId };
});

export const createReview = createAsyncThunk<Review, CreateReviewInput>(
  'reviews/create',
  async (payload) => {
    const response = await reviewService.createReview(payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tạo đánh giá');
    }
    return response.data;
  }
);

const computeStats = (reviews: Review[]) => {
  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / totalReviews;

  const distribution: { 5: number; 4: number; 3: number; 2: number; 1: number } = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };
  reviews.forEach((r) => {
    if (distribution[r.rating as 1 | 2 | 3 | 4 | 5] !== undefined) {
      distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
    }
  });

  return {
    averageRating: avgRating,
    totalReviews,
    ratingDistribution: distribution,
  };
};

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductReviews.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        if (action.meta.arg.page) {
          state.page = action.meta.arg.page;
        }
        if (action.meta.arg.limit) {
          state.limit = action.meta.arg.limit;
        }
      })
      .addCase(
        fetchProductReviews.fulfilled,
        (
          state,
          action: PayloadAction<{ reviews: Review[]; total: number; productId: number }>
        ) => {
          state.loading = false;
          state.items = action.payload.reviews;
          state.total = action.payload.total;
          state.productId = action.payload.productId;
          state.stats = computeStats(action.payload.reviews);
        }
      )
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Không thể tải đánh giá sản phẩm';
      })
      .addCase(createReview.fulfilled, (state, action: PayloadAction<Review>) => {
        // Nếu review thuộc product hiện tại và trong trang hiện tại, có thể push vào items
        if (state.productId && action.payload.product_id === state.productId) {
          state.items = [action.payload, ...state.items];
          state.total += 1;
          state.stats = computeStats(state.items);
        }
      });
  },
});

export const { setPage } = reviewsSlice.actions;
export default reviewsSlice.reducer;


