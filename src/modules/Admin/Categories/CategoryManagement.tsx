import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Card,
  Popconfirm,
  Image,
  Switch,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { adminService, CreateCategoryRequest, UpdateCategoryRequest } from '../../../shares/services/adminService';
import { Category } from '../../../shares/types';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchCategories } from '../../ProductManagement/stores/productsSlice';
import { logger } from '../../../shares/utils/logger';

const { Title } = Typography;
const { TextArea } = Input;
const { Search } = Input;

const CategoryManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { categories, categoriesLoading } = useAppSelector((state) => state.products);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);


  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      image_url: category.image_url,
    });
    setPreviewImageUrl(category.image_url || '');
    setIsModalVisible(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setPreviewImageUrl('');
    form.resetFields();
    setIsModalVisible(true);
  };

  interface CategoryFormValues {
    name: string;
    description?: string;
    image_url?: string;
  }

  const handleSubmit = async (values: CategoryFormValues) => {
    try {
      if (editingCategory) {
        const updateData: UpdateCategoryRequest = {
          name: values.name,
          description: values.description,
          image_url: values.image_url || undefined,
        };
        await adminService.updateCategory(editingCategory.id, updateData);
        message.success('Cập nhật danh mục thành công');
      } else {
        const createData: CreateCategoryRequest = {
          name: values.name,
          description: values.description,
          image_url: values.image_url || undefined,
        };
        await adminService.createCategory(createData);
        message.success('Tạo danh mục thành công');
      }
      setIsModalVisible(false);
      setEditingCategory(null);
      setPreviewImageUrl('');
      form.resetFields();
      dispatch(fetchCategories());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      logger.error('Error submitting category', error instanceof Error ? error : new Error(String(error)), {
        categoryId: editingCategory?.id,
        ip: window.location.href,
      });
      message.error(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminService.deleteCategory(id);
      message.success('Xóa danh mục thành công');
      dispatch(fetchCategories());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa danh mục';
      logger.error('Error deleting category', error instanceof Error ? error : new Error(String(error)), {
        categoryId: id,
        ip: window.location.href,
      });
      message.error(errorMessage);
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      // Note: Backend chưa có API toggle status, có thể cần thêm sau
      // Hiện tại chỉ hiển thị thông báo
      message.info('Tính năng này sẽ được thêm sau');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      logger.error('Error toggling category status', error instanceof Error ? error : new Error(String(error)), {
        categoryId: category.id,
        ip: window.location.href,
      });
      message.error(errorMessage);
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
      dataIndex: 'image_url',
      key: 'image_url',
      width: 100,
      render: (url: string) => (
        url ? (
          <Image
            src={url}
            alt="Category"
            width={60}
            height={60}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div style={{ width: 60, height: 60, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppstoreOutlined style={{ fontSize: 24, color: '#999' }} />
          </div>
        )
      ),
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (isActive: boolean, record: Category) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Category) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa danh mục này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
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
            <AppstoreOutlined /> Quản lý danh mục
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchCategories())}>
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Tạo danh mục mới
            </Button>
          </Space>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 16 }}>
          <Search
            placeholder="Tìm kiếm danh mục..."
            allowClear
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            onSearch={(value) => setSearchQuery(value)}
            onChange={(e) => setSearchQuery(e.target.value)}
            enterButton
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredCategories}
          loading={categoriesLoading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} danh mục`,
          }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingCategory(null);
          setPreviewImageUrl('');
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
        destroyOnClose
        okText={editingCategory ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Tên danh mục"
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên danh mục' },
              { min: 2, message: 'Tên danh mục phải có ít nhất 2 ký tự' },
            ]}
          >
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea rows={4} placeholder="Nhập mô tả danh mục" maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            label="URL hình ảnh"
            name="image_url"
            rules={[
              { type: 'url', message: 'Vui lòng nhập URL hợp lệ', warningOnly: true },
            ]}
          >
            <Input 
              placeholder="Nhập URL hình ảnh (ví dụ: https://example.com/image.jpg)"
              onChange={(e) => setPreviewImageUrl(e.target.value)}
            />
          </Form.Item>

          {previewImageUrl && (
            <Form.Item label="Preview hình ảnh">
              <Image
                src={previewImageUrl}
                alt="Preview"
                width={200}
                height={200}
                style={{ objectFit: 'cover', borderRadius: 8 }}
                fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;

