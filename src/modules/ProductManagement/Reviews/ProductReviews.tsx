import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Typography,
  Space,
  Rate,
  Image,
  Pagination,
  Empty,
  Spin,
  Tag,
  Divider,
  Row,
  Col,
  Statistic,
} from 'antd';
import { StarFilled, UserOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchProductReviews, setPage } from '../stores/reviewsSlice';

const { Title, Text, Paragraph } = Typography;

const ProductReviews: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { items: reviews, loading, page, total, limit, stats } = useAppSelector(
    (state) => state.reviews
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchProductReviews({ productId: Number(id) }));
    }
  }, [dispatch, id, page]);

  const getRatingPercentage = (rating: number) => {
    if (stats.totalReviews === 0) return 0;
    return Math.round((stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100);
  };

  if (loading && reviews.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>Đánh Giá Sản Phẩm</Title>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }} align="center">
              <div>
                <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#1890ff' }}>
                  {stats.averageRating.toFixed(1)}
                </Text>
                <div>
                  <Rate disabled value={stats.averageRating} allowHalf />
                </div>
                <Text type="secondary">Dựa trên {stats.totalReviews} đánh giá</Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="Phân bố đánh giá">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Text>{rating} sao</Text>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: '#f0f0f0',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${getRatingPercentage(rating)}%`,
                        height: '100%',
                        background: rating >= 4 ? '#52c41a' : rating >= 3 ? '#faad14' : '#ff4d4f',
                      }}
                    />
                  </div>
                  <Text type="secondary" style={{ minWidth: 50, textAlign: 'right' }}>
                    {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]} (
                    {getRatingPercentage(rating)}%)
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card>
        {reviews.length === 0 ? (
          <Empty description="Chưa có đánh giá nào" />
        ) : (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {reviews.map((review) => (
              <Card key={review.id} size="small" style={{ marginBottom: 16 }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <Space>
                        <UserOutlined />
                        <Text strong>{review.user?.full_name || 'Khách hàng'}</Text>
                        <Tag color="blue">Đã mua hàng</Tag>
                      </Space>
                      <div style={{ marginTop: 8 }}>
                        <Rate disabled value={review.rating} />
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                          {new Date(review.created_at).toLocaleDateString('vi-VN')}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {review.comment && (
                    <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                      {review.comment}
                    </Paragraph>
                  )}

                  {review.image_urls && review.image_urls.length > 0 && (
                    <div>
                      <Image.PreviewGroup>
                        {review.image_urls.map((url, idx) => (
                          <Image
                            key={idx}
                            src={url}
                            width={80}
                            height={80}
                            style={{ objectFit: 'cover', marginRight: 8, borderRadius: 4 }}
                          />
                        ))}
                      </Image.PreviewGroup>
                    </div>
                  )}

                  {review.reply && (
                    <Card
                      size="small"
                      style={{
                        background: '#f5f5f5',
                        marginTop: 8,
                        borderLeft: '3px solid #1890ff',
                      }}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong style={{ color: '#1890ff' }}>
                          Phản hồi từ cửa hàng:
                        </Text>
                        <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                          {review.reply}
                        </Paragraph>
                        {review.replied_at && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(review.replied_at).toLocaleDateString('vi-VN')}
                          </Text>
                        )}
                      </Space>
                    </Card>
                  )}
                </Space>
              </Card>
            ))}

            {total > limit && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination
                  current={page}
                  total={total}
                  pageSize={limit}
                  onChange={(p) => {
                    dispatch(setPage(p));
                    if (id) {
                      dispatch(fetchProductReviews({ productId: Number(id), page: p }));
                    }
                  }}
                  showSizeChanger={false}
                  showTotal={(total) => `Tổng ${total} đánh giá`}
                />
              </div>
            )}
          </Space>
        )}
      </Card>
    </div>
  );
};

export default ProductReviews;

