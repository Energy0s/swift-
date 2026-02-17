import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import PageTransition from './components/ui/PageTransition';
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
import MessagesRouteHandler from './pages/MessagesRouteHandler';
import MessagesListPage from './pages/MessagesListPage';
import Mt101ListPage from './pages/Mt101ListPage';
import Mt101DetailPage from './pages/Mt101DetailPage';
import Mt101FormPage from './pages/Mt101FormPage';
import Mt103ListPage from './pages/Mt103ListPage';
import Mt103DetailPage from './pages/Mt103DetailPage';
import Mt103FormPage from './pages/Mt103FormPage';
import Mt109ListPage from './pages/Mt109ListPage';
import Mt109DetailPage from './pages/Mt109DetailPage';
import Mt109FormPage from './pages/Mt109FormPage';
import MtFreeListPage from './pages/MtFreeListPage';
import MtFreeDetailPage from './pages/MtFreeDetailPage';
import MtFreeFormPage from './pages/MtFreeFormPage';
import InboxListPage from './pages/InboxListPage';
import InboxDetailPage from './pages/InboxDetailPage';
import IngestIncomingPage from './pages/IngestIncomingPage';
import SwiftReceiptPage from './pages/SwiftReceiptPage';
import SwiftSearchPage from './pages/SwiftSearchPage';
import SwiftOutboxPage from './pages/SwiftOutboxPage';
import SwiftRunbookPage from './pages/SwiftRunbookPage';
import SwiftAuditPage from './pages/SwiftAuditPage';
import SwiftSupportPage from './pages/SwiftSupportPage';
import { SwiftThemeProvider } from './contexts/SwiftThemeContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <SwiftThemeProvider>
        <AuthProvider>
          <ToastProvider>
          <Routes>
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
            <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
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
              path="/inbox"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <InboxListPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/inbox/ingest"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <IngestIncomingPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/inbox/:id"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <InboxDetailPage />
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
              path="/messages/:mtCode/new"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <MessageFormPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/messages/:mtCode"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <MessagesRouteHandler />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mt101"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Mt101ListPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mt101/new"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Mt101FormPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mt101/:id"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Mt101DetailPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mt101/:id/edit"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Mt101FormPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mt103"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Mt103ListPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mt103/new"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Mt103FormPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mt103/:id"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Mt103DetailPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mt103/:id/edit"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Mt103FormPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mt109"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Mt109ListPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mt109/new"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Mt109FormPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mt109/:id/edit"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Mt109FormPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/mt109/:id"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Mt109DetailPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/free"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <MtFreeListPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/free/new"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <MtFreeFormPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/free/:id/edit"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <MtFreeFormPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/free/:id"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <MtFreeDetailPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/swift/receipts/:mtType/:id"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <SwiftReceiptPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/swift/search"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <SwiftSearchPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/swift/outbox"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <SwiftOutboxPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/swift/runbook"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <SwiftRunbookPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/swift/audit"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <SwiftAuditPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/swift/support"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <SwiftSupportPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route path="/" element={<PageTransition><LoginPage /></PageTransition>} />
          </Routes>
          </ToastProvider>
        </AuthProvider>
        </SwiftThemeProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
