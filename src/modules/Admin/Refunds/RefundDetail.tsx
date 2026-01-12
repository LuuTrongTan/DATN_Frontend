import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Descriptions,
  Tag,
  Space,
  Button,
  Form,
  Select,
  Input,
  InputNumber,
  message,
  Spin,
  Table,
  Alert,
  Timeline,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { Refund, RefundStatus } from '../../../shares/types';
import { refundService } from '../../../shares/services/refundService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const RefundDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [refund, setRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchRefund();
    }
  }, [id]);

  const fetchRefund = async () => {
    try {
      setLoading(true);
      const response = await refundService.getRefundById(Number(id));
      if (response.success && response.data) {
        setRefund(response.data);
        form.setFieldsValue({
          status: response.data.status,
          admin_notes: response.data.admin_notes || '',
          refund_amount: response.data.refund_amount || undefined,
        });
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi tải thông tin refund');
      navigate('/admin/refunds');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (values: any) => {
    try {
      setUpdating(true);
      const response = await refundService.updateRefundStatus(Number(id), {
        status: values.status,
        admin_notes: values.admin_notes,
        refund_amount: values.refund_amount,
      });

      if (response.success) {
        message.success('Cập nhật refund status thành công');
        fetchRefund();
      } else {
        message.error(response.message || 'Lỗi khi cập nhật');
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi cập nhật');
    } finally {
      setUpdating(false);
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

  const getTypeText = (type: string) => {
    const texts: Record<string, string> = {
      refund: 'Hoàn tiền',
      return: 'Trả hàng',
      exchange: 'Đổi hàng',
    };
    return texts[type] || type;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!refund) {
    return null;
  }

  const itemColumns = [
    {
      title: 'Order Item ID',
      dataIndex: 'order_item_id',
      key: 'order_item_id',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Số tiền hoàn',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      align: 'right' as const,
      render: (amount: number) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string | null) => reason || '-',
    },
  ];

  const statusTimeline = [
    { status: 'pending', label: 'Chờ xử lý' },
    { status: 'approved', label: 'Đã duyệt' },
    { status: 'processing', label: 'Đang xử lý' },
    { status: 'completed', label: 'Hoàn thành' },
  ];

  const currentStatusIndex = statusTimeline.findIndex((s) => s.status === refund.status);

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/admin/refunds')}
        style={{ marginBottom: 24 }}
      >
        Quay lại
      </Button>

      <Title level={2}>Chi tiết yêu cầu refund</Title>

      <Card title="Thông tin yêu cầu" style={{ marginBottom: 24 }}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Mã yêu cầu">
            <Text strong>{refund.refund_number}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Mã đơn hàng">
            <Text>{refund.order_number || `#${refund.order_id}`}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Loại">
            <Tag>{getTypeText(refund.type)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={getStatusColor(refund.status)}>{getStatusText(refund.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Lý do">
            <Text>{refund.reason}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Số tiền hoàn">
            <Text strong style={{ fontSize: 16 }}>
              {refund.refund_amount
                ? `${refund.refund_amount.toLocaleString('vi-VN')} VNĐ`
                : 'Chưa xác định'}
            </Text>
          </Descriptions.Item>
          {refund.admin_notes && (
            <Descriptions.Item label="Ghi chú từ admin">
              <Text>{refund.admin_notes}</Text>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Ngày tạo">
            <Text>{new Date(refund.created_at).toLocaleString('vi-VN')}</Text>
          </Descriptions.Item>
          {refund.processed_at && (
            <Descriptions.Item label="Ngày xử lý">
              <Text>{new Date(refund.processed_at).toLocaleString('vi-VN')}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {refund.items && refund.items.length > 0 && (
        <Card title="Sản phẩm yêu cầu refund" style={{ marginBottom: 24 }}>
          <Table
            columns={itemColumns}
            dataSource={refund.items}
            rowKey="id"
            pagination={false}
          />
        </Card>
      )}

      <Card title="Timeline trạng thái" style={{ marginBottom: 24 }}>
        <Timeline
          items={statusTimeline.map((item, index) => ({
            color: index <= currentStatusIndex ? 'green' : 'gray',
            children: item.label,
          }))}
        />
      </Card>

      <Card title="Cập nhật trạng thái">
        <Form form={form} layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Option value="pending">Chờ xử lý</Option>
              <Option value="approved">Đã duyệt</Option>
              <Option value="rejected">Từ chối</Option>
              <Option value="processing">Đang xử lý</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Số tiền hoàn" name="refund_amount">
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập số tiền hoàn"
            />
          </Form.Item>

          <Form.Item label="Ghi chú" name="admin_notes">
            <TextArea rows={4} placeholder="Nhập ghi chú cho khách hàng..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updating}>
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RefundDetail;
