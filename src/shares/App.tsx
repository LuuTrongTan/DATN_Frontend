import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={viVN}>
      <Router>
        <Routes>
          {/* Routes will be configured here */}
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;

