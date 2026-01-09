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
  Image,
  Alert,
} from 'antd';
import {
  ShoppingCartOutlined,
  HomeOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../../shares/services/orderService';
import { paymentService } from '../../../shares/services/paymentService';
import { addressService, UserAddress } from '../../../shares/services/addressService';
import { shippingService } from '../../../shares/services/shippingService';
import { CartItem, PaymentMethod } from '../../../shares/types';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchCart, clearCart } from '../../ProductManagement/stores/cartSlice';
import { logger } from '../../../shares/utils/logger';
import { getAuthToken } from '../../../shares/api';

const { Title, Text, Paragraph } = Typography;

const PlaceOrder: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items as CartItem[]);
  const { loading: cartLoading } = useAppSelector((state) => state.cart);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [estimatedDays, setEstimatedDays] = useState<number | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [form] = Form.useForm();

  // Fetch cart và addresses khi component mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      message.warning('Vui lòng đăng nhập để đặt hàng');
      navigate('/login');
      return;
    }

    console.log('PlaceOrder component mounted, fetching cart and addresses...');
    dispatch(fetchCart());
    fetchAddresses();
  }, [dispatch, navigate]);

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

  // Tính phí vận chuyển qua GHN dựa trên địa chỉ đã chọn + tổng giá trị đơn
  const recalculateShippingFee = async (address: UserAddress | null, currentSubtotal: number) => {
    if (!address || currentSubtotal <= 0) {
      setShippingFee(0);
      setEstimatedDays(null);
      return;
    }

    try {
      setCalculatingShipping(true);
      const res = await shippingService.calculateFee({
        province: address.province,
        district: address.district,
        ward: address.ward,
        weight: 1,
        value: currentSubtotal,
      });

      if (res.success && res.data) {
        setShippingFee(res.data.fee);
        setEstimatedDays(res.data.estimated_days || null);
      } else {
        setShippingFee(30000);
        setEstimatedDays(3);
        if (res.message) {
          message.warning(res.message);
        }
      }
    } catch (error: any) {
      console.error('Error calculating shipping fee via GHN:', error);
      setShippingFee(30000);
      setEstimatedDays(3);
      message.warning(error.message || 'Không tính được phí vận chuyển, dùng phí mặc định.');
    } finally {
      setCalculatingShipping(false);
    }
  };

  // Tự động tính lại phí ship khi địa chỉ chọn hoặc subtotal thay đổi
  useEffect(() => {
    const addr = addresses.find((a) => a.id === selectedAddressId) || null;
    recalculateShippingFee(addr, subtotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId, subtotal, addresses.length]);

  const handlePlaceOrder = async (values: { notes?: string }) => {
    if (!selectedAddress) {
      message.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    if (cartItems.length === 0) {
      message.error('Giỏ hàng của bạn đang trống');
      navigate('/cart');
      return;
    }

    if (calculatingShipping) {
      message.warning('Hệ thống đang tính phí vận chuyển, vui lòng đợi trong giây lát...');
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

      console.log('Placing order with payload:', payload);
      const response = await orderService.createOrder(payload);
      
      if (response.success && response.data) {
        const createdOrder = response.data;
        console.log('Order created successfully:', createdOrder);

        // Kiểm tra order ID hợp lệ
        if (!createdOrder || !createdOrder.id || isNaN(Number(createdOrder.id))) {
          console.error('Invalid order ID:', createdOrder);
          message.error('Đơn hàng được tạo nhưng không có mã hợp lệ. Vui lòng kiểm tra lại trong danh sách đơn hàng.');
          navigate('/orders');
          return;
        }

        const orderId = Number(createdOrder.id);

        // Nếu chọn thanh toán online -> tạo URL VNPay và redirect
        if (paymentMethod === 'online') {
          try {
            const paymentResponse = await paymentService.createVNPayPayment(orderId);
            if (paymentResponse.success && paymentResponse.data?.payment_url) {
              message.info('Đang chuyển đến cổng thanh toán VNPay...');
              window.location.href = paymentResponse.data.payment_url;
              return;
            }

            const baseMessage =
              paymentResponse.message ||
              'Không tạo được URL thanh toán online, đơn hàng sẽ được xử lý như COD.';

            if (baseMessage.includes('VNPay chưa được cấu hình')) {
              message.warning(
                'Cổng thanh toán VNPay chưa được cấu hình. Đơn hàng của bạn vẫn được tạo với hình thức COD.'
              );
            } else {
              message.warning(baseMessage);
            }
          } catch (error: any) {
            logger.error(
              'Error creating VNPay payment',
              error instanceof Error ? error : new Error(String(error))
            );
            message.warning(
              error.message ||
                'Không tạo được URL thanh toán online, đơn hàng sẽ được xử lý như COD.'
            );
          }
        }

        message.success('Đặt hàng thành công!');
        
        // Clear cart trong Redux store (backend đã xóa cart_items trong DB)
        dispatch(clearCart());
        
        // Fetch lại cart để đồng bộ với database (sẽ trả về empty)
        await dispatch(fetchCart());
        
        // Điều hướng đến trang chi tiết đơn hàng
        navigate(`/orders/${orderId}`);
      } else {
        const code = response.error?.code;
        if (code === 'INSUFFICIENT_STOCK') {
          message.error(
            'Một số sản phẩm trong giỏ không đủ số lượng. Vui lòng kiểm tra lại giỏ hàng trước khi đặt.'
          );
        } else if (code === 'PRODUCT_NOT_FOUND_OR_INACTIVE') {
          message.error(
            'Một số sản phẩm trong giỏ đã ngừng kinh doanh hoặc bị xóa. Vui lòng cập nhật lại giỏ hàng.'
          );
        } else if (code === 'VARIANT_NOT_FOUND_OR_INACTIVE') {
          message.error(
            'Biến thể bạn chọn không còn hợp lệ. Vui lòng chọn lại tùy chọn sản phẩm rồi thử lại.'
          );
        } else if (code === 'STOCK_NOT_AVAILABLE') {
          message.error(
            'Không xác định được tồn kho cho một số sản phẩm. Vui lòng tải lại trang và thử lại.'
          );
        } else {
          message.error(response.message || 'Không thể tạo đơn hàng');
        }
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      message.error(error.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = cartLoading || loadingAddresses;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Đang tải thông tin đặt hàng...</Text>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/cart')}
          style={{ marginBottom: 24 }}
        >
          Quay lại giỏ hàng
        </Button>
        <Card>
          <Empty description="Giỏ hàng của bạn đang trống">
            <Button type="primary" onClick={() => navigate('/products')}>
              Tiếp tục mua sắm
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/cart')}
        style={{ marginBottom: 24 }}
      >
        Quay lại giỏ hàng
      </Button>

      <Title level={2} style={{ marginBottom: 24 }}>
        Đặt hàng
      </Title>

      <Card style={{ marginBottom: 24 }}>
        <Steps
          responsive
          items={[
            {
              title: 'Giỏ hàng',
              icon: <ShoppingCartOutlined />,
              status: 'finish',
            },
            {
              title: 'Thông tin giao hàng',
              icon: <HomeOutlined />,
              status: 'process',
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
          current={1}
        />
      </Card>

      <Row gutter={[24, 24]}>
        {/* Cột trái: Địa chỉ giao hàng & Phương thức thanh toán */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Địa chỉ giao hàng */}
            <Card
              title={
                <Space>
                  <HomeOutlined />
                  <Text strong>Địa chỉ giao hàng</Text>
                </Space>
              }
              extra={
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/profile/addresses')}
                >
                  Thêm địa chỉ mới
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
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {addresses.map((address) => (
                      <Card
                        key={address.id}
                        hoverable
                        style={{
                          borderColor:
                            address.id === selectedAddressId ? '#1677ff' : 'rgba(0,0,0,0.06)',
                          borderWidth: address.id === selectedAddressId ? 2 : 1,
                        }}
                      >
                        <Space align="start">
                          <Radio value={address.id} />
                          <div style={{ flex: 1 }}>
                            <Space style={{ marginBottom: 8 }}>
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

            {/* Phương thức thanh toán */}
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
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Radio value="cod">
                    <Card
                      hoverable
                      style={{
                        borderColor: paymentMethod === 'cod' ? '#1677ff' : 'rgba(0,0,0,0.06)',
                        borderWidth: paymentMethod === 'cod' ? 2 : 1,
                      }}
                    >
                      <Space direction="vertical" size={0}>
                        <Text strong>Thanh toán khi nhận hàng (COD)</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Bạn sẽ thanh toán tiền mặt cho nhân viên giao hàng khi nhận được sản phẩm.
                        </Text>
                      </Space>
                    </Card>
                  </Radio>
                  <Radio value="online">
                    <Card
                      hoverable
                      style={{
                        borderColor: paymentMethod === 'online' ? '#1677ff' : 'rgba(0,0,0,0.06)',
                        borderWidth: paymentMethod === 'online' ? 2 : 1,
                      }}
                    >
                      <Space direction="vertical" size={0}>
                        <Text strong>Thanh toán online qua VNPay</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Bạn sẽ được chuyển tới cổng thanh toán VNPay để thanh toán an toàn và bảo mật.
                        </Text>
                      </Space>
                    </Card>
                  </Radio>
                </Space>
              </Radio.Group>

              <Divider />

              <Form form={form} layout="vertical" onFinish={handlePlaceOrder}>
                <Form.Item
                  label="Ghi chú cho đơn hàng (tùy chọn)"
                  name="notes"
                  extra="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Nhập ghi chú cho đơn hàng..."
                    maxLength={255}
                    showCount
                  />
                </Form.Item>
              </Form>
            </Card>
          </Space>
        </Col>

        {/* Cột phải: Tóm tắt đơn hàng */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <ShoppingCartOutlined />
                <Text strong>Tóm tắt đơn hàng</Text>
              </Space>
            }
            style={{ position: 'sticky', top: 24 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* Danh sách sản phẩm */}
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
                        gap: 12,
                        marginBottom: 16,
                        paddingBottom: 16,
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <Image
                        src={item.product?.image_url || item.product?.image_urls?.[0] || '/placeholder.png'}
                        alt={item.product?.name}
                        width={60}
                        height={60}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        preview={false}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong ellipsis style={{ display: 'block', marginBottom: 4 }}>
                          {item.product?.name}
                        </Text>
                        {item.variant && item.variant.variant_attributes && (
                          <Text
                            type="secondary"
                            style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                          >
                            {Object.entries(item.variant.variant_attributes)
                              .map(([key, val]) => `${key}: ${val}`)
                              .join(', ')}
                          </Text>
                        )}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Số lượng: {item.quantity} × {formatCurrency(finalPrice)}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>{formatCurrency(lineTotal)}</Text>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {/* Tạm tính */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Tạm tính</Text>
                <Text>{formatCurrency(subtotal)}</Text>
              </div>

              {/* Phí vận chuyển */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Phí vận chuyển</Text>
                <Text>
                  {calculatingShipping
                    ? 'Đang tính...'
                    : shippingFee === 0
                    ? 'Miễn phí'
                    : formatCurrency(shippingFee)}
                  {estimatedDays !== null && !calculatingShipping && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
                      (Dự kiến {estimatedDays} ngày)
                    </span>
                  )}
                </Text>
              </div>

              {subtotal < 500_000 && (
                <Alert
                  message={`Mua thêm ${formatCurrency(500_000 - subtotal)} để được miễn phí vận chuyển`}
                  type="info"
                  showIcon
                  style={{ fontSize: 12 }}
                />
              )}

              <Divider style={{ margin: '12px 0' }} />

              {/* Tổng cộng */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: 18 }}>
                  Tổng cộng
                </Text>
                <Text strong style={{ fontSize: 20, color: '#cf1322' }}>
                  {formatCurrency(totalAmount)}
                </Text>
              </div>

              <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 16, marginBottom: 0 }}>
                Bằng việc nhấn "Đặt hàng", bạn đồng ý với các điều khoản sử dụng và chính sách bảo mật
                của chúng tôi.
              </Paragraph>

              {/* Nút đặt hàng */}
              <Form form={form} onFinish={handlePlaceOrder}>
                <Button
                  type="primary"
                  size="large"
                  block
                  htmlType="submit"
                  loading={submitting}
                  disabled={!selectedAddress || cartItems.length === 0}
                  style={{ marginTop: 16 }}
                >
                  {submitting
                    ? 'Đang xử lý...'
                    : paymentMethod === 'online'
                      ? 'Đặt hàng & thanh toán VNPay'
                      : 'Đặt hàng (COD)'}
                </Button>
              </Form>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PlaceOrder;

