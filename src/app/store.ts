import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import cartReducer from '../modules/ProductManagement/stores/cartSlice';
import wishlistReducer from '../modules/ProductManagement/stores/wishlistSlice';
import ordersReducer from '../modules/Orders/stores/ordersSlice';
import productsReducer from '../modules/ProductManagement/stores/productsSlice';
import reviewsReducer from '../modules/ProductManagement/stores/reviewsSlice';
import adminOrdersReducer from '../modules/Admin/stores/adminOrdersSlice';
import adminProductsReducer from '../modules/Admin/stores/adminProductsSlice';

// TODO: import and add your slices here, for example:
// import cartReducer from '../modules/ProductManagement/stores/cartSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    orders: ordersReducer,
    products: productsReducer,
    reviews: reviewsReducer,
    adminOrders: adminOrdersReducer,
    adminProducts: adminProductsReducer,
  },
  // Bạn có thể cấu hình thêm middleware, devTools... nếu cần
});

// Infer types từ store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks dùng trong toàn app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;


