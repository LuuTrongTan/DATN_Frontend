import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout, AdminLayout } from './components/layouts';
import Login from '../modules/Auth/Login';
import Register from '../modules/Auth/Register';
import ForgotPassword from '../modules/Auth/ForgotPassword';
import VerifyAccount from '../modules/Auth/VerifyAccount';
import Dashboard from '../modules/Dashboard/Dashboard';
import { Home } from '../modules/Home';
import ProductList from '../modules/ProductManagement/ProductList';
import Cart from '../modules/ProductManagement/Cart';
import OrderList from '../modules/OrderManagement/OrderList';
import Profile from '../modules/Profile/Profile';
import {
  AdminDashboard,
  UserManagement,
  StaffManagement,
  CategoryManagement,
  AdminProductManagement,
  AdminOrderManagement,
  ProductForm,
} from '../modules/Admin';
import { SalesReport } from '../modules/Report';
import ProductDetail from '../modules/ProductManagement/ProductDetail';
import Checkout from '../modules/OrderManagement/Checkout';
import OrderDetail from '../modules/OrderManagement/OrderDetail';
import ChangePassword from '../modules/Profile/ChangePassword';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Role Protected Route Component
const RoleProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated) {
    // Redirect based on role
    if (user?.role === 'admin' || user?.role === 'staff') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
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
      <Route 
        path="/admin/dashboard" 
        element={
          <RoleProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/admin/products" 
        element={
          <RoleProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout>
              <AdminProductManagement />
            </AdminLayout>
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/admin/products/new" 
        element={
          <RoleProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout>
              <ProductForm />
            </AdminLayout>
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/admin/products/:id/edit" 
        element={
          <RoleProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout>
              <ProductForm />
            </AdminLayout>
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/admin/categories" 
        element={
          <RoleProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout>
              <CategoryManagement />
            </AdminLayout>
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/admin/orders" 
        element={
          <RoleProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout>
              <AdminOrderManagement />
            </AdminLayout>
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <UserManagement />
            </AdminLayout>
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/admin/staff" 
        element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <StaffManagement />
            </AdminLayout>
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <SalesReport />
            </AdminLayout>
          </RoleProtectedRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <RoleProtectedRoute allowedRoles={['admin', 'staff']}>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <Home />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/products" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProductList />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/products/:id" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProductDetail />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/cart" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <Cart />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/checkout" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <Checkout />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/orders" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <OrderList />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/orders/:id" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <OrderDetail />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile/change-password" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <ChangePassword />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={viVN}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;

