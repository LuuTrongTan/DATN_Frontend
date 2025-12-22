import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService, LoginRequest } from '../../shares/services/authService';
import { useAuth } from '../../shares/contexts/AuthContext';
import { detectInputType } from '../../shares/utils';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setAuth } = useAuth();

  // Prefill từ trang verify (hoặc nơi khác) nếu có
  useEffect(() => {
    const state = location.state as { emailOrPhone?: string } | null;
    if (state?.emailOrPhone) {
      form.setFieldsValue({ emailOrPhone: state.emailOrPhone });
    }
  }, [location.state, form]);

  const onFinish = async (values: LoginRequest & { emailOrPhone?: string }) => {
    const emailOrPhone = values.emailOrPhone || values.email || values.phone;
    
    if (!emailOrPhone) {
      message.error('Vui lòng nhập email hoặc số điện thoại!');
      return;
    }

    const detectedType = detectInputType(emailOrPhone);
    
    if (!detectedType) {
      message.error('Vui lòng nhập email hoặc số điện thoại hợp lệ!');
      return;
    }

    setLoading(true);
    try {
      // Prepare login data based on detected type
      const loginData: LoginRequest = {
        password: values.password,
        ...(detectedType === 'email' 
          ? { email: emailOrPhone } 
          : { phone: emailOrPhone }
        ),
      };

      const response = await authService.login(loginData);
      
      if (response.success && response.data) {
        const { token, refreshToken, user } = response.data;
        setAuth(token, user, refreshToken);
        message.success('Đăng nhập thành công!');
        // Xóa dữ liệu verify tạm thời nếu có
        sessionStorage.removeItem('pendingLoginEmail');
        sessionStorage.removeItem('pendingLoginPhone');
        // Redirect based on role
        if (user.role === 'admin' || user.role === 'staff') {
          navigate('/dashboard');
        } else {
          navigate('/home');
        }
      } else {
        message.error(response.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      // Xử lý trường hợp tài khoản chưa được xác thực
      if (error.code === 'ACCOUNT_NOT_VERIFIED') {
        const detectedType = detectInputType(emailOrPhone);
        const email = detectedType === 'email' ? emailOrPhone : undefined;
        const phone = detectedType === 'phone' ? emailOrPhone : undefined;
        
        // KHÔNG lưu mật khẩu vào storage (rủi ro bảo mật). Chỉ lưu định danh để hỗ trợ verify/resend.
        sessionStorage.setItem('pendingLoginEmail', email || '');
        sessionStorage.setItem('pendingLoginPhone', phone || '');
        
        message.warning({
          content: 'Tài khoản chưa được xác thực. Vui lòng xác thực tài khoản trước khi đăng nhập.',
          duration: 5,
        });
        
        // Chuyển đến trang verify với thông tin email/phone
        setTimeout(() => {
          navigate('/verify', {
            state: {
              email,
              phone,
              fromLogin: true, // Đánh dấu là từ trang login
            }
          });
        }, 1500);
      } else {
        message.error(error.message || 'Có lỗi xảy ra khi đăng nhập');
      }
    } finally {
      setLoading(false);
    }
  };

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
            <Title level={2} style={{ marginBottom: 8 }}>Đăng nhập</Title>
            <Text type="secondary">Chào mừng bạn trở lại!</Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="emailOrPhone"
              label="Email hoặc Số điện thoại"
              rules={[
                { required: true, message: 'Vui lòng nhập email hoặc số điện thoại!' },
                {
                  validator: (_, value) => {
                    if (!value) {
                      return Promise.reject(new Error('Vui lòng nhập email hoặc số điện thoại!'));
                    }
                    const type = detectInputType(value);
                    if (!type) {
                      return Promise.reject(new Error('Email hoặc số điện thoại không hợp lệ!'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Nhập email hoặc số điện thoại"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Nhập mật khẩu"
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
                Đăng nhập
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Link to="/forgot-password">
                  <Text type="secondary">Quên mật khẩu?</Text>
                </Link>
                <Text type="secondary">
                  Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </Text>
              </Space>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
