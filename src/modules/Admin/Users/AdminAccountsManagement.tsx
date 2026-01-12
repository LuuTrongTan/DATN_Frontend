import React from 'react';
import { Tabs, Button } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import UserManagement from './UserManagement';
import StaffManagement from '../Staff/StaffManagement';
import AdminPageContent from '../../../shares/components/layouts/AdminPageContent';

const AdminAccountsManagement: React.FC = () => {
  const tabItems = [
    {
      key: 'customers',
      label: (
        <span>
          <UserOutlined /> Khách hàng
        </span>
      ),
      children: <UserManagement showTitle={false} withCard={false} />,
    },
    {
      key: 'staff',
      label: (
        <span>
          <TeamOutlined /> Nhân viên
        </span>
      ),
      children: <StaffManagement showTitle={false} withCard={false} />,
    },
  ];

  return (
    <AdminPageContent
      className="admin-accounts-page"
      title={
        <>
          <UserOutlined /> Quản lý người dùng
        </>
      }
      extra={null}
    >
      <Tabs
        defaultActiveKey="customers"
        type="card"
        tabBarGutter={32}
        className="admin-accounts-tabs"
        items={tabItems}
      />
    </AdminPageContent>
  );
};

export default AdminAccountsManagement;


