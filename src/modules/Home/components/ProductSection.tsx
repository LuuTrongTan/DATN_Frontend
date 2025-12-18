import React from 'react';
import { Row, Col, Typography, Button, Spin, Empty } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../../shares/types';
import ProductCard from './ProductCard';
import { message } from 'antd';
import { useAppDispatch } from '../../../shares/stores';
import { addToCart } from '../../ProductManagement/stores/cartSlice';

const { Title } = Typography;

interface ProductSectionProps {
  products: Product[];
  title: string;
  loading?: boolean;
  viewAllLink?: string;
  showViewAll?: boolean;
}

const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  title,
  loading = false,
  viewAllLink = '/products',
  showViewAll = true,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleAddToCart = async (product: Product) => {
    try {
      await dispatch(addToCart({
        product_id: product.id,
        quantity: 1,
      })).unwrap();
      message.success('Đã thêm vào giỏ hàng!');
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 48 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          {title}
        </Title>
        {showViewAll && (
          <Button
            type="link"
            icon={<RightOutlined />}
            onClick={() => navigate(viewAllLink)}
            style={{ fontSize: 16 }}
          >
            Xem tất cả
          </Button>
        )}
      </div>
      <Row gutter={[12, 20]}>
        {products.map((product) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={6} key={product.id}>
            <ProductCard product={product} onAddToCart={handleAddToCart} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProductSection;

