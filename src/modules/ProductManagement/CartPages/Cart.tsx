import React, { useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Empty,
  Row,
  Col,
  Alert,
  Skeleton,
  Modal,
  Grid,
} from 'antd';
import { ShoppingCartOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { CartItem } from '../../../shares/types';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchCart, removeCartItem, updateCartItemQuantity } from '../stores/cartSlice';
import { addToWishlist } from '../stores/wishlistSlice';
import CartItemCard from './CartItemCard';
import CartItemRow from './CartItemRow';
import CartSummary from './CartSummary';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { useBreakpoint } = Grid;

const Cart: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: cartItems, loading, error } = useAppSelector((state) => state.cart);
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md breakpoint is 768px

  // Fetch cart khi component mount hoặc khi navigate vào trang
  // ProtectedRoute đã xử lý việc kiểm tra authentication và hiển thị modal
  useEffect(() => {
    dispatch(fetchCart())
      .then((result) => {
        if (fetchCart.rejected.match(result)) {
          const errorMessage =
            (result.payload as string | undefined) ||
            result.error?.message ||
            'Không thể tải giỏ hàng';
          message.error(errorMessage);
        }
      })
      .catch(() => {
        message.error('Có lỗi xảy ra khi tải giỏ hàng');
      });
  }, [dispatch]);

  const handleUpdateQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      try {
        await dispatch(updateCartItemQuantity({ id: itemId, quantity })).unwrap();
        // Don't show success message for every quantity change to avoid spam
      } catch (error: any) {
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
        message.error(error.message || 'Có lỗi xảy ra');
      }
    },
    [dispatch]
  );

  const handleRemoveItem = useCallback(
    async (itemId: number) => {
      confirm({
        title: 'Xác nhận xóa',
        icon: <ExclamationCircleOutlined />,
        content: 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?',
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await dispatch(removeCartItem(itemId)).unwrap();
            message.success('Đã xóa sản phẩm khỏi giỏ hàng');
          } catch (error: any) {
            message.error(error.message || 'Có lỗi xảy ra');
          }
        },
      });
    },
    [dispatch]
  );

  const handleAddToWishlist = useCallback(
    async (productId: number) => {
      try {
        await dispatch(addToWishlist(productId)).unwrap();
        message.success('Đã thêm vào danh sách yêu thích');
      } catch (error: any) {
        message.error(error.message || 'Không thể thêm vào danh sách yêu thích');
      }
    },
    [dispatch]
  );

  const calculateTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const basePrice = item.product?.price || 0;
      const priceAdjustment = item.variant?.price_adjustment || 0;
      const finalPrice = basePrice + priceAdjustment;
      return total + finalPrice * item.quantity;
    }, 0);
  }, [cartItems]);

  const itemCount = useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  // Desktop table columns with custom rendering
  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: '35%',
      align: 'left' as const,
      render: (_: any, record: CartItem) => (
        <CartItemRow
          item={record}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onAddToWishlist={handleAddToWishlist}
          renderMode="product"
        />
      ),
    },
    {
      title: 'Giá',
      key: 'price',
      width: '15%',
      align: 'right' as const,
      render: (_: any, record: CartItem) => (
        <CartItemRow
          item={record}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onAddToWishlist={handleAddToWishlist}
          renderMode="price"
        />
      ),
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: '20%',
      align: 'center' as const,
      render: (_: any, record: CartItem) => (
        <CartItemRow
          item={record}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onAddToWishlist={handleAddToWishlist}
          renderMode="quantity"
        />
      ),
    },
    {
      title: 'Thành tiền',
      key: 'total',
      width: '15%',
      align: 'right' as const,
      render: (_: any, record: CartItem) => (
        <CartItemRow
          item={record}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onAddToWishlist={handleAddToWishlist}
          renderMode="total"
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '15%',
      align: 'center' as const,
      render: (_: any, record: CartItem) => (
        <CartItemRow
          item={record}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onAddToWishlist={handleAddToWishlist}
          renderMode="action"
        />
      ),
    },
  ];

  // Skeleton loading component
  const renderSkeleton = () => {
    if (isMobile) {
      return (
        <div>
          {[1, 2, 3].map((i) => (
            <Card key={i} style={{ marginBottom: 16 }}>
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </Card>
          ))}
        </div>
      );
    }
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 5 }} />
      </Card>
    );
  };

  // Enhanced empty state
  const renderEmptyState = () => {
    return (
      <Card>
        <Empty
          description={
            <div>
              <Text style={{ fontSize: 16 }}>Giỏ hàng của bạn đang trống</Text>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!
                </Text>
              </div>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Space direction="vertical" size="middle">
            <Button type="primary" size="large" onClick={() => navigate('/products')}>
              Mua sắm ngay
            </Button>
            <Button onClick={() => navigate('/wishlist')}>
              Xem danh sách yêu thích
            </Button>
          </Space>
        </Empty>
      </Card>
    );
  };

  return (
    <div style={{ paddingBottom: isMobile ? 200 : 0 }}>
      <Title level={2}>Giỏ hàng của tôi</Title>

      {/* Error Display */}
      {error && (
        <Alert
          message="Lỗi tải giỏ hàng"
          description={error}
          type="error"
          showIcon
          closable
          action={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchCart())}
            >
              Thử lại
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        renderSkeleton()
      ) : cartItems.length === 0 ? (
        renderEmptyState()
      ) : (
        <Row gutter={[16, 16]}>
          {/* Cart Items */}
          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              {isMobile ? (
                // Mobile: Card Layout
                <div>
                  {cartItems.map((item) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemoveItem={handleRemoveItem}
                      onAddToWishlist={handleAddToWishlist}
                    />
                  ))}
                </div>
              ) : (
                // Desktop: Table Layout
                <Table
                  columns={columns}
                  dataSource={cartItems}
                  rowKey="id"
                  pagination={false}
                  style={{
                    borderRadius: 8
                  }}
                  rowClassName={() => 'cart-table-row'}
                  bordered={false}
                  size="middle"
                />
              )}
            </Card>
          </Col>

          {/* Summary Sidebar */}
          <Col xs={24} lg={8}>
            <CartSummary
              total={calculateTotal}
              itemCount={itemCount}
              isMobile={isMobile}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Cart;

