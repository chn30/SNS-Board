import { test, expect } from '@playwright/test';

// S1: 피드 조회
test('S1: 로그인 후 피드에서 게시글 목록을 볼 수 있다', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await expect(page).toHaveURL('/');

  // Feed loaded
  await expect(page.locator('[data-testid="post-card"]').first()).toBeVisible();
  
  // Tab switching
  await page.click('[data-testid="tab-popular"]');
  await expect(page.locator('[data-testid="post-card"]').first()).toBeVisible();
  
  // Category filter
  await page.click('[data-testid="category-free"]');
  await expect(page.locator('[data-testid="post-card"]').first()).toBeVisible();
});

// S2: 게시글 작성
test('S2: 게시글을 작성하면 피드 최상단에 표시된다', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await expect(page).toHaveURL('/');

  // Open write modal/page
  await page.click('[data-testid="write-button"]');
  
  // Fill form
  await page.click('[data-testid="category-free"]');
  await page.fill('[data-testid="post-title"]', '테스트 게시글 제목');
  await page.fill('[data-testid="post-content"]', '테스트 게시글 내용입니다.');
  await page.click('[data-testid="post-submit"]');

  // Verify post appears in feed
  await expect(page).toHaveURL('/');
  await expect(page.locator('text=테스트 게시글 제목')).toBeVisible();
  
  // Verify anonymous display
  await expect(page.locator('text=익명')).toBeVisible();
});

// S3: 게시글 상세 + 댓글
test('S3: 게시글 상세에서 댓글을 작성할 수 있다', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await expect(page).toHaveURL('/');

  // Click first post
  await page.locator('[data-testid="post-card"]').first().click();
  await expect(page.url()).toContain('/post/');

  // Verify detail content
  await expect(page.locator('[data-testid="post-detail-title"]')).toBeVisible();
  await expect(page.locator('[data-testid="comments-section"]')).toBeVisible();

  // Add comment
  await page.fill('[data-testid="comment-input"]', '테스트 댓글입니다.');
  await page.click('[data-testid="comment-submit"]');
  
  // Verify comment appears
  await expect(page.locator('text=테스트 댓글입니다.')).toBeVisible();
});

// S4: 공감 토글
test('S4: 공감 버튼을 클릭하면 공감 수가 변동된다', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await expect(page).toHaveURL('/');

  // Get initial like count
  const likeBtn = page.locator('[data-testid="like-button"]').first();
  const initialText = await likeBtn.textContent();
  const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');

  // Click like
  await likeBtn.click();
  
  // Verify count increased
  await expect(likeBtn).toContainText(String(initialCount + 1));
  
  // Click again to unlike
  await likeBtn.click();
  await expect(likeBtn).toContainText(String(initialCount));
});

// S5: 신고 접수
test('S5: 신고를 접수할 수 있다', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await expect(page).toHaveURL('/');

  // Click report button on first post
  await page.locator('[data-testid="report-button"]').first().click();
  
  // Select reason
  await expect(page.locator('[data-testid="report-modal"]')).toBeVisible();
  await page.click('[data-testid="report-reason-abuse"]');
  await page.click('[data-testid="report-submit"]');
  
  // Verify toast
  await expect(page.locator('[data-testid="toast"]')).toContainText('신고');
});

// S6: 관리자 게시글 삭제
test('S6: 관리자가 게시글을 삭제할 수 있다', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-admin-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await expect(page).toHaveURL('/');

  // Navigate to admin
  await page.goto('/admin/posts');
  await expect(page.locator('[data-testid="admin-post-row"]').first()).toBeVisible();

  // Delete first post
  await page.locator('[data-testid="admin-delete-post"]').first().click();
  await page.click('[data-testid="confirm-delete"]');
  
  // Verify toast
  await expect(page.locator('[data-testid="toast"]')).toContainText('삭제');
});

// A1: 익명성 노출 방지
test('A1: API 응답에 사용자 PII가 포함되지 않는다', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await expect(page).toHaveURL('/');

  // Check page source doesn't contain emails
  const content = await page.content();
  expect(content).not.toContain('test-user-1@test.com');
  expect(content).not.toContain('ssoId');
});

// A3: 비인가 관리자 접근 방지
test('A3: 일반 사용자는 관리자 페이지에 접근할 수 없다', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'test-user-1@test.com');
  await page.fill('[data-testid="login-password"]', 'password');
  await page.click('[data-testid="login-submit"]');
  await expect(page).toHaveURL('/');

  // Try to access admin
  await page.goto('/admin');
  // Should redirect away from admin or show 403
  await expect(page).not.toHaveURL(/\/admin/);
});

// A4: 미인증 접근 방지
test('A4: 미인증 사용자는 로그인 페이지로 리다이렉트된다', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  
  await page.goto('/post/some-id');
  await expect(page).toHaveURL(/\/login/);
  
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
});
