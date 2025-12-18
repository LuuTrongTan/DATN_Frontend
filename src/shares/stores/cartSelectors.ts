import { createSelector } from 'reselect';
import type { RootState } from '../../app/store';

// Base selector - không memoized
const selectCartState = (state: RootState) => state.cart;
const selectCartItems = (state: RootState) => state.cart.items;

// Memoized selectors - chỉ tính toán lại khi cart.items thay đổi
export const selectCartCount = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, item) => sum + (item.quantity || 1), 0)
);

export const selectCartTotal = createSelector(
  [selectCartItems],
  (items) =>
    items.reduce((total, item) => {
      const basePrice = item.product?.price || 0;
      const priceAdjustment = item.variant?.price_adjustment || 0;
      const finalPrice = basePrice + priceAdjustment;
      return total + finalPrice * (item.quantity || 1);
    }, 0)
);

// Selector để lấy cart items (export lại để tương thích)
export { selectCartItems };


