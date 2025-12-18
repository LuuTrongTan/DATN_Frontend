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
            type="primary"
            shape="circle"
            icon={<DoubleRightOutlined />}
            onClick={() => setCollapsed(false)}
            style={{
              position: 'fixed',
              left: '1.25rem', // dịch sang phải một chút
              top: '11vh',     // hạ xuống dưới một chút
              zIndex: 20,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              // Nền vàng đậm hơn navbar một chút, icon màu đen
              background: '#FFD27F',
              borderColor: '#FFC566',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        )}

        {/* Content - Phần nội dung chính */}
        <Content
          style={{
            margin: '2vh 1.5vw',
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

