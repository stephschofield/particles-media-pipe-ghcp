import { test, expect } from '@playwright/test';

test.describe('Basic Application Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loaded (looking for Next.js or our app content)
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('has pure black background', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check background color of body/canvas
    const bgColor = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    
    // Should be black: rgb(0, 0, 0)
    expect(bgColor).toBe('rgb(0, 0, 0)');
  });

  test('is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Press Tab to focus first interactive element
    await page.keyboard.press('Tab');
    
    // Check that something has focus
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focusedElement).toBeTruthy();
  });
});
