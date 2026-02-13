import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import TransferPage from './pages/TransferPage';
import TransactionsPage from './pages/TransactionsPage';
import ProfilePage from './pages/ProfilePage';
import TransactionDetailPage from './pages/TransactionDetailPage';
import AccountDetailPage from './pages/AccountDetailPage';
import MessageFormPage from './pages/MessageFormPage';
import MessageViewPage from './pages/MessageViewPage';
import MessagesListPage from './pages/MessagesListPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <DashboardPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/transfer"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <TransferPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <TransactionsPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/transactions/:id"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <TransactionDetailPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/accounts/:id"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <AccountDetailPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <ProfilePage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <MessagesListPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/messages/view/:id"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <MessageViewPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/messages/:mtCode"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <MessageFormPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route path="/" element={<LoginPage />} />
          </Routes>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
