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
  
  const { userId, email, phone, fromLogin } = location.state || {};
  
  const storedEmail = sessionStorage.getItem('pendingLoginEmail');
  const storedPhone = sessionStorage.getItem('pendingLoginPhone');
  
  // Ưu tiên dùng từ location.state, nếu không có thì dùng từ sessionStorage
  const verifyEmail = email || storedEmail || undefined;
  const verifyPhone = phone || storedPhone || undefined;

  useEffect(() => {
    // Nếu refresh trang verify thì location.state có thể mất; fallback qua sessionStorage
    if (!userId && !verifyEmail && !verifyPhone) {
      message.warning('Vui lòng đăng nhập/đăng ký trước khi xác thực');
      navigate('/login');
    }
  }, [userId, verifyEmail, verifyPhone, navigate]);

  const onFinish = async (values: { code: string }) => {
    setLoading(true);
    try {
      const response = await authService.verify(values.code, verifyEmail, verifyPhone);
      if (response.success) {
        setVerified(true);

        // Xóa thông tin tạm thời (không lưu mật khẩu trong storage)
        sessionStorage.removeItem('pendingLoginEmail');
        sessionStorage.removeItem('pendingLoginPhone');

        // Nếu user đang có token (đang đăng nhập), thử refresh thông tin
        // NHƯNG nếu token đã expired, không nên gọi getCurrentUser() vì sẽ bị 401
        const existingToken = localStorage.getItem('token');
        const existingRefreshToken = localStorage.getItem('refreshToken') || undefined;
        const existingUser = localStorage.getItem('user');

        if (existingToken && existingUser) {
          try {
            // Thử parse user từ localStorage để cập nhật email_verified/phone_verified
            let userData;
            try {
              userData = JSON.parse(existingUser);
            } catch {
              // Nếu parse lỗi, thử gọi API
              throw new Error('Invalid user data');
            }

            // Thử gọi getCurrentUser() để refresh user info
            // QUAN TRỌNG: Đặt flag để 401 handler không xóa token
            sessionStorage.setItem('isVerifying', 'true');
            
            try {
              const me = await authService.getCurrentUser();
              
              // Xóa flag sau khi gọi API thành công
              sessionStorage.removeItem('isVerifying');
              
              if (me.success && me.data?.user) {
                // Cập nhật user info với email_verified hoặc phone_verified mới
                const updatedUser = {
                  ...me.data.user,
                  email_verified: verifyEmail ? true : me.data.user.email_verified,
                  phone_verified: verifyPhone ? true : me.data.user.phone_verified,
                };
                setAuth(existingToken, updatedUser, existingRefreshToken);
                message.success('Xác thực thành công! Phiên đăng nhập được giữ nguyên.');
                navigate('/profile', { replace: true });
                return;
              }
            } catch (apiErr: any) {
              // Xóa flag sau khi gọi API thất bại
              sessionStorage.removeItem('isVerifying');
              
              // Log chi tiết để debug
              console.error('getCurrentUser failed after verify:', {
                error: apiErr,
                statusCode: apiErr.statusCode,
                message: apiErr.message,
                tokenExists: !!existingToken,
                currentPath: window.location.pathname
              });
              
              // Nếu getCurrentUser() thất bại (401 hoặc lỗi khác)
              // Vẫn cập nhật user từ localStorage với verified status mới
              // KHÔNG xóa token vì có thể token vẫn còn hợp lệ
              const updatedUser = {
                ...userData,
                email_verified: verifyEmail ? true : (userData.email_verified || false),
                phone_verified: verifyPhone ? true : (userData.phone_verified || false),
              };
              
              // Lưu lại user đã cập nhật
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setAuth(existingToken, updatedUser, existingRefreshToken);
              
              // Nếu là 401, có thể token đã expired hoặc có vấn đề khác
              if (apiErr.statusCode === 401) {
                message.warning('Xác thực thành công nhưng phiên đăng nhập có vấn đề. Vui lòng đăng nhập lại.');
              } else {
                message.success('Xác thực thành công! Phiên đăng nhập được giữ nguyên.');
                navigate('/profile', { replace: true });
                return;
              }
              
              navigate('/login', { 
                state: { 
                  emailOrPhone: verifyEmail || verifyPhone,
                  fromVerify: true
                },
                replace: true
              });
              return;
            }
          } catch (err: any) {
            // Nếu có lỗi khác, fallback xuống luồng đăng nhập lại
            console.error('Failed to refresh user after verify', err);
          }
        }

        // Nếu không có token (đang ở luồng đăng ký/đăng nhập chưa thành công), yêu cầu đăng nhập lại
        message.success('Xác thực thành công! Vui lòng đăng nhập lại.');
        const emailOrPhone = verifyEmail || verifyPhone;
        
        // Đảm bảo clear tất cả state trước khi navigate
        // Sử dụng setTimeout để đảm bảo message hiển thị trước khi navigate
        setTimeout(() => {
          // Sử dụng replace: true để tránh quay lại trang verify
          // Và đảm bảo state được truyền đúng
          navigate('/login', { 
            state: { 
              emailOrPhone,
              fromVerify: true // Đánh dấu là từ trang verify để tránh redirect về register
            },
            replace: true
          });
        }, 1500);
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
      await authService.resendVerification(verifyEmail, verifyPhone);
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
              Tài khoản của bạn đã được xác thực. Đang chuyển đến trang đăng nhập...
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
