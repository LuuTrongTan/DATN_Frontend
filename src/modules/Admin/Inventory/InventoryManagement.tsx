import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  InputNumber,
  Select,
  message,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { inventoryService } from '../../../shares/services/inventoryService';
import AdminPageContent from '../../../shares/components/layouts/AdminPageContent';

const { TextArea } = Input;

const InventoryManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'in' | 'adjustment'>('in');

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (type === 'in') {
        const response = await inventoryService.stockIn({
          product_id: values.product_id || undefined,
          variant_id: values.variant_id || undefined,
          quantity: values.quantity,
          reason: values.reason,
        });
        if (response.success) {
          message.success('Nhập kho thành công');
          form.resetFields();
        }
      } else {
        const response = await inventoryService.stockAdjustment({
          product_id: values.product_id || undefined,
          variant_id: values.variant_id || undefined,
          new_quantity: values.new_quantity,
          reason: values.reason,
        });
        if (response.success) {
          message.success('Điều chỉnh kho thành công');
          form.resetFields();
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'in',
      label: 'Nhập kho',
      children: (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Mã sản phẩm"
            name="product_id"
            rules={[{ required: false }]}
          >
            <InputNumber placeholder="Để trống nếu là variant" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Mã biến thể"
            name="variant_id"
            rules={[{ required: false }]}
          >
            <InputNumber placeholder="Để trống nếu là sản phẩm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Số lượng nhập"
            name="quantity"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Lý do" name="reason">
            <TextArea rows={3} placeholder="Nhập lý do nhập kho..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
              Nhập kho
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'adjustment',
      label: 'Điều chỉnh kho',
      children: (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Mã sản phẩm"
            name="product_id"
            rules={[{ required: false }]}
          >
            <InputNumber placeholder="Để trống nếu là variant" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Mã biến thể"
            name="variant_id"
            rules={[{ required: false }]}
          >
            <InputNumber placeholder="Để trống nếu là sản phẩm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Số lượng mới"
            name="new_quantity"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng mới' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Lý do" name="reason">
            <TextArea rows={3} placeholder="Nhập lý do điều chỉnh..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<EditOutlined />}>
              Điều chỉnh
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <AdminPageContent title="Quản lý kho hàng" extra={null}>
      <Tabs
        items={tabItems}
        onChange={(key) => {
          setType(key as 'in' | 'adjustment');
          form.resetFields();
        }}
      />
    </AdminPageContent>
  );
};

export default InventoryManagement;


