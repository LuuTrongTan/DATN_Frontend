import React from 'react';
import { Layout, Button, Dropdown, Badge, Avatar, Space, Typography } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { message } from 'antd';

const { Header } = Layout;
const { Text } = Typography;

interface AdminNavbarProps {
  collapsed: boolean;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications] = React.useState(0);

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

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        padding: '0 24px',
        background: '#FFDDB3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        right: 0,
        left: collapsed ? 80 : 250,
        zIndex: 100,
        transition: 'left 0.2s',
      }}
    >
      <Space size="large" style={{ marginLeft: 'auto' }}>
        {/* Notifications */}
        <Badge count={notifications} size="small">
          <Button
            type="text"
            icon={<BellOutlined />}
            style={{ fontSize: 18 }}
          />
        </Badge>

        {/* User Menu */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          arrow
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              icon={<UserOutlined />}
              style={{ backgroundColor: '#722ed1' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <Text strong>{user?.full_name || user?.email || user?.phone || 'Admin'}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </Text>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AdminNavbar;

