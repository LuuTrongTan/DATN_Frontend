import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Select,
  Input,
  message,
  Popconfirm,
  Rate,
  Image,
  Empty,
  Spin,
} from 'antd';
import {
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  StarOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Review } from '../../../shares/types';
import { reviewService } from '../../../shares/services/reviewService';
import { useEffectOnce } from '../../../shares/hooks';
import AdminPageContent from '../../../shares/components/layouts/AdminPageContent';

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const AdminReviewsManagement: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{
    is_approved?: boolean;
    product_id?: number;
    search?: string;
  }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const loadReviews = async (page: number = 1, limit: number = 20) => {
    try {
      setLoading(true);
      const response = await reviewService.getAllReviews({
        page,
        limit,
        is_approved: filters.is_approved,
        product_id: filters.product_id,
      });

      if (response.success) {
        // Backend trả về: { success: true, data: [...], pagination: {...} }
        // Nhưng apiClient.get trả về res.data, nên response đã là { success, data, pagination }
        const responseData = response as any;
        if (responseData.pagination) {
          setReviews(Array.isArray(responseData.data) ? responseData.data : []);
          setPagination(responseData.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        } else if (response.data && 'data' in response.data && 'pagination' in response.data) {
          // Nếu nested trong data
          const paginatedData = response.data as any;
          setReviews(paginatedData.data || []);
          setPagination(paginatedData.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        } else if (Array.isArray(response.data)) {
          setReviews(response.data);
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffectOnce(() => {
    loadReviews();
  });

  useEffect(() => {
    loadReviews(pagination.page, pagination.limit);
  }, [filters]);

  const handleApprove = async (id: number) => {
    try {
      await reviewService.approveReview(id);
      message.success('Phê duyệt đánh giá thành công');
      loadReviews(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(error.message || 'Không thể phê duyệt đánh giá');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await reviewService.rejectReview(id);
      message.success('Từ chối đánh giá thành công');
      loadReviews(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(error.message || 'Không thể từ chối đánh giá');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await reviewService.deleteReview(id);
      message.success('Xóa đánh giá thành công');
      loadReviews(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(error.message || 'Không thể xóa đánh giá');
    }
  };

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_: any, record: Review) => (
        <Text strong>{record.product?.name || `Sản phẩm #${record.product_id}`}</Text>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'user',
      render: (_: any, record: Review) => (
        <div>
          <Text>{record.user?.full_name || record.user?.email || 'Khách hàng'}</Text>
          {record.user?.email && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{record.user.email}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Đánh giá',
      key: 'rating',
      render: (_: any, record: Review) => (
        <Space>
          <Rate disabled value={record.rating} />
          <Text>({record.rating}/5)</Text>
        </Space>
      ),
    },
    {
      title: 'Nhận xét',
      key: 'comment',
      ellipsis: true,
      render: (_: any, record: Review) => (
        <div>
          {record.comment ? (
            <Text>{record.comment}</Text>
          ) : (
            <Text type="secondary">Không có nhận xét</Text>
          )}
          {record.image_urls && record.image_urls.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Image.PreviewGroup>
                {record.image_urls.slice(0, 3).map((url, idx) => (
                  <Image
                    key={idx}
                    src={url}
                    width={50}
                    height={50}
                    style={{ objectFit: 'cover', marginRight: 4, borderRadius: 4 }}
                  />
                ))}
              </Image.PreviewGroup>
              {record.image_urls.length > 3 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  +{record.image_urls.length - 3} ảnh
                </Text>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: Review) => (
        <Tag color={record.is_approved ? 'green' : 'orange'}>
          {record.is_approved ? 'Đã duyệt' : 'Chờ duyệt'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      key: 'created_at',
      render: (_: any, record: Review) => (
        <Text>{new Date(record.created_at).toLocaleDateString('vi-VN')}</Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      render: (_: any, record: Review) => (
        <Space>
          {!record.is_approved && (
            <Popconfirm
              title="Phê duyệt đánh giá này?"
              onConfirm={() => handleApprove(record.id)}
              okText="Phê duyệt"
              cancelText="Hủy"
            >
              <Button type="primary" size="small" icon={<CheckOutlined />}>
                Duyệt
              </Button>
            </Popconfirm>
          )}
          {record.is_approved && (
            <Popconfirm
              title="Từ chối đánh giá này?"
              onConfirm={() => handleReject(record.id)}
              okText="Từ chối"
              cancelText="Hủy"
            >
              <Button size="small" icon={<CloseOutlined />}>
                Từ chối
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Xóa đánh giá này?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageContent
      title={
        <>
          <StarOutlined /> Quản lý đánh giá
        </>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => loadReviews(pagination.page, pagination.limit)}
        >
          Làm mới
        </Button>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 16 }}>
        <Space style={{ width: '100%', flexWrap: 'wrap' }}>
          <Select
            style={{ width: 200 }}
            placeholder="Lọc theo trạng thái"
            allowClear
            value={filters.is_approved === undefined ? undefined : filters.is_approved}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                is_approved: value === undefined ? undefined : value === true,
              }))
            }
          >
            <Option value={true}>Đã duyệt</Option>
            <Option value={false}>Chờ duyệt</Option>
          </Select>
          <Search
            placeholder="Tìm kiếm theo tên sản phẩm..."
            allowClear
            style={{ width: 300 }}
            onSearch={(value) =>
              setFilters((prev) => ({
                ...prev,
                search: value || undefined,
              }))
            }
            enterButton
          />
        </Space>
      </Space>

      {loading && reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : reviews.length === 0 ? (
        <Empty description="Chưa có đánh giá nào" />
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={reviews}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.page,
              total: pagination.total,
              pageSize: pagination.limit,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} đánh giá`,
              onChange: (page, pageSize) => {
                setPagination((prev) => ({ ...prev, page, limit: pageSize }));
                loadReviews(page, pageSize);
              },
            }}
          />
        </>
      )}
    </AdminPageContent>
  );
};

export default AdminReviewsManagement;
