import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Card,
  Popconfirm,
  Image,
  Switch,
  Tag,
  Select,
   Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  SearchOutlined,
  UploadOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { adminService, CreateCategoryRequest, UpdateCategoryRequest } from '../../../shares/services/adminService';
import { uploadFile } from '../../../shares/services/uploadService';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;
import { Category } from '../../../shares/types';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchAdminCategories } from '../stores/adminCategoriesSlice';
import { useEffectOnce } from '../../../shares/hooks';
import { logger } from '../../../shares/utils/logger';
import AdminPageContent from '../../../shares/components/layouts/AdminPageContent';

const { TextArea } = Input;
const { Search } = Input;

const CategoryManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: categories, loading: categoriesLoading } = useAppSelector(
    (state) => state.adminCategories
  );
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'deleted'>('all');
  const [form] = Form.useForm();

  // Sử dụng useEffectOnce để tránh gọi API 2 lần trong StrictMode
  useEffectOnce(() => {
    dispatch(fetchAdminCategories({ includeDeleted: true }));
  }, [dispatch]);

  useEffect(() => {
    let data = categories;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (cat) =>
          cat.name.toLowerCase().includes(q) ||
          (cat.description && cat.description.toLowerCase().includes(q))
      );
    }

    if (statusFilter === 'active') {
      data = data.filter((cat) => !cat.deleted_at && cat.is_active);
    } else if (statusFilter === 'inactive') {
      data = data.filter((cat) => !cat.deleted_at && !cat.is_active);
    } else if (statusFilter === 'deleted') {
      data = data.filter((cat) => !!cat.deleted_at);
    }

    setFilteredCategories(data);
  }, [searchQuery, statusFilter, categories]);


  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    const fallbackSlug =
      category.slug ||
      category.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    form.setFieldsValue({
      name: category.name,
      slug: fallbackSlug,
      description: category.description,
      image_url: category.image_url,
      parent_id: category.parent_id ?? null,
      is_active: category.is_active,
      display_order: category.display_order ?? undefined,
    });
    setPreviewImageUrl(category.image_url || '');
    setIsModalVisible(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setPreviewImageUrl('');
    setImageFile(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  interface CategoryFormValues {
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    parent_id?: number | null;
    display_order?: number;
    is_active?: boolean;
  }

  const handleSubmit = async (values: CategoryFormValues) => {
    try {
      setImageUploading(true);
      
      // Upload image file nếu có
      let finalImageUrl = values.image_url;
      if (imageFile) {
        try {
          finalImageUrl = await uploadFile(imageFile);
          message.success('Upload hình ảnh thành công');
        } catch (uploadError: any) {
          message.error(uploadError.message || 'Có lỗi xảy ra khi upload hình ảnh');
          setImageUploading(false);
          return;
        }
      }

      if (editingCategory) {
        const updateData: UpdateCategoryRequest = {
          name: values.name,
          slug: values.slug || undefined,
          description: values.description,
          image_url: finalImageUrl || undefined,
          parent_id: values.parent_id ?? null,
          display_order: values.display_order,
          is_active: values.is_active,
        };
        await adminService.updateCategory(editingCategory.id, updateData);
        message.success('Cập nhật danh mục thành công');
      } else {
        const createData: CreateCategoryRequest = {
          name: values.name,
          slug: values.slug,
          description: values.description,
          image_url: finalImageUrl || undefined,
          parent_id: values.parent_id ?? null,
          display_order: values.display_order,
          is_active: values.is_active,
        };
        await adminService.createCategory(createData);
        message.success('Tạo danh mục thành công');
      }
      setIsModalVisible(false);
      setEditingCategory(null);
      setPreviewImageUrl('');
      setImageFile(null);
      form.resetFields();
      dispatch(fetchAdminCategories({ includeDeleted: true }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      logger.error('Error submitting category', error instanceof Error ? error : new Error(String(error)), {
        categoryId: editingCategory?.id,
        ip: window.location.href,
      });
      message.error(errorMessage);
    } finally {
      setImageUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminService.deleteCategory(id);
      message.success('Xóa danh mục thành công');
      dispatch(fetchAdminCategories({ includeDeleted: true }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa danh mục';
      logger.error('Error deleting category', error instanceof Error ? error : new Error(String(error)), {
        categoryId: id,
        ip: window.location.href,
      });
      message.error(errorMessage);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await adminService.restoreCategory(id);
      message.success('Khôi phục danh mục thành công');
      dispatch(fetchAdminCategories({ includeDeleted: true }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi khôi phục danh mục';
      logger.error('Error restoring category', error instanceof Error ? error : new Error(String(error)), {
        categoryId: id,
        ip: window.location.href,
      });
      message.error(errorMessage);
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await adminService.updateCategory(category.id, { is_active: !category.is_active });
      message.success('Cập nhật trạng thái danh mục thành công');
      dispatch(fetchAdminCategories({ includeDeleted: true }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      logger.error('Error toggling category status', error instanceof Error ? error : new Error(String(error)), {
        categoryId: category.id,
        ip: window.location.href,
      });
      message.error(errorMessage);
    }
  };

  const handleImageUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      const fileObj = file as File;
      
      // Kiểm tra file type
      if (!fileObj.type.startsWith('image/')) {
        message.error('Chỉ chấp nhận file hình ảnh');
        onError?.(new Error('Invalid file type'));
        return;
      }

      // Lưu file vào state để upload khi submit form
      setImageFile(fileObj);
      
      // Tạo preview URL từ file
      const previewUrl = URL.createObjectURL(fileObj);
      setPreviewImageUrl(previewUrl);
      
      onSuccess?.(file);
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi chọn hình ảnh';
      logger.error(
        'Error selecting category image',
        error instanceof Error ? error : new Error(String(error)),
        {
          fileName: (file as File)?.name,
          ip: window.location.href,
        }
      );
      message.error(errorMessage);
      onError?.(error);
    }
  };

  const handleImageRemove = () => {
    if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setImageFile(null);
    setPreviewImageUrl('');
    form.setFieldsValue({ image_url: undefined });
  };

  const columns = [
    {
      title: 'Thứ tự',
      dataIndex: 'display_order',
      key: 'display_order',
      align: 'center' as const,
      width: 100,
      render: (value: number | null | undefined) =>
        typeof value === 'number' ? value : '-',
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image_url',
      key: 'image_url',
      align: 'center' as const,
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
      align: 'center' as const,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      align: 'center' as const,
      render: (text: string) => text || '-',
    },
    {
      title: 'Danh mục cha',
      dataIndex: 'parent_id',
      key: 'parent_id',
      align: 'center' as const,
      render: (parentId: number | null) => {
        if (!parentId) return '-';
        const parent = categories.find((c) => c.id === parentId);
        return parent?.name || `ID ${parentId}`;
      },
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
      align: 'center' as const,
      width: 120,
      render: (_: boolean, record: Category) => {
        if (record.deleted_at) {
          return <Tag color="default">Đã xóa</Tag>;
        }
        return (
          <Tag color={record.is_active ? 'green' : 'red'}>
            {record.is_active ? 'Hoạt động' : 'Không hoạt động'}
          </Tag>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      align: 'center' as const,
      render: (text: string) => new Date(text).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: Category) => {
        if (record.deleted_at) {
          return (
            <Space>
              <Button
                type="link"
                icon={<ReloadOutlined />}
                onClick={() => handleRestore(record.id)}
              >
                Khôi phục
              </Button>
            </Space>
          );
        }

        return (
          <Space>
            <Switch
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
              checked={record.is_active}
              onChange={() => handleToggleStatus(record)}
            />
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
        );
      },
    },
  ];

  return (
    <AdminPageContent
      title={(
        <>
          <AppstoreOutlined /> Quản lý danh mục
        </>
      )}
      extra={(
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => dispatch(fetchAdminCategories({ includeDeleted: true }))}
          >
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
      )}
    >
        <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 16 }}>
          <Space style={{ width: '100%', flexWrap: 'wrap' }}>
            <Search
              placeholder="Tìm kiếm danh mục..."
              allowClear
              style={{ width: '100%', maxWidth: 320 }}
              prefix={<SearchOutlined />}
              onSearch={(value) => setSearchQuery(value)}
              onChange={(e) => setSearchQuery(e.target.value)}
              enterButton
            />
            <Select
              style={{ width: '100%', maxWidth: 220 }}
              placeholder="Lọc theo trạng thái"
              allowClear
              value={statusFilter === 'all' ? undefined : statusFilter}
              onChange={(value) =>
                setStatusFilter((value as 'active' | 'inactive' | 'deleted') || 'all')
              }
            >
              <Select.Option value="active">Hoạt động</Select.Option>
              <Select.Option value="inactive">Không hoạt động</Select.Option>
              <Select.Option value="deleted">Đã xóa</Select.Option>
            </Select>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredCategories}
          loading={categoriesLoading}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} danh mục`,
          }}
        />

      <Modal
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingCategory(null);
          if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewImageUrl);
          }
          setPreviewImageUrl('');
          setImageFile(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width="60%"
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
            label="Slug"
            name="slug"
            rules={[
              { required: true, message: 'Vui lòng nhập slug' },
              { pattern: /^[a-z0-9-]+$/, message: 'Slug chỉ chứa a-z, 0-9 và dấu gạch ngang' },
            ]}
          >
            <Input placeholder="ví dụ: dien-thoai" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea rows={4} placeholder="Nhập mô tả danh mục" maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            label="Danh mục cha"
            name="parent_id"
          >
            <Select
              placeholder="Chọn danh mục cha (tuỳ chọn)"
              allowClear
              options={categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Thứ tự hiển thị"
            name="display_order"
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="is_active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
          </Form.Item>

          <Form.Item
            label="Hình ảnh danh mục"
            name="image_url"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Dragger
                customRequest={handleImageUpload}
                accept="image/*"
                showUploadList={false}
                multiple={false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click hoặc kéo thả hình ảnh vào đây để chọn</p>
                <p className="ant-upload-hint">
                  Chỉ chấp nhận file hình ảnh. File sẽ được upload khi bạn submit form.
                </p>
              </Dragger>

              {previewImageUrl && (
                <Card
                  hoverable
                  cover={
                    <Image
                      src={previewImageUrl}
                      alt="Preview"
                      style={{ height: 200, objectFit: 'cover' }}
                      preview
                    />
                  }
                  actions={[
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleImageRemove}
                      key="remove"
                    >
                      Xóa ảnh
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={imageFile ? imageFile.name : 'Hình ảnh hiện có'}
                    description={imageFile ? 'Chưa upload - sẽ upload khi submit' : 'Đã lưu trên server'}
                  />
                </Card>
              )}
            </Space>
          </Form.Item>

        </Form>
      </Modal>
    </AdminPageContent>
  );
};

export default CategoryManagement;

