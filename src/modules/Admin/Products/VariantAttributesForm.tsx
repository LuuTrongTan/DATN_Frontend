import React, { useEffect, useState } from 'react';
import { Space, Button, Typography, Alert, Input, Card, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AttributeValueEditor from './AttributeValueEditor';
import VariantCombinationEditor from './VariantCombinationEditor';

const { Text, Title } = Typography;

interface VariantAttributesFormProps {
  value?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
  required?: boolean;
  basePrice?: number; // Giá gốc của sản phẩm
  initialCombinations?: Array<{
    combination: Record<string, string>;
    price?: number;
    price_adjustment?: number;
    stock_quantity?: number;
    image_urls?: string[];
  }>; // Dữ liệu ban đầu khi edit variant
  onCombinationsChange?: (combinations: Array<{
    combination: Record<string, string>;
    price: number; // Giá tuyệt đối
    price_adjustment: number; // Tính từ price - basePrice
    stock_quantity: number;
    image_urls: string[];
    imageFiles?: File[];
  }>) => void; // Callback khi combinations thay đổi
}

const VariantAttributesForm: React.FC<VariantAttributesFormProps> = ({
  value = {},
  onChange,
  required = false,
  basePrice = 0,
  initialCombinations = [],
  onCombinationsChange,
}) => {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(value);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');

  useEffect(() => {
    setSelectedAttributes(value);
  }, [value]);

  const handleRemoveAttribute = (attrName: string) => {
    const newAttributes = { ...selectedAttributes };
    delete newAttributes[attrName];
    setSelectedAttributes(newAttributes);
    onChange?.(newAttributes);
  };

  const handleEditAttribute = (oldAttrName: string, newAttrName: string, newValues: string[]) => {
    const newAttributes = { ...selectedAttributes };
    
    // Xóa thuộc tính cũ
    delete newAttributes[oldAttrName];
    
    // Thêm thuộc tính mới với tên và giá trị mới
    if (newValues.length > 0) {
      newAttributes[newAttrName] = newValues.join(', ');
    }
    
    setSelectedAttributes(newAttributes);
    onChange?.(newAttributes);
  };

  const handleAddManualAttribute = () => {
    if (!newAttributeName.trim() || !newAttributeValue.trim()) {
      return;
    }
    const attrName = newAttributeName.trim();
    const attrValue = newAttributeValue.trim();
    const newAttributes = { ...selectedAttributes, [attrName]: attrValue };
    setSelectedAttributes(newAttributes);
    onChange?.(newAttributes);
    setNewAttributeName('');
    setNewAttributeValue('');
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Thêm thuộc tính mới */}
      <Card
        size="small"
        style={{ 
          border: '1px dashed #d9d9d9',
          borderRadius: 6,
          backgroundColor: '#fafafa',
          transition: 'all 0.3s ease',
        }}
        bodyStyle={{ padding: '10px' }}
        hoverable={false}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddManualAttribute}
            disabled={!newAttributeName.trim() || !newAttributeValue.trim()}
            size="small"
            style={{
              borderRadius: 4,
              fontWeight: 500,
              fontSize: 12,
              minWidth: 80,
            }}
          >
            Thêm
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={0}>
          <div style={{ marginBottom: 6 }}>
            <Text strong style={{ fontSize: 13, color: '#262626', fontWeight: 600 }}>
              <PlusOutlined style={{ marginRight: 6, color: '#1890ff', fontSize: 12 }} />
              Thêm thuộc tính mới
            </Text>
          </div>
          <Row gutter={12}>
            <Col span={11}>
              <Text type="secondary" style={{ 
                display: 'block', 
                marginBottom: 2,
                fontSize: 11,
              }}>
                Tên thuộc tính
              </Text>
              <Input
                placeholder="Ví dụ: Size, Color, Material..."
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value)}
                size="small"
                onPressEnter={() => {
                  if (newAttributeValue.trim()) {
                    handleAddManualAttribute();
                  }
                }}
                style={{
                  borderRadius: 4,
                }}
              />
            </Col>
            <Col span={11}>
              <Text type="secondary" style={{ 
                display: 'block', 
                marginBottom: 2,
                fontSize: 11,
              }}>
                Giá trị
              </Text>
              <Input
                placeholder="Ví dụ: M, Đỏ, Cotton..."
                value={newAttributeValue}
                onChange={(e) => setNewAttributeValue(e.target.value)}
                size="small"
                onPressEnter={handleAddManualAttribute}
                style={{
                  borderRadius: 4,
                }}
              />
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Hiển thị các thuộc tính đã chọn bên dưới phần Thêm thuộc tính */}
      {Object.keys(selectedAttributes).length > 0 && (
        <div style={{ 
          marginTop: 16,
          padding: '12px',
          backgroundColor: '#ffffff',
          borderRadius: 6,
          border: '1px solid #f0f0f0',
        }}>
          <Title level={5} style={{ 
            marginBottom: 12,
            color: '#262626',
            fontWeight: 600,
            fontSize: 14,
          }}>
            Thuộc tính đã chọn ({Object.keys(selectedAttributes).length})
          </Title>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {Object.entries(selectedAttributes).map(([attrName, attrValue]) => {
              // Tách giá trị thành mảng
              const values = typeof attrValue === 'string' 
                ? attrValue.split(',').map(v => v.trim()).filter(v => v)
                : Array.isArray(attrValue) 
                  ? attrValue 
                  : [];
              
              return (
                <AttributeValueEditor
                  key={attrName}
                  attributeName={attrName}
                  displayName={attrName}
                  values={values}
                  onRemove={() => handleRemoveAttribute(attrName)}
                  onEdit={(newName: string, newValues: string[]) =>
                    handleEditAttribute(attrName, newName, newValues)
                  }
                />
              );
            })}
          </Space>
        </div>
      )}

      {/* Hiển thị editor cho các tổ hợp biến thể */}
      {Object.keys(selectedAttributes).length > 0 && (() => {
        // Tạo object chứa các thuộc tính và giá trị của chúng
        const attributesWithValues: Record<string, string[]> = {};
        Object.entries(selectedAttributes).forEach(([attrName, attrValue]) => {
          const values = typeof attrValue === 'string' 
            ? attrValue.split(',').map(v => v.trim()).filter(v => v)
            : Array.isArray(attrValue) 
              ? attrValue 
              : [];
          
          if (values.length > 0) {
            attributesWithValues[attrName] = values;
          }
        });

        // Chỉ hiển thị nếu có ít nhất 2 thuộc tính hoặc 1 thuộc tính có nhiều giá trị
        const hasMultipleAttributes = Object.keys(attributesWithValues).length > 1;
        const hasMultipleValues = Object.values(attributesWithValues).some(vals => vals.length > 1);
        
        if (hasMultipleAttributes || hasMultipleValues) {
          return (
            <VariantCombinationEditor
              attributes={attributesWithValues}
              basePrice={basePrice}
              initialCombinations={initialCombinations}
              onChange={(combinations) => {
                // Gọi callback để truyền combinations lên parent
                if (onCombinationsChange) {
                  onCombinationsChange(combinations);
                }
              }}
            />
          );
        }
        return null;
      })()}

      {required && Object.keys(selectedAttributes).length === 0 && (
        <Alert
          message="Vui lòng chọn ít nhất một thuộc tính"
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
};

export default VariantAttributesForm;

