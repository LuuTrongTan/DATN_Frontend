import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

export interface BaseAppLayoutProps {
  /** React node cho sidebar bên trái (đã xử lý collapsed, onToggle ở ngoài) */
  sidebar: React.ReactNode;
  /** React node cho navbar phía trên (đã xử lý props riêng ở ngoài) */
  navbar: React.ReactNode;
  /** Phần tử tùy chọn hiển thị ngay dưới navbar (ví dụ spacer cho navbar fixed) */
  navbarSpacer?: React.ReactNode;
  /** Phần tử tùy chọn hiển thị giữa navbar + content (ví dụ nút mở sidebar cho user) */
  beforeContent?: React.ReactNode;
  /** Margin-left dạng phần trăm để tránh content bị sidebar che */
  marginLeftPercent: number;
  /** Style bổ sung cho khối Layout bên phải (phần chứa navbar + content) */
  rightLayoutStyle?: React.CSSProperties;
  /** Style bổ sung cho Content */
  contentStyle?: React.CSSProperties;
  /** Children tùy chọn, nếu không có sẽ dùng Outlet cho nested routes */
  children?: React.ReactNode;
}

const BaseAppLayout: React.FC<BaseAppLayoutProps> = ({
  sidebar,
  navbar,
  navbarSpacer,
  beforeContent,
  marginLeftPercent,
  rightLayoutStyle,
  contentStyle,
  children,
}) => {
  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>
      {sidebar}

      <Layout
        style={{
          marginLeft: `${marginLeftPercent}%`,
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
          width: `${100 - marginLeftPercent}%`,
          display: 'flex',
          flexDirection: 'column',
          ...(rightLayoutStyle || {}),
        }}
      >
        {navbar}
        {navbarSpacer}
        {beforeContent}

        <Content
          style={{
            margin: 0,
            padding: '2vh 1.5vw 2vh 0.5vw',
            minHeight: '35vh',
            background: 'transparent',
            overflow: 'auto',
            flex: 1,
            ...(contentStyle || {}),
          }}
        >
          {children ?? <Outlet />}
        </Content>
      </Layout>
    </Layout>
  );
};

export default BaseAppLayout;


