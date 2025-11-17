// Shared components exports
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Modal } from './Modal';
export { default as Loading } from './Loading';

// Re-export commonly used Ant Design components
export { 
  Form, 
  Select, 
  DatePicker, 
  Table, 
  Card, 
  Row, 
  Col, 
  Space, 
  Divider,
  Typography,
  Layout,
  Menu,
  Breadcrumb,
  Avatar,
  Badge,
  Tag,
  Tooltip,
  Popconfirm,
  Dropdown,
  Tabs,
  Pagination,
  Upload,
  Image,
  Empty,
  Result,
  Alert,
  message,
  notification
} from 'antd';

export type { 
  FormProps,
  SelectProps,
  TableProps,
  CardProps,
  DatePickerProps,
  UploadProps
} from 'antd';

// Re-export Ant Design icons
export * from '@ant-design/icons';

