import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Category } from '@prisma/client';
import {
  getComments,
  createComment,
  deleteComment,
} from '@/lib/services/comment.service';
import { createPost } from '@/lib/services/post.service';

const prisma = new PrismaClient();

let testUserId: string;
let testAdminId: string;
let testPostId: string;
let createdCommentIds: string[] = [];
let createdPostIds: string[] = [];

beforeAll(async () => {
  const user = await prisma.user.findFirstOrThrow({
    where: { email: 'test-user-1@test.com' },
  });
  testUserId = user.id;

  const admin = await prisma.user.findFirstOrThrow({
    where: { email: 'test-admin-1@test.com' },
  });
  testAdminId = admin.id;

  // Create a test post for comments
  const post = await createPost(testUserId, {
    title: '댓글 테스트용 게시글',
    content: '댓글을 작성할 게시글입니다',
    category: 'FREE' as Category,
  });
  testPostId = post.id;
  createdPostIds.push(post.id);
});

afterAll(async () => {
  if (createdCommentIds.length > 0) {
    await prisma.comment.deleteMany({
      where: { id: { in: createdCommentIds } },
    });
  }
  if (createdPostIds.length > 0) {
    await prisma.post.deleteMany({
      where: { id: { in: createdPostIds } },
    });
  }
  await prisma.$disconnect();
});

describe('comment.service - createComment', () => {
  it('creates a comment and increments post commentCount', async () => {
    const postBefore = await prisma.post.findUnique({
      where: { id: testPostId },
      select: { commentCount: true },
    });

    const comment = await createComment(testUserId, testPostId, '테스트 댓글');
    createdCommentIds.push(comment.id);

    expect(comment.id).toBeDefined();
    expect(comment.content).toBe('테스트 댓글');
    expect(comment.postId).toBe(testPostId);
    expect(comment.likeCount).toBe(0);
    expect(comment.isLiked).toBe(false);
    expect((comment as any).authorId).toBeUndefined();

    const postAfter = await prisma.post.findUnique({
      where: { id: testPostId },
      select: { commentCount: true },
    });
    expect(postAfter!.commentCount).toBe(postBefore!.commentCount + 1);
  });

  it('throws error when post does not exist', async () => {
    await expect(
      createComment(
        testUserId,
        '00000000-0000-0000-0000-000000000000',
        '없는 게시글 댓글',
      ),
    ).rejects.toThrow('게시글을 찾을 수 없습니다.');
  });
});

describe('comment.service - getComments', () => {
  it('returns comments for a post with no PII', async () => {
    // Ensure at least one comment
    const c = await createComment(testUserId, testPostId, '조회용 댓글');
    createdCommentIds.push(c.id);

    const result = await getComments(testPostId, undefined, testUserId);

    expect(result.comments.length).toBeGreaterThan(0);
    for (const comment of result.comments) {
      expect(comment.postId).toBe(testPostId);
      expect((comment as any).authorId).toBeUndefined();
    }
  });

  it('returns comments in descending order by creation time', async () => {
    const result = await getComments(testPostId, undefined, testUserId);

    for (let i = 1; i < result.comments.length; i++) {
      expect(result.comments[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.comments[i].createdAt.getTime(),
      );
    }
  });
});

describe('comment.service - deleteComment', () => {
  it('allows author to soft-delete their own comment and decrements commentCount', async () => {
    const comment = await createComment(testUserId, testPostId, '삭제할 댓글');
    createdCommentIds.push(comment.id);

    const postBefore = await prisma.post.findUnique({
      where: { id: testPostId },
      select: { commentCount: true },
    });

    const result = await deleteComment(comment.id, testUserId, 'USER');
    expect(result.success).toBe(true);

    const dbComment = await prisma.comment.findUnique({
      where: { id: comment.id },
    });
    expect(dbComment!.isDeleted).toBe(true);

    const postAfter = await prisma.post.findUnique({
      where: { id: testPostId },
      select: { commentCount: true },
    });
    expect(postAfter!.commentCount).toBe(postBefore!.commentCount - 1);
  });

  it('allows admin to delete any comment', async () => {
    const comment = await createComment(
      testUserId,
      testPostId,
      '관리자 삭제 댓글',
    );
    createdCommentIds.push(comment.id);

    const result = await deleteComment(comment.id, testAdminId, 'ADMIN');
    expect(result.success).toBe(true);
  });

  it('rejects deletion by non-author non-admin', async () => {
    const otherUser = await prisma.user.findFirstOrThrow({
      where: { email: 'test-user-2@test.com' },
    });

    const comment = await createComment(
      testUserId,
      testPostId,
      '권한 없는 삭제 댓글',
    );
    createdCommentIds.push(comment.id);

    const result = await deleteComment(comment.id, otherUser.id, 'USER');
    expect(result.success).toBe(false);
    expect(result.error).toBe('삭제 권한이 없습니다.');
  });

  it('returns error for non-existent comment', async () => {
    const result = await deleteComment(
      '00000000-0000-0000-0000-000000000000',
      testUserId,
      'USER',
    );
    expect(result.success).toBe(false);
  });
});

describe('comment.service - cursor pagination', () => {
  it('returns next page with cursor', async () => {
    // Create 22 comments to test pagination
    for (let i = 0; i < 22; i++) {
      const c = await createComment(
        testUserId,
        testPostId,
        `페이지네이션 댓글 ${i}`,
      );
      createdCommentIds.push(c.id);
    }

    const page1 = await getComments(testPostId, undefined, testUserId);
    expect(page1.comments.length).toBeLessThanOrEqual(20);

    if (page1.nextCursor) {
      const page2 = await getComments(testPostId, page1.nextCursor, testUserId);
      expect(page2.comments.length).toBeGreaterThan(0);

      // Ensure no overlap
      const page1Ids = new Set(page1.comments.map((c) => c.id));
      for (const c of page2.comments) {
        expect(page1Ids.has(c.id)).toBe(false);
      }
    }
  });
});

describe('comment.service - isLiked', () => {
  it('returns isLiked true when user has liked a comment', async () => {
    const comment = await createComment(testUserId, testPostId, '좋아요 댓글');
    createdCommentIds.push(comment.id);

    // Create a like directly in DB
    const like = await prisma.like.create({
      data: {
        userId: testUserId,
        targetType: 'COMMENT',
        targetId: comment.id,
      },
    });

    const result = await getComments(testPostId, undefined, testUserId);
    const found = result.comments.find((c) => c.id === comment.id);
    expect(found).toBeDefined();
    expect(found!.isLiked).toBe(true);

    // Cleanup like
    await prisma.like.delete({ where: { id: like.id } });
  });
});
