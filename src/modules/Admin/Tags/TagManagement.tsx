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
  Popconfirm,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { tagService, ProductTag } from '../../../shares/services/tagService';
import { useEffectOnce } from '../../../shares/hooks';
import { logger } from '../../../shares/utils/logger';
import AdminPageContent from '../../../shares/components/layouts/AdminPageContent';

const { Search } = Input;

const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [filteredTags, setFilteredTags] = useState<ProductTag[]>([]);
  const [editingTag, setEditingTag] = useState<ProductTag | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Fetch tags
  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await tagService.getAllTags();
      if (response.success && response.data) {
        setTags(response.data || []);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh sách tags';
      logger.error('Error fetching tags', error instanceof Error ? error : new Error(String(error)), {
        ip: window.location.href,
      });
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffectOnce(() => {
    fetchTags();
  });

  // Filter tags based on search query
  useEffect(() => {
    let data = tags;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (tag) =>
          tag.name.toLowerCase().includes(q) ||
          tag.slug.toLowerCase().includes(q)
      );
    }

    setFilteredTags(data);
  }, [searchQuery, tags]);

  const handleCreate = () => {
    setEditingTag(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (tag: ProductTag) => {
    setEditingTag(tag);
    form.setFieldsValue({
      name: tag.name,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await tagService.deleteTag(id);
      if (response.success) {
        message.success('Xóa tag thành công');
        fetchTags();
      } else {
        message.error(response.message || 'Không thể xóa tag');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa tag';
      logger.error('Error deleting tag', error instanceof Error ? error : new Error(String(error)), {
        tagId: id,
        ip: window.location.href,
      });
      message.error(errorMessage);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      
      // Validate name
      if (!values.name || !values.name.trim()) {
        message.error('Vui lòng nhập tên tag');
        setSubmitting(false);
        return;
      }

      if (editingTag) {
        // Update tag - chỉ gửi name, backend sẽ tự động tạo slug nếu cần
        const response = await tagService.updateTag(editingTag.id, {
          name: values.name.trim(),
        });
        if (response.success) {
          message.success('Cập nhật tag thành công');
          setIsModalVisible(false);
          form.resetFields();
          setEditingTag(null);
          fetchTags();
        } else {
          message.error(response.message || 'Không thể cập nhật tag');
        }
      } else {
        // Create tag - chỉ gửi name, backend sẽ tự động tạo slug
        const response = await tagService.createTag({
          name: values.name.trim(),
        });
        if (response.success) {
          message.success('Tạo tag thành công');
          setIsModalVisible(false);
          form.resetFields();
          setEditingTag(null);
          fetchTags();
        } else {
          message.error(response.message || 'Không thể tạo tag');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      logger.error(
        'Error saving tag',
        error instanceof Error ? error : new Error(String(error)),
        {
          tagId: editingTag?.id,
          ip: window.location.href,
        }
      );
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center' as const,
      width: 80,
    },
    {
      title: 'Tên tag',
      dataIndex: 'name',
      key: 'name',
      align: 'left' as const,
      render: (text: string, record: ProductTag) => (
        <Space>
          <TagOutlined style={{ color: '#1890ff' }} />
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      align: 'left' as const,
      render: (text: string) => (
        <Typography.Text code>{text}</Typography.Text>
      ),
    },
    {
      title: 'Số sản phẩm',
      dataIndex: 'product_count',
      key: 'product_count',
      align: 'center' as const,
      width: 120,
      render: (count: number | undefined) => (
        <Tag color="blue">{count || 0}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      align: 'center' as const,
      width: 180,
      render: (date: string | undefined) =>
        date ? new Date(date).toLocaleString('vi-VN') : '-',
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center' as const,
      width: 150,
      render: (_: any, record: ProductTag) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa tag này?"
            description="Tag sẽ bị xóa khỏi hệ thống và không thể khôi phục."
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageContent
      title="Quản lý Tags"
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchTags}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Tạo tag mới
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Search
          placeholder="Tìm kiếm theo tên hoặc slug..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: 400 }}
        />

        <Table
          columns={columns}
          dataSource={filteredTags}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng cộng ${total} tags`,
          }}
          locale={{ emptyText: 'Không có tag nào' }}
        />
      </Space>

      <Modal
        title={editingTag ? 'Sửa tag' : 'Tạo tag mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingTag(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Tên tag"
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên tag' },
              { max: 100, message: 'Tên tag không được quá 100 ký tự' },
            ]}
            tooltip="Slug sẽ được tự động tạo từ tên tag"
          >
            <Input placeholder="Nhập tên tag" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingTag ? 'Cập nhật' : 'Tạo mới'}
              </Button>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                  setEditingTag(null);
                }}
                disabled={submitting}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageContent>
  );
};

export default TagManagement;
