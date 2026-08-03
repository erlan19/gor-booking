import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";
import { ApiError } from "../lib/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "cashier") navigate("/cashier");
      else navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">Masuk</p>
        <h1 className="text-3xl font-bold mb-8">Selamat datang kembali</h1>

        <form onSubmit={onSubmit} className="space-y-5">
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button type="submit" full disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-on-surface-variant">
          Belum punya akun?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Daftar
          </Link>
        </p>

        <div className="mt-10 border border-outline-variant p-4 text-xs text-on-surface-variant space-y-1">
          <p className="font-semibold text-on-surface mb-2">Akun demo</p>
          <p>Admin: admin@gor.id / admin123</p>
          <p>Kasir: kasir@gor.id / kasir123</p>
          <p>Client: budi@mail.com / client123</p>
        </div>
      </div>
    </div>
  );
}
