import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Image,
  Rate,
  Tag,
  Empty,
  message,
  Spin,
} from 'antd';
import {
  ShoppingCartOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Product } from '../../../shares/types';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchProductsByIds } from '../stores/productsSlice';
import { logger } from '../../../shares/utils/logger';

const { Title, Text } = Typography;

const ProductComparePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { compareProducts: products, compareLoading: loading } = useAppSelector((state) => state.products);

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').map(Number).filter(Boolean) || [];
    if (ids.length > 0) {
      dispatch(fetchProductsByIds(ids));
    }
  }, [searchParams, dispatch]);

  const handleRemoveProduct = (productId: number) => {
    const ids = searchParams.get('ids')?.split(',').map(Number).filter(Boolean) || [];
    const newIds = ids.filter((id) => id !== productId);
    
    if (newIds.length === 0) {
      navigate('/products');
    } else {
      navigate(`/products/compare?ids=${newIds.join(',')}`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return <Tag color="red">Hết hàng</Tag>;
    } else if (quantity < 10) {
      return <Tag color="orange">Sắp hết ({quantity})</Tag>;
    } else {
      return <Tag color="green">Còn hàng ({quantity})</Tag>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <Card>
          <Empty
            description="Chưa có sản phẩm nào để so sánh"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/products')}>
              Tìm sản phẩm để so sánh
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  const comparisonData = [
    {
      key: 'image',
      label: 'Hình ảnh',
      render: (product: Product) => (
        <div style={{ textAlign: 'center' }}>
          <Image
            src={product.image_url || 'https://via.placeholder.com/200'}
            alt={product.name}
            width={200}
            height={200}
            style={{ objectFit: 'cover', borderRadius: 8 }}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveProduct(product.id)}
            style={{ marginTop: 8 }}
          >
            Xóa khỏi so sánh
          </Button>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Tên sản phẩm',
      render: (product: Product) => (
        <div>
          <Text strong style={{ fontSize: 16 }}>
            {product.name}
          </Text>
          <br />
          <Button
            type="link"
            onClick={() => navigate(`/products/${product.id}`)}
            style={{ padding: 0 }}
          >
            Xem chi tiết
          </Button>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Giá',
      render: (product: Product) => (
        <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
          {formatPrice(product.price)}
        </Text>
      ),
    },
    {
      key: 'description',
      label: 'Mô tả',
      render: (product: Product) => (
        <Text
          style={{
            display: 'block',
            maxHeight: 100,
            overflow: 'auto',
          }}
        >
          {product.description || 'Không có mô tả'}
        </Text>
      ),
    },
    {
      key: 'category',
      label: 'Danh mục',
      render: (product: Product) => (
        <Tag color="blue">{product.category?.name || 'Không xác định'}</Tag>
      ),
    },
    {
      key: 'stock',
      label: 'Tình trạng',
      render: (product: Product) => getStockStatus(product.stock_quantity),
    },
    {
      key: 'sku',
      label: 'Mã SKU',
      render: (product: Product) => (
        <Text code>{product.sku || 'N/A'}</Text>
      ),
    },
    {
      key: 'action',
      label: 'Thao tác',
      render: (product: Product) => (
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          block
          disabled={product.stock_quantity === 0}
          onClick={() => navigate(`/products/${product.id}`)}
        >
          {product.stock_quantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
        </Button>
      ),
    },
  ];

  const columns = [
    {
      title: 'Thuộc tính',
      dataIndex: 'label',
      key: 'label',
      width: 150,
      fixed: 'left' as const,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    ...products.map((product, index) => ({
      title: (
        <div style={{ textAlign: 'center' }}>
          <Text>Sản phẩm {index + 1}</Text>
        </div>
      ),
      dataIndex: 'render',
      key: product.id,
      width: 300,
      render: (renderFunc: (product: Product) => React.ReactNode) => renderFunc(product),
    })),
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '100%', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>So Sánh Sản Phẩm</Title>
          <Space>
            <Text type="secondary">Đang so sánh {products.length} sản phẩm</Text>
            <Button
              icon={<CloseCircleOutlined />}
              onClick={() => navigate('/products')}
            >
              Hủy so sánh
            </Button>
          </Space>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={comparisonData}
            pagination={false}
            scroll={{ x: 'max-content' }}
            bordered
            size="middle"
          />
        </Card>

        {products.length < 4 && (
          <Card>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Text type="secondary">
                Bạn có thể so sánh tối đa 4 sản phẩm cùng lúc
              </Text>
              <br />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/products')}
                style={{ marginTop: 16 }}
              >
                Thêm sản phẩm để so sánh
              </Button>
            </div>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default ProductComparePage;

