import React from 'react';
import { Input as AntInput, InputProps as AntInputProps } from 'antd';

interface CustomInputProps extends AntInputProps {
  label?: string;
  error?: string;
}

const Input: React.FC<CustomInputProps> = ({
  label,
  error,
  status,
  ...props
}) => {
  return (
    <div className="input-wrapper">
      {label && <label>{label}</label>}
      <AntInput 
        status={error ? 'error' : status} 
        {...props} 
      />
      {error && <span className="error-message" style={{ color: '#ff4d4f', fontSize: '14px', marginTop: '4px' }}>{error}</span>}
    </div>
  );
};

export default Input;

