import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Tag, Space, Button, Spin, Empty, Pagination } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { notificationService, Notification } from '../../shares/services/notificationService';
import { useNavigate } from 'react-router-dom';
import { useEffectOnce } from '../../shares/hooks';

const { Title, Text } = Typography;

const typeColorMap: Record<string, string> = {
  order_placed: 'blue',
  order_shipped: 'purple',
  order_delivered: 'green',
  order_cancelled: 'red',
  payment_success: 'green',
  payment_failed: 'red',
  review_request: 'gold',
  promotion: 'magenta',
  system: 'default',
  support_ticket: 'cyan',
};

const NotificationsPage: React.FC = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const navigate = useNavigate();

  const load = async (page: number = 1, limit: number = 20) => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({ page, limit });
      setItems(response.data || []);
      setPagination(response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sử dụng useEffectOnce để tránh gọi API 2 lần trong StrictMode
  useEffectOnce(() => {
    load();
  }, []);

  const handlePageChange = (page: number, pageSize?: number) => {
    load(page, pageSize || pagination.limit);
  };

  const handleMarkAsRead = async (id: number, link?: string | null) => {
    try {
      await notificationService.markAsRead(id);
      setItems(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n)),
      );
      if (link) {
        navigate(link);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAll = async () => {
    try {
      setMarkingAll(true);
      const response = await notificationService.markAllAsRead();
      setItems(prev => prev.map(n => ({ ...n, is_read: true })));
      // Reload để cập nhật pagination nếu cần
      await load(pagination.page, pagination.limit);
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            <BellOutlined style={{ marginRight: 8 }} />
            Thông báo
          </Title>
          {items.some(n => !n.is_read) && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={markingAll}
              onClick={handleMarkAll}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <Empty description="Chưa có thông báo nào" />
        ) : (
          <>
            <List
              itemLayout="vertical"
              dataSource={items}
              renderItem={(item) => (
                <List.Item
                  style={{
                    background: item.is_read ? '#fafafa' : '#fffbe6',
                    borderRadius: 8,
                    marginBottom: 8,
                    cursor: item.link ? 'pointer' : 'default',
                  }}
                  onClick={() => handleMarkAsRead(item.id, item.link)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={typeColorMap[item.type] || 'default'}>{item.type}</Tag>
                        <Text strong={!item.is_read}>{item.title}</Text>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <Text>{item.message}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(item.created_at).toLocaleString('vi-VN')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            {pagination.totalPages > 1 && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Pagination
                  current={pagination.page}
                  total={pagination.total}
                  pageSize={pagination.limit}
                  onChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} của ${total} thông báo`
                  }
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;



