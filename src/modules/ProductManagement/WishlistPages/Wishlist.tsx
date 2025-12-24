import React, { useEffect } from 'react';
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
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { addWishlistItemToCart, fetchWishlist, removeFromWishlist } from '../stores/wishlistSlice';
import { getAuthToken } from '../../../shares/api';

const { Title, Text } = Typography;

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: wishlistItems, loading, error } = useAppSelector((state) => state.wishlist);

  // Fetch wishlist khi component mount hoặc khi navigate vào trang
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      message.warning('Vui lòng đăng nhập để xem danh sách yêu thích');
      navigate('/login');
      return;
    }

    console.log('Wishlist component mounted, fetching wishlist...');
    dispatch(fetchWishlist())
      .then((result) => {
        console.log('Wishlist fetch result:', result);
        if (result.type === 'wishlist/fetchWishlist/fulfilled') {
          console.log('Wishlist items:', result.payload);
          if (Array.isArray(result.payload) && result.payload.length === 0) {
            console.log('Wishlist is empty');
          }
        } else if (result.type === 'wishlist/fetchWishlist/rejected') {
          console.error('Wishlist fetch error:', result.error);
          const errorMessage = result.error?.message || 'Không thể tải danh sách yêu thích';
          message.error(errorMessage);
        }
      })
      .catch((error) => {
        console.error('Wishlist fetch exception:', error);
        message.error('Có lỗi xảy ra khi tải danh sách yêu thích');
      });
  }, [dispatch, navigate]);

  const handleRemove = async (productId: number) => {
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
      message.success('Đã xóa khỏi danh sách yêu thích');
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await dispatch(addWishlistItemToCart(productId)).unwrap();
      message.success('Đã thêm vào giỏ hàng');
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
      <Title level={2} style={{ marginBottom: 24 }}>
        <HeartOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
        Danh sách yêu thích
      </Title>

      {error && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: 'red' }}>
            <strong>Lỗi:</strong> {error}
          </div>
        </Card>
      )}

      {!loading && wishlistItems.length === 0 ? (
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
          {wishlistItems
            .filter((item) => item.product_id) // Lọc bỏ các item không có product_id
            .map((item) => {
              const productName = item.name || 'Sản phẩm không có tên';
              const productPrice = item.price ?? 0;
              const productImage = item.image_url || item.image_urls?.[0] || '/placeholder.png';
              const stockQty = item.stock_quantity ?? 0;
              const isActive = item.is_active !== false; // Mặc định true nếu undefined

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                  <Card
                    hoverable
                    cover={
                      <Image
                        alt={productName}
                        src={productImage}
                        height={200}
                        style={{ objectFit: 'cover' }}
                        preview={false}
                        onClick={() => {
                          if (item.product_id) {
                            navigate(`/products/${item.product_id}`);
                          }
                        }}
                        fallback="/placeholder.png"
                      />
                    }
                    actions={[
                      <Button
                        key="cart"
                        type="primary"
                        icon={<ShoppingCartOutlined />}
                        onClick={() => handleAddToCart(item.product_id)}
                        disabled={!isActive || stockQty === 0}
                        block
                      >
                        Thêm vào giỏ
                      </Button>,
                      <Popconfirm
                        key="delete"
                        title="Xóa khỏi danh sách yêu thích?"
                        description="Bạn có chắc chắn muốn xóa sản phẩm này?"
                        onConfirm={() => handleRemove(item.product_id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button danger icon={<DeleteOutlined />} block>
                          Xóa
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div
                          onClick={() => {
                            if (item.product_id) {
                              navigate(`/products/${item.product_id}`);
                            }
                          }}
                          style={{ 
                            cursor: item.product_id ? 'pointer' : 'default',
                            minHeight: 22,
                          }}
                          title={productName}
                        >
                          <Text 
                            ellipsis={{ tooltip: productName }}
                            style={{ fontSize: 16, fontWeight: 500 }}
                          >
                            {productName}
                          </Text>
                        </div>
                      }
                      description={
                        <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
                          <Text strong style={{ fontSize: 18, color: '#cf1322' }}>
                            {productPrice > 0 
                              ? `${productPrice.toLocaleString('vi-VN')} VNĐ`
                              : 'Liên hệ'
                            }
                          </Text>
                          <Tag 
                            color={isActive && stockQty > 0 ? 'green' : 'red'}
                            style={{ marginTop: 4 }}
                          >
                            {isActive && stockQty > 0 
                              ? `Còn hàng (${stockQty})` 
                              : 'Hết hàng'
                            }
                          </Tag>
                        </Space>
                      }
                    />
                  </Card>
                </Col>
              );
            })}
        </Row>
      )}
    </div>
  );
};

export default Wishlist;


