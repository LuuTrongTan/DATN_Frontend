import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Typography,
  Space,
  Table,
  Tag,
  Modal,
  message,
  Empty,
  Spin,
  Timeline,
} from 'antd';
import {
  CustomerServiceOutlined,
  PlusOutlined,
  EyeOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { supportService, SupportTicket, TicketMessage } from '../../shares/services/supportService';
import { orderService } from '../../shares/services/orderService';
import { useAuth } from '../../shares/contexts/AuthContext';
import { logger } from '../../shares/utils/logger';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messageLoading, setMessageLoading] = useState(false);
  const [form] = Form.useForm();
  const [messageForm] = Form.useForm();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await supportService.getTickets();
      if (response.success && response.data) {
        setTickets(response.data.data || []);
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải danh sách ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (values: any) => {
    try {
      const response = await supportService.createTicket({
        subject: values.subject,
        description: values.description,
        priority: values.priority || 'medium',
        order_id: values.order_id || undefined,
      });

      if (response.success) {
        message.success('Tạo ticket hỗ trợ thành công!');
        setCreateModalVisible(false);
        form.resetFields();
        fetchTickets();
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tạo ticket');
    }
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setDetailModalVisible(true);
    await fetchMessages(ticket.id);
  };

  const fetchMessages = async (ticketId: number) => {
    try {
      setMessageLoading(true);
      const response = await supportService.getTicketMessages(ticketId);
      if (response.success && response.data) {
        setMessages(response.data || []);
      }
    } catch (error: any) {
      logger.error('Error fetching messages', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setMessageLoading(false);
    }
  };

  const handleSendMessage = async (values: any) => {
    if (!selectedTicket) return;

    try {
      const response = await supportService.sendMessage(selectedTicket.id, {
        message: values.message,
      });

      if (response.success) {
        message.success('Gửi tin nhắn thành công!');
        messageForm.resetFields();
        await fetchMessages(selectedTicket.id);
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi gửi tin nhắn');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'blue',
      in_progress: 'orange',
      resolved: 'green',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      open: 'Mở',
      in_progress: 'Đang xử lý',
      resolved: 'Đã giải quyết',
      closed: 'Đã đóng',
    };
    return texts[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return colors[priority] || 'default';
  };

  const columns = [
    {
      title: 'Mã ticket',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      render: (text: string) => <Text strong>#{text}</Text>,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: SupportTicket) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewTicket(record)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2}>
              <CustomerServiceOutlined style={{ marginRight: 8 }} />
              Hỗ Trợ Khách Hàng
            </Title>
            <Text type="secondary">Quản lý các yêu cầu hỗ trợ của bạn</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setCreateModalVisible(true)}
          >
            Tạo ticket mới
          </Button>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={tickets}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} ticket`,
            }}
            locale={{
              emptyText: <Empty description="Chưa có ticket nào" />,
            }}
          />
        </Card>
      </Space>

      {/* Modal tạo ticket */}
      <Modal
        title="Tạo Ticket Hỗ Trợ Mới"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTicket}>
          <Form.Item
            label="Tiêu đề"
            name="subject"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề ticket" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <TextArea rows={6} placeholder="Mô tả chi tiết vấn đề của bạn..." />
          </Form.Item>

          <Form.Item label="Độ ưu tiên" name="priority" initialValue="medium">
            <Select>
              <Option value="low">Thấp</Option>
              <Option value="medium">Trung bình</Option>
              <Option value="high">Cao</Option>
              <Option value="urgent">Khẩn cấp</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Liên quan đến đơn hàng (tùy chọn)" name="order_id">
            <Input
              type="number"
              placeholder="Nhập ID đơn hàng nếu có"
              addonBefore="Order #"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Tạo ticket
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chi tiết ticket */}
      <Modal
        title={`Ticket #${selectedTicket?.ticket_number}`}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedTicket(null);
          setMessages([]);
          messageForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        {selectedTicket && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <Text strong>Tiêu đề: </Text>
                  <Text>{selectedTicket.subject}</Text>
                </div>
                <div>
                  <Text strong>Mô tả: </Text>
                  <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                    {selectedTicket.description}
                  </Paragraph>
                </div>
                <Space>
                  <Tag color={getStatusColor(selectedTicket.status)}>
                    {getStatusText(selectedTicket.status)}
                  </Tag>
                  <Tag color={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority.toUpperCase()}
                  </Tag>
                </Space>
              </Space>
            </Card>

            <Card title="Lịch sử tin nhắn" size="small">
              {messageLoading ? (
                <Spin />
              ) : messages.length === 0 ? (
                <Empty description="Chưa có tin nhắn nào" />
              ) : (
                <Timeline
                  items={messages.map((msg) => ({
                    color: msg.is_internal ? 'red' : 'blue',
                    children: (
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          <Text strong>{msg.is_internal ? '[Nội bộ]' : 'Bạn'}</Text>
                          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                            {new Date(msg.created_at).toLocaleString('vi-VN')}
                          </Text>
                        </div>
                        <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                          {msg.message}
                        </Paragraph>
                      </div>
                    ),
                  }))}
                />
              )}
            </Card>

            {selectedTicket.status !== 'closed' && (
              <Card size="small">
                <Form form={messageForm} layout="vertical" onFinish={handleSendMessage}>
                  <Form.Item
                    name="message"
                    rules={[{ required: true, message: 'Vui lòng nhập tin nhắn' }]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Nhập tin nhắn của bạn..."
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<MessageOutlined />}>
                      Gửi tin nhắn
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default SupportPage;

