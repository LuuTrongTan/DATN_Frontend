import React from 'react';
import { Card, Typography, Button, Tag, Space } from 'antd';
import { ShoppingCartOutlined, EyeOutlined } from '@ant-design/icons';
import { Product } from '../../../shares/types';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const imageUrl = product.image_urls?.[0] || '/placeholder.png';
  const isOutOfStock = (product.stock_quantity || 0) === 0;

  return (
    <Card
      hoverable
      style={{ 
        height: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'all 0.3s',
      }}
      cover={
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            alt={product.name}
            src={imageUrl}
            style={{ 
              width: '100%', 
              height: 250, 
              objectFit: 'cover',
              transition: 'transform 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
          {isOutOfStock && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tag color="red" style={{ fontSize: 16, padding: '8px 16px' }}>
                Hết hàng
              </Tag>
            </div>
          )}
          {product.category && (
            <Tag
              color="blue"
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
              }}
            >
              {product.category.name}
            </Tag>
          )}
        </div>
      }
      actions={[
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/products/${product.id}`)}
          block
        >
          Xem chi tiết
        </Button>,
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={() => onAddToCart?.(product)}
          disabled={isOutOfStock}
          block
        >
          Thêm vào giỏ
        </Button>,
      ]}
    >
      <Card.Meta
        title={
          <Title level={5} ellipsis={{ rows: 2 }} style={{ marginBottom: 8, minHeight: 48 }}>
            {product.name}
          </Title>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 18, color: '#cf1322' }}>
              {product.price?.toLocaleString('vi-VN')} VNĐ
            </Text>
            {product.stock_quantity !== undefined && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Còn lại: {product.stock_quantity} sản phẩm
              </Text>
            )}
          </Space>
        }
      />
    </Card>
  );
};

export default ProductCard;

