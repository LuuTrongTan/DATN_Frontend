import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Spin, Empty, DatePicker, Button } from 'antd';
import {
  ShoppingOutlined,
  DollarOutlined,
  UserOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { adminService, StatisticsResponse } from '../../../shares/services/adminService';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { logger } from '../../../shares/utils/logger';
import { useEffectOnce } from '../../../shares/hooks';
import AdminPageContent from '../../../shares/components/layouts/AdminPageContent';

const { RangePicker } = DatePicker;

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  // Sử dụng useEffectOnce để tránh gọi API 2 lần trong StrictMode
  useEffectOnce(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Tránh gọi API khi đang loading (tránh duplicate calls)
      if (loading && statistics !== null) return;
      
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
      logger.error('Error fetching statistics', error instanceof Error ? error : new Error(String(error)));
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
    setDateRange([null, null]);
    setTimeout(() => {
      fetchStatistics();
    }, 100);
  };

  const totalOrders = statistics?.orders?.total ? parseInt(statistics.orders.total) : 0;
  const totalRevenue = statistics?.orders?.revenue ? parseFloat(statistics.orders.revenue) : 0;
  const deliveredOrders = statistics?.orders?.delivered ? parseInt(statistics.orders.delivered) : 0;
  const totalUsers = statistics?.users?.total ? parseInt(statistics.users.total) : 0;
  const deliveryRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : '0';

  return (
    <AdminPageContent
      title="Tổng quan hệ thống"
      extra={(
        <Space>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
          />
          <Button type="primary" onClick={handleApplyFilter} loading={loading}>
            Áp dụng
          </Button>
          <Button onClick={handleResetFilter} disabled={loading}>
            Đặt lại
          </Button>
        </Space>
      )}
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      )}

      {!loading && (
        <>
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
              title="Doanh thu"
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
              title="Tổng khách hàng"
              value={totalUsers}
              prefix={<UserOutlined />}
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
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={24}>
          <Card title="Top 10 sản phẩm bán chạy" style={{ minHeight: 400 }}>
            {statistics?.topProducts && statistics.topProducts.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {statistics.topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    style={{
                      padding: '16px',
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: '#1890ff',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                        }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <Typography.Text strong style={{ fontSize: 16 }}>
                          {product.name}
                        </Typography.Text>
                        <br />
                        <Typography.Text type="secondary">
                          Đã bán: {product.total_sold} sản phẩm
                        </Typography.Text>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Typography.Text strong style={{ fontSize: 16, color: '#3f8600' }}>
                        {parseFloat(product.revenue).toLocaleString('vi-VN')} VNĐ
                      </Typography.Text>
                    </div>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="Chưa có dữ liệu sản phẩm" />
            )}
          </Card>
        </Col>
      </Row>
      </>
      )}
    </AdminPageContent>
  );
};

export default AdminDashboard;
