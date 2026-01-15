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
import { selectCartCount } from '../../../shares/stores/cartSelectors';
import { useEffectOnce } from '../../hooks';
import { useLocation } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';

interface NavbarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAuthenticated, user } = useAuth();
  const dispatch = useAppDispatch();
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Lấy dữ liệu từ Redux - sử dụng selector để đảm bảo re-render khi state thay đổi
  // Sử dụng selector với memoization để đảm bảo re-render ngay khi cart items thay đổi
  const cartCount = useAppSelector(selectCartCount);
  const cartItems = useAppSelector((state) => state.cart.items);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const wishlistCount = wishlistItems.length;
  
  // Đảm bảo wishlist được refresh khi navigate (tương tự cart)
  // Để đảm bảo wishlist count được cập nhật ngay
  
  // Fetch cart, wishlist và notifications khi đăng nhập
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
      
      // Fetch notification count
      const fetchNotificationCount = async () => {
        try {
          const count = await notificationService.getUnreadCount();
          setNotificationCount(count);
        } catch (error) {
          console.error('Error fetching notification count:', error);
        }
      };
      fetchNotificationCount();
    } else {
      setNotificationCount(0);
    }
  }, [isAuthenticated, user?.id, dispatch]);

  // Auto-refresh notification count mỗi 30 giây
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const interval = setInterval(async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setNotificationCount(count);
      } catch (error) {
        console.error('Error refreshing notification count:', error);
      }
    }, 30000); // 30 seconds

    // Refresh khi tab được focus lại
    const handleFocus = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setNotificationCount(count);
      } catch (error) {
        console.error('Error refreshing notification count on focus:', error);
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, user?.id]);
  
  // Refresh cart khi navigate từ order page về (sau khi đặt hàng có thể đã clear cart)
  // Đảm bảo cart count được cập nhật ngay sau khi đặt hàng
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const isOrderPage = location.pathname.startsWith('/orders/');
      const prevPath = sessionStorage.getItem('prevPath');
      
      // Nếu đang rời khỏi order page (từ order page sang trang khác), refresh cart
      if (prevPath?.startsWith('/orders/') && !isOrderPage) {
        dispatch(fetchCart());
      }
      
      // Lưu path hiện tại cho lần sau
      sessionStorage.setItem('prevPath', location.pathname);
    }
  }, [location.pathname, isAuthenticated, user?.id, dispatch]);

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

  // Đảm bảo cartCount được tính toán lại mỗi khi cartItems thay đổi
  // Sử dụng key prop để force re-render Badge khi cartCount thay đổi
  const cartCountKey = `${cartCount}-${cartItems.length}`;
  
  return (
    <BaseNavbar
      collapsed={collapsed}
      onToggle={onToggle}
      userMenuItems={userMenuItems}
      position="fixed"
      // Đã chuyển nút thu/phóng xuống sidebar, nên không hiển thị trên navbar nữa
      showToggleButton={false}
      showNotifications={true}
      notificationCount={notificationCount}
      roleLabel={getRoleLabel}
      showCart={true}
      cartCount={cartCount}
      key={`navbar-${cartCountKey}`}
      showWishlist={true}
      wishlistCount={wishlistCount}
      showHome={true}
      homePath="/home"
      showOrders={true}
      ordersPath="/orders"
    />
  );
};

export default Navbar;

