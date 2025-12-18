import React from 'react';
import { Row, Col, Card, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Category } from '../../../shares/types';

const { Title, Text } = Typography;

interface CategorySectionProps {
  categories: Category[];
  title?: string;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  categories, 
  title = 'Danh mục sản phẩm' 
}) => {
  const navigate = useNavigate();

  if (categories.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 48 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        {title}
      </Title>
      <Row gutter={[16, 16]}>
        {categories.map((category) => (
          <Col xs={12} sm={8} md={6} lg={4} key={category.id}>
            <Card
              hoverable
              onClick={() => navigate(`/products?category=${category.id}`)}
              style={{
                textAlign: 'center',
                borderRadius: 8,
                height: '100%',
                transition: 'all 0.3s',
              }}
              styles={{ body: { padding: 16 } }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  margin: '0 auto 12px',
                  borderRadius: '50%',
                  background: category.image_url
                    ? `url(${category.image_url}) center/cover`
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {!category.image_url && category.name.charAt(0).toUpperCase()}
              </div>
              <Text strong style={{ fontSize: 14 }}>
                {category.name}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default CategorySection;

