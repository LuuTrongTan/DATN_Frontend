import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  Table,
  Typography,
  Tag,
  Button,
  Space,
  message,
  Spin,
  Empty,
  Badge,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { inventoryService, StockAlert } from '../../../shares/services/inventoryService';
import { useEffectOnce } from '../../../shares/hooks';

const { Title } = Typography;

// Dùng biến global để track request đang pending (tránh StrictMode gọi 2 lần)
let globalFetchingStockAlerts = false;

const StockAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  // Sử dụng useEffectOnce để tránh gọi API 2 lần trong StrictMode (lần fetch đầu tiên)
  useEffectOnce(() => {
    fetchAlerts();
  });

  // Gọi lại khi pagination.page thay đổi
  useEffect(() => {
    if (pagination.page !== 1) {
      fetchAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const fetchAlerts = async () => {
    // Tránh gọi trùng lặp (ngay cả trong StrictMode) - dùng biến global
    if (globalFetchingStockAlerts) {
      return;
    }

    globalFetchingStockAlerts = true;

    try {
      setLoading(true);
      const response = await inventoryService.getStockAlerts({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.success && response.data) {
        setAlerts(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data?.pagination?.total || 0,
        }));
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải cảnh báo');
    } finally {
      setLoading(false);
      // Reset flag sau một khoảng thời gian ngắn để cho phép gọi lại
      setTimeout(() => {
        globalFetchingStockAlerts = false;
      }, 100);
    }
  };

  const handleMarkAsNotified = async (id: number) => {
    try {
      const response = await inventoryService.markAlertAsNotified(id);
      if (response.success) {
        message.success('Đã đánh dấu cảnh báo');
        fetchAlerts();
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_: any, record: StockAlert) => (
        <div>
          {record.product_name || `Sản phẩm #${record.product_id}`}
          {record.variant_type && record.variant_value && (
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.variant_type}: {record.variant_value}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Tồn kho hiện tại',
      dataIndex: 'current_stock',
      key: 'current_stock',
      align: 'right' as const,
      render: (stock: number) => (
        <Tag color={stock === 0 ? 'red' : 'orange'}>{stock}</Tag>
      ),
    },
    {
      title: 'Ngưỡng cảnh báo',
      dataIndex: 'threshold',
      key: 'threshold',
      align: 'right' as const,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_notified',
      key: 'is_notified',
      align: 'center' as const,
      render: (isNotified: boolean) => (
        <Tag color={isNotified ? 'green' : 'red'} icon={isNotified ? <CheckCircleOutlined /> : <WarningOutlined />}>
          {isNotified ? 'Đã thông báo' : 'Chưa thông báo'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: StockAlert) => (
        <Button
          type="link"
          onClick={() => handleMarkAsNotified(record.id)}
          disabled={record.is_notified}
        >
          Đánh dấu đã thông báo
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Cảnh báo hết hàng
          <Badge count={alerts.filter(a => !a.is_notified).length} style={{ marginLeft: 16 }}>
            <WarningOutlined style={{ fontSize: 24, color: '#faad14' }} />
          </Badge>
        </Title>
        <Button icon={<ReloadOutlined />} onClick={fetchAlerts}>
          Làm mới
        </Button>
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : alerts.length === 0 ? (
          <Empty description="Không có cảnh báo nào" />
        ) : (
          <Table
            columns={columns}
            dataSource={alerts}
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

export default StockAlerts;


