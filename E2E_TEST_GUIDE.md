# GOR Booking E2E Test Suite - Execution Guide

## Prerequisites
- PostgreSQL running on localhost:5432 with database `gor`
- Backend: `cd backend/gor-api && npm run dev` (port 4000)
- Frontend: `cd frontend/gor-client && npm run dev` (port 5173)

## Test Credentials (from seed.ts)
```
Admin:    admin@gor.com    / password123
Cashier:  cashier@gor.com  / password123
Client:   client@gor.com   / password123
```

## Run Tests
```bash
cd e2e-tests
npm install
npx playwright install
npm run test:headed
```

## Test Scenarios (6 total)

### 1. SMOKE TEST
- Navigate to http://localhost:5173
- Screenshot: `01-smoke-homepage.png`
- Assert: Page loads, redirects to login, no console errors

### 2. CLIENT BOOKING FLOW
- Login as client@gor.com / password123
- Navigate to /client/courts → pick court → pick available slot
- Click "Book" → confirm modal
- Assert: Booking created with status PENDING
- Screenshot: `02a-dashboard.png`, `02b-courts.png`, `02c-schedule.png`, `02d-pending.png`
- If redirected to payment page: screenshot `02e-payment.png`

### 3. CASHIER WALK-IN FLOW
- Login as cashier@gor.com / password123
- Navigate to /cashier (POS view)
- Click available slot → fill customer name/phone → select Cash payment
- Submit → Assert: status immediately PAID
- Screenshot: `03a-dashboard.png`, `03b-pos.png`, `03c-form.png`, `03d-paid.png`
- Verify slot shows booked in grid

### 4. RACE CONDITION TEST
- Open 2 browser contexts (Client A, Client B) - same credentials
- Both navigate to same court schedule
- Both click same available slot almost simultaneously
- Both confirm booking
- Assert: One gets 201 (success), other gets 409 (conflict/slot taken)
- Screenshot: `04a-clientA.png`, `04b-clientB.png`, `04c-resultA.png`, `04d-resultB.png`

### 5. CANCEL BOOKING FLOW
- Login as client → /client/bookings
- Find PENDING/PAID booking → click Cancel → confirm
- Assert: Status = CANCELLED
- Navigate to schedule → Assert: slot back to AVAILABLE
- Screenshot: `05a-bookings.png`, `05b-cancelled.png`, `05c-available.png`

### 6. REALTIME SYNC TEST
- Tab A: Cashier on /cashier (schedule grid)
- Tab B: Client books a slot on /client/courts → schedule → confirm
- Wait 2s → Assert: Tab A grid updates automatically (slot shows BOOKED)
- Screenshot: `06a-cashier-before.png`, `06b-client-booked.png`, `06c-cashier-after.png`

## Expected Bugs to Watch For
1. **Password mismatch**: seed.ts uses `password123` but LoginPage shows `client123`/`cashier123`
2. **Port mismatch**: User said 3000/5000 but config uses 5173/4000
3. **Missing schedule UI**: Client CourtsPage shows static cards, no real schedule grid
4. **Missing cashier POS grid**: Cashier Dashboard shows placeholder, no real grid
5. **Socket.io connection**: Realtime updates may fail if WebSocket not connecting
6. **Midtrans not in test mode**: Payment webhooks won't work without test credentials

## Test Files Created
- `e2e-tests/scenarios.spec.ts` - Main test scenarios
- `e2e-tests/playwright.config.ts` - Playwright config with webServer
- `e2e-tests/package.json` - Dependencies
- `e2e-tests/screenshots/` - Screenshot outputs

## Report Format (after run)
| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Smoke Test | PASS/FAIL | |
| 2. Client Booking | PASS/FAIL | |
| 3. Cashier Walk-in | PASS/FAIL | |
| 4. Race Condition | PASS/FAIL | |
| 5. Cancel Booking | PASS/FAIL | |
| 6. Realtime Sync | PASS/FAIL | |

## Bug Report Template
```
BUG: [Scenario name] - [Brief title]
Steps to reproduce:
1. ...
2. ...
Expected: ...
Actual: ...
Screenshot: e2e-tests/screenshots/[name].png
Error: [console error or network response]
```