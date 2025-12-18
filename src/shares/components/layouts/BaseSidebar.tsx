import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogoutOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { message } from 'antd';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

interface BaseSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  menuItems: MenuProps['items'];
  title: string;
}

const BaseSidebar: React.FC<BaseSidebarProps> = ({ 
  collapsed, 
  onToggle, 
  menuItems,
  title 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [dimensions, setDimensions] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      logout();
      navigate('/login');
    }
  };

  // Tính toán width dựa trên viewport (15% cho desktop, tối đa 250px)
  const sidebarWidth = Math.min(dimensions.width * 0.15, 250);
  const collapsedWidth = Math.min(dimensions.width * 0.05, 80);

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={sidebarWidth}
      collapsedWidth={collapsedWidth}
      style={{
        overflow: 'auto',
        height: 'calc(100vh - 8vh)', // phía dưới navbar
        position: 'fixed',
        left: 0,
        top: '8vh', // bắt đầu dưới navbar
        bottom: 0,
        zIndex: 10,
        boxShadow: 'none',
        // Màu nền phần padding (bên ngoài khối sidebar) cho trùng màu nền xám của content/page
        background: '#f5f5f5',
        padding: collapsed ? '0.75rem 0.4rem' : '1rem 0.75rem',
      }}
      theme="light"
    >
      <div
        style={{
          height: '100%',
          background: '#FFF2E5', // cùng màu navbar
          borderRadius: '1rem',
          padding: collapsed ? '0.5rem 0.4rem' : '0.75rem 0.75rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {/* Nút thu/phóng sidebar nằm ngay trong khối sidebar */}
        <div
          style={{
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-end',
            marginBottom: '0.25rem',
          }}
        >
          <Button
            type="text"
            size="small"
            icon={collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
            onClick={onToggle}
            style={{
              borderRadius: '999px',
              color: '#E65100',
              background: 'rgba(255, 152, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </div>

        <Menu
          theme="light"
          mode="inline"
          className="admin-sidebar-menu"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: collapsed ? '0.25rem 0.2rem' : '0.25rem 0.3rem',
            background: 'transparent',
            border: 'none',
            flex: 1,
          }}
        />
        <Menu
          theme="light"
          mode="inline"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            marginTop: 'auto',
          }}
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
      </div>
    </Sider>
  );
};

export default BaseSidebar;

