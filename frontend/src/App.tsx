import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Appointments from './pages/Appointments';
import Financials from './pages/Financials';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import StaffManagement from './pages/StaffManagement';
import Services from './pages/Services';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const RoleRoute: React.FC<{ roles: Array<'admin' | 'manager' | 'doctor' | 'creceptionist'>; children: React.ReactNode }> = ({ roles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  return roles.includes(user.role) ? <>{children}</> : <Navigate to="/" />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route
                  path="/customers"
                  element={
                    <RoleRoute roles={['admin', 'manager', 'creceptionist']}>
                      <Customers />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/appointments"
                  element={
                    <RoleRoute roles={['admin', 'manager', 'doctor', 'creceptionist']}>
                      <Appointments />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/financials"
                  element={
                    <RoleRoute roles={['admin', 'manager', 'creceptionist']}>
                      <Financials />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <RoleRoute roles={['admin', 'manager']}>
                      <Reports />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/staff"
                  element={
                    <RoleRoute roles={['admin', 'manager']}>
                      <StaffManagement />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/services"
                  element={
                    <RoleRoute roles={['admin', 'manager', 'creceptionist']}>
                      <Services />
                    </RoleRoute>
                  }
                />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<div>Settings - Coming Soon</div>} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
