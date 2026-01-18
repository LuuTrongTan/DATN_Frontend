import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Space, Button, Typography, Tag, message, Spin } from 'antd';
import { ProductVariant } from '../../../shares/types';
import { variantService } from '../../../shares/services/variantService';
import { formatCurrency } from '../../../shares/utils';

const { Text } = Typography;

interface VariantSelectorModalProps {
  visible: boolean; // Keep for backward compatibility, map to 'open' in Modal
  productId: number;
  productName: string;
  currentVariantId: number | null;
  onSelect: (variantId: number | null) => void;
  onCancel: () => void;
}

const VariantSelectorModal: React.FC<VariantSelectorModalProps> = ({
  visible,
  productId,
  productName,
  currentVariantId,
  onSelect,
  onCancel,
}) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [variantsByAttribute, setVariantsByAttribute] = useState<Record<string, string[]>>({});
  const [availableVariants, setAvailableVariants] = useState<ProductVariant[]>([]);

  // Load variants khi modal mở
  useEffect(() => {
    if (visible && productId) {
      loadVariants();
    } else {
      // Reset khi đóng modal
      setSelectedAttributes({});
      setVariants([]);
      setVariantsByAttribute({});
      setAvailableVariants([]);
    }
  }, [visible, productId]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      const response = await variantService.getVariantsByProduct(productId);
      if (response.success && response.data) {
        const variantsData = response.data || [];
        setVariants(variantsData);
        setAvailableVariants(variantsData);

        // Organize variants by attribute names and values
        if (variantsData.length > 0) {
          const organized: Record<string, string[]> = {};
          variantsData.forEach((variant: ProductVariant) => {
            if (variant.variant_attributes) {
              Object.keys(variant.variant_attributes).forEach((attrName) => {
                if (!organized[attrName]) {
                  organized[attrName] = [];
                }
                const value = variant.variant_attributes[attrName];
                if (!organized[attrName].includes(value)) {
                  organized[attrName].push(value);
                }
              });
            }
          });
          setVariantsByAttribute(organized);

          // Nếu có variant hiện tại, set selectedAttributes
          if (currentVariantId) {
            const currentVariant = variantsData.find(v => v.id === currentVariantId);
            if (currentVariant && currentVariant.variant_attributes) {
              setSelectedAttributes(currentVariant.variant_attributes);
            }
          }
        } else {
          // Không có variants, reset
          setVariantsByAttribute({});
        }
      } else {
        // API không trả về data hoặc lỗi, giả sử không có variant
        setVariants([]);
        setAvailableVariants([]);
        setVariantsByAttribute({});
      }
    } catch (error: any) {
      // Nếu lỗi, giả sử không có variant và cho phép thêm sản phẩm không có variant
      console.error('Error loading variants:', error);
      setVariants([]);
      setAvailableVariants([]);
      setVariantsByAttribute({});
      // Không hiển thị lỗi vì có thể sản phẩm không có variant
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeChange = (attrName: string, value: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attrName]: value,
    }));
  };

  // Tìm variant phù hợp với các thuộc tính đã chọn
  const findMatchingVariant = useCallback(() => {
    const attributeNames = Object.keys(variantsByAttribute);
    if (attributeNames.length === 0) {
      // Không có variants, trả về null (sản phẩm không có variant)
      return null;
    }

    // Kiểm tra xem đã chọn đủ tất cả thuộc tính chưa
    const allSelected = attributeNames.every(attrName => selectedAttributes[attrName]);
    if (!allSelected) {
      return null;
    }

    // Tìm variant phù hợp
    const matchingVariant = availableVariants.find(v => {
      if (!v.variant_attributes) return false;
      return Object.keys(selectedAttributes).every(
        attrName => v.variant_attributes[attrName] === selectedAttributes[attrName]
      );
    });

    return matchingVariant || null;
  }, [selectedAttributes, variantsByAttribute, availableVariants]);

  const handleSelectVariant = () => {
    const matchingVariant = findMatchingVariant();
    
    if (matchingVariant) {
      onSelect(matchingVariant.id);
    } else {
      // Nếu không có variant nào phù hợp, có thể là sản phẩm không có variant
      // Hoặc chưa chọn đủ thuộc tính
      const attributeNames = Object.keys(variantsByAttribute);
      if (attributeNames.length === 0) {
        // Sản phẩm không có variant
        onSelect(null);
      } else {
        message.warning('Vui lòng chọn đầy đủ các thuộc tính sản phẩm');
      }
    }
  };

  const handleSelectNoVariant = () => {
    onSelect(null);
  };

  const attributeNames = Object.keys(variantsByAttribute);
  const matchingVariant = findMatchingVariant();
  const allAttributesSelected = attributeNames.length === 0 || attributeNames.every(attrName => selectedAttributes[attrName]);

  return (
    <Modal
      title={`Chọn biến thể cho: ${productName}`}
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        ...(attributeNames.length === 0 ? [
          <Button key="no-variant" type="primary" onClick={handleSelectNoVariant}>
            Chọn sản phẩm không biến thể
          </Button>
        ] : [
          <Button
            key="select"
            type="primary"
            onClick={handleSelectVariant}
            disabled={!allAttributesSelected || !matchingVariant}
          >
            Xác nhận
          </Button>
        ]),
      ]}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : attributeNames.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="secondary">Sản phẩm này không có biến thể</Text>
        </div>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {attributeNames.map((attrName) => (
            <div key={attrName}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                {attrName}:
              </Text>
              <Space wrap>
                {variantsByAttribute[attrName].map((value) => {
                  const isSelected = selectedAttributes[attrName] === value;
                  
                  // Kiểm tra xem có variant nào với giá trị này còn hàng không
                  const hasAvailableVariant = availableVariants.some(v => {
                    if (!v.variant_attributes) return false;
                    const matchesCurrentAttr = v.variant_attributes[attrName] === value;
                    const matchesOtherAttrs = Object.keys(selectedAttributes)
                      .filter(key => key !== attrName)
                      .every(key => v.variant_attributes[key] === selectedAttributes[key]);
                    return matchesCurrentAttr && matchesOtherAttrs && v.stock_quantity > 0;
                  });
                  
                  return (
                    <Button
                      key={value}
                      type={isSelected ? 'primary' : 'default'}
                      disabled={!hasAvailableVariant}
                      onClick={() => handleAttributeChange(attrName, value)}
                      style={{
                        minWidth: 80,
                        border: isSelected ? '2px solid #1890ff' : undefined,
                      }}
                    >
                      {value}
                    </Button>
                  );
                })}
              </Space>
            </div>
          ))}

          {/* Hiển thị thông tin variant đã chọn */}
          {matchingVariant && (
            <div style={{ 
              marginTop: 16, 
              padding: 12, 
              background: '#f0f2f5', 
              borderRadius: 4 
            }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Biến thể đã chọn:
              </Text>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  {Object.entries(matchingVariant.variant_attributes || {}).map(([key, val]) => (
                    <Tag key={key} color="blue" style={{ marginBottom: 4 }}>
                      {key}: {val}
                    </Tag>
                  ))}
                </div>
                <div>
                  <Text type="secondary">Tồn kho: </Text>
                  <Text strong style={{ color: matchingVariant.stock_quantity > 0 ? '#52c41a' : '#ff4d4f' }}>
                    {matchingVariant.stock_quantity > 0 ? `${matchingVariant.stock_quantity} sản phẩm` : 'Hết hàng'}
                  </Text>
                </div>
                {matchingVariant.price_adjustment !== 0 && (
                  <div>
                    <Text type="secondary">Điều chỉnh giá: </Text>
                    <Text strong style={{ color: matchingVariant.price_adjustment > 0 ? '#cf1322' : '#52c41a' }}>
                      {matchingVariant.price_adjustment > 0 ? '+' : ''}
                      {formatCurrency(matchingVariant.price_adjustment)}
                    </Text>
                  </div>
                )}
              </Space>
            </div>
          )}

          {!allAttributesSelected && attributeNames.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text type="warning">Vui lòng chọn đầy đủ các thuộc tính</Text>
            </div>
          )}
        </Space>
      )}
    </Modal>
  );
};

export default VariantSelectorModal;
