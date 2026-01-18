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
  Spin,
  Table,
  Modal,
  Popconfirm,
  Tag,
  Badge,
  Alert,
  Divider,
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
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { productService } from '../../../shares/services/productService';
import { variantService } from '../../../shares/services/variantService';
import { tagService } from '../../../shares/services/tagService';
import { Category, ProductVariant, ProductTag } from '../../../shares/types';
import VariantAttributesForm from './VariantAttributesForm';
import VariantValueSelector from './VariantValueSelector';
import { useVariantImages } from './hooks/useVariantImages';
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
  const [variantDraftEditingIndex, setVariantDraftEditingIndex] = useState<number | null>(null); // null = create new, number = edit draft at index
  const [variantSaving, setVariantSaving] = useState(false);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([]);
  const [variantForm] = Form.useForm();
  const [justCreatedVariant, setJustCreatedVariant] = useState<ProductVariant | null>(null); // Lưu variant vừa tạo để duplicate
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagSearchValue, setTagSearchValue] = useState<string>('');
  const [tagSelectOpen, setTagSelectOpen] = useState<boolean>(false);
  
  // Sử dụng hook để quản lý variant images (dùng chung cho cả edit và create mode)
  const variantImages = useVariantImages();
  
  const isEditMode = Boolean(id && !onSuccess); // Nếu có onSuccess thì là modal mode (tạo mới)
  
  // Lấy category_id từ form để dùng cho VariantAttributesForm (create mode)
  const categoryId = Form.useWatch('category_id', form);
  // Lấy giá gốc từ form để tính price_adjustment cho variants
  const basePrice = Form.useWatch('price', form) || 0;

  // Chỉ gọi fetchCategories một lần khi component mount, và chỉ khi categories chưa có trong store
  // Sử dụng useEffectOnce để đảm bảo chỉ chạy một lần, ngay cả trong StrictMode
  useEffectOnce(() => {
    // Chỉ gọi nếu categories chưa có và không đang loading
    // Nếu categories đã có rồi (từ lần trước hoặc component khác), không cần gọi lại
    if (categories.length === 0 && !categoriesLoading) {
      dispatch(fetchCategories());
    }
    // Fetch tags
    fetchTags();
  });

  const fetchTags = async () => {
    try {
      setTagsLoading(true);
      const response = await tagService.getAllTags();
      if (response.success && response.data) {
        setTags(response.data || []);
      }
    } catch (error: any) {
      // Tags are optional, silently fail
    } finally {
      setTagsLoading(false);
    }
  };

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
          tag_ids: product.tags?.map(tag => tag.id) || [],
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

  // Helper function để validate và filter tag_ids - chỉ giữ lại số nguyên hợp lệ
  const validateAndFilterTagIds = (tagIds: any[]): number[] => {
    if (!Array.isArray(tagIds)) return [];
    return tagIds
      .map(id => {
        // Chuyển đổi sang số nếu là string
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        // Kiểm tra là số nguyên hợp lệ và dương
        return typeof numId === 'number' && !isNaN(numId) && numId > 0 ? numId : null;
      })
      .filter((id): id is number => id !== null);
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const stockToUse = hasVariants ? variantStockTotal : values.stock_quantity;
      
      // Validate và filter tag_ids trước khi gửi
      const validTagIds = validateAndFilterTagIds(values.tag_ids || []);
      
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
      
      // Gửi lên Backend - Backend sẽ upload file qua server (local storage), sau đó lưu vào database
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
          tag_ids: validTagIds,
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
          tag_ids: validTagIds,
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
            content: 'Đang tạo thuộc tính và biến thể...',
            key: 'create-variants',
          });

          // Bước 1: Tự động tạo định nghĩa thuộc tính từ variantDrafts
          const attributeMap = new Map<string, { displayName: string; values: Set<string> }>();
          
          // Thu thập tất cả thuộc tính và giá trị từ variantDrafts
          for (const v of variantDrafts) {
            if (v.variant_attributes) {
              for (const [attrName, attrValue] of Object.entries(v.variant_attributes)) {
                if (!attributeMap.has(attrName)) {
                  attributeMap.set(attrName, {
                    displayName: attrName.charAt(0).toUpperCase() + attrName.slice(1), // Capitalize first letter
                    values: new Set(),
                  });
                }
                attributeMap.get(attrName)!.values.add(attrValue);
              }
            }
          }

          // Bước 2: Tạo variants
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
            content: `Đã tạo ${attributeMap.size} thuộc tính và ${variantDrafts.length} biến thể thành công`,
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

  // Handle media file upload (cả video và image) - Chỉ lưu file vào state, chưa upload
  const handleMediaUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      const fileObj = file as File;
      const fileType = fileObj.type;
      
      // Kiểm tra xem là video hay image
      if (fileType.startsWith('video/')) {
        // Nếu là video, chỉ cho phép 1 video
        if (videoFile || videoUrl) {
          message.warning('Chỉ có thể upload 1 video. Vui lòng xóa video hiện tại trước.');
          if (onError) {
            onError(new Error('Chỉ có thể upload 1 video'));
          }
          return;
        }
        setVideoFile(fileObj);
      } else if (fileType.startsWith('image/')) {
        // Nếu là image, thêm vào danh sách images
        const newItem: ImageItem = { type: 'file', file: fileObj };
      setImageItems([...imageItems, newItem]);
      } else {
        message.error('File không hợp lệ. Chỉ chấp nhận video hoặc hình ảnh.');
        if (onError) {
          onError(new Error('File không hợp lệ'));
        }
        return;
      }
      
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
  
  // Giữ lại handleImageUpload để tương thích với code cũ (nếu có)
  const handleImageUpload: UploadProps['customRequest'] = handleMediaUpload;

  const handleImageRemove = (index: number) => {
    setImageItems(imageItems.filter((_, i) => i !== index));
  };

  // Handlers cho variant images - sử dụng hook (dùng chung cho cả edit và create mode)
  // Đã được xử lý bởi variantImages hook

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

  const setVariantFormValues = (attributes: Record<string, string>) => {
    // Hàm này được gọi khi variant_attributes thay đổi để trigger re-render
  };

  const openCreateVariantModal = () => {
    setVariantEditing(null);
    setVariantDraftEditingIndex(null);
    variantForm.resetFields();
    variantForm.setFieldsValue({ variant_value_configs: {} });
    variantImages.reset(); // Reset variant images
    setJustCreatedVariant(null); // Reset just created variant
    setVariantModalOpen(true);
  };

  const openEditVariantModal = (v: ProductVariant) => {
    if (!isEditMode) return;
    setVariantEditing(v);
    setVariantDraftEditingIndex(null);
    variantForm.setFieldsValue({
      variant_attributes: v.variant_attributes || {}, // Dùng object trực tiếp
      price_adjustment: v.price_adjustment || 0,
      stock_quantity: v.stock_quantity || 0,
      sku: v.sku || null,
      is_active: v.is_active !== false,
    });
    // Load variant images
    variantImages.reset(v.image_urls || []);
    setVariantModalOpen(true);
  };

  const openEditVariantDraftModal = (index: number) => {
    if (isEditMode) return;
    setVariantDraftEditingIndex(index);
    setVariantEditing(null);
    const v = variantDrafts[index];
    variantForm.setFieldsValue({
      variant_attributes: v.variant_attributes || {},
      price_adjustment: v.price_adjustment || 0,
      stock_quantity: v.stock_quantity || 0,
      sku: v.sku || null,
      is_active: v.is_active !== false,
    });
    // Load variant draft images
    variantImages.reset(v.image_urls || []);
    setVariantModalOpen(true);
  };

  const saveVariant = async (values: any) => {
    try {
      setVariantSaving(true);

      // Validate variant_attributes
      if (!values.variant_attributes || Object.keys(values.variant_attributes).length === 0) {
        message.error('Vui lòng chọn ít nhất một thuộc tính biến thể');
        return;
      }

      // Lấy giá trị mới nhất từ form (bao gồm cả các thay đổi từ VariantCombinationEditor)
      // Đảm bảo lấy giá trị mới nhất trước khi xử lý
      const latestCombinations = variantForm.getFieldValue('_variant_combinations') || [];
      
      // Kiểm tra xem có _variant_combinations không (từ VariantCombinationEditor)
      const variantCombinations = latestCombinations.length > 0 ? latestCombinations : (values._variant_combinations || []);
      if (variantCombinations.length > 0) {
        // Xử lý tạo variants từ combinations với ảnh riêng cho từng tổ hợp
        message.loading({ content: `Đang xử lý ${variantCombinations.length} tổ hợp biến thể...`, key: 'create-combinations' });

        if (isEditMode && id) {
          // Edit mode: Tạo variants ngay
          try {
            const productId = Number(id);

            for (const combo of variantCombinations) {
              // Upload ảnh cho từng combination nếu có
              let imageUrls: string[] = combo.image_urls || [];
              
              if (combo.imageFiles && combo.imageFiles.length > 0) {
                const uploadedUrls = await uploadMultipleFiles(combo.imageFiles);
                imageUrls = [...imageUrls, ...uploadedUrls];
              }

              try {
                await variantService.createVariant(productId, {
                  variant_attributes: combo.combination,
                  price_adjustment: combo.price_adjustment || 0,
                  stock_quantity: combo.stock_quantity || 0,
                  image_urls: imageUrls.length > 0 ? imageUrls : undefined,
                  is_active: true,
                });
              } catch (error: any) {
                throw error;
              }
            }
            message.success({ content: `Đã tạo ${variantCombinations.length} biến thể thành công`, key: 'create-combinations' });
            await fetchVariants();
            setVariantModalOpen(false);
            variantForm.resetFields();
            variantForm.setFieldsValue({ _variant_combinations: [] });
            variantImages.reset();
          } catch (error: any) {
            message.error({ content: error.message || 'Có lỗi xảy ra khi tạo biến thể', key: 'create-combinations' });
            return;
          }
        } else {
          // Create mode: Lưu vào variantDrafts
          const newDrafts: VariantDraft[] = variantCombinations.map((combo: any) => ({
            variant_attributes: combo.combination,
            price_adjustment: combo.price_adjustment || 0,
            stock_quantity: combo.stock_quantity || 0,
            image_urls: combo.image_urls && combo.image_urls.length > 0 ? combo.image_urls : undefined,
            imageFiles: combo.imageFiles && combo.imageFiles.length > 0 ? combo.imageFiles : undefined,
            is_active: true,
          }));

          setVariantDrafts([...variantDrafts, ...newDrafts]);
          message.success(`Đã thêm ${variantCombinations.length} biến thể vào danh sách`);
          setVariantModalOpen(false);
          setVariantDraftEditingIndex(null);
          variantForm.resetFields();
          variantForm.setFieldsValue({ _variant_combinations: [] });
          variantImages.reset();
        }
        return;
      }

      // Kiểm tra xem có thuộc tính nào có nhiều giá trị không
      const variantValueConfigs = values.variant_value_configs || {};
      const hasMultiValueAttributes = Object.entries(values.variant_attributes).some(([_, val]) => {
        if (typeof val === 'string') {
          const vals = val.split(',').map(v => v.trim()).filter(v => v);
          return vals.length > 1;
        }
        return false;
      });

      // Nếu có nhiều giá trị và có config, tạo nhiều variants
      if (hasMultiValueAttributes && Object.keys(variantValueConfigs).length > 0) {
        const variantsToCreate: Array<{
          variant_attributes: Record<string, string>;
          price_adjustment: number;
          stock_quantity: number;
          sku?: string | null;
          image_urls?: string[];
          is_active: boolean;
        }> = [];

        // Tạo variants từ các giá trị đã chọn
        Object.entries(variantValueConfigs).forEach(([attrName, configs]: [string, any]) => {
          if (Array.isArray(configs)) {
            configs.forEach((config: any) => {
              if (config.selected) {
                const variantAttrs = { ...values.variant_attributes };
                variantAttrs[attrName] = config.value; // Chỉ lấy một giá trị
                variantsToCreate.push({
                  variant_attributes: variantAttrs,
                  price_adjustment: config.price_adjustment || 0,
                  stock_quantity: config.stock_quantity || 0,
                  sku: values.sku || null,
                  is_active: values.is_active !== false,
                });
              }
            });
          }
        });

        if (variantsToCreate.length === 0) {
          message.error('Vui lòng chọn ít nhất một giá trị');
          return;
        }

        // Nếu là edit mode và có product_id, tạo variants ngay
        if (isEditMode && id) {
          const productId = Number(id);

          const allVariantImageUrls = await variantImages.processImages();
          message.loading({ content: `Đang tạo ${variantsToCreate.length} biến thể...`, key: 'create-multi-variants' });
          
          try {
            for (const variant of variantsToCreate) {
              await variantService.createVariant(productId, {
                ...variant,
                image_urls: allVariantImageUrls.length > 0 ? allVariantImageUrls : undefined,
              });
            }
            message.success({ content: `Đã tạo ${variantsToCreate.length} biến thể thành công`, key: 'create-multi-variants' });
            await fetchVariants();
            setVariantModalOpen(false);
            variantForm.resetFields();
            variantForm.setFieldsValue({ variant_value_configs: {} });
            variantImages.reset();
          } catch (error: any) {
            message.error({ content: error.message || 'Có lỗi xảy ra khi tạo biến thể', key: 'create-multi-variants' });
            return;
          }
        } else {
          // Create mode: Lưu vào variantDrafts
          const variantImageUrls = variantImages.getImageUrls();
          const variantImageFiles = variantImages.getImageFiles();

          const newDrafts: VariantDraft[] = variantsToCreate.map((variant) => ({
            variant_attributes: variant.variant_attributes,
            price_adjustment: variant.price_adjustment,
            stock_quantity: variant.stock_quantity,
            sku: variant.sku || null,
            image_urls: variantImageUrls.length > 0 ? variantImageUrls : undefined,
            imageFiles: variantImageFiles.length > 0 ? variantImageFiles : undefined,
            is_active: variant.is_active,
          }));

          setVariantDrafts([...variantDrafts, ...newDrafts]);
          message.success(`Đã thêm ${variantsToCreate.length} biến thể vào danh sách`);
          setVariantModalOpen(false);
          setVariantDraftEditingIndex(null);
          variantForm.resetFields();
          variantForm.setFieldsValue({ variant_value_configs: {} });
          variantImages.reset();
        }
        return;
      }

      // Logic cũ cho trường hợp một variant đơn giản
      // Nếu là edit mode và có product_id, gọi API ngay
      if (isEditMode && id) {
        const productId = Number(id);
        
        // Xử lý variant images bằng hook
        const allVariantImageUrls = await variantImages.processImages();

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
          variantForm.setFieldsValue({ variant_value_configs: {} });
        variantImages.reset();
      } else {
        await variantService.createVariant(productId, payload);
        message.success('Tạo biến thể thành công');
        
        // Fetch lại danh sách để lấy variant vừa tạo
        await fetchVariants();
        
        // Giữ modal mở và load lại dữ liệu để có thể duplicate
        variantForm.setFieldsValue({
          variant_attributes: {}, // Để trống để user chọn lại
          price_adjustment: values.price_adjustment ?? 0,
          stock_quantity: values.stock_quantity ?? 0,
          sku: values.sku || null,
          is_active: values.is_active !== false,
            variant_value_configs: {},
        });
        variantImages.reset(allVariantImageUrls);
        setVariantEditing(null);
        
        setJustCreatedVariant({
            id: 0,
          variant_attributes: values.variant_attributes || {},
          price_adjustment: values.price_adjustment ?? 0,
          stock_quantity: values.stock_quantity ?? 0,
          image_urls: allVariantImageUrls.length > 0 ? allVariantImageUrls : undefined,
        } as ProductVariant);
        }
      } else {
        // Create mode: Lưu vào variantDrafts state
    const variantAttributes = values.variant_attributes || {};
    
        // Lấy URLs từ variant images
        const variantImageUrls = variantImages.getImageUrls();
    
    // Lưu file references để upload sau khi tạo product
        const variantImageFiles = variantImages.getImageFiles();

    const normalized: VariantDraft = {
      variant_attributes: variantAttributes,
      price_adjustment: values.price_adjustment ?? 0,
      stock_quantity: values.stock_quantity ?? 0,
      sku: values.sku || null,
          image_urls: variantImageUrls.length > 0 ? variantImageUrls : undefined,
          imageFiles: variantImageFiles.length > 0 ? variantImageFiles : undefined,
      is_active: values.is_active !== false,
    };

    // Chặn trùng (variant_attributes)
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
          message.success('Thêm biến thể draft thành công');
    } else {
      const next = [...variantDrafts];
      next[variantDraftEditingIndex] = normalized;
      setVariantDrafts(next);
          message.success('Cập nhật biến thể draft thành công');
    }
        
        setVariantModalOpen(false);
    setVariantDraftEditingIndex(null);
        variantForm.resetFields();
        variantForm.setFieldsValue({ variant_value_configs: {} });
        variantImages.reset();
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


  const removeVariantDraft = (index: number) => {
    setVariantDrafts(variantDrafts.filter((_, i) => i !== index));
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
            <Badge count={urls.length} offset={[0, 0]} className="cart-badge-no-animation">
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
      title: 'Giá',
      key: 'price',
      align: 'right' as const,
      render: (_: any, record: ProductVariant) => {
        const variantPrice = basePrice + (record.price_adjustment || 0);
        return `${variantPrice.toLocaleString('vi-VN')} VNĐ`;
      },
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
      title: 'Giá',
      key: 'price',
      align: 'right' as const,
      render: (_: any, record: VariantDraft) => {
        const variantPrice = basePrice + (record.price_adjustment || 0);
        return `${variantPrice.toLocaleString('vi-VN')} VNĐ`;
      },
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

          <Form.Item
            label="Tags"
            name="tag_ids"
            tooltip="Chọn hoặc tạo tags để phân loại sản phẩm"
          >
            <div>
              <Select
                mode="multiple"
                placeholder="Chọn tags hoặc nhập để tạo tag mới"
                loading={tagsLoading}
                showSearch
                open={tagSelectOpen}
                style={{ width: '100%', marginBottom: 8 }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={tags.map(tag => ({
                  label: tag.name,
                  value: Number(tag.id), // Đảm bảo value luôn là number
                }))}
                notFoundContent={tagsLoading ? <Spin size="small" /> : null}
                onChange={(values) => {
                  // Validate và filter values trước khi set vào form
                  const validValues = validateAndFilterTagIds(values);
                  form.setFieldsValue({ tag_ids: validValues });
                }}
                onSearch={(value) => {
                  setTagSearchValue(value);
                  // Tự động mở dropdown khi nhập text
                  if (value.trim() && !tagSelectOpen) {
                    setTagSelectOpen(true);
                  }
                }}
                onFocus={() => {
                  // Mở dropdown khi focus vào field
                  if (!tagSelectOpen) {
                    setTagSelectOpen(true);
                  }
                }}
                onDropdownVisibleChange={(open) => {
                  // Không đóng dropdown khi đang tạo tag
                  if (!tagsLoading) {
                    setTagSelectOpen(open);
                    // KHÔNG reset search value khi dropdown đóng
                    // Chỉ reset khi user thực sự muốn (sau khi tạo tag thành công hoặc cancel)
                    // Việc reset sẽ được xử lý trong onClick handler của button
                  }
                }}
              />
              {tagSearchValue.trim() && 
                !tags.some(t => t.name.toLowerCase() === tagSearchValue.trim().toLowerCase()) && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  loading={tagsLoading}
                  onClick={async (e) => {
                    // Prevent form submission và event bubbling
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.nativeEvent) {
                      e.nativeEvent.stopImmediatePropagation();
                    }
                    
                    const tagName = tagSearchValue.trim();
                    
                    if (!tagName) {
                      message.warning('Vui lòng nhập tên tag');
                      return;
                    }
                    
                    if (tags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
                      message.warning('Tag này đã tồn tại');
                      return;
                    }
                    
                    try {
                      setTagsLoading(true);
                      
                      const response = await tagService.createTag({ name: tagName });
                      
                      if (response.success && response.data) {
                        // Thêm tag mới vào danh sách
                        setTags([...tags, response.data]);
                        
                        // Thêm tag vào form - đảm bảo id là số nguyên
                        const currentTagIds = form.getFieldValue('tag_ids') || [];
                        const newTagId = typeof response.data.id === 'number' ? response.data.id : parseInt(response.data.id, 10);
                        if (!isNaN(newTagId) && newTagId > 0) {
                          form.setFieldsValue({ tag_ids: [...currentTagIds, newTagId] });
                        }
                        
                        // Reset search value
                        setTagSearchValue('');
                        
                        message.success(`Đã tạo tag "${tagName}" thành công`);
                        
                        // Đóng dropdown sau khi tạo thành công
                        setTimeout(() => {
                          setTagSelectOpen(false);
                        }, 300);
                      } else {
                        message.error(response.message || 'Không thể tạo tag');
                      }
                    } catch (error: any) {
                      const errorMessage = error.message || error.response?.data?.message || 'Lỗi khi tạo tag';
                      
                      // Log chi tiết lỗi để debug
                      if (error.statusCode === 401) {
                        message.error('Bạn cần đăng nhập để tạo tag');
                      } else if (error.statusCode === 403) {
                        message.error('Bạn không có quyền tạo tag (cần quyền staff hoặc admin)');
                      } else {
                        message.error(errorMessage);
                      }
                    } finally {
                      setTagsLoading(false);
                    }
                  }}
                  htmlType="button"
                  block
                  style={{ marginTop: 8 }}
                >
                  {tagsLoading ? 'Đang tạo...' : `Tạo tag "${tagSearchValue.trim()}"`}
                </Button>
              )}
            </div>
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
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateVariantModal}>
                  Thêm biến thể
                </Button>
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

          <Form.Item 
            label={
              <Space>
                <span>Media sản phẩm</span>
                <Tag color="blue">Video và hình ảnh</Tag>
              </Space>
            }
            extra={
              <Typography.Text type="secondary">
                <PictureOutlined /> Upload video (tùy chọn) và hình ảnh cho sản phẩm. 
                Ảnh sẽ hiển thị cho toàn bộ sản phẩm, không phụ thuộc vào biến thể. 
                Để thêm ảnh riêng cho từng biến thể, hãy chỉnh sửa biến thể đó.
              </Typography.Text>
            }
          >
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Dragger
                customRequest={handleMediaUpload}
                accept="image/*,video/*"
                        multiple
                        showUploadList={false}
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click hoặc kéo thả file vào đây để chọn</p>
                        <p className="ant-upload-hint">
                  Hỗ trợ chọn nhiều file (video và hình ảnh). File sẽ được upload khi bạn submit form.
                        </p>
                      </Dragger>
              
              {/* Hiển thị video hiện có hoặc đã chọn */}
              {(videoFile || videoUrl) && (
                <div>
                  <Typography.Text strong>Video sản phẩm:</Typography.Text>
                  <Card size="small" style={{ marginTop: 8 }}>
                    <Space>
                      <span>{videoFile ? videoFile.name : `Video từ server: ${videoUrl}`}</span>
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
                </div>
              )}
                      
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

          {/* Modal thêm/sửa biến thể (dùng chung cho cả edit và create mode) */}
          <Modal
            title={
              variantEditing 
                ? 'Sửa biến thể' 
                : variantDraftEditingIndex !== null 
                  ? 'Sửa biến thể' 
                  : 'Thêm biến thể'
            }
            open={variantModalOpen}
            width={900}
            onCancel={() => {
              setVariantModalOpen(false);
              setVariantEditing(null);
              setVariantDraftEditingIndex(null);
              variantForm.resetFields();
              variantImages.reset();
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
                tooltip={
                  id 
                    ? "Chọn các thuộc tính và giá trị từ danh sách đã định nghĩa"
                    : "Chọn các thuộc tính và giá trị từ danh sách đã định nghĩa trong danh mục"
                }
              >
                <VariantAttributesForm
                  value={variantForm.getFieldValue('variant_attributes')}
                  onChange={(val) => {
                    variantForm.setFieldsValue({ variant_attributes: val });
                    setVariantFormValues(val);
                  }}
                  required
                  basePrice={basePrice}
                  initialCombinations={variantEditing
                    ? [{
                        combination: variantEditing.variant_attributes || {},
                        price_adjustment: variantEditing.price_adjustment || 0,
                        stock_quantity: variantEditing.stock_quantity || 0,
                        image_urls: variantEditing.image_urls || [],
                      }]
                    : (variantDraftEditingIndex !== null && variantDrafts[variantDraftEditingIndex]
                        ? [{
                            combination: variantDrafts[variantDraftEditingIndex].variant_attributes || {},
                            price_adjustment: variantDrafts[variantDraftEditingIndex].price_adjustment || 0,
                            stock_quantity: variantDrafts[variantDraftEditingIndex].stock_quantity || 0,
                            image_urls: variantDrafts[variantDraftEditingIndex].image_urls || [],
                          }]
                        : [])}
                  onCombinationsChange={(combinations: Array<{
                    combination: Record<string, string>;
                    price: number;
                    price_adjustment: number;
                    stock_quantity: number;
                    image_urls: string[];
                    imageFiles?: File[];
                  }>) => {
                    // Lưu combinations để sử dụng khi tạo variants
                    variantForm.setFieldsValue({ _variant_combinations: combinations });
                  }}
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
                        setVariantDraftEditingIndex(null);
                        variantForm.resetFields();
                        variantImages.reset();
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
                      setVariantDraftEditingIndex(null);
                      variantForm.resetFields();
                      variantImages.reset();
                      setJustCreatedVariant(null);
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

