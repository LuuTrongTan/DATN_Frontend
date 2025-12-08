import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../shares/services/authService';
import { useAuth } from '../../shares/contexts/AuthContext';

const { Title, Text } = Typography;

const VerifyAccount: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [verified, setVerified] = useState(false);
  const { login: setAuth } = useAuth();
  
  const { userId, email, phone, password, fromLogin } = location.state || {};
  
  // Lấy password từ sessionStorage (từ login hoặc register)
  const storedPassword = sessionStorage.getItem('pendingLoginPassword');
  const storedEmail = sessionStorage.getItem('pendingLoginEmail');
  const storedPhone = sessionStorage.getItem('pendingLoginPhone');
  
  // Ưu tiên dùng từ location.state, nếu không có thì dùng từ sessionStorage
  const verifyEmail = email || storedEmail || undefined;
  const verifyPhone = phone || storedPhone || undefined;
  const verifyPassword = password || storedPassword || undefined;

  useEffect(() => {
    // Nếu không có userId và không có email/phone, chuyển về trang đăng ký
    if (!userId && !email && !phone) {
      message.warning('Vui lòng đăng ký trước khi xác thực');
      navigate('/register');
    }
  }, [userId, email, phone, navigate]);

  const onFinish = async (values: { code: string }) => {
    setLoading(true);
    try {
      const response = await authService.verify(values.code, verifyEmail, verifyPhone);
      if (response.success) {
        setVerified(true);
        message.success('Xác thực thành công! Đang đăng nhập...');
        
        // Tự động đăng nhập sau khi xác thực thành công
        if (verifyPassword && (verifyEmail || verifyPhone)) {
          try {
            const loginResponse = await authService.login({
              email: verifyEmail,
              phone: verifyPhone,
              password: verifyPassword,
            });
            
            if (loginResponse.success && loginResponse.data) {
              const { token, user } = loginResponse.data;
              
              // Cập nhật AuthContext
              setAuth(token, user);
              
              // Xóa password tạm thời khỏi sessionStorage sau khi login thành công
              sessionStorage.removeItem('pendingLoginPassword');
              sessionStorage.removeItem('pendingLoginEmail');
              sessionStorage.removeItem('pendingLoginPhone');
              
              message.success('Đăng nhập thành công!');
              setTimeout(() => {
                navigate('/dashboard');
              }, 1000);
            } else {
              // Nếu đăng nhập thất bại, chuyển đến trang đăng nhập
              message.warning('Xác thực thành công nhưng đăng nhập thất bại. Vui lòng đăng nhập thủ công.');
              setTimeout(() => {
                navigate('/login');
              }, 2000);
            }
          } catch (loginError: any) {
            // Nếu đăng nhập thất bại, chuyển đến trang đăng nhập
            message.warning('Xác thực thành công nhưng đăng nhập thất bại. Vui lòng đăng nhập thủ công.');
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
        } else {
          // Nếu không có password, xóa thông tin tạm thời và chuyển đến trang đăng nhập
          sessionStorage.removeItem('pendingLoginPassword');
          sessionStorage.removeItem('pendingLoginEmail');
          sessionStorage.removeItem('pendingLoginPhone');
          message.success('Xác thực thành công! Vui lòng đăng nhập lại.');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else {
        message.error(response.message || 'Mã xác thực không đúng');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      await authService.resendVerification(email, phone);
      message.success('Đã gửi lại mã xác thực!');
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <Card style={{ width: '100%', maxWidth: 450, textAlign: 'center' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
            <Title level={3}>Xác thực thành công!</Title>
            <Text type="secondary">
              {password 
                ? 'Tài khoản của bạn đã được xác thực. Đang đăng nhập...' 
                : 'Tài khoản của bạn đã được xác thực. Đang chuyển đến trang đăng nhập...'}
            </Text>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: 450,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8 }}>Xác thực tài khoản</Title>
            <Text type="secondary">
              {fromLogin 
                ? `Chúng tôi sẽ gửi mã xác thực đến ${verifyEmail ? `email ${verifyEmail}` : `số điện thoại ${verifyPhone}`} sau khi bạn yêu cầu.`
                : `Chúng tôi đã gửi mã xác thực đến ${verifyEmail ? `email ${verifyEmail}` : `số điện thoại ${verifyPhone}`}`
              }
            </Text>
          </div>

          <Form
            form={form}
            name="verify"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="code"
              label="Mã xác thực"
              rules={[
                { required: true, message: 'Vui lòng nhập mã xác thực!' },
                { pattern: /^[0-9]{6}$/, message: 'Mã xác thực phải có 6 chữ số!' }
              ]}
            >
              <Input 
                placeholder="Nhập mã 6 chữ số"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                style={{ height: 45 }}
              >
                Xác thực
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Button 
                  type="link" 
                  onClick={handleResendCode}
                  loading={resending}
                  icon={<ReloadOutlined />}
                >
                  Gửi lại mã
                </Button>
                <Text type="secondary">
                  <Link to="/login">Quay lại đăng nhập</Link>
                </Text>
              </Space>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default VerifyAccount;
