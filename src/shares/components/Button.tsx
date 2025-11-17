import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';

type ButtonProps = AntButtonProps & {
  variant?: 'primary' | 'secondary' | 'danger';
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  type,
  danger,
  ...props
}) => {
  // Map variant to Ant Design button types
  const buttonType = variant === 'primary' ? 'primary' : variant === 'danger' ? 'primary' : 'default';
  const isDanger = variant === 'danger' || danger;

  return (
    <AntButton type={type || buttonType} danger={isDanger} {...props}>
      {children}
    </AntButton>
  );
};

export default Button;

