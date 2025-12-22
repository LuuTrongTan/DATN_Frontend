import React, { useState, useEffect } from 'react';
import { Layout, Button } from 'antd';
import { DoubleRightOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../contexts/AuthContext';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
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
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>
      {/* Sidebar - Fixed position, không đè lên content */}
      {(isStaffOrAdmin || !collapsed) && (
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      )}
      
      {/* Main Layout - Có margin-left để không bị sidebar che */}
      <Layout 
        style={{ 
          marginLeft: `${marginLeftPercent}%`,
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
          width: `${100 - marginLeftPercent}%`,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '8vh', // chừa không gian cho navbar cố định full width
        }}
      >
        {/* Navbar - Header cố định */}
        <Navbar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        
        {/* Nút mở sidebar khi user thường đang ẩn sidebar hoàn toàn */}
        {!isStaffOrAdmin && collapsed && (
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
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        )}

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

export default MainLayout;

