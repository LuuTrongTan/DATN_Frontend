import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout, AdminLayout } from '../../shares/components/layouts';
import Loading from '../../shares/components/Loading';
import { ProtectedRoute, RoleProtectedRoute, PublicRoute } from './RouteGuards';

// Auth
const Login = lazy(() => import('../../modules/Auth/Login'));
const Register = lazy(() => import('../../modules/Auth/Register'));
const ForgotPassword = lazy(() => import('../../modules/Auth/ForgotPassword'));
const VerifyAccount = lazy(() => import('../../modules/Auth/VerifyAccount'));

// Main
const Dashboard = lazy(() => import('../../modules/Dashboard/Dashboard'));
const Home = lazy(() => import('../../modules/Home/Home'));

// ProductManagement
const ProductList = lazy(() => import('../../modules/ProductManagement/List/ProductList'));
const ProductDetail = lazy(() => import('../../modules/ProductManagement/Detail/ProductDetail'));
const ProductSearch = lazy(() => import('../../modules/ProductManagement/Search/ProductSearch'));
const ProductCompare = lazy(() => import('../../modules/ProductManagement/Compare/ProductCompare'));
const ProductReviews = lazy(() => import('../../modules/ProductManagement/Reviews/ProductReviews'));
const Cart = lazy(() => import('../../modules/ProductManagement/CartPages/Cart'));
const Wishlist = lazy(() => import('../../modules/ProductManagement/WishlistPages/Wishlist'));
const NotificationsPage = lazy(() => import('../../modules/Notifications/NotificationsPage'));

// Profile
const Profile = lazy(() => import('../../modules/Profile/Account/Profile'));
const ChangePassword = lazy(() => import('../../modules/Profile/Security/ChangePassword'));
const AddressManagement = lazy(() => import('../../modules/Profile/Addresses/AddressManagement'));

// Orders
const OrderList = lazy(() => import('../../modules/Orders/List/OrderList'));
const OrderDetail = lazy(() => import('../../modules/Orders/Detail/OrderDetail'));
const OrderTracking = lazy(() => import('../../modules/Orders/Tracking/OrderTracking'));
const Checkout = lazy(() => import('../../modules/Orders/CheckoutPages/Checkout'));

// Support flows (FAQ/Support) đã bỏ theo yêu cầu => không import nữa

// Admin
const AdminDashboard = lazy(() => import('../../modules/Admin/Dashboard/AdminDashboard'));
const AdminProductManagement = lazy(
  () => import('../../modules/Admin/Products/AdminProductManagement')
);
const ProductForm = lazy(() => import('../../modules/Admin/Products/ProductForm'));
const CategoryManagement = lazy(() => import('../../modules/Admin/Categories/CategoryManagement'));
const AdminOrderManagement = lazy(() => import('../../modules/Admin/Orders/AdminOrderManagement'));
const UserManagement = lazy(() => import('../../modules/Admin/Users/UserManagement'));
const StaffManagement = lazy(() => import('../../modules/Admin/Staff/StaffManagement'));
const SalesReport = lazy(() => import('../../modules/Admin/Reports/SalesReport'));
const Statistics = lazy(() => import('../../modules/Admin/Reports/Statistics'));
const InventoryManagement = lazy(
  () => import('../../modules/Admin/Inventory/InventoryManagement')
);
const StockAlerts = lazy(() => import('../../modules/Admin/Inventory/StockAlerts'));
const StockHistory = lazy(() => import('../../modules/Admin/Inventory/StockHistory'));

const AppRoutes: React.FC = () => {
  const withMainLayout = (node: React.ReactNode) => (
    <ProtectedRoute>
      <MainLayout>{node}</MainLayout>
    </ProtectedRoute>
  );

  const withAdminLayout = (node: React.ReactNode, allowedRoles: string[]) => (
    <RoleProtectedRoute allowedRoles={allowedRoles}>
      <AdminLayout>{node}</AdminLayout>
    </RoleProtectedRoute>
  );

  const withStaffDashboardLayout = (node: React.ReactNode) => (
    <RoleProtectedRoute allowedRoles={['admin', 'staff']}>
      <MainLayout>{node}</MainLayout>
    </RoleProtectedRoute>
  );

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

        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={withAdminLayout(<AdminDashboard />, ['admin', 'staff'])}
        />
        <Route
          path="/admin/products"
          element={withAdminLayout(<AdminProductManagement />, ['admin', 'staff'])}
        />
        <Route
          path="/admin/products/new"
          element={withAdminLayout(<ProductForm />, ['admin', 'staff'])}
        />
        <Route
          path="/admin/products/:id/edit"
          element={withAdminLayout(<ProductForm />, ['admin', 'staff'])}
        />
        <Route
          path="/admin/categories"
          element={withAdminLayout(<CategoryManagement />, ['admin', 'staff'])}
        />
        <Route
          path="/admin/orders"
          element={withAdminLayout(<AdminOrderManagement />, ['admin', 'staff'])}
        />
        <Route path="/admin/users" element={withAdminLayout(<UserManagement />, ['admin'])} />
        <Route path="/admin/staff" element={withAdminLayout(<StaffManagement />, ['admin'])} />
        <Route path="/admin/reports" element={withAdminLayout(<SalesReport />, ['admin'])} />
        <Route
          path="/admin/statistics"
          element={withAdminLayout(<Statistics />, ['admin'])}
        />
        <Route
          path="/admin/inventory"
          element={withAdminLayout(<InventoryManagement />, ['admin', 'staff'])}
        />
        <Route
          path="/admin/inventory/alerts"
          element={withAdminLayout(<StockAlerts />, ['admin', 'staff'])}
        />
        <Route
          path="/admin/inventory/history"
          element={withAdminLayout(<StockHistory />, ['admin', 'staff'])}
        />

        {/* Protected Routes */}
        <Route path="/dashboard" element={withStaffDashboardLayout(<Dashboard />)} />
        <Route path="/home" element={withMainLayout(<Home />)} />

        <Route path="/products" element={withMainLayout(<ProductList />)} />
        <Route path="/products/search" element={withMainLayout(<ProductSearch />)} />
        <Route path="/products/compare" element={withMainLayout(<ProductCompare />)} />
        <Route path="/products/:id" element={withMainLayout(<ProductDetail />)} />
        <Route path="/products/:id/reviews" element={withMainLayout(<ProductReviews />)} />

        <Route path="/cart" element={withMainLayout(<Cart />)} />
        <Route path="/checkout" element={withMainLayout(<Checkout />)} />

        <Route path="/orders" element={withMainLayout(<OrderList />)} />
        <Route path="/orders/:id" element={withMainLayout(<OrderDetail />)} />
        <Route path="/orders/:id/tracking" element={withMainLayout(<OrderTracking />)} />
        <Route
          path="/orders/tracking/:orderNumber"
          element={withMainLayout(<OrderTracking />)}
        />

        {/* FAQ / Support routes đã bỏ theo yêu cầu */}

        <Route path="/profile" element={withMainLayout(<Profile />)} />
        <Route path="/profile/change-password" element={withMainLayout(<ChangePassword />)} />
        <Route path="/profile/addresses" element={withMainLayout(<AddressManagement />)} />
        <Route path="/wishlist" element={withMainLayout(<Wishlist />)} />
        <Route path="/notifications" element={withMainLayout(<NotificationsPage />)} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;


