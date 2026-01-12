import React, { useState, useEffect } from 'react';
import { Card, Space, InputNumber, Typography, Tag, Checkbox, Table } from 'antd';
import VariantImageUpload from './VariantImageUpload';

const { Text, Title } = Typography;

interface VariantCombination {
  combination: Record<string, string>; // { Size: 'M', Color: 'Đỏ' }
  price: number; // Giá tuyệt đối
  stock_quantity: number;
  selected: boolean;
  image_urls: string[]; // URLs đã có sẵn
  imageFiles?: File[]; // Files chưa upload (cho create mode)
}

interface VariantCombinationEditorProps {
  attributes: Record<string, string[]>; // { Size: ['M', 'N'], Color: ['Đỏ', 'Xanh'] }
  basePrice?: number; // Giá gốc của sản phẩm để tính price_adjustment
  initialCombinations?: Array<{
    combination: Record<string, string>;
    price?: number; // Giá tuyệt đối (nếu có)
    price_adjustment?: number; // Điều chỉnh giá (nếu có, sẽ tính price = basePrice + price_adjustment)
    stock_quantity?: number;
    image_urls?: string[];
  }>; // Dữ liệu ban đầu khi edit variant
  onChange?: (combinations: Array<{
    combination: Record<string, string>;
    price: number; // Giá tuyệt đối
    price_adjustment: number; // Tính từ price - basePrice
    stock_quantity: number;
    image_urls: string[];
    imageFiles?: File[];
  }>) => void;
}

