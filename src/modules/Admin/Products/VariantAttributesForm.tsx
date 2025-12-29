import React, { useEffect, useState } from 'react';
import { Form, Select, Space, Button, Typography, Alert } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { variantService } from '../../../shares/services/variantService';
import { VariantAttributeDefinition } from '../../../shares/types';

const { Text } = Typography;
const { Option } = Select;

interface VariantAttributesFormProps {
  productId: number;
  value?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
  required?: boolean;
}

const VariantAttributesForm: React.FC<VariantAttributesFormProps> = ({
  productId,
  value = {},
  onChange,
  required = false,
}) => {
  const [definitions, setDefinitions] = useState<VariantAttributeDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(value);

  useEffect(() => {
    if (productId) {
      fetchDefinitions();
    }
  }, [productId]);

  useEffect(() => {
    setSelectedAttributes(value);
  }, [value]);

  const fetchDefinitions = async () => {
    try {
      setLoading(true);
      const response = await variantService.getAttributeDefinitions(productId);
      if (response.success && response.data) {
        setDefinitions(response.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching attribute definitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeChange = (attrName: string, attrValue: string) => {
    const newAttributes = { ...selectedAttributes, [attrName]: attrValue };
    setSelectedAttributes(newAttributes);
    onChange?.(newAttributes);
  };

  const handleRemoveAttribute = (attrName: string) => {
    const newAttributes = { ...selectedAttributes };
    delete newAttributes[attrName];
    setSelectedAttributes(newAttributes);
    onChange?.(newAttributes);
  };

  if (definitions.length === 0) {
    return (
      <Alert
        message="Chưa có thuộc tính nào"
        description="Vui lòng tạo định nghĩa thuộc tính trước (Size, Color...) trong tab 'Quản lý thuộc tính'"
        type="warning"
        showIcon
      />
    );
  }

  // Lấy các thuộc tính chưa được chọn
  const unselectedAttributes = definitions.filter(
    (def) => !selectedAttributes[def.attribute_name]
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {/* Hiển thị các thuộc tính đã chọn */}
      {Object.entries(selectedAttributes).map(([attrName, attrValue]) => {
        const definition = definitions.find((d) => d.attribute_name === attrName);
        if (!definition) return null;

        return (
          <Space key={attrName} style={{ width: '100%' }} align="start">
            <div style={{ flex: 1 }}>
              <Text strong>{definition.display_name}:</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                value={attrValue}
                onChange={(val) => handleAttributeChange(attrName, val)}
                placeholder={`Chọn ${definition.display_name}`}
                loading={loading}
              >
                {definition.values?.map((val) => (
                  <Option key={val.id} value={val.value}>
                    {val.value}
                  </Option>
                ))}
              </Select>
            </div>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveAttribute(attrName)}
            >
              Xóa
            </Button>
          </Space>
        );
      })}

      {/* Nút thêm thuộc tính */}
      {unselectedAttributes.length > 0 && (
        <Select
          style={{ width: '100%' }}
          placeholder="Thêm thuộc tính..."
          value={undefined}
          onChange={(attrName) => {
            const definition = definitions.find((d) => d.attribute_name === attrName);
            if (definition && definition.values && definition.values.length > 0) {
              // Tự động chọn giá trị đầu tiên
              handleAttributeChange(attrName, definition.values[0].value);
            }
          }}
        >
          {unselectedAttributes.map((def) => (
            <Option key={def.id} value={def.attribute_name}>
              {def.display_name} ({def.attribute_name})
            </Option>
          ))}
        </Select>
      )}

      {required && Object.keys(selectedAttributes).length === 0 && (
        <Alert
          message="Vui lòng chọn ít nhất một thuộc tính"
          type="error"
          showIcon
        />
      )}
    </Space>
  );
};

export default VariantAttributesForm;

