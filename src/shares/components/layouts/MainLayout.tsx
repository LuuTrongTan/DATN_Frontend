import React, { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>
      {/* Sidebar - Fixed position, không đè lên content */}
      <Sidebar collapsed={collapsed} />
      
      {/* Main Layout - Có margin-left để không bị sidebar che */}
      <Layout 
        style={{ 
          marginLeft: collapsed ? 80 : 200,
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Navbar - Header cố định */}
        <Navbar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        
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

export default MainLayout;

