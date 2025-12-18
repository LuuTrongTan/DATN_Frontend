import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Alert, Popconfirm } from 'antd';
import { LockOutlined, SaveOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import { authService } from '../../../shares/services/authService';
import { useAuth } from '../../../shares/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const ChangePassword: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const response = await authService.changePassword(values.oldPassword, values.newPassword);
      
      if (response.success) {
        message.success('Đổi mật khẩu thành công!');
        form.resetFields();
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setAccountActionLoading(true);
      const response = await authService.deactivateAccount();
      if (response.success) {
        message.success('Tài khoản của bạn đã được tạm khóa.');
        logout();
        navigate('/login');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tạm khóa tài khoản');
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setAccountActionLoading(true);
      const response = await authService.deleteAccount();
      if (response.success) {
        message.success('Tài khoản của bạn đã được xóa vĩnh viễn.');
        logout();
        navigate('/login');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi xóa tài khoản');
    } finally {
      setAccountActionLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>Bảo mật tài khoản</Title>
      
      <Card style={{ marginTop: 24, maxWidth: 600 }}>
        <Alert
          message="Lưu ý"
          description="Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Mật khẩu hiện tại"
            name="oldPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu hiện tại' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Mật khẩu phải có chữ hoa, chữ thường và số',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu mới"
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu mới"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                Đổi mật khẩu
              </Button>
              <Button onClick={() => form.resetFields()} size="large">
                Đặt lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        style={{ marginTop: 24, maxWidth: 600 }}
        title="Quản lý tài khoản"
        headStyle={{ color: '#cf1322' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="warning"
            showIcon
            message="Khu vực nguy hiểm"
            description="Các thao tác dưới đây có thể khiến bạn mất quyền truy cập vào tài khoản. Hãy cân nhắc kỹ trước khi thực hiện."
          />

          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <div>
              <Typography.Text strong>Tạm khóa tài khoản</Typography.Text>
              <br />
              <Typography.Text type="secondary">
                Bạn sẽ không thể đăng nhập cho đến khi được mở lại bởi hệ thống hoặc quản trị viên.
              </Typography.Text>
            </div>
            <Popconfirm
              title="Bạn chắc chắn muốn tạm khóa tài khoản?"
              okText="Đồng ý"
              cancelText="Hủy"
              onConfirm={handleDeactivateAccount}
            >
              <Button
                danger
                icon={<StopOutlined />}
                loading={accountActionLoading}
              >
                Tạm khóa
              </Button>
            </Popconfirm>
          </Space>

          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <div>
              <Typography.Text strong>Xóa tài khoản vĩnh viễn</Typography.Text>
              <br />
              <Typography.Text type="secondary">
                Tất cả dữ liệu liên quan đến tài khoản sẽ bị xóa (nếu chính sách hệ thống cho phép).
                Hành động này không thể hoàn tác.
              </Typography.Text>
            </div>
            <Popconfirm
              title="Bạn chắc chắn muốn xóa vĩnh viễn tài khoản?"
              okText="Xóa"
              okType="danger"
              cancelText="Hủy"
              onConfirm={handleDeleteAccount}
            >
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                loading={accountActionLoading}
              >
                Xóa tài khoản
              </Button>
            </Popconfirm>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default ChangePassword;
