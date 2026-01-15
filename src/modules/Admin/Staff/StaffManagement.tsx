import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Card,
  Alert,
  Row,
  Col,
  Statistic,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
  CopyOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { adminService, CreateStaffRequest } from '../../../shares/services/adminService';
import { User } from '../../../shares/types';
import { useEffectOnce } from '../../../shares/hooks';

const { Title, Text } = Typography;
const { Search } = Input;

interface StaffManagementProps {
  showTitle?: boolean;
  withCard?: boolean;
}

const StaffManagement: React.FC<StaffManagementProps> = ({
  showTitle = true,
  withCard = true,
}) => {
  const [staffs, setStaffs] = useState<User[]>([]);
  const [filteredStaffs, setFilteredStaffs] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newStaffPassword, setNewStaffPassword] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [form] = Form.useForm();

  // Sử dụng useEffectOnce để tránh gọi API 2 lần trong StrictMode
  useEffectOnce(() => {
    fetchStaffs();
  }, []);

  useEffect(() => {
    filterStaffs();
  }, [searchQuery, staffs]);

  const filterStaffs = () => {
    if (searchQuery) {
      const filtered = staffs.filter(staff =>
        (staff.email && staff.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (staff.phone && staff.phone.includes(searchQuery)) ||
        (staff.full_name && staff.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredStaffs(filtered);
    } else {
      setFilteredStaffs(staffs);
    }
  };

  const fetchStaffs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers({
        role: 'staff',
        limit: 100,
      });
      
      if (response.users) {
        setStaffs(response.users);
        setFilteredStaffs(response.users);
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: CreateStaffRequest) => {
    try {
      const response = await adminService.createStaff(values);
      if (response?.staff) {
        // Dev: backend trả về defaultPassword, hiển thị trong modal để admin copy
        if (response.defaultPassword) {
          setNewStaffPassword(response.defaultPassword);
          setIsModalVisible(true);
        } else {
          // Production: backend KHÔNG trả về mật khẩu -> đóng modal luôn
          setNewStaffPassword('');
          setIsModalVisible(false);
        }

        message.success(response.message || 'Tạo tài khoản nhân viên thành công');
        form.resetFields();
        fetchStaffs();
      } else {
        message.error('Tạo tài khoản nhân viên không thành công. Vui lòng thử lại.');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tạo tài khoản nhân viên');
    }
  };

  const handleCopyPassword = () => {
    if (newStaffPassword) {
      navigator.clipboard.writeText(newStaffPassword);
      message.success('Đã sao chép mật khẩu');
    }
  };

  const handleClosePasswordModal = () => {
    setNewStaffPassword('');
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number) => (
        <Tooltip title={id}>
          <Text
            copyable={{ text: String(id) }}
            style={{
              cursor: 'pointer',
              maxWidth: 140,
              display: 'inline-block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              verticalAlign: 'middle',
            }}
          >
            {id}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => text || '-',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => text || '-',
    },
    {
      title: 'Họ tên',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text: string) => text || '-',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: User) => {
        const isActive = record.status === 'active';
        const isBanned = record.status === 'banned';
        return (
          <Space>
            <Tag color={isActive ? 'green' : 'red'}>
              {isActive ? 'Hoạt động' : 'Không hoạt động'}
            </Tag>
            {isBanned && <Tag color="red">Đã khóa</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleDateString('vi-VN'),
    },
  ];

  const mainContent = (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        {showTitle && (
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> Quản lý nhân viên
          </Title>
        )}
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchStaffs}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setIsModalVisible(true);
              setNewStaffPassword('');
            }}
          >
            Tạo nhân viên mới
          </Button>
        </Space>
      </div>

      {/* Thống kê nhanh */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Tổng nhân viên"
              value={filteredStaffs.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={filteredStaffs.filter(s => s.status === 'active').length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8}>
          <Card>
            <Statistic
              title="Đã khóa"
              value={filteredStaffs.filter(s => s.status === 'banned').length}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 16 }}>
        <Search
          placeholder="Tìm kiếm theo email, số điện thoại, tên..."
          allowClear
          prefix={<SearchOutlined />}
          onSearch={(value) => setSearchQuery(value)}
          onChange={(e) => {
            if (!e.target.value) {
              setSearchQuery('');
            }
          }}
          style={{ width: 400 }}
          enterButton
        />
      </Space>

      <Table
        columns={columns}
        dataSource={filteredStaffs}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} nhân viên`,
        }}
      />
    </>
  );

  return (
    <>
      {withCard ? <Card>{mainContent}</Card> : mainContent}

      <Modal
        title={newStaffPassword ? "Tài khoản đã được tạo" : "Tạo tài khoản nhân viên mới"}
        open={isModalVisible}
        onCancel={handleClosePasswordModal}
        footer={newStaffPassword ? (
          <Button type="primary" onClick={handleClosePasswordModal}>
            Đóng
          </Button>
        ) : (
          [
            <Button key="cancel" onClick={handleClosePasswordModal}>
              Hủy
            </Button>,
            <Button key="submit" type="primary" onClick={() => form.submit()}>
              Tạo
            </Button>,
          ]
        )}
        width={600}
        destroyOnClose
      >
        {newStaffPassword ? (
          <div>
            <Alert
              message="Tài khoản nhân viên đã được tạo thành công!"
              description={
                <div>
                  <p><strong>Mật khẩu mặc định:</strong></p>
                  <Space>
                    <Input
                      value={newStaffPassword}
                      readOnly
                      style={{ fontFamily: 'monospace', fontSize: 16 }}
                    />
                    <Button
                      icon={<CopyOutlined />}
                      onClick={handleCopyPassword}
                    >
                      Sao chép
                    </Button>
                  </Space>
                  <p style={{ marginTop: 16, color: '#ff4d4f' }}>
                    <strong>Lưu ý:</strong> Vui lòng lưu lại mật khẩu này và yêu cầu nhân viên đổi mật khẩu sau khi đăng nhập lần đầu.
                  </p>
                </div>
              }
              type="success"
              showIcon
            />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { type: 'email', message: 'Email không hợp lệ' },
                {
                  validator: (_, value) => {
                    if (!value && !form.getFieldValue('phone')) {
                      return Promise.reject(new Error('Phải nhập email hoặc số điện thoại'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="Nhập email" />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                {
                  pattern: /^[0-9]{10}$/,
                  message: 'Số điện thoại phải có 10 chữ số',
                },
                {
                  validator: (_, value) => {
                    if (!value && !form.getFieldValue('email')) {
                      return Promise.reject(new Error('Phải nhập email hoặc số điện thoại'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="Nhập số điện thoại (10 chữ số)" maxLength={10} />
            </Form.Item>

            <Alert
              message="Thông tin"
              description="Tài khoản nhân viên sẽ được tạo với mật khẩu mặc định. Mật khẩu sẽ được hiển thị sau khi tạo thành công."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </Form>
        )}
      </Modal>
    </>
  );
};

export default StaffManagement;
