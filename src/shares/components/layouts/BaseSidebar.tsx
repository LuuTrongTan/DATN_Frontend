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

type SidebarItem = Required<MenuProps>['items'][number];

const BaseSidebar: React.FC<BaseSidebarProps> = ({
  collapsed,
  onToggle,
  menuItems,
  title,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [openKeys, setOpenKeys] = React.useState<string[]>([]);
  const [dimensions, setDimensions] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  const findActiveKeys = React.useCallback(
    (items: SidebarItem[] | undefined, path: string, parentKey?: string) => {
      let selected: string | null = null;
      let opens: string[] = parentKey ? [parentKey] : [];

      items?.forEach((item) => {
        if (!item || typeof item === 'string') return;
        const key = item.key as string | undefined;
        const children = (item as any).children as SidebarItem[] | undefined;

        if (children?.length) {
          const childMatch = findActiveKeys(children, path, key);
          if (childMatch.selected) {
            selected = childMatch.selected;
            opens = Array.from(new Set([...opens, ...childMatch.opens]));
          } else if (key && path.startsWith(key) && !selected) {
            selected = key;
            opens = Array.from(new Set([...opens, ...(parentKey ? [parentKey] : [])]));
          }
        } else if (key && path.startsWith(key)) {
          const isLongerMatch = !selected || key.length > selected.length;
          if (isLongerMatch) {
            selected = key;
            opens = parentKey ? [parentKey] : [];
          }
        }
      });

      return { selected, opens };
    },
    []
  );

  const activeKeys = React.useMemo(() => {
    const fullPath = `${location.pathname}${location.search || ''}`;
    return findActiveKeys(menuItems as SidebarItem[], fullPath);
  }, [findActiveKeys, location.pathname, location.search, menuItems]);

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

  React.useEffect(() => {
    setOpenKeys(activeKeys.opens);
  }, [activeKeys.opens]);

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
        background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
        padding: collapsed ? '0.75rem 0.2rem' : '1rem 0.3rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      theme="light"
    >
      <div
        style={{
          height: '100%',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '1.5rem',
          padding: collapsed ? '0.5rem 0.4rem' : '0.75rem 0.75rem',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
            className="sidebar-toggle-btn"
            style={{
              borderRadius: '12px',
              color: '#ff3c3c',
              background:
                'linear-gradient(135deg, rgba(255, 182, 193, 0.16) 0%, rgba(255, 218, 185, 0.16) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 60, 60, 0.25)',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(255, 182, 193, 0.25)',
            }}
          />
        </div>

        <Menu
          theme="light"
          mode="inline"
          className="admin-sidebar-menu"
          selectedKeys={activeKeys.selected ? [activeKeys.selected] : []}
          openKeys={openKeys}
          items={menuItems}
          onClick={handleMenuClick}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: collapsed ? '0.25rem 0.2rem' : '0.25rem 0.3rem',
            background: 'transparent',
            border: 'none',
            flex: 1,
            transition: 'all 0.3s ease',
          }}
        />
      </div>
    </Sider>
  );
};

export default BaseSidebar;

