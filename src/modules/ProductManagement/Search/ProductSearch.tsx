import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Input,
  Row,
  Col,
  Typography,
  Space,
  Button,
  Slider,
  Select,
  Checkbox,
  Spin,
  Empty,
  Tag,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import {
  fetchProducts,
  resetFilters,
  setCategory,
  setPage,
  setPriceRange as setPriceRangeFilter,
  setSearch,
  setSort,
  setTagIds,
} from '../stores/productsSlice';
import { Product } from '../../../shares/types';
import ProductCard from '../../Home/components/ProductCard';
import { useEffectOnce } from '../../../shares/hooks';
import { tagService, ProductTag } from '../../../shares/services/tagService';

const { Title, Text } = Typography;
const { Option } = Select;

const ProductSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: products, categories, loading, filters, total } = useAppSelector(
    (state) => state.products
  );
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  // Search params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    searchParams.get('min_price') ? Number(searchParams.get('min_price')) : 0,
    searchParams.get('max_price') ? Number(searchParams.get('max_price')) : 10000000,
  ]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  // Fetch tags
  useEffectOnce(() => {
    const fetchTags = async () => {
      try {
        setTagsLoading(true);
        const response = await tagService.getAllTags();
        if (response.success && response.data) {
          setTags(response.data);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setTagsLoading(false);
      }
    };
    fetchTags();
  }, []);

  // Khởi tạo filters từ URL khi mount
  // Danh mục đã được fetch tập trung tại Sidebar, nên không gọi lại ở đây
  useEffectOnce(() => {
    // Khởi tạo filters từ URL params
    const urlCategory = searchParams.get('category');
    const urlPage = searchParams.get('page');
    const urlSearch = searchParams.get('q');
    const urlMinPrice = searchParams.get('min_price');
    const urlMaxPrice = searchParams.get('max_price');
    const urlSort = searchParams.get('sort');
    const urlTagIds = searchParams.getAll('tag_ids');

    if (urlSearch) {
      setSearchQuery(urlSearch);
      dispatch(setSearch(urlSearch));
    }
    if (urlCategory) {
      dispatch(setCategory(Number(urlCategory)));
    }
    if (urlMinPrice || urlMaxPrice) {
      const min = urlMinPrice ? Number(urlMinPrice) : 0;
      const max = urlMaxPrice ? Number(urlMaxPrice) : 10000000;
      setPriceRange([min, max]);
      dispatch(setPriceRangeFilter([min, max]));
    }
    if (urlSort) {
      setSortBy(urlSort);
      dispatch(setSort(urlSort as any));
    }
    if (urlPage) {
      dispatch(setPage(Number(urlPage)));
    }
    if (urlTagIds.length > 0) {
      const tagIds = urlTagIds.map(id => Number(id)).filter(id => !isNaN(id));
      if (tagIds.length > 0) {
        dispatch(setTagIds(tagIds));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Đồng bộ searchQuery với URL khi URL thay đổi (ví dụ khi search từ navbar)
  useEffect(() => {
    const urlSearch = searchParams.get('q') || '';
    // Chỉ cập nhật nếu giá trị URL khác với giá trị hiện tại trong state
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
      if (urlSearch) {
        dispatch(setSearch(urlSearch));
      } else {
        dispatch(setSearch(''));
      }
      dispatch(setPage(1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Chỉ phụ thuộc vào searchParams để đồng bộ khi URL thay đổi

  // Đồng bộ priceRange local state với Redux filters
  useEffect(() => {
    const minPrice = filters.min_price || 0;
    const maxPrice = filters.max_price || 10000000;
    if (priceRange[0] !== minPrice || priceRange[1] !== maxPrice) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [filters.min_price, filters.max_price]);

  // Đồng bộ filters Redux -> URL (chỉ khi filters thay đổi từ user action)
  useEffect(() => {
    // Tránh update URL khi đang khởi tạo từ URL
    if (!filters.search && !filters.category_id && filters.page === 1 && !filters.tag_ids) return;

    const newParams = new URLSearchParams();
    if (filters.search) newParams.set('q', filters.search);
    if (filters.category_id) newParams.set('category', filters.category_id.toString());
    if (filters.min_price && filters.min_price > 0)
      newParams.set('min_price', filters.min_price.toString());
    if (filters.max_price && filters.max_price < 10000000)
      newParams.set('max_price', filters.max_price.toString());
    if (filters.sort && filters.sort !== 'newest') newParams.set('sort', filters.sort);
    if (filters.page && filters.page !== 1) newParams.set('page', filters.page.toString());
    if (filters.tag_ids && filters.tag_ids.length > 0) {
      filters.tag_ids.forEach(tagId => newParams.append('tag_ids', tagId.toString()));
    }

    setSearchParams(newParams, { replace: true });
  }, [filters, setSearchParams]);

  // Fetch products khi filters thay đổi
  useEffect(() => {
    dispatch(fetchProducts());
  }, [
    dispatch,
    filters.search,
    filters.category_id,
    filters.min_price,
    filters.max_price,
    filters.tag_ids,
    filters.sort,
    filters.page,
  ]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    dispatch(setSearch(value));
    dispatch(setPage(1));
  }, [dispatch]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setPriceRange([0, 10000000]);
    setSortBy('newest');
    dispatch(resetFilters());
    setSearchParams({});
  }, [dispatch, setSearchParams]);

  const handleTagChange = useCallback((selectedTagIds: number[]) => {
    if (selectedTagIds.length > 0) {
      dispatch(setTagIds(selectedTagIds));
    } else {
      dispatch(setTagIds(undefined));
    }
    dispatch(setPage(1));
  }, [dispatch]);

  const formatPrice = useMemo(() => {
    return (price: number) => new Intl.NumberFormat('vi-VN').format(price);
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Tìm Kiếm Sản Phẩm</Title>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                allowClear
                size="large"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={(e) => handleSearch(e.currentTarget.value)}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="large"
                onClick={() => handleSearch(searchQuery)}
              />
            </Space.Compact>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFiltersVisible(!filtersVisible)}
              >
                {filtersVisible ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
              </Button>
              <Space>
                <Text>Sắp xếp theo:</Text>
                <Select
                  value={sortBy}
                  onChange={(value) => {
                    setSortBy(value);
                    dispatch(setSort(value as any));
                    dispatch(setPage(1));
                  }}
                  style={{ width: 150 }}
                >
                  <Option value="newest">Mới nhất</Option>
                  <Option value="price_asc">Giá tăng dần</Option>
                  <Option value="price_desc">Giá giảm dần</Option>
                  <Option value="name">Tên A-Z</Option>
                </Select>
              </Space>
            </div>
          </Space>
        </Card>

        <Row gutter={[24, 24]}>
          {filtersVisible && (
            <Col xs={24} md={6}>
              <Card
                title={
                  <Space>
                    <FilterOutlined />
                    <Text strong>Bộ lọc</Text>
                  </Space>
                }
                extra={
                  <Button
                    type="link"
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                  >
                    Xóa
                  </Button>
                }
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Danh mục</Text>
                    <Select
                      style={{ width: '100%', marginTop: 8 }}
                      placeholder="Chọn danh mục"
                      allowClear
                      value={filters.category_id}
                      onChange={(value) => {
                        dispatch(setCategory(value));
                        dispatch(setPage(1));
                      }}
                    >
                      {categories.map((cat) => (
                        <Option key={cat.id} value={cat.id}>
                          {cat.name}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Text strong>Khoảng giá</Text>
                    <div style={{ marginTop: 8 }}>
                      <Slider
                        range
                        min={0}
                        max={10000000}
                        step={100000}
                        value={priceRange}
                        onChange={(value) => {
                          const range = value as [number, number];
                          setPriceRange(range);
                          dispatch(setPriceRangeFilter(range));
                          dispatch(setPage(1));
                        }}
                        tooltip={{
                          formatter: (value?: number) => `${formatPrice(value || 0)} VNĐ`,
                        }}
                      />
                      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <Text>{formatPrice(priceRange[0])} VNĐ</Text>
                        <Text>{formatPrice(priceRange[1])} VNĐ</Text>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Text strong>Tags</Text>
                    <Select
                      mode="multiple"
                      style={{ width: '100%', marginTop: 8 }}
                      placeholder="Chọn tags"
                      allowClear
                      loading={tagsLoading}
                      value={filters.tag_ids}
                      onChange={handleTagChange}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {tags.map((tag) => (
                        <Option key={tag.id} value={tag.id}>
                          {tag.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Space>
              </Card>
            </Col>
          )}

          <Col xs={24} md={filtersVisible ? 18 : 24}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
              </div>
            ) : products.length === 0 ? (
              <Card>
                <Empty
                  description="Không tìm thấy sản phẩm nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </Card>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">
                    Tìm thấy {total} sản phẩm
                    {filters.search && ` cho "${filters.search}"`}
                  </Text>
                </div>
                <Row gutter={[16, 16]}>
                  {products.map((product) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                      <ProductCard product={product} />
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default ProductSearchPage;

