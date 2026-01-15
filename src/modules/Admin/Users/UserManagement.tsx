import React, { useEffect, useState, useRef } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UserOutlined,
  SearchOutlined,
  TeamOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import { adminService, UpdateUserRequest } from '../../../shares/services/adminService';
import { User } from '../../../shares/types';
import { useEffectOnce } from '../../../shares/hooks';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Dùng biến global để track request đang pending (tránh StrictMode gọi 2 lần)
let globalFetchingUsers = false;

interface UserManagementProps {
  showTitle?: boolean;
  withCard?: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({
  showTitle = true,
  withCard = true,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Sử dụng useEffectOnce để tránh gọi API 2 lần trong StrictMode (lần fetch đầu tiên)
  useEffectOnce(() => {
    fetchUsers();
  });

  // Gọi lại khi roleFilter thay đổi
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    // Tránh gọi trùng lặp (ngay cả trong StrictMode) - dùng biến global
    if (globalFetchingUsers) {
      return;
    }

    globalFetchingUsers = true;

    try {
      setLoading(true);
      const response = await adminService.getUsers({
        role: roleFilter || undefined,
        limit: 100,
      });
      
      if (response.users) {
        setUsers(response.users);
        setFilteredUsers(response.users);
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải danh sách người dùng');
    } finally {
      setLoading(false);
      // Reset flag sau một khoảng thời gian ngắn để cho phép gọi lại
      setTimeout(() => {
        globalFetchingUsers = false;
      }, 100);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      status: user.status,
      role: user.role,
      email: user.email,
    });
    setIsModalVisible(true);
  };

  const handleUpdate = async (values: any) => {
    try {
      if (!editingUser) return;

      const updateData: UpdateUserRequest = {
        status: values.status,
        role: values.role,
        email: values.email,
      };

      if (values.password) {
        updateData.password = values.password;
      }

      await adminService.updateUser(editingUser.id, updateData);
      message.success('Cập nhật người dùng thành công');
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi cập nhật người dùng');
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const filterUsers = () => {
    let filtered = users;
    
    if (searchQuery) {
      filtered = filtered.filter(user =>
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.phone && user.phone.includes(searchQuery)) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredUsers(filtered);
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
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colorMap: Record<string, string> = {
          admin: 'red',
          staff: 'blue',
          customer: 'green',
        };
        const labelMap: Record<string, string> = {
          admin: 'Quản trị viên',
          staff: 'Nhân viên',
          customer: 'Khách hàng',
        };
        return <Tag color={colorMap[role]}>{labelMap[role] || role}</Tag>;
      },
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
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: User) => (
        <Tooltip title={record.role === 'customer' ? 'Không cho phép thao tác với tài khoản khách hàng' : 'Chỉnh sửa'}>
          <Button
            type="link"
            icon={<EditOutlined />}
            disabled={record.role === 'customer'}
            onClick={() => handleEdit(record)}
          >
            Chỉnh sửa
          </Button>
        </Tooltip>
      ),
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
            <UserOutlined /> Quản lý người dùng
          </Title>
        )}
        <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
          Làm mới
        </Button>
      </div>

      {/* Thống kê nhanh */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic
              title="Tổng người dùng"
              value={filteredUsers.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic
              title="Khách hàng"
              value={filteredUsers.filter(u => u.role === 'customer').length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic
              title="Nhân viên"
              value={filteredUsers.filter(u => u.role === 'staff').length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic
              title="Đã khóa"
              value={filteredUsers.filter(u => u.status === 'banned').length}
              prefix={<UserDeleteOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
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
              enterButton
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo vai trò"
              allowClear
              value={roleFilter || undefined}
              onChange={(value) => setRoleFilter(value || '')}
            >
              <Option value="customer">Khách hàng</Option>
              <Option value="staff">Nhân viên</Option>
              <Option value="admin">Quản trị viên</Option>
            </Select>
          </Col>
        </Row>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} người dùng`,
        }}
      />
    </>
  );

  return (
    <>
      {withCard ? <Card>{mainContent}</Card> : mainContent}

      <Modal
        title="Chỉnh sửa người dùng"
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select>
              <Option value="customer">Khách hàng</Option>
              <Option value="staff">Nhân viên</Option>
              <Option value="admin">Quản trị viên</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Option value="active">Hoạt động</Option>
              <Option value="banned">Đã khóa</Option>
              <Option value="deleted">Đã xóa</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới (để trống nếu không đổi)"
            name="password"
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserManagement;
