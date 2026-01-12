import React, { useState } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  Button,
  Space,
  Table,
  Checkbox,
  Typography,
  Alert,
  message,
  Tag,
  Image,
} from 'antd';
import { Order, OrderItem, RefundType } from '../../../shares/types';
import { refundService } from '../../../shares/services/refundService';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

interface RefundRequestFormProps {
  order: Order;
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const RefundRequestForm: React.FC<RefundRequestFormProps> = ({
  order,
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const handleItemToggle = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    
    // Cập nhật form values
    const items = Array.from(newSelected).map(id => {
      const orderItem = order.items?.find(item => item.id === id);
      return {
        order_item_id: id,
        quantity: orderItem?.quantity || 1,
        reason: '',
      };
    });
    form.setFieldsValue({ items });
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    const currentItems = form.getFieldValue('items') || [];
    const updatedItems = currentItems.map((item: any) =>
      item.order_item_id === itemId ? { ...item, quantity } : item
    );
    form.setFieldsValue({ items: updatedItems });
  };

  const handleSubmit = async (values: any) => {
    if (selectedItems.size === 0) {
      message.warning('Vui lòng chọn ít nhất một sản phẩm để refund');
      return;
    }

    try {
      setLoading(true);
      const response = await refundService.createRefund({
        order_id: order.id,
        type: values.type,
        reason: values.reason,
        items: values.items || [],
      });

      if (response.success) {
        message.success('Tạo yêu cầu refund thành công');
        form.resetFields();
        setSelectedItems(new Set());
        onSuccess();
        onCancel();
      } else {
        message.error(response.message || 'Lỗi khi tạo yêu cầu refund');
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi tạo yêu cầu refund');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Chọn',
      dataIndex: 'id',
      key: 'select',
      width: 60,
      render: (_: any, record: OrderItem) => (
        <Checkbox
          checked={selectedItems.has(record.id)}
          onChange={() => handleItemToggle(record.id)}
        />
      ),
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_: any, record: OrderItem) => (
        <Space>
          {record.product?.image_urls && record.product.image_urls.length > 0 && (
            <Image
              src={record.product.image_urls[0]}
              alt={record.product.name}
              width={50}
              height={50}
              style={{ objectFit: 'cover', borderRadius: 4 }}
            />
          )}
          <div>
            <div>{record.product?.name || 'Sản phẩm'}</div>
            {record.variant && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {Object.entries(record.variant.variant_attributes || {})
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 120,
      render: (_: any, record: OrderItem) => {
        const isSelected = selectedItems.has(record.id);
        if (!isSelected) {
          return <Text>{record.quantity}</Text>;
        }
        const currentItems = form.getFieldValue('items') || [];
        const item = currentItems.find((i: any) => i.order_item_id === record.id);
        const currentQuantity = item?.quantity || record.quantity;
        
        return (
          <Input
            type="number"
            min={1}
            max={record.quantity}
            value={currentQuantity}
            onChange={(e) => {
              const qty = parseInt(e.target.value) || 1;
              handleQuantityChange(record.id, Math.min(Math.max(1, qty), record.quantity));
            }}
            style={{ width: 80 }}
          />
        );
      },
    },
    {
      title: 'Giá',
      key: 'price',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: OrderItem) => {
        const price = typeof record.price === 'string' ? parseFloat(record.price) : record.price;
        return `${price.toLocaleString('vi-VN')} VNĐ`;
      },
    },
  ];

  // Kiểm tra order có thể refund không
  const canRefund = order.status === 'delivered' || order.status === 'cancelled';
  const hasPendingRefund = order.refunds?.some(r => ['pending', 'approved', 'processing'].includes(r.status));

  return (
    <Modal
      title="Yêu cầu hoàn tiền/đổi trả"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      {!canRefund && (
        <Alert
          message="Không thể yêu cầu refund"
          description="Chỉ có thể yêu cầu refund cho đơn hàng đã giao hoặc đã hủy"
          type="warning"
          style={{ marginBottom: 16 }}
        />
      )}

      {hasPendingRefund && (
        <Alert
          message="Đã có yêu cầu refund đang xử lý"
          description="Đơn hàng này đã có yêu cầu refund đang được xử lý. Vui lòng chờ phản hồi từ admin."
          type="info"
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          type: 'refund',
        }}
      >
        <Form.Item
          label="Loại yêu cầu"
          name="type"
          rules={[{ required: true, message: 'Vui lòng chọn loại yêu cầu' }]}
        >
          <Select>
            <Option value="refund">
              <Tag color="blue">Hoàn tiền</Tag>
            </Option>
            <Option value="return">
              <Tag color="orange">Trả hàng</Tag>
            </Option>
            <Option value="exchange">
              <Tag color="green">Đổi hàng</Tag>
            </Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Chọn sản phẩm"
          required
        >
          <Table
            columns={columns}
            dataSource={order.items || []}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Form.Item>

        <Form.Item
          label="Lý do"
          name="reason"
          rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
        >
          <TextArea
            rows={4}
            placeholder="Nhập lý do yêu cầu refund..."
          />
        </Form.Item>

        <Form.Item name="items" hidden>
          <Input />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} disabled={!canRefund || hasPendingRefund}>
              Gửi yêu cầu
            </Button>
            <Button onClick={onCancel}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RefundRequestForm;
