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
  HeartOutlined,
  HeartFilled,
  StarFilled,
} from '@ant-design/icons';
import { productService } from '../../../shares/services/productService';
import { Product, ProductVariant } from '../../../shares/types';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { addToCart } from '../stores/cartSlice';
import { addToWishlist, removeFromWishlist, checkWishlist } from '../stores/wishlistSlice';
import { fetchProductReviews } from '../stores/reviewsSlice';
import { logger } from '../../../shares/utils/logger';

const { Title, Text, Paragraph } = Typography;

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [variantsByType, setVariantsByType] = useState<Record<string, ProductVariant[]>>({});
  
  // Lấy trạng thái từ Redux
  const { loading: cartLoading } = useAppSelector((state) => state.cart);
  const { loading: wishlistLoading, checkedProducts } = useAppSelector((state) => state.wishlist);
  const { items: reviews, loading: reviewsLoading } = useAppSelector((state) => state.reviews);
  const productId = id ? Number(id) : null;
  const isInWishlist = productId ? (checkedProducts[productId] ?? false) : false;
  const addingToCart = cartLoading;

  useEffect(() => {
    if (id) {
      fetchProduct();
      if (productId) {
        dispatch(checkWishlist(productId));
        dispatch(fetchProductReviews({ productId, limit: 10 }));
      }
    }
  }, [id, dispatch, productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(Number(id));
      if (response.success && response.data) {
        setProduct(response.data);
        
        // Organize variants by type
        if (response.data.variants && response.data.variants.length > 0) {
          const organized: Record<string, ProductVariant[]> = {};
          response.data.variants.forEach((variant: ProductVariant) => {
            if (!organized[variant.variant_type]) {
              organized[variant.variant_type] = [];
            }
            organized[variant.variant_type].push(variant);
          });
          setVariantsByType(organized);
        }
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


  const handleToggleWishlist = async () => {
    if (!product) return;

    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(product.id)).unwrap();
        message.success('Đã xóa khỏi danh sách yêu thích');
      } else {
        await dispatch(addToWishlist(product.id)).unwrap();
        message.success('Đã thêm vào danh sách yêu thích');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Check if variant is required but not selected
    const variantTypes = Object.keys(variantsByType);
    if (variantTypes.length > 0 && !selectedVariant) {
      message.warning('Vui lòng chọn biến thể sản phẩm');
      return;
    }

    // Check stock
    const availableStock = selectedVariant 
      ? selectedVariant.stock_quantity 
      : product.stock_quantity;

    if (availableStock < quantity) {
      message.error('Số lượng sản phẩm không đủ');
      return;
    }

    try {
      await dispatch(addToCart({
        product_id: product.id,
        variant_id: selectedVariant?.id || null,
        quantity,
      })).unwrap();
      message.success('Đã thêm vào giỏ hàng');
      setQuantity(1);
      setSelectedVariant(null);
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
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
  
  // Calculate current price and stock based on selected variant
  const currentPrice = selectedVariant 
    ? product.price + (selectedVariant.price_adjustment || 0)
    : product.price;
  
  const availableStock = selectedVariant 
    ? selectedVariant.stock_quantity 
    : product.stock_quantity;
  
  const hasStock = availableStock > 0;
  const maxQuantity = Math.min(availableStock, 99);
  
  // Group variants by type for display
  const variantTypes = Object.keys(variantsByType);

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
                  {currentPrice.toLocaleString('vi-VN')} VNĐ
                </Title>
                {selectedVariant && selectedVariant.price_adjustment !== 0 && (
                  <Text type="secondary" style={{ fontSize: 14, display: 'block', marginTop: 4 }}>
                    (Giá gốc: {product.price.toLocaleString('vi-VN')} VNĐ
                    {selectedVariant.price_adjustment > 0 ? ' +' : ' '}
                    {selectedVariant.price_adjustment.toLocaleString('vi-VN')} VNĐ)
                  </Text>
                )}
              </div>

              {/* Chọn biến thể */}
              {variantTypes.length > 0 && (
                <div>
                  {variantTypes.map((type) => (
                    <div key={type} style={{ marginBottom: 16 }}>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        {type === 'size' ? 'Kích thước' : 
                         type === 'color' ? 'Màu sắc' : 
                         type === 'material' ? 'Chất liệu' : 
                         type.charAt(0).toUpperCase() + type.slice(1)}:
                      </Text>
                      <Space wrap>
                        {variantsByType[type].map((variant) => {
                          const isSelected = selectedVariant?.id === variant.id;
                          const isOutOfStock = variant.stock_quantity === 0;
                          
                          return (
                            <Button
                              key={variant.id}
                              type={isSelected ? 'primary' : 'default'}
                              disabled={isOutOfStock}
                              onClick={() => {
                                setSelectedVariant(variant);
                                setQuantity(1);
                              }}
                              style={{
                                minWidth: 80,
                                border: isSelected ? '2px solid #1890ff' : undefined,
                              }}
                            >
                              {variant.variant_value}
                              {isOutOfStock && ' (Hết)'}
                            </Button>
                          );
                        })}
                      </Space>
                    </div>
                  ))}
                  {selectedVariant && (
                    <Alert
                      message={`Đã chọn: ${selectedVariant.variant_type} - ${selectedVariant.variant_value}`}
                      type="info"
                      style={{ marginTop: 8 }}
                      closable
                      onClose={() => setSelectedVariant(null)}
                    />
                  )}
                </div>
              )}

              {/* Tồn kho */}
              <div>
                <Space>
                  <Text strong>Tồn kho:</Text>
                  {hasStock ? (
                    <Tag icon={<CheckCircleOutlined />} color="green">
                      Còn {availableStock} sản phẩm
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
                <Button
                  type={isInWishlist ? 'primary' : 'default'}
                  size="large"
                  icon={isInWishlist ? <HeartFilled /> : <HeartOutlined />}
                  onClick={handleToggleWishlist}
                  loading={wishlistLoading}
                  danger={isInWishlist}
                >
                  {isInWishlist ? 'Đã yêu thích' : 'Yêu thích'}
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
                  {currentPrice.toLocaleString('vi-VN')} VNĐ
                  {selectedVariant && selectedVariant.price_adjustment !== 0 && (
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      ({selectedVariant.price_adjustment > 0 ? '+' : ''}
                      {selectedVariant.price_adjustment.toLocaleString('vi-VN')} VNĐ)
                    </Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng tồn kho">
                  {availableStock}
                  {selectedVariant && (
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      (Biến thể: {selectedVariant.variant_type} - {selectedVariant.variant_value})
                    </Text>
                  )}
                </Descriptions.Item>
                {variantTypes.length > 0 && (
                  <Descriptions.Item label="Biến thể có sẵn">
                    {variantTypes.map((type) => (
                      <div key={type} style={{ marginBottom: 4 }}>
                        <Text strong>{type}: </Text>
                        <Text>
                          {variantsByType[type].map(v => v.variant_value).join(', ')}
                        </Text>
                      </div>
                    ))}
                  </Descriptions.Item>
                )}
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

      {/* Đánh giá sản phẩm */}
      <Card title="Đánh giá sản phẩm" style={{ marginTop: 24 }}>
        {reviewsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : reviews.length === 0 ? (
          <Empty description="Chưa có đánh giá nào" />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {reviews.map((review) => (
              <Card key={review.id} size="small">
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>{review.user?.full_name || 'Khách hàng'}</Text>
                      <div style={{ marginTop: 4 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarFilled
                            key={i}
                            style={{
                              color: i < review.rating ? '#faad14' : '#d9d9d9',
                              fontSize: 16,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(review.created_at).toLocaleDateString('vi-VN')}
                    </Text>
                  </div>
                  {review.comment && (
                    <Paragraph style={{ margin: 0 }}>{review.comment}</Paragraph>
                  )}
                  {review.image_urls && review.image_urls.length > 0 && (
                    <div>
                      <Image.PreviewGroup>
                        {review.image_urls.map((url, idx) => (
                          <Image
                            key={idx}
                            src={url}
                            width={80}
                            height={80}
                            style={{ objectFit: 'cover', marginRight: 8, borderRadius: 4 }}
                          />
                        ))}
                      </Image.PreviewGroup>
                    </div>
                  )}
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Card>
    </div>
  );
};

export default ProductDetail;
