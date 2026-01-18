import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Card, Typography, Button, Tag, Space, Tooltip, message, Image } from 'antd';
import { ShoppingCartOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { Product } from '../../../shares/types';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { addToWishlist, removeFromWishlist, checkWishlist } from '../../ProductManagement/stores/wishlistSlice';
import { addToCart } from '../../ProductManagement/stores/cartSlice';
import { useAuth } from '../../../shares/contexts/AuthContext';
import VariantSelectorModal from '../../ProductManagement/CartPages/VariantSelectorModal';

const { Text, Paragraph } = Typography;

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, variantId?: number | null) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  
  const { loading: wishlistLoading, checkedProducts } = useAppSelector((state) => state.wishlist);
  const isInWishlist = checkedProducts[product.id] ?? false;

  useEffect(() => {
    // Chỉ check wishlist nếu user đã đăng nhập
    if (isAuthenticated && !checkedProducts.hasOwnProperty(product.id)) {
      dispatch(checkWishlist(product.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, dispatch, isAuthenticated]);

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
    // Luôn mở modal để kiểm tra variant (vì có thể variants chưa được load trong product object)
    // Modal sẽ tự kiểm tra và xử lý trường hợp không có variant
    setVariantModalVisible(true);
  }, []);

  const handleVariantSelect = useCallback(async (variantId: number | null) => {
    try {
      if (onAddToCart) {
        onAddToCart(product, variantId);
      } else {
        await dispatch(addToCart({
          product_id: product.id,
          variant_id: variantId,
          quantity: 1,
        })).unwrap();
        message.success('Đã thêm vào giỏ hàng!');
      }
      setVariantModalVisible(false);
    } catch (error: any) {
      if (error.code === 'INSUFFICIENT_STOCK') {
        const available = error.details?.available;
        message.error(
          available !== undefined
            ? `Số lượng sản phẩm không đủ. Chỉ còn ${available} sản phẩm trong kho.`
            : 'Số lượng sản phẩm không đủ trong kho.'
        );
      } else {
        message.error(error.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
      }
    }
  }, [product, onAddToCart, dispatch]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Kiểm tra nếu click vào button, tag, hoặc các phần tử không nên navigate
    const target = e.target as HTMLElement;
    if (target && (
      target.closest('button') || 
      target.closest('.ant-btn') ||
      target.closest('.ant-tag') ||
      target.tagName === 'SPAN' && target.closest('.ant-tag')
    )) {
      return;
    }
    navigate(`/products/${product.id}`);
  }, [navigate, product.id]);

  const handleTagClick = useCallback((e: React.MouseEvent, tagId: number) => {
    e.stopPropagation();
    navigate(`/products/search?tag_ids=${tagId}`);
  }, [navigate]);

  const imageUrl = useMemo(
    () => product.image_url || product.image_urls?.[0] || '/placeholder.png',
    [product.image_url, product.image_urls]
  );
  const isOutOfStock = useMemo(() => (product.stock_quantity || 0) === 0, [product.stock_quantity]);

  return (
    <Card
      hoverable
      onClick={handleCardClick}
      style={{ 
        height: '100%',
        minHeight: 440,
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        border: isInWishlist ? '1px solid #ff85c0' : '1px solid #f2f4f7',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        cursor: 'pointer',
      }}
      bodyStyle={{ padding: '14px 14px 10px' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 36px rgba(0,0,0,0.12)';
        (e.currentTarget as HTMLDivElement).style.borderColor = isInWishlist ? '#ff85c0' : '#e5e7eb';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
        (e.currentTarget as HTMLDivElement).style.borderColor = isInWishlist ? '#ff85c0' : '#f2f4f7';
      }}
      cover={
        <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid #f0f2f5' }}>
          <Image
            alt={product.name}
            src={imageUrl}
            height={240}
            style={{ objectFit: 'cover' }}
            preview={false}
            onClick={handleCardClick}
            fallback="/placeholder.png"
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 80,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 100%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, pointerEvents: 'auto' }}>
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
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
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
                pointerEvents: 'none',
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
          <div style={{ minHeight: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <Text 
              ellipsis={{ tooltip: product.name }}
              style={{ fontSize: 16, fontWeight: 500, flex: 1, margin: 0 }}
            >
              {product.name}
            </Text>
            {product.tags && product.tags.length > 0 && (
              <Space wrap size={[4, 4]} style={{ flexShrink: 0 }}>
                {product.tags.map((tag) => (
                  <Tag
                    key={tag.id}
                    color="purple"
                    style={{ 
                      cursor: 'pointer',
                      margin: 0,
                      fontSize: 11,
                    }}
                    onClick={(e) => handleTagClick(e, tag.id)}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </Space>
            )}
          </div>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
            <Text strong style={{ fontSize: 18, color: '#cf1322' }}>
              {product.price ? `${product.price.toLocaleString('vi-VN')} VNĐ` : 'Liên hệ'}
            </Text>
            {product.description && (
              <Paragraph
                type="secondary"
                style={{ fontSize: 13, marginBottom: 0, color: '#6b7280' }}
                ellipsis={{ rows: 2 }}
              >
                {product.description}
              </Paragraph>
            )}
            {product.stock_quantity !== undefined && (
              <Tag 
                color={isOutOfStock ? 'red' : 'green'}
                style={{ marginTop: 4 }}
              >
                {isOutOfStock ? 'Hết hàng' : `Còn hàng (${product.stock_quantity})`}
              </Tag>
            )}
          </Space>
        }
      />
      <div style={{ marginTop: 16, padding: '0 16px 16px' }}>
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCartClick();
          }}
          disabled={isOutOfStock}
          style={{ borderRadius: 999, width: '100%', boxShadow: '0 8px 18px rgba(24,144,255,0.25)' }}
          block
        >
          {product.variants && product.variants.length > 0 ? 'Chọn biến thể' : 'Thêm vào giỏ'}
        </Button>
      </div>
      <VariantSelectorModal
        visible={variantModalVisible}
        productId={product.id}
        productName={product.name || ''}
        currentVariantId={null}
        onSelect={handleVariantSelect}
        onCancel={() => setVariantModalVisible(false)}
      />
    </Card>
  );
};

export default React.memo(ProductCard, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.stock_quantity === nextProps.product.stock_quantity &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.onAddToCart === nextProps.onAddToCart
  );
});
