import React from 'react';
import {
  HomeOutlined,
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  WarningOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import BaseSidebar from './BaseSidebar';
import type { MenuProps } from 'antd';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle }) => {
  const menuItems: MenuProps['items'] = [
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
      key: '/admin/orders',
      icon: <FileTextOutlined />,
      label: 'Đơn hàng',
    },
    {
      key: '/admin/accounts',
      icon: <UserOutlined />,
      label: 'Tài khoản',
    },
  ];

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

