import React from 'react';
import { Row, Col, Typography, Button, Spin, Empty } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../../shares/types';
import ProductCard from './ProductCard';
import { cartService } from '../../../shares/services/cartService';
import { message } from 'antd';

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

  const handleAddToCart = async (product: Product) => {
    try {
      const response = await cartService.addToCart({
        product_id: product.id,
        quantity: 1,
      });
      
      if (response.success) {
        message.success('Đã thêm vào giỏ hàng!');
      } else {
        message.error(response.message || 'Có lỗi xảy ra');
      }
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
      <Row gutter={[16, 16]}>
        {products.map((product) => (
          <Col xs={12} sm={8} md={6} lg={4} xl={4} key={product.id}>
            <ProductCard product={product} onAddToCart={handleAddToCart} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProductSection;

