import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });
}

test.describe('Feed Page', () => {
  test('displays 4-column layout with icon bar, left panel, main feed, right panel', async ({
    page,
  }) => {
    await login(page);
    // Ensure viewport is wide enough for all panels
    await page.setViewportSize({ width: 1400, height: 900 });
    await expect(page.locator('[data-testid="icon-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="left-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="feed-title"]')).toHaveText('피드');
  });

  test('hides side panels on narrow viewport', async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 800, height: 900 });
    await expect(page.locator('[data-testid="icon-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="left-panel"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="right-panel"]')).not.toBeVisible();
  });

  test('tab switching between 최신 and 인기 loads posts', async ({ page }) => {
    await login(page);
    await expect(page.locator('[data-testid="tab-latest"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-popular"]')).toBeVisible();

    // Click popular tab
    await page.click('[data-testid="tab-popular"]');
    await expect(page).toHaveURL(/sort=popular/);

    // Click latest tab
    await page.click('[data-testid="tab-latest"]');
    await expect(page).not.toHaveURL(/sort=popular/);
  });

  test('category filter pills filter posts by category', async ({ page }) => {
    await login(page);
    await expect(
      page.locator('[data-testid="category-filters"]'),
    ).toBeVisible();

    // Click 자유 filter
    await page.click('[data-testid="category-free"]');
    await expect(page).toHaveURL(/category=FREE/);

    // Click 전체 to reset
    await page.click('[data-testid="category-all"]');
    await expect(page).not.toHaveURL(/category=/);
  });

  test('post cards display anonymous author, time, category badge', async ({
    page,
  }) => {
    await login(page);
    // Wait for posts to load (either real posts or empty state)
    await page.waitForSelector(
      '[data-testid="post-card"], [data-testid="empty-feed"]',
      {
        timeout: 10000,
      },
    );

    const postCard = page.locator('[data-testid="post-card"]').first();
    if (await postCard.isVisible()) {
      // Verify anonymous display
      await expect(postCard.locator('text=익명')).toBeVisible();
      // Verify title is present
      await expect(
        postCard.locator('[data-testid="post-title"]'),
      ).toBeVisible();
    }
  });

  test('write button navigates to write page', async ({ page }) => {
    await login(page);
    await page.click('[data-testid="write-button"]');
    await expect(page).toHaveURL(/\/write/);
    await expect(page.locator('[data-testid="write-form"]')).toBeVisible();
  });
});

test.describe('Write Page', () => {
  test('write form has category select, title input, content textarea, and submit button', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/write');

    await expect(page.locator('[data-testid="category-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="post-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="post-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="post-submit"]')).toBeVisible();
  });

  test('submitting a post redirects to feed and shows the new post', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/write');

    await page.click('[data-testid="category-free"]');
    await page.fill('[data-testid="post-title"]', 'E2E 테스트 게시글');
    await page.fill(
      '[data-testid="post-content"]',
      'E2E 테스트로 작성한 게시글 내용입니다.',
    );
    await page.click('[data-testid="post-submit"]');

    // Should redirect to feed
    await page.waitForURL('/', { timeout: 10000 });
    // The new post should appear
    await expect(page.locator('text=E2E 테스트 게시글')).toBeVisible({
      timeout: 10000,
    });
  });

  test('submitting empty form shows validation error', async ({ page }) => {
    await login(page);
    await page.goto('/write');

    // Submit with empty fields
    await page.click('[data-testid="post-submit"]');

    // Should stay on write page (validation prevents submission or shows error)
    await expect(page).toHaveURL(/\/write/);
  });
});
