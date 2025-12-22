import React, { useState, useEffect } from 'react';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { message } from 'antd';
import BaseNavbar from './BaseNavbar';
import type { MenuProps } from 'antd';
import { useAppDispatch, useAppSelector } from '../../stores';
import { fetchCart } from '../../../modules/ProductManagement/stores/cartSlice';
import { fetchWishlist } from '../../../modules/ProductManagement/stores/wishlistSlice';

interface NavbarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, user } = useAuth();
  const dispatch = useAppDispatch();
  const [notifications] = useState(0); // TODO: Implement notification logic
  
  // Lấy dữ liệu từ Redux
  const cartItems = useAppSelector((state) => state.cart.items);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  
  // Tính toán số lượng từ Redux
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const wishlistCount = wishlistItems.length;

  // Fetch cart và wishlist khi đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [isAuthenticated, dispatch]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      message.success('Đăng xuất thành công!');
      navigate('/login');
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi đăng xuất');
      // Vẫn logout local nếu API fail
      logout();
      navigate('/login');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const getRoleLabel = (role?: string) => {
    if (role === 'admin') return 'Quản trị viên';
    if (role === 'staff') return 'Nhân viên';
    return 'Khách hàng';
  };

  return (
    <BaseNavbar
      collapsed={collapsed}
      onToggle={onToggle}
      userMenuItems={userMenuItems}
      position="fixed"
      // Đã chuyển nút thu/phóng xuống sidebar, nên không hiển thị trên navbar nữa
      showToggleButton={false}
      showNotifications={true}
      notificationCount={notifications}
      roleLabel={getRoleLabel}
      showCart={true}
      cartCount={cartCount}
      showWishlist={true}
      wishlistCount={wishlistCount}
    />
  );
};

export default Navbar;

