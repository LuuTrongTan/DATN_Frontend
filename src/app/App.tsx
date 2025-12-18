import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from '../shares/contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { store } from './store';
import ErrorBoundary from '../shares/components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ConfigProvider locale={viVN}>
          <AuthProvider>
            <Router>
              <AppRoutes />
            </Router>
          </AuthProvider>
        </ConfigProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;


