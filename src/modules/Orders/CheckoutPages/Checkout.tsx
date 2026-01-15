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
import { paymentService } from '../../../shares/services/paymentService';
import { addressService, UserAddress } from '../../../shares/services/addressService';
import { shippingService } from '../../../shares/services/shippingService';
import { CartItem, PaymentMethod } from '../../../shares/types';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchCart } from '../../ProductManagement/stores/cartSlice';
import { logger } from '../../../shares/utils/logger';
import { useEffectOnce } from '../../../shares/hooks';

const { Title, Text, Paragraph } = Typography;

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items as CartItem[]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [estimatedDays, setEstimatedDays] = useState<number | null>(null);
  const [estimatedHours, setEstimatedHours] = useState<number | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [form] = Form.useForm();

  // Sử dụng useEffectOnce để tránh gọi API 2 lần trong StrictMode
  useEffectOnce(() => {
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

  const totalAmount = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

  const selectedAddress = useMemo(
    () => addresses.find((addr) => addr.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const formatCurrency = (value: number) =>
    value.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' VNĐ';

  const buildShippingAddressString = (address: UserAddress) => {
    return `${address.street_address}, ${address.ward}, ${address.district}, ${address.province}`;
  };

  const placeOrderButtonLabel =
    paymentMethod === 'online' ? 'Đặt hàng & thanh toán VNPay' : 'Đặt hàng (COD)';

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
        province: address.province_code ?? address.province,
        district: address.district_code ?? address.district,
        ward: address.ward_code ?? address.ward,
        // Đơn giản: ước lượng 1kg cho toàn bộ đơn, giá trị = subtotal
        weight: 1,
        value: currentSubtotal,
      });

      if (res.success && res.data) {
        setShippingFee(res.data.fee);
        setEstimatedDays(res.data.estimated_days || null);
        setEstimatedHours(res.data.estimated_hours ?? null);
        setEstimatedMinutes(res.data.estimated_minutes ?? null);
      } else {
        // fallback: vẫn cho đặt hàng với phí cố định
        setShippingFee(30000);
        setEstimatedDays(3);
        setEstimatedHours(0);
        setEstimatedMinutes(0);
        if (res.message) {
          message.warning(res.message);
        }
      }
    } catch (error: any) {
      console.error('Error calculating shipping fee via GHN:', error);
      // fallback an toàn
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

      const response = await orderService.createOrder(payload);
      if (response.success && response.data) {
        // Backend trả về { order: {...} } trong data
        const createdOrder = response.data.order || response.data;

        // Log để debug
        logger.info('Order created response', { 
          hasOrder: !!createdOrder, 
          orderId: createdOrder?.id, 
          orderIdType: typeof createdOrder?.id,
          fullResponse: response.data 
        });

        // Kiểm tra order ID hợp lệ (cho phép cả string và number)
        if (!createdOrder || createdOrder.id === undefined || createdOrder.id === null) {
          logger.error('Invalid order ID', { createdOrder, responseData: response.data });
          message.error('Đơn hàng được tạo nhưng không có mã hợp lệ. Vui lòng kiểm tra lại trong danh sách đơn hàng.');
          navigate('/orders');
          return;
        }

        // Chuyển đổi ID sang number (hỗ trợ cả string và number)
        const orderId = typeof createdOrder.id === 'string' ? parseInt(createdOrder.id, 10) : Number(createdOrder.id);
        
        if (isNaN(orderId) || orderId <= 0) {
          logger.error('Invalid order ID format', { 
            originalId: createdOrder.id, 
            convertedId: orderId,
            orderData: createdOrder 
          });
          message.error('Đơn hàng được tạo nhưng mã đơn hàng không hợp lệ. Vui lòng kiểm tra lại trong danh sách đơn hàng.');
          navigate('/orders');
          return;
        }

        // Nếu chọn thanh toán online -> tạo URL VNPay và redirect
        if (paymentMethod === 'online') {
          try {
            const paymentResponse = await paymentService.createVNPayPayment(orderId);
            if (paymentResponse.success && paymentResponse.data?.payment_url) {
              const paymentUrl = paymentResponse.data.payment_url;
              
              // Validate URL trước khi redirect
              try {
                new URL(paymentUrl);
              } catch (urlError) {
                logger.error('Invalid VNPay payment URL', { paymentUrl, orderId });
                message.error('URL thanh toán không hợp lệ. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
                return;
              }

              // Log để debug
              logger.info('Redirecting to VNPay', { 
                orderId, 
                paymentUrl: paymentUrl.substring(0, 100) + '...' // Chỉ log một phần URL
              });

              message.info('Đang chuyển đến cổng thanh toán VNPay...');
              
              // Sử dụng replace thay vì href để tránh vấn đề với browser history
              // và đảm bảo người dùng không thể quay lại bằng nút back
              window.location.replace(paymentUrl);
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
              error instanceof Error ? error : new Error(String(error)),
              { orderId }
            );
            message.warning(
              error.message ||
                'Không tạo được URL thanh toán online, đơn hàng sẽ được xử lý như COD.'
            );
          }
        }

        message.success('Đặt hàng thành công!');
        navigate(`/orders/${orderId}`);
      } else {
        // Map một số lỗi nghiệp vụ quan trọng
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
                              <Text strong>Địa chỉ</Text>
                              {address.is_default && (
                                <Tag color="green" icon={<CheckCircleOutlined />}>
                                  Mặc định
                                </Tag>
                              )}
                            </Space>
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
                      <Text strong>Thanh toán online qua VNPay</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Bạn sẽ được chuyển tới cổng thanh toán VNPay để thanh toán an toàn và bảo mật.
                        Sau khi hoàn tất, hệ thống sẽ tự động cập nhật trạng thái đơn hàng.
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
                      {placeOrderButtonLabel}
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
                        {item.variant && item.variant.variant_attributes && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {Object.entries(item.variant.variant_attributes)
                              .map(([key, val]) => `${key}: ${val}`)
                              .join(', ')}
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
                <Text>
                  {calculatingShipping
                    ? 'Đang tính...'
                    : shippingFee === 0
                    ? 'Miễn phí'
                    : formatCurrency(shippingFee)}
                  {estimatedDays !== null && !calculatingShipping && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
                      (Dự kiến{' '}
                      {estimatedDays > 0 && `${estimatedDays} ngày`}
                      {estimatedHours !== null && estimatedHours > 0 && ` ${estimatedHours} giờ`}
                      {estimatedMinutes !== null && estimatedMinutes > 0 && ` ${estimatedMinutes} phút`}
                      {estimatedDays === 0 && estimatedHours === 0 && estimatedMinutes === 0 && 'sớm nhất'}
                      )
                    </span>
                  )}
                </Text>
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

