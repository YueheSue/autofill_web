import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import KidsFormPage from './KidsFormPage';
import CWIKidsForm from './CWIKidsForm';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const AppWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUserInfo(user);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserInfo(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                <Navigate to="/form/kids" /> : 
                <App onLogin={handleLogin} />
            }
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? 
                <Navigate to="/form/kids" /> : 
                <Navigate to="/" />
            } 
          />
          <Route 
            path="/form/kids" 
            element={<KidsFormPage userInfo={userInfo} onLogout={handleLogout} />} 
          />
          <Route 
            path="/form/cwikids" 
            element={<CWIKidsForm userInfo={userInfo} onLogout={handleLogout} />} 
          />
          <Route path="*" element={<Navigate to="/" />} />
          
          {/* Direct access shortcut routes */}
          <Route path="/kids" element={<KidsFormPage userInfo={userInfo} onLogout={handleLogout} />} />
          <Route path="/cwikids" element={<CWIKidsForm userInfo={userInfo} onLogout={handleLogout} />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AppWrapper />
); 