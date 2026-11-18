import { test, expect } from '@playwright/test';

test.describe('Guest Join Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test wedding join page
    await page.goto('/w/anya-raj/join');
  });

  test('should display join form with name and phone fields', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Join the Celebration');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error when name is empty', async ({ page }) => {
    await page.fill('input[name="name"]', '');
    await page.fill('input[name="phone"]', '+15551234567');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Name is required')).toBeVisible();
  });

  test('should successfully join wedding with valid name', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test Guest');
    await page.fill('input[name="phone"]', '+15551234567');
    await page.click('button[type="submit"]');

    // Should redirect to home page
    await expect(page).toHaveURL(/\/w\/anya-raj$/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should persist session in localStorage', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test Guest 2');
    await page.fill('input[name="phone"]', '+15551234568');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/w\/anya-raj$/);

    // Check localStorage for session
    const session = await page.evaluate(() => localStorage.getItem('wedapp_guest_session'));
    expect(session).toBeTruthy();

    const sessionData = JSON.parse(session!);
    expect(sessionData.name).toBe('Test Guest 2');
    expect(sessionData.weddingId).toBeTruthy();
  });

  test('should redirect to join page when accessing other pages without session', async ({ page }) => {
    // Clear any existing session
    await page.evaluate(() => localStorage.clear());

    // Try to access itinerary page
    await page.goto('/w/anya-raj/itinerary');

    // Should redirect to join page
    await expect(page).toHaveURL(/\/w\/anya-raj\/join/);
  });

  test('should show device ID in localStorage after join', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test Guest 3');
    await page.fill('input[name="phone"]', '+15551234569');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/w\/anya-raj$/);

    const deviceId = await page.evaluate(() => localStorage.getItem('wedapp_device_id'));
    expect(deviceId).toBeTruthy();
    expect(deviceId).toMatch(/^[0-9a-f-]{36}$/); // UUID format
  });
});

test.describe('Guest Session Persistence', () => {
  test('should restore session on page reload', async ({ page }) => {
    // First join
    await page.goto('/w/anya-raj/join');
    await page.fill('input[name="name"]', 'Persistent Guest');
    await page.fill('input[name="phone"]', '+15551234570');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/w\/anya-raj$/);

    // Reload page
    await page.reload();

    // Should still be on home page (not redirected to join)
    await expect(page).toHaveURL(/\/w\/anya-raj$/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should maintain session across different pages', async ({ page }) => {
    // First join
    await page.goto('/w/anya-raj/join');
    await page.fill('input[name="name"]', 'Multi-page Guest');
    await page.fill('input[name="phone"]', '+15551234571');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/w\/anya-raj$/);

    // Navigate to itinerary
    await page.click('a[href*="itinerary"]');
    await expect(page).toHaveURL(/\/w\/anya-raj\/itinerary/);

    // Navigate to photos
    await page.click('a[href*="photos"]');
    await expect(page).toHaveURL(/\/w\/anya-raj\/photos/);

    // Navigate to chat
    await page.click('a[href*="chat"]');
    await expect(page).toHaveURL(/\/w\/anya-raj\/chat/);
  });
});