import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

interface AdminPageContentProps {
  title: React.ReactNode;
  /**
   * Phần actions / nút ở góc phải header (ví dụ: nút "Làm mới", "Thêm mới"...)
   */
  extra?: React.ReactNode;
  /**
   * Nội dung chính của trang
   */
  children: React.ReactNode;
  /**
   * Thêm className cho thẻ div ngoài cùng (ví dụ: 'admin-accounts-page')
   */
  className?: string;
}

const AdminPageContent: React.FC<AdminPageContentProps> = ({
  title,
  extra,
  children,
  className,
}) => {
  const contentClassName = ['admin-page-content', className].filter(Boolean).join(' ');

  return (
    <div className={contentClassName}>
      <div className="admin-page-header">
        <Title level={2} style={{ margin: 0 }}>
          {title}
        </Title>
        {extra}
      </div>

      <div className="admin-page-content-body">
        {children}
      </div>
    </div>
  );
};

export default AdminPageContent;


