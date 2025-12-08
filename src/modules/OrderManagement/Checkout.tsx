import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Radio,
  Row,
  Col,
  Divider,
  Table,
  message,
  Spin,
  Empty,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { cartService } from '../../shares/services/cartService';
import { orderService } from '../../shares/services/orderService';
import { CartItem, PaymentMethod } from '../../shares/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      if (response.success && response.data) {
        const items = response.data || [];
        if (items.length === 0) {
          message.warning('Giỏ hàng trống');
          navigate('/cart');
          return;
        }
        setCartItems(items);
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải giỏ hàng');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0
    );
    const shippingFee = 30000; // Phí ship cố định
    return {
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
    };
  };

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      const totals = calculateTotal();

      const orderData = {
        shipping_address: values.shipping_address,
        payment_method: paymentMethod,
        shipping_fee: totals.shippingFee,
        notes: values.notes || undefined,
      };

      const response = await orderService.createOrder(orderData);

      if (response.success) {
        message.success('Đặt hàng thành công!');
        navigate(`/orders/${response.data?.id}`);
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Empty description="Giỏ hàng trống" />
        <Button onClick={() => navigate('/cart')}>Quay lại giỏ hàng</Button>
      </div>
    );
  }

  const totals = calculateTotal();

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_: any, record: CartItem) => (
        <Space>
          {record.product?.image_urls?.[0] && (
            <img
              src={record.product.image_urls[0]}
              alt={record.product.name}
              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
            />
          )}
          <div>
            <Text strong>{record.product?.name || 'Sản phẩm'}</Text>
            <br />
            <Text type="secondary">
              {record.product?.price.toLocaleString('vi-VN')} VNĐ
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center' as const,
    },
    {
      title: 'Thành tiền',
      key: 'total',
      align: 'right' as const,
      render: (_: any, record: CartItem) => (
        <Text strong>
          {((record.product?.price || 0) * record.quantity).toLocaleString('vi-VN')} VNĐ
        </Text>
      ),
    },
  ];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/cart')}
        style={{ marginBottom: 24 }}
      >
        Quay lại giỏ hàng
      </Button>

      <Title level={2}>Thanh toán</Title>

      <Row gutter={[24, 24]}>
        {/* Form thông tin giao hàng */}
        <Col xs={24} lg={14}>
          <Card title="Thông tin giao hàng">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                payment_method: 'cod',
              }}
            >
              <Form.Item
                label="Địa chỉ giao hàng"
                name="shipping_address"
                rules={[
                  { required: true, message: 'Vui lòng nhập địa chỉ giao hàng' },
                  { min: 10, message: 'Địa chỉ phải có ít nhất 10 ký tự' },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Nhập địa chỉ giao hàng đầy đủ (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
                />
              </Form.Item>

              <Form.Item
                label="Ghi chú (tùy chọn)"
                name="notes"
              >
                <TextArea
                  rows={3}
                  placeholder="Ghi chú cho đơn hàng..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Divider />

              <Form.Item label="Phương thức thanh toán">
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <Space direction="vertical">
                    <Radio value="cod">
                      <Space>
                        <DollarOutlined />
                        <Text strong>Thanh toán khi nhận hàng (COD)</Text>
                      </Space>
                    </Radio>
                    <Radio value="online" disabled>
                      <Space>
                        <ShoppingCartOutlined />
                        <Text type="secondary">Thanh toán online (Sắp có)</Text>
                      </Space>
                    </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>

              {paymentMethod === 'cod' && (
                <Alert
                  message="Bạn sẽ thanh toán khi nhận hàng"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              )}

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={submitting}
                  block
                >
                  Đặt hàng
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Tóm tắt đơn hàng */}
        <Col xs={24} lg={10}>
          <Card title="Tóm tắt đơn hàng">
            <Table
              columns={columns}
              dataSource={cartItems}
              rowKey="id"
              pagination={false}
              size="small"
            />

            <Divider />

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Row justify="space-between">
                <Text>Tạm tính:</Text>
                <Text>{totals.subtotal.toLocaleString('vi-VN')} VNĐ</Text>
              </Row>
              <Row justify="space-between">
                <Text>Phí vận chuyển:</Text>
                <Text>{totals.shippingFee.toLocaleString('vi-VN')} VNĐ</Text>
              </Row>
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between">
                <Text strong style={{ fontSize: 18 }}>
                  Tổng cộng:
                </Text>
                <Text strong style={{ fontSize: 18, color: '#cf1322' }}>
                  {totals.total.toLocaleString('vi-VN')} VNĐ
                </Text>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Checkout;
