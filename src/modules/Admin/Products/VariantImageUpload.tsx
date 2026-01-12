import React, { useState, useEffect } from 'react';
import { Upload, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { UploadFile } from 'antd/es/upload/interface';

interface VariantImageUploadProps {
  value?: string[];
  onChange?: (urls: string[], files?: File[]) => void;
  maxCount?: number;
  disabled?: boolean;
}

const VariantImageUpload: React.FC<VariantImageUploadProps> = ({
  value = [],
  onChange,
  maxCount = 10,
  disabled = false,
}) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Map<number, string>>(new Map());

  // Tạo preview URLs cho các file mới khi imageFiles thay đổi
  useEffect(() => {
    const newPreviewUrls = new Map(previewUrls);
    imageFiles.forEach((file, index) => {
      if (!newPreviewUrls.has(index) && file) {
        const url = URL.createObjectURL(file);
        newPreviewUrls.set(index, url);
      }
    });
    if (newPreviewUrls.size !== previewUrls.size) {
      setPreviewUrls(newPreviewUrls);
    }
  }, [imageFiles]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chuyển đổi value (URLs) và imageFiles thành fileList cho Upload component
  const fileList: UploadFile[] = [
    ...value.map((url, index) => ({
      uid: `url-${index}`,
      name: `image-${index + 1}.jpg`,
      status: 'done' as const,
      url: url,
    })),
    ...imageFiles.map((file, index) => {
      const previewUrl = previewUrls.get(index) || '';
      return {
        uid: `file-${index}`,
        name: file.name,
        status: 'done' as const,
        originFileObj: file,
        url: previewUrl,
        thumbUrl: previewUrl,
      };
    }),
  ];

  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      const newFile = file as File;
      const newFiles = [...imageFiles, newFile];
      setImageFiles(newFiles);
      
      if (onChange) {
        onChange(value, newFiles);
      }
      
      if (onSuccess) {
        onSuccess(file);
      }
    } catch (error: any) {
      if (onError) {
        onError(error);
      }
      message.error(`Lỗi upload: ${error.message}`);
    }
  };

  const handleRemove = (file: UploadFile) => {
    if (file.uid?.startsWith('url-')) {
      // Xóa URL
      const index = parseInt(file.uid.replace('url-', ''));
      const newUrls = value.filter((_, i) => i !== index);
      if (onChange) {
        onChange(newUrls, imageFiles);
      }
    } else if (file.uid?.startsWith('file-')) {
      // Xóa file và revoke preview URL
      const index = parseInt(file.uid.replace('file-', ''));
      const previewUrl = previewUrls.get(index);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newFiles = imageFiles.filter((_, i) => i !== index);
      const newPreviewUrls = new Map(previewUrls);
      newPreviewUrls.delete(index);
      // Cập nhật lại index cho các file còn lại
      const updatedPreviewUrls = new Map<number, string>();
      newFiles.forEach((f, i) => {
        const oldIndex = imageFiles.findIndex(origFile => origFile === f);
        if (oldIndex !== -1 && previewUrls.has(oldIndex)) {
          updatedPreviewUrls.set(i, previewUrls.get(oldIndex)!);
        }
      });
      setImageFiles(newFiles);
      setPreviewUrls(updatedPreviewUrls);
      if (onChange) {
        onChange(value, newFiles);
      }
    }
  };

  const totalImages = value.length + imageFiles.length;
  const canAddMore = totalImages < maxCount;

  // Cleanup preview URLs khi component unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Upload
        customRequest={handleUpload}
        fileList={fileList}
        onRemove={handleRemove}
        accept="image/*"
        listType="picture-card"
        maxCount={maxCount}
        multiple
        disabled={disabled || !canAddMore}
        style={{ width: '100%' }}
      >
        {canAddMore && !disabled && (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
          </div>
        )}
      </Upload>
    </Space>
  );
};

export default VariantImageUpload;
