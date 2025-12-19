import React from 'react';
import { Layout, Button, Dropdown, Badge, Avatar, Space, Typography, Input } from 'antd';
import {
  DoubleLeftOutlined,
  DoubleRightOutlined,
  BellOutlined,
  UserOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { MenuProps } from 'antd';

const { Search } = Input;

const { Header } = Layout;
const { Text } = Typography;

interface BaseNavbarProps {
  collapsed: boolean;
  onToggle?: () => void;
  userMenuItems: MenuProps['items'];
  background?: string;
  position?: 'fixed' | 'sticky';
  sidebarWidth?: number;
  sidebarCollapsedWidth?: number;
  showToggleButton?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  roleLabel?: (role?: string) => string;
  showSearchBar?: boolean;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  showCart?: boolean;
  cartCount?: number;
  showWishlist?: boolean;
  wishlistCount?: number;
}

const BaseNavbar: React.FC<BaseNavbarProps> = ({
  collapsed,
  onToggle,
  userMenuItems,
  background = '#FFF2E5',
  position = 'sticky',
  sidebarWidth = 250,
  sidebarCollapsedWidth = 80,
  showToggleButton = false,
  showNotifications = true,
  notificationCount = 0,
  roleLabel,
  showSearchBar = true,
  onSearch,
  searchPlaceholder = 'Tìm kiếm...',
  showCart = true,
  cartCount = 0,
  showWishlist = true,
  wishlistCount = 0,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dimensions, setDimensions] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const headerStyle: React.CSSProperties = {
    padding: '1vh 1.5vw 0', // thêm khoảng trống phía trên để navbar không dính sát mép
    background: 'transparent', // để nhìn rõ phần navbar bo góc bên trong
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'none',
    position,
    top: 0,
    zIndex: 10,
    height: '8vh',
    minHeight: '4rem',
  };

  if (position === 'fixed') {
    headerStyle.right = 0;
    headerStyle.left = 0;
  }

  const getRoleLabel = () => {
    if (roleLabel) {
      return roleLabel(user?.role);
    }
    return user?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng';
  };

  const handleSearch = (value: string) => {
    if (onSearch) {
      onSearch(value);
    } else {
      // Default: navigate to products page with search query
      navigate(`/products?search=${encodeURIComponent(value)}`);
    }
  };

  const innerNavbarStyle: React.CSSProperties = {
    width: 'calc(100% - 3vw)', // gần full width, chừa 1.5vw mỗi bên
    maxWidth: '100%',
    margin: '0',
    padding: '0 1.5vw',
    background,
    borderRadius: '999px', // bo tròn dạng pill
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    height: '100%',
  };

  return (
    <Header style={headerStyle}>
      <div style={innerNavbarStyle}>
      {/* Left: Toggle button (nếu có) */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: '3rem' }}>
        {showToggleButton && onToggle && (
          <Button
            type="text"
            icon={collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
            onClick={onToggle}
            style={{
              fontSize: 'clamp(0.875rem, 1vw, 1rem)',
              width: '4vw',
              minWidth: '3rem',
              height: '100%',
            }}
          />
        )}
      </div>

      {/* Center: Search Bar (căn giữa navbar) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {showSearchBar && (
          <Search
            placeholder={searchPlaceholder}
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            style={{
              width: '100%',
              maxWidth: '40vw',
              minWidth: '15rem',
            }}
          />
        )}
      </div>

      {/* Right: Icon + User */}
      <Space size="large">
        {/* Wishlist */}
        {showWishlist && (
          <Badge count={wishlistCount} size="small" offset={[-2, 2]}>
            <Button
              type="text"
              icon={<HeartOutlined />}
              onClick={() => navigate('/wishlist')}
              style={{ 
                fontSize: 'clamp(1rem, 1.125vw, 1.125rem)',
                color: wishlistCount > 0 ? '#ff4d4f' : undefined,
              }}
            />
          </Badge>
        )}

        {/* Cart */}
        {showCart && (
          <Badge count={cartCount} size="small" offset={[-2, 2]}>
            <Button
              type="text"
              icon={<ShoppingCartOutlined />}
              onClick={() => navigate('/cart')}
              style={{ 
                fontSize: 'clamp(1rem, 1.125vw, 1.125rem)',
                color: cartCount > 0 ? '#1890ff' : undefined,
              }}
            />
          </Badge>
        )}

        {/* Notifications */}
        {showNotifications && (
          <Badge count={notificationCount} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ fontSize: 'clamp(1rem, 1.125vw, 1.125rem)' }}
              onClick={() => navigate('/notifications')}
            />
          </Badge>
        )}

        {/* User Menu */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          arrow
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              icon={<UserOutlined />}
              size={{ xs: 32, sm: 36, md: 40, lg: 44, xl: 48, xxl: 52 }}
              style={{ 
                backgroundColor: user?.role === 'admin' ? '#722ed1' : '#667eea',
                fontSize: 'clamp(1rem, 1.25vw, 1.25rem)',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <Text strong style={{ fontSize: 'clamp(0.875rem, 1vw, 1rem)' }}>
                {user?.full_name || user?.email || user?.phone || 
                 (user?.role === 'admin' ? 'Admin' : 'User')}
              </Text>
              <Text type="secondary" style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                {getRoleLabel()}
              </Text>
            </div>
          </Space>
        </Dropdown>
      </Space>
      </div>
    </Header>
  );
};

export default BaseNavbar;