const VariantCombinationEditor: React.FC<VariantCombinationEditorProps> = ({
  attributes,
  basePrice = 0,
  initialCombinations = [],
  onChange,
}) => {
  // Tạo tất cả các tổ hợp từ các thuộc tính
  const generateCombinations = (attrs: Record<string, string[]>): Record<string, string>[] => {
    const keys = Object.keys(attrs);
    if (keys.length === 0) return [];

    const combinations: Record<string, string>[] = [];

    const generate = (index: number, current: Record<string, string>) => {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }
      const currentKey = keys[index];
      const values = attrs[currentKey];
      values.forEach((value) => {
        current[currentKey] = value;
        generate(index + 1, current);
      });
    };

    generate(0, {});
    return combinations;
  };

  const [combinations, setCombinations] = useState<VariantCombination[]>(() => {
    const combos = generateCombinations(attributes);
    return combos.map(combo => {
      // Tìm trong initialCombinations xem có dữ liệu cũ không
      const existing = initialCombinations.find(ic => 
        JSON.stringify(ic.combination) === JSON.stringify(combo)
      );
      
      if (existing) {
        // Nếu có dữ liệu cũ, tính price từ price hoặc price_adjustment
        let price = existing.price;
        if (price === undefined && existing.price_adjustment !== undefined) {
          // Nếu chỉ có price_adjustment, tính price = basePrice + price_adjustment
          price = basePrice + existing.price_adjustment;
        }
        return {
          combination: combo,
          price: price ?? basePrice,
          stock_quantity: existing.stock_quantity ?? 0,
          selected: true,
          image_urls: existing.image_urls || [],
          imageFiles: [],
        };
      }
      
      // Mặc định bằng giá gốc
      return {
        combination: combo,
        price: basePrice || 0,
        stock_quantity: 0,
        selected: true,
        image_urls: [],
        imageFiles: [],
      };
    });
  });

  useEffect(() => {
    // Cập nhật combinations khi attributes thay đổi
    const combos = generateCombinations(attributes);
    const newCombinations: VariantCombination[] = combos.map(combo => {
      // Tìm combination cũ nếu có
      const existing = combinations.find(c => 
        JSON.stringify(c.combination) === JSON.stringify(combo)
      );
      
      // Tìm trong initialCombinations
      const initialData = initialCombinations.find(ic => 
        JSON.stringify(ic.combination) === JSON.stringify(combo)
      );
      
      if (existing) {
        return existing;
      }
      
      if (initialData) {
        // Nếu có dữ liệu ban đầu, tính price
        let price = initialData.price;
        if (price === undefined && initialData.price_adjustment !== undefined) {
          price = basePrice + initialData.price_adjustment;
        }
        return {
          combination: combo,
          price: price ?? basePrice,
          stock_quantity: initialData.stock_quantity ?? 0,
          selected: true,
          image_urls: initialData.image_urls || [],
          imageFiles: [],
        };
      }
      
      return {
        combination: combo,
        price: basePrice || 0, // Mặc định bằng giá gốc
        stock_quantity: 0,
        selected: true,
        image_urls: [],
        imageFiles: [],
      };
    });
    setCombinations(newCombinations);
  }, [JSON.stringify(attributes)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Gọi onChange khi có thay đổi
    if (onChange) {
      const selected = combinations.filter(c => c.selected);
      onChange(
        selected.map(c => ({
          combination: c.combination,
          price: c.price,
          price_adjustment: c.price - basePrice, // Tính price_adjustment từ giá tuyệt đối
          stock_quantity: c.stock_quantity,
          image_urls: c.image_urls || [],
          imageFiles: c.imageFiles || [],
        }))
      );
    }
  }, [combinations, onChange, basePrice]);

  const handleCombinationChange = (
    index: number,
    field: 'price' | 'stock_quantity' | 'selected' | 'image_urls' | 'imageFiles',
    value: any
  ) => {
    const newCombinations = [...combinations];
    (newCombinations[index] as any)[field] = value !== undefined ? value : (field === 'selected' ? false : (field === 'image_urls' || field === 'imageFiles' ? [] : 0));
    setCombinations(newCombinations);
  };

  const handleImageChange = (index: number, urls: string[], files?: File[]) => {
    const newCombinations = [...combinations];
    newCombinations[index] = {
      ...newCombinations[index],
      image_urls: urls,
      imageFiles: files || [],
    };
    setCombinations(newCombinations);
  };

  const formatCombinationLabel = (combination: Record<string, string>): string => {
    return Object.entries(combination)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  if (combinations.length === 0) {
    return null;
  }

  const columns = [
    {
      title: 'Tổ hợp biến thể',
      dataIndex: 'combination',
      key: 'combination',
      width: '25%',
      render: (_: any, record: VariantCombination, index: number) => (
        <Space wrap>
          {Object.entries(record.combination).map(([key, value]) => (
            <Tag key={`${key}-${value}`} color="blue" style={{ margin: 0, fontSize: 12 }}>
              {key}: {value}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Ảnh',
      dataIndex: 'image_urls',
      key: 'image_urls',
      width: '30%',
      render: (_: any, record: VariantCombination, index: number) => (
        <VariantImageUpload
          value={record.image_urls || []}
          onChange={(urls, files) => handleImageChange(index, urls, files)}
          maxCount={10}
          disabled={!record.selected}
        />
      ),
    },
    {
      title: 'Giá (VNĐ)',
      dataIndex: 'price',
      key: 'price',
      width: '20%',
      render: (_: any, record: VariantCombination, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          size="small"
          value={record.price}
          onChange={(val) => handleCombinationChange(index, 'price', val || 0)}
          placeholder="0"
          min={0}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) =>
            value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0
          }
          disabled={!record.selected}
        />
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: '15%',
      render: (_: any, record: VariantCombination, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          size="small"
          value={record.stock_quantity}
          onChange={(val) => handleCombinationChange(index, 'stock_quantity', val || 0)}
          min={0}
          placeholder="0"
          disabled={!record.selected}
        />
      ),
    },
    {
      title: 'Chọn',
      dataIndex: 'selected',
      key: 'selected',
      width: '10%',
      render: (_: any, record: VariantCombination, index: number) => (
        <Checkbox
          checked={record.selected}
          onChange={(e) => handleCombinationChange(index, 'selected', e.target.checked)}
        />
      ),
    },
  ];

  return (
    <Card
      size="small"
      style={{
        border: '1px solid #e8e8e8',
        borderRadius: 6,
        marginTop: 16,
        backgroundColor: '#ffffff',
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <div>
          <Title level={5} style={{ margin: 0, marginBottom: 4, fontSize: 14, fontWeight: 600 }}>
            Nhập giá và tồn kho cho từng tổ hợp biến thể
          </Title>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Chọn và nhập giá tuyệt đối, tồn kho, ảnh cho từng tổ hợp cụ thể (ví dụ: Size: M, Color: Đỏ)
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={combinations}
          rowKey={(record) => JSON.stringify(record.combination)}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Space>
    </Card>
  );
};

export default VariantCombinationEditor;
