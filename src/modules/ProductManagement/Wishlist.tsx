import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Image,
  Button,
  Space,
  Tag,
  Empty,
  Spin,
  message,
  Popconfirm,
} from 'antd';
import {
  HeartOutlined,
  ShoppingCartOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { wishlistService, WishlistItem } from '../../shares/services/wishlistService';
import { cartService } from '../../shares/services/cartService';

const { Title, Text } = Typography;

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistService.getWishlist();
      if (response.success && response.data) {
        setWishlistItems(response.data);
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      const response = await wishlistService.removeFromWishlist(productId);
      if (response.success) {
        message.success('Đã xóa khỏi danh sách yêu thích');
        fetchWishlist();
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      const response = await cartService.addToCart({
        product_id: productId,
        quantity: 1,
      });
      if (response.success) {
        message.success('Đã thêm vào giỏ hàng');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/products')}
          style={{ marginRight: 16 }}
        >
          Quay lại
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          <HeartOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          Danh sách yêu thích
        </Title>
      </div>

      {wishlistItems.length === 0 ? (
        <Card>
          <Empty
            description="Danh sách yêu thích của bạn đang trống"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/products')}>
              Khám phá sản phẩm
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {wishlistItems.map((item) => (
            <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
              <Card
                hoverable
                cover={
                  <Image
                    alt={item.name}
                    src={item.image_urls?.[0] || '/placeholder.png'}
                    height={200}
                    style={{ objectFit: 'cover' }}
                    preview={false}
                    onClick={() => navigate(`/products/${item.product_id}`)}
                  />
                }
                actions={[
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handleAddToCart(item.product_id)}
                    disabled={!item.is_active || (item.stock_quantity || 0) === 0}
                  >
                    Thêm vào giỏ
                  </Button>,
                  <Popconfirm
                    title="Xóa khỏi danh sách yêu thích?"
                    onConfirm={() => handleRemove(item.product_id)}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      Xóa
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={
                    <div
                      onClick={() => navigate(`/products/${item.product_id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {item.name}
                    </div>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text strong style={{ fontSize: 18, color: '#cf1322' }}>
                        {item.price?.toLocaleString('vi-VN')} VNĐ
                      </Text>
                      <Tag color={item.stock_quantity && item.stock_quantity > 0 ? 'green' : 'red'}>
                        {item.stock_quantity && item.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                      </Tag>
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Wishlist;


