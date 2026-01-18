import React, { useState } from 'react';
import { Space, Typography, InputNumber, Button, Tag, Image, Tooltip } from 'antd';
import { DeleteOutlined, MinusOutlined, PlusOutlined, LinkOutlined, HeartOutlined, EditOutlined } from '@ant-design/icons';
import { CartItem } from '../../../shares/types';
import { formatCurrency } from '../../../shares/utils';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../shares/stores';
import { updateCartItemVariant } from '../stores/cartSlice';
import { message } from 'antd';
import VariantSelectorModal from './VariantSelectorModal';

const { Text } = Typography;

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
  onAddToWishlist?: (productId: number) => void;
  renderMode?: 'product' | 'price' | 'quantity' | 'total' | 'action' | 'full';
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onAddToWishlist,
  renderMode = 'full',
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const basePrice = item.product?.price || 0;
  const priceAdjustment = item.variant?.price_adjustment || 0;
  const finalPrice = basePrice + priceAdjustment;
  const total = finalPrice * item.quantity;
  const availableStock = item.variant
    ? item.variant.stock_quantity
    : item.product?.stock_quantity || 0;

  const handleVariantChange = async (newVariantId: number | null) => {
    try {
      await dispatch(updateCartItemVariant({ id: item.id, variant_id: newVariantId })).unwrap();
      message.success('Đã cập nhật biến thể');
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
        message.error(error.message || 'Không thể cập nhật biến thể');
      }
    }
  };

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

  const renderVariantSection = () => (
    <>
      {item.variant && item.variant.variant_attributes && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          {Object.entries(item.variant.variant_attributes).map(([key, val]) => (
            <Tag key={key} style={{ margin: 0 }}>
              {key}: {val}
            </Tag>
          ))}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setVariantModalVisible(true);
            }}
            style={{ padding: 0, height: 'auto', fontSize: 12 }}
          >
            Đổi
          </Button>
        </div>
      )}
      {!item.variant && item.product && (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            setVariantModalVisible(true);
          }}
          style={{ padding: 0, height: 'auto', fontSize: 12 }}
        >
          Chọn biến thể
        </Button>
      )}
    </>
  );

  // Render product cell
  if (renderMode === 'product') {
    return (
      <>
        <Space align="start" style={{ width: '100%' }}>
          <div
            onClick={handleProductClick}
            style={{ cursor: 'pointer', flexShrink: 0 }}
          >
            <Image
              src={item.product?.image_url || item.product?.image_urls?.[0] || '/placeholder.png'}
              alt={item.product?.name}
              width={60}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={false}
              loading="lazy"
            />
          </div>
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
              <Text strong style={{ fontSize: 14 }}>{item.product?.name}</Text>
              <LinkOutlined style={{ fontSize: 12, color: '#1890ff', flexShrink: 0 }} />
            </div>
            {renderVariantSection()}
          </div>
        </Space>
        {item.product && (
          <VariantSelectorModal
            visible={variantModalVisible}
            productId={item.product_id}
            productName={item.product.name || ''}
            currentVariantId={item.variant_id}
            onSelect={handleVariantChange}
            onCancel={() => setVariantModalVisible(false)}
          />
        )}
      </>
    );
  }

  // Render price cell
  if (renderMode === 'price') {
    return (
      <div style={{ textAlign: 'right' }}>
        <Text strong style={{ fontSize: 14 }}>{formatCurrency(finalPrice)}</Text>
        {priceAdjustment !== 0 && (
          <Tooltip
            title={`Giá gốc: ${formatCurrency(basePrice)}${priceAdjustment > 0 ? ` + ${formatCurrency(priceAdjustment)}` : ` - ${formatCurrency(Math.abs(priceAdjustment))}`}`}
          >
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              (Gốc: {formatCurrency(basePrice)})
            </div>
          </Tooltip>
        )}
      </div>
    );
  }

  // Render quantity cell
  if (renderMode === 'quantity') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Space.Compact style={{ display: 'flex', alignItems: 'center', width: 'fit-content' }}>
          <Button
            icon={<MinusOutlined />}
            onClick={handleDecrease}
            disabled={item.quantity <= 1}
            size="small"
            style={{ 
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
          <InputNumber
            min={1}
            max={availableStock}
            value={item.quantity}
            onChange={handleQuantityChange}
            style={{ 
              width: 60, 
              textAlign: 'center',
              borderRadius: 0,
              height: 32
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
              borderBottomLeftRadius: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Space.Compact>
        {availableStock > 0 && (
          <Text type="secondary" style={{ fontSize: 11, color: availableStock < 10 ? '#fa8c16' : '#8c8c8c', whiteSpace: 'nowrap' }}>
            (Còn {availableStock})
          </Text>
        )}
      </div>
    );
  }

  // Render total cell
  if (renderMode === 'total') {
    return (
      <div style={{ textAlign: 'right' }}>
        <Text strong style={{ fontSize: 14, color: '#cf1322' }}>{formatCurrency(total)}</Text>
      </div>
    );
  }

  // Render action cell
  if (renderMode === 'action') {
    return (
      <Space size="small" style={{ justifyContent: 'center', width: '100%', alignItems: 'center' }}>
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
    );
  }

  // Full row (for backward compatibility, though not used in table)
  return (
    <>
      <tr>
        <td>
          <Space>
            <div
              onClick={handleProductClick}
              style={{ cursor: 'pointer', flexShrink: 0 }}
            >
              <Image
                src={item.product?.image_url || item.product?.image_urls?.[0] || '/placeholder.png'}
                alt={item.product?.name}
                width={60}
                height={60}
                style={{ objectFit: 'cover', borderRadius: 4 }}
                preview={false}
                loading="lazy"
              />
            </div>
            <div>
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
                <Text strong>{item.product?.name}</Text>
                <LinkOutlined style={{ fontSize: 12, color: '#1890ff' }} />
              </div>
              {renderVariantSection()}
            </div>
          </Space>
        </td>
        <td>
          <div>
            <Text strong>{formatCurrency(finalPrice)}</Text>
            {priceAdjustment !== 0 && (
              <Tooltip
                title={`Giá gốc: ${formatCurrency(basePrice)}${priceAdjustment > 0 ? ` + ${formatCurrency(priceAdjustment)}` : ` - ${formatCurrency(Math.abs(priceAdjustment))}`}`}
              >
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                  (Gốc: {formatCurrency(basePrice)}
                  {priceAdjustment > 0 ? ' +' : ' '}
                  {formatCurrency(Math.abs(priceAdjustment))})
                </div>
              </Tooltip>
            )}
          </div>
        </td>
        <td>
          <Space.Compact>
            <Button
              icon={<MinusOutlined />}
              onClick={handleDecrease}
              disabled={item.quantity <= 1}
              size="small"
            />
            <InputNumber
              min={1}
              max={availableStock}
              value={item.quantity}
              onChange={handleQuantityChange}
              style={{ width: 70, textAlign: 'center' }}
            />
            <Button
              icon={<PlusOutlined />}
              onClick={handleIncrease}
              disabled={item.quantity >= availableStock}
              size="small"
            />
          </Space.Compact>
          {availableStock < 10 && (
            <div>
              <Text type="warning" style={{ fontSize: 11 }}>
                (Còn {availableStock})
              </Text>
            </div>
          )}
        </td>
        <td>
          <Text strong>{formatCurrency(total)}</Text>
        </td>
        <td>
          <Space size="small" style={{ justifyContent: 'center', width: '100%', alignItems: 'center' }}>
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
        </td>
      </tr>
      {item.product && (
        <VariantSelectorModal
          visible={variantModalVisible}
          productId={item.product_id}
          productName={item.product.name || ''}
          currentVariantId={item.variant_id}
          onSelect={handleVariantChange}
          onCancel={() => setVariantModalVisible(false)}
        />
      )}
    </>
  );
};

export default React.memo(CartItemRow);
