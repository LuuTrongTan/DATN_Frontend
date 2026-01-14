import React from 'react';
import { Modal, Button, Typography, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  const handleRegister = () => {
    onClose();
    navigate('/register');
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={480}
      closable={true}
    >
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <ExclamationCircleOutlined 
          style={{ fontSize: '64px', color: '#faad14', marginBottom: '16px' }} 
        />
        <Title level={4} style={{ marginBottom: '12px' }}>
          Yêu cầu đăng nhập
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
          Để truy cập trang này, bạn cần đăng nhập hoặc tạo tài khoản mới.
        </Text>
        <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
          <Button type="default" onClick={onClose}>
            Hủy
          </Button>
          <Button type="primary" onClick={handleLogin}>
            Đăng nhập
          </Button>
          <Button type="default" onClick={handleRegister}>
            Đăng ký
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default LoginRequiredModal;
