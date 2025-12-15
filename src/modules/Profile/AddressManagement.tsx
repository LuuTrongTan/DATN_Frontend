import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Typography,
  Space,
  message,
  Popconfirm,
  Tag,
  Empty,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { addressService, UserAddress, CreateAddressInput, UpdateAddressInput } from '../../shares/services/addressService';

const { Title } = Typography;

const AddressManagement: React.FC = () => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressService.getAddresses();
      if (response.success && response.data) {
        setAddresses(response.data);
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAddress(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (address: UserAddress) => {
    setEditingAddress(address);
    form.setFieldsValue(address);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
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

  const handleSubmit = async (values: CreateAddressInput | UpdateAddressInput) => {
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

  const columns = [
    {
      title: 'Họ và tên',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Địa chỉ',
      key: 'address',
      render: (_: any, record: UserAddress) => (
        <div>
          {record.street_address}, {record.ward}, {record.district}, {record.province}
        </div>
      ),
    },
    {
      title: 'Mặc định',
      dataIndex: 'is_default',
      key: 'is_default',
      align: 'center' as const,
      render: (isDefault: boolean) =>
        isDefault ? (
          <Tag icon={<CheckCircleOutlined />} color="green">
            Mặc định
          </Tag>
        ) : null,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: UserAddress) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa địa chỉ này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Quản lý địa chỉ</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Thêm địa chỉ mới
        </Button>
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : addresses.length === 0 ? (
          <Empty description="Chưa có địa chỉ nào">
            <Button type="primary" onClick={handleCreate}>
              Thêm địa chỉ đầu tiên
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={addresses}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>

      <Modal
        title={editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Họ và tên"
            name="full_name"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input placeholder="Nhập họ và tên người nhận" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            label="Tỉnh/Thành phố"
            name="province"
            rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
          >
            <Input placeholder="Nhập tỉnh/thành phố" />
          </Form.Item>

          <Form.Item
            label="Quận/Huyện"
            name="district"
            rules={[{ required: true, message: 'Vui lòng nhập quận/huyện' }]}
          >
            <Input placeholder="Nhập quận/huyện" />
          </Form.Item>

          <Form.Item
            label="Phường/Xã"
            name="ward"
            rules={[{ required: true, message: 'Vui lòng nhập phường/xã' }]}
          >
            <Input placeholder="Nhập phường/xã" />
          </Form.Item>

          <Form.Item
            label="Địa chỉ cụ thể"
            name="street_address"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ cụ thể' }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập số nhà, tên đường, tòa nhà..." />
          </Form.Item>

          <Form.Item name="is_default" valuePropName="checked">
            <input type="checkbox" /> Đặt làm địa chỉ mặc định
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingAddress ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddressManagement;


