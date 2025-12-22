import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string; // UUID từ database
  email?: string;
  phone?: string;
  full_name?: string;
  role: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Thêm loading state để biết khi nào đã load xong từ localStorage
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Bắt đầu với loading = true

  useEffect(() => {
    // Load user/token from localStorage on mount
    const loadAuthData = () => {
    const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');

    const storedUser = localStorage.getItem('user');
      let parsedUser: User | null = null;
      
    if (storedUser) {
      try {
          parsedUser = JSON.parse(storedUser);
      } catch {
        // Dữ liệu hỏng -> dọn dẹp để tránh app rơi vào trạng thái auth sai
        localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          parsedUser = null;
        }
      }

      // Verify token is valid by checking if we have both token and user
      if (storedToken && parsedUser) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        setUser(parsedUser);
      } else {
        // Clear invalid state
        if (storedToken && !parsedUser) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
        setToken(null);
        setRefreshToken(null);
        setUser(null);
      }
      
      // Đánh dấu đã load xong
      setIsLoading(false);
    };

    loadAuthData();

    // Listen for storage changes (when token is cleared by 401 handler)
    const handleStorageChange = () => {
      loadAuthData();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (token: string, userData: User, refreshTokenValue?: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
    
    if (refreshTokenValue) {
      localStorage.setItem('refreshToken', refreshTokenValue);
      setRefreshToken(refreshTokenValue);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

