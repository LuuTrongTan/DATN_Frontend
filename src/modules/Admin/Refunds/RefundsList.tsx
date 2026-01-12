import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Select,
  Input,
  Typography,
  message,
  Spin,
} from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { Refund, RefundStatus, RefundType } from '../../../shares/types';
import { refundService } from '../../../shares/services/refundService';

const { Option } = Select;
const { Text } = Typography;

const RefundsList: React.FC = () => {
  const navigate = useNavigate();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{
    status?: string;
    type?: string;
    page: number;
    limit: number;
  }>({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchRefunds();
  }, [filters]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await refundService.getRefunds({
        status: filters.status,
        type: filters.type,
        page: filters.page,
        limit: filters.limit,
      });

      if (response.success && response.data) {
        setRefunds(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi tải danh sách refunds');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: RefundStatus) => {
    const colors: Record<RefundStatus, string> = {
      pending: 'orange',
      approved: 'blue',
      rejected: 'red',
      processing: 'cyan',
      completed: 'green',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: RefundStatus) => {
    const texts: Record<RefundStatus, string> = {
      pending: 'Chờ xử lý',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return texts[status] || status;
  };

  const getTypeText = (type: RefundType) => {
    const texts: Record<RefundType, string> = {
      refund: 'Hoàn tiền',
      return: 'Trả hàng',
      exchange: 'Đổi hàng',
    };
    return texts[type] || type;
  };

  const columns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'refund_number',
      key: 'refund_number',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text: string) => text || '-',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: RefundType) => getTypeText(type),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: RefundStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Số tiền hoàn',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      align: 'right' as const,
      render: (amount: number | null) =>
        amount ? `${amount.toLocaleString('vi-VN')} VNĐ` : '-',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: Refund) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/admin/refunds/${record.id}`)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <Card title="Quản lý yêu cầu hoàn tiền/đổi trả">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space>
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            style={{ width: 200 }}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
          >
            <Option value="pending">Chờ xử lý</Option>
            <Option value="approved">Đã duyệt</Option>
            <Option value="rejected">Từ chối</Option>
            <Option value="processing">Đang xử lý</Option>
            <Option value="completed">Hoàn thành</Option>
            <Option value="cancelled">Đã hủy</Option>
          </Select>

          <Select
            placeholder="Lọc theo loại"
            allowClear
            style={{ width: 200 }}
            value={filters.type}
            onChange={(value) => setFilters({ ...filters, type: value, page: 1 })}
          >
            <Option value="refund">Hoàn tiền</Option>
            <Option value="return">Trả hàng</Option>
            <Option value="exchange">Đổi hàng</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={refunds}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} yêu cầu`,
            onChange: (page, pageSize) => {
              setFilters({ ...filters, page, limit: pageSize });
            },
          }}
        />
      </Space>
    </Card>
  );
};

export default RefundsList;
