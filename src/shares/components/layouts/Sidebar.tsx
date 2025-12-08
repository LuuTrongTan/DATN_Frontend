import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { message } from 'antd';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Xác định trang chủ dựa trên role
  const homePath = user?.role === 'admin' || user?.role === 'staff' 
    ? '/dashboard' 
    : '/home';

  const menuItems = [
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
      key: '/cart',
      icon: <ShoppingCartOutlined />,
      label: 'Giỏ hàng',
    },
    {
      key: '/orders',
      icon: <FileTextOutlined />,
      label: 'Đơn hàng',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ',
    },
  ];

  // Thêm menu admin nếu user là admin
  if (user?.role === 'admin') {
    menuItems.push({
      key: '/admin',
      icon: <SettingOutlined />,
      label: 'Quản trị',
    });
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout();
    } else {
      navigate(key);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      message.success('Đăng xuất thành công!');
      navigate('/login');
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi đăng xuất');
      // Vẫn logout local nếu API fail
      logout();
      navigate('/login');
    }
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={200}
      collapsedWidth={80}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      }}
      theme="dark"
    >
      <div
        style={{
          height: 64,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold',
        }}
      >
        {collapsed ? 'XG' : 'XGame'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
      <Menu
        theme="dark"
        mode="inline"
        style={{ position: 'absolute', bottom: 0, width: '100%' }}
        items={[
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
          },
        ]}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default Sidebar;

