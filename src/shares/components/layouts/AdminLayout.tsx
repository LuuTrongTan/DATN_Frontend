import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';

const { Content } = Layout;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
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

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>
      {/* Admin Sidebar - Fixed position */}
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      
      {/* Main Layout - Có margin-left để không bị sidebar che */}
      <Layout 
        style={{ 
          marginLeft: `${marginLeftPercent}%`,
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
          width: `${100 - marginLeftPercent}%`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Admin Navbar - Header cố định, ẩn dưới sidebar */}
        <AdminNavbar collapsed={collapsed} />
        
        {/* Spacer cho navbar fixed */}
        <div style={{ height: '8vh', minHeight: '4rem' }} />
        
        {/* Content - Phần nội dung chính */}
        <Content
          style={{
            margin: '2vh 1.5vw 2vh 0.5vw',
            padding: 'clamp(1rem, 1.5vw, 1.5rem)',
            minHeight: '35vh',
            background: '#fff',
            borderRadius: '0.5vw',
            overflow: 'auto',
            flex: 1,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;

