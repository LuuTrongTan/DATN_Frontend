import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../../shares/contexts/AuthContext';
import { LoginRequiredModal } from '../../shares/components';

type RouteGuardProps = {
  children: React.ReactNode;
};

export const ProtectedRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // Đợi cho đến khi load xong từ localStorage
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Hiển thị modal thay vì redirect ngay
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isAuthenticated, isLoading]);

  if (!isAuthenticated) {
    return (
      <>
        <LoginRequiredModal 
          isOpen={showModal} 
          onClose={() => {
            setShowModal(false);
            // Quay về trang home khi đóng modal
            navigate('/home');
          }} 
        />
        {/* Vẫn render children nhưng sẽ bị modal che phủ */}
        <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
          {children}
        </div>
      </>
    );
  }

  return <>{children}</>;
};

export const RoleProtectedRoute: React.FC<
  RouteGuardProps & { allowedRoles: string[] }
> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // Đợi cho đến khi load xong từ localStorage
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Hiển thị modal nếu chưa đăng nhập
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isAuthenticated, isLoading]);

  if (!isAuthenticated) {
    return (
      <>
        <LoginRequiredModal 
          isOpen={showModal} 
          onClose={() => {
            setShowModal(false);
            navigate('/home');
          }} 
        />
        <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
          {children}
        </div>
      </>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Đợi cho đến khi load xong từ localStorage
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect based on role
    if (user?.role === 'admin' || user?.role === 'staff') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};


