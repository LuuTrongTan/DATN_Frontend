import React from 'react';
import {
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { message } from 'antd';
import BaseNavbar from './BaseNavbar';
import type { MenuProps } from 'antd';

interface AdminNavbarProps {
  collapsed: boolean;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [notifications] = React.useState(0);

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      message.success('Đăng xuất thành công!');
      navigate('/login');
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi đăng xuất');
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
    return role === 'admin' ? 'Quản trị viên' : 'Nhân viên';
  };

  return (
    <BaseNavbar
      collapsed={collapsed}
      userMenuItems={userMenuItems}
      position="fixed"
      sidebarWidth={250}
      sidebarCollapsedWidth={80}
      showToggleButton={false}
      showNotifications={true}
      notificationCount={notifications}
      roleLabel={getRoleLabel}
      showCart={false}
      showWishlist={false}
    />
  );
};

export default AdminNavbar;

