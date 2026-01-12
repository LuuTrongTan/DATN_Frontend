import React, { useEffect, useState, useRef } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Select,
  Input,
  message,
  Card,
  Drawer,
  Descriptions,
  Divider,
  Row,
  Col,
  Statistic,
  Image,
  Empty,
  Tabs,
  Badge,
  Popconfirm,
  InputNumber,
} from 'antd';
import {
  ReloadOutlined,
  FileTextOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { UpdateOrderStatusRequest } from '../../../shares/services/adminService';
import { Order, OrderStatus, OrderItem } from '../../../shares/types';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import {
  fetchAdminOrders,
  fetchAdminOrderById,
  setStatusFilter as setAdminStatusFilter,
  setPaymentMethodFilter as setAdminPaymentFilter,
  setSearchFilter as setAdminSearchFilter,
  updateAdminOrderStatus,
} from '../stores/adminOrdersSlice';
import { shippingService, TrackingResponse } from '../../../shares/services/shippingService';
import { useEffectOnce } from '../../../shares/hooks';
import AdminPageContent from '../../../shares/components/layouts/AdminPageContent';

const { Text } = Typography;
const { TextArea } = Input;
const { Search } = Input;
const { Option } = Select;

// Dùng biến global để track request đang pending (tránh StrictMode gọi 2 lần)
let globalFetchingAdminOrders = false;

const AdminOrderManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: orders, loading, filters } = useAppSelector((state) => state.adminOrders);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingResponse | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [form] = Form.useForm();
  const [codForm] = Form.useForm();
  const [codModalVisible, setCodModalVisible] = useState(false);
  const [codUpdating, setCodUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Fetch orders on mount
  useEffect(() => {
    dispatch(fetchAdminOrders())
      .then((result) => {
        if (fetchAdminOrders.rejected.match(result)) {
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

  // Gọi lại khi filters thay đổi
  useEffect(() => {
    dispatch(fetchAdminOrders())
      .then((result) => {
        if (fetchAdminOrders.rejected.match(result)) {
          const errorMessage =
            (result.payload as string | undefined) ||
            result.error?.message ||
            'Không thể tải danh sách đơn hàng';
          message.error(errorMessage);
        }
      })
      .catch(() => {
        // Error already handled in message.error above
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.status, filters.paymentMethod, filters.search]);

  // Sync activeTab với filters.status
  useEffect(() => {
    if (!filters.status) {
      setActiveTab('all');
    } else {
      setActiveTab(filters.status);
    }
  }, [filters.status]);

  const handleViewDetail = async (order: Order) => {
    try {
      setSelectedOrder(order);
      setLoadingDetail(true);
      setIsDetailDrawerVisible(true);
      const detail = await dispatch(fetchAdminOrderById(order.id)).unwrap();
      setOrderDetail(detail);
      setTrackingInfo(null);
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải chi tiết đơn hàng');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleEditStatus = (order: Order) => {
    setEditingOrder(order);
    form.setFieldsValue({
      status: order.order_status,
      notes: '',
    });
    setIsModalVisible(true);
  };

  const handleUpdateStatus = async (values: any) => {
    try {
      if (!editingOrder) return;

      const updateData: UpdateOrderStatusRequest = {
        status: values.status,
        notes: values.notes || undefined,
      };

      await dispatch(
        updateAdminOrderStatus({ orderId: editingOrder.id, data: updateData })
      ).unwrap();
      
      message.success('Cập nhật trạng thái đơn hàng thành công');
      setIsModalVisible(false);
      setEditingOrder(null);
      form.resetFields();
      
      // Refresh orders list
      dispatch(fetchAdminOrders());
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi cập nhật đơn hàng');
    }
  };

const getStatusColor = (status: OrderStatus) => {
  const colorMap: Record<OrderStatus, string> = {
    pending: 'orange',
    confirmed: 'blue',
    processing: 'cyan',
    shipping: 'purple',
    delivered: 'green',
    cancelled: 'red',
  };
  return colorMap[status] || 'default';
};

const getStatusLabel = (status: OrderStatus) => {
  const labelMap: Record<OrderStatus, string> = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    processing: 'Đang xử lý',
    shipping: 'Đang giao hàng',
    delivered: 'Đã giao hàng',
    cancelled: 'Đã hủy',
  };
  return labelMap[status] || status;
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

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'order_number',
      key: 'order_number',
      align: 'center' as const,
      render: (text: string) => <Typography.Text strong>#{text}</Typography.Text>,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'user_id',
      key: 'user_id',
      align: 'center' as const,
      width: 100,
      render: (userId: number) => (
        <Tag color="blue">User #{userId}</Tag>
      ),
    },
    {
      title: 'Địa chỉ giao hàng',
      dataIndex: 'shipping_address',
      key: 'shipping_address',
      align: 'center' as const,
      ellipsis: true,
      render: (address: string) => address || '-',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'center' as const,
      render: (amount: number) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Trạng thái đơn hàng',
      dataIndex: 'order_status',
      key: 'order_status',
      align: 'center' as const,
      render: (status: OrderStatus) => (
        <Tag color={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái thanh toán',
      dataIndex: 'payment_status',
      key: 'payment_status',
      align: 'center' as const,
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)}>
          {status === 'pending' ? 'Chờ thanh toán' :
           status === 'paid' ? 'Đã thanh toán' :
           status === 'failed' ? 'Thanh toán thất bại' :
           status === 'refunded' ? 'Đã hoàn tiền' : status}
        </Tag>
      ),
    },
    {
      title: 'Phương thức thanh toán',
      dataIndex: 'payment_method',
      key: 'payment_method',
      align: 'center' as const,
      render: (method: string) => (
        <Tag>{method === 'online' ? 'Online' : 'COD'}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      align: 'center' as const,
      render: (text: string) => new Date(text).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center' as const,
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Order) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            size="small"
          >
            Chi tiết
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditStatus(record)}
            size="small"
          >
            Cập nhật
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageContent
      title={(
        <>
          <FileTextOutlined /> Quản lý đơn hàng
        </>
      )}
      extra={(
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            dispatch(fetchAdminOrders());
          }}
        >
          Làm mới
        </Button>
      )}
    >
        {/* Tabs lọc theo status */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            const statusMap: Record<string, string | undefined> = {
              all: undefined,
              pending: 'pending',
              confirmed: 'confirmed',
              processing: 'processing',
              shipping: 'shipping',
              delivered: 'delivered',
              cancelled: 'cancelled',
            };
            dispatch(setAdminStatusFilter(statusMap[key]));
          }}
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
                <Badge count={orders.filter(o => o.order_status === 'pending').length} offset={[10, 0]}>
                  <span>Chờ xử lý</span>
                </Badge>
              ),
            },
            {
              key: 'confirmed',
              label: (
                <Badge count={orders.filter(o => o.order_status === 'confirmed').length} offset={[10, 0]}>
                  <span>Đã xác nhận</span>
                </Badge>
              ),
            },
            {
              key: 'processing',
              label: (
                <Badge count={orders.filter(o => o.order_status === 'processing').length} offset={[10, 0]}>
                  <span>Đang xử lý</span>
                </Badge>
              ),
            },
            {
              key: 'shipping',
              label: (
                <Badge count={orders.filter(o => o.order_status === 'shipping').length} offset={[10, 0]}>
                  <span>Đang giao hàng</span>
                </Badge>
              ),
            },
            {
              key: 'delivered',
              label: (
                <Badge count={orders.filter(o => o.order_status === 'delivered').length} offset={[10, 0]}>
                  <span>Đã giao hàng</span>
                </Badge>
              ),
            },
            {
              key: 'cancelled',
              label: (
                <Badge count={orders.filter(o => o.order_status === 'cancelled').length} offset={[10, 0]}>
                  <span>Đã hủy</span>
                </Badge>
              ),
            },
          ]}
          style={{ marginBottom: 24 }}
        />

        {/* Filters: Search và Payment Method */}
        <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={12}>
              <Search
                placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng, SĐT..."
                allowClear
                prefix={<SearchOutlined />}
                onSearch={(value) => {
                  dispatch(setAdminSearchFilter(value));
                }}
                onChange={(e) => {
                  if (!e.target.value) {
                    dispatch(setAdminSearchFilter(''));
                  }
                }}
                enterButton
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="Lọc theo thanh toán"
                allowClear
                value={filters.paymentMethod}
                onChange={(value) => dispatch(setAdminPaymentFilter(value || undefined))}
              >
                <Option value="online">Online</Option>
                <Option value="cod">COD</Option>
              </Select>
            </Col>
          </Row>
        </Space>

        {/* Thống kê nhanh - chỉ hiển thị khi tab "Tất cả" */}
        {activeTab === 'all' && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8} md={6}>
              <Card>
                <Statistic
                  title="Tổng đơn hàng"
                  value={orders.length}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Card>
                <Statistic
                  title="Tổng doanh thu"
                  value={orders.reduce((sum, order) => {
                    const total = typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : (order.total_amount || 0);
                    return sum + total;
                  }, 0)}
                  prefix={<DollarOutlined />}
                  suffix="VNĐ"
                  precision={0}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Card>
                <Statistic
                  title="Đơn chờ xử lý"
                  value={orders.filter(o => o.order_status === 'pending').length}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Card>
                <Statistic
                  title="Đơn đã giao"
                  value={orders.filter(o => o.order_status === 'delivered').length}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đơn hàng`,
          }}
        />

      <Modal
        title="Cập nhật trạng thái đơn hàng"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingOrder(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width="50%"
      >
        {editingOrder && (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong>Mã đơn hàng: </Typography.Text>
            <Typography.Text>#{editingOrder.order_number}</Typography.Text>
            <br />
            <Typography.Text strong>Tổng tiền: </Typography.Text>
            <Typography.Text>{editingOrder.total_amount.toLocaleString('vi-VN')} VNĐ</Typography.Text>
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateStatus}
        >
          <Form.Item
            label="Trạng thái đơn hàng"
            name="status"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Option value="pending">Chờ xử lý</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="processing">Đang xử lý</Option>
              <Option value="shipping">Đang giao hàng</Option>
              <Option value="delivered">Đã giao hàng</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Ghi chú"
            name="notes"
          >
            <TextArea rows={4} placeholder="Nhập ghi chú (tùy chọn)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer chi tiết đơn hàng */}
      <Drawer
        title={`Chi tiết đơn hàng #${selectedOrder?.order_number || ''}`}
        placement="right"
        size="large"
        onClose={() => {
          setIsDetailDrawerVisible(false);
          setSelectedOrder(null);
          setOrderDetail(null);
        }}
        open={isDetailDrawerVisible}
      >
        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Typography.Text>Đang tải...</Typography.Text>
          </div>
        ) : orderDetail ? (
          <div>
            <Descriptions title="Thông tin đơn hàng" bordered column={2}>
              <Descriptions.Item label="Mã đơn hàng">
                <Text strong>#{orderDetail.order_number}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={getStatusColor(orderDetail.order_status || orderDetail.status)}>
                  {getStatusLabel(orderDetail.order_status || orderDetail.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <Text strong style={{ color: '#cf1322', fontSize: 18 }}>
                  {orderDetail.total_amount.toLocaleString('vi-VN')} VNĐ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Phí vận chuyển">
                {(orderDetail.shipping_fee || 0).toLocaleString('vi-VN')} VNĐ
              </Descriptions.Item>
              {orderDetail.shipping_provider && (
                <Descriptions.Item label="Đơn vị vận chuyển">
                  <Tag color="geekblue">{orderDetail.shipping_provider}</Tag>
                </Descriptions.Item>
              )}
              {orderDetail.tracking_number && (
                <Descriptions.Item label="Mã vận đơn">
                  <Text copyable>{orderDetail.tracking_number}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Phương thức thanh toán">
                <Tag>{orderDetail.payment_method === 'online' ? 'Online' : 'COD'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái thanh toán">
                <Tag color={getPaymentStatusColor(orderDetail.payment_status)}>
                  {orderDetail.payment_status === 'pending' ? 'Chờ thanh toán' :
                   orderDetail.payment_status === 'paid' ? 'Đã thanh toán' :
                   orderDetail.payment_status === 'failed' ? 'Thanh toán thất bại' :
                   orderDetail.payment_status === 'refunded' ? 'Đã hoàn tiền' : orderDetail.payment_status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ giao hàng" span={2}>
                {orderDetail.shipping_address}
              </Descriptions.Item>
              {orderDetail.notes && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {orderDetail.notes}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Ngày tạo">
                {new Date(orderDetail.created_at).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày cập nhật">
                {new Date(orderDetail.updated_at).toLocaleString('vi-VN')}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Sản phẩm trong đơn hàng</Divider>

            {orderDetail.items && orderDetail.items.length > 0 ? (
              <Table
                dataSource={orderDetail.items}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: 'Sản phẩm',
                    key: 'product',
                    render: (_: any, record: OrderItem) => (
                      <Space>
                        {record.product?.image_urls && record.product.image_urls.length > 0 ? (
                          <Image
                            src={record.product.image_urls[0]}
                            alt={record.product.name}
                            width={60}
                            height={60}
                            style={{ objectFit: 'cover', borderRadius: 4 }}
                          />
                        ) : (
                          <div style={{ width: 60, height: 60, background: '#f0f0f0', borderRadius: 4 }} />
                        )}
                        <div>
                          <Text strong>{record.product?.name || 'Sản phẩm'}</Text>
                          {record.variant && record.variant.variant_attributes && (
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {Object.entries(record.variant.variant_attributes)
                                  .map(([key, val]) => `${key}: ${val}`)
                                  .join(', ')}
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
                    render: (price: number) => `${price.toLocaleString('vi-VN')} VNĐ`,
                    align: 'right' as const,
                  },
                  {
                    title: 'Thành tiền',
                    key: 'total',
                    render: (_: any, record: OrderItem) => (
                      <Text strong>
                        {(record.price * record.quantity).toLocaleString('vi-VN')} VNĐ
                      </Text>
                    ),
                    align: 'right' as const,
                  },
                ]}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Tổng cộng:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong style={{ fontSize: 16, color: '#cf1322' }}>
                          {orderDetail.total_amount.toLocaleString('vi-VN')} VNĐ
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            ) : (
              <Empty description="Không có sản phẩm nào" />
            )}

            <Divider />
            <Space wrap>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => {
                  setIsDetailDrawerVisible(false);
                  handleEditStatus(orderDetail);
                }}
              >
                Cập nhật trạng thái
              </Button>
              {orderDetail.tracking_number && (
                <>
                  <Button
                    icon={<FileTextOutlined />}
                    loading={trackingLoading}
                    onClick={async () => {
                      try {
                        setTrackingLoading(true);
                        const res = await shippingService.trackOrder(orderDetail.tracking_number!);
                        if (res.success && res.data) {
                          setTrackingInfo(res.data);
                        } else {
                          message.error(res.message || 'Không lấy được thông tin vận đơn');
                        }
                      } catch (error: any) {
                        message.error(error.message || 'Lỗi khi tra cứu vận đơn GHN');
                      } finally {
                        setTrackingLoading(false);
                      }
                    }}
                  >
                    Xem trạng thái GHN
                  </Button>
                  <Button
                    danger
                    onClick={() => {
                      setCodModalVisible(true);
                      codForm.setFieldsValue({
                        cod_amount: orderDetail.total_amount || 0,
                      });
                    }}
                  >
                    Cập nhật COD GHN
                  </Button>
                  <Popconfirm
                    title="Bạn có chắc muốn hủy đơn GHN này?"
                    okText="Hủy đơn GHN"
                    cancelText="Không"
                    onConfirm={async () => {
                      try {
                        if (!orderDetail.tracking_number) {
                          message.error('Không có mã vận đơn GHN để hủy');
                          return;
                        }
                        const res = await shippingService.cancelOrder({
                          order_codes: [orderDetail.tracking_number],
                        });
                        if (res.success) {
                          message.success('Hủy đơn GHN thành công');
                        } else {
                          message.error(res.message || 'Không thể hủy đơn GHN');
                        }
                      } catch (error: any) {
                        message.error(error.message || 'Lỗi khi hủy đơn GHN');
                      }
                    }}
                  >
                    <Button danger>Hủy đơn GHN</Button>
                  </Popconfirm>
                </>
              )}
            </Space>

            {trackingInfo && (
              <>
                <Divider>Trạng thái vận đơn GHN</Divider>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Mã vận đơn">
                    <Text strong>{trackingInfo.tracking_number}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái hiện tại">
                    <Tag color="processing">{trackingInfo.status}</Tag>
                  </Descriptions.Item>
                  {trackingInfo.estimated_delivery_date && (
                    <Descriptions.Item label="Dự kiến giao">
                      {new Date(trackingInfo.estimated_delivery_date).toLocaleString('vi-VN')}
                    </Descriptions.Item>
                  )}
                  {trackingInfo.current_location && (
                    <Descriptions.Item label="Vị trí hiện tại">
                      {trackingInfo.current_location}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}

            <Modal
              title="Cập nhật COD GHN"
              open={codModalVisible}
              onCancel={() => {
                setCodModalVisible(false);
                codForm.resetFields();
              }}
              onOk={() => codForm.submit()}
              confirmLoading={codUpdating}
              okText="Cập nhật COD"
              cancelText="Hủy"
            >
              <Form
                form={codForm}
                layout="vertical"
                onFinish={async (values) => {
                  try {
                    if (!orderDetail?.tracking_number) {
                      message.error('Không có mã vận đơn GHN');
                      return;
                    }
                    setCodUpdating(true);
                    const res = await shippingService.updateCOD({
                      order_code: orderDetail.tracking_number,
                      cod_amount: Number(values.cod_amount || 0),
                    });
                    if (res.success && res.data?.success) {
                      message.success('Cập nhật COD GHN thành công');
                      setCodModalVisible(false);
                      codForm.resetFields();
                    } else {
                      message.error(res.data?.message || res.message || 'Không thể cập nhật COD GHN');
                    }
                  } catch (error: any) {
                    message.error(error.message || 'Lỗi khi cập nhật COD GHN');
                  } finally {
                    setCodUpdating(false);
                  }
                }}
              >
                <Form.Item
                  label="Số tiền COD (VNĐ)"
                  name="cod_amount"
                  rules={[{ required: true, message: 'Vui lòng nhập số tiền COD' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={1000}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                  />
                </Form.Item>
              </Form>
            </Modal>
          </div>
        ) : (
          <Empty description="Không tìm thấy thông tin đơn hàng" />
        )}
      </Drawer>
    </AdminPageContent>
  );
};

export default AdminOrderManagement;

