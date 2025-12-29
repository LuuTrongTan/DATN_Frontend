import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import BaseAppLayout from './BaseAppLayout';

const { Content } = Layout;

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  // Giữ trạng thái thu gọn/mở rộng sidebar admin theo localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem('adminSidebarCollapsed');
    return stored === 'true';
  });
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

  // Tính toán margin-left dựa trên viewport
  const sidebarWidth = Math.min(dimensions.width * 0.15, 250);
  const collapsedWidth = Math.min(dimensions.width * 0.05, 80);
  const marginLeft = collapsed ? collapsedWidth : sidebarWidth;
  const marginLeftPercent = (marginLeft / dimensions.width) * 100;

  const handleToggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('adminSidebarCollapsed', String(next));
      }
      return next;
    });
  };

  return (
    <BaseAppLayout
      sidebar={<AdminSidebar collapsed={collapsed} onToggle={handleToggleSidebar} />}
      navbar={<AdminNavbar collapsed={collapsed} />}
      navbarSpacer={<div style={{ height: '8vh', minHeight: '4rem' }} />}
      marginLeftPercent={marginLeftPercent}
      rightLayoutStyle={{}}
      contentStyle={{
            margin: 0,
            background: 'transparent',
          }}
        >
          {children ?? <Outlet />}
    </BaseAppLayout>
  );
};

export default AdminLayout;

