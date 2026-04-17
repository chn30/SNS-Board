import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await expect(page).toHaveURL('/');
}

test.describe('Post Detail Page', () => {
  test('navigating from feed shows post detail with title and content', async ({
    page,
  }) => {
    await login(page);

    // Click first post card
    const firstCard = page.locator('[data-testid="post-card"]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // URL should contain /post/
    await expect(page).toHaveURL(/\/post\//);

    // Detail elements visible
    await expect(
      page.locator('[data-testid="post-detail-title"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="post-detail-content"]'),
    ).toBeVisible();
  });

  test('post detail shows back button that navigates to feed', async ({
    page,
  }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    const backBtn = page.locator('[data-testid="post-back"]');
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(page).toHaveURL('/');
  });

  test('post detail shows like count, comment count, and view count', async ({
    page,
  }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    await expect(page.locator('[data-testid="post-like-count"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="post-comment-count"]'),
    ).toBeVisible();
    await expect(page.locator('[data-testid="post-view-count"]')).toBeVisible();
  });

  test('post detail shows anonymous author', async ({ page }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    // Should show 익명
    await expect(page.locator('text=익명').first()).toBeVisible();

    // Should NOT show PII
    const content = await page.content();
    expect(content).not.toContain('test-user');
    expect(content).not.toContain('ssoId');
  });

  test('post detail shows category badge', async ({ page }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    // At least one category badge should be visible (자유, 질문, or 정보)
    const hasFree = await page.locator('text=자유').count();
    const hasQuestion = await page.locator('text=질문').count();
    const hasInfo = await page.locator('text=정보').count();
    expect(hasFree + hasQuestion + hasInfo).toBeGreaterThan(0);
  });
});

test.describe('Comments Section', () => {
  test('comments section is visible on post detail', async ({ page }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    await expect(
      page.locator('[data-testid="comments-section"]'),
    ).toBeVisible();
  });

  test('comment input and submit button are visible', async ({ page }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    await expect(page.locator('[data-testid="comment-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="comment-submit"]')).toBeVisible();
  });

  test('comment submit button is disabled when input is empty', async ({
    page,
  }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    const submitBtn = page.locator('[data-testid="comment-submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('typing in comment input enables submit button', async ({ page }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    const input = page.locator('[data-testid="comment-input"]');
    const submitBtn = page.locator('[data-testid="comment-submit"]');

    await input.fill('테스트 댓글');
    await expect(submitBtn).toBeEnabled();
  });

  test('submitting comment shows loading state', async ({ page }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    const input = page.locator('[data-testid="comment-input"]');
    await input.fill('E2E 테스트 댓글 ' + Date.now());

    const submitBtn = page.locator('[data-testid="comment-submit"]');
    await submitBtn.click();

    // Should show loading or the comment should appear
    // Either the button shows '등록 중...' or the comment appears
    const loadingOrComment = await Promise.race([
      submitBtn
        .filter({ hasText: '등록 중...' })
        .waitFor({ timeout: 2000 })
        .then(() => 'loading'),
      page
        .locator('[data-testid="comment-item"]')
        .first()
        .waitFor({ timeout: 5000 })
        .then(() => 'comment'),
    ]).catch(() => 'timeout');

    expect(['loading', 'comment']).toContain(loadingOrComment);
  });
});
