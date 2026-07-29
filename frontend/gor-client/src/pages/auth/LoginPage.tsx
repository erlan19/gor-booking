import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-10 animate-fade-in">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-600 font-display font-bold text-2xl mb-6">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="font-display font-bold text-2xl">GOR</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">Masuk ke GOR</h1>
            <p className="text-gray-600">Silakan masuk untuk mengakses dashboard Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-slide-down" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-700 mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email Anda"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-dark-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-dark-700 mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-dark-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-3.5 text-lg" loading={loading}>
              Masuk
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-primary-50 rounded-xl text-center hover:bg-primary-100 transition-colors cursor-pointer">
                <div className="font-medium text-primary-700">Admin</div>
                <div className="text-primary-600">admin@gor.com</div>
                <div className="text-primary-500">admin123</div>
              </div>
              <div className="p-3 bg-secondary-50 rounded-xl text-center hover:bg-secondary-100 transition-colors cursor-pointer">
                <div className="font-medium text-secondary-700">Cashier</div>
                <div className="text-secondary-600">cashier@gor.com</div>
                <div className="text-secondary-500">cashier123</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-center hover:bg-emerald-100 transition-colors cursor-pointer">
                <div className="font-medium text-emerald-700">Client</div>
                <div className="text-emerald-600">client@gor.com</div>
                <div className="text-emerald-500">client123</div>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Belum punya akun?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}