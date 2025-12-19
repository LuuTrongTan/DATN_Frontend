import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Tag, Space, Button, Spin, Empty } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { notificationService, Notification } from '../../shares/services/notificationService';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
      await notificationService.markAllAsRead();
      setItems(prev => prev.map(n => ({ ...n, is_read: true })));
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
                      <Text strong>{item.title}</Text>
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
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;


