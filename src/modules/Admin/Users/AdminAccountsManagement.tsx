import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import UserManagement from './UserManagement';
import StaffManagement from '../Staff/StaffManagement';
import AdminPageContent from '../../../shares/components/layouts/AdminPageContent';

const AdminAccountsManagement: React.FC = () => {
  const [isStaffModalVisible, setIsStaffModalVisible] = useState(false);

  return (
    <AdminPageContent
      className="admin-accounts-page"
      title={
        <>
          <UserOutlined /> Quản lý người dùng
        </>
      }
      extra={
        <Button
          type="primary"
          icon={<TeamOutlined />}
          onClick={() => setIsStaffModalVisible(true)}
        >
          Thêm nhân viên
        </Button>
      }
    >
      {/* Chỉ hiển thị danh sách khách hàng */}
      <UserManagement showTitle={false} withCard={false} />

      {/* Modal quản lý / tạo nhân viên */}
      <Modal
        title="Quản lý nhân viên"
        open={isStaffModalVisible}
        onCancel={() => setIsStaffModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <StaffManagement showTitle={true} withCard={false} />
      </Modal>
    </AdminPageContent>
  );
};

export default AdminAccountsManagement;


