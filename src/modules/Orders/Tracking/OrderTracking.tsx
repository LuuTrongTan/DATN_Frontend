import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Steps,
  Typography,
  Space,
  Descriptions,
  Table,
  Tag,
  Button,
  Timeline,
  Spin,
  Empty,
  message,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TruckOutlined,
  ShoppingOutlined,
  InboxOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { Order, OrderItem } from '../../../shares/types';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchOrderById, fetchOrderByNumber } from '../stores/ordersSlice';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const OrderTrackingPage: React.FC = () => {
  const { id, orderNumber } = useParams<{ id?: string; orderNumber?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const numericId = id ? Number(id) : NaN;
  const order = useAppSelector((state) =>
    !Number.isNaN(numericId) ? state.orders.byId[numericId] || null : null
  );
  const { detailLoading: loading } = useAppSelector((state) => state.orders);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(Number(id))).catch(() => {
        message.error('Không thể tải thông tin đơn hàng');
      });
    } else if (orderNumber) {
      dispatch(fetchOrderByNumber(orderNumber)).catch(() => {
        message.error('Không thể tải thông tin đơn hàng');
      });
    }
  }, [dispatch, id, orderNumber]);

  const getOrderStatusStep = (status: string) => {
    const statusMap: Record<string, number> = {
      pending: 0,
      processing: 1,
      shipping: 2,
      delivered: 3,
      cancelled: -1,
    };
    return statusMap[status] || 0;
  };

  const getOrderStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      pending: <ClockCircleOutlined />,
      processing: <InboxOutlined />,
      shipping: <TruckOutlined />,
      delivered: <CheckCircleOutlined />,
      cancelled: <CloseCircleOutlined />,
    };
    return iconMap[status] || <ClockCircleOutlined />;
  };

  const getOrderStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'blue',
      processing: 'orange',
      shipping: 'cyan',
      delivered: 'green',
      cancelled: 'red',
    };
    return colorMap[status] || 'default';
  };

  const getOrderStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      cancelled: 'Đã hủy',
    };
    return textMap[status] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'orange',
      paid: 'green',
      failed: 'red',
      refunded: 'purple',
    };
    return colorMap[status] || 'default';
  };

  const getPaymentStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thanh toán thất bại',
      refunded: 'Đã hoàn tiền',
    };
    return textMap[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product',
      key: 'product',
      render: (_: any, record: OrderItem) => (
        <Space>
          <img
            src={record.product?.image_url || 'https://via.placeholder.com/50'}
            alt={record.product?.name}
            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
          />
          <div>
            <Text strong>{record.product?.name}</Text>
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
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center' as const,
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Thành tiền',
      key: 'total',
      render: (_: any, record: OrderItem) => formatPrice(record.price * record.quantity),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <Card>
          <Empty description="Không tìm thấy đơn hàng" />
        </Card>
      </div>
    );
  }

  const currentStep = getOrderStatusStep(order.status);

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2}>Theo Dõi Đơn Hàng</Title>
            <Text type="secondary">Mã đơn hàng: {order.order_number}</Text>
          </div>
          <Button onClick={() => navigate('/orders')}>Quay lại danh sách</Button>
        </div>

        {order.status === 'cancelled' && order.cancellation_reason && (
          <Alert
            message="Đơn hàng đã bị hủy"
            description={
              <div>
                <Text strong>Lý do: </Text>
                <Text>{order.cancellation_reason}</Text>
                {order.cancelled_at && (
                  <>
                    <br />
                    <Text type="secondary">
                      Thời gian: {new Date(order.cancelled_at).toLocaleString('vi-VN')}
                    </Text>
                  </>
                )}
              </div>
            }
            type="error"
            showIcon
            icon={<CloseCircleOutlined />}
          />
        )}

        {order.status !== 'cancelled' && (
          <Card>
            <Steps current={currentStep} status={(order.status as string) === 'cancelled' ? 'error' : 'process'}>
              <Step title="Chờ xử lý" description="Đơn hàng đã được tạo" icon={<ClockCircleOutlined />} />
              <Step title="Đang xử lý" description="Đang chuẩn bị hàng" icon={<InboxOutlined />} />
              <Step title="Đang giao hàng" description="Đang trên đường giao" icon={<TruckOutlined />} />
              <Step title="Đã giao hàng" description="Giao hàng thành công" icon={<CheckCircleOutlined />} />
            </Steps>
          </Card>
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Thông tin đơn hàng" size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Mã đơn hàng">
                  <Text strong>#{order.order_number}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={getOrderStatusColor(order.status)} icon={getOrderStatusIcon(order.status)}>
                    {getOrderStatusText(order.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Thanh toán">
                  <Tag color={getPaymentStatusColor(order.payment_status)}>
                    {getPaymentStatusText(order.payment_status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Phương thức thanh toán">
                  {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày đặt hàng">
                  {new Date(order.created_at).toLocaleString('vi-VN')}
                </Descriptions.Item>
                {order.delivery_date && (
                  <Descriptions.Item label="Ngày giao dự kiến">
                    {new Date(order.delivery_date).toLocaleDateString('vi-VN')}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Thông tin giao hàng" size="small">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <Text strong>Người nhận: </Text>
                  <Text>{order.customer_name || order.shipping_address?.split('\n')[0]}</Text>
                </div>
                <div>
                  <PhoneOutlined style={{ marginRight: 8 }} />
                  <Text>{order.customer_phone || 'N/A'}</Text>
                </div>
                {order.customer_email && (
                  <div>
                    <MailOutlined style={{ marginRight: 8 }} />
                    <Text>{order.customer_email}</Text>
                  </div>
                )}
                <div>
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                    {order.shipping_address}
                  </Paragraph>
                </div>
                {order.notes && (
                  <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Ghi chú: {order.notes}
                    </Text>
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        <Card title="Sản phẩm đã đặt">
          <Table
            columns={columns}
            dataSource={order.items || []}
            rowKey="id"
            pagination={false}
            footer={() => (
              <div style={{ textAlign: 'right' }}>
                <Space direction="vertical" size="small" style={{ width: 300 }}>
                  {order.subtotal && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Tạm tính:</Text>
                      <Text>{formatPrice(order.subtotal)}</Text>
                    </div>
                  )}
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Giảm giá:</Text>
                      <Text type="danger">-{formatPrice(order.discount_amount)}</Text>
                    </div>
                  )}
                  {order.tax_amount && order.tax_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Thuế:</Text>
                      <Text>{formatPrice(order.tax_amount)}</Text>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                    <Text strong style={{ fontSize: 16 }}>
                      Tổng cộng:
                    </Text>
                    <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                      {formatPrice(order.total_amount)}
                    </Text>
                  </div>
                </Space>
              </div>
            )}
          />
        </Card>
      </Space>
    </div>
  );
};

export default OrderTrackingPage;

