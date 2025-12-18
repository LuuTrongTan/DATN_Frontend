import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Typography,
  Steps,
  Row,
  Col,
  Radio,
  Space,
  Button,
  Form,
  Input,
  Tag,
  message,
  Empty,
  Spin,
  Divider,
} from 'antd';
import {
  ShoppingCartOutlined,
  HomeOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../../shares/services/orderService';
import { addressService, UserAddress } from '../../../shares/services/addressService';
import { CartItem, PaymentMethod } from '../../../shares/types';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchCart } from '../../ProductManagement/stores/cartSlice';
import { logger } from '../../../shares/utils/logger';

const { Title, Text, Paragraph } = Typography;

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items as CartItem[]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchCart());
    fetchAddresses();
  }, [dispatch]);

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const response = await addressService.getAddresses();
      if (response.success && response.data) {
        setAddresses(response.data);

        // Ưu tiên chọn địa chỉ mặc định nếu có
        const defaultAddress = response.data.find((addr) => addr.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (response.data.length > 0) {
          setSelectedAddressId(response.data[0].id);
        }
      }
    } catch (error: any) {
      logger.error('Error fetching addresses', error instanceof Error ? error : new Error(String(error)));
      message.error(error.message || 'Có lỗi xảy ra khi tải địa chỉ giao hàng');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const subtotal = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const basePrice = item.product?.price || 0;
        const priceAdjustment = item.variant?.price_adjustment || 0;
        const finalPrice = basePrice + priceAdjustment;
        return total + finalPrice * item.quantity;
      }, 0),
    [cartItems]
  );

  // Tạm thời dùng phí ship cố định / miễn phí theo ngưỡng
  const shippingFee = useMemo(() => {
    if (subtotal === 0) return 0;
    // Miễn phí ship cho đơn từ 500.000 VNĐ
    return subtotal >= 500_000 ? 0 : 30_000;
  }, [subtotal]);

  const totalAmount = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

  const selectedAddress = useMemo(
    () => addresses.find((addr) => addr.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const formatCurrency = (value: number) =>
    value.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' VNĐ';

  const buildShippingAddressString = (address: UserAddress) => {
    return `${address.full_name} - ${address.phone}\n${address.street_address}, ${address.ward}, ${address.district}, ${address.province}`;
  };

  const handlePlaceOrder = async (values: { notes?: string }) => {
    if (!selectedAddress) {
      message.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    if (cartItems.length === 0) {
      message.error('Giỏ hàng của bạn đang trống');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        shipping_address: buildShippingAddressString(selectedAddress),
        payment_method: paymentMethod,
        shipping_fee: shippingFee,
        notes: values.notes || undefined,
      };

      const response = await orderService.createOrder(payload);
      if (response.success && response.data) {
        message.success('Đặt hàng thành công!');
        // Backend thường sẽ clear giỏ hàng sau khi tạo đơn, ở đây chỉ điều hướng
        navigate(`/orders/${response.data.id}`);
      } else {
        message.error(response.message || 'Không thể tạo đơn hàng');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loadingCart || loadingAddresses;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Empty description="Giỏ hàng của bạn đang trống">
          <Button type="primary" onClick={() => navigate('/products')}>
            Tiếp tục mua sắm
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Thanh toán
      </Title>

      <Card style={{ marginBottom: 24 }}>
        <Steps
          responsive
          items={[
            {
              title: 'Giỏ hàng',
              icon: <ShoppingCartOutlined />,
            },
            {
              title: 'Thông tin giao hàng',
              icon: <HomeOutlined />,
            },
            {
              title: 'Thanh toán',
              icon: <CreditCardOutlined />,
            },
            {
              title: 'Hoàn tất',
              icon: <CheckCircleOutlined />,
            },
          ]}
          current={2}
        />
      </Card>

      <Row gutter={[24, 24]}>
        {/* Cột trái: địa chỉ & phương thức thanh toán */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card
              title={
                <Space>
                  <HomeOutlined />
                  <Text strong>Địa chỉ giao hàng</Text>
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/profile/addresses')}>
                  Quản lý địa chỉ
                </Button>
              }
            >
              {addresses.length === 0 ? (
                <Empty description="Bạn chưa có địa chỉ giao hàng">
                  <Button type="primary" onClick={() => navigate('/profile/addresses')}>
                    Thêm địa chỉ mới
                  </Button>
                </Empty>
              ) : (
                <Radio.Group
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  value={selectedAddressId ?? undefined}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {addresses.map((address) => (
                      <Card
                        key={address.id}
                        style={{
                          borderColor:
                            address.id === selectedAddressId ? '#1677ff' : 'rgba(0,0,0,0.06)',
                        }}
                      >
                        <Space align="start">
                          <Radio value={address.id} />
                          <div>
                            <Space style={{ marginBottom: 4 }}>
                              <Text strong>{address.full_name}</Text>
                              {address.is_default && (
                                <Tag color="green" icon={<CheckCircleOutlined />}>
                                  Mặc định
                                </Tag>
                              )}
                            </Space>
                            <div>
                              <Text type="secondary">SĐT: {address.phone}</Text>
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <Text>
                                {address.street_address}, {address.ward}, {address.district},{' '}
                                {address.province}
                              </Text>
                            </div>
                          </div>
                        </Space>
                      </Card>
                    ))}
                  </Space>
                </Radio.Group>
              )}
            </Card>

            <Card
              title={
                <Space>
                  <CreditCardOutlined />
                  <Text strong>Phương thức thanh toán</Text>
                </Space>
              }
            >
              <Radio.Group
                onChange={(e) => setPaymentMethod(e.target.value)}
                value={paymentMethod}
              >
                <Space direction="vertical">
                  <Radio value="cod">
                    <Space direction="vertical" size={0}>
                      <Text strong>Thanh toán khi nhận hàng (COD)</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Bạn sẽ thanh toán tiền mặt cho nhân viên giao hàng khi nhận được sản phẩm.
                      </Text>
                    </Space>
                  </Radio>
                  <Radio value="online">
                    <Space direction="vertical" size={0}>
                      <Text strong>Thanh toán online</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Cổng thanh toán online (VNPay/MoMo) sẽ được tích hợp. Hiện tại hệ thống sẽ
                        xử lý như đơn COD.
                      </Text>
                    </Space>
                  </Radio>
                </Space>
              </Radio.Group>

              <Divider />

              <Form form={form} layout="vertical" onFinish={handlePlaceOrder}>
                <Form.Item label="Ghi chú cho đơn hàng" name="notes">
                  <Input.TextArea
                    rows={3}
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                    maxLength={255}
                    showCount
                  />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button onClick={() => navigate('/cart')}>Quay lại giỏ hàng</Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      disabled={!selectedAddress}
                    >
                      Đặt hàng
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </Space>
        </Col>

        {/* Cột phải: tóm tắt đơn hàng */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <ShoppingCartOutlined />
                <Text strong>Tóm tắt đơn hàng</Text>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                {cartItems.map((item) => {
                  const basePrice = item.product?.price || 0;
                  const priceAdjustment = item.variant?.price_adjustment || 0;
                  const finalPrice = basePrice + priceAdjustment;
                  const lineTotal = finalPrice * item.quantity;

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ maxWidth: '65%' }}>
                        <Text strong>{item.product?.name}</Text>
                        <br />
                        {item.variant && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.variant.variant_type}: {item.variant.variant_value}
                          </Text>
                        )}
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Số lượng: {item.quantity}
                        </Text>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Text strong>{formatCurrency(lineTotal)}</Text>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Tạm tính</Text>
                <Text>{formatCurrency(subtotal)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Phí vận chuyển</Text>
                <Text>{shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}</Text>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: 16 }}>
                  Tổng cộng
                </Text>
                <Text strong style={{ fontSize: 18, color: '#cf1322' }}>
                  {formatCurrency(totalAmount)}
                </Text>
              </div>

              <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
                Bằng việc nhấn &quot;Đặt hàng&quot;, bạn đồng ý với các điều khoản sử dụng và chính
                sách bảo mật của chúng tôi.
              </Paragraph>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Checkout;

