import React, { useEffect } from 'react';
import { Card, Table, Button, Typography, Space, InputNumber, Empty, Row, Col, Statistic } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { CartItem } from '../../../shares/types';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchCart, removeCartItem, updateCartItemQuantity } from '../stores/cartSlice';
import { useEffectOnce } from '../../../shares/hooks';

const { Title, Text } = Typography;

const Cart: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: cartItems, loading } = useAppSelector((state) => state.cart);
  const navigate = useNavigate();

  // Sử dụng useEffectOnce để tránh gọi API 2 lần trong StrictMode
  useEffectOnce(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    try {
      await dispatch(updateCartItemQuantity({ id: itemId, quantity })).unwrap();
      message.success('Cập nhật giỏ hàng thành công');
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await dispatch(removeCartItem(itemId)).unwrap();
      message.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const basePrice = item.product?.price || 0;
      const priceAdjustment = item.variant?.price_adjustment || 0;
      const finalPrice = basePrice + priceAdjustment;
      return total + finalPrice * item.quantity;
    }, 0);
  };

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_: any, record: CartItem) => (
        <Space>
          <img
            src={record.product?.image_url || record.product?.image_urls?.[0] || '/placeholder.png'}
            alt={record.product?.name}
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.product?.name}</div>
            {record.variant && (
              <div style={{ fontSize: 12, color: '#999' }}>
                {record.variant.variant_type}: {record.variant.variant_value}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Giá',
      key: 'price',
      render: (_: any, record: CartItem) => {
        const basePrice = record.product?.price || 0;
        const priceAdjustment = record.variant?.price_adjustment || 0;
        const finalPrice = basePrice + priceAdjustment;
        return (
          <div>
            <Text strong>{finalPrice.toLocaleString('vi-VN')} VNĐ</Text>
            {priceAdjustment !== 0 && (
              <div style={{ fontSize: 11, color: '#999' }}>
                (Gốc: {basePrice.toLocaleString('vi-VN')} 
                {priceAdjustment > 0 ? ' +' : ' '}
                {priceAdjustment.toLocaleString('vi-VN')})
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      render: (_: any, record: CartItem) => {
        const availableStock = record.variant 
          ? record.variant.stock_quantity 
          : record.product?.stock_quantity || 0;
        return (
          <InputNumber
            min={1}
            max={availableStock}
            value={record.quantity}
            onChange={(value) => value && handleUpdateQuantity(record.id, value)}
          />
        );
      },
    },
    {
      title: 'Thành tiền',
      key: 'total',
      render: (_: any, record: CartItem) => {
        const basePrice = record.product?.price || 0;
        const priceAdjustment = record.variant?.price_adjustment || 0;
        const finalPrice = basePrice + priceAdjustment;
        const total = finalPrice * record.quantity;
        return <Text strong>{total.toLocaleString('vi-VN')} VNĐ</Text>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: CartItem) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.id)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Giỏ hàng của tôi</Title>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Space direction="vertical">
            <ShoppingCartOutlined style={{ fontSize: 48, color: '#999' }} />
            <Text type="secondary">Đang tải...</Text>
          </Space>
        </div>
      ) : cartItems.length === 0 ? (
        <Card>
          <Empty
            description="Giỏ hàng của bạn đang trống"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/products')}>
              Mua sắm ngay
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card>
              <Table
                columns={columns}
                dataSource={cartItems}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Tổng kết">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Statistic
                  title="Tổng tiền"
                  value={calculateTotal()}
                  suffix="VNĐ"
                  valueStyle={{ color: '#cf1322', fontSize: 24 }}
                />
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => navigate('/checkout')}
                >
                  Thanh toán
                </Button>
                <Button block onClick={() => navigate('/products')}>
                  Tiếp tục mua sắm
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Cart;

