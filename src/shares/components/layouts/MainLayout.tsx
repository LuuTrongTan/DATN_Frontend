import React, { useState, useEffect } from 'react';
import { Layout, Button } from 'antd';
import { Outlet } from 'react-router-dom';
import { DoubleRightOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../contexts/AuthContext';
import BaseAppLayout from './BaseAppLayout';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

  // Mặc định với tài khoản user (khách) thì ẩn sidebar, admin/staff thì mở
  const [collapsed, setCollapsed] = useState(!isStaffOrAdmin);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cập nhật collapsed khi role thay đổi (login/logout)
  useEffect(() => {
    const staffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
    setCollapsed(!staffOrAdmin);
  }, [user?.role]);

  // Tính toán margin-left dựa trên viewport
  const sidebarWidth = Math.min(dimensions.width * 0.15, 250);
  const collapsedWidth = Math.min(dimensions.width * 0.05, 80);

  let marginLeft: number;
  if (isStaffOrAdmin) {
    // Admin/staff: khi thu gọn vẫn chừa không gian cho sidebar hẹp
    marginLeft = collapsed ? collapsedWidth : sidebarWidth;
  } else {
    // User thường: khi thu gọn thì không chừa margin (sidebar ẩn hoàn toàn)
    marginLeft = collapsed ? 0 : sidebarWidth;
  }

  const marginLeftPercent = (marginLeft / dimensions.width) * 100;

  return (
    <BaseAppLayout
      sidebar={
        (isStaffOrAdmin || !collapsed) && (
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        )
      }
      navbar={<Navbar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />}
      navbarSpacer={<div style={{ height: '8vh', minHeight: '4rem' }} />}
      beforeContent={
        !isStaffOrAdmin && collapsed ? (
          <Button
            type="text"
            size="small"
            icon={<DoubleRightOutlined />}
            onClick={() => setCollapsed(false)}
            className="sidebar-toggle-btn"
            style={{
              position: 'fixed',
              left: '1.25rem',
              top: '11vh',
              zIndex: 20,
              borderRadius: '12px',
              color: '#667eea',
              background:
                'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        ) : null
      }
      marginLeftPercent={marginLeftPercent}
      rightLayoutStyle={{}}
      contentStyle={{
        margin: '2vh 1.5vw 2vh 0.5vw',
        padding: 'clamp(1rem, 1.5vw, 1.5rem)',
        background: '#fff',
        borderRadius: '0.5vw',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {children ?? <Outlet />}
    </BaseAppLayout>
  );
};

export default MainLayout;

