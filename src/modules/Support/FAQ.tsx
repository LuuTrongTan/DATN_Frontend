import React, { useEffect, useState } from 'react';
import {
  Card,
  Collapse,
  Typography,
  Space,
  Input,
  Tag,
  Empty,
  Spin,
} from 'antd';
import {
  QuestionCircleOutlined,
  SearchOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { faqService, FAQ } from '../../shares/services/faqService';
import { logger } from '../../shares/utils/logger';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Search } = Input;

const FAQPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchFAQs();
  }, []);

  useEffect(() => {
    filterFAQs();
  }, [searchQuery, selectedCategory, faqs]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await faqService.getFAQs();
      if (response.success && response.data) {
        const faqData = response.data || [];
        setFaqs(faqData);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(faqData.map((faq: FAQ) => faq.category).filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);
      }
    } catch (error: any) {
      logger.error('Error fetching FAQs', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const filterFAQs = () => {
    let filtered = [...faqs];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((faq) => faq.category === selectedCategory);
    }

    // Sort by order_index
    filtered.sort((a, b) => (a.order_index || 999) - (b.order_index || 999));

    setFilteredFaqs(filtered);
  };

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    const category = faq.category || 'Khác';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={2}>
            <QuestionCircleOutlined style={{ marginRight: 8 }} />
            Câu Hỏi Thường Gặp
          </Title>
          <Text type="secondary">Tìm câu trả lời cho các câu hỏi phổ biến của bạn</Text>
        </div>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Search
              placeholder="Tìm kiếm câu hỏi..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {categories.length > 0 && (
              <div>
                <Space wrap>
                  <TagsOutlined />
                  <Text strong>Danh mục:</Text>
                  <Tag
                    color={selectedCategory === null ? 'blue' : 'default'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedCategory(null)}
                  >
                    Tất cả
                  </Tag>
                  {categories.map((category) => (
                    <Tag
                      key={category}
                      color={selectedCategory === category ? 'blue' : 'default'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCategoryClick(category)}
                    >
                      {category}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </Space>
        </Card>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : filteredFaqs.length === 0 ? (
          <Card>
            <Empty description="Không tìm thấy câu hỏi nào" />
          </Card>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
              <Card
                key={category}
                title={
                  <Space>
                    <TagsOutlined />
                    <Text strong>{category}</Text>
                    <Tag color="blue">{categoryFaqs.length}</Tag>
                  </Space>
                }
              >
                <Collapse
                  accordion
                  bordered={false}
                  style={{ background: 'transparent' }}
                >
                  {categoryFaqs.map((faq) => (
                    <Panel
                      header={
                        <Text strong style={{ fontSize: 15 }}>
                          {faq.question}
                        </Text>
                      }
                      key={faq.id}
                    >
                      <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                        {faq.answer}
                      </Paragraph>
                    </Panel>
                  ))}
                </Collapse>
              </Card>
            ))}
          </Space>
        )}

        <Card>
          <div style={{ textAlign: 'center' }}>
            <QuestionCircleOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Title level={4}>Không tìm thấy câu trả lời?</Title>
            <Paragraph type="secondary">
              Nếu bạn không tìm thấy câu trả lời cho câu hỏi của mình, vui lòng liên hệ với chúng tôi.
            </Paragraph>
            <Space>
              <a href="/support">Gửi yêu cầu hỗ trợ</a>
              <Text type="secondary">hoặc</Text>
              <a href="mailto:support@example.com">support@example.com</a>
            </Space>
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default FAQPage;

