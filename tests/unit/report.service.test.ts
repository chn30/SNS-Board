import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Category } from '@prisma/client';
import { createReport, getReportCount } from '@/lib/services/report.service';
import { createPost } from '@/lib/services/post.service';
import { createComment } from '@/lib/services/comment.service';

const prisma = new PrismaClient();

let testUserIds: string[] = [];
let testPostId: string;
let testPostForHideId: string;
let testCommentId: string;
let createdPostIds: string[] = [];
let createdCommentIds: string[] = [];

beforeAll(async () => {
  // Get 4 test users for report threshold testing
  for (let i = 1; i <= 4; i++) {
    const user = await prisma.user.findFirstOrThrow({
      where: { email: `test-user-${i}@test.com` },
    });
    testUserIds.push(user.id);
  }

  const post = await createPost(testUserIds[0], {
    title: '신고 테스트용 게시글',
    content: '신고 기능을 테스트합니다',
    category: 'FREE' as Category,
  });
  testPostId = post.id;
  createdPostIds.push(post.id);

  const postForHide = await createPost(testUserIds[0], {
    title: '자동 비공개 테스트용 게시글',
    content: '3건 신고 시 자동 비공개 테스트',
    category: 'FREE' as Category,
  });
  testPostForHideId = postForHide.id;
  createdPostIds.push(postForHide.id);

  // Create a comment for COMMENT-type report testing
  const comment = await createComment(
    testUserIds[0],
    testPostId,
    '신고 테스트용 댓글',
  );
  testCommentId = comment.id;
  createdCommentIds.push(comment.id);
});

afterAll(async () => {
  await prisma.report.deleteMany({
    where: { targetId: { in: [...createdPostIds, ...createdCommentIds] } },
  });
  await prisma.comment.deleteMany({
    where: { id: { in: createdCommentIds } },
  });
  await prisma.post.deleteMany({
    where: { id: { in: createdPostIds } },
  });
  await prisma.$disconnect();
});

describe('report.service - createReport', () => {
  it('creates a report and returns success', async () => {
    const result = await createReport(
      testUserIds[0],
      'POST',
      testPostId,
      'ABUSE',
    );

    expect(result.success).toBe(true);
    expect(result.duplicate).toBeUndefined();
  });

  it('rejects duplicate report from the same user', async () => {
    const result = await createReport(
      testUserIds[0],
      'POST',
      testPostId,
      'SPAM',
    );

    expect(result.success).toBe(false);
    expect(result.duplicate).toBe(true);
  });

  it('getReportCount returns accurate count', async () => {
    const count = await getReportCount('POST', testPostId);
    expect(count).toBe(1);
  });

  it('allows different users to report the same post', async () => {
    const result = await createReport(
      testUserIds[1],
      'POST',
      testPostId,
      'SPAM',
    );

    expect(result.success).toBe(true);

    const count = await getReportCount('POST', testPostId);
    expect(count).toBe(2);
  });

  it('auto-hides post when report count reaches 3', async () => {
    // Report from 3 different users
    await createReport(testUserIds[0], 'POST', testPostForHideId, 'ABUSE');
    await createReport(testUserIds[1], 'POST', testPostForHideId, 'SPAM');
    const result = await createReport(
      testUserIds[2],
      'POST',
      testPostForHideId,
      'INAPPROPRIATE',
    );

    expect(result.success).toBe(true);
    expect(result.hidden).toBe(true);

    // Verify post is hidden in database
    const post = await prisma.post.findUnique({
      where: { id: testPostForHideId },
      select: { isHidden: true },
    });
    expect(post?.isHidden).toBe(true);
  });

  it('does not return hidden:true for COMMENT reports even at 3+ reports', async () => {
    // Report the comment from 3 different users
    await createReport(testUserIds[0], 'COMMENT', testCommentId, 'ABUSE');
    await createReport(testUserIds[1], 'COMMENT', testCommentId, 'SPAM');
    const result = await createReport(
      testUserIds[2],
      'COMMENT',
      testCommentId,
      'INAPPROPRIATE',
    );

    expect(result.success).toBe(true);
    expect(result.hidden).toBe(false);
  });
});
