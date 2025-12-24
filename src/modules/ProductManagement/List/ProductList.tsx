import React, { useEffect } from 'react';
import { Spin } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchProducts, setCategory, fetchCategories } from '../stores/productsSlice';
import { fetchWishlist } from '../stores/wishlistSlice';
import { useEffectOnce } from '../../../shares/hooks';
import { productService } from '../../../shares/services/productService';
import { ProductSection, CategorySection } from '../../Home/components';

const ProductList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: products, categories, loading } = useAppSelector((state) => state.products);
  const [searchParams] = useSearchParams();

  // Xử lý category_slug từ URL khi searchParams thay đổi
  useEffect(() => {
    const categorySlug = searchParams.get('category_slug');
    
    if (categorySlug) {
      // Fetch products với category_slug trực tiếp (backend hỗ trợ)
      productService.getProducts({ category_slug: categorySlug }).then((response) => {
        if (response.success && response.data) {
          // Dispatch action để update state
          dispatch({
            type: 'products/fetchProducts/fulfilled',
            payload: {
              products: response.data.data || [],
              total: response.data.pagination?.total || 0,
            },
          });
        }
      }).catch((error) => {
        console.error('Error fetching products by category_slug:', error);
      });
    } else {
      // Không có category_slug trong URL, fetch products bình thường
      dispatch(fetchProducts());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Cập nhật category_id trong select box khi categories được load và có category_slug trong URL
  useEffect(() => {
    const categorySlug = searchParams.get('category_slug');
    if (categorySlug && categories.length > 0) {
      const category = categories.find(cat => cat.slug === categorySlug);
      if (category) {
        dispatch(setCategory(category.id));
      }
    }
  }, [categories, searchParams, dispatch]);

  // Sử dụng useEffectOnce để tránh gọi API 2 lần trong StrictMode
  // Danh mục đã được fetch tập trung tại Sidebar (MainLayout).
  // Ở đây chỉ cần đảm bảo product + wishlist được tải khi vào trang.
  useEffectOnce(() => {
    dispatch(fetchCategories());
    dispatch(fetchWishlist());
  }, [dispatch]);

  // Lấy tên category từ URL để hiển thị title
  const categorySlug = searchParams.get('category_slug');
  const category = categorySlug ? categories.find(cat => cat.slug === categorySlug) : null;
  const sectionTitle = category ? category.name : 'Danh sách sản phẩm';

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Categories Section */}
          {categories.length > 0 && (
            <CategorySection categories={categories} />
          )}
          
          {/* Products Section */}
          <ProductSection
            products={products}
            title={sectionTitle}
            loading={loading}
            showViewAll={false}
          />
        </>
      )}
    </div>
  );
};

export default ProductList;

