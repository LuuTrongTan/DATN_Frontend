import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Divider } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, SaveOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../shares/contexts/AuthContext';
import { authService } from '../../shares/services/authService';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const updateData: { full_name?: string; phone?: string } = {};
      
      if (values.full_name) {
        updateData.full_name = values.full_name;
      }
      if (values.phone) {
        updateData.phone = values.phone;
      }

      const response = await authService.updateProfile(updateData);
      
      if (response.success) {
        message.success('Cập nhật thông tin thành công!');
        // Refresh user data
        window.location.reload();
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>Thông tin cá nhân</Title>
      
      <Card style={{ marginTop: 24, maxWidth: 600 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="full_name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Nhập họ và tên"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Nhập email"
              size="large"
              disabled
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Nhập số điện thoại"
              size="large"
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                Lưu thông tin
              </Button>
              <Button
                onClick={() => form.resetFields()}
                size="large"
              >
                Đặt lại
              </Button>
              <Button
                icon={<LockOutlined />}
                onClick={() => navigate('/profile/change-password')}
                size="large"
              >
                Đổi mật khẩu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Profile;

