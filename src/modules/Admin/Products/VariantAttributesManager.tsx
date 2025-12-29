import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Typography,
  Divider,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { variantService } from '../../../shares/services/variantService';
import { productService } from '../../../shares/services/productService';
import { VariantAttributeDefinition, VariantAttributeValue } from '../../../shares/types';

const { Title, Text } = Typography;
const { Option } = Select;

interface VariantAttributesManagerProps {
  productId: number;
  onAttributesChange?: () => void;
}

const VariantAttributesManager: React.FC<VariantAttributesManagerProps> = ({
  productId,
  onAttributesChange,
}) => {
  const [definitions, setDefinitions] = useState<VariantAttributeDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [definitionModalOpen, setDefinitionModalOpen] = useState(false);
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<any[]>([]);
  const [editingDefinition, setEditingDefinition] = useState<VariantAttributeDefinition | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<VariantAttributeDefinition | null>(null);
  const [definitionForm] = Form.useForm();
  const [valueForm] = Form.useForm();
  const [copyForm] = Form.useForm();

  useEffect(() => {
    if (productId) {
      fetchDefinitions();
    }
  }, [productId]);

  const fetchDefinitions = async () => {
    try {
      setLoading(true);
      const response = await variantService.getAttributeDefinitions(productId);
      if (response.success && response.data) {
        setDefinitions(response.data || []);
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi tải định nghĩa thuộc tính');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefinition = async (values: any) => {
    try {
      await variantService.createAttributeDefinition(productId, {
        attribute_name: values.attribute_name,
        display_name: values.display_name,
        display_order: values.display_order || 0,
        is_required: values.is_required || false,
      });
      message.success('Tạo định nghĩa thuộc tính thành công');
      setDefinitionModalOpen(false);
      definitionForm.resetFields();
      await fetchDefinitions();
      onAttributesChange?.();
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi tạo định nghĩa thuộc tính');
    }
  };

  const handleDeleteDefinition = async (id: number) => {
    try {
      await variantService.deleteAttributeDefinition(id);
      message.success('Xóa định nghĩa thuộc tính thành công');
      await fetchDefinitions();
      onAttributesChange?.();
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi xóa định nghĩa thuộc tính');
    }
  };

  const handleCreateValue = async (values: any) => {
    if (!selectedDefinition) return;
    try {
      await variantService.createAttributeValue(selectedDefinition.id, {
        value: values.value,
        display_order: values.display_order || 0,
      });
      message.success('Thêm giá trị thành công');
      setValueModalOpen(false);
      valueForm.resetFields();
      setSelectedDefinition(null);
      await fetchDefinitions();
      onAttributesChange?.();
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi thêm giá trị');
    }
  };

  const handleDeleteValue = async (id: number) => {
    try {
      await variantService.deleteAttributeValue(id);
      message.success('Xóa giá trị thành công');
      await fetchDefinitions();
      onAttributesChange?.();
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi xóa giá trị');
    }
  };

  const openValueModal = (definition: VariantAttributeDefinition) => {
    setSelectedDefinition(definition);
    setValueModalOpen(true);
  };

  const handleOpenCopyModal = async () => {
    try {
      setCopyModalOpen(true);
      // Load danh sách sản phẩm có thuộc tính
      const productsResponse = await productService.getProducts({ limit: 100 });
      if (productsResponse.success && productsResponse.data) {
        setAvailableProducts(productsResponse.data.data || []);
      }
      // Load danh sách thuộc tính có sẵn
      const attrsResponse = await variantService.getAllAttributeDefinitions({
        exclude_product_id: productId,
      });
      if (attrsResponse.success && attrsResponse.data) {
        setAvailableAttributes(attrsResponse.data || []);
      }
    } catch (error: any) {
      message.error('Lỗi khi tải danh sách sản phẩm');
    }
  };

  const handleCopyAttributes = async (values: any) => {
    try {
      setCopying(true);
      const response = await variantService.copyAttributesFromProduct(productId, {
        source_product_id: values.source_product_id,
        attribute_names: values.attribute_names,
      });
      if (response.success) {
        message.success(response.data?.message || 'Copy thuộc tính thành công');
        setCopyModalOpen(false);
        copyForm.resetFields();
        await fetchDefinitions();
        onAttributesChange?.();
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi copy thuộc tính');
    } finally {
      setCopying(false);
    }
  };

  const definitionColumns = [
    {
      title: 'Tên thuộc tính',
      key: 'attribute_name',
      render: (_: any, record: VariantAttributeDefinition) => (
        <Space>
          <Text strong>{record.attribute_name}</Text>
          <Tag color="blue">{record.display_name}</Tag>
          {record.is_required && <Tag color="red">Bắt buộc</Tag>}
        </Space>
      ),
    },
    {
      title: 'Giá trị',
      key: 'values',
      render: (_: any, record: VariantAttributeDefinition) => (
        <Space wrap>
          {record.values && record.values.length > 0 ? (
            record.values.map((val: VariantAttributeValue) => (
              <Tag key={val.id}>
                {val.value}
                <Popconfirm
                  title="Xóa giá trị này?"
                  onConfirm={() => handleDeleteValue(val.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    style={{ marginLeft: 4 }}
                  />
                </Popconfirm>
              </Tag>
            ))
          ) : (
            <Text type="secondary">Chưa có giá trị</Text>
          )}
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => openValueModal(record)}
          >
            Thêm giá trị
          </Button>
        </Space>
      ),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'display_order',
      key: 'display_order',
      align: 'center' as const,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: VariantAttributeDefinition) => (
        <Popconfirm
          title="Xóa định nghĩa này sẽ xóa tất cả giá trị. Bạn có chắc?"
          onConfirm={() => handleDeleteDefinition(record.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>
              Quản lý thuộc tính biến thể
            </Title>
            <Button
              type="default"
              icon={<CopyOutlined />}
              onClick={handleOpenCopyModal}
            >
              Dùng lại từ sản phẩm khác
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingDefinition(null);
                definitionForm.resetFields();
                setDefinitionModalOpen(true);
              }}
            >
              Thêm thuộc tính
            </Button>
          </Space>
        }
      >
        <Table
          columns={definitionColumns}
          dataSource={definitions}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* Modal tạo định nghĩa thuộc tính */}
      <Modal
        title="Thêm thuộc tính biến thể"
        open={definitionModalOpen}
        onCancel={() => {
          setDefinitionModalOpen(false);
          definitionForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={definitionForm}
          layout="vertical"
          onFinish={handleCreateDefinition}
          initialValues={{ display_order: 0, is_required: false }}
        >
          <Form.Item
            label="Tên thuộc tính (key)"
            name="attribute_name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên thuộc tính' },
              { pattern: /^[A-Z][a-zA-Z0-9]*$/, message: 'Phải bắt đầu bằng chữ hoa, không có khoảng trắng (ví dụ: Size, Color)' },
            ]}
            tooltip="Tên dùng trong code, ví dụ: Size, Color, Material"
          >
            <Input placeholder="Size" />
          </Form.Item>

          <Form.Item
            label="Tên hiển thị"
            name="display_name"
            rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị' }]}
            tooltip="Tên hiển thị cho người dùng, ví dụ: Kích cỡ, Màu sắc"
          >
            <Input placeholder="Kích cỡ" />
          </Form.Item>

          <Form.Item label="Thứ tự hiển thị" name="display_order">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Bắt buộc" name="is_required" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Tạo
              </Button>
              <Button
                onClick={() => {
                  setDefinitionModalOpen(false);
                  definitionForm.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal thêm giá trị */}
      <Modal
        title={`Thêm giá trị cho "${selectedDefinition?.display_name}"`}
        open={valueModalOpen}
        onCancel={() => {
          setValueModalOpen(false);
          valueForm.resetFields();
          setSelectedDefinition(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={valueForm}
          layout="vertical"
          onFinish={handleCreateValue}
          initialValues={{ display_order: 0 }}
        >
          <Form.Item
            label="Giá trị"
            name="value"
            rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
          >
            <Input placeholder="Ví dụ: M, L, XL hoặc Đỏ, Xanh" />
          </Form.Item>

          <Form.Item label="Thứ tự hiển thị" name="display_order">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Thêm
              </Button>
              <Button
                onClick={() => {
                  setValueModalOpen(false);
                  valueForm.resetFields();
                  setSelectedDefinition(null);
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal copy thuộc tính từ sản phẩm khác */}
      <Modal
        title="Dùng lại thuộc tính từ sản phẩm khác"
        open={copyModalOpen}
        onCancel={() => {
          setCopyModalOpen(false);
          copyForm.resetFields();
        }}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form
          form={copyForm}
          layout="vertical"
          onFinish={handleCopyAttributes}
        >
          <Form.Item
            label="Chọn sản phẩm nguồn"
            name="source_product_id"
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
            tooltip="Chọn sản phẩm có thuộc tính bạn muốn dùng lại"
          >
            <Select
              placeholder="Chọn sản phẩm..."
              showSearch
              filterOption={(input, option: any) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={async (productId) => {
                // Load thuộc tính của sản phẩm được chọn
                try {
                  const response = await variantService.getAttributeDefinitions(productId);
                  if (response.success && response.data) {
                    // Cập nhật available attributes
                    setAvailableAttributes(response.data || []);
                    copyForm.setFieldsValue({ attribute_names: undefined });
                  }
                } catch (error) {
                  console.error('Error loading attributes:', error);
                }
              }}
            >
              {availableProducts
                .filter((p: any) => p.id !== productId)
                .map((product: any) => (
                  <Option key={product.id} value={product.id} label={product.name}>
                    {product.name} (ID: {product.id})
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Chọn thuộc tính cần copy"
            name="attribute_names"
            tooltip="Để trống để copy tất cả thuộc tính"
          >
            <Select
              mode="multiple"
              placeholder="Chọn thuộc tính (để trống = copy tất cả)..."
              allowClear
            >
              {availableAttributes.map((attr: any) => (
                <Option key={attr.attribute_name} value={attr.attribute_name}>
                  {attr.display_name} ({attr.attribute_name}) - {attr.values?.length || 0} giá trị
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={copying}>
                Copy
              </Button>
              <Button
                onClick={() => {
                  setCopyModalOpen(false);
                  copyForm.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VariantAttributesManager;

