import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Card,
  Input,
  Select,
  message,
  Popconfirm,
  Switch,
  Modal,
} from 'antd';
import {
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { productService } from '../../../shares/services/productService';
import { Product, Category } from '../../../shares/types';
import { useNavigate } from 'react-router-dom';
import ProductForm from './ProductForm';
import { logger } from '../../../shares/utils/logger';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchAdminProducts, fetchAdminCategories, setSearch, setCategory } from '../stores/adminProductsSlice';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const AdminProductManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: products, categories, loading, filters } = useAppSelector((state) => state.adminProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminProducts({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(setSearch(searchQuery));
    dispatch(setCategory(selectedCategory));
    dispatch(fetchAdminProducts({ 
      search: searchQuery || undefined, 
      category_id: selectedCategory,
      limit: 100 
    }));
  }, [dispatch, searchQuery, selectedCategory]);

  const handleDelete = async (id: number) => {
    try {
      await productService.deleteProduct(id);
      message.success('Xóa sản phẩm thành công');
      dispatch(fetchAdminProducts({ 
        search: filters.search || undefined, 
        category_id: filters.category_id,
        limit: 100 
      }));
    } catch (error: any) {
      logger.error('Error deleting product', error instanceof Error ? error : new Error(String(error)));
      message.error(error.message || 'Có lỗi xảy ra khi xóa sản phẩm');
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await productService.updateProduct(product.id, {
        is_active: !product.is_active,
      });
      message.success(`Đã ${product.is_active ? 'vô hiệu hóa' : 'kích hoạt'} sản phẩm`);
      dispatch(fetchAdminProducts({ 
        search: filters.search || undefined, 
        category_id: filters.category_id,
        limit: 100 
      }));
    } catch (error: any) {
      logger.error('Error updating product status', error instanceof Error ? error : new Error(String(error)));
      message.error(error.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image_urls',
      key: 'image_urls',
      width: 100,
      render: (urls: string[] | null) => (
        urls && urls.length > 0 ? (
          <img
            src={urls[0]}
            alt="Product"
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div style={{ width: 60, height: 60, background: '#f0f0f0', borderRadius: 4 }} />
        )
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Danh mục',
      dataIndex: 'category_name',
      key: 'category_name',
      render: (categoryName: string | null, record: Product) =>
        categoryName || record.category?.name || '-',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number | string) => {
        const numeric = Number(price);
        if (Number.isNaN(numeric)) return '-';
        return `${numeric.toLocaleString('vi-VN')} VNĐ`;
      },
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      render: (quantity: number) => (
        <Tag color={quantity > 0 ? 'green' : 'red'}>
          {quantity}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (isActive: boolean, record: Product) => (
        <Switch
          checked={isActive}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
          onChange={() => handleToggleStatus(record)}
        />
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (text: string) => new Date(text).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Product) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/products/${record.id}`)}
            size="small"
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/products/${record.id}/edit`)}
            size="small"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa sản phẩm này?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>
            <ShoppingOutlined /> Quản lý sản phẩm
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Tạo sản phẩm mới
          </Button>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 16 }}>
          <Space>
            <Search
              placeholder="Tìm kiếm sản phẩm..."
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => setSearchQuery(value)}
              enterButton
            />
            <Select
              style={{ width: 200 }}
              placeholder="Lọc theo danh mục"
              allowClear
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value)}
            >
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => {
              dispatch(fetchAdminProducts({ 
                search: filters.search || undefined, 
                category_id: filters.category_id,
                limit: 100 
              }));
            }}>
              Làm mới
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={products}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
          }}
        />
      </Card>

      <Modal
        title="Tạo sản phẩm mới"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
        styles={{
          body: {
            maxHeight: '70vh',
            overflowY: 'auto',
          },
        }}
      >
        <ProductForm
          onSuccess={() => {
            setIsModalVisible(false);
            dispatch(fetchAdminProducts({ 
              search: filters.search || undefined, 
              category_id: filters.category_id,
              limit: 100 
            }));
          }}
          onCancel={() => setIsModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default AdminProductManagement;

