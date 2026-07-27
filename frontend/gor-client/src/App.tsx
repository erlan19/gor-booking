import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ClientLayoutRoutes from './pages/client/index';
import CashierLayoutRoutes from './pages/cashier/index';
import AdminLayoutRoutes from './pages/admin/index';
import LoadingSpinner from './components/shared/LoadingSpinner';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RoleRedirect() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'CASHIER') return <Navigate to="/cashier" replace />;
  return <Navigate to="/client" replace />;
}

export default function App() {
  const { loadUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) loadUser();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/client/*" element={<ProtectedRoute roles={['CLIENT']}><ClientLayoutRoutes /></ProtectedRoute>} />
      <Route path="/cashier/*" element={<ProtectedRoute roles={['CASHIER']}><CashierLayoutRoutes /></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute roles={['ADMIN']}><AdminLayoutRoutes /></ProtectedRoute>} />
    </Routes>
  );
}