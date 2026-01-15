import React from 'react';
import { Card, Space, Typography, InputNumber, Button, Tag, Image, Tooltip } from 'antd';
import { DeleteOutlined, MinusOutlined, PlusOutlined, LinkOutlined, HeartOutlined } from '@ant-design/icons';
import { CartItem } from '../../../shares/types';
import { formatCurrency } from '../../../shares/utils';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
  onAddToWishlist?: (productId: number) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onAddToWishlist,
}) => {
  const navigate = useNavigate();
  const basePrice = item.product?.price || 0;
  const priceAdjustment = item.variant?.price_adjustment || 0;
  const finalPrice = basePrice + priceAdjustment;
  const total = finalPrice * item.quantity;
  const availableStock = item.variant
    ? item.variant.stock_quantity
    : item.product?.stock_quantity || 0;

  const handleQuantityChange = (value: number | null) => {
    if (value && value > 0) {
      onUpdateQuantity(item.id, value);
    }
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (item.quantity < availableStock) {
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  };

  const handleProductClick = () => {
    navigate(`/products/${item.product_id}`);
  };

  return (
    <Card
      style={{ 
        marginBottom: 16,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0'
      }}
      bodyStyle={{ padding: 16 }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Product Info Row */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Product Image */}
          <div
            onClick={handleProductClick}
            style={{ cursor: 'pointer', flexShrink: 0 }}
          >
            <Image
              src={item.product?.image_url || item.product?.image_urls?.[0] || '/placeholder.png'}
              alt={item.product?.name}
              width={80}
              height={80}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={false}
              loading="lazy"
            />
          </div>

          {/* Product Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              onClick={handleProductClick}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
              }}
            >
              <Text strong style={{ fontSize: 14 }}>
                {item.product?.name}
              </Text>
              <LinkOutlined style={{ fontSize: 12, color: '#1890ff' }} />
            </div>

            {/* Variant Attributes */}
            {item.variant && item.variant.variant_attributes && (
              <div style={{ marginBottom: 8 }}>
                {Object.entries(item.variant.variant_attributes).map(([key, val]) => (
                  <Tag key={key} style={{ marginBottom: 4 }}>
                    {key}: {val}
                  </Tag>
                ))}
              </div>
            )}

            {/* Price */}
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: 16, color: '#cf1322' }}>
                {formatCurrency(finalPrice)}
              </Text>
              {priceAdjustment !== 0 && (
                <Tooltip title={`Giá gốc: ${formatCurrency(basePrice)}${priceAdjustment > 0 ? ` + ${formatCurrency(priceAdjustment)}` : ` - ${formatCurrency(Math.abs(priceAdjustment))}`}`}>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                    (Điều chỉnh: {priceAdjustment > 0 ? '+' : ''}{formatCurrency(priceAdjustment)})
                  </Text>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Quantity and Actions Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {/* Quantity Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 12 }}>Số lượng:</Text>
            <Space.Compact style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                icon={<MinusOutlined />}
                onClick={handleDecrease}
                disabled={item.quantity <= 1}
                size="small"
                style={{ 
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0
                }}
              />
              <InputNumber
                min={1}
                max={availableStock}
                value={item.quantity}
                onChange={handleQuantityChange}
                size="small"
                style={{ 
                  width: 60, 
                  textAlign: 'center',
                  borderRadius: 0
                }}
                controls={false}
              />
              <Button
                icon={<PlusOutlined />}
                onClick={handleIncrease}
                disabled={item.quantity >= availableStock}
                size="small"
                style={{ 
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0
                }}
              />
            </Space.Compact>
            {availableStock > 0 && (
              <Text type="secondary" style={{ fontSize: 11, color: availableStock < 10 ? '#fa8c16' : '#8c8c8c', whiteSpace: 'nowrap' }}>
                (Còn {availableStock})
              </Text>
            )}
          </div>

          {/* Actions */}
          <Space size="small" style={{ alignItems: 'center' }}>
            {onAddToWishlist && (
              <Button
                type="text"
                size="small"
                icon={<HeartOutlined />}
                onClick={() => onAddToWishlist(item.product_id)}
                style={{ 
                  fontSize: 16,
                  color: '#ff4d4f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  padding: 0
                }}
                title="Lưu vào danh sách yêu thích"
              />
            )}
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => onRemoveItem(item.id)}
              size="small"
              style={{ 
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Xóa
            </Button>
          </Space>
        </div>

        {/* Subtotal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 8,
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Text type="secondary">Thành tiền:</Text>
          <Text strong style={{ fontSize: 16, color: '#cf1322' }}>
            {formatCurrency(total)}
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default React.memo(CartItemCard);
