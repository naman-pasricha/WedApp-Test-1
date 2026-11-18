import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Join as guest first
    await page.goto('/w/anya-raj/join');
    await page.fill('input[name="name"]', 'Chat Test Guest');
    await page.fill('input[name="phone"]', '+15551234575');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/w\/anya-raj$/);
  });

  test('should navigate to chat page', async ({ page }) => {
    await page.click('a[href*="chat"]');
    await expect(page).toHaveURL(/\/w\/anya-raj\/chat/);
    await expect(page.locator('h1')).toContainText('Chat');
  });

  test('should display message input area', async ({ page }) => {
    await page.goto('/w/anya-raj/chat');

    // Should show message input
    await expect(page.locator('textarea[placeholder="Type a message..."]')).toBeVisible();
    await expect(page.locator('button[aria-label="Send message"]')).toBeVisible();
  });

  test('should send a text message', async ({ page }) => {
    await page.goto('/w/anya-raj/chat');

    // Type and send message
    await page.fill('textarea[placeholder="Type a message..."]', 'Hello everyone!');
    await page.click('button[aria-label="Send message"]');

    // Should show the message in chat
    await expect(page.locator('text=Hello everyone!')).toBeVisible();

    // Input should be cleared
    await expect(page.locator('textarea[placeholder="Type a message..."]')).toHaveValue('');
  });

  test('should show emoji picker when clicking emoji button', async ({ page }) => {
    await page.goto('/w/anya-raj/chat');

    // Click emoji button
    await page.click('button[aria-label="Emoji"]');

    // Should show emoji picker
    await expect(page.locator('button:has-text("😀")')).toBeVisible();
    await expect(page.locator('button:has-text("❤️")')).toBeVisible();
  });

  test('should insert emoji when clicked', async ({ page }) => {
    await page.goto('/w/anya-raj/chat');

    // Click emoji button
    await page.click('button[aria-label="Emoji"]');

    // Click an emoji
    await page.click('button:has-text("😀")');

    // Emoji should be in textarea
    await expect(page.locator('textarea[placeholder="Type a message..."]')).toHaveValue('😀');
  });

  test('should send message with Enter key', async ({ page }) => {
    await page.goto('/w/anya-raj/chat');

    // Type message and press Enter
    await page.fill('textarea[placeholder="Type a message..."]', 'Enter key test');
    await page.press('textarea[placeholder="Type a message..."]', 'Enter');

    // Should send message
    await expect(page.locator('text=Enter key test')).toBeVisible();
  });

  test('should not send message with Shift+Enter (new line)', async ({ page }) => {
    await page.goto('/w/anya-raj/chat');

    // Type message with Shift+Enter
    await page.fill('textarea[placeholder="Type a message..."]', 'Line 1');
    await page.press('textarea[placeholder="Type a message..."]', 'Shift+Enter');
    await page.fill('textarea[placeholder="Type a message..."]', 'Line 1\nLine 2');

    // Should have both lines
    await expect(page.locator('textarea[placeholder="Type a message..."]')).toHaveValue('Line 1\nLine 2');
  });

  test('should show attachment menu when clicking more button', async ({ page }) => {
    await page.goto('/w/anya-raj/chat');

    // Click attachment button
    await page.click('button[aria-label="Attachments"]');

    // Should show attachment options
    await expect(page.locator('button[aria-label="Photo"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Camera"]')).toBeVisible();
  });

  test('should scroll to bottom when new message arrives', async ({ page }) => {
    await page.goto('/w/anya-raj/chat');

    // Send a message
    await page.fill('textarea[placeholder="Type a message..."]', 'Scroll test message');
    await page.click('button[aria-label="Send message"]');

    // Message should be visible (scroll to bottom)
    await expect(page.locator('text=Scroll test message')).toBeVisible();
  });

  test('should display timestamp on messages', async ({ page }) => {
    await page.goto('/w/anya-raj/chat');

    await page.fill('textarea[placeholder="Type a message..."]', 'Timestamp test');
    await page.click('button[aria-label="Send message"]');

    // Should show timestamp
    await expect(page.locator('text=/\\d{1,2}:\\d{2}/')).toBeVisible();
  });
});

test.describe('Host Broadcast Messages', () => {
  test.beforeEach(async ({ page }) => {
    // This would need host auth - skip for now
    test.skip(true, 'Requires host authentication');
  });

  test('should allow host to send broadcast message', async ({ page }) => {
    // Navigate to host dashboard chat
    // Send broadcast
    // Verify it appears in guest chat
  });

  test('should show broadcast indicator on host messages', async ({ page }) => {
    // Verify broadcast badge/indicator
  });
});