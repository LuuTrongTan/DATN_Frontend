import React, { useEffect, useState } from 'react';
import { Spin, Row, Col, Card, Statistic, Typography, Space, Empty, Button } from 'antd';
import {
  ShoppingCartOutlined,
  FileTextOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../shares/services/orderService';
import { cartService } from '../../shares/services/cartService';
import { productService } from '../../shares/services/productService';
import { categoryService } from '../../shares/services/categoryService';
import { Order, CartItem, Product, Category } from '../../shares/types';
import { Banner, CategorySection, ProductSection } from './components';

const { Title } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    cartItems: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      try {
        const categoriesRes = await categoryService.getCategories();
        if (categoriesRes.success && categoriesRes.data) {
          setCategories(categoriesRes.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // If categories API doesn't exist, we'll continue without them
      }

      // Fetch orders
      try {
        const ordersRes = await orderService.getOrders({ limit: 5 });
        if (ordersRes.success && ordersRes.data) {
          const orders = ordersRes.data.data || [];
          setRecentOrders(orders);
          setStats(prev => ({
            ...prev,
            totalOrders: ordersRes.data?.pagination?.total || 0,
            totalSpent: orders.reduce((sum, order) => sum + order.total_amount, 0),
          }));
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }

      // Fetch cart
      try {
        const cartRes = await cartService.getCart();
        if (cartRes.success && cartRes.data) {
          const items = cartRes.data || [];
          setCartItems(items);
          setStats(prev => ({
            ...prev,
            cartItems: items.length,
          }));
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }

      // Fetch featured products (first 8 products)
      try {
        const featuredRes = await productService.getProducts({ limit: 8 });
        if (featuredRes.success && featuredRes.data) {
          setFeaturedProducts(featuredRes.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
      }

      // Fetch new products (latest products)
      try {
        const newRes = await productService.getProducts({ limit: 8 });
        if (newRes.success && newRes.data) {
          setNewProducts(newRes.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching new products:', error);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      {featuredProducts.length > 0 && (
        <ProductSection
          products={featuredProducts}
          title="Sản phẩm nổi bật"
          viewAllLink="/products"
        />
      )}

      {/* New Products Section */}
      {newProducts.length > 0 && (
        <ProductSection
          products={newProducts}
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
              recentOrders.length > 0 && (
                <Button type="link" onClick={() => navigate('/orders')}>
                  Xem tất cả
                </Button>
              )
            }
          >
            {recentOrders.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {recentOrders.map((order) => (
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

