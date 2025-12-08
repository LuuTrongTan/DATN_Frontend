import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Image,
  Button,
  Space,
  InputNumber,
  Tag,
  Divider,
  Spin,
  Empty,
  message,
  Carousel,
  Descriptions,
  Alert,
} from 'antd';
import {
  ShoppingCartOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { productService } from '../../shares/services/productService';
import { cartService } from '../../shares/services/cartService';
import { Product } from '../../shares/types';

const { Title, Text, Paragraph } = Typography;

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(Number(id));
      if (response.success && response.data) {
        setProduct(response.data);
      } else {
        message.error('Không tìm thấy sản phẩm');
        navigate('/products');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải sản phẩm');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (product.stock_quantity < quantity) {
      message.error('Số lượng sản phẩm không đủ');
      return;
    }

    try {
      setAddingToCart(true);
      const response = await cartService.addToCart({
        product_id: product.id,
        quantity,
      });

      if (response.success) {
        message.success('Đã thêm vào giỏ hàng');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Empty description="Không tìm thấy sản phẩm" />
        <Button onClick={() => navigate('/products')}>Quay lại danh sách</Button>
      </div>
    );
  }

  const images = product.image_urls || [];
  const hasStock = product.stock_quantity > 0;
  const maxQuantity = Math.min(product.stock_quantity, 99);

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/products')}
        style={{ marginBottom: 24 }}
      >
        Quay lại
      </Button>

      <Row gutter={[24, 24]}>
        {/* Hình ảnh sản phẩm */}
        <Col xs={24} md={12}>
          <Card>
            {images.length > 0 ? (
              <Carousel autoplay>
                {images.map((url, index) => (
                  <div key={index}>
                    <Image
                      src={url}
                      alt={`${product.name} ${index + 1}`}
                      style={{ width: '100%', height: 500, objectFit: 'contain' }}
                      preview
                    />
                  </div>
                ))}
              </Carousel>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 500,
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text type="secondary">Không có hình ảnh</Text>
              </div>
            )}

            {/* Video nếu có */}
            {product.video_url && (
              <div style={{ marginTop: 16 }}>
                <video
                  src={product.video_url}
                  controls
                  style={{ width: '100%', maxHeight: 400 }}
                />
              </div>
            )}
          </Card>
        </Col>

        {/* Thông tin sản phẩm */}
        <Col xs={24} md={12}>
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Tên và trạng thái */}
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {product.name}
                </Title>
                <Space style={{ marginTop: 8 }}>
                  <Tag color={product.is_active ? 'green' : 'red'}>
                    {product.is_active ? 'Đang bán' : 'Ngừng bán'}
                  </Tag>
                  {product.category && (
                    <Tag color="blue">{product.category.name}</Tag>
                  )}
                </Space>
              </div>

              <Divider />

              {/* Giá */}
              <div>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  Giá bán:
                </Text>
                <Title level={3} style={{ margin: '8px 0', color: '#cf1322' }}>
                  {product.price.toLocaleString('vi-VN')} VNĐ
                </Title>
              </div>

              {/* Tồn kho */}
              <div>
                <Space>
                  <Text strong>Tồn kho:</Text>
                  {hasStock ? (
                    <Tag icon={<CheckCircleOutlined />} color="green">
                      Còn {product.stock_quantity} sản phẩm
                    </Tag>
                  ) : (
                    <Tag icon={<CloseCircleOutlined />} color="red">
                      Hết hàng
                    </Tag>
                  )}
                </Space>
              </div>

              {/* Số lượng */}
              {hasStock && (
                <div>
                  <Text strong>Số lượng:</Text>
                  <div style={{ marginTop: 8 }}>
                    <InputNumber
                      min={1}
                      max={maxQuantity}
                      value={quantity}
                      onChange={(value) => setQuantity(value || 1)}
                      style={{ width: 120 }}
                    />
                  </div>
                </div>
              )}

              {/* Cảnh báo hết hàng */}
              {!hasStock && (
                <Alert
                  message="Sản phẩm hiện đang hết hàng"
                  type="warning"
                  showIcon
                />
              )}

              <Divider />

              {/* Nút hành động */}
              <Space size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleAddToCart}
                  loading={addingToCart}
                  disabled={!hasStock}
                  style={{ flex: 1 }}
                >
                  Thêm vào giỏ hàng
                </Button>
                <Button
                  type="default"
                  size="large"
                  onClick={handleBuyNow}
                  loading={addingToCart}
                  disabled={!hasStock}
                  style={{ flex: 1 }}
                >
                  Mua ngay
                </Button>
              </Space>

              {/* Thông tin chi tiết */}
              <Divider />
              <Descriptions title="Thông tin sản phẩm" column={1} bordered>
                <Descriptions.Item label="Mã sản phẩm">
                  #{product.id}
                </Descriptions.Item>
                <Descriptions.Item label="Danh mục">
                  {product.category?.name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Giá">
                  {product.price.toLocaleString('vi-VN')} VNĐ
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng tồn kho">
                  {product.stock_quantity}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={product.is_active ? 'green' : 'red'}>
                    {product.is_active ? 'Đang bán' : 'Ngừng bán'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Mô tả sản phẩm */}
      {product.description && (
        <Card title="Mô tả sản phẩm" style={{ marginTop: 24 }}>
          <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 16 }}>
            {product.description}
          </Paragraph>
        </Card>
      )}
    </div>
  );
};

export default ProductDetail;
