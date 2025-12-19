import React, { useEffect, useMemo, useCallback } from 'react';
import { Card, Typography, Button, Tag, Space, Tooltip, message } from 'antd';
import { ShoppingCartOutlined, EyeOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { Product } from '../../../shares/types';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { addToWishlist, removeFromWishlist, checkWishlist } from '../../ProductManagement/stores/wishlistSlice';

const { Text, Title, Paragraph } = Typography;

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, variantId?: number | null) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Lấy trạng thái từ Redux
  const { loading: wishlistLoading, checkedProducts } = useAppSelector((state) => state.wishlist);
  const isInWishlist = checkedProducts[product.id] ?? false;

  // Kiểm tra wishlist khi component mount
  useEffect(() => {
    if (!checkedProducts.hasOwnProperty(product.id)) {
      dispatch(checkWishlist(product.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, dispatch]);

  const handleToggleWishlist = useCallback(async () => {
    if (wishlistLoading) return;
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(product.id)).unwrap();
        message.success('Đã xóa khỏi yêu thích');
      } else {
        await dispatch(addToWishlist(product.id)).unwrap();
        message.success('Đã thêm vào yêu thích');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi cập nhật yêu thích');
    }
  }, [wishlistLoading, isInWishlist, product.id, dispatch]);

  const handleAddToCartClick = useCallback(() => {
    // Nếu sản phẩm có variants, điều hướng đến trang chi tiết để chọn variant
    if (product.variants && product.variants.length > 0) {
      navigate(`/products/${product.id}`);
    } else {
      // Nếu không có variant, thêm trực tiếp vào giỏ
      onAddToCart?.(product, null);
    }
  }, [product, navigate, onAddToCart]);

  const imageUrl = useMemo(
    () => product.image_url || product.image_urls?.[0] || '/placeholder.png',
    [product.image_url, product.image_urls]
  );
  const isOutOfStock = useMemo(() => (product.stock_quantity || 0) === 0, [product.stock_quantity]);

  return (
    <Card
      hoverable
      style={{ 
        height: '100%',
        minHeight: 460,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'all 0.3s',
        boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        border: isInWishlist ? '1px solid #ff85c0' : '1px solid #f0f0f0',
      }}
      cover={
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            alt={product.name}
            src={imageUrl}
            style={{ 
              width: '100%', 
              height: 280, 
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
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
            }}
          >
            <Tooltip title={isInWishlist ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}>
              <Button
                shape="circle"
                size="large"
                loading={wishlistLoading}
                icon={isInWishlist ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleWishlist();
                }}
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              />
            </Tooltip>
          </div>
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
    >
      <Card.Meta
        title={
          <Paragraph
            strong
            ellipsis={{ rows: 2 }}
            style={{ marginBottom: 8, minHeight: 48 }}
          >
            {product.name}
          </Paragraph>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 18, color: '#cf1322' }}>
              {product.price?.toLocaleString('vi-VN')} VNĐ
            </Text>
            {product.description && (
              <Paragraph
                type="secondary"
                style={{ fontSize: 13, marginBottom: 0 }}
                ellipsis={{ rows: 2 }}
              >
                {product.description}
              </Paragraph>
            )}
            {product.stock_quantity !== undefined && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Còn lại: {product.stock_quantity} sản phẩm
              </Text>
            )}
          </Space>
        }
      />
      <div
        style={{
          marginTop: 16,
          padding: '0 16px 16px',
        }}
      >
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={handleAddToCartClick}
          disabled={isOutOfStock}
          style={{ borderRadius: 999, width: '100%' }}
          block
        >
          {product.variants && product.variants.length > 0 ? 'Chọn biến thể' : 'Thêm vào giỏ'}
        </Button>
      </div>
    </Card>
  );
};

// Memoize component để tránh re-render không cần thiết
export default React.memo(ProductCard, (prevProps, nextProps) => {
  // Chỉ re-render nếu product thay đổi hoặc onAddToCart thay đổi
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.stock_quantity === nextProps.product.stock_quantity &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.onAddToCart === nextProps.onAddToCart
  );
});

