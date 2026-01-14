import React, { useMemo } from 'react';
import { HomeOutlined, DashboardOutlined, UserOutlined, ShoppingOutlined, FileTextOutlined, AppstoreOutlined, UndoOutlined, StarOutlined, TagOutlined } from '@ant-design/icons';
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
    {
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
    {
          key: '/admin/reviews',
          icon: <StarOutlined />,
          label: 'Đánh giá',
        },
        {
          key: '/admin/refunds',
          icon: <UndoOutlined />,
          label: 'Hoàn trả',
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

