import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ClientLayoutRoutes from './pages/client/index';
import CashierLayoutRoutes from './pages/cashier/index';
import AdminLayoutRoutes from './pages/admin/index';

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

function AnimatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const { loadUser, isAuthenticated } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) loadUser();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedRoute><RoleRedirect /></AnimatedRoute>} />
        <Route path="/login" element={<AnimatedRoute><LoginPage /></AnimatedRoute>} />
        <Route path="/register" element={<AnimatedRoute><RegisterPage /></AnimatedRoute>} />
        <Route path="/client/*" element={<AnimatedRoute><ProtectedRoute roles={['CLIENT']}><ClientLayoutRoutes /></ProtectedRoute></AnimatedRoute>} />
        <Route path="/cashier/*" element={<AnimatedRoute><ProtectedRoute roles={['CASHIER']}><CashierLayoutRoutes /></ProtectedRoute></AnimatedRoute>} />
        <Route path="/admin/*" element={<AnimatedRoute><ProtectedRoute roles={['ADMIN']}><AdminLayoutRoutes /></ProtectedRoute></AnimatedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}