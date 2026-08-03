# GOR Booking — Full Stack App

Sistem booking lapangan GOR (Futsal/Badminton/Basket/Voli). Design system: Achromatic Athleticism (dark, sharp corner, Inter).

## Stack
- Backend: Node.js + Express + TypeScript, JWT auth, JSON-file DB (`backend/src/data/db.json`) — no external DB server needed.
- Frontend: React + Vite + TypeScript + Tailwind v4.

## Struktur
```
backend/   API (port 4000)
frontend/  Web app (port 5173, dev), proxy /api -> :4000
```

## Setup

### 1. Backend
```
cd backend
npm install
npm run seed   # isi data awal: 3 akun + 6 lapangan
npm run dev    # http://localhost:4000
```

### 2. Frontend (terminal baru)
```
cd frontend
npm install
npm run dev    # http://localhost:5173
```

Buka http://localhost:5173

## Akun Demo (dari seed)
| Role    | Email          | Password |
|---------|----------------|----------|
| Admin   | admin@gor.id   | admin123 |
| Kasir   | kasir@gor.id   | kasir123 |
| Client  | budi@mail.com  | client123 |

## Fitur
- **Client**: browse lapangan, cek slot kosong per jam, booking, bayar (simulasi QRIS/transfer/kartu/cash), lihat riwayat.
- **Kasir**: POS walk-in booking, langsung lunas, riwayat transaksi hari ini.
- **Admin**: dashboard stats (revenue, booking, occupancy), kelola status booking, CRUD lapangan.

## Catatan
- Payment gateway = simulasi (endpoint `/api/payments/:bookingId/simulate`), sukses ~92%, tidak ada transaksi nyata.
- DB = file JSON, reset dengan hapus `backend/src/data/db.json` lalu `npm run seed` lagi.
- Build production: `npm run build` di masing-masing folder.

## API Endpoints (ringkas)
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/courts
POST   /api/courts          (admin)
PUT    /api/courts/:id      (admin)
DELETE /api/courts/:id      (admin)

GET    /api/bookings/availability?courtId=&date=
GET    /api/bookings/mine
GET    /api/bookings        (admin/cashier)
POST   /api/bookings
POST   /api/bookings/cashier (cashier/admin)
PATCH  /api/bookings/:id/status (admin/cashier)

POST   /api/payments/:bookingId/simulate
GET    /api/payments        (admin/cashier)

GET    /api/admin/stats
GET    /api/admin/users     (admin)
```

## Production Deployment

### Environment Variables Required:

**Backend (.env file required):**
- `JWT_SECRET=your-64-char-secret-key`
- `DATABASE_URL=postgresql://...` (if using PostgreSQL)

**Frontend (.env file optional):**
- `VITE_API_URL=http://localhost:4000` (or your backend URL)

### Backend (`.env.example`)
```
# Authentication
JWT_SECRET=change-this-to-a-secure-64-character-secret-key

# Database (PostgreSQL optional)
DATABASE_URL=postgresql://postgres:password@localhost:5432/gor

# Payment Gateway (Simulation)
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=your-server-key (for Midtrans simulation)

# Server
PORT=4000
```

### Frontend (`.env.example`)
```
# Backend API URL
VITE_API_URL=http://localhost:4000
```

### Commands

**Local Development:**
```bash
# Backend
docker compose -f docker-compose.yml up -d
# OR
npm run dev (inside backend/)

# Frontend
docker compose -f docker-compose.yml up -d frontend
# OR
npm run dev (inside frontend/)
```

**Production Build:**
```bash
# Backend build
docker build -t gor-backend .

# Frontend build
docker build -t gor-frontend ./frontend

# Deploy with Docker Compose
Docker compose -f docker-compose.yml up -d --build
```

**Production Testing:**
```bash
# Test backend health
curl http://localhost:4000/api/health

# Test auth endpoints
curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@gor.id","password":"admin123"}'

# Test frontend
http://localhost:80 (if using Nginx reverse proxy)
```
