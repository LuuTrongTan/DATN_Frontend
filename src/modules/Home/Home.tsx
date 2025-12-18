import React, { useEffect, useState } from 'react';
import { Spin, Row, Col, Card, Statistic, Typography, Space, Empty, Button } from 'antd';
import {
  ShoppingCartOutlined,
  FileTextOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Banner, CategorySection, ProductSection } from './components';
import { useAppDispatch, useAppSelector } from '../../shares/stores';
import { fetchCart } from '../ProductManagement/stores/cartSlice';
import { fetchCategories, fetchProducts } from '../ProductManagement/stores/productsSlice';
import { fetchRecentOrders } from '../Orders/stores/ordersSlice';
import { Order } from '../../shares/types';
import { logger } from '../../shares/utils/logger';

const { Title } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    cartItems: 0,
  });
  
  // Lấy dữ liệu từ Redux
  const cartItems = useAppSelector((state) => state.cart.items);
  const { items: products, categories } = useAppSelector((state) => state.products);
  const { recentOrders: orders } = useAppSelector((state) => state.orders);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // Fetch từ Redux
        await Promise.all([
          dispatch(fetchCategories()),
          dispatch(fetchProducts()),
          dispatch(fetchCart()),
          dispatch(fetchRecentOrders(5)),
        ]);
      } catch (error) {
        logger.error('Error fetching home data', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [dispatch]);

  // Cập nhật stats khi data thay đổi
  useEffect(() => {
    setStats({
      cartItems: cartItems.length,
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.total_amount, 0),
    });
  }, [cartItems, orders]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 32px 0' }}>
      {/* Banner Section */}
      <Banner />

      {/* Categories Section */}
      {categories.length > 0 && (
        <CategorySection categories={categories} />
      )}

      {/* User Stats Section (only show if user has orders or cart) */}
      {(stats.totalOrders > 0 || stats.cartItems > 0) && (
        <Row gutter={[16, 16]} style={{ marginBottom: 48 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Đơn hàng của tôi"
                value={stats.totalOrders}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Tổng chi tiêu"
                value={stats.totalSpent}
                prefix={<DollarOutlined />}
                suffix="VNĐ"
                precision={0}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Giỏ hàng"
                value={stats.cartItems}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Featured Products Section */}
      {products.length > 0 && (
        <ProductSection
          products={products.slice(0, 8)}
          title="Sản phẩm nổi bật"
          viewAllLink="/products"
        />
      )}

      {/* New Products Section */}
      {products.length > 0 && (
        <ProductSection
          products={products.slice(0, 8)}
          title="Sản phẩm mới nhất"
          viewAllLink="/products"
        />
      )}

      {/* Quick Access Section */}
      <Row gutter={[16, 16]} style={{ marginTop: 48 }}>
        <Col xs={24} lg={12}>
          <Card 
            title="Giỏ hàng của tôi" 
            style={{ minHeight: 300 }}
            extra={
              cartItems.length > 0 && (
                <Button type="link" onClick={() => navigate('/cart')}>
                  Xem tất cả
                </Button>
              )
            }
          >
            {cartItems.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {cartItems.slice(0, 5).map((item) => (
                  <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Typography.Text strong>{item.product?.name || 'Sản phẩm'}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">
                      Số lượng: {item.quantity} | Giá: {item.product?.price?.toLocaleString('vi-VN')} VNĐ
                    </Typography.Text>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty 
                description="Giỏ hàng trống" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => navigate('/products')}>
                  Mua sắm ngay
                </Button>
              </Empty>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="Đơn hàng gần đây" 
            style={{ minHeight: 300 }}
            extra={
              orders.length > 0 && (
                <Button type="link" onClick={() => navigate('/orders')}>
                  Xem tất cả
                </Button>
              )
            }
          >
            {orders.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {orders.map((order: Order) => (
                  <div key={order.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Typography.Text strong>#{order.order_number}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">
                      {order.order_status} | {order.total_amount.toLocaleString('vi-VN')} VNĐ
                    </Typography.Text>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty 
                description="Chưa có đơn hàng nào" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => navigate('/products')}>
                  Mua sắm ngay
                </Button>
              </Empty>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;

