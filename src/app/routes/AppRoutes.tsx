import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout, AdminLayout } from '../../shares/components/layouts';
import Loading from '../../shares/components/Loading';
import { ProtectedRoute, RoleProtectedRoute, PublicRoute } from './RouteGuards';
import { useAuth } from '../../shares/contexts/AuthContext';

// Auth
const Login = lazy(() => import('../../modules/Auth/Login'));
const Register = lazy(() => import('../../modules/Auth/Register'));
const ForgotPassword = lazy(() => import('../../modules/Auth/ForgotPassword'));
const VerifyAccount = lazy(() => import('../../modules/Auth/VerifyAccount'));

// Main
const Home = lazy(() => import('../../modules/Home/Home'));

// ProductManagement
const ProductList = lazy(() => import('../../modules/ProductManagement/List/ProductList'));
const ProductDetail = lazy(() => import('../../modules/ProductManagement/Detail/ProductDetail'));
const ProductSearch = lazy(() => import('../../modules/ProductManagement/Search/ProductSearch'));
const ProductCompare = lazy(() => import('../../modules/ProductManagement/Compare/ProductCompare'));
const Cart = lazy(() => import('../../modules/ProductManagement/CartPages/Cart'));
const Wishlist = lazy(() => import('../../modules/ProductManagement/WishlistPages/Wishlist'));
const NotificationsPage = lazy(() => import('../../modules/Notifications/NotificationsPage'));

// Profile
const Profile = lazy(() => import('../../modules/Profile/Account/Profile'));
const AddressManagement = lazy(() => import('../../modules/Profile/Addresses/AddressManagement'));

// Orders
const OrderList = lazy(() => import('../../modules/Orders/List/OrderList'));
const OrderDetail = lazy(() => import('../../modules/Orders/Detail/OrderDetail'));
const OrderTracking = lazy(() => import('../../modules/Orders/Tracking/OrderTracking'));
const Checkout = lazy(() => import('../../modules/Orders/CheckoutPages/Checkout'));
const PlaceOrder = lazy(() => import('../../modules/Orders/CheckoutPages/PlaceOrder'));

// Support flows (FAQ/Support) đã bỏ theo yêu cầu => không import nữa

// Admin
const AdminDashboard = lazy(() => import('../../modules/Admin/Dashboard/AdminDashboard'));
const AdminProductManagement = lazy(
  () => import('../../modules/Admin/Products/AdminProductManagement')
);
const ProductForm = lazy(() => import('../../modules/Admin/Products/ProductForm'));
const CategoryManagement = lazy(() => import('../../modules/Admin/Categories/CategoryManagement'));
const TagManagement = lazy(() => import('../../modules/Admin/Tags/TagManagement'));
const AdminOrderManagement = lazy(() => import('../../modules/Admin/Orders/AdminOrderManagement'));
const AdminAccountsManagement = lazy(
  () => import('../../modules/Admin/Users/AdminAccountsManagement')
);

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/verify"
          element={
            <PublicRoute>
              <VerifyAccount />
            </PublicRoute>
          }
        />

        {/* Admin Routes - layout cha cố định */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'staff']}>
              <AdminLayout />
            </RoleProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProductManagement />} />
          <Route path="/admin/products/new" element={<ProductForm />} />
          <Route path="/admin/products/:id/edit" element={<ProductForm />} />
          <Route path="/admin/categories" element={<CategoryManagement />} />
          <Route path="/admin/tags" element={<TagManagement />} />
          <Route path="/admin/orders" element={<AdminOrderManagement />} />
          <Route
            path="/admin/accounts"
            element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <AdminAccountsManagement />
              </RoleProtectedRoute>
            }
          />
        </Route>

        {/* Public Main Routes - không yêu cầu đăng nhập */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />

          <Route path="/products" element={<ProductList />} />
          <Route path="/products/search" element={<ProductSearch />} />
          <Route path="/products/compare" element={<ProductCompare />} />
          <Route path="/products/:id" element={<ProductDetail />} />
        </Route>

        {/* Protected Routes - Main layout cố định, yêu cầu đăng nhập */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/place-order" element={<PlaceOrder />} />

          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/orders/:id/tracking" element={<OrderTracking />} />
          <Route path="/orders/tracking/:orderNumber" element={<OrderTracking />} />

          {/* FAQ / Support routes đã bỏ theo yêu cầu */}

          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/addresses" element={<AddressManagement />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Default redirect: tùy theo role để vào đúng home + sidebar */}
        <Route
          path="/"
          element={
            user
              ? user.role === 'admin' || user.role === 'staff'
                ? <Navigate to="/admin/dashboard" replace />
                : <Navigate to="/home" replace />
              : <Navigate to="/home" replace />
          }
        />
        <Route
          path="*"
          element={
            user
              ? user.role === 'admin' || user.role === 'staff'
                ? <Navigate to="/admin/dashboard" replace />
                : <Navigate to="/home" replace />
              : <Navigate to="/home" replace />
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;


