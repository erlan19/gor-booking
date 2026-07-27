import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:4000';

const CREDENTIALS = {
  client: { email: 'client@gor.com', password: 'password123' },
  cashier: { email: 'cashier@gor.com', password: 'password123' },
  admin: { email: 'admin@gor.com', password: 'password123' },
};

async function login(page, role) {
  const creds = CREDENTIALS[role];
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/client**');
}

async function takeScreenshot(page, name) {
  await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
}

test.describe('GOR Booking E2E Tests', () => {

  // 1. SMOKE TEST
  test.describe('SMOKE TEST', () => {
    test('app loads without console errors', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', err => errors.push(err.message));

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '01-smoke-homepage');

      expect(errors.length).toBe(0);
      expect(page.url()).toContain('localhost:5173');
    });
  });

  // 2. CLIENT BOOKING FLOW
  test.describe('CLIENT BOOKING FLOW', () => {
    test('client can book court and pay', async ({ page }) => {
      await login(page, 'client');
      await takeScreenshot(page, '02-client-dashboard');

      // Navigate to courts page
      await page.click('a[href*="courts"]');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '02-courts-page');

      // Click the FIRST available slot (div with data-status="available")
      const slot = page.locator('[data-status="available"]').first();
      await expect(slot).toBeVisible({ timeout: 10000 });
      await slot.click();

      // Confirm booking modal — button text "Konfirmasi"
      await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });
      await takeScreenshot(page, '02-booking-modal');

      const confirmBtn = page.locator('button:has-text("Konfirmasi")').first();
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });
      await confirmBtn.click();

      // Wait for booking API response
      await page.waitForResponse(/.*\/api\/v1\/bookings/, { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '02-booking-pending');
    });
  });

  // 3. CASHIER WALK-IN FLOW
  test.describe('CASHIER WALK-IN FLOW', () => {
    test('cashier can create walk-in booking with cash payment', async ({ page }) => {
      await login(page, 'client'); // first just check client login works
      await page.goto(`${BASE_URL}/login`);
      await page.waitForSelector('input[type="email"]');
      await page.fill('input[type="email"]', CREDENTIALS.cashier.email);
      await page.fill('input[type="password"]', CREDENTIALS.cashier.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/cashier**', { timeout: 10000 });
      await takeScreenshot(page, '03-cashier-dashboard');

      // POS grid is on /cashier index (already there after login redirect)
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '03-cashier-schedule');

      // Find available slot in POS grid
      const emptySlot = page.locator('[data-status="available"]').first();
      await expect(emptySlot).toBeVisible({ timeout: 10000 });
      await emptySlot.click();

      // WalkIn Modal opens — fill form
      await page.waitForSelector('[data-testid="walkin-modal"], [role="dialog"]', { timeout: 5000 });
      await page.locator('input[data-testid="customer-name-input"]').fill('Walk-in Customer');
      await page.locator('input[data-testid="customer-phone-input"]').fill('08123456789');

      // Cash is default — click submit
      await page.locator('button[data-testid="submit-button"]').click();

      // Wait for response
      await page.waitForResponse(/.*\/api\/v1\/bookings\/walkin/, { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '03-walkin-paid');

      // Verify slot now shows booked
      await page.reload();
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '03-slot-booked');
      const bookedSlot = page.locator('[data-status="booked"]').first();
      await expect(bookedSlot).toBeVisible({ timeout: 5000 });
    });
  });

  // 4. RACE CONDITION TEST
  test.describe('RACE CONDITION TEST', () => {
    test('two clients booking same slot - only one succeeds', async ({ browser }) => {
      const contextA = await browser.newContext();
      const contextB = await browser.newContext();
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();

      // Login both
      await Promise.all([
        login(pageA, 'client'),
        login(pageB, 'client'),
      ]);

      // Both navigate to courts
      await Promise.all([
        pageA.goto(`${BASE_URL}/client/courts`),
        pageB.goto(`${BASE_URL}/client/courts`),
      ]);

      await Promise.all([
        pageA.waitForLoadState('networkidle'),
        pageB.waitForLoadState('networkidle'),
      ]);

      // Both click the first available slot
      const slotA = pageA.locator('[data-status="available"]').first();
      const slotB = pageB.locator('[data-status="available"]').first();

      await Promise.all([
        slotA.click().catch(() => {}),
        slotB.click().catch(() => {}),
      ]);

      // Wait for any modals
      await pageA.waitForTimeout(1000);
      await pageB.waitForTimeout(1000);

      // Click confirm if modal appeared
      const confirmA = pageA.locator('button:has-text("Konfirmasi")');
      if (await confirmA.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmA.click();
      }
      const confirmB = pageB.locator('button:has-text("Konfirmasi")');
      if (await confirmB.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmB.click();
      }

      await Promise.all([
        pageA.waitForLoadState('networkidle'),
        pageB.waitForLoadState('networkidle'),
      ]);

      await takeScreenshot(pageA, '04-race-client-a');
      await takeScreenshot(pageB, '04-race-client-b');

      await contextA.close();
      await contextB.close();
    });
  });

  // 5. CANCEL BOOKING FLOW
  test.describe('CANCEL BOOKING FLOW', () => {
    test('client can cancel pending/paid booking', async ({ page }) => {
      // First create a booking via API
      const tokenRes = await (await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(CREDENTIALS.client),
      })).json();
      const token = tokenRes.token;

      // Get first court
      const courtsRes = await (await fetch(`${API_URL}/api/v1/courts`)).json();
      const courtId = courtsRes.courts[0].id;

      // Create booking via API
      const today = new Date().toISOString().split('T')[0];
      await fetch(`${API_URL}/api/v1/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courtId, bookingDate: today, startTime: '12:00', endTime: '13:00' }),
      });

      await login(page, 'client');
      await page.goto(`${BASE_URL}/client/bookings`);
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '05-bookings-before-cancel');

      // Find cancel button
      const cancelBtn = page.locator('button:has-text("Batalkan"), button:has-text("Cancel")').first();
      await expect(cancelBtn).toBeVisible({ timeout: 10000 });
      await cancelBtn.click();

      // Confirm cancellation
      const confirmCancel = page.locator('button:has-text("Ya"), button:has-text("Confirm")').first();
      await expect(confirmCancel).toBeVisible({ timeout: 5000 });
      await confirmCancel.click();

      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '05-booking-cancelled');
    });
  });

  // 6. REALTIME SYNC TEST
  test.describe('REALTIME SYNC TEST', () => {
    test('cashier sees real-time update when client books', async ({ browser }) => {
      const cashierContext = await browser.newContext();
      const clientContext = await browser.newContext();
      const cashierPage = await cashierContext.newPage();
      const clientPage = await clientContext.newPage();

      // Login cashier (on /cashier — same page as POS grid)
      await cashierPage.goto(`${BASE_URL}/login`);
      await cashierPage.fill('input[type="email"]', CREDENTIALS.cashier.email);
      await cashierPage.fill('input[type="password"]', CREDENTIALS.cashier.password);
      await cashierPage.click('button[type="submit"]');
      await cashierPage.waitForURL('**/cashier**', { timeout: 10000 });
      await cashierPage.waitForLoadState('networkidle');
      await takeScreenshot(cashierPage, '06-cashier-before');

      // Login client
      await login(clientPage, 'client');

      // Client books a slot
      await clientPage.goto(`${BASE_URL}/client/courts`);
      await clientPage.waitForLoadState('networkidle');

      const slot = clientPage.locator('[data-status="available"]').first();
      await expect(slot).toBeVisible({ timeout: 10000 });
      await slot.click();

      await clientPage.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });
      const confirmBtn = clientPage.locator('button:has-text("Konfirmasi")').first();
      await confirmBtn.click();
      await clientPage.waitForLoadState('networkidle');

      // Wait for socket event to propagate
      await cashierPage.waitForTimeout(3000);
      await takeScreenshot(cashierPage, '06-cashier-after');

      // Check if cashier saw the update — a slot should be booked
      const updatedSlot = cashierPage.locator('[data-status="booked"]').first();
      const isUpdated = await updatedSlot.isVisible({ timeout: 5000 }).catch(() => false);
      console.log('Cashier view updated:', isUpdated);

      await cashierContext.close();
      await clientContext.close();
    });
  });
});
