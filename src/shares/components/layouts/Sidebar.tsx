import React, { useEffect, useMemo } from 'react';
import { SettingOutlined, ShoppingOutlined } from '@ant-design/icons';
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
  const { categories, categoriesLoading, categoriesLoaded } = useAppSelector(
    (state) => state.products
  );

  // Tải danh mục để hiển thị trên sidebar (một lần)
  useEffect(() => {
    if (!categoriesLoaded && !categoriesLoading) {
      dispatch(fetchCategories());
    }
  }, [categoriesLoaded, categoriesLoading, dispatch]);

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [];

    // Thêm menu Admin lên đầu nếu là admin/staff
    if (user?.role === 'admin' || user?.role === 'staff') {
      items.push({
        key: '/admin/dashboard',
        icon: <SettingOutlined />,
        label: 'Admin',
      });
    }

    // Danh mục sản phẩm hiển thị trực tiếp trên sidebar
    if (categories.length) {
      categories.forEach((category) => {
      items.push({
          key: `/products?category_slug=${category.slug || ''}`,
          label: category.name,
          icon: category.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              style={{
                width: 48,
                height: 48,
                objectFit: 'cover',
                borderRadius: 8,
              }}
            />
          ) : (
            <ShoppingOutlined />
          ),
    });
      });
    }

    return items;
  }, [user?.role, categories]);

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

