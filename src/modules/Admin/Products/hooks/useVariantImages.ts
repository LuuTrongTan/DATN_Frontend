import { useState } from 'react';
import { message } from 'antd';
import type { UploadProps } from 'antd';
import { uploadMultipleFiles } from '../../../../shares/services/uploadService';

export interface ImageItem {
  type: 'url' | 'file';
  url?: string;
  file?: File;
  uploading?: boolean;
}

export const useVariantImages = (initialImages: string[] = []) => {
  const [imageItems, setImageItems] = useState<ImageItem[]>(
    initialImages.map(url => ({ type: 'url' as const, url }))
  );

  const handleImageUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
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
    const item = imageItems[index];
    // Revoke object URL nếu có
    if (item.type === 'file' && item.file) {
      const url = URL.createObjectURL(item.file);
      URL.revokeObjectURL(url);
    }
    setImageItems(imageItems.filter((_, i) => i !== index));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newItems = [...imageItems];
    newItems[index] = { type: 'url', url: value };
    setImageItems(newItems);
  };

  const handleAddImageUrl = () => {
    setImageItems([...imageItems, { type: 'url', url: '' }]);
  };

  const getImageFiles = (): File[] => {
    return imageItems
      .filter(item => item.type === 'file' && item.file)
      .map(item => item.file!);
  };

  const getImageUrls = (): string[] => {
    return imageItems
      .filter(item => item.type === 'url' && item.url?.trim())
      .map(item => item.url!);
  };

  const processImages = async (): Promise<string[]> => {
    const imageFiles = getImageFiles();
    const imageUrls = getImageUrls();

    let uploadedImageUrls: string[] = [];
    if (imageFiles.length > 0) {
      uploadedImageUrls = await uploadMultipleFiles(imageFiles);
    }

    return [...imageUrls, ...uploadedImageUrls];
  };

  const reset = (newImages: string[] = []) => {
    setImageItems(newImages.map(url => ({ type: 'url' as const, url })));
  };

  return {
    imageItems,
    setImageItems,
    handleImageUpload,
    handleImageRemove,
    handleImageUrlChange,
    handleAddImageUrl,
    getImageFiles,
    getImageUrls,
    processImages,
    reset,
  };
};
