import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, Home, Calendar, User, Building } from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
  role: 'CLIENT' | 'CASHIER' | 'ADMIN';
}

export default function Layout({ children, role }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = {
    CLIENT: [
      { path: '/client', label: 'Beranda', icon: Home },
      { path: '/client/courts', label: 'Lapangan', icon: Building },
      { path: '/client/bookings', label: 'Riwayat', icon: Calendar },
    ],
    CASHIER: [
      { path: '/cashier', label: 'POS', icon: Calendar },
      { path: '/cashier/bookings', label: 'Booking', icon: Calendar },
    ],
    ADMIN: [
      { path: '/admin', label: 'Dashboard', icon: Home },
      { path: '/admin/courts', label: 'Lapangan', icon: Building },
      { path: '/admin/users', label: 'Users', icon: User },
      { path: '/admin/bookings', label: 'Bookings', icon: Calendar },
    ],
  };

  const items = navItems[role] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-bold text-lg text-blue-600">GOR</Link>
            <nav className="hidden md:flex items-center gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                      active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40 flex items-center justify-around py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs',
                active ? 'text-blue-600 font-medium' : 'text-gray-500'
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">{children}</main>
    </div>
  );
}