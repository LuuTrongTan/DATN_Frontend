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
  fetchCategories,
  fetchProducts,
  resetFilters,
  setCategory,
  setPage,
  setPriceRange as setPriceRangeFilter,
  setSearch,
  setSort,
} from '../stores/productsSlice';
import { Product } from '../../../shares/types';
import ProductCard from '../../Home/components/ProductCard';

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

  // Search params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    searchParams.get('min_price') ? Number(searchParams.get('min_price')) : 0,
    searchParams.get('max_price') ? Number(searchParams.get('max_price')) : 10000000,
  ]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  // Khởi tạo categories và sync URL -> Redux khi mount
  useEffect(() => {
    dispatch(fetchCategories());
    
    // Khởi tạo filters từ URL params
    const urlCategory = searchParams.get('category');
    const urlPage = searchParams.get('page');
    const urlSearch = searchParams.get('q');
    const urlMinPrice = searchParams.get('min_price');
    const urlMaxPrice = searchParams.get('max_price');
    const urlSort = searchParams.get('sort');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Đồng bộ filters Redux -> URL (chỉ khi filters thay đổi từ user action)
  useEffect(() => {
    // Tránh update URL khi đang khởi tạo từ URL
    if (!filters.search && !filters.category_id && filters.page === 1) return;

    const newParams = new URLSearchParams();
    if (filters.search) newParams.set('q', filters.search);
    if (filters.category_id) newParams.set('category', filters.category_id.toString());
    if (filters.min_price && filters.min_price > 0)
      newParams.set('min_price', filters.min_price.toString());
    if (filters.max_price && filters.max_price < 10000000)
      newParams.set('max_price', filters.max_price.toString());
    if (filters.sort && filters.sort !== 'newest') newParams.set('sort', filters.sort);
    if (filters.page && filters.page !== 1) newParams.set('page', filters.page.toString());

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

  const formatPrice = useMemo(() => {
    return (price: number) => new Intl.NumberFormat('vi-VN').format(price);
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Tìm Kiếm Sản Phẩm</Title>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input.Search
              placeholder="Tìm kiếm sản phẩm..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
            />

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

