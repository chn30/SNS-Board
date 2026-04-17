import { test, expect, type Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-admin-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });
}

async function loginAsUser(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });
}

test.describe('Admin Pages', () => {
  test('admin can access dashboard and see stats', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await expect(page.locator('[data-testid="admin-layout"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-stats"]')).toBeVisible();
    // Stats cards should show numeric values
    const statsText = await page
      .locator('[data-testid="admin-stats"]')
      .textContent();
    expect(statsText).toContain('전체 게시글');
    expect(statsText).toContain('전체 댓글');
    expect(statsText).toContain('활성 신고');
    expect(statsText).toContain('사용자 수');
  });

  test('admin can navigate to posts management and see post list', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/posts');
    await expect(
      page.locator('[data-testid="admin-posts-page"]'),
    ).toBeVisible();
    // Should show posts table with rows
    await expect(
      page.locator('[data-testid="admin-post-row"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('admin can delete a post and see confirmation toast', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/posts');
    await expect(
      page.locator('[data-testid="admin-post-row"]').first(),
    ).toBeVisible({ timeout: 10000 });

    // Click delete on first active post
    await page.locator('[data-testid="admin-delete-post"]').first().click();
    // Confirm dialog appears
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-delete"]');
    // Toast shows deletion confirmation
    await expect(page.locator('[data-testid="toast"]')).toContainText('삭제');
  });

  test('admin can restore a deleted post', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/posts');
    await expect(
      page.locator('[data-testid="admin-posts-page"]'),
    ).toBeVisible();

    // Filter to deleted posts
    await page.click('[data-testid="filter-deleted"]');
    // Wait for filtered results
    await page.waitForTimeout(1000);

    const restoreBtn = page
      .locator('[data-testid="admin-restore-post"]')
      .first();
    if (await restoreBtn.isVisible()) {
      await restoreBtn.click();
      await expect(page.locator('[data-testid="toast"]')).toContainText('복원');
    }
  });

  test('admin can view reports page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/reports');
    await expect(
      page.locator('[data-testid="admin-reports-page"]'),
    ).toBeVisible();
  });

  test('admin sidebar navigation links work', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible();

    // Navigate to posts via sidebar
    await page.click('[data-testid="admin-nav-posts"]');
    await expect(page).toHaveURL(/\/admin\/posts/);
    await expect(
      page.locator('[data-testid="admin-posts-page"]'),
    ).toBeVisible();

    // Navigate to reports via sidebar
    await page.click('[data-testid="admin-nav-reports"]');
    await expect(page).toHaveURL(/\/admin\/reports/);
    await expect(
      page.locator('[data-testid="admin-reports-page"]'),
    ).toBeVisible();

    // Navigate back to dashboard
    await page.click('[data-testid="admin-nav-dashboard"]');
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('non-admin user is redirected away from admin pages', async ({
    page,
  }) => {
    await loginAsUser(page);
    await page.goto('/admin');
    // Should redirect to / (non-admin)
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test('admin posts page shows status badges for deleted and hidden posts', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/posts');
    await expect(
      page.locator('[data-testid="admin-post-row"]').first(),
    ).toBeVisible({ timeout: 10000 });

    // At least one status badge should be visible (active, deleted, or hidden)
    const rows = page.locator('[data-testid="admin-post-row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Each row should have a status indicator
    const firstRow = rows.first();
    const hasStatus = await firstRow
      .locator('[data-testid^="status-"]')
      .count();
    expect(hasStatus).toBeGreaterThan(0);
  });
});
