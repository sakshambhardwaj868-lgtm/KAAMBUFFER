import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, CashFlowProvider } from './context';
import { MobileContainer } from './components/layout';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth';
import {
  BalancePage,
  ObligationsPage,
  DashboardPage,
  SimulatePage,
  LoginPage,
  SignupPage,
  ResetPasswordPage,
  NotFoundPage,
} from './pages';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CashFlowProvider>
        <BrowserRouter>
          <MobileContainer>
            <Routes>
              {/* Public Auth Routes */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicOnlyRoute>
                    <SignupPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
              />

              {/* Protected Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Navigate to="/balance" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/balance"
                element={
                  <ProtectedRoute>
                    <BalancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/obligations"
                element={
                  <ProtectedRoute>
                    <ObligationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/simulate"
                element={
                  <ProtectedRoute>
                    <SimulatePage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </MobileContainer>
        </BrowserRouter>
      </CashFlowProvider>
    </AuthProvider>
  );
};

export default App;
