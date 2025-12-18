# Phân Tích State Management - Redux vs Local State

## ✅ State Đang Dùng Redux (Đúng)

### 1. Server State (Data từ API)
- ✅ **Cart** - `cartSlice` - Cần share giữa nhiều components
- ✅ **Wishlist** - `wishlistSlice` - Cần share giữa nhiều components
- ✅ **Orders** - `ordersSlice` - Cần share giữa OrderList, Dashboard, Home
- ✅ **Products** - `productsSlice` - Cần share giữa ProductList, ProductSearch, Home
- ✅ **Categories** - `productsSlice.categories` - Cần share giữa nhiều components
- ✅ **Reviews** - `reviewsSlice` - Cần share giữa ProductDetail, ProductReviews
- ✅ **Admin Products** - `adminProductsSlice` - Cần share trong admin panel

**Lý do:** Đây là server state, cần cache và share giữa nhiều components.

---

## ✅ State Đang Dùng Local (Đúng)

### 1. UI State (Local Component State)
- ✅ **Modal visibility** - `useState` - Chỉ dùng trong component đó
- ✅ **Form state** - `useState` hoặc `Form.useForm()` - Chỉ dùng trong form
- ✅ **Dropdown/Select state** - `useState` - Chỉ dùng trong component đó
- ✅ **Loading states** - `useState` - Chỉ dùng trong component đó (trừ khi cần share)
- ✅ **Filtered data** - `useState` - Computed từ Redux state, không cần global

**Ví dụ:**
```tsx
// ✅ Đúng - Local state
const [isModalVisible, setIsModalVisible] = useState(false);
const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
const [form] = Form.useForm();
```

### 2. Computed/Derived State
- ✅ **Stats** - `useState` + `useEffect` - Computed từ Redux state
  - `Dashboard.tsx`: `stats` computed từ `cartItems`, `orders`, `products`
  - `Home.tsx`: `stats` computed từ `cartItems`, `orders`

**Ví dụ:**
```tsx
// ✅ Đúng - Computed state
const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0 });
const { list: orders } = useAppSelector((state) => state.orders);

useEffect(() => {
  setStats({
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + order.total_amount, 0),
  });
}, [orders]);
```

### 3. Form Draft State
- ✅ **ProductForm** - `useState` cho variants, images - Chỉ dùng trong form
- ✅ **AddressManagement** - `useState` cho addresses - CRUD đơn giản, ít share

**Ví dụ:**
```tsx
// ✅ Đúng - Form draft state
const [variants, setVariants] = useState<ProductVariant[]>([]);
const [imageItems, setImageItems] = useState<ImageItem[]>([]);
```

---

## ⚠️ Cần Kiểm Tra

### 1. Addresses trong Checkout
**Hiện tại:** `useState` trong `Checkout.tsx`
**Có nên global hóa không?**
- ❌ **Không cần** - Chỉ dùng trong Checkout, không share với component khác
- ✅ **Giữ nguyên** - Local state là đúng

### 2. Filtered Categories trong CategoryManagement
**Hiện tại:** `useState` cho `filteredCategories`
**Có nên global hóa không?**
- ❌ **Không cần** - Đây là UI filter, computed từ Redux categories
- ✅ **Giữ nguyên** - Local state là đúng

---

## 📊 Tổng Kết

### State Đang Dùng Redux: **7 slices**
1. ✅ cartSlice
2. ✅ wishlistSlice
3. ✅ ordersSlice
4. ✅ productsSlice
5. ✅ reviewsSlice
6. ✅ adminOrdersSlice
7. ✅ adminProductsSlice

**Tất cả đều là server state cần share** ✅

### State Đang Dùng Local: **Tất cả đều hợp lý**
- UI state (modals, forms, dropdowns) ✅
- Computed state (stats, filtered data) ✅
- Form draft state (variants, images) ✅

---

## ✅ Kết Luận

**Không có state nào đang được global hóa không cần thiết!**

Tất cả state đang được quản lý đúng:
- **Server state** → Redux (cần share, cache)
- **UI state** → Local useState (chỉ dùng trong component)
- **Computed state** → Local useState + useEffect (derived từ Redux)

**Code đang tuân thủ best practices:**
- ✅ Chỉ global hóa state cần share
- ✅ Giữ local state cho UI và form
- ✅ Không over-engineering

