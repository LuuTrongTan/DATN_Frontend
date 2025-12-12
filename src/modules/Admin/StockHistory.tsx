import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Typography,
  Tag,
  Space,
  message,
  Spin,
  Empty,
  InputNumber,
  Select,
  Button,
} from 'antd';
import {
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { inventoryService, StockHistory } from '../../shares/services/inventoryService';

const { Title } = Typography;

const StockHistory: React.FC = () => {
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<{
    product_id?: number;
    variant_id?: number;
    type?: 'in' | 'out' | 'adjustment';
  }>({});

  useEffect(() => {
    fetchHistory();
  }, [pagination.page, filters]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getStockHistory({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.success && response.data) {
        setHistory(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data?.pagination?.total || 0,
        }));
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải lịch sử');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
      case 'out':
        return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />;
      case 'adjustment':
        return <EditOutlined style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Nhập kho';
      case 'out':
        return 'Xuất kho';
      case 'adjustment':
        return 'Điều chỉnh';
      default:
        return type;
    }
  };

  const columns = [
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Space>
          {getTypeIcon(type)}
          <Tag color={type === 'in' ? 'green' : type === 'out' ? 'red' : 'blue'}>
            {getTypeLabel(type)}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_: any, record: StockHistory) => (
        <div>
          {record.product_id ? `Sản phẩm #${record.product_id}` : '-'}
          {record.variant_id && (
            <div style={{ fontSize: 12, color: '#999' }}>
              Biến thể #{record.variant_id}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (quantity: number, record: StockHistory) => (
        <Tag color={record.type === 'in' ? 'green' : record.type === 'out' ? 'red' : 'blue'}>
          {record.type === 'in' ? '+' : record.type === 'out' ? '-' : '±'}{quantity}
        </Tag>
      ),
    },
    {
      title: 'Tồn kho trước',
      dataIndex: 'previous_stock',
      key: 'previous_stock',
      align: 'right' as const,
    },
    {
      title: 'Tồn kho sau',
      dataIndex: 'new_stock',
      key: 'new_stock',
      align: 'right' as const,
      render: (stock: number) => <strong>{stock}</strong>,
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string | null) => reason || '-',
    },
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Lịch sử nhập/xuất kho</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchHistory}>
          Làm mới
        </Button>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <InputNumber
            placeholder="Mã sản phẩm"
            value={filters.product_id}
            onChange={(value) => setFilters(prev => ({ ...prev, product_id: value || undefined }))}
            style={{ width: 150 }}
          />
          <InputNumber
            placeholder="Mã biến thể"
            value={filters.variant_id}
            onChange={(value) => setFilters(prev => ({ ...prev, variant_id: value || undefined }))}
            style={{ width: 150 }}
          />
          <Select
            placeholder="Loại"
            value={filters.type}
            onChange={(value) => setFilters(prev => ({ ...prev, type: value || undefined }))}
            style={{ width: 150 }}
            allowClear
          >
            <Select.Option value="in">Nhập kho</Select.Option>
            <Select.Option value="out">Xuất kho</Select.Option>
            <Select.Option value="adjustment">Điều chỉnh</Select.Option>
          </Select>
          <Button onClick={fetchHistory}>Lọc</Button>
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : history.length === 0 ? (
          <Empty description="Không có lịch sử nào" />
        ) : (
          <Table
            columns={columns}
            dataSource={history}
            rowKey="id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              onChange: (page) => setPagination(prev => ({ ...prev, page })),
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default StockHistory;

