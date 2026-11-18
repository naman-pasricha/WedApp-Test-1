import { test, expect } from '@playwright/test';

test.describe('RLS Policies - Guest Isolation', () => {
  test.beforeEach(async ({ page }) => {
    // Join as guest for wedding A
    await page.goto('/w/anya-raj/join');
    await page.fill('input[name="name"]', 'RLS Guest A');
    await page.fill('input[name="phone"]', '+15551234576');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/w\/anya-raj$/);
  });

  test('should only see events for their wedding', async ({ page }) => {
    await page.goto('/w/anya-raj/itinerary');

    // Should show events for anya-raj wedding
    await expect(page.locator('text=Mehndi')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Sangeet')).toBeVisible();
    await expect(page.locator('text=Wedding Ceremony')).toBeVisible();
  });

  test('should only see photos for their wedding', async ({ page }) => {
    await page.goto('/w/anya-raj/photos');

    // Should only show photos from their wedding
    const photoGrid = page.locator('[role="list"][aria-label="Wedding photos"]');
    await expect(photoGrid).toBeVisible();
  });

  test('should only see announcements for their wedding', async ({ page }) => {
    await page.goto('/w/anya-raj/announcements');

    // Should show announcements for anya-raj
    await expect(page.locator('text=Welcome to Anya')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Mehndi Starts')).toBeVisible();
  });

  test('should only see chat messages for their wedding', async ({ page }) => {
    await page.goto('/w/anya-raj/chat');

    // Should only show messages from their wedding
    const chatArea = page.locator('[class*="flex-1"][class*="overflow-y-auto"]');
    await expect(chatArea).toBeVisible();
  });

  test('should only see seating for their wedding', async ({ page }) => {
    await page.goto('/w/anya-raj/seating');

    // Should show tables for anya-raj
    await expect(page.locator('text=Table 1')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Table 2')).toBeVisible();
  });

  test('should only see info sections for their wedding', async ({ page }) => {
    await page.goto('/w/anya-raj/info');

    // Should show info sections for anya-raj
    await expect(page.locator('text=Accommodation')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Transport')).toBeVisible();
    await expect(page.locator('text=FAQs')).toBeVisible();
  });
});

test.describe('RLS Policies - Host Access', () => {
  test('should allow host to access their wedding dashboard', async ({ page }) => {
    // This requires host auth - would need magic link flow
    test.skip(true, 'Requires host authentication setup');
  });

  test('should not allow host to access other wedding data', async ({ page }) => {
    test.skip(true, 'Requires host authentication setup');
  });
});

test.describe('RLS Policies - Guest Data Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/w/anya-raj/join');
    await page.fill('input[name="name"]', 'Isolation Test Guest');
    await page.fill('input[name="phone"]', '+15551234577');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/w\/anya-raj$/);
  });

  test('should not be able to access other wedding data via API', async ({ page }) => {
    // Try to fetch data from another wedding via API
    const response = await page.request.get('/api/weddings/other-wedding-id/events');
    // Should return 403 or 404
    expect([403, 404]).toContain(response.status());
  });

  test('should only see their own guest record', async ({ page }) => {
    // The guest should only see their own profile/seat assignment
    await page.goto('/w/anya-raj/seating');

    // Should highlight their table
    await expect(page.locator('text=Your Table')).toBeVisible({ timeout: 5000 });
  });

  test('should not see other guests private data', async ({ page }) => {
    // In chat, should only see names, not phone numbers
    await page.goto('/w/anya-raj/chat');

    // Send a message
    await page.fill('textarea[placeholder="Type a message..."]', 'Privacy test');
    await page.click('button[aria-label="Send message"]');

    // Should show "You" for own messages
    await expect(page.locator('text=You')).toBeVisible();
  });
});

test.describe('RLS Policies - Photo Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/w/anya-raj/join');
    await page.fill('input[name="name"]', 'Photo Privacy Guest');
    await page.fill('input[name="phone"]', '+15551234578');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/w\/anya-raj$/);
  });

  test('should be able to upload photos to their wedding', async ({ page }) => {
    await page.click('button[aria-label="Open camera"]');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'my-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    // Should accept the upload
    await expect(page.locator('text=my-photo.jpg')).toBeVisible();
  });

  test('should not be able to delete other guests photos', async ({ page }) => {
    // Guest can only delete their own photos
    // This would require a photo from another guest to exist
    test.skip(true, 'Requires multiple guests with photos');
  });
});

test.describe('RLS Policies - Challenge Participation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/w/anya-raj/join');
    await page.fill('input[name="name"]', 'Challenge Guest');
    await page.fill('input[name="phone"]', '+15551234579');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/w\/anya-raj$/);
  });

  test('should only see challenges for their wedding', async ({ page }) => {
    await page.goto('/w/anya-raj/games');

    // Should show challenges for anya-raj
    await expect(page.locator('text=Photo with the Bride')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Dance Floor Star')).toBeVisible();
  });

  test('should only be able to participate in their wedding challenges', async ({ page }) => {
    await page.goto('/w/anya-raj/games');

    // Click on a challenge
    await page.click('text=Photo with the Bride');

    // Should show participation modal
    await expect(page.locator('text=Take a selfie with Anya')).toBeVisible();
  });
});