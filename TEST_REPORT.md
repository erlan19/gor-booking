# GOR Booking E2E Test Report

## Test Suite Status: **READY TO RUN**

### Test Files Created
| File | Purpose |
|------|---------|
| `e2e-tests/scenarios.spec.ts` | All 6 test scenarios with proper waits, screenshots, assertions |
| `e2e-tests/playwright.config.ts` | Playwright config with auto-start webServer (backend:4000, frontend:5173) |
| `e2e-tests/package.json` | Dependencies for E2E tests |
| `E2E_TEST_GUIDE.md` | Complete execution guide |
| `run-e2e.sh` | Bash script to run everything end-to-end |

### Test Scenarios (6 Total)

| # | Scenario | Key Steps | Screenshots |
|---|----------|-----------|-------------|
| 1 | **Smoke Test** | Navigate to `/`, check no console errors, verify redirect to `/login` | `01-smoke-homepage.png` |
| 2 | **Client Booking** | Login client → `/client/courts` → pick court → pick slot → book → verify PENDING → payment page | `02a-dashboard.png`, `02b-courts.png`, `02c-schedule.png`, `02d-pending.png`, `02e-payment.png` |
| 3 | **Cashier Walk-in** | Login cashier → `/cashier` (POS) → pick slot → fill name/phone → cash payment → verify PAID | `03a-dashboard.png`, `03b-pos.png`, `03c-form.png`, `03d-paid.png` |
| 4 | **Race Condition** | 2 browser contexts → same client login → same court → same slot → simultaneous book → one 201, one 409 | `04a-clientA.png`, `04b-clientB.png`, `04c-resultA.png`, `04d-resultB.png` |
| 5 | **Cancel Booking** | Login client → `/client/bookings` → cancel PENDING/PAID → confirm → verify CANCELLED → slot available | `05a-bookings.png`, `05b-cancelled.png`, `05c-available.png` |
| 6 | **Realtime Sync** | Tab A: cashier `/cashier` → Tab B: client book slot → wait 2s → Tab A auto-updates | `06a-cashier-before.png`, `06b-client-booked.png`, `06c-cashier-after.png` |

### Critical Issues to Fix Before Running

| Issue | Impact | Fix |
|-------|--------|-----|
| **Port mismatch** | Tests target 5173/4000; user said 3000/5000 | Use actual ports or update config |
| **Password mismatch** | Seed: `password123`; LoginPage shows `client123`/`cashier123` | Use `password123` in tests (already coded) |
| **Missing UI** | Client courts = static cards (no schedule grid); Cashier POS = placeholder | Need actual schedule/booking UI components |
| **Midtrans test mode** | Payment flow needs test credentials | Use sandbox keys or mock webhook |
| **Socket.io** | Real-time at `/ws` - may need connection handling | Tests wait 2s for events |

### Required Setup Commands (Run First)

```bash
# 1. Start backend (port 4000)
cd backend/gor-api
npm run db:push      # Create DB schema
npm run db:seed      # Seed users/courts
npm run dev          # Start API

# 2. Start frontend (port 5173) - new terminal
cd frontend/gor-client
npm run dev          # Starts Vite dev server with proxy to :4000

# 3. Run E2E tests - new terminal
cd e2e-tests
npm install
npx playwright install
npm run test:headed  # Or: npx playwright test --headed
```

### Expected Results

| Scenario | Expected Status | Notes |
|----------|-----------------|-------|
| 1. Smoke Test | **PASS** | Simple redirect check |
| 2. Client Booking | **PARTIAL/FAIL** | Missing schedule UI in courts page |
| 3. Cashier Walk-in | **PARTIAL/FAIL** | Missing POS grid UI |
| 4. Race Condition | **PASS** | Backend has proper unique constraint + transaction |
| 5. Cancel Booking | **PARTIAL** | Depends on booking UI existing |
| 6. Realtime Sync | **PARTIAL/FAIL** | Socket.io connection may not auto-connect in UI |

### Known Backend Bugs (Will Cause Test Failures)

1. **Booking totalPrice logic** - Uses `court.pricePerHour` regardless of duration (should multiply by hours)
2. **Race condition** - Protected by unique index `[courtId, bookingDate, startTime]` + transaction check
3. **Walk-in cash** - Immediately sets `status: PAID` ✓ (correct per spec)
4. **Payment webhook** - Needs MIDTRANS_SERVER_KEY for signature verification

### Screenshot Directory Structure
```
e2e-tests/
├── screenshots/
│   ├── 01-smoke-homepage.png
│   ├── 02a-dashboard.png
│   ├── 02b-courts.png
│   ├── 02c-schedule.png
│   ├── 02d-pending.png
│   ├── 02e-payment.png
│   ├── 03a-dashboard.png
│   ├── 03b-pos.png
│   ├── 03c-form.png
│   ├── 03d-paid.png
│   ├── 04a-clientA.png
│   ├── 04b-clientB.png
│   ├── 04c-resultA.png
│   ├── 04d-resultB.png
│   ├── 05a-bookings.png
│   ├── 05b-cancelled.png
│   ├── 05c-available.png
│   ├── 06a-cashier-before.png
│   ├── 06b-client-booked.png
│   └── 06c-cashier-after.png
└── playwright-report/
    └── index.html
```

---

## Next Steps

1. **Fix Frontend UI** - Implement schedule grid in `/client/courts` and POS grid in `/cashier`
2. **Start Apps** - Run backend + frontend as shown above
3. **Run Tests** - `cd e2e-tests && npm run test:headed`
4. **Review Report** - Open `playwright-report/index.html` for full results