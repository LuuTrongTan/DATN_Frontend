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
  Badge,
  Alert,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  InboxOutlined,
  EditOutlined,
  PictureOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { productService } from '../../../shares/services/productService';
import { variantService } from '../../../shares/services/variantService';
import { Category, ProductVariant } from '../../../shares/types';
import VariantAttributesManager from './VariantAttributesManager';
import VariantAttributesForm from './VariantAttributesForm';
import { uploadFile, uploadMultipleFiles } from '../../../shares/services/uploadService';
import { logger } from '../../../shares/utils/logger';
import { useAppDispatch, useAppSelector } from '../../../shares/stores';
import { fetchCategories } from '../../ProductManagement/stores/productsSlice';
import { useEffectOnce } from '../../../shares/hooks';
import AdminPageContent from '../../../shares/components/layouts/AdminPageContent';

const { Title, Text } = Typography;
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
  variant_attributes: Record<string, string>; // Mới: JSONB variant_attributes
  price_adjustment?: number;
  stock_quantity?: number;
  sku?: string | null;
  image_urls?: string[]; // URLs đã upload hoặc từ server
  imageFiles?: File[]; // Files để upload sau khi tạo product
  is_active?: boolean;
};

const ProductForm: React.FC<ProductFormProps> = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [justCreatedVariant, setJustCreatedVariant] = useState<ProductVariant | null>(null); // Lưu variant vừa tạo để duplicate
  // State cho variant images (edit mode)
  const [variantImageItems, setVariantImageItems] = useState<ImageItem[]>([]);
  // State cho variant draft images (create mode)
  const [variantDraftImageItems, setVariantDraftImageItems] = useState<ImageItem[]>([]);
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
      
      // Kiểm tra query param để tự động mở modal tạo biến thể
      if (searchParams.get('openVariantModal') === 'true') {
        // Xóa query param
        searchParams.delete('openVariantModal');
        setSearchParams(searchParams, { replace: true });
        
        // Mở modal sau một chút để đảm bảo data đã load xong
        setTimeout(() => {
          setVariantModalOpen(true);
        }, 500);
      }
    } else {
      // Khi tạo mới, không cần khởi tạo gì
      setImageItems([]);
      setVariants([]);
      setVariantDrafts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, searchParams]);

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
            // Upload variant image files nếu có
            let uploadedVariantImageUrls: string[] = [];
            if (v.imageFiles && v.imageFiles.length > 0) {
              uploadedVariantImageUrls = await uploadMultipleFiles(v.imageFiles);
            }

            // Kết hợp URLs và uploaded URLs
            const allVariantImageUrls = [
              ...(v.image_urls || []),
              ...uploadedVariantImageUrls
            ];

            await variantService.createVariant(createdProductId, {
              variant_attributes: v.variant_attributes,
              price_adjustment: v.price_adjustment || 0,
              stock_quantity: v.stock_quantity || 0,
              sku: v.sku || null,
              image_urls: allVariantImageUrls.length > 0 ? allVariantImageUrls : undefined,
              is_active: v.is_active !== false,
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
        
        // Nếu không có variantDrafts, tự động mở modal tạo biến thể
        if (!variantDrafts || variantDrafts.length === 0) {
          if (onSuccess) {
            // Modal mode: đóng modal và thông báo
            message.info('Vui lòng quay lại để tạo biến thể cho sản phẩm');
            onSuccess();
            return; // Return sớm để không chạy code bên dưới
          } else {
            // Page mode: chuyển sang edit mode và mở modal
            navigate(`/admin/products/${createdProductId}?openVariantModal=true`);
            return; // Return sớm để không navigate đến /admin/products
          }
        }
      }
      
      // Nếu có variantDrafts hoặc không phải create mode, xử lý bình thường
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

  // Handlers cho variant images (edit mode)
  const handleVariantImageUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      const newItem: ImageItem = { type: 'file', file: file as File };
      setVariantImageItems([...variantImageItems, newItem]);
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

  const handleVariantImageRemove = (index: number) => {
    setVariantImageItems(variantImageItems.filter((_, i) => i !== index));
  };

  const handleVariantImageUrlChange = (index: number, url: string) => {
    const updated = [...variantImageItems];
    updated[index] = { ...updated[index], url };
    setVariantImageItems(updated);
  };

  const handleAddVariantImageUrl = () => {
    setVariantImageItems([...variantImageItems, { type: 'url', url: '' }]);
  };

  // Handlers cho variant draft images (create mode)
  const handleVariantDraftImageUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      const newItem: ImageItem = { type: 'file', file: file as File };
      setVariantDraftImageItems([...variantDraftImageItems, newItem]);
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

  const handleVariantDraftImageRemove = (index: number) => {
    setVariantDraftImageItems(variantDraftImageItems.filter((_, i) => i !== index));
  };

  const handleVariantDraftImageUrlChange = (index: number, url: string) => {
    const updated = [...variantDraftImageItems];
    updated[index] = { ...updated[index], url };
    setVariantDraftImageItems(updated);
  };

  const handleAddVariantDraftImageUrl = () => {
    setVariantDraftImageItems([...variantDraftImageItems, { type: 'url', url: '' }]);
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
    setVariantImageItems([]); // Reset variant images
    setJustCreatedVariant(null); // Reset just created variant
    setVariantModalOpen(true);
  };

  const openEditVariantModal = (v: ProductVariant) => {
    if (!isEditMode) return;
    setVariantEditing(v);
    variantForm.setFieldsValue({
      variant_attributes: v.variant_attributes || {}, // Dùng object trực tiếp
      price_adjustment: v.price_adjustment || 0,
      stock_quantity: v.stock_quantity || 0,
      sku: v.sku || null,
      is_active: v.is_active !== false,
    });
    // Load variant images
    if (v.image_urls && v.image_urls.length > 0) {
      setVariantImageItems(v.image_urls.map(url => ({ type: 'url' as const, url })));
    } else {
      setVariantImageItems([]);
    }
    setVariantModalOpen(true);
  };

  const saveVariant = async (values: any) => {
    if (!id) return;
    try {
      setVariantSaving(true);
      
      // Xử lý variant images
      const variantImageFiles = variantImageItems
        .filter(item => item.type === 'file' && item.file)
        .map(item => item.file!);
      
      const variantImageUrls = variantImageItems
        .filter(item => item.type === 'url' && item.url?.trim())
        .map(item => item.url!);

      // Upload variant image files
      let uploadedVariantImageUrls: string[] = [];
      if (variantImageFiles.length > 0) {
        uploadedVariantImageUrls = await uploadMultipleFiles(variantImageFiles);
      }

      const allVariantImageUrls = [...variantImageUrls, ...uploadedVariantImageUrls];

      // variant_attributes đã là object từ form, không cần parse
      const payload = {
        variant_attributes: values.variant_attributes || {},
        price_adjustment: values.price_adjustment ?? 0,
        stock_quantity: values.stock_quantity ?? 0,
        sku: values.sku || null,
        image_urls: allVariantImageUrls.length > 0 ? allVariantImageUrls : undefined,
        is_active: values.is_active !== false,
      };
      
      if (variantEditing) {
        await variantService.updateVariant(variantEditing.id, payload);
        message.success('Cập nhật biến thể thành công');
        setVariantModalOpen(false);
        setVariantEditing(null);
        variantForm.resetFields();
        setVariantImageItems([]);
      } else {
        await variantService.createVariant(Number(id), payload);
        message.success('Tạo biến thể thành công');
        
        // Fetch lại danh sách để lấy variant vừa tạo
        await fetchVariants();
        
        // Giữ modal mở và load lại dữ liệu để có thể duplicate
        // Load lại dữ liệu từ variant vừa tạo vào form (nhưng để trống variant_attributes)
        variantForm.setFieldsValue({
          variant_attributes: {}, // Để trống để user chọn lại
          price_adjustment: values.price_adjustment ?? 0,
          stock_quantity: values.stock_quantity ?? 0,
          sku: values.sku || null,
          is_active: values.is_active !== false,
        });
        // Giữ lại hình ảnh nếu có
        if (allVariantImageUrls.length > 0) {
          setVariantImageItems(allVariantImageUrls.map(url => ({ type: 'url' as const, url })));
        } else {
          setVariantImageItems([]);
        }
        setVariantEditing(null);
        
        // Đánh dấu là vừa tạo để hiển thị nút duplicate
        setJustCreatedVariant({
          id: 0, // Tạm thời
          variant_attributes: values.variant_attributes || {},
          price_adjustment: values.price_adjustment ?? 0,
          stock_quantity: values.stock_quantity ?? 0,
          image_urls: allVariantImageUrls.length > 0 ? allVariantImageUrls : undefined,
        } as ProductVariant);
        // Modal vẫn mở, không đóng
      }
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
    setVariantDraftImageItems([]); // Reset variant draft images
    setVariantDraftModalOpen(true);
  };

  const openEditVariantDraftModal = (index: number) => {
    if (isEditMode) return;
    setVariantDraftEditingIndex(index);
    const v = variantDrafts[index];
    variantDraftForm.setFieldsValue({
      variant_attributes: JSON.stringify(v.variant_attributes || {}, null, 2), // Format JSON để dễ đọc
      price_adjustment: v.price_adjustment || 0,
      stock_quantity: v.stock_quantity || 0,
      sku: v.sku || null,
      is_active: v.is_active !== false,
    });
    // Load variant draft images
    if (v.image_urls && v.image_urls.length > 0) {
      setVariantDraftImageItems(v.image_urls.map(url => ({ type: 'url' as const, url })));
    } else {
      setVariantDraftImageItems([]);
    }
    setVariantDraftModalOpen(true);
  };

  const saveVariantDraft = (values: any) => {
    // Parse variant_attributes nếu là string
    let variantAttributes = values.variant_attributes;
    if (typeof variantAttributes === 'string') {
      try {
        variantAttributes = JSON.parse(variantAttributes);
      } catch {
        message.error('JSON không hợp lệ');
        return;
      }
    }
    
    // Lấy URLs từ variant draft images
    const variantDraftImageUrls = variantDraftImageItems
      .filter(item => item.type === 'url' && item.url?.trim())
      .map(item => item.url!);
    
    // Lưu file references để upload sau khi tạo product
    const variantDraftImageFiles = variantDraftImageItems
      .filter(item => item.type === 'file' && item.file)
      .map(item => item.file!);

    const normalized: VariantDraft = {
      variant_attributes: variantAttributes || {},
      price_adjustment: values.price_adjustment ?? 0,
      stock_quantity: values.stock_quantity ?? 0,
      sku: values.sku || null,
      image_urls: variantDraftImageUrls.length > 0 ? variantDraftImageUrls : undefined,
      imageFiles: variantDraftImageFiles.length > 0 ? variantDraftImageFiles : undefined, // Lưu files để upload sau
      is_active: values.is_active !== false,
    };

    // Validate variant_attributes không rỗng
    if (!normalized.variant_attributes || Object.keys(normalized.variant_attributes).length === 0) {
      message.error('Phải có ít nhất một thuộc tính biến thể');
      return;
    }

    // chặn trùng (variant_attributes)
    const duplicateIndex = variantDrafts.findIndex(
      (v, idx) =>
        idx !== (variantDraftEditingIndex ?? -1) &&
        JSON.stringify(v.variant_attributes) === JSON.stringify(normalized.variant_attributes)
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
    setVariantDraftImageItems([]); // Reset variant draft images
  };

  const removeVariantDraft = (index: number) => {
    setVariantDrafts(variantDrafts.filter((_, i) => i !== index));
  };

  // Duplicate variant (edit mode) - tạo bản sao và mở form chỉnh sửa
  const duplicateVariant = (variant: ProductVariant) => {
    if (!isEditMode) return;
    // Tạo bản sao variant với dữ liệu từ variant gốc
    setVariantEditing(null);
    variantForm.setFieldsValue({
      variant_attributes: {}, // Để trống để user chọn lại
      price_adjustment: variant.price_adjustment || 0,
      stock_quantity: variant.stock_quantity || 0,
      sku: variant.sku || null,
      is_active: variant.is_active !== false,
    });
    // Load variant images
    if (variant.image_urls && variant.image_urls.length > 0) {
      setVariantImageItems(variant.image_urls.map(url => ({ type: 'url' as const, url })));
    } else {
      setVariantImageItems([]);
    }
    setJustCreatedVariant(null); // Reset khi duplicate
    setVariantModalOpen(true);
  };

  // Duplicate variant draft (create mode) - tạo bản sao và mở form chỉnh sửa
  const duplicateVariantDraft = (index: number) => {
    if (isEditMode) return;
    const v = variantDrafts[index];
    setVariantDraftEditingIndex(null);
    variantDraftForm.setFieldsValue({
      variant_attributes: JSON.stringify(v.variant_attributes || {}, null, 2), // Format JSON để dễ đọc
      price_adjustment: v.price_adjustment || 0,
      stock_quantity: v.stock_quantity || 0,
      sku: v.sku || null,
      is_active: v.is_active !== false,
    });
    // Load variant draft images
    if (v.image_urls && v.image_urls.length > 0) {
      setVariantDraftImageItems(v.image_urls.map(url => ({ type: 'url' as const, url })));
    } else {
      setVariantDraftImageItems([]);
    }
    setVariantDraftModalOpen(true);
  };

  const variantColumns = [
    {
      title: 'Thuộc tính',
      key: 'variant_attributes',
      render: (_: any, record: ProductVariant) => (
        <div>
          {record.variant_attributes && Object.entries(record.variant_attributes).map(([key, val]) => (
            <Tag key={key} color="blue" style={{ marginBottom: 4 }}>
              {key}: {val}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image_urls',
      key: 'image_urls',
      width: 120,
      render: (urls: string[] | null | undefined, record: ProductVariant) => {
        if (urls && urls.length > 0) {
          return (
            <Badge count={urls.length} offset={[-5, 5]}>
              <Image
                src={urls[0]}
                alt={Object.entries(record.variant_attributes || {})
                  .map(([key, val]) => `${key}: ${val}`)
                  .join(', ')}
                width={60}
                height={60}
                style={{ objectFit: 'cover', borderRadius: 4 }}
                preview={{
                  mask: urls.length > 1 ? `Xem tất cả (${urls.length})` : 'Xem',
                }}
              />
            </Badge>
          );
        }
        return (
          <Tag color="default" icon={<PictureOutlined />}>
            Chưa có ảnh
          </Tag>
        );
      },
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
      width: 240,
      render: (_: any, record: ProductVariant) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditVariantModal(record)}>
            Sửa
          </Button>
          <Button type="link" icon={<CopyOutlined />} onClick={() => duplicateVariant(record)}>
            Sao chép
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
      title: 'Thuộc tính',
      key: 'variant_attributes',
      render: (_: any, record: VariantDraft) => (
        <div>
          {record.variant_attributes && Object.entries(record.variant_attributes).map(([key, val]) => (
            <Tag key={key} color="blue" style={{ marginBottom: 4 }}>
              {key}: {val}
            </Tag>
          ))}
        </div>
      ),
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
      width: 240,
      render: (_: any, __: VariantDraft, index: number) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditVariantDraftModal(index)}>
            Sửa
          </Button>
          <Button type="link" icon={<CopyOutlined />} onClick={() => duplicateVariantDraft(index)}>
            Sao chép
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

          {/* Quản lý thuộc tính biến thể (chỉ hiện khi edit mode) */}
          {isEditMode && id && (
            <Card
              title="Quản lý thuộc tính biến thể"
              style={{ marginBottom: 16 }}
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Định nghĩa các thuộc tính (Size, Color...) và giá trị (M, L, XL...)
                </Text>
              }
            >
              <VariantAttributesManager
                productId={Number(id)}
                onAttributesChange={() => {
                  // Refresh variants khi attributes thay đổi
                  fetchVariants();
                }}
              />
            </Card>
          )}

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

          <Form.Item 
            label={
              <Space>
                <span>Hình ảnh sản phẩm</span>
                <Tag color="blue">Ảnh của sản phẩm chính</Tag>
              </Space>
            }
            extra={
              <Typography.Text type="secondary">
                <PictureOutlined /> Ảnh này sẽ hiển thị cho toàn bộ sản phẩm, không phụ thuộc vào biến thể. 
                Để thêm ảnh riêng cho từng biến thể, hãy chỉnh sửa biến thể đó.
              </Typography.Text>
            }
          >
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
                      
                      {/* Hiển thị images hiện có (từ server) */}
                      {imageItems.filter(item => item.type === 'url' && item.url).length > 0 && (
                        <div>
                          <Typography.Text strong>Hình ảnh hiện có:</Typography.Text>
                          <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                            {imageItems
                              .filter(item => item.type === 'url' && item.url)
                              .map((item, index) => {
                                const actualIndex = imageItems.findIndex(i => i === item);
                                return (
                                  <Col key={`url-${index}`} xs={12} sm={8} md={6}>
                                    <Card
                                      hoverable
                                      cover={
                                        <Image
                                          src={item.url!}
                                          alt={`Existing ${index + 1}`}
                                          style={{ height: 120, objectFit: 'cover' }}
                                          preview
                                        />
                                      }
                                      actions={[
                                        <Button
                                          key="delete"
                                          danger
                                          size="small"
                                          icon={<DeleteOutlined />}
                                          onClick={() => handleImageRemove(actualIndex)}
                                        >
                                          Xóa
                                        </Button>,
                                      ]}
                                    >
                                      <Card.Meta
                                        title="Ảnh hiện có"
                                        description="Đã lưu trên server"
                                      />
                                    </Card>
                                  </Col>
                                );
                              })}
                          </Row>
                        </div>
                      )}
                      
                      {/* Hiển thị files mới đã chọn (chưa upload) */}
                      {imageItems.filter(item => item.type === 'file').length > 0 && (
                        <div>
                          <Typography.Text strong>Hình ảnh mới đã chọn (sẽ upload khi submit):</Typography.Text>
                          <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                            {imageItems
                              .filter(item => item.type === 'file' && item.file)
                              .map((item, index) => {
                                const actualIndex = imageItems.findIndex(i => i === item);
                                const previewUrl = item.file ? URL.createObjectURL(item.file) : null;
                                return (
                                  <Col key={`file-${index}`} xs={12} sm={8} md={6}>
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
              setVariantImageItems([]);
              setJustCreatedVariant(null);
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
              <Form.Item
                label="Thuộc tính biến thể"
                name="variant_attributes"
                rules={[
                  { required: true, message: 'Vui lòng chọn thuộc tính biến thể' },
                  {
                    validator: (_, value) => {
                      if (!value || Object.keys(value).length === 0) {
                        return Promise.reject('Vui lòng chọn ít nhất một thuộc tính');
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                tooltip="Chọn các thuộc tính và giá trị từ danh sách đã định nghĩa"
              >
                {id ? (
                  <VariantAttributesForm
                    productId={Number(id)}
                    value={variantForm.getFieldValue('variant_attributes')}
                    onChange={(val) => variantForm.setFieldsValue({ variant_attributes: val })}
                    required
                  />
                ) : (
                  <Alert
                    message="Lưu ý"
                    description="Vui lòng lưu sản phẩm trước, sau đó quay lại để tạo biến thể với form chọn thuộc tính"
                    type="info"
                    showIcon
                  />
                )}
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="SKU (tùy chọn)" name="sku">
                    <Input placeholder="Ví dụ: AO-THUN-001-M-DO" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Ảnh biến thể (URL, tùy chọn)" name="image_url">
                    <Input placeholder="https://..." />
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
              
              <Form.Item label="Trạng thái" name="is_active">
                <Select>
                  <Option value={true}>Hoạt động</Option>
                  <Option value={false}>Vô hiệu hóa</Option>
                </Select>
              </Form.Item>

              <Form.Item 
                label={
                  <Space>
                    <span>Hình ảnh biến thể</span>
                    <Tag color="orange">Ảnh riêng của biến thể này</Tag>
                  </Space>
                }
                extra={
                  <Typography.Text type="secondary">
                    <PictureOutlined /> Ảnh này chỉ hiển thị khi khách hàng chọn biến thể này. 
                    Nếu không có ảnh, sẽ dùng ảnh của sản phẩm chính.
                  </Typography.Text>
                }
              >
                <Tabs
                  items={[
                    {
                      key: 'upload',
                      label: 'Tải lên file',
                      children: (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          <Dragger
                            customRequest={handleVariantImageUpload}
                            accept="image/*"
                            multiple
                            showUploadList={false}
                          >
                            <p className="ant-upload-drag-icon">
                              <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">Click hoặc kéo thả file vào đây</p>
                            <p className="ant-upload-hint">Hỗ trợ chọn nhiều file</p>
                          </Dragger>
                          
                          {/* Hiển thị images hiện có của variant (từ server) */}
                          {variantImageItems.filter(item => item.type === 'url' && item.url).length > 0 && (
                            <div>
                              <Typography.Text strong>Hình ảnh hiện có của biến thể:</Typography.Text>
                              <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                                {variantImageItems
                                  .filter(item => item.type === 'url' && item.url)
                                  .map((item, index) => {
                                    const actualIndex = variantImageItems.findIndex(i => i === item);
                                    return (
                                      <Col key={`variant-url-${index}`} xs={12} sm={8} md={6}>
                                        <Card
                                          hoverable
                                          cover={
                                            <Image
                                              src={item.url!}
                                              alt={`Variant Existing ${index + 1}`}
                                              style={{ height: 120, objectFit: 'cover' }}
                                              preview
                                            />
                                          }
                                          actions={[
                                            <Button
                                              key="delete"
                                              danger
                                              size="small"
                                              icon={<DeleteOutlined />}
                                              onClick={() => handleVariantImageRemove(actualIndex)}
                                            >
                                              Xóa
                                            </Button>,
                                          ]}
                                        >
                                          <Card.Meta
                                            title="Ảnh hiện có"
                                            description="Đã lưu trên server"
                                          />
                                        </Card>
                                      </Col>
                                    );
                                  })}
                              </Row>
                            </div>
                          )}
                          
                          {/* Hiển thị files mới đã chọn (chưa upload) */}
                          {variantImageItems.filter(item => item.type === 'file').length > 0 && (
                            <div>
                              <Typography.Text strong>Hình ảnh mới đã chọn (sẽ upload khi lưu):</Typography.Text>
                              <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                                {variantImageItems
                                  .filter(item => item.type === 'file' && item.file)
                                  .map((item, index) => {
                                    const actualIndex = variantImageItems.findIndex(i => i === item);
                                    const previewUrl = item.file ? URL.createObjectURL(item.file) : null;
                                    return (
                                      <Col key={`variant-file-${index}`} xs={12} sm={8} md={6}>
                                        <Card
                                          hoverable
                                          cover={
                                            previewUrl ? (
                                              <Image
                                                src={previewUrl}
                                                alt={`Variant ${index + 1}`}
                                                style={{ height: 100, objectFit: 'cover' }}
                                                preview={false}
                                              />
                                            ) : (
                                              <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                                handleVariantImageRemove(actualIndex);
                                              }}
                                            >
                                              Xóa
                                            </Button>,
                                          ]}
                                        >
                                          <Card.Meta
                                            title={item.file?.name || 'File'}
                                            description="Sẽ upload khi lưu"
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
                          {variantImageItems
                            .filter(item => item.type === 'url')
                            .map((item, index) => {
                              const actualIndex = variantImageItems.findIndex(i => i === item);
                              return (
                                <Space key={index} style={{ width: '100%' }} align="start">
                                  <div style={{ flex: 1 }}>
                                    <Input
                                      placeholder="Nhập URL hình ảnh"
                                      value={item.url}
                                      onChange={(e) => handleVariantImageUrlChange(actualIndex, e.target.value)}
                                    />
                                    {item.url && (
                                      <Image
                                        src={item.url}
                                        alt={`Preview ${index + 1}`}
                                        style={{ marginTop: 8, maxWidth: '100%', maxHeight: 150 }}
                                        preview
                                      />
                                    )}
                                  </div>
                                  <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleVariantImageRemove(actualIndex)}
                                  >
                                    Xóa
                                  </Button>
                                </Space>
                              );
                            })}
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={handleAddVariantImageUrl}
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
                  <Button type="primary" htmlType="submit" loading={variantSaving}>
                    {justCreatedVariant ? 'Tạo biến thể tương tự' : 'Lưu'}
                  </Button>
                  {justCreatedVariant && (
                    <Button
                      onClick={() => {
                        setVariantModalOpen(false);
                        setVariantEditing(null);
                        variantForm.resetFields();
                        setVariantImageItems([]);
                        setJustCreatedVariant(null);
                      }}
                    >
                      Đóng
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setVariantModalOpen(false);
                      setVariantEditing(null);
                      variantForm.resetFields();
                      setVariantImageItems([]);
                      setJustCreatedVariant(null);
                    }}
                  >
                    {justCreatedVariant ? 'Hủy' : 'Hủy'}
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
              <Form.Item
                label="Thuộc tính biến thể"
                name="variant_attributes"
                rules={[
                  { required: true, message: 'Vui lòng chọn thuộc tính biến thể' },
                  {
                    validator: (_, value) => {
                      if (!value || Object.keys(value).length === 0) {
                        return Promise.reject('Vui lòng chọn ít nhất một thuộc tính');
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                tooltip="Chọn các thuộc tính và giá trị từ danh sách đã định nghĩa"
              >
                <Alert
                  message="Lưu ý"
                  description="Vui lòng lưu sản phẩm trước, sau đó quay lại để tạo biến thể với form chọn thuộc tính. Hoặc nhập JSON tạm thời:"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <TextArea
                  rows={3}
                  placeholder='{"Size": "M", "Color": "Đỏ"}'
                  onBlur={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      variantDraftForm.setFieldsValue({ variant_attributes: parsed });
                    } catch {
                      // Ignore parse errors, validation will catch it
                    }
                  }}
                />
              </Form.Item>
              
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="SKU (tùy chọn)" name="sku">
                    <Input placeholder="Ví dụ: AO-THUN-001-M-DO" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Ảnh biến thể (URL, tùy chọn)" name="image_url">
                    <Input placeholder="https://..." />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="SKU (tùy chọn)" name="sku">
                    <Input placeholder="Ví dụ: AO-THUN-001-M-DO" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Ảnh biến thể (URL, tùy chọn)" name="image_url">
                    <Input placeholder="https://..." />
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
              
              <Form.Item label="Trạng thái" name="is_active">
                <Select>
                  <Option value={true}>Hoạt động</Option>
                  <Option value={false}>Vô hiệu hóa</Option>
                </Select>
              </Form.Item>

              <Form.Item 
                label={
                  <Space>
                    <span>Hình ảnh biến thể</span>
                    <Tag color="orange">Ảnh riêng của biến thể này</Tag>
                  </Space>
                }
                extra={
                  <Typography.Text type="secondary">
                    <PictureOutlined /> Ảnh này chỉ hiển thị khi khách hàng chọn biến thể này. 
                    Nếu không có ảnh, sẽ dùng ảnh của sản phẩm chính.
                  </Typography.Text>
                }
              >
                <Tabs
                  items={[
                    {
                      key: 'upload',
                      label: 'Tải lên file',
                      children: (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          <Dragger
                            customRequest={handleVariantDraftImageUpload}
                            accept="image/*"
                            multiple
                            showUploadList={false}
                          >
                            <p className="ant-upload-drag-icon">
                              <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">Click hoặc kéo thả file vào đây</p>
                            <p className="ant-upload-hint">Hỗ trợ chọn nhiều file</p>
                          </Dragger>
                          
                          {variantDraftImageItems.filter(item => item.type === 'file').length > 0 && (
                            <Row gutter={[8, 8]}>
                              {variantDraftImageItems
                                .filter(item => item.type === 'file' && item.file)
                                .map((item, index) => {
                                  const actualIndex = variantDraftImageItems.findIndex(i => i === item);
                                  const previewUrl = item.file ? URL.createObjectURL(item.file) : null;
                                  return (
                                    <Col key={index} xs={12} sm={8} md={6}>
                                      <Card
                                        hoverable
                                        cover={
                                          previewUrl ? (
                                            <Image
                                              src={previewUrl}
                                              alt={`Variant Draft ${index + 1}`}
                                              style={{ height: 100, objectFit: 'cover' }}
                                              preview={false}
                                            />
                                          ) : (
                                            <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                              handleVariantDraftImageRemove(actualIndex);
                                            }}
                                          >
                                            Xóa
                                          </Button>,
                                        ]}
                                      >
                                        <Card.Meta
                                          title={item.file?.name || 'File'}
                                          description="Sẽ upload khi tạo sản phẩm"
                                        />
                                      </Card>
                                    </Col>
                                  );
                                })}
                            </Row>
                          )}
                        </Space>
                      ),
                    },
                    {
                      key: 'url',
                      label: 'Nhập URL',
                      children: (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          {variantDraftImageItems
                            .filter(item => item.type === 'url')
                            .map((item, index) => {
                              const actualIndex = variantDraftImageItems.findIndex(i => i === item);
                              return (
                                <Space key={index} style={{ width: '100%' }} align="start">
                                  <div style={{ flex: 1 }}>
                                    <Input
                                      placeholder="Nhập URL hình ảnh"
                                      value={item.url}
                                      onChange={(e) => handleVariantDraftImageUrlChange(actualIndex, e.target.value)}
                                    />
                                    {item.url && (
                                      <Image
                                        src={item.url}
                                        alt={`Preview ${index + 1}`}
                                        style={{ marginTop: 8, maxWidth: '100%', maxHeight: 150 }}
                                        preview
                                      />
                                    )}
                                  </div>
                                  <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleVariantDraftImageRemove(actualIndex)}
                                  >
                                    Xóa
                                  </Button>
                                </Space>
                              );
                            })}
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={handleAddVariantDraftImageUrl}
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
                  <Button type="primary" htmlType="submit">
                    Lưu
                  </Button>
                  <Button
                    onClick={() => {
                      setVariantDraftModalOpen(false);
                      setVariantDraftEditingIndex(null);
                      variantDraftForm.resetFields();
                      setVariantDraftImageItems([]);
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

  // Page mode - hiển thị với AdminPageContent
  return (
    <AdminPageContent
      title={isEditMode ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm mới'}
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/products')}
        >
          Quay lại
        </Button>
      }
    >
      {formContent}
    </AdminPageContent>
  );
};

export default ProductForm;

