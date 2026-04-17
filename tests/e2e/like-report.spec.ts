import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await expect(page).toHaveURL('/');
}

test.describe('Like System', () => {
  test('like button is visible on feed post cards', async ({ page }) => {
    await login(page);
    const likeBtn = page.locator('[data-testid="like-button"]').first();
    await expect(likeBtn).toBeVisible();
  });

  test('clicking like button toggles liked state', async ({ page }) => {
    await login(page);

    // Navigate to post detail for a cleaner test
    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    const likeBtn = page
      .locator('[data-testid="post-detail"]')
      .locator('[data-testid="like-button"]');
    await expect(likeBtn).toBeVisible();

    const textBefore = await likeBtn.textContent();
    await likeBtn.click();

    // Wait for optimistic update — text should change
    await expect(likeBtn).not.toHaveText(textBefore!);
  });

  test('like button is visible on comments', async ({ page }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    const commentItem = page.locator('[data-testid="comment-item"]').first();
    // Comments may not exist on all posts, so skip if no comments
    const count = await commentItem.count();
    if (count > 0) {
      const commentLikeBtn = commentItem.locator('[data-testid="like-button"]');
      await expect(commentLikeBtn).toBeVisible();
    }
  });
});

test.describe('Report System', () => {
  test('report button is visible on feed post cards', async ({ page }) => {
    await login(page);
    const reportBtn = page.locator('[data-testid="report-button"]').first();
    await expect(reportBtn).toBeVisible();
  });

  test('clicking report button opens report modal', async ({ page }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    const reportBtn = page
      .locator('[data-testid="post-detail"]')
      .locator('[data-testid="report-button"]');
    await reportBtn.click();

    const modal = page.locator('[data-testid="report-modal"]');
    await expect(modal).toBeVisible();
  });

  test('report modal shows reason options', async ({ page }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    await page
      .locator('[data-testid="post-detail"]')
      .locator('[data-testid="report-button"]')
      .click();
    await expect(page.locator('[data-testid="report-modal"]')).toBeVisible();

    await expect(
      page.locator('[data-testid="report-reason-abuse"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="report-reason-spam"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="report-reason-inappropriate"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="report-reason-privacy"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="report-reason-other"]'),
    ).toBeVisible();
  });

  test('report submit button is disabled without reason selected', async ({
    page,
  }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    await page
      .locator('[data-testid="post-detail"]')
      .locator('[data-testid="report-button"]')
      .click();
    await expect(page.locator('[data-testid="report-modal"]')).toBeVisible();

    const submitBtn = page.locator('[data-testid="report-submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('selecting reason and submitting report shows toast', async ({
    page,
  }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    await page
      .locator('[data-testid="post-detail"]')
      .locator('[data-testid="report-button"]')
      .click();
    await expect(page.locator('[data-testid="report-modal"]')).toBeVisible();

    // Select a reason
    await page.locator('[data-testid="report-reason-abuse"]').click();

    // Submit
    const submitBtn = page.locator('[data-testid="report-submit"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Toast should appear
    const toast = page.locator('[data-testid="toast"]');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
  });

  test('report modal closes on cancel', async ({ page }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    await page
      .locator('[data-testid="post-detail"]')
      .locator('[data-testid="report-button"]')
      .click();
    await expect(page.locator('[data-testid="report-modal"]')).toBeVisible();

    await page.locator('[data-testid="report-cancel"]').click();
    await expect(
      page.locator('[data-testid="report-modal"]'),
    ).not.toBeVisible();
  });

  test('report button is visible on comments', async ({ page }) => {
    await login(page);

    await page.locator('[data-testid="post-card"]').first().click();
    await expect(page).toHaveURL(/\/post\//);

    const commentItem = page.locator('[data-testid="comment-item"]').first();
    const count = await commentItem.count();
    if (count > 0) {
      const reportBtn = commentItem.locator('[data-testid="report-button"]');
      await expect(reportBtn).toBeVisible();
    }
  });
});
