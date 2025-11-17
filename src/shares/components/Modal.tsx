import React from 'react';
import { Modal as AntModal, ModalProps as AntModalProps } from 'antd';

interface ModalProps extends Omit<AntModalProps, 'open'> {
  isOpen: boolean;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title,
  children,
  ...props 
}) => {
  return (
    <AntModal
      open={isOpen}
      onCancel={onClose}
      title={title}
      footer={props.footer !== undefined ? props.footer : null}
      {...props}
    >
      {children}
    </AntModal>
  );
};

export default Modal;

