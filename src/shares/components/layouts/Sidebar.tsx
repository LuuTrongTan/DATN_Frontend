import React, { useMemo } from 'react';
import {
  HomeOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import BaseSidebar from './BaseSidebar';
import type { MenuProps } from 'antd';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();

  // Xác định trang chủ dựa trên role
  const homePath = user?.role === 'admin' || user?.role === 'staff' 
    ? '/dashboard' 
    : '/home';

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [
      {
        key: homePath,
        icon: <HomeOutlined />,
        label: 'Trang chủ',
      },
      {
        key: '/products',
        icon: <ShoppingOutlined />,
        label: 'Sản phẩm',
      },
      {
        key: '/orders',
        icon: <FileTextOutlined />,
        label: 'Đơn hàng',
      },
    ];

    // Thêm menu quản trị cho admin/staff (đều được phép vào các route /admin/* theo AppRoutes)
    if (user?.role === 'admin' || user?.role === 'staff') {
      items.push({
        key: '/admin/dashboard',
        icon: <SettingOutlined />,
        label: 'Quản trị',
      });
    }

    return items;
  }, [homePath, user?.role]);

  return (
    <BaseSidebar
      collapsed={collapsed}
      onToggle={onToggle}
      menuItems={menuItems}
      title="XGame"
    />
  );
};

export default Sidebar;

