import React, { useEffect, useState, useCallback } from 'react';
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
import { useAuth } from '../../../shares/contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [variantsByAttribute, setVariantsByAttribute] = useState<Record<string, string[]>>({});
  const [availableVariants, setAvailableVariants] = useState<ProductVariant[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [zoomPosition, setZoomPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Lấy trạng thái từ Redux - PHẢI gọi trước các useEffect
  const { loading: cartLoading } = useAppSelector((state) => state.cart);
  const { loading: wishlistLoading, checkedProducts } = useAppSelector((state) => state.wishlist);
  const { items: reviews, loading: reviewsLoading } = useAppSelector((state) => state.reviews);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const productId = id ? Number(id) : null;
  const isInWishlist = productId ? (checkedProducts[productId] ?? false) : false;
  const addingToCart = cartLoading;

  // Định nghĩa fetchProduct trước khi sử dụng trong useEffect
  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await productService.getProductById(Number(id));
      if (response.success && response.data) {
        setProduct(response.data);
        
        // Organize variants by attribute names and values
        if (response.data.variants && response.data.variants.length > 0) {
          const organized: Record<string, string[]> = {};
          const variants = response.data.variants;
          
          // Lấy tất cả các attribute names từ variants
          variants.forEach((variant: ProductVariant) => {
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
          setAvailableVariants(variants);
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
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchProduct();
      if (productId) {
        // Chỉ check wishlist nếu user đã đăng nhập
        if (isAuthenticated) {
          dispatch(checkWishlist(productId));
        }
        // Reviews là public API, có thể fetch luôn
        dispatch(fetchProductReviews({ productId, limit: 10 }));
      }
    }
  }, [id, dispatch, productId, isAuthenticated, fetchProduct]);

  // Reset selectedImageIndex khi displayImages thay đổi - PHẢI đặt trước early return
  useEffect(() => {
    if (product) {
      const displayImages = selectedVariant && selectedVariant.image_urls && selectedVariant.image_urls.length > 0
        ? selectedVariant.image_urls
        : product.image_urls || (product.image_url ? [product.image_url] : []);
      
      if (displayImages.length > 0 && selectedImageIndex >= displayImages.length) {
        setSelectedImageIndex(0);
      }
    }
  }, [product, selectedVariant, selectedImageIndex]);


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
    const attributeNames = Object.keys(variantsByAttribute);
    if (attributeNames.length > 0 && !selectedVariant) {
      // Kiểm tra xem đã chọn đủ tất cả thuộc tính chưa
      const allSelected = attributeNames.every(attrName => selectedAttributes[attrName]);
      if (!allSelected) {
        message.warning('Vui lòng chọn đầy đủ các thuộc tính sản phẩm');
        return;
      }
      
      // Tìm variant phù hợp với các thuộc tính đã chọn
      const matchingVariant = availableVariants.find(v => {
        if (!v.variant_attributes) return false;
        return Object.keys(selectedAttributes).every(
          attrName => v.variant_attributes[attrName] === selectedAttributes[attrName]
        );
      });
      
      if (!matchingVariant) {
        message.warning('Không tìm thấy biến thể phù hợp với lựa chọn');
      return;
      }
      
      setSelectedVariant(matchingVariant);
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
      await dispatch(
        addToCart({
          product_id: product.id,
          variant_id: selectedVariant?.id || null,
          quantity,
        })
      ).unwrap();
      message.success('Đã thêm vào giỏ hàng');
      setQuantity(1);
      setSelectedVariant(null);
      setSelectedAttributes({});
    } catch (error: any) {
      // Map một số mã lỗi quan trọng từ backend sang thông điệp thân thiện
      if (error.code === 'INSUFFICIENT_STOCK') {
        const available = error.details?.available;
        message.error(
          available !== undefined
            ? `Số lượng sản phẩm không đủ. Chỉ còn ${available} sản phẩm trong kho.`
            : 'Số lượng sản phẩm không đủ trong kho.'
        );
        return;
      }
      if (error.code === 'STOCK_NOT_AVAILABLE') {
        message.error('Không xác định được tồn kho sản phẩm. Vui lòng tải lại trang và thử lại.');
        return;
      }
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

  // Lấy images để hiển thị: ưu tiên variant images nếu có variant được chọn và variant có images
  const getDisplayImages = () => {
    if (selectedVariant && selectedVariant.image_urls && selectedVariant.image_urls.length > 0) {
      // Nếu có variant được chọn và variant có images, hiển thị variant images
      return selectedVariant.image_urls;
    }
    // Ngược lại, hiển thị product images
    return product.image_urls || (product.image_url ? [product.image_url] : []);
  };
  
  const displayImages = getDisplayImages();
  
  // Calculate current price and stock based on selected variant
  const currentPrice = selectedVariant 
    ? product.price + (selectedVariant.price_adjustment || 0)
    : product.price;
  
  const availableStock = selectedVariant 
    ? selectedVariant.stock_quantity 
    : product.stock_quantity;
  
  const hasStock = availableStock > 0;
  const maxQuantity = Math.min(availableStock, 99);
  
  // Group variants by attribute for display
  const attributeNames = Object.keys(variantsByAttribute);
  
  // Khi chọn thuộc tính, tìm variant phù hợp
  const handleAttributeChange = (attrName: string, value: string) => {
    const newSelected = { ...selectedAttributes, [attrName]: value };
    setSelectedAttributes(newSelected);
    
    // Tìm variant phù hợp
    const matchingVariant = availableVariants.find(v => {
      if (!v.variant_attributes) return false;
      return Object.keys(newSelected).every(
        key => v.variant_attributes[key] === newSelected[key]
      );
    });
    
    setSelectedVariant(matchingVariant || null);
    if (matchingVariant) {
      setQuantity(1);
    }
  };

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
          <Card
            style={{
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {displayImages.length > 0 ? (
              <Image.PreviewGroup>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 16,
                  }}
                >
                  {/* Thumbnail Gallery - Desktop: bên trái, Mobile: trên */}
                  {displayImages.length > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'row' : 'column',
                        gap: 8,
                        flexShrink: 0,
                        overflowX: isMobile ? 'auto' : 'visible',
                        overflowY: isMobile ? 'visible' : 'auto',
                        maxHeight: isMobile ? 'none' : '500px',
                        maxWidth: isMobile ? '100%' : '80px',
                        paddingBottom: isMobile ? 8 : 0,
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'thin',
                      }}
                    >
                      {displayImages.map((url, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          style={{
                            width: 80,
                            height: 80,
                            minWidth: 80,
                            minHeight: 80,
                            border: selectedImageIndex === index ? '2px solid #1890ff' : '2px solid #e8e8e8',
                            borderRadius: 4,
                            padding: 4,
                            cursor: 'pointer',
                            backgroundColor: '#ffffff',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            boxShadow: selectedImageIndex === index ? '0 2px 8px rgba(24,144,255,0.2)' : 'none',
                          }}
                          onMouseEnter={(e) => {
                            if (!isMobile) {
                              e.currentTarget.style.borderColor = '#1890ff';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isMobile) {
                              if (selectedImageIndex !== index) {
                                e.currentTarget.style.borderColor = '#e8e8e8';
                              }
                              e.currentTarget.style.transform = 'scale(1)';
                            }
                          }}
                        >
                          <Image
                            src={url}
                            alt={`${product.name} thumbnail ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                            }}
                            preview={false}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main Image Container */}
                  <div
                    style={{
                      flex: 1,
                      position: 'relative',
                      aspectRatio: '1 / 1',
                      backgroundColor: '#ffffff',
                      borderRadius: 4,
                      overflow: 'hidden',
                      border: '1px solid #f0f0f0',
                      minHeight: isMobile ? 300 : 0,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* Desktop: Main image with zoom */}
                    {!isMobile && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={() => setIsZooming(true)}
                        onMouseLeave={() => {
                          setIsZooming(false);
                          setZoomPosition({ x: 50, y: 50 });
                        }}
                        onMouseMove={(e) => {
                          if (!isZooming) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          setZoomPosition({ x, y });
                        }}
                      >
                        <Image
                          src={displayImages[selectedImageIndex]}
                          alt={`${product.name} ${selectedImageIndex + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            transform: isZooming ? 'scale(2)' : 'scale(1)',
                            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            transition: isZooming ? 'none' : 'transform 0.3s ease',
                            cursor: isZooming ? 'zoom-in' : 'pointer',
                          }}
                          preview={{
                            mask: 'Xem',
                          }}
                        />
                      </div>
                    )}

                    {/* Mobile: Carousel */}
                    {isMobile && (
                      <Carousel
                        dots={true}
                        afterChange={(current) => setSelectedImageIndex(current)}
                        initialSlide={selectedImageIndex}
                        style={{ height: '100%' }}
                      >
                        {displayImages.map((url, index) => (
                          <div
                            key={index}
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#ffffff',
                            }}
                          >
                            <Image
                              src={url}
                              alt={`${product.name} ${index + 1}`}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain',
                              }}
                              preview={{
                                mask: `Xem tất cả (${displayImages.length})`,
                              }}
                            />
                          </div>
                        ))}
                      </Carousel>
                    )}
                  </div>
                </div>

                {/* Render tất cả images trong PreviewGroup để có thể navigate trong preview */}
                {displayImages.map((url, index) => (
                  <Image
                    key={`preview-group-${index}`}
                    src={url}
                    alt={`${product.name} - ${index + 1}`}
                    style={{ display: 'none' }}
                    preview={{}}
                  />
                ))}
              </Image.PreviewGroup>
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                }}
              >
                <Text type="secondary">Không có hình ảnh</Text>
              </div>
            )}

            {/* Thông báo nếu đang hiển thị variant images */}
            {selectedVariant && selectedVariant.image_urls && selectedVariant.image_urls.length > 0 && (
              <Alert
                message={`Đang hiển thị ảnh của biến thể: ${Object.entries(selectedVariant.variant_attributes || {})
                  .map(([key, val]) => `${key}: ${val}`)
                  .join(', ')}`}
                type="info"
                style={{ marginTop: 16 }}
                showIcon
              />
            )}

            {/* Video nếu có (chỉ hiển thị video của product, không phải variant) */}
            {product.video_url && (
              <div style={{ marginTop: 16 }}>
                <Divider>Video sản phẩm</Divider>
                <video
                  src={product.video_url}
                  controls
                  style={{ width: '100%', maxHeight: 400, borderRadius: 4 }}
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
              {attributeNames.length > 0 && (
                <div>
                  {attributeNames.map((attrName) => (
                    <div key={attrName} style={{ marginBottom: 16 }}>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        {attrName === 'Size' ? 'Kích thước' : 
                         attrName === 'Color' ? 'Màu sắc' : 
                         attrName === 'Material' ? 'Chất liệu' : 
                         attrName}:
                      </Text>
                      <Space wrap>
                        {variantsByAttribute[attrName].map((value) => {
                          const isSelected = selectedAttributes[attrName] === value;
                          
                          // Kiểm tra xem có variant nào với giá trị này còn hàng không
                          const hasAvailableVariant = availableVariants.some(v => {
                            if (!v.variant_attributes) return false;
                            // Kiểm tra variant có thuộc tính này và các thuộc tính đã chọn khác
                            const matchesCurrentAttr = v.variant_attributes[attrName] === value;
                            const matchesOtherAttrs = Object.keys(selectedAttributes)
                              .filter(key => key !== attrName)
                              .every(key => v.variant_attributes[key] === selectedAttributes[key]);
                            return matchesCurrentAttr && matchesOtherAttrs && v.stock_quantity > 0;
                          });
                          
                          // Tìm variant phù hợp để kiểm tra xem có images không
                          const matchingVariant = availableVariants.find(v => {
                            if (!v.variant_attributes) return false;
                            const matchesCurrentAttr = v.variant_attributes[attrName] === value;
                            const matchesOtherAttrs = Object.keys(selectedAttributes)
                              .filter(key => key !== attrName)
                              .every(key => v.variant_attributes[key] === selectedAttributes[key]);
                            return matchesCurrentAttr && matchesOtherAttrs;
                          });
                          const hasVariantImages = matchingVariant?.image_urls && matchingVariant.image_urls.length > 0;
                          
                          return (
                            <Button
                              key={value}
                              type={isSelected ? 'primary' : 'default'}
                              disabled={!hasAvailableVariant}
                              onClick={() => handleAttributeChange(attrName, value)}
                              style={{
                                minWidth: 80,
                                border: isSelected ? '2px solid #1890ff' : undefined,
                                position: 'relative',
                              }}
                            >
                              <Space size={4}>
                                <span>{value}</span>
                                {hasVariantImages && (
                                  <Tag 
                                    color="orange" 
                                    style={{ 
                                      fontSize: 10,
                                      lineHeight: '14px',
                                      padding: '0 4px',
                                      margin: 0
                                    }}
                                  >
                                    Ảnh
                                  </Tag>
                                )}
                                {!hasAvailableVariant && <span>(Hết)</span>}
                              </Space>
                            </Button>
                          );
                        })}
                      </Space>
                    </div>
                  ))}
                  {selectedVariant && (
                    <Alert
                      message={`Đã chọn: ${Object.entries(selectedVariant.variant_attributes || {})
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(', ')}`}
                      type="info"
                      style={{ marginTop: 8 }}
                      closable
                      onClose={() => {
                        setSelectedVariant(null);
                        setSelectedAttributes({});
                      }}
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
                  {selectedVariant && selectedVariant.variant_attributes && (
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      (Biến thể: {Object.entries(selectedVariant.variant_attributes)
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(', ')})
                    </Text>
                  )}
                </Descriptions.Item>
                {attributeNames.length > 0 && (
                  <Descriptions.Item label="Biến thể có sẵn">
                    {attributeNames.map((attrName) => (
                      <div key={attrName} style={{ marginBottom: 4 }}>
                        <Text strong>{attrName}: </Text>
                        <Text>
                          {variantsByAttribute[attrName].join(', ')}
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
