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
import { fetchProducts, fetchCategories } from '../ProductManagement/stores/productsSlice';
import { fetchRecentOrders } from '../Orders/stores/ordersSlice';
import { Order } from '../../shares/types';
import { logger } from '../../shares/utils/logger';
import { useEffectOnce } from '../../shares/hooks';
import { useAuth } from '../../shares/contexts/AuthContext';

const { Title } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
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

  // Sử dụng useEffectOnce để tránh gọi API 2 lần trong StrictMode
  useEffectOnce(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // Fetch public data (products, categories) luôn luôn
        await Promise.all([
          dispatch(fetchProducts()),
          dispatch(fetchCategories()),
        ]);
        
        // Chỉ fetch cart và orders nếu user đã đăng nhập
        if (isAuthenticated) {
          await Promise.all([
            dispatch(fetchCart()),
            dispatch(fetchRecentOrders(5)),
          ]);
        }
      } catch (error) {
        logger.error('Error fetching home data', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [dispatch, isAuthenticated]);

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

    </div>
  );
};

export default Home;

