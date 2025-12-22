import React, { useEffect, useMemo, useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Typography,
  Space,
  message,
  Upload,
  Row,
  Col,
  Image,
  Tabs,
  Spin,
  Table,
  Modal,
  Popconfirm,
  Tag,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  InboxOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../../../shares/services/productService';
import { variantService } from '../../../shares/services/variantService';
import { Category, ProductVariant } from '../../../shares/types';
import { uploadFile, uploadMultipleFiles } from '../../../shares/services/uploadService';
import { logger } from '../../../shares/utils/logger';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchCategories } from '../../ProductManagement/stores/productsSlice';
import { useEffectOnce } from '../../../shares/hooks';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

interface ProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ImageItem {
  type: 'url' | 'file';
  url?: string;
  file?: File;
  uploading?: boolean;
}

type VariantDraft = {
  id?: number; // có khi là variant đã tồn tại
  variant_type: string;
  variant_value: string;
  price_adjustment?: number;
  stock_quantity?: number;
};

const ProductForm: React.FC<ProductFormProps> = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { categories, categoriesLoading } = useAppSelector((state) => state.products);
  const [loading, setLoading] = useState(false);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantEditing, setVariantEditing] = useState<ProductVariant | null>(null);
  const [variantSaving, setVariantSaving] = useState(false);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([]);
  const [variantDraftModalOpen, setVariantDraftModalOpen] = useState(false);
  const [variantDraftEditingIndex, setVariantDraftEditingIndex] = useState<number | null>(null);
  const [variantForm] = Form.useForm();
  const [variantDraftForm] = Form.useForm();
  const isEditMode = Boolean(id && !onSuccess); // Nếu có onSuccess thì là modal mode (tạo mới)

  // Chỉ gọi fetchCategories một lần khi component mount, và chỉ khi categories chưa có trong store
  // Sử dụng useEffectOnce để đảm bảo chỉ chạy một lần, ngay cả trong StrictMode
  useEffectOnce(() => {
    // Chỉ gọi nếu categories chưa có và không đang loading
    // Nếu categories đã có rồi (từ lần trước hoặc component khác), không cần gọi lại
    if (categories.length === 0 && !categoriesLoading) {
      dispatch(fetchCategories());
    }
  });

  // Tách logic fetch product và variants ra useEffect riêng
  useEffect(() => {
    if (isEditMode) {
      fetchProduct();
      fetchVariants();
    } else {
      // Khi tạo mới, không cần khởi tạo gì
      setImageItems([]);
      setVariants([]);
      setVariantDrafts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(Number(id));
      if (response.success && response.data) {
        const product = response.data;
        form.setFieldsValue({
          category_id: product.category_id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock_quantity: product.stock_quantity,
        });
        
        // Load existing images as URL items
        if (product.image_urls && product.image_urls.length > 0) {
          setImageItems(product.image_urls.map(url => ({ type: 'url' as const, url })));
        } else {
          setImageItems([]);
        }
        
        // Load existing video URL
        if (product.video_url) {
          setVideoUrl(product.video_url);
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải thông tin sản phẩm');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchVariants = async () => {
    if (!id) return;
    try {
      setVariantsLoading(true);
      const response = await variantService.getVariantsByProduct(Number(id));
      if (response.success && response.data) {
        setVariants(response.data || []);
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi tải biến thể');
    } finally {
      setVariantsLoading(false);
    }
  };

  const hasVariants = useMemo(() => {
    return isEditMode ? variants.length > 0 : variantDrafts.length > 0;
  }, [isEditMode, variants.length, variantDrafts.length]);

  // Tổng tồn kho theo biến thể (dùng để tự động set tồn kho sản phẩm gốc)
  const variantStockTotal = useMemo(() => {
    if (isEditMode) {
      return variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
    }
    return variantDrafts.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
  }, [isEditMode, variants, variantDrafts]);

  // Khi có biến thể, tự đổ tồn kho sản phẩm gốc = tổng tồn kho biến thể
  useEffect(() => {
    if (hasVariants) {
      form.setFieldsValue({ stock_quantity: variantStockTotal });
    }
  }, [hasVariants, variantStockTotal, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const stockToUse = hasVariants ? variantStockTotal : values.stock_quantity;
      
      // Lấy danh sách file và URL
      const imageFiles = imageItems.filter(item => item.type === 'file' && item.file).map(item => item.file!);
      const imageUrlsFromItems = imageItems.filter(item => item.type === 'url' && item.url?.trim()).map(item => item.url!);
      
      // Tạo FormData để gửi file lên Backend
      const formData = new FormData();
      
      // Thêm thông tin sản phẩm
      formData.append('category_id', values.category_id);
      formData.append('name', values.name);
      if (values.description) {
        formData.append('description', values.description);
      }
      formData.append('price', values.price);
      formData.append('stock_quantity', stockToUse);
      
      // Thêm URL hình ảnh (nếu có)
      imageUrlsFromItems.forEach(url => {
        formData.append('image_urls', url);
      });
      
      // Thêm file hình ảnh (sẽ được upload khi submit)
      imageFiles.forEach(file => {
        formData.append('image_files', file);
      });
      
      // Thêm video URL hoặc file
      if (videoUrl) {
        formData.append('video_url', videoUrl);
      } else if (videoFile) {
        formData.append('video_file', videoFile);
      }
      
      // Gửi lên Backend - Backend sẽ upload file lên Cloudflare + local, sau đó lưu vào database
      message.loading({ content: 'Đang tạo sản phẩm...', key: 'create-product' });
      
      if (isEditMode) {
        // For edit, we still use JSON API but need to handle files differently
        // For now, upload files first then update product
        let uploadedImageUrls: string[] = [];
        if (imageFiles.length > 0) {
          uploadedImageUrls = await uploadMultipleFiles(imageFiles);
        }
        
        let finalVideoUrl = videoUrl;
        if (videoFile) {
          finalVideoUrl = await uploadFile(videoFile);
        }
        
        const allImageUrls = [...imageUrlsFromItems, ...uploadedImageUrls];
        const data = {
          ...values,
          image_urls: allImageUrls.length > 0 ? allImageUrls : undefined,
          video_url: finalVideoUrl || undefined,
          stock_quantity: stockToUse,
        };
        
        await productService.updateProduct(Number(id), data);
        message.success({ content: 'Cập nhật sản phẩm thành công', key: 'create-product' });
      } else {
        // For create, sử dụng JSON API như backend chuẩn,
        // giữ nguyên luồng: upload file trước, sau đó gửi dữ liệu sản phẩm
        const uploadedImageUrls = imageFiles.length
          ? await uploadMultipleFiles(imageFiles)
          : [];

        const finalVideoUrl =
          videoFile ? await uploadFile(videoFile) : videoUrl || undefined;

        const allImageUrls = [...imageUrlsFromItems, ...uploadedImageUrls];

        const createPayload = {
          ...values,
          image_urls: allImageUrls.length > 0 ? allImageUrls : undefined,
          video_url: finalVideoUrl,
          stock_quantity: stockToUse,
        };

        const createResponse = await productService.createProduct(
          createPayload as any
        );

        if (!createResponse.success || !createResponse.data) {
          throw new Error(
            createResponse.message ||
              'Có lỗi xảy ra khi tạo sản phẩm'
          );
        }

        const createdProductId = createResponse.data.id;

        // Nếu có nhập biến thể ở mode tạo mới -> tạo variants sau khi có product id
        if (createdProductId && variantDrafts.length > 0) {
          message.loading({
            content: 'Đang tạo biến thể...',
            key: 'create-variants',
          });
          for (const v of variantDrafts) {
            await variantService.createVariant(createdProductId, {
              variant_type: v.variant_type,
              variant_value: v.variant_value,
              price_adjustment: v.price_adjustment || 0,
              stock_quantity: v.stock_quantity || 0,
            });
          }
          message.success({
            content: 'Tạo biến thể thành công',
            key: 'create-variants',
          });
        }

        message.success({
          content: 'Tạo sản phẩm thành công',
          key: 'create-product',
        });
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin/products');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Handle image file upload - Chỉ lưu file vào state, chưa upload
  const handleImageUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      // Chỉ lưu file vào state, chưa upload lên server
      const newItem: ImageItem = { type: 'file', file: file as File };
      setImageItems([...imageItems, newItem]);
      if (onSuccess) {
        onSuccess(file);
      }
    } catch (error: any) {
      if (onError) {
        onError(error);
      }
      message.error(`Lỗi: ${error.message}`);
    }
  };

  const handleImageRemove = (index: number) => {
    setImageItems(imageItems.filter((_, i) => i !== index));
  };

  const handleAddImageUrl = () => {
    setImageItems([...imageItems, { type: 'url', url: '' }]);
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newItems = [...imageItems];
    newItems[index] = { type: 'url', url: value };
    setImageItems(newItems);
  };

  // Handle video file upload
  const handleVideoUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      setVideoFile(file as File);
      onSuccess?.(file);
    } catch (error: any) {
      onError?.(error);
      message.error(`Lỗi: ${error.message}`);
    }
  };

  const handleVideoRemove = () => {
    setVideoFile(null);
    setVideoUrl('');
  };

  const handleVideoUrlChange = (value: string) => {
    setVideoUrl(value);
    setVideoFile(null);
  };

  const openCreateVariantModal = () => {
    if (!isEditMode) return;
    setVariantEditing(null);
    variantForm.resetFields();
    setVariantModalOpen(true);
  };

  const openEditVariantModal = (v: ProductVariant) => {
    if (!isEditMode) return;
    setVariantEditing(v);
    variantForm.setFieldsValue({
      variant_type: v.variant_type,
      variant_value: v.variant_value,
      price_adjustment: v.price_adjustment || 0,
      stock_quantity: v.stock_quantity || 0,
    });
    setVariantModalOpen(true);
  };

  const saveVariant = async (values: VariantDraft) => {
    if (!id) return;
    try {
      setVariantSaving(true);
      if (variantEditing) {
        await variantService.updateVariant(variantEditing.id, {
          variant_type: values.variant_type,
          variant_value: values.variant_value,
          price_adjustment: values.price_adjustment ?? 0,
          stock_quantity: values.stock_quantity ?? 0,
        });
        message.success('Cập nhật biến thể thành công');
      } else {
        await variantService.createVariant(Number(id), {
          variant_type: values.variant_type,
          variant_value: values.variant_value,
          price_adjustment: values.price_adjustment ?? 0,
          stock_quantity: values.stock_quantity ?? 0,
        });
        message.success('Tạo biến thể thành công');
      }
      setVariantModalOpen(false);
      setVariantEditing(null);
      variantForm.resetFields();
      await fetchVariants();
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi lưu biến thể');
    } finally {
      setVariantSaving(false);
    }
  };

  const deleteVariant = async (variantId: number) => {
    try {
      await variantService.deleteVariant(variantId);
      message.success('Xóa biến thể thành công');
      await fetchVariants();
    } catch (error: any) {
      message.error(error.message || 'Không thể xóa biến thể');
    }
  };

  const openCreateVariantDraftModal = () => {
    if (isEditMode) return;
    setVariantDraftEditingIndex(null);
    variantDraftForm.resetFields();
    setVariantDraftModalOpen(true);
  };

  const openEditVariantDraftModal = (index: number) => {
    if (isEditMode) return;
    setVariantDraftEditingIndex(index);
    const v = variantDrafts[index];
    variantDraftForm.setFieldsValue({
      variant_type: v.variant_type,
      variant_value: v.variant_value,
      price_adjustment: v.price_adjustment || 0,
      stock_quantity: v.stock_quantity || 0,
    });
    setVariantDraftModalOpen(true);
  };

  const saveVariantDraft = (values: VariantDraft) => {
    const normalized: VariantDraft = {
      variant_type: values.variant_type.trim(),
      variant_value: values.variant_value.trim(),
      price_adjustment: values.price_adjustment ?? 0,
      stock_quantity: values.stock_quantity ?? 0,
    };

    // chặn trùng (type+value)
    const duplicateIndex = variantDrafts.findIndex(
      (v, idx) =>
        idx !== (variantDraftEditingIndex ?? -1) &&
        v.variant_type.toLowerCase() === normalized.variant_type.toLowerCase() &&
        v.variant_value.toLowerCase() === normalized.variant_value.toLowerCase()
    );
    if (duplicateIndex !== -1) {
      message.error('Biến thể này đã tồn tại trong danh sách');
      return;
    }

    if (variantDraftEditingIndex === null) {
      setVariantDrafts([...variantDrafts, normalized]);
    } else {
      const next = [...variantDrafts];
      next[variantDraftEditingIndex] = normalized;
      setVariantDrafts(next);
    }
    setVariantDraftModalOpen(false);
    setVariantDraftEditingIndex(null);
    variantDraftForm.resetFields();
  };

  const removeVariantDraft = (index: number) => {
    setVariantDrafts(variantDrafts.filter((_, i) => i !== index));
  };

  const variantColumns = [
    {
      title: 'Loại',
      dataIndex: 'variant_type',
      key: 'variant_type',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Giá trị',
      dataIndex: 'variant_value',
      key: 'variant_value',
    },
    {
      title: 'Điều chỉnh giá',
      dataIndex: 'price_adjustment',
      key: 'price_adjustment',
      align: 'right' as const,
      render: (v: number) => `${(v || 0).toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      align: 'center' as const,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 180,
      render: (_: any, record: ProductVariant) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditVariantModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa biến thể này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => deleteVariant(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const variantDraftColumns = [
    {
      title: 'Loại',
      dataIndex: 'variant_type',
      key: 'variant_type',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Giá trị',
      dataIndex: 'variant_value',
      key: 'variant_value',
    },
    {
      title: 'Điều chỉnh giá',
      dataIndex: 'price_adjustment',
      key: 'price_adjustment',
      align: 'right' as const,
      render: (v: number) => `${(v || 0).toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      align: 'center' as const,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 180,
      render: (_: any, __: VariantDraft, index: number) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditVariantDraftModal(index)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa biến thể này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => removeVariantDraft(index)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const formContent = (
    <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            stock_quantity: 0,
            price: 0,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tên sản phẩm"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
              >
                <Input placeholder="Nhập tên sản phẩm" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Danh mục"
                name="category_id"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select placeholder="Chọn danh mục">
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea rows={4} placeholder="Nhập mô tả sản phẩm" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Giá (VNĐ)"
                name="price"
                rules={[
                  { required: true, message: 'Vui lòng nhập giá' },
                  { type: 'number', min: 0, message: 'Giá phải lớn hơn 0' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Nhập giá sản phẩm"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Số lượng tồn kho"
                name="stock_quantity"
                rules={[
                  { required: true, message: 'Vui lòng nhập số lượng' },
                  { type: 'number', min: 0, message: 'Số lượng phải lớn hơn hoặc bằng 0' },
                ]}
                extra={
                  hasVariants
                    ? 'Đang dùng biến thể: tồn kho sản phẩm gốc tự = tổng tồn kho biến thể, không cần nhập.'
                    : undefined
                }
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Nhập số lượng"
                  min={0}
                  disabled={hasVariants}
                />
              </Form.Item>
            </Col>
          </Row>

          <Card
            title="Biến thể (tùy chọn)"
            style={{ marginBottom: 16 }}
            extra={
              isEditMode ? (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateVariantModal}>
                  Thêm biến thể
                </Button>
              ) : (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateVariantDraftModal}>
                  Thêm biến thể
                </Button>
              )
            }
          >
            {isEditMode ? (
              <Table
                columns={variantColumns}
                dataSource={variants}
                rowKey="id"
                loading={variantsLoading}
                pagination={false}
                locale={{ emptyText: 'Chưa có biến thể nào' }}
              />
            ) : (
              <Table
                columns={variantDraftColumns}
                dataSource={variantDrafts}
                rowKey={(_, index) => `draft-${index}`}
                pagination={false}
                locale={{ emptyText: 'Chưa có biến thể nào (sẽ được tạo sau khi tạo sản phẩm)' }}
              />
            )}
          </Card>

          <Form.Item label="Video sản phẩm (tùy chọn)">
            <Tabs
              items={[
                {
                  key: 'upload',
                  label: 'Tải lên file',
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {videoFile ? (
                        <Card>
                          <Space>
                            <span>{videoFile.name}</span>
                            <Button
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={handleVideoRemove}
                            >
                              Xóa
                            </Button>
                          </Space>
                        </Card>
                      ) : (
                        <Upload
                          customRequest={handleVideoUpload}
                          accept="video/*"
                          maxCount={1}
                          showUploadList={false}
                        >
                          <Button icon={<UploadOutlined />}>Chọn file video</Button>
                        </Upload>
                      )}
                    </Space>
                  ),
                },
                {
                  key: 'url',
                  label: 'Nhập URL',
                  children: (
                    <Input
                      placeholder="Nhập URL video"
                      value={videoUrl}
                      onChange={(e) => handleVideoUrlChange(e.target.value)}
                    />
                  ),
                },
              ]}
            />
          </Form.Item>

          <Form.Item label="Hình ảnh sản phẩm">
            <Tabs
              items={[
                {
                  key: 'upload',
                  label: 'Tải lên file',
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Dragger
                        customRequest={handleImageUpload}
                        accept="image/*"
                        multiple
                        showUploadList={false}
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click hoặc kéo thả file vào đây để chọn</p>
                        <p className="ant-upload-hint">
                          Hỗ trợ chọn nhiều file. File sẽ được upload khi bạn submit form.
                        </p>
                      </Dragger>
                      
                      {imageItems.filter(item => item.type === 'file').length > 0 && (
                        <div>
                          <Typography.Text strong>Hình ảnh đã chọn (sẽ upload khi submit):</Typography.Text>
                          <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                            {imageItems
                              .filter(item => item.type === 'file' && item.file)
                              .map((item, index) => {
                                const actualIndex = imageItems.findIndex(i => i === item);
                                const previewUrl = item.file ? URL.createObjectURL(item.file) : null;
                                return (
                                  <Col key={index} xs={12} sm={8} md={6}>
                                    <Card
                                      hoverable
                                      cover={
                                        previewUrl ? (
                                          <Image
                                            src={previewUrl}
                                            alt={`Selected ${index + 1}`}
                                            style={{ height: 120, objectFit: 'cover' }}
                                            preview={false}
                                          />
                                        ) : (
                                          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Spin />
                                          </div>
                                        )
                                      }
                                      actions={[
                                        <Button
                                          key="delete"
                                          danger
                                          size="small"
                                          icon={<DeleteOutlined />}
                                          onClick={() => {
                                            if (previewUrl) {
                                              URL.revokeObjectURL(previewUrl);
                                            }
                                            handleImageRemove(actualIndex);
                                          }}
                                        >
                                          Xóa
                                        </Button>,
                                      ]}
                                    >
                                      <Card.Meta
                                        title={item.file?.name || 'File'}
                                        description="Chưa upload - sẽ upload khi submit"
                                      />
                                    </Card>
                                  </Col>
                                );
                              })}
                          </Row>
                        </div>
                      )}
                    </Space>
                  ),
                },
                {
                  key: 'url',
                  label: 'Nhập URL',
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {imageItems
                        .filter(item => item.type === 'url')
                        .map((item, index) => {
                          const actualIndex = imageItems.findIndex(i => i === item);
                          return (
                            <Space key={index} style={{ width: '100%' }} align="start">
                              <div style={{ flex: 1 }}>
                                <Input
                                  placeholder="Nhập URL hình ảnh"
                                  value={item.url}
                                  onChange={(e) => handleImageUrlChange(actualIndex, e.target.value)}
                                />
                                {item.url && (
                                  <Image
                                    src={item.url}
                                    alt={`Preview ${index + 1}`}
                                    style={{ marginTop: 8, maxWidth: '100%', maxHeight: 200 }}
                                    preview
                                  />
                                )}
                              </div>
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleImageRemove(actualIndex)}
                              >
                                Xóa
                              </Button>
                            </Space>
                          );
                        })}
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={handleAddImageUrl}
                        style={{ width: '100%' }}
                      >
                        Thêm URL hình ảnh
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                {isEditMode ? 'Cập nhật' : 'Tạo mới'}
              </Button>
              <Button 
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                  } else {
                    navigate('/admin/products');
                  }
                }} 
                size="large"
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>

          {/* Modal thêm/sửa biến thể (edit mode) */}
          <Modal
            title={variantEditing ? 'Sửa biến thể' : 'Thêm biến thể'}
            open={variantModalOpen}
            onCancel={() => {
              setVariantModalOpen(false);
              setVariantEditing(null);
              variantForm.resetFields();
            }}
            footer={null}
            destroyOnClose
          >
            <Form
              form={variantForm}
              layout="vertical"
              onFinish={saveVariant}
              initialValues={{ price_adjustment: 0, stock_quantity: 0 }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Loại biến thể"
                    name="variant_type"
                    rules={[
                      { required: true, message: 'Vui lòng nhập loại biến thể (vd: size, color)' },
                      { max: 50, message: 'Tối đa 50 ký tự' },
                    ]}
                  >
                    <Input placeholder="Ví dụ: size" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Giá trị"
                    name="variant_value"
                    rules={[
                      { required: true, message: 'Vui lòng nhập giá trị (vd: XL, Đỏ)' },
                      { max: 100, message: 'Tối đa 100 ký tự' },
                    ]}
                  >
                    <Input placeholder="Ví dụ: XL" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Điều chỉnh giá (VNĐ)" name="price_adjustment">
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="0"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Tồn kho" name="stock_quantity">
                    <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={variantSaving}>
                    Lưu
                  </Button>
                  <Button
                    onClick={() => {
                      setVariantModalOpen(false);
                      setVariantEditing(null);
                      variantForm.resetFields();
                    }}
                  >
                    Hủy
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Modal thêm/sửa biến thể (create mode - draft) */}
          <Modal
            title={variantDraftEditingIndex === null ? 'Thêm biến thể' : 'Sửa biến thể'}
            open={variantDraftModalOpen}
            onCancel={() => {
              setVariantDraftModalOpen(false);
              setVariantDraftEditingIndex(null);
              variantDraftForm.resetFields();
            }}
            footer={null}
            destroyOnClose
          >
            <Form
              form={variantDraftForm}
              layout="vertical"
              onFinish={saveVariantDraft}
              initialValues={{ price_adjustment: 0, stock_quantity: 0 }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Loại biến thể"
                    name="variant_type"
                    rules={[
                      { required: true, message: 'Vui lòng nhập loại biến thể (vd: size, color)' },
                      { max: 50, message: 'Tối đa 50 ký tự' },
                    ]}
                  >
                    <Input placeholder="Ví dụ: color" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Giá trị"
                    name="variant_value"
                    rules={[
                      { required: true, message: 'Vui lòng nhập giá trị (vd: Đỏ, Xanh)' },
                      { max: 100, message: 'Tối đa 100 ký tự' },
                    ]}
                  >
                    <Input placeholder="Ví dụ: Đỏ" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Điều chỉnh giá (VNĐ)" name="price_adjustment">
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="0"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Tồn kho" name="stock_quantity">
                    <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    Lưu
                  </Button>
                  <Button
                    onClick={() => {
                      setVariantDraftModalOpen(false);
                      setVariantDraftEditingIndex(null);
                      variantDraftForm.resetFields();
                    }}
                  >
                    Hủy
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </Form>
  );

  if (onSuccess) {
    // Modal mode - chỉ hiển thị form
    return formContent;
  }

  // Page mode - hiển thị với Card và header
  return (
    <div>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/products')}
            style={{ marginBottom: 16 }}
          >
            Quay lại
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            {isEditMode ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm mới'}
          </Title>
        </div>
        {formContent}
      </Card>
    </div>
  );
};

export default ProductForm;

