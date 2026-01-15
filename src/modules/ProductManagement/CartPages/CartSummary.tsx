import React from 'react';
import { Card, Button, Space, Typography, Statistic, Divider, Alert } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../shares/utils';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface CartSummaryProps {
  total: number;
  itemCount: number;
  isMobile?: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({ total, itemCount, isMobile = false }) => {
  const navigate = useNavigate();

  return (
    <Card
      title={isMobile ? undefined : 'Tổng kết'}
      style={{
        position: isMobile ? 'fixed' : 'sticky',
        bottom: isMobile ? 0 : undefined,
        top: isMobile ? undefined : 24,
        left: isMobile ? 0 : undefined,
        right: isMobile ? 0 : undefined,
        width: isMobile ? '100%' : undefined,
        zIndex: isMobile ? 1000 : 100,
        borderRadius: isMobile ? '8px 8px 0 0' : 8,
        boxShadow: isMobile ? '0 -2px 8px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
        margin: isMobile ? 0 : undefined,
        border: '1px solid #f0f0f0',
      }}
      bodyStyle={{
        backgroundColor: isMobile ? '#fff' : undefined,
        padding: isMobile ? '12px 16px' : '20px',
      }}
    >
      {isMobile && (
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 16 }}>
            Tổng kết
          </Text>
        </div>
      )}
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Item Count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
          <Text type="secondary" style={{ fontSize: 14 }}>Số lượng sản phẩm:</Text>
          <Text strong style={{ fontSize: 15 }}>{itemCount}</Text>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Subtotal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Tạm tính:</Text>
          <Text>{formatCurrency(total)}</Text>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Total */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderTop: '2px solid #f0f0f0',
          borderBottom: '2px solid #f0f0f0',
          margin: '8px 0'
        }}>
          <Text strong style={{ fontSize: 16 }}>Tổng tiền:</Text>
          <Text strong style={{ fontSize: 20, color: '#cf1322' }}>
            {formatCurrency(total)}
          </Text>
        </div>

        {/* Action Buttons */}
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Button
            type="primary"
            size="large"
            block
            icon={<ShoppingCartOutlined />}
            onClick={() => navigate('/place-order')}
            style={{
              height: 44,
              fontSize: 15
            }}
          >
            Đặt hàng
          </Button>
          <Button 
            block 
            onClick={() => navigate('/products')}
            style={{ height: 40 }}
          >
            Tiếp tục mua sắm
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default React.memo(CartSummary);
