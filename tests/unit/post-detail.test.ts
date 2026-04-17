import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Category } from '@prisma/client';
import { getPost, createPost, deletePost } from '@/lib/services/post.service';
import {
  getComments,
  createComment,
  deleteComment,
} from '@/lib/services/comment.service';

const prisma = new PrismaClient();

let userId1: string;
let userId2: string;
let adminId: string;
let testPostId: string;
const cleanupPostIds: string[] = [];
const cleanupCommentIds: string[] = [];

beforeAll(async () => {
  const user1 = await prisma.user.findFirstOrThrow({
    where: { email: 'test-user-1@test.com' },
  });
  userId1 = user1.id;

  const user2 = await prisma.user.findFirstOrThrow({
    where: { email: 'test-user-2@test.com' },
  });
  userId2 = user2.id;

  const admin = await prisma.user.findFirstOrThrow({
    where: { email: 'test-admin-1@test.com' },
  });
  adminId = admin.id;

  const post = await createPost(userId1, {
    title: '상세 페이지 테스트 게시글',
    content: '이 게시글은 상세 페이지 및 댓글 시스템 테스트용입니다.',
    category: 'FREE' as Category,
  });
  testPostId = post.id;
  cleanupPostIds.push(post.id);
});

afterAll(async () => {
  if (cleanupCommentIds.length > 0) {
    await prisma.comment.deleteMany({
      where: { id: { in: cleanupCommentIds } },
    });
  }
  if (cleanupPostIds.length > 0) {
    await prisma.post.deleteMany({
      where: { id: { in: cleanupPostIds } },
    });
  }
  await prisma.$disconnect();
});

describe('Post Detail', () => {
  it('returns full post with isOwner=true when viewed by author', async () => {
    const post = await getPost(testPostId, userId1);
    expect(post).not.toBeNull();
    expect(post!.id).toBe(testPostId);
    expect(post!.title).toBe('상세 페이지 테스트 게시글');
    expect(post!.content).toBe(
      '이 게시글은 상세 페이지 및 댓글 시스템 테스트용입니다.',
    );
    expect(post!.isOwner).toBe(true);
    expect(post!.category).toBe('FREE');
  });

  it('returns isOwner=false when viewed by a different user', async () => {
    const post = await getPost(testPostId, userId2);
    expect(post).not.toBeNull();
    expect(post!.isOwner).toBe(false);
  });

  it('increments viewCount on each view', async () => {
    const first = await getPost(testPostId, userId1);
    const firstViewCount = first!.viewCount;

    const second = await getPost(testPostId, userId1);
    expect(second!.viewCount).toBe(firstViewCount + 1);
  });

  it('returns null for deleted post', async () => {
    const post = await createPost(userId1, {
      title: '삭제 테스트용',
      content: '곧 삭제됩니다',
      category: 'FREE' as Category,
    });
    cleanupPostIds.push(post.id);

    await deletePost(post.id, userId1, 'USER');
    const result = await getPost(post.id, userId1);
    expect(result).toBeNull();
  });

  it('only allows author to delete their own post', async () => {
    const post = await createPost(userId1, {
      title: '삭제 권한 테스트',
      content: '다른 유저가 삭제 시도',
      category: 'FREE' as Category,
    });
    cleanupPostIds.push(post.id);

    const result = await deletePost(post.id, userId2, 'USER');
    expect(result.success).toBe(false);
    expect(result.error).toContain('권한');

    // Author can delete
    const ownerResult = await deletePost(post.id, userId1, 'USER');
    expect(ownerResult.success).toBe(true);
  });
});

describe('Comment System', () => {
  it('creates a comment and it appears in comment list', async () => {
    const comment = await createComment(
      userId1,
      testPostId,
      '첫 번째 댓글입니다',
    );
    cleanupCommentIds.push(comment.id);

    expect(comment.content).toBe('첫 번째 댓글입니다');
    expect(comment.postId).toBe(testPostId);
    expect(comment.isOwner).toBe(true);

    const { comments } = await getComments(testPostId, undefined, userId1);
    const found = comments.find((c) => c.id === comment.id);
    expect(found).toBeDefined();
    expect(found!.content).toBe('첫 번째 댓글입니다');
  });

  it('shows isOwner=true for own comments, false for others', async () => {
    const comment = await createComment(
      userId2,
      testPostId,
      '다른 유저의 댓글',
    );
    cleanupCommentIds.push(comment.id);

    // userId1 views — should see isOwner=false for userId2's comment
    const { comments } = await getComments(testPostId, undefined, userId1);
    const other = comments.find((c) => c.id === comment.id);
    expect(other).toBeDefined();
    expect(other!.isOwner).toBe(false);

    // userId2 views — should see isOwner=true
    const { comments: comments2 } = await getComments(
      testPostId,
      undefined,
      userId2,
    );
    const own = comments2.find((c) => c.id === comment.id);
    expect(own).toBeDefined();
    expect(own!.isOwner).toBe(true);
  });

  it('increments post commentCount when comment is created', async () => {
    const before = await getPost(testPostId, userId1);
    const beforeCount = before!.commentCount;

    const comment = await createComment(
      userId1,
      testPostId,
      '카운트 증가 확인',
    );
    cleanupCommentIds.push(comment.id);

    const after = await getPost(testPostId, userId1);
    expect(after!.commentCount).toBe(beforeCount + 1);
  });

  it('only allows author to delete their own comment', async () => {
    const comment = await createComment(
      userId1,
      testPostId,
      '삭제 권한 테스트 댓글',
    );
    cleanupCommentIds.push(comment.id);

    // Other user cannot delete
    const result = await deleteComment(comment.id, userId2, 'USER');
    expect(result.success).toBe(false);

    // Author can delete
    const ownerResult = await deleteComment(comment.id, userId1, 'USER');
    expect(ownerResult.success).toBe(true);
  });

  it('soft-deletes comment and removes from listing', async () => {
    const comment = await createComment(userId1, testPostId, '곧 삭제될 댓글');
    cleanupCommentIds.push(comment.id);

    await deleteComment(comment.id, userId1, 'USER');

    const { comments } = await getComments(testPostId, undefined, userId1);
    const found = comments.find((c) => c.id === comment.id);
    expect(found).toBeUndefined();
  });

  it('decrements post commentCount when comment is deleted', async () => {
    const comment = await createComment(
      userId1,
      testPostId,
      '카운트 감소 확인',
    );
    cleanupCommentIds.push(comment.id);

    const before = await getPost(testPostId, userId1);
    const beforeCount = before!.commentCount;

    await deleteComment(comment.id, userId1, 'USER');

    const after = await getPost(testPostId, userId1);
    expect(after!.commentCount).toBe(beforeCount - 1);
  });
});
