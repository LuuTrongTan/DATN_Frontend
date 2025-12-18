import React from 'react';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  DatabaseOutlined,
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
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: '/admin/products',
      icon: <ShoppingOutlined />,
      label: 'Quản lý sản phẩm',
    },
    {
      key: '/admin/categories',
      icon: <AppstoreOutlined />,
      label: 'Quản lý danh mục',
    },
    {
      key: '/admin/orders',
      icon: <FileTextOutlined />,
      label: 'Quản lý đơn hàng',
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: 'Quản lý người dùng',
    },
    {
      key: '/admin/staff',
      icon: <TeamOutlined />,
      label: 'Quản lý nhân viên',
    },
    {
      key: '/admin/reports',
      icon: <BarChartOutlined />,
      label: 'Báo cáo & Thống kê',
    },
    {
      key: '/admin/statistics',
      icon: <BarChartOutlined />,
      label: 'Thống kê',
    },
    {
      key: 'inventory-group',
      icon: <DatabaseOutlined />,
      label: 'Quản lý kho',
      children: [
        {
          key: '/admin/inventory',
          icon: <DatabaseOutlined />,
          label: 'Nhập/Điều chỉnh kho',
        },
        {
          key: '/admin/inventory/alerts',
          icon: <WarningOutlined />,
          label: 'Cảnh báo hết hàng',
        },
        {
          key: '/admin/inventory/history',
          icon: <HistoryOutlined />,
          label: 'Lịch sử kho',
        },
      ],
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

