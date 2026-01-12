import React, { useState, useEffect } from 'react';
import { Card, Space, InputNumber, Row, Col, Typography, Tag, Checkbox } from 'antd';

const { Text } = Typography;

interface VariantValue {
  value: string;
  price_adjustment: number;
  stock_quantity: number;
  selected: boolean;
}

interface VariantValueSelectorProps {
  attributeName: string;
  displayName: string;
  values: string[];
  onChange?: (selectedValues: Array<{
    value: string;
    price_adjustment: number;
    stock_quantity: number;
  }>) => void;
}

const VariantValueSelector: React.FC<VariantValueSelectorProps> = ({
  attributeName,
  displayName,
  values,
  onChange,
}) => {
  const [variantValues, setVariantValues] = useState<VariantValue[]>([]);

  useEffect(() => {
    // Khởi tạo với tất cả giá trị được chọn mặc định
    const initialValues: VariantValue[] = values.map((val) => ({
      value: val,
      price_adjustment: 0,
      stock_quantity: 0,
      selected: true,
    }));
    setVariantValues(initialValues);
  }, [values]);

  useEffect(() => {
    // Gọi onChange khi có thay đổi
    if (onChange) {
      const selected = variantValues.filter((v) => v.selected);
      onChange(
        selected.map((v) => ({
          value: v.value,
          price_adjustment: v.price_adjustment,
          stock_quantity: v.stock_quantity,
        }))
      );
    }
  }, [variantValues, onChange]);

  const handleValueChange = (index: number, field: 'selected' | 'price_adjustment' | 'stock_quantity', val: any) => {
    const newValues = [...variantValues];
    if (field === 'selected') {
      newValues[index].selected = val;
    } else if (field === 'price_adjustment') {
      newValues[index].price_adjustment = val || 0;
    } else if (field === 'stock_quantity') {
      newValues[index].stock_quantity = val || 0;
    }
    setVariantValues(newValues);
  };

  if (values.length === 0) {
    return null;
  }

  return (
    <Card
      size="small"
      style={{
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        marginBottom: 16,
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong style={{ fontSize: 14 }}>
            {displayName} ({attributeName})
          </Text>
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
            Chọn giá trị và điều chỉnh giá, tồn kho cho từng giá trị
          </Text>
        </div>

        {variantValues.map((variantValue, index) => (
          <Card
            key={index}
            size="small"
            style={{
              border: variantValue.selected ? '1px solid #1890ff' : '1px solid #e8e8e8',
              borderRadius: 6,
              backgroundColor: variantValue.selected ? '#f0f7ff' : '#fafafa',
            }}
            bodyStyle={{ padding: '12px' }}
          >
            <Row gutter={16} align="middle">
              <Col span={4}>
                <Checkbox
                  checked={variantValue.selected}
                  onChange={(e) => handleValueChange(index, 'selected', e.target.checked)}
                >
                  <Tag color={variantValue.selected ? 'blue' : 'default'} style={{ margin: 0 }}>
                    {variantValue.value}
                  </Tag>
                </Checkbox>
              </Col>
              <Col span={10}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Điều chỉnh giá (VNĐ)
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={variantValue.price_adjustment}
                    onChange={(val) => handleValueChange(index, 'price_adjustment', val)}
                    placeholder="0"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) =>
                      value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0
                    }
                    disabled={!variantValue.selected}
                  />
                </Space>
              </Col>
              <Col span={10}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Tồn kho
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={variantValue.stock_quantity}
                    onChange={(val) => handleValueChange(index, 'stock_quantity', val)}
                    min={0}
                    placeholder="0"
                    disabled={!variantValue.selected}
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        ))}
      </Space>
    </Card>
  );
};

export default VariantValueSelector;
