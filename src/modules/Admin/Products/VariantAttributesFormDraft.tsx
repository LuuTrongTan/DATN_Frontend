import React, { useEffect, useState } from 'react';
import { Select, Space, Button, Typography, Alert, Spin } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { variantService } from '../../../shares/services/variantService';
import { VariantAttributeDefinition } from '../../../shares/types';

const { Text } = Typography;
const { Option } = Select;

interface VariantAttributesFormDraftProps {
  categoryId?: number | null;
  value?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
  required?: boolean;
}

const VariantAttributesFormDraft: React.FC<VariantAttributesFormDraftProps> = ({
  categoryId,
  value = {},
  onChange,
  required = false,
}) => {
  const [definitions, setDefinitions] = useState<VariantAttributeDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(value);

  useEffect(() => {
    if (categoryId) {
      fetchDefinitions();
    } else {
      setDefinitions([]);
    }
  }, [categoryId]);

  useEffect(() => {
    setSelectedAttributes(value);
  }, [value]);

  const fetchDefinitions = async () => {
    if (!categoryId) return;
    try {
      setLoading(true);
      // Lấy attributes từ các sản phẩm cùng category
      const response = await variantService.getAllAttributeDefinitions({
        category_id: categoryId,
      });
      if (response.success && response.data) {
        // Group by attribute_name và merge values
        const grouped: Record<string, VariantAttributeDefinition> = {};
        response.data.forEach((attr: any) => {
          if (!grouped[attr.attribute_name]) {
            grouped[attr.attribute_name] = {
              id: attr.id,
              product_id: attr.product_id,
              attribute_name: attr.attribute_name,
              display_name: attr.display_name,
              display_order: attr.display_order,
              is_required: attr.is_required,
              created_at: attr.created_at,
              values: [],
            };
          }
          // Merge values
          if (attr.values && Array.isArray(attr.values)) {
            const existingValues = grouped[attr.attribute_name].values || [];
            const newValues = attr.values.filter(
              (v: any) => !existingValues.some((ev: any) => ev.value === v.value)
            );
            grouped[attr.attribute_name].values = [...existingValues, ...newValues];
          }
        });
        setDefinitions(Object.values(grouped));
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

  if (!categoryId) {
    return (
      <Alert
        message="Vui lòng chọn danh mục trước"
        description="Chọn danh mục sản phẩm để hiển thị các thuộc tính biến thể có sẵn từ các sản phẩm cùng danh mục"
        type="info"
        showIcon
      />
    );
  }

  if (loading) {
    return <Spin tip="Đang tải thuộc tính..." />;
  }

  if (definitions.length === 0) {
    return (
      <Alert
        message="Chưa có thuộc tính nào trong danh mục này"
        description="Bạn có thể nhập JSON thủ công hoặc tạo thuộc tính sau khi lưu sản phẩm"
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
        if (!definition) {
          // Nếu không tìm thấy trong definitions, vẫn hiển thị (có thể là nhập thủ công)
          return (
            <Space key={attrName} style={{ width: '100%' }} align="start">
              <div style={{ flex: 1 }}>
                <Text strong>{attrName}:</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={attrValue}
                  onChange={(val) => handleAttributeChange(attrName, val)}
                  placeholder={`Giá trị: ${attrValue}`}
                  mode="tags"
                  allowClear
                >
                  <Option value={attrValue}>{attrValue}</Option>
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
        }

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

export default VariantAttributesFormDraft;
