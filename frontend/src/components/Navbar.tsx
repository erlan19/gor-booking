import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const dashboardPath =
    user?.role === "admin" ? "/admin" : user?.role === "cashier" ? "/cashier" : "/dashboard";

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="border-b border-outline-variant bg-surface sticky top-0 z-30"
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 h-[72px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200">
          <span className="material-symbols-outlined text-primary text-2xl">sports_volleyball</span>
          <span className="font-bold tracking-tight text-lg">GOR BOOKING</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-on-surface-variant">
          <Link to="/" className="hover:text-primary transition-colors duration-200">Beranda</Link>
          <Link to="/courts" className="hover:text-primary transition-colors duration-200">Lapangan</Link>
          {user && <Link to={dashboardPath} className="hover:text-primary transition-colors duration-200">Dashboard</Link>}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:block text-xs text-on-surface-variant">
                {user.name} · <span className="uppercase text-primary">{user.role}</span>
              </span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-semibold border border-outline-variant hover:border-danger hover:text-danger transition-all duration-200"
              >
                Keluar
              </motion.button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-xs font-semibold text-on-surface hover:text-primary transition-all duration-200">
                Masuk
              </Link>
              <Link to="/register" className="px-4 py-2 text-xs font-semibold bg-primary text-on-primary hover:bg-secondary transition-all duration-200">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
