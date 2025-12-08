import React, { useEffect, useState } from 'react';
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
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../../shares/services/productService';
import { categoryService } from '../../shares/services/categoryService';
import { Category } from '../../shares/types';
import { uploadFile, uploadMultipleFiles } from '../../shares/services/uploadService';

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

const ProductForm: React.FC<ProductFormProps> = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const isEditMode = Boolean(id && !onSuccess); // Nếu có onSuccess thì là modal mode (tạo mới)

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProduct();
    } else {
      // Khi tạo mới, không cần khởi tạo gì
      setImageItems([]);
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
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
      formData.append('stock_quantity', values.stock_quantity);
      
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
        };
        
        await productService.updateProduct(Number(id), data);
        message.success({ content: 'Cập nhật sản phẩm thành công', key: 'create-product' });
      } else {
        // For create, use FormData to send files
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3004/api';
        const response = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: formData,
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Có lỗi xảy ra khi tạo sản phẩm');
        }
        
        message.success({ content: 'Tạo sản phẩm thành công', key: 'create-product' });
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
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Nhập số lượng"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

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

