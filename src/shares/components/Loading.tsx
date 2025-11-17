import React from 'react';
import { Spin, SpinProps } from 'antd';

interface LoadingProps extends SpinProps {
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  text = 'Đang tải...',
  size = 'large',
  ...props 
}) => {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <Spin size={size} {...props} />
      {text && <p style={{ marginTop: '16px' }}>{text}</p>}
    </div>
  );
};

export default Loading;

