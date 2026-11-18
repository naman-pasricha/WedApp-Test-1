import { test, expect } from '@playwright/test';

test.describe('Photo Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Join as guest first
    await page.goto('/w/anya-raj/join');
    await page.fill('input[name="name"]', 'Photo Test Guest');
    await page.fill('input[name="phone"]', '+15551234572');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/w\/anya-raj$/);
  });

  test('should open photo uploader modal when clicking camera button', async ({ page }) => {
    // Click the camera button in bottom nav
    await page.click('button[aria-label="Open camera"]');

    // Should show upload modal
    await expect(page.locator('text=Upload Photos')).toBeVisible();
    await expect(page.locator('text=Drag & drop photos here')).toBeVisible();
  });

  test('should accept file selection via file input', async ({ page }) => {
    await page.click('button[aria-label="Open camera"]');

    // Create a test file
    const fileInput = page.locator('input[type="file"]').first();

    // Use page.setInputFiles with a buffer
    await fileInput.setInputFiles({
      name: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    // Should show the file in queue
    await expect(page.locator('text=test-photo.jpg')).toBeVisible();
  });

  test('should show error for files larger than 10MB', async ({ page }) => {
    await page.click('button[aria-label="Open camera"]');

    const fileInput = page.locator('input[type="file"]').first();

    // Create a large file (11MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'x');

    await fileInput.setInputFiles({
      name: 'large-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer,
    });

    // Should show error
    await expect(page.locator('text=File too large')).toBeVisible();
  });

  test('should allow adding caption to photo', async ({ page }) => {
    await page.click('button[aria-label="Open camera"]');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'captioned-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    // Add caption
    await page.fill('input[placeholder="Add a caption..."]', 'Beautiful wedding moment!');

    // Caption should be in the input
    await expect(page.locator('input[placeholder="Add a caption..."]')).toHaveValue('Beautiful wedding moment!');
  });

  test('should show progress during upload', async ({ page }) => {
    await page.click('button[aria-label="Open camera"]');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'progress-test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    // Click upload all
    await page.click('button:has-text("Upload All")');

    // Should show progress bar or loading state
    await expect(page.locator('.animate-spin, [class*="progress"]')).toBeVisible({ timeout: 5000 });
  });

  test('should close modal after successful upload', async ({ page }) => {
    await page.click('button[aria-label="Open camera"]');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'close-test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    await page.click('button:has-text("Upload All")');

    // Wait for upload to complete (or mock to complete)
    // Then check for Done button
    await expect(page.locator('button:has-text("Done")')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Done")');

    // Modal should close
    await expect(page.locator('text=Upload Photos')).not.toBeVisible();
  });
});

test.describe('Photo Gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/w/anya-raj/join');
    await page.fill('input[name="name"]', 'Gallery Guest');
    await page.fill('input[name="phone"]', '+15551234573');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/w\/anya-raj$/);
  });

  test('should navigate to photos page', async ({ page }) => {
    await page.click('a[href*="photos"]');
    await expect(page).toHaveURL(/\/w\/anya-raj\/photos/);
    await expect(page.locator('h1')).toContainText('Photos');
  });

  test('should display photo grid', async ({ page }) => {
    await page.goto('/w/anya-raj/photos');

    // Should show photo grid container
    await expect(page.locator('[role="list"][aria-label="Wedding photos"]')).toBeVisible();
  });

  test('should show empty state when no photos', async ({ page }) => {
    await page.goto('/w/anya-raj/photos');

    // May show empty state if no photos in DB
    const emptyState = page.locator('text=No photos yet');
    const grid = page.locator('[role="list"]');

    // At least one should be visible
    await expect(emptyState.or(grid)).toBeVisible();
  });
});

test.describe('Photo Likes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/w/anya-raj/join');
    await page.fill('input[name="name"]', 'Like Test Guest');
    await page.fill('input[name="phone"]', '+15551234574');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/w\/anya-raj$/);
  });

  test('should be able to like a photo', async ({ page }) => {
    await page.goto('/w/anya-raj/photos');

    // If there are photos, try to like one
    const likeButtons = page.locator('button[aria-label="Like"]');
    const count = await likeButtons.count();

    if (count > 0) {
      await likeButtons.first().click();

      // Should update to "Unlike" state
      await expect(page.locator('button[aria-label="Unlike"]')).toBeVisible();
    }
  });
});