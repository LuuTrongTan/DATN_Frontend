import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Table, Button, Space, Typography, Tag, Card, Input, InputNumber, message, Popconfirm, Modal, Image, Badge, Row, Col, Dropdown, TreeSelect, Switch } from 'antd';
import { EditOutlined, EyeOutlined, ReloadOutlined, ShoppingOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, PictureOutlined, AppstoreOutlined, UndoOutlined, MoreOutlined, CopyOutlined } from '@ant-design/icons';
import { productService } from '../../../shares/services/productService';
import { variantService } from '../../../shares/services/variantService';
import { Product, Category } from '../../../shares/types';
import { useNavigate } from 'react-router-dom';
import ProductForm from './ProductForm';
import { logger } from '../../../shares/utils/logger';
import { useEffectOnce } from '../../../shares/hooks';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchAdminProducts, fetchAdminCategories, setSearch, setCategory, setIncludeDeleted } from '../stores/adminProductsSlice';
import { adminService } from '../../../shares/services/adminService';
import AdminPageContent from '../../../shares/components/layouts/AdminPageContent';

const { Search } = Input;

type CategoryNode = Category & { children?: CategoryNode[] };

const buildCategoryTree = (items: Category[]): CategoryNode[] => {
  const map = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  items.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sắp xếp theo display_order rồi name để hiển thị ổn định
  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => {
      const orderA = (a as any).display_order ?? 0;
      const orderB = (b as any).display_order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, 'vi');
    });
    nodes.forEach((n) => n.children && sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
};

const renderCategoryNode = (node: CategoryNode) => {
  if (node.children && node.children.length > 0) {
    return (
      <TreeSelect.TreeNode value={node.id} title={node.name} key={node.id}>
        {node.children.map((child) => renderCategoryNode(child))}
      </TreeSelect.TreeNode>
    );
  }
  return <TreeSelect.TreeNode value={node.id} title={node.name} key={node.id} />;
};

// Dùng biến module-level để chặn StrictMode gọi lại fetch lần đầu
let initialProductsFetched = false;

const AdminProductManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: products, categories, categoriesLoading, loading, filters, error } = useAppSelector((state) => state.adminProducts);
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);


  // Sử dụng useEffectOnce để tránh gọi API 2 lần trong StrictMode
  // Chỉ gọi fetchAdminCategories nếu categories chưa có trong store
  useEffectOnce(() => {
    if (categories.length === 0 && !categoriesLoading) {
      dispatch(fetchAdminCategories());
    }
    if (!initialProductsFetched) {
      initialProductsFetched = true;
      dispatch(fetchAdminProducts({ limit: 100 }));
    }
  });

  // Bỏ qua lần chạy đầu (đã fetch ở useEffectOnce) để tránh duplicate trong StrictMode
  const hasRunFilterEffect = useRef(false);
  useEffect(() => {
    if (!hasRunFilterEffect.current) {
      hasRunFilterEffect.current = true;
      return;
    }
    dispatch(setSearch(searchQuery));
    dispatch(setCategory(selectedCategory));
    dispatch(setIncludeDeleted(showDeleted));
    dispatch(fetchAdminProducts({ 
      search: searchQuery || undefined, 
      category_id: selectedCategory,
      include_deleted: showDeleted,
      limit: 100 
    }));
  }, [dispatch, searchQuery, selectedCategory, showDeleted]);

  const handleDelete = async (id: number) => {
    try {
      await productService.deleteProduct(id);
      message.success('Xóa sản phẩm thành công');
      dispatch(fetchAdminProducts({ 
        search: filters.search || undefined, 
        category_id: filters.category_id,
        include_deleted: filters.include_deleted,
        limit: 100 
      }));
    } catch (error: any) {
      logger.error('Error deleting product', error instanceof Error ? error : new Error(String(error)));
      message.error(error.message || 'Có lỗi xảy ra khi xóa sản phẩm');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await adminService.restoreProduct(id);
      message.success('Khôi phục sản phẩm thành công');
      dispatch(fetchAdminProducts({ 
        search: filters.search || undefined, 
        category_id: filters.category_id,
        include_deleted: filters.include_deleted,
        limit: 100 
      }));
    } catch (error: any) {
      logger.error('Error restoring product', error instanceof Error ? error : new Error(String(error)));
      message.error(error.message || 'Có lỗi xảy ra khi khôi phục sản phẩm');
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await productService.updateProduct(product.id, {
        is_active: !product.is_active,
      });
      message.success(`Đã ${product.is_active ? 'vô hiệu hóa' : 'kích hoạt'} sản phẩm`);
      dispatch(fetchAdminProducts({ 
        search: filters.search || undefined, 
        category_id: filters.category_id,
        limit: 100 
      }));
    } catch (error: any) {
      logger.error('Error updating product status', error instanceof Error ? error : new Error(String(error)));
      message.error(error.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      // Lấy thông tin đầy đủ của sản phẩm và variants (đã dùng model mới với variant_attributes)
      const productResponse = await productService.getProductById(product.id);
      if (!productResponse.success || !productResponse.data) {
        message.error('Không thể lấy thông tin sản phẩm');
        return;
      }

      const fullProduct = productResponse.data;

      // Lấy variants nếu có
      let variants: Product['variants'] = [];
      if (fullProduct.variants && fullProduct.variants.length > 0) {
        variants = fullProduct.variants;
      }

      // Tạo sản phẩm mới với dữ liệu từ sản phẩm gốc
      // Tạo sản phẩm mới với dữ liệu từ sản phẩm gốc
      const newProductData: any = {
        category_id: fullProduct.category_id,
        name: `${fullProduct.name} (Bản sao)`,
        description: fullProduct.description || '',
        price: fullProduct.price,
        stock_quantity: fullProduct.stock_quantity || 0,
      };

      // Thêm image_urls và video_url nếu có
      if (fullProduct.image_urls && fullProduct.image_urls.length > 0) {
        newProductData.image_urls = fullProduct.image_urls;
      }
      if (fullProduct.video_url) {
        newProductData.video_url = fullProduct.video_url;
      }

      message.loading({ content: 'Đang tạo bản sao sản phẩm...', key: 'duplicate-product' });
      
      const createResponse = await productService.createProduct(newProductData as any);
      
      if (!createResponse.success || !createResponse.data) {
        throw new Error(createResponse.message || 'Không thể tạo sản phẩm mới');
      }

      const newProductId = createResponse.data.id;

      // Tạo variants nếu có (sử dụng model mới variant_attributes)
      if (variants && variants.length > 0) {
        message.loading({ content: 'Đang tạo biến thể...', key: 'duplicate-variants' });
        const { variantService } = await import('../../../shares/services/variantService');

        for (const variant of variants) {
          await variantService.createVariant(newProductId, {
            sku: variant.sku || null,
            variant_attributes: variant.variant_attributes || {},
            price_adjustment: variant.price_adjustment || 0,
            stock_quantity: variant.stock_quantity || 0,
            // AdminProductManagement hiện chỉ nhận được image_urls (nếu backend trả),
            // nếu không có thì bỏ qua để dùng ảnh sản phẩm gốc.
            image_urls: variant.image_urls || undefined,
            is_active: variant.is_active !== false,
          });
        }
        message.success({ content: 'Tạo biến thể thành công', key: 'duplicate-variants' });
      }

      message.success({ content: 'Tạo bản sao sản phẩm thành công', key: 'duplicate-product' });
      
      // Refresh danh sách
      dispatch(fetchAdminProducts({ 
        search: filters.search || undefined, 
        category_id: filters.category_id,
        limit: 100 
      }));
      
      // Mở form chỉnh sửa với sản phẩm mới
      navigate(`/admin/products/${newProductId}/edit`);
    } catch (error: any) {
      message.error({ content: error.message || 'Có lỗi xảy ra khi tạo bản sao sản phẩm', key: 'duplicate-product' });
      logger.error('Error duplicating product', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleUpdateVariantStock = async (variantId: number, newStock: number, productId: number) => {
    try {
      await variantService.updateVariant(variantId, {
        stock_quantity: newStock,
      });
      message.success('Cập nhật tồn kho thành công');
      // Refresh danh sách sản phẩm
      dispatch(fetchAdminProducts({ 
        search: filters.search || undefined, 
        category_id: filters.category_id,
        include_deleted: filters.include_deleted,
        limit: 100 
      }));
    } catch (error: any) {
      logger.error('Error updating variant stock', error instanceof Error ? error : new Error(String(error)));
      message.error(error.message || 'Có lỗi xảy ra khi cập nhật tồn kho');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center' as const,
      width: 80,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image_urls',
      key: 'image_urls',
      width: 100,
      render: (urls: string[] | null | undefined, record: Product) => {
        const safeUrls = urls ?? [];
        const imageCount = safeUrls.length;
        if (imageCount > 0) {
          return (
            <Image.PreviewGroup>
              <Badge count={imageCount > 1 ? imageCount : 0} offset={[-5, 5]}>
                <Image
                  src={safeUrls[0]}
                  alt={record.name}
                  width={70}
                  height={70}
                  style={{ 
                    objectFit: 'cover', 
                    borderRadius: 4, 
                    cursor: 'pointer',
                    border: '1px solid #d9d9d9'
                  }}
                  preview={{
                    mask: imageCount > 1 ? `Xem tất cả (${imageCount})` : 'Xem',
                  }}
                />
              </Badge>
              {/* Render các ảnh còn lại nhưng ẩn đi để có thể navigate trong preview */}
              {safeUrls.slice(1).map((url, index) => (
                <Image
                  key={index + 1}
                  src={url}
                  alt={`${record.name} - ${index + 2}`}
                  style={{ display: 'none' }}
                  preview={{}}
                />
              ))}
            </Image.PreviewGroup>
          );
        }
        return (
          <div style={{ 
            width: 70, 
            height: 70, 
            background: '#f0f0f0', 
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            <PictureOutlined />
          </div>
        );
      },
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      align: 'left' as const,
      render: (name: string, record: Product) => (
        <div>
          <Typography.Text strong>{name}</Typography.Text>
          {record.sku && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                SKU: {record.sku}
              </Typography.Text>
            </div>
          )}
          {record.variants && record.variants.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <Tag color="blue" icon={<AppstoreOutlined />}>
                {record.variants.length} biến thể
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category_name',
      key: 'category_name',
      align: 'center' as const,
      render: (categoryName: string | null, record: Product) =>
        categoryName || record.category?.name || '-',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number | string) => {
        const numeric = Number(price);
        if (Number.isNaN(numeric)) return '-';
        return `${numeric.toLocaleString('vi-VN')} VNĐ`;
      },
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      align: 'center' as const,
      render: (quantity: number, record: Product) => {
        // Tính tổng tồn kho từ variants nếu có
        let totalStock = quantity;
        if (record.variants && record.variants.length > 0) {
          totalStock = record.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
        }
        return (
          <Tag color={totalStock > 0 ? 'green' : 'red'}>
            {totalStock}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center' as const,
      width: 120,
      render: (isActive: boolean, record: Product) => {
        const isDeleted =
          (record as any).deleted_at !== null && (record as any).deleted_at !== undefined;
        if (isDeleted) {
          return <Tag color="red">Đã xóa</Tag>;
        }
        return (
          <Switch
            checked={isActive}
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<CloseCircleOutlined />}
            onChange={() => handleToggleStatus(record)}
          />
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      align: 'center' as const,
      width: 120,
      render: (text: string) => new Date(text).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center' as const,
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Product) => {
        const isDeleted =
          (record as any).deleted_at !== null && (record as any).deleted_at !== undefined;

        const actions: any[] = [];

        if (!isDeleted) {
          actions.push(
            {
              key: 'view',
              label: (
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/products/${record.id}`)}
                  block
                >
                  Xem
                </Button>
              ),
            },
            {
              key: 'edit',
              label: (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/admin/products/${record.id}/edit`)}
                  block
                >
                  Sửa
                </Button>
              ),
            },
            {
              key: 'duplicate',
              label: (
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() => handleDuplicateProduct(record)}
                  block
                >
                  Sao chép
                </Button>
              ),
            },
            {
              key: 'delete',
              label: (
                <Popconfirm
                  title="Bạn có chắc chắn muốn xóa sản phẩm này?"
                  description="Hành động này không thể hoàn tác."
                  onConfirm={() => handleDelete(record.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} block>
                    Xóa
                  </Button>
                </Popconfirm>
              ),
            }
          );
        } else {
          actions.push({
            key: 'restore',
            label: (
              <Popconfirm
                title="Bạn có chắc chắn muốn khôi phục sản phẩm này?"
                description="Sản phẩm sẽ được khôi phục và có thể sử dụng lại."
                onConfirm={() => handleRestore(record.id)}
                okText="Khôi phục"
                cancelText="Hủy"
              >
                <Button type="text" icon={<UndoOutlined />} block style={{ color: '#52c41a' }}>
                  Khôi phục
                </Button>
              </Popconfirm>
            ),
          });
        }

        return (
          <Dropdown
            trigger={['click']}
            menu={{ items: actions }}
            placement="bottomRight"
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <AdminPageContent
      title={(
        <>
          <ShoppingOutlined /> Quản lý sản phẩm
        </>
      )}
      extra={(
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Tạo sản phẩm mới
        </Button>
      )}
    >
        <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 16 }}>
          <Space style={{ width: '100%', flexWrap: 'wrap' }}>
            <Search
              placeholder="Tìm kiếm sản phẩm..."
              allowClear
              style={{ width: '100%', maxWidth: 320 }}
              onSearch={(value) => setSearchQuery(value)}
              enterButton
            />
            <TreeSelect
              style={{ width: 'auto', minWidth: 220, maxWidth: 320 }}
              placeholder="Lọc theo danh mục (bao gồm danh mục con)"
              allowClear
              treeDefaultExpandAll
              dropdownMatchSelectWidth={false}
              dropdownStyle={{ minWidth: 220, maxHeight: 400, overflow: 'auto' }}
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value)}
            >
              {categoryTree.map((node) => renderCategoryNode(node))}
            </TreeSelect>
            <Button 
              type={showDeleted ? 'primary' : 'default'}
              danger={showDeleted}
              onClick={() => {
                const newShowDeleted = !showDeleted;
                setShowDeleted(newShowDeleted);
                dispatch(setIncludeDeleted(newShowDeleted));
                dispatch(fetchAdminProducts({ 
                  search: filters.search || undefined, 
                  category_id: filters.category_id,
                  include_deleted: newShowDeleted,
                  limit: 100 
                }));
              }}
            >
              {showDeleted ? 'Ẩn sản phẩm đã xóa' : 'Hiển thị sản phẩm đã xóa'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => {
              dispatch(fetchAdminProducts({ 
                search: filters.search || undefined, 
                category_id: filters.category_id,
                include_deleted: filters.include_deleted,
                limit: 100 
              }));
            }}>
              Làm mới
            </Button>
          </Space>
        </Space>

        {error && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4 }}>
            <Typography.Text type="danger">
              <strong>Lỗi:</strong> {error}
            </Typography.Text>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={products}
          loading={loading}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          expandable={{
            expandedRowRender: (record: Product) => {
              if (!record.variants || record.variants.length === 0) {
                return (
                  <div style={{ padding: '16px 0', textAlign: 'center', color: '#999' }}>
                    Sản phẩm này chưa có biến thể
                  </div>
                );
              }
              return (
                <div style={{ padding: '16px 0' }}>
                  <Typography.Title level={5} style={{ marginBottom: 12 }}>
                    <AppstoreOutlined /> Biến thể ({record.variants.length})
                  </Typography.Title>
                  <Row gutter={[16, 16]}>
                    {record.variants.map((variant) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={variant.id}>
                        <Card
                          size="small"
                          hoverable
                          cover={
                            variant.image_urls && variant.image_urls.length > 0 ? (
                              <Image
                                src={variant.image_urls[0]}
                                alt={
                                  variant.variant_attributes
                                    ? Object.entries(variant.variant_attributes)
                                        .map(([key, val]) => `${key}: ${val}`)
                                        .join(', ')
                                    : `Biến thể #${variant.id}`
                                }
                                height={120}
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ 
                                height: 120, 
                                background: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#999'
                              }}>
                                <PictureOutlined />
                              </div>
                            )
                          }
                        >
                          <Card.Meta
                            title={
                              <div>
                                {variant.variant_attributes ? (
                                  Object.entries(variant.variant_attributes).map(
                                    ([key, val]) => (
                                      <Tag key={key} color="blue">
                                        {key}: {val}
                                      </Tag>
                                    )
                                  )
                                ) : (
                                  <Tag color="blue">Biến thể #{variant.id}</Tag>
                                )}
                              </div>
                            }
                            description={
                              <div style={{ marginTop: 8 }}>
                                <div>
                                  <Typography.Text type="secondary">Giá: </Typography.Text>
                                  <Typography.Text strong>
                                    {(() => {
                                      const basePrice = Number(record.price) || 0;
                                      const adjustment = variant.price_adjustment || 0;
                                      const finalPrice = basePrice + adjustment;
                                      return finalPrice.toLocaleString('vi-VN');
                                    })()} VNĐ
                                  </Typography.Text>
                                </div>
                                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Typography.Text type="secondary">Tồn kho: </Typography.Text>
                                  <InputNumber
                                    min={0}
                                    value={variant.stock_quantity || 0}
                                    onChange={(value) => {
                                      if (value !== null && value !== undefined) {
                                        handleUpdateVariantStock(variant.id, value, record.id);
                                      }
                                    }}
                                    size="small"
                                    style={{ width: 100 }}
                                  />
                                </div>
                                {variant.image_urls && variant.image_urls.length > 0 && (
                                  <div style={{ marginTop: 4 }}>
                                    <Typography.Text type="secondary">
                                      <PictureOutlined /> {variant.image_urls.length} ảnh
                                    </Typography.Text>
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              );
            },
            rowExpandable: (record: Product) =>
              Array.isArray(record.variants) && record.variants.length > 0,
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
          }}
          locale={{
            emptyText: loading ? 'Đang tải...' : error ? `Lỗi: ${error}` : 'Không có sản phẩm nào',
          }}
        />

      <Modal
        title="Tạo sản phẩm mới"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width="80%"
        destroyOnClose
        styles={{
          body: {
            maxHeight: '70vh',
            overflowY: 'auto',
          },
        }}
      >
        <ProductForm
          onSuccess={() => {
            setIsModalVisible(false);
            dispatch(fetchAdminProducts({ 
              search: filters.search || undefined, 
              category_id: filters.category_id,
              limit: 100 
            }));
          }}
          onCancel={() => setIsModalVisible(false)}
        />
      </Modal>
    </AdminPageContent>
  );
};

export default AdminProductManagement;

