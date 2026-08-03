import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "data", "db.json");

export type Role = "client" | "cashier" | "admin";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed";
export type PaymentMethod = "cash" | "transfer" | "qris" | "card";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone?: string;
  createdAt: string;
}

export interface Court {
  id: string;
  name: string;
  type: string; // Futsal, Badminton, Basket, Voli
  pricePerHour: number;
  location: string;
  description: string;
  active: boolean;
}

export interface Booking {
  id: string;
  courtId: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  totalPrice: number;
  status: BookingStatus;
  source: "online" | "cashier";
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  simulatedRef: string;
  paidAt?: string;
  createdAt: string;
}

interface DBShape {
  users: User[];
  courts: Court[];
  bookings: Booking[];
  payments: Payment[];
}

function loadDB(): DBShape {
  if (!fs.existsSync(DB_FILE)) {
    const empty: DBShape = { users: [], courts: [], bookings: [], payments: [] };
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

let db = loadDB();

function persist() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export const store = {
  get users() { return db.users; },
  get courts() { return db.courts; },
  get bookings() { return db.bookings; },
  get payments() { return db.payments; },
  save: persist,
  reload: () => { db = loadDB(); },
};
