// In production, always hit the Railway backend directly.
// Vercel env VITE_API_URL is set to "/api/v1" (wrong — it's a relative stub URL).
// This override forces production to always use the real backend.
const BACKEND_URL = import.meta.env.VITE_API_URL;
const isLocal = () => typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(window.location.hostname);

const BASE = (() => {
  if (BACKEND_URL && !BACKEND_URL.startsWith("/")) return BACKEND_URL;   // absolute URL from env
  if (isLocal()) return "http://localhost:4000";                          // dev mode
  // production: always hit the real backend (env var is broken /api/v1)
  return "https://gor-booking-production.up.railway.app";
})();

export type Role = "client" | "cashier" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
}

export interface Court {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  location: string;
  description: string;
  active: boolean;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  courtId: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalPrice: number;
  status: BookingStatus;
  source: "online" | "cashier";
  createdAt: string;
}

export type PaymentMethod = "cash" | "transfer" | "qris" | "card";
export type PaymentStatus = "pending" | "paid" | "failed";

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  simulatedRef: string;
  paidAt?: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken() {
  return localStorage.getItem("gor_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(data?.error || `Request gagal (${res.status})`, res.status);
  }
  return data as T;
}

export const api = {
  register: (body: { name: string; email: string; password: string; phone: string }) =>
    request<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request<{ user: User }>("/auth/me"),

  courts: (params?: { type?: string }) => {
    const qs = params?.type ? `?type=${encodeURIComponent(params.type)}` : "";
    return request<{ courts: Court[] }>(`/courts${qs}`);
  },
  court: (id: string) => request<{ court: Court }>(`/courts/${id}`),
  createCourt: (body: Omit<Court, "id">) =>
    request<{ court: Court }>("/courts", { method: "POST", body: JSON.stringify(body) }),
  updateCourt: (id: string, body: Partial<Omit<Court, "id">>) =>
    request<{ court: Court }>(`/courts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCourt: (id: string) => request<void>(`/courts/${id}`, { method: "DELETE" }),

  availability: (courtId: string, date: string) =>
    request<{ booked: { startTime: string; endTime: string; status: string }[] }>(
      `/bookings/availability?courtId=${courtId}&date=${date}`
    ),
  myBookings: () => request<{ bookings: Booking[] }>("/bookings/mine"),
  allBookings: (params?: { status?: string; date?: string; courtId?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ bookings: Booking[] }>(`/bookings${qs ? `?${qs}` : ""}`);
  },
  createBooking: (body: {
    courtId: string;
    date: string;
    startTime: string;
    endTime: string;
    customerName: string;
    customerPhone: string;
  }) => request<{ booking: Booking }>("/bookings", { method: "POST", body: JSON.stringify(body) }),
  createCashierBooking: (body: {
    courtId: string;
    date: string;
    startTime: string;
    endTime: string;
    customerName: string;
    customerPhone: string;
    method: PaymentMethod;
  }) => request<{ booking: Booking }>("/bookings/cashier", { method: "POST", body: JSON.stringify(body) }),
  updateBookingStatus: (id: string, status: BookingStatus) =>
    request<{ booking: Booking }>(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  booking: (id: string) => request<{ booking: Booking }>(`/bookings/${id}`),

  simulatePayment: (bookingId: string, method: PaymentMethod) =>
    request<{ payment: Payment; booking: Booking }>(`/payments/${bookingId}/simulate`, {
      method: "POST",
      body: JSON.stringify({ method }),
    }),
  paymentForBooking: (bookingId: string) => request<{ payment: Payment }>(`/payments/booking/${bookingId}`),
  allPayments: () => request<{ payments: Payment[] }>("/payments"),

  adminStats: () =>
    request<{
      bookingsTodayCount: number;
      revenueToday: number;
      totalRevenue: number;
      activeCourts: number;
      totalCourts: number;
      pendingBookings: number;
      totalUsers: number;
      byCourt: { courtId: string; name: string; bookingsToday: number }[];
    }>("/admin/stats"),
};

export { ApiError, getToken };
