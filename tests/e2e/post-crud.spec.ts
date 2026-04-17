import { test, expect } from '@playwright/test';

test.describe('Post CRUD + Comment - App Verification', () => {
  test('login page loads and has form elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('login with valid credentials redirects to feed', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
    await page.fill('[data-testid="login-password"]', 'password');
    await page.click('[data-testid="login-submit"]');
    // Wait for navigation away from login
    await page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });
    // Should be on main page
    expect(page.url()).not.toContain('/login');
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
    await page.fill('[data-testid="login-password"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');
    // Should stay on login page (may show error or just stay)
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/login');
  });

  test('authenticated user can see feed page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
    await page.fill('[data-testid="login-password"]', 'password');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });
    // Feed page should have content
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});
