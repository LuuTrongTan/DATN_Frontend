import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  DatePicker,
  Button,
  Table,
  Tag,
  Spin,
  Empty,
  Progress,
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { adminService, StatisticsResponse } from '../../shares/services/adminService';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Statistics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await adminService.getStatistics(params);
      if (response.statistics) {
        setStatistics(response.statistics);
      }
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  const handleApplyFilter = () => {
    fetchStatistics();
  };

  const handleResetFilter = () => {
    setDateRange([dayjs().subtract(30, 'day'), dayjs()]);
    setTimeout(() => {
      fetchStatistics();
    }, 100);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const totalOrders = statistics?.orders?.total ? parseInt(statistics.orders.total) : 0;
  const totalRevenue = statistics?.orders?.revenue ? parseFloat(statistics.orders.revenue) : 0;
  const deliveredOrders = statistics?.orders?.delivered ? parseInt(statistics.orders.delivered) : 0;
  const totalUsers = statistics?.users?.total ? parseInt(statistics.users.total) : 0;
  const deliveryRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100) : 0;
  const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

  const topProductsColumns = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 80,
      render: (_: any, __: any, index: number) => {
        const rank = index + 1;
        const color = rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : '#1890ff';
        return (
          <Tag color={color} style={{ fontSize: 16, fontWeight: 'bold', width: 40, textAlign: 'center' }}>
            #{rank}
          </Tag>
        );
      },
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Số lượng đã bán',
      dataIndex: 'total_sold',
      key: 'total_sold',
      align: 'right' as const,
      render: (value: string) => {
        const sold = parseInt(value);
        return (
          <Space>
            <Text>{sold.toLocaleString('vi-VN')}</Text>
            <Tag color="blue">sản phẩm</Tag>
          </Space>
        );
      },
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      render: (value: string) => {
        const revenue = parseFloat(value);
        return (
          <Text strong style={{ color: '#3f8600', fontSize: 16 }}>
            {revenue.toLocaleString('vi-VN')} VNĐ
          </Text>
        );
      },
    },
    {
      title: 'Tỷ trọng',
      key: 'percentage',
      align: 'center' as const,
      render: (_: any, record: any) => {
        const revenue = parseFloat(record.revenue);
        const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
        return (
          <Progress
            percent={percentage}
            format={(percent) => `${percent?.toFixed(1)}%`}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Thống kê tổng quan</Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
          />
          <Button type="primary" onClick={handleApplyFilter}>
            Áp dụng
          </Button>
          <Button onClick={handleResetFilter}>
            Đặt lại
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchStatistics}>
            Làm mới
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={totalOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={totalRevenue}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
              precision={0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Giá trị đơn trung bình"
              value={averageOrderValue}
              prefix={<ShoppingCartOutlined />}
              suffix="VNĐ"
              precision={0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tỷ lệ giao hàng"
              value={deliveryRate}
              suffix="%"
              prefix={<ArrowUpOutlined />}
              precision={1}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn đã giao"
              value={deliveredOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng người dùng"
              value={totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn chưa giao"
              value={totalOrders - deliveredOrders}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tỷ lệ hoàn thành"
              value={deliveryRate}
              suffix="%"
              prefix={<ArrowUpOutlined />}
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Top 10 sản phẩm bán chạy" style={{ minHeight: 400 }}>
            {statistics?.topProducts && statistics.topProducts.length > 0 ? (
              <Table
                columns={topProductsColumns}
                dataSource={statistics.topProducts}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            ) : (
              <Empty description="Chưa có dữ liệu sản phẩm" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
