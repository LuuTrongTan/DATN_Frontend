# Frontend - Hệ Thống Cửa Hàng Trực Tuyến

Frontend được xây dựng bằng React + TypeScript + Vite + Ant Design.

## Cấu trúc dự án

```
Frontend/
├── public/              # Static files
├── src/
│   ├── modules/         # Các module chức năng
│   │   ├── Auth/       # Xác thực (Đăng ký, Đăng nhập, Quên mật khẩu)
│   │   ├── Dashboard/  # Trang chủ
│   │   ├── Profile/    # Quản lý tài khoản, đơn hàng
│   │   ├── Admin/      # Quản trị (Quản lý staff/user)
│   │   ├── ProductManagement/  # Quản lý sản phẩm, giỏ hàng
│   │   │   ├── components/    # Components riêng của module
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── services/      # API services
│   │   │   ├── types/         # TypeScript types
│   │   │   └── utils/         # Utilities
│   │   ├── OrderManagement/   # Quản lý đơn hàng
│   │   └── Report/            # Thống kê và báo cáo
│   ├── shares/         # Tài nguyên dùng chung
│   │   ├── api/        # API client configuration
│   │   ├── components/ # Shared components (Button, Input, Modal, etc.)
│   │   ├── contexts/   # React contexts (AuthContext, etc.)
│   │   ├── hooks/      # Shared custom hooks
│   │   ├── services/   # Shared services
│   │   ├── stores/     # State management (nếu cần)
│   │   ├── styles/     # Global styles
│   │   ├── types/      # Shared TypeScript types
│   │   └── utils/      # Shared utilities
│   ├── vite-env.d.ts   # Vite type definitions
│   └── App.tsx         # Main App component
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

## Cài đặt

```bash
cd Frontend
npm install
```

## Chạy dự án

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

## Build

```bash
npm run build
```

## Các module chính

### Auth Module
- Đăng ký (UC-01)
- Xác thực (UC-03)
- Đăng nhập (UC-05)
- Quên mật khẩu (UC-04)
- Đổi mật khẩu (UC-06)

### ProductManagement Module
- Tìm kiếm và lọc sản phẩm (UC-07)
- Thêm sản phẩm vào giỏ hàng (UC-08)
- Quản lý giỏ hàng (UC-09, UC-10, UC-11)
- Quản lý sản phẩm cho Staff/Admin (UC-15, UC-16, UC-17)
- Quản lý danh mục (UC-18, UC-19, UC-20)

### OrderManagement Module
- Đặt hàng (UC-12)
- Theo dõi đơn hàng (UC-13)
- Xử lý đơn hàng (UC-21)

### Profile Module
- Quản lý thông tin cá nhân
- Lịch sử đơn hàng
- Đánh giá sản phẩm (UC-14)

### Admin Module
- Quản lý staff/user (UC-22, UC-23)
- Thống kê và báo cáo (UC-24)

## Công nghệ sử dụng

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool và dev server
- **React Router**: Routing
- **Ant Design 5**: UI component library (CSS framework)
- **Ant Design Icons**: Icon library
- **Day.js**: Date manipulation library

## Import và sử dụng

Dự án sử dụng đường dẫn tương đối (relative paths) để import:

### Ví dụ import từ modules:

```typescript
// Từ file trong cùng module
import Login from './Auth/Login';
import { Dashboard } from './Dashboard';

// Từ module khác (từ modules/Auth)
import { Dashboard } from '../Dashboard/Dashboard';

// Import từ shares (từ modules)
import { Button } from '../../shares/components';
import { useAuth } from '../../shares/contexts';
import { apiClient } from '../../shares/api';
```

### Ví dụ import từ shares:

```typescript
// Từ file trong shares
import { Button } from './components';
import { useAuth } from './contexts';
import { apiClient } from './api';
```

### Import Ant Design:

```typescript
// Import trực tiếp từ antd
import { Table, Card, Form, Button, Input } from 'antd';
import { UserOutlined, ShoppingCartOutlined } from '@ant-design/icons';

// Hoặc import từ shares/components (đã được re-export)
import { Button, Input, Table, Card, Form } from '../shares/components';
import { UserOutlined } from '../shares/components';
```

## Sử dụng Ant Design

Dự án sử dụng Ant Design làm UI component library chính. Tất cả các component Ant Design có thể import trực tiếp từ `antd`:

```typescript
import { Button, Input, Modal, Table, Form, Card } from 'antd';
import { ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';

// Hoặc import từ shares/components (đã được re-export)
import { Button, Input, Modal } from '../shares/components';
```

### Cấu hình Ant Design

App đã được cấu hình với:
- **Locale**: Tiếng Việt (`vi_VN`)
- **ConfigProvider**: Được wrap ở root level trong `App.tsx`

### Components đã được tích hợp

- **Button**: Custom wrapper với variant support
- **Input**: Custom wrapper với label và error handling
- **Modal**: Custom wrapper với `isOpen` prop
- **Loading**: Custom wrapper sử dụng Spin component
- Tất cả các component khác của Ant Design có thể import trực tiếp từ `antd` hoặc từ `../shares/components` (đã được re-export)

## Biến môi trường

Tạo file `.env` từ `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

# DATN_Frontend
