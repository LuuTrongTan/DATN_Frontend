import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space, 
  message, 
  Divider,
  Row,
  Col,
  Tabs,
  Empty,
  Spin,
  Modal,
  Popconfirm,
  Tag,
  Checkbox,
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  SaveOutlined, 
  LockOutlined, 
  EnvironmentOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../../shares/contexts/AuthContext';
import { authService } from '../../../shares/services/authService';
import { addressService, UserAddress, CreateAddressInput, UpdateAddressInput } from '../../../shares/services/addressService';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Profile: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [addressForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [verifyEmailModalVisible, setVerifyEmailModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    // Set form values from user context (no need to fetch on mount)
    if (user) {
      form.setFieldsValue({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Update when user changes

  const fetchAddresses = async () => {
    try {
      setAddressLoading(true);
      const response = await addressService.getAddresses();
      if (response.success && response.data) {
        setAddresses(response.data);
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải địa chỉ');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const updateData: { full_name?: string; phone?: string; email?: string } = {};
      
      if (values.full_name) {
        updateData.full_name = values.full_name;
      }
      if (values.phone) {
        updateData.phone = values.phone;
      }
      if (values.email && values.email !== user?.email) {
        updateData.email = values.email;
      }

      const response = await authService.updateProfile(updateData);
      
      if (response.success) {
        message.success('Cập nhật thông tin thành công!');
        // Update user data from response (backend returns updated user)
        if (response.data?.user) {
          const updatedUser = response.data.user;
          // Update user in AuthContext without reloading page
          const token = localStorage.getItem('token');
          if (token) {
            login(token, updatedUser);
          }
          // Update form with new data
          form.setFieldsValue({
            full_name: updatedUser.full_name || '',
            email: updatedUser.email || '',
            phone: updatedUser.phone || '',
          });
        } else {
          // Fallback: fetch user data if not in response
        try {
          const userResponse = await authService.getCurrentUser();
          if (userResponse.success && userResponse.data) {
            const userData = userResponse.data.data;
              const token = localStorage.getItem('token');
              if (token) {
                login(token, userData);
              }
              form.setFieldsValue({
                full_name: userData.full_name || '',
                email: userData.email || '',
                phone: userData.phone || '',
              });
          }
          } catch (error: any) {
            console.error('Error refreshing user data:', error);
            // If refresh fails, still show success message since update was successful
          }
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = () => {
    setEditingAddress(null);
    addressForm.resetFields();
    setModalVisible(true);
  };

  const handleEditAddress = (address: UserAddress) => {
    setEditingAddress(address);
    addressForm.setFieldsValue(address);
    setModalVisible(true);
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      const response = await addressService.deleteAddress(id);
      if (response.success) {
        message.success('Xóa địa chỉ thành công');
        fetchAddresses();
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi xóa địa chỉ');
    }
  };

  const handleSubmitAddress = async (values: CreateAddressInput | UpdateAddressInput) => {
    try {
      if (editingAddress) {
        const response = await addressService.updateAddress(editingAddress.id, values);
        if (response.success) {
          message.success('Cập nhật địa chỉ thành công');
          setModalVisible(false);
          fetchAddresses();
        }
      } else {
        const response = await addressService.createAddress(values as CreateAddressInput);
        if (response.success) {
          message.success('Thêm địa chỉ thành công');
          setModalVisible(false);
          fetchAddresses();
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleSendVerificationCode = async () => {
    if (!user?.email) {
      message.error('Vui lòng thêm email trước khi xác thực');
      return;
    }

    try {
      setSendingOtp(true);
      const response = await authService.resendVerification(user.email);
      if (response.success) {
        message.success('Đã gửi mã xác thực đến email của bạn. Vui lòng kiểm tra hộp thư.');
        setVerifyEmailModalVisible(true);
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể gửi mã xác thực');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!otpCode || otpCode.length !== 6) {
      message.error('Vui lòng nhập mã xác thực 6 chữ số');
      return;
    }

    if (!user?.email) {
      message.error('Không tìm thấy email để xác thực');
      return;
    }

    try {
      setVerifyingOtp(true);
      const response = await authService.verify(otpCode, user.email);
      if (response.success) {
        message.success('Xác thực email thành công!');
        setVerifyEmailModalVisible(false);
        setOtpCode('');
        // Refresh user data without reloading page
        try {
          const userResponse = await authService.getCurrentUser();
          if (userResponse.success && userResponse.data?.user) {
            const userData = userResponse.data.user;
            // Update user in AuthContext
            const token = localStorage.getItem('token');
            const refreshToken = localStorage.getItem('refreshToken') || undefined;
            if (token) {
              login(token, userData, refreshToken);
            }
            // Update form with new data
            form.setFieldsValue({
              full_name: userData.full_name || '',
              email: userData.email || '',
              phone: userData.phone || '',
            });
          }
        } catch (error: any) {
          console.error('Error refreshing user data:', error);
          // Still show success message since verification was successful
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Mã xác thực không đúng');
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="profile-page" style={{ padding: '2rem' }}>
      <Title 
        level={2} 
        style={{ 
          marginBottom: '2rem',
          // Gradient tiêu đề đồng bộ với navbar (hồng / cam nhạt)
          background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.9) 0%, rgba(255, 218, 185, 0.9) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
        }}
      >
        Hồ sơ cá nhân
      </Title>
      
      <Tabs 
        defaultActiveKey="info" 
        size="large"
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        }}
        items={[
          {
            key: 'info',
            label: (
              <span>
                <UserOutlined /> Thông tin cá nhân
              </span>
            ),
            children: (
              <Card
                style={{
                  border: 'none',
                  boxShadow: 'none',
                  background: 'transparent',
                }}
              >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
                  {/* Banner cảnh báo nếu email chưa được xác thực */}
                  {user?.email && !user?.email_verified && (
                    <Card
                      style={{
                        marginBottom: '24px',
                        background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.15) 0%, rgba(255, 218, 185, 0.15) 100%)',
                        border: '1px solid rgba(255, 60, 60, 0.3)',
                        borderRadius: '12px',
                      }}
                    >
                      <Space>
                        <ExclamationCircleOutlined style={{ color: '#ff3c3c', fontSize: '20px' }} />
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ color: '#ff3c3c', display: 'block', marginBottom: '4px' }}>
                            Email chưa được xác thực
                          </Text>
                          <Text type="secondary" style={{ fontSize: '14px' }}>
                            Email của bạn ({user.email}) chưa được xác thực. Vui lòng xác thực để đảm bảo tài khoản an toàn.
                          </Text>
                        </div>
                        <Button
                          type="primary"
                          icon={<SafetyOutlined />}
                          onClick={handleSendVerificationCode}
                          loading={sendingOtp}
                          style={{
                            background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.9) 0%, rgba(255, 218, 185, 0.9) 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                          }}
                        >
                          Xác thực email
                        </Button>
                      </Space>
                    </Card>
                  )}

                  <Row gutter={[24, 0]}>
                    <Col xs={24} md={12}>
          <Form.Item
            name="full_name"
                        label={<Text strong>Họ và tên</Text>}
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input
                          prefix={<UserOutlined style={{ color: '#ff3c3c' }} />}
              placeholder="Nhập họ và tên"
              size="large"
                          style={{
                            borderRadius: '12px',
                            border: '1px solid #e0e0e0',
                            transition: 'all 0.3s ease',
                          }}
            />
          </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
          <Form.Item
            name="email"
                        label={
                          <Space>
                            <Text strong>Email</Text>
                            {user?.email && user?.email_verified && (
                              <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0 }}>
                                Đã xác thực
                              </Tag>
                            )}
                          </Space>
                        }
            rules={[
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
                          prefix={<MailOutlined style={{ color: '#ff3c3c' }} />}
              placeholder="Nhập email"
              size="large"
                          style={{
                            borderRadius: '12px',
                            border: '1px solid #e0e0e0',
                            transition: 'all 0.3s ease',
                          }}
            />
          </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
          <Form.Item
            name="phone"
                        label={<Text strong>Số điện thoại</Text>}
            rules={[
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' },
            ]}
          >
            <Input
                          prefix={<PhoneOutlined style={{ color: '#ff3c3c' }} />}
              placeholder="Nhập số điện thoại"
              size="large"
                          style={{
                            borderRadius: '12px',
                            border: '1px solid #e0e0e0',
                            transition: 'all 0.3s ease',
                          }}
            />
          </Form.Item>
                    </Col>
                  </Row>

          <Divider />

          <Form.Item>
                    <Space size="middle">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
                        style={{
                          // Nút primary đồng bộ với navbar (gradient hồng / cam)
                          background: 'linear-gradient(135deg, rgba(255, 182, 193, 1) 0%, rgba(255, 218, 185, 1) 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          height: '48px',
                          padding: '0 32px',
                          fontWeight: 600,
                          boxShadow: '0 4px 12px rgba(255, 182, 193, 0.5)',
                        }}
              >
                Lưu thông tin
              </Button>
              <Button
                onClick={() => form.resetFields()}
                size="large"
                        style={{
                          borderRadius: '12px',
                          height: '48px',
                        }}
              >
                Đặt lại
              </Button>
              <Button
                icon={<LockOutlined />}
                onClick={() => navigate('/profile/change-password')}
                size="large"
                        style={{
                          borderRadius: '12px',
                          height: '48px',
                        }}
              >
                Đổi mật khẩu
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'addresses',
            label: (
              <span>
                <EnvironmentOutlined /> Địa chỉ giao hàng
              </span>
            ),
            children: (
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 24 
                }}>
                  <Text strong style={{ fontSize: '16px' }}>Danh sách địa chỉ</Text>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleCreateAddress}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      height: '40px',
                      fontWeight: 600,
                    }}
                  >
                    Thêm địa chỉ mới
                  </Button>
                </div>

                {addressLoading ? (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                  </div>
                ) : addresses.length === 0 ? (
                  <Empty 
                    description="Chưa có địa chỉ nào"
                    style={{ padding: '50px 0' }}
                  >
                    <Button 
                      type="primary" 
                      onClick={handleCreateAddress}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '12px',
                      }}
                    >
                      Thêm địa chỉ đầu tiên
                    </Button>
                  </Empty>
                ) : (
                  <Row gutter={[16, 16]}>
                    {addresses.map((address) => (
                      <Col xs={24} md={12} key={address.id}>
                        <Card
                          style={{
                            borderRadius: '16px',
                            border: address.is_default ? '2px solid #667eea' : '1px solid #e0e0e0',
                            boxShadow: address.is_default 
                              ? '0 4px 16px rgba(102, 126, 234, 0.2)' 
                              : '0 2px 8px rgba(0, 0, 0, 0.08)',
                            transition: 'all 0.3s ease',
                            height: '100%',
                          }}
                          hoverable
                        >
                          <div style={{ marginBottom: '12px' }}>
                            {address.is_default && (
                              <Tag 
                                icon={<CheckCircleOutlined />} 
                                color="#52c41a"
                                style={{ marginBottom: '8px' }}
                              >
                                Mặc định
                              </Tag>
                            )}
                            <Text strong style={{ fontSize: '16px', display: 'block' }}>
                              {address.full_name}
                            </Text>
                            <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
                              {address.phone}
                            </Text>
                          </div>
                          <Text style={{ color: '#666', lineHeight: '1.6' }}>
                            {address.street_address}, {address.ward}, {address.district}, {address.province}
                          </Text>
                          <Divider style={{ margin: '16px 0' }} />
                          <Space>
                            <Button
                              type="link"
                              icon={<EditOutlined />}
                              onClick={() => handleEditAddress(address)}
                              style={{ padding: 0 }}
                            >
                              Sửa
                            </Button>
                            <Popconfirm
                              title="Bạn có chắc muốn xóa địa chỉ này?"
                              onConfirm={() => handleDeleteAddress(address.id)}
                              okText="Xóa"
                              cancelText="Hủy"
                            >
                              <Button 
                                type="link" 
                                danger 
                                icon={<DeleteOutlined />}
                                style={{ padding: 0 }}
                              >
                                Xóa
                              </Button>
                            </Popconfirm>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Modal thêm/sửa địa chỉ */}
      <Modal
        title={
          <span style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600,
          }}>
            {editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        style={{ borderRadius: '16px' }}
      >
        <Form
          form={addressForm}
          layout="vertical"
          onFinish={handleSubmitAddress}
        >
          <Form.Item
            label={<Text strong>Họ và tên</Text>}
            name="full_name"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input 
              placeholder="Nhập họ và tên người nhận" 
              size="large"
              style={{ borderRadius: '12px' }}
            />
          </Form.Item>

          <Form.Item
            label={<Text strong>Số điện thoại</Text>}
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' },
            ]}
          >
            <Input 
              placeholder="Nhập số điện thoại" 
              size="large"
              style={{ borderRadius: '12px' }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label={<Text strong>Tỉnh/Thành phố</Text>}
                name="province"
                rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
              >
                <Input 
                  placeholder="Tỉnh/TP" 
                  size="large"
                  style={{ borderRadius: '12px' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<Text strong>Quận/Huyện</Text>}
                name="district"
                rules={[{ required: true, message: 'Vui lòng nhập quận/huyện' }]}
              >
                <Input 
                  placeholder="Quận/Huyện" 
                  size="large"
                  style={{ borderRadius: '12px' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<Text strong>Phường/Xã</Text>}
                name="ward"
                rules={[{ required: true, message: 'Vui lòng nhập phường/xã' }]}
              >
                <Input 
                  placeholder="Phường/Xã" 
                  size="large"
                  style={{ borderRadius: '12px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<Text strong>Địa chỉ cụ thể</Text>}
            name="street_address"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ cụ thể' }]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Nhập số nhà, tên đường, tòa nhà..." 
              style={{ borderRadius: '12px' }}
            />
          </Form.Item>

          <Form.Item name="is_default" valuePropName="checked">
            <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  height: '40px',
                  padding: '0 24px',
                  fontWeight: 600,
                }}
              >
                {editingAddress ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button
                onClick={() => setModalVisible(false)}
                style={{ borderRadius: '12px', height: '40px' }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xác thực email */}
      <Modal
        title={
          <span style={{ 
            background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.9) 0%, rgba(255, 218, 185, 0.9) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600,
          }}>
            Xác thực email
          </span>
        }
        open={verifyEmailModalVisible}
        onCancel={() => {
          setVerifyEmailModalVisible(false);
          setOtpCode('');
        }}
        footer={null}
        width={500}
        style={{ borderRadius: '16px' }}
      >
        <div style={{ padding: '8px 0' }}>
          <Text style={{ display: 'block', marginBottom: '16px', color: '#666' }}>
            Chúng tôi đã gửi mã xác thực 6 chữ số đến email <Text strong>{user?.email}</Text>. 
            Vui lòng kiểm tra hộp thư và nhập mã bên dưới.
          </Text>
          
          <Form.Item
            label={<Text strong>Mã xác thực</Text>}
            style={{ marginBottom: '24px' }}
          >
            <Input
              placeholder="Nhập mã 6 chữ số"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              size="large"
              style={{
                borderRadius: '12px',
                textAlign: 'center',
                fontSize: '20px',
                letterSpacing: '8px',
                fontWeight: 600,
              }}
            />
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button
              onClick={() => {
                setVerifyEmailModalVisible(false);
                setOtpCode('');
              }}
              style={{ borderRadius: '12px' }}
            >
              Hủy
            </Button>
            <Space>
              <Button
                onClick={handleSendVerificationCode}
                loading={sendingOtp}
                style={{ borderRadius: '12px' }}
              >
                Gửi lại mã
              </Button>
              <Button
                type="primary"
                onClick={handleVerifyEmail}
                loading={verifyingOtp}
                disabled={otpCode.length !== 6}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.9) 0%, rgba(255, 218, 185, 0.9) 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                }}
              >
                Xác thực
              </Button>
            </Space>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;

