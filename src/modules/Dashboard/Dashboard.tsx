import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Spin, Empty } from 'antd';
import {
  ShoppingOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Order } from '../../shares/types';
import { useAppDispatch, useAppSelector } from '../../shares/stores';
import { fetchCart } from '../ProductManagement/stores/cartSlice';
import { fetchProducts } from '../ProductManagement/stores/productsSlice';
import { fetchRecentOrders } from '../Orders/stores/ordersSlice';
import { logger } from '../../shares/utils/logger';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    cartItems: 0,
  });
  
  // Lấy dữ liệu từ Redux
  const cartItems = useAppSelector((state) => state.cart.items);
  const { total: totalProducts } = useAppSelector((state) => state.products);
  const { recentOrders: orders } = useAppSelector((state) => state.orders);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Cập nhật stats khi data thay đổi
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      cartItems: cartItems.length,
      totalProducts: totalProducts,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
    }));
  }, [cartItems, totalProducts, orders]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch từ Redux
      await Promise.all([
        dispatch(fetchCart()),
        dispatch(fetchProducts()),
        dispatch(fetchRecentOrders(5)),
      ]);
      
      // Cập nhật stats từ orders
      setStats(prev => ({
        ...prev,
        totalOrders: orders.length > 0 ? orders.length : 0,
        totalRevenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
      }));
    } catch (error) {
      logger.error('Error fetching dashboard data', error instanceof Error ? error : new Error(String(error)));
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
    <div>
      <Title level={2}>Tổng quan</Title>
      
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng sản phẩm"
              value={stats.totalProducts}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={stats.totalOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
              precision={0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
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

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Giỏ hàng của tôi" style={{ minHeight: 400 }}>
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
              <Empty description="Giỏ hàng trống" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Đơn hàng gần đây" style={{ minHeight: 400 }}>
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
              <Empty description="Chưa có đơn hàng nào" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

