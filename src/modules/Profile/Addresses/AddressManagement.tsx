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
  Select,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { addressService, UserAddress, CreateAddressInput, UpdateAddressInput } from '../../../shares/services/addressService';
import { provincesService, Province, District, Ward } from '../../../shares/services/provincesService';

const { Title } = Typography;

const AddressManagement: React.FC = () => {
  console.log('[AddressManagement] Component rendering...');
  
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [form] = Form.useForm();

  // Provinces data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Selected values
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);
  const [selectedWardCode, setSelectedWardCode] = useState<string | null>(null);

  // Fetch addresses
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

  // Fetch provinces
  const fetchProvinces = async () => {
    try {
      console.log('[AddressManagement] fetchProvinces called');
      setLoadingProvinces(true);
      const response = await provincesService.getProvinces();
      console.log('[AddressManagement] fetchProvinces response:', response);
      if (response.success && response.data) {
        setProvinces(response.data);
        console.log('[AddressManagement] Provinces loaded:', response.data.length);
      } else {
        console.error('[AddressManagement] Failed to load provinces:', response.message);
        message.error(response.message || 'Không thể tải danh sách tỉnh/thành phố');
      }
    } catch (error: any) {
      console.error('[AddressManagement] Error fetching provinces:', error);
      message.error('Không thể tải danh sách tỉnh/thành phố');
    } finally {
      setLoadingProvinces(false);
    }
  };

  // Fetch districts
  const fetchDistricts = async (provinceCode: number) => {
    try {
      setLoadingDistricts(true);
      setDistricts([]);
      setWards([]);
      setSelectedDistrictCode(null);
      form.setFieldsValue({ district: undefined, ward: undefined });

      const response = await provincesService.getDistricts(provinceCode);
      if (response.success && response.data) {
        setDistricts(response.data);
      } else {
        message.error(response.message || 'Không thể tải danh sách quận/huyện');
      }
    } catch (error: any) {
      message.error('Không thể tải danh sách quận/huyện');
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Fetch wards
  const fetchWards = async (districtCode: number) => {
    try {
      setLoadingWards(true);
      setWards([]);
      form.setFieldsValue({ ward: undefined });

      const response = await provincesService.getWards(districtCode);
      if (response.success && response.data) {
        setWards(response.data);
      } else {
        message.error(response.message || 'Không thể tải danh sách phường/xã');
      }
    } catch (error: any) {
      message.error('Không thể tải danh sách phường/xã');
    } finally {
      setLoadingWards(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    console.log('[AddressManagement] Component mounted, loading data...');
    const loadData = async () => {
      try {
        await fetchAddresses();
      } catch (error) {
        console.error('Error loading addresses:', error);
      }
      
      try {
        console.log('[AddressManagement] Loading provinces on mount...');
        await fetchProvinces();
      } catch (error) {
        console.error('Error loading provinces:', error);
      }
    };
    
    loadData();
  }, []);

  // Handle province change
  const handleProvinceChange = (provinceCode: number) => {
    setSelectedProvinceCode(provinceCode);
    fetchDistricts(provinceCode);
  };

  // Handle district change
  const handleDistrictChange = (districtCode: number) => {
    setSelectedDistrictCode(districtCode);
    fetchWards(districtCode);
  };

  const handleCreate = async () => {
    console.log('[AddressManagement] handleCreate called');
    console.log('[AddressManagement] Current provinces state:', provinces.length);
    
    setEditingAddress(null);
    setSelectedProvinceCode(null);
    setSelectedDistrictCode(null);
    setSelectedWardCode(null);
    setDistricts([]);
    setWards([]);
    form.resetFields();
    
    // ALWAYS ensure provinces are loaded when opening modal
    console.log('[AddressManagement] Ensuring provinces are loaded...');
    if (provinces.length === 0) {
      console.log('[AddressManagement] Provinces empty, fetching now...');
      await fetchProvinces();
    } else {
      console.log('[AddressManagement] Provinces already loaded:', provinces.length);
    }
    
    console.log('[AddressManagement] Opening modal...');
    setModalVisible(true);
  };

  const handleEdit = async (address: UserAddress) => {
    setEditingAddress(address);
    
    // Dùng trực tiếp mã GHN đã lưu để nạp lại danh sách
    setSelectedProvinceCode(address.province_code);
    setSelectedDistrictCode(address.district_code);
    setSelectedWardCode(address.ward_code);

    const districtsResponse = await provincesService.getDistricts(address.province_code);
    if (districtsResponse.success && districtsResponse.data) {
      setDistricts(districtsResponse.data);
      const wardsResponse = await provincesService.getWards(address.district_code);
      if (wardsResponse.success && wardsResponse.data) {
        setWards(wardsResponse.data);
      }
    }
    
    form.setFieldsValue({
      province: address.province,
      district: address.district,
      ward: address.ward,
      street_address: address.street_address,
      is_default: address.is_default,
    });
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
        const response = await addressService.updateAddress(editingAddress.id, {
          ...values,
          province_code: selectedProvinceCode ?? editingAddress.province_code,
          district_code: selectedDistrictCode ?? editingAddress.district_code,
          ward_code: selectedWardCode ?? editingAddress.ward_code,
        });
        if (response.success) {
          message.success('Cập nhật địa chỉ thành công');
          setModalVisible(false);
          fetchAddresses();
        }
      } else {
        // Khi tạo mới, luôn yêu cầu đã chọn province/district/ward (và mã tương ứng)
        if (!selectedProvinceCode || !selectedDistrictCode || !selectedWardCode) {
          message.error('Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã');
          return;
        }

        const createPayload: CreateAddressInput = {
          province: values.province as string,
          district: values.district as string,
          ward: values.ward as string,
          street_address: values.street_address as string,
          is_default: values.is_default,
          province_code: selectedProvinceCode,
          district_code: selectedDistrictCode,
          ward_code: selectedWardCode,
        };

        const response = await addressService.createAddress(createPayload);
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
            label="Tỉnh/Thành phố"
            name="province"
            rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
          >
            <Select
              placeholder="Chọn tỉnh/thành phố"
              loading={loadingProvinces}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
          options={provinces.map(p => ({
            value: p.name,
            label: p.name,
            code: p.code,
          }))}
              onChange={(value, option) => {
                const code = (option as any)?.code;
                if (code) {
                  handleProvinceChange(code);
              setSelectedProvinceCode(code);
              setSelectedDistrictCode(null);
              setSelectedWardCode(null);
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label="Quận/Huyện"
            name="district"
            rules={[{ required: true, message: 'Vui lòng chọn quận/huyện' }]}
          >
            <Select
              placeholder="Chọn quận/huyện"
              loading={loadingDistricts}
              disabled={!selectedProvinceCode}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
          options={districts.map(d => ({
            value: d.name,
            label: d.name,
            code: d.code,
          }))}
              onChange={(value, option) => {
                const code = (option as any)?.code;
                if (code) {
                  handleDistrictChange(code);
              setSelectedDistrictCode(code);
              setSelectedWardCode(null);
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label="Phường/Xã"
            name="ward"
            rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
          >
            <Select
              placeholder="Chọn phường/xã"
              loading={loadingWards}
              disabled={!selectedDistrictCode}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
          options={wards.map(w => ({
            value: w.name,
            label: w.name,
            code: w.code,
          }))}
          onChange={(value, option) => {
            const code = (option as any)?.code;
            if (code) {
              setSelectedWardCode(String(code));
            }
          }}
            />
          </Form.Item>

          <Form.Item
            label="Địa chỉ cụ thể"
            name="street_address"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ cụ thể' }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập số nhà, tên đường, tòa nhà..." />
          </Form.Item>

          <Form.Item name="is_default" valuePropName="checked" style={{ marginBottom: 8 }}>
            <Switch />
          </Form.Item>
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginLeft: 8 }}>Đặt làm địa chỉ mặc định</span>
          </div>

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
