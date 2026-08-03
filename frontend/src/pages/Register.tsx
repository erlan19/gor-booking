import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";
import { ApiError } from "../lib/api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">Daftar</p>
        <h1 className="text-3xl font-bold mb-8">Buat akun baru</h1>

        <form onSubmit={onSubmit} className="space-y-5">
          <Input
            id="name"
            label="Nama Lengkap"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Nama kamu"
          />
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="nama@email.com"
          />
          <Input
            id="phone"
            label="No. HP"
            required
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="0812xxxxxxxx"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="Minimal 6 karakter"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button type="submit" full disabled={loading}>
            {loading ? "Memproses..." : "Daftar"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-on-surface-variant">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
