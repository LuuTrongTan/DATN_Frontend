import React, { useMemo } from 'react';
import { HomeOutlined, DashboardOutlined, UserOutlined, ShoppingOutlined, FileTextOutlined, AppstoreOutlined, TagOutlined } from '@ant-design/icons';
import BaseSidebar from './BaseSidebar';
import type { MenuProps } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      [
        {
          key: '/home',
          icon: <HomeOutlined />,
          label: 'Home',
        },
        isAdmin && {
          key: '/admin/dashboard',
          icon: <DashboardOutlined />,
          label: 'Tổng quan',
        },
        {
          key: '/admin/products',
          icon: <ShoppingOutlined />,
          label: 'Sản phẩm',
        },
        {
          key: '/admin/categories',
          icon: <AppstoreOutlined />,
          label: 'Danh mục',
        },
        {
          key: '/admin/tags',
          icon: <TagOutlined />,
          label: 'Tags',
        },
        {
          key: '/admin/orders',
          icon: <FileTextOutlined />,
          label: 'Đơn hàng',
        },
        isAdmin && {
          key: '/admin/accounts',
          icon: <UserOutlined />,
          label: 'Tài khoản',
        },
      ].filter(Boolean) as MenuProps['items'],
    [isAdmin]
  );

  return (
    <BaseSidebar
      collapsed={collapsed}
      onToggle={onToggle}
      menuItems={menuItems}
      title="Admin Panel"
    />
  );
};

export default AdminSidebar;

