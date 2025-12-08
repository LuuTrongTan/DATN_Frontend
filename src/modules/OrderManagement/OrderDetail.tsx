import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Space,
  Tag,
  Descriptions,
  Button,
  Table,
  Image,
  Spin,
  Empty,
  message,
  Divider,
  Row,
  Col,
  Statistic,
  Timeline,
} from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { orderService } from '../../shares/services/orderService';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '../../shares/types';

const { Title, Text } = Typography;

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderById(Number(id));
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        message.error('Không tìm thấy đơn hàng');
        navigate('/orders');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải đơn hàng');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'orange',
      confirmed: 'blue',
      processing: 'cyan',
      shipping: 'purple',
      delivered: 'green',
      cancelled: 'red',
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
      pending: 'orange',
      paid: 'green',
      failed: 'red',
      refunded: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: OrderStatus) => {
    const texts: Record<OrderStatus, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      cancelled: 'Đã hủy',
    };
    return texts[status] || status;
  };

  const getPaymentStatusText = (status: PaymentStatus) => {
    const texts: Record<PaymentStatus, string> = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thanh toán thất bại',
      refunded: 'Đã hoàn tiền',
    };
    return texts[status] || status;
  };

  const getStatusTimeline = (status: OrderStatus) => {
    const statuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipping', 'delivered'];
    const currentIndex = statuses.indexOf(status);
    
    return statuses.map((s, index) => ({
      color: index <= currentIndex ? 'green' : 'gray',
      children: getStatusText(s),
    }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Empty description="Không tìm thấy đơn hàng" />
        <Button onClick={() => navigate('/orders')}>Quay lại danh sách</Button>
      </div>
    );
  }

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_: any, record: OrderItem) => (
        <Space>
          {record.product?.image_urls?.[0] && (
            <Image
              src={record.product.image_urls[0]}
              alt={record.product.name}
              width={60}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 4 }}
            />
          )}
          <div>
            <Text strong>{record.product?.name || 'Sản phẩm'}</Text>
            {record.variant && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.variant.variant_type}: {record.variant.variant_value}
                </Text>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      align: 'right' as const,
      render: (price: number) => `${price.toLocaleString('vi-VN')} VNĐ`,
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
      render: (_: any, record: OrderItem) => (
        <Text strong>
          {(record.price * record.quantity).toLocaleString('vi-VN')} VNĐ
        </Text>
      ),
    },
  ];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/orders')}
        style={{ marginBottom: 24 }}
      >
        Quay lại
      </Button>

      <Title level={2}>Chi tiết đơn hàng</Title>

      <Row gutter={[24, 24]}>
        {/* Thông tin đơn hàng */}
        <Col xs={24} lg={16}>
          <Card title="Thông tin đơn hàng" style={{ marginBottom: 24 }}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Mã đơn hàng">
                <Text strong style={{ fontSize: 16 }}>
                  #{order.order_number}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái đơn hàng">
                <Tag color={getStatusColor(order.order_status)} style={{ fontSize: 14 }}>
                  {getStatusText(order.order_status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái thanh toán">
                <Tag color={getPaymentStatusColor(order.payment_status)} style={{ fontSize: 14 }}>
                  {getPaymentStatusText(order.payment_status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức thanh toán">
                <Text>
                  {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán online'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ giao hàng">
                <Text>{order.shipping_address}</Text>
              </Descriptions.Item>
              {order.notes && (
                <Descriptions.Item label="Ghi chú">
                  <Text>{order.notes}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Ngày đặt hàng">
                <Text>{new Date(order.created_at).toLocaleString('vi-VN')}</Text>
              </Descriptions.Item>
              {order.updated_at !== order.created_at && (
                <Descriptions.Item label="Cập nhật lần cuối">
                  <Text>{new Date(order.updated_at).toLocaleString('vi-VN')}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Sản phẩm trong đơn hàng */}
          <Card title="Sản phẩm trong đơn hàng">
            <Table
              columns={columns}
              dataSource={order.items || []}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>

        {/* Tóm tắt và trạng thái */}
        <Col xs={24} lg={8}>
          <Card title="Tóm tắt đơn hàng">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Row justify="space-between">
                <Text>Tạm tính:</Text>
                <Text>
                  {(order.total_amount - order.shipping_fee).toLocaleString('vi-VN')} VNĐ
                </Text>
              </Row>
              <Row justify="space-between">
                <Text>Phí vận chuyển:</Text>
                <Text>{order.shipping_fee.toLocaleString('vi-VN')} VNĐ</Text>
              </Row>
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between">
                <Text strong style={{ fontSize: 18 }}>
                  Tổng cộng:
                </Text>
                <Text strong style={{ fontSize: 18, color: '#cf1322' }}>
                  {order.total_amount.toLocaleString('vi-VN')} VNĐ
                </Text>
              </Row>
            </Space>
          </Card>

          {/* Timeline trạng thái */}
          <Card title="Trạng thái đơn hàng" style={{ marginTop: 24 }}>
            <Timeline items={getStatusTimeline(order.order_status)} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OrderDetail;
