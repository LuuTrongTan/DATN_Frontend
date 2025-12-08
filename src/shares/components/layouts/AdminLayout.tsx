import React, { useState } from 'react';
import { Layout } from 'antd';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';

const { Content } = Layout;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>
      {/* Admin Sidebar - Fixed position */}
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      
      {/* Main Layout - Có margin-left để không bị sidebar che */}
      <Layout 
        style={{ 
          marginLeft: collapsed ? 80 : 250,
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Admin Navbar - Header cố định, ẩn dưới sidebar */}
        <AdminNavbar collapsed={collapsed} />
        
        {/* Spacer cho navbar fixed */}
        <div style={{ height: 64 }} />
        
        {/* Content - Phần nội dung chính */}
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: 8,
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

