import React, { useEffect, useRef } from 'react';
import { Card, Row, Col, Input, Select, Button, Typography, Spin, Empty, Image, Tag, Space } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { Product } from '../../../shares/types';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import {
  fetchCategories,
  fetchProducts,
  setCategory,
  setSearch,
} from '../stores/productsSlice';
import { fetchWishlist, addToWishlist, removeFromWishlist } from '../stores/wishlistSlice';
import { useEffectOnce } from '../../../shares/hooks';

const { Title, Text } = Typography;

const ProductList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: products, categories, loading } = useAppSelector((state) => state.products);
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist);
  const searchInputRef = useRef<any>(null);
  const navigate = useNavigate();

  // Tạo Set từ wishlist items để kiểm tra nhanh
  const wishlistProductIds = new Set(wishlistItems.map(item => item.product_id));

  // Sử dụng useEffectOnce để tránh gọi API 2 lần trong StrictMode
  useEffectOnce(() => {
    dispatch(fetchCategories());
    dispatch(fetchProducts());
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleToggleWishlist = async (e: React.MouseEvent, productId: number) => {
    e.stopPropagation();
    try {
      if (wishlistProductIds.has(productId)) {
        await dispatch(removeFromWishlist(productId)).unwrap();
        message.success('Đã xóa khỏi danh sách yêu thích');
      } else {
        await dispatch(addToWishlist(productId)).unwrap();
        message.success('Đã thêm vào danh sách yêu thích');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleSearch = (value: string) => {
    dispatch(setSearch(value));
    dispatch(fetchProducts());
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
                value={useAppSelector((state) => state.products.filters.category_id)}
                onChange={(value) => {
                  dispatch(setCategory(value));
                  dispatch(fetchProducts());
                }}
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
                      src={product.image_url || product.image_urls?.[0] || '/placeholder.png'}
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
                    <Button
                      type={wishlistProductIds.has(product.id) ? 'primary' : 'default'}
                      danger={wishlistProductIds.has(product.id)}
                      icon={wishlistProductIds.has(product.id) ? <HeartFilled /> : <HeartOutlined />}
                      onClick={(e) => handleToggleWishlist(e, product.id)}
                    >
                      {wishlistProductIds.has(product.id) ? 'Đã yêu thích' : 'Yêu thích'}
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

