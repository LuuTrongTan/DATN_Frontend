import React, { useEffect, useMemo } from 'react';
import {
  HomeOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import BaseSidebar from './BaseSidebar';
import type { MenuProps } from 'antd';
import { useAppDispatch, useAppSelector } from '../../stores';
import { fetchCategories } from '../../../modules/ProductManagement/stores/productsSlice';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.products.categories);
  const categoriesLoading = useAppSelector((state) => state.products.categoriesLoading);

  // Xác định trang chủ dựa trên role
  const homePath = user?.role === 'admin' || user?.role === 'staff' 
    ? '/dashboard' 
    : '/home';

  // Tải danh mục nếu chưa có để hiển thị trong submenu "Danh mục"
  useEffect(() => {
    if (!categories.length && !categoriesLoading) {
      dispatch(fetchCategories());
    }
  }, [categories.length, categoriesLoading, dispatch]);

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [
      {
        key: homePath,
        icon: <HomeOutlined />,
        label: 'Trang chủ',
      },
      // Trang sản phẩm tổng quát
      {
        key: '/products',
        icon: <ShoppingOutlined />,
        label: 'Sản phẩm',
      },
    ];

    // Nhóm "Danh mục" với các category con (nếu đã có dữ liệu)
    if (categories.length) {
      items.push({
        key: 'categories-group',
        icon: <ShoppingOutlined />,
        label: 'Danh mục',
        children: categories.map((category) => ({
          key: `/products?category_slug=${category.slug || ''}`,
          label: category.name,
          icon: category.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              style={{
                width: 20,
                height: 20,
                objectFit: 'cover',
                borderRadius: 4,
              }}
            />
          ) : undefined,
        })),
      });
    }

    // Đơn hàng (giữ nguyên)
    items.push({
      key: '/orders',
      icon: <FileTextOutlined />,
      label: 'Đơn hàng',
    });

    // Thêm menu quản trị cho admin/staff (đều được phép vào các route /admin/* theo AppRoutes)
    if (user?.role === 'admin' || user?.role === 'staff') {
      items.push({
        key: '/admin/dashboard',
        icon: <SettingOutlined />,
        label: 'Quản trị',
      });
    }

    return items;
  }, [homePath, user?.role, categories]);

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

