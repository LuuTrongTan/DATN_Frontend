import React from 'react';
import { Tabs, Button } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import UserManagement from './UserManagement';
import StaffManagement from '../Staff/StaffManagement';
import AdminPageContent from '../../../shares/components/layouts/AdminPageContent';

const { TabPane } = Tabs;

const AdminAccountsManagement: React.FC = () => {
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
      >
        <TabPane
          tab={
            <span>
              <UserOutlined /> Khách hàng
            </span>
          }
          key="customers"
        >
          <UserManagement showTitle={false} withCard={false} />
        </TabPane>
        <TabPane
          tab={
            <span>
              <TeamOutlined /> Nhân viên
            </span>
          }
          key="staff"
        >
          <StaffManagement showTitle={false} withCard={false} />
        </TabPane>
      </Tabs>
    </AdminPageContent>
  );
};

export default AdminAccountsManagement;


