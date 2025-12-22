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
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { user } = useAuth();
  const [dimensions, setDimensions] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
  });

  // Kiểm tra trang hiện tại để highlight icon tương ứng
  const isCartActive = location.pathname === '/cart';
  const isWishlistActive = location.pathname === '/wishlist';
  const isNotificationsActive = location.pathname === '/notifications';

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

  // Sử dụng gradient mặc định nếu background không được chỉ định hoặc là màu cũ
  // Gradient màu hồng/cam nhạt
  const getNavbarBackground = () => {
    if (background && background !== '#FFF2E5') {
      return background;
    }
    // Gradient màu hồng/cam nhạt
    return 'linear-gradient(135deg, rgba(255, 182, 193, 0.85) 0%, rgba(255, 218, 185, 0.85) 100%)';
  };

  const innerNavbarStyle: React.CSSProperties = {
    width: 'calc(100% - 3vw)', // gần full width, chừa 1.5vw mỗi bên
    maxWidth: '100%',
    margin: '0',
    padding: '0 1.5vw',
    background: getNavbarBackground(), // Gradient hiện đại hoặc màu tùy chỉnh
    borderRadius: '999px', // bo tròn dạng pill
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 8px 24px rgba(255, 182, 193, 0.2), 0 4px 12px rgba(255, 218, 185, 0.15)',
    height: '100%',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
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
            className="navbar-toggle-btn"
            style={{
              fontSize: 'clamp(0.875rem, 1vw, 1rem)',
              width: '4vw',
              minWidth: '3rem',
              height: '100%',
              color: '#000000',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
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
            className="navbar-search"
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
          <Badge 
            count={wishlistCount} 
            size="small" 
            offset={[-2, 2]}
          >
            <Button
              type="text"
              icon={<HeartOutlined />}
              onClick={() => navigate('/wishlist')}
              className={`navbar-icon-btn ${isWishlistActive ? 'navbar-icon-active' : ''}`}
              style={{ 
                fontSize: 'clamp(1rem, 1.125vw, 1.125rem)',
                color: '#000000',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
              }}
            />
          </Badge>
        )}

        {/* Cart */}
        {showCart && (
          <Badge 
            count={cartCount} 
            size="small" 
            offset={[-2, 2]}
          >
            <Button
              type="text"
              icon={<ShoppingCartOutlined />}
              onClick={() => navigate('/cart')}
              className={`navbar-icon-btn ${isCartActive ? 'navbar-icon-active' : ''}`}
              style={{ 
                fontSize: 'clamp(1rem, 1.125vw, 1.125rem)',
                color: '#000000',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
              }}
            />
          </Badge>
        )}

        {/* Notifications */}
        {showNotifications && (
          <Badge 
            count={notificationCount} 
            size="small"
          >
            <Button
              type="text"
              icon={<BellOutlined />}
              className={`navbar-icon-btn ${isNotificationsActive ? 'navbar-icon-active' : ''}`}
              style={{ 
                fontSize: 'clamp(1rem, 1.125vw, 1.125rem)',
                color: '#000000',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
              }}
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
          <Space 
            className="navbar-user-info"
            style={{ 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              margin: '0',
            }}
          >
            <Avatar
              icon={<UserOutlined />}
              size={{ xs: 32, sm: 36, md: 40, lg: 44, xl: 48, xxl: 52 }}
              style={{ 
                backgroundColor: '#d9d9d9',
                fontSize: 'clamp(1rem, 1.25vw, 1.25rem)',
                transition: 'all 0.3s ease',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <Text 
                strong 
                style={{ 
                  fontSize: 'clamp(0.875rem, 1vw, 1rem)',
                  color: '#000000',
                }}
              >
                {user?.full_name || user?.email || user?.phone || 
                 (user?.role === 'admin' ? 'Admin' : 'User')}
              </Text>
              <Text 
                style={{ 
                  fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)',
                  color: 'rgba(0, 0, 0, 0.7)',
                }}
              >
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

