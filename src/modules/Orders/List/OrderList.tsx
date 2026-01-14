import React, { useEffect, useState, useMemo } from 'react';
import { Card, Table, Tag, Typography, Space, Button, Empty, Tabs, Badge } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { Order, OrderStatus, PaymentStatus } from '../../../shares/types';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchOrders } from '../stores/ordersSlice';
import { orderService } from '../../../shares/services/orderService';
import { message, Popconfirm } from 'antd';

const { Title, Text } = Typography;

const OrderList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list: orders, listLoading: loading, listError: error } = useAppSelector((state) => state.orders);
  const navigate = useNavigate();
  const [cancellingId, setCancellingId] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Fetch orders khi component mount hoặc khi navigate vào trang
  // ProtectedRoute đã xử lý việc kiểm tra authentication và hiển thị modal
  useEffect(() => {
    dispatch(fetchOrders())
      .then((result) => {
        if (fetchOrders.rejected.match(result)) {
          const errorMessage =
            (result.payload as string | undefined) ||
            result.error?.message ||
            'Không thể tải danh sách đơn hàng';
          message.error(errorMessage);
        }
      })
      .catch(() => {
        message.error('Có lỗi xảy ra khi tải danh sách đơn hàng');
      });
  }, [dispatch]);

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

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      cancelled: 'Đã hủy',
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: PaymentStatus) => {
    const labels: Record<PaymentStatus, string> = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thanh toán thất bại',
      refunded: 'Đã hoàn tiền',
    };
    return labels[status] || status;
  };

  // Filter orders theo activeTab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') {
      return orders;
    }
    return orders.filter((order) => {
      const status = (order as any).order_status || (order as any).status;
      return status === activeTab;
    });
  }, [orders, activeTab]);

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text: string) => <Text strong>#{text}</Text>,
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return (
          <Text strong style={{ color: '#cf1322' }}>
            {numAmount.toLocaleString('vi-VN')} VNĐ
          </Text>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (_: any, record: Order) => {
        const status = (record as any).order_status || (record as any).status;
        return <Tag color={getStatusColor(status as OrderStatus)}>{getStatusLabel(status as OrderStatus)}</Tag>;
      },
    },
    {
      title: 'Thanh toán',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: PaymentStatus) => (
        <Tag color={getPaymentStatusColor(status)}>{getPaymentStatusLabel(status)}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/${record.id}`)}
          >
            Xem chi tiết
          </Button>
          {(() => {
            const status = (record as any).order_status || (record as any).status;
            const canCancel =
              ['pending', 'confirmed', 'processing'].includes(status) &&
              record.payment_status !== 'paid';
            if (!canCancel) return null;
            return (
              <Popconfirm
                title="Hủy đơn hàng?"
                okText="Hủy đơn"
                cancelText="Đóng"
                onConfirm={async () => {
                  try {
                    setCancellingId(record.id);
                    await orderService.cancelOrder(record.id);
                    message.success('Đã hủy đơn hàng');
                    dispatch(fetchOrders());
                  } catch (error: any) {
                    message.error(error.message || 'Hủy đơn thất bại');
                  } finally {
                    setCancellingId(null);
                  }
                }}
              >
                <Button danger loading={cancellingId === record.id} size="small">
                  Hủy đơn
                </Button>
              </Popconfirm>
            );
          })()}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Đơn hàng của tôi</Title>
      
      {error && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: 'red' }}>
            <strong>Lỗi:</strong> {error}
          </div>
        </Card>
      )}

      {/* Tabs lọc theo status */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'all',
            label: (
              <Badge count={orders.length} offset={[10, 0]}>
                <span>Tất cả</span>
              </Badge>
            ),
          },
          {
            key: 'pending',
            label: (
              <Badge count={orders.filter(o => {
                const status = (o as any).order_status || (o as any).status;
                return status === 'pending';
              }).length} offset={[10, 0]}>
                <span>Chờ xác nhận</span>
              </Badge>
            ),
          },
          {
            key: 'confirmed',
            label: (
              <Badge count={orders.filter(o => {
                const status = (o as any).order_status || (o as any).status;
                return status === 'confirmed';
              }).length} offset={[10, 0]}>
                <span>Đã xác nhận</span>
              </Badge>
            ),
          },
          {
            key: 'processing',
            label: (
              <Badge count={orders.filter(o => {
                const status = (o as any).order_status || (o as any).status;
                return status === 'processing';
              }).length} offset={[10, 0]}>
                <span>Đang xử lý</span>
              </Badge>
            ),
          },
          {
            key: 'shipping',
            label: (
              <Badge count={orders.filter(o => {
                const status = (o as any).order_status || (o as any).status;
                return status === 'shipping';
              }).length} offset={[10, 0]}>
                <span>Đang giao hàng</span>
              </Badge>
            ),
          },
          {
            key: 'delivered',
            label: (
              <Badge count={orders.filter(o => {
                const status = (o as any).order_status || (o as any).status;
                return status === 'delivered';
              }).length} offset={[10, 0]}>
                <span>Đã giao hàng</span>
              </Badge>
            ),
          },
          {
            key: 'cancelled',
            label: (
              <Badge count={orders.filter(o => {
                const status = (o as any).order_status || (o as any).status;
                return status === 'cancelled';
              }).length} offset={[10, 0]}>
                <span>Đã hủy</span>
              </Badge>
            ),
          },
        ]}
        style={{ marginBottom: 24 }}
      />

      <Card style={{ marginTop: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Text type="secondary">Đang tải...</Text>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Empty description={
            activeTab === 'all' 
              ? "Bạn chưa có đơn hàng nào" 
              : `Không có đơn hàng với trạng thái "${getStatusLabel(activeTab as OrderStatus)}"`
          } />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} đơn hàng`,
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default OrderList;

