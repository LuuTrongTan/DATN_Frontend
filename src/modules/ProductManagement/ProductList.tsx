import React, { useEffect, useState, useRef } from 'react';
import { Card, Row, Col, Input, Select, Button, Typography, Spin, Empty, Image, Tag, Space } from 'antd';
import { SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { productService } from '../../shares/services/productService';
import { categoryService } from '../../shares/services/categoryService';
import { Product, Category } from '../../shares/types';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const searchInputRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts({
        search: searchQuery || undefined,
        category_id: selectedCategory,
        limit: 20,
      });
      
      if (response.success && response.data) {
        setProducts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <div>
      <Title level={2}>Danh sách sản phẩm</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 24 }}>
        {/* Search and Filter */}
        <Card>
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  ref={searchInputRef}
                  placeholder="Tìm kiếm sản phẩm..."
                  allowClear
                  size="large"
                  onPressEnter={(e) => handleSearch(e.currentTarget.value)}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  size="large"
                  onClick={() => {
                    const value = searchInputRef.current?.input?.value || '';
                    handleSearch(value);
                  }}
                >
                  Tìm kiếm
                </Button>
              </Space.Compact>
            </Col>
            <Col xs={24} sm={8}>
              <Select
                placeholder="Chọn danh mục"
                allowClear
                style={{ width: '100%' }}
                size="large"
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value)}
              >
                {categories.map((category) => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : products.length === 0 ? (
          <Empty description="Không tìm thấy sản phẩm nào" />
        ) : (
          <Row gutter={[16, 16]}>
            {products.map((product) => (
              <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                <Card
                  hoverable
                  cover={
                    <Image
                      alt={product.name}
                      src={product.image_urls?.[0] || '/placeholder.png'}
                      height={200}
                      style={{ objectFit: 'cover' }}
                      preview={false}
                    />
                  }
                  onClick={() => navigate(`/products/${product.id}`)}
                  actions={[
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/products/${product.id}`);
                      }}
                    >
                      Xem chi tiết
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={product.name}
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text type="secondary" ellipsis>
                          {product.description || 'Không có mô tả'}
                        </Text>
                        <div>
                          <Text strong style={{ fontSize: 18, color: '#cf1322' }}>
                            {product.price.toLocaleString('vi-VN')} VNĐ
                          </Text>
                        </div>
                        <div>
                          <Tag color={product.stock_quantity > 0 ? 'green' : 'red'}>
                            {product.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                          </Tag>
                        </div>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Space>
    </div>
  );
};

export default ProductList;

