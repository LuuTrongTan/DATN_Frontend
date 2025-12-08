import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { MailOutlined, PhoneOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../shares/services/authService';

const { Title, Text } = Typography;

const ForgotPassword: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const [forgotType, setForgotType] = useState<'email' | 'phone'>('email');

  const onFinish = async (values: { email?: string; phone?: string }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(values.email, values.phone);
      setSubmitted(true);
      message.success('Đã gửi mã đặt lại mật khẩu thành công!');
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
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
            <Title level={3}>Đã gửi mã thành công!</Title>
            <Text type="secondary">
              Chúng tôi đã gửi mã đặt lại mật khẩu đến {forgotType === 'email' ? 'email' : 'số điện thoại'} của bạn.
              Vui lòng kiểm tra và làm theo hướng dẫn.
            </Text>
            <Button type="primary" onClick={() => navigate('/login')} block>
              Quay lại đăng nhập
            </Button>
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
            <Title level={2} style={{ marginBottom: 8 }}>Quên mật khẩu</Title>
            <Text type="secondary">Nhập {forgotType === 'email' ? 'email' : 'số điện thoại'} để nhận mã đặt lại mật khẩu</Text>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Button.Group>
              <Button 
                type={forgotType === 'email' ? 'primary' : 'default'}
                onClick={() => {
                  setForgotType('email');
                  form.setFieldsValue({ phone: undefined });
                }}
                icon={<MailOutlined />}
              >
                Email
              </Button>
              <Button 
                type={forgotType === 'phone' ? 'primary' : 'default'}
                onClick={() => {
                  setForgotType('phone');
                  form.setFieldsValue({ email: undefined });
                }}
                icon={<PhoneOutlined />}
              >
                Số điện thoại
              </Button>
            </Button.Group>
          </div>

          <Form
            form={form}
            name="forgotPassword"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            {forgotType === 'email' ? (
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Nhập email của bạn"
                />
              </Form.Item>
            ) : (
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="Nhập số điện thoại"
                />
              </Form.Item>
            )}

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                style={{ height: 45 }}
              >
                Gửi mã đặt lại mật khẩu
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Link to="/login">
                <Button type="link" icon={<ArrowLeftOutlined />}>
                  Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default ForgotPassword;
