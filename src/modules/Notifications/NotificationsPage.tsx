import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Tag, Space, Button, Spin, Empty, Pagination, message, Badge, Divider } from 'antd';
import { 
  BellOutlined, 
  CheckOutlined, 
  ReloadOutlined,
  ShoppingOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { notificationService, Notification } from '../../shares/services/notificationService';
import { useNavigate } from 'react-router-dom';
import { useEffectOnce } from '../../shares/hooks';

const { Title, Text } = Typography;

const typeConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  order_placed: {
    color: '#1890ff',
    icon: <ShoppingOutlined />,
    label: 'Đặt hàng'
  },
  order_shipped: {
    color: '#722ed1',
    icon: <TruckOutlined />,
    label: 'Vận chuyển'
  },
  order_delivered: {
    color: '#52c41a',
    icon: <CheckCircleOutlined />,
    label: 'Đã giao'
  },
  order_cancelled: {
    color: '#ff4d4f',
    icon: <CloseCircleOutlined />,
    label: 'Đã hủy'
  },
  payment_success: {
    color: '#52c41a',
    icon: <CreditCardOutlined />,
    label: 'Thanh toán'
  },
  payment_failed: {
    color: '#ff4d4f',
    icon: <CreditCardOutlined />,
    label: 'Thanh toán'
  },
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
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      message.error(`Không thể tải thông báo: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications khi component mount
  useEffectOnce(() => {
    load();
  }, []);

  // Refresh khi quay lại trang notifications
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        load(pagination.page, pagination.limit);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pagination.page, pagination.limit]);

  // Auto-refresh notifications mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => {
      load(pagination.page, pagination.limit);
    }, 30000); // 30 seconds

    // Refresh khi tab được focus lại
    const handleFocus = () => {
      load(pagination.page, pagination.limit);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (page: number, pageSize?: number) => {
    load(page, pageSize || pagination.limit);
  };

  const handleMarkAsRead = async (id: number, link?: string | null) => {
    try {
      await notificationService.markAsRead(id);
      setItems(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n)),
      );
      // Refresh để cập nhật pagination và count
      await load(pagination.page, pagination.limit);
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
      // Reload để cập nhật pagination nếu cần
      await load(pagination.page, pagination.limit);
    } catch {
      message.error('Không thể đánh dấu tất cả thông báo');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = items.filter(n => !n.is_read).length;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ 
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Badge count={unreadCount} size="small" offset={[-5, 5]}>
              <BellOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            </Badge>
            <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
              Thông báo
            </Title>
            {unreadCount > 0 && (
              <Tag color="red" style={{ marginLeft: '8px' }}>
                {unreadCount} chưa đọc
              </Tag>
            )}
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => load(pagination.page, pagination.limit)}
              disabled={loading}
              style={{ borderRadius: '8px' }}
            >
              Làm mới
            </Button>
            {items.some(n => !n.is_read) && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={markingAll}
                onClick={handleMarkAll}
                style={{ borderRadius: '8px' }}
              >
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#8c8c8c' }}>Đang tải thông báo...</div>
          </div>
        ) : items.length === 0 ? (
          <Empty 
            description={
              <div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>Chưa có thông báo nào</div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Các thông báo về đơn hàng và thanh toán sẽ xuất hiện ở đây
                </Text>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '60px 0' }}
          />
        ) : (
          <>
            <List
              itemLayout="vertical"
              dataSource={items}
              split={false}
              renderItem={(item, index) => {
                const config = typeConfig[item.type] || { 
                  color: '#8c8c8c', 
                  icon: <BellOutlined />, 
                  label: item.type 
                };
                const isUnread = !item.is_read;

                return (
                  <List.Item
                    key={item.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      padding: '20px',
                      border: isUnread 
                        ? '2px solid #faad14' 
                        : '1px solid #f0f0f0',
                      cursor: item.link ? 'pointer' : 'default',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => handleMarkAsRead(item.id, item.link)}
                  >
                    {/* Unread indicator */}
                    {isUnread && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          background: config.color,
                          borderRadius: '0 4px 4px 0',
                        }}
                      />
                    )}

                    <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                      {/* Icon */}
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: `${config.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: '24px', color: config.color }}>
                          {config.icon}
                        </span>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          justifyContent: 'space-between',
                          marginBottom: '8px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <Space size={8} style={{ marginBottom: '8px' }}>
                              <Tag 
                                color={config.color}
                                style={{ 
                                  borderRadius: '6px',
                                  border: 'none',
                                  padding: '2px 8px',
                                  margin: 0
                                }}
                              >
                                {config.label}
                              </Tag>
                              {isUnread && (
                                <span
                                  aria-label="Chưa đọc"
                                  title="Chưa đọc"
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: config.color,
                                    display: 'inline-block',
                                    boxShadow: `0 0 0 2px ${config.color}22`,
                                  }}
                                />
                              )}
                            </Space>
                            <div>
                              <Text 
                                strong={isUnread} 
                                style={{ 
                                  fontSize: '16px',
                                  color: isUnread ? '#262626' : '#595959',
                                  display: 'block',
                                  marginBottom: '4px'
                                }}
                              >
                                {item.title}
                              </Text>
                            </div>
                          </div>
                        </div>
                        
                        <Text 
                          style={{ 
                            fontSize: '14px',
                            color: '#8c8c8c',
                            lineHeight: '1.6',
                            display: 'block',
                            marginBottom: '8px'
                          }}
                        >
                          {item.message}
                        </Text>

                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginTop: '8px'
                        }}>
                          <ClockCircleOutlined style={{ color: '#bfbfbf', fontSize: '12px' }} />
                          <Text 
                            type="secondary" 
                            style={{ 
                              fontSize: '12px',
                              color: '#8c8c8c'
                            }}
                          >
                            {formatTime(item.created_at)}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
            
            {pagination.totalPages > 1 && (
              <div style={{ 
                marginTop: '32px', 
                paddingTop: '24px',
                borderTop: '1px solid #f0f0f0',
                textAlign: 'center' 
              }}>
                <Pagination
                  current={pagination.page}
                  total={pagination.total}
                  pageSize={pagination.limit}
                  onChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) => (
                    <span style={{ color: '#8c8c8c', fontSize: '14px' }}>
                      Hiển thị {range[0]}-{range[1]} của {total} thông báo
                    </span>
                  )}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
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



