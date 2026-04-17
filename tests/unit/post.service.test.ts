import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Category } from '@prisma/client';
import {
  getPosts,
  getPost,
  createPost,
  deletePost,
} from '@/lib/services/post.service';

const prisma = new PrismaClient();

let testUserId: string;
let testAdminId: string;
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
});

afterAll(async () => {
  // Cleanup created posts
  if (createdPostIds.length > 0) {
    await prisma.post.deleteMany({
      where: { id: { in: createdPostIds } },
    });
  }
  await prisma.$disconnect();
});

describe('post.service - createPost', () => {
  it('creates a post with correct fields and returns no PII', async () => {
    const post = await createPost(testUserId, {
      title: '테스트 게시글',
      content: '테스트 내용입니다',
      category: 'FREE' as Category,
    });

    createdPostIds.push(post.id);

    expect(post.id).toBeDefined();
    expect(post.title).toBe('테스트 게시글');
    expect(post.content).toBe('테스트 내용입니다');
    expect(post.category).toBe('FREE');
    expect(post.likeCount).toBe(0);
    expect(post.commentCount).toBe(0);
    expect(post.viewCount).toBe(0);
    expect(post.isLiked).toBe(false);
    expect(post.createdAt).toBeInstanceOf(Date);
    // No PII fields
    expect((post as any).authorId).toBeUndefined();
    expect((post as any).userId).toBeUndefined();
  });
});

describe('post.service - getPosts', () => {
  it('returns paginated posts sorted by latest', async () => {
    const result = await getPosts({ sort: 'latest', userId: testUserId });

    expect(result.posts.length).toBeGreaterThan(0);
    expect(result.posts.length).toBeLessThanOrEqual(20);

    // Verify descending order
    for (let i = 1; i < result.posts.length; i++) {
      expect(result.posts[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.posts[i].createdAt.getTime(),
      );
    }

    // Verify no PII
    for (const post of result.posts) {
      expect((post as any).authorId).toBeUndefined();
    }
  });

  it('filters posts by category', async () => {
    const result = await getPosts({
      sort: 'latest',
      category: 'FREE' as Category,
    });

    for (const post of result.posts) {
      expect(post.category).toBe('FREE');
    }
  });

  it('returns posts sorted by popular score', async () => {
    // Create posts with known likeCount and age for score verification
    const now = new Date();
    const oldPost = await createPost(testUserId, {
      title: '오래된 인기글',
      content: '오래됨',
      category: 'FREE' as Category,
    });
    createdPostIds.push(oldPost.id);

    const newPost = await createPost(testUserId, {
      title: '최근 인기글',
      content: '최신',
      category: 'FREE' as Category,
    });
    createdPostIds.push(newPost.id);

    // Give the old post many likes via direct DB update
    await prisma.post.update({
      where: { id: oldPost.id },
      data: { likeCount: 100, createdAt: new Date(Date.now() - 48 * 3600_000) },
    });
    await prisma.post.update({
      where: { id: newPost.id },
      data: { likeCount: 10, createdAt: new Date(Date.now() - 1 * 3600_000) },
    });

    const result = await getPosts({ sort: 'popular', userId: testUserId });
    expect(result.posts).toBeDefined();
    expect(Array.isArray(result.posts)).toBe(true);

    // Find both posts in results and verify new-liked ranks higher
    const oldIdx = result.posts.findIndex((p) => p.id === oldPost.id);
    const newIdx = result.posts.findIndex((p) => p.id === newPost.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      // new post with 10 likes at 1h should score higher than old post with 100 likes at 48h
      // new: 10 / (1+2)^1.5 = 10/5.196 = 1.925
      // old: 100 / (48+2)^1.5 = 100/353.5 = 0.283
      expect(newIdx).toBeLessThan(oldIdx);
    }
  });

  it('excludes deleted and hidden posts', async () => {
    // Create a post then soft-delete it
    const post = await createPost(testUserId, {
      title: '삭제될 게시글',
      content: '곧 삭제됩니다',
      category: 'FREE' as Category,
    });
    createdPostIds.push(post.id);

    await deletePost(post.id, testUserId, 'USER');

    const result = await getPosts({ sort: 'latest', userId: testUserId });
    const found = result.posts.find((p) => p.id === post.id);
    expect(found).toBeUndefined();
  });
});

describe('post.service - getPost', () => {
  it('returns a single post and increments view count', async () => {
    const created = await createPost(testUserId, {
      title: '조회수 테스트',
      content: '조회수가 올라야 합니다',
      category: 'QUESTION' as Category,
    });
    createdPostIds.push(created.id);

    const post = await getPost(created.id, testUserId);
    expect(post).not.toBeNull();
    expect(post!.title).toBe('조회수 테스트');
    expect(post!.viewCount).toBe(1);

    // Second view should increment
    const post2 = await getPost(created.id, testUserId);
    expect(post2!.viewCount).toBe(2);
  });

  it('returns null for deleted posts', async () => {
    const created = await createPost(testUserId, {
      title: '삭제 후 조회',
      content: '삭제 후 조회 불가',
      category: 'INFO' as Category,
    });
    createdPostIds.push(created.id);

    await deletePost(created.id, testUserId, 'USER');

    const post = await getPost(created.id, testUserId);
    expect(post).toBeNull();
  });
});

describe('post.service - deletePost', () => {
  it('allows author to soft-delete their own post', async () => {
    const created = await createPost(testUserId, {
      title: '작성자 삭제',
      content: '작성자가 삭제합니다',
      category: 'FREE' as Category,
    });
    createdPostIds.push(created.id);

    const result = await deletePost(created.id, testUserId, 'USER');
    expect(result.success).toBe(true);

    // Verify soft deleted
    const dbPost = await prisma.post.findUnique({
      where: { id: created.id },
    });
    expect(dbPost!.isDeleted).toBe(true);
  });

  it('allows admin to delete any post', async () => {
    const created = await createPost(testUserId, {
      title: '관리자 삭제',
      content: '관리자가 삭제합니다',
      category: 'FREE' as Category,
    });
    createdPostIds.push(created.id);

    const result = await deletePost(created.id, testAdminId, 'ADMIN');
    expect(result.success).toBe(true);
  });

  it('rejects deletion by non-author non-admin', async () => {
    const otherUser = await prisma.user.findFirstOrThrow({
      where: { email: 'test-user-2@test.com' },
    });

    const created = await createPost(testUserId, {
      title: '권한 없는 삭제',
      content: '다른 사용자가 삭제할 수 없습니다',
      category: 'FREE' as Category,
    });
    createdPostIds.push(created.id);

    const result = await deletePost(created.id, otherUser.id, 'USER');
    expect(result.success).toBe(false);
    expect(result.error).toBe('삭제 권한이 없습니다.');
  });

  it('returns error for non-existent post', async () => {
    const result = await deletePost(
      '00000000-0000-0000-0000-000000000000',
      testUserId,
      'USER',
    );
    expect(result.success).toBe(false);
  });
});

describe('post.service - cursor pagination', () => {
  it('returns next page with cursor for latest sort', async () => {
    // Create enough posts to have multiple pages
    const posts = [];
    for (let i = 0; i < 22; i++) {
      const p = await createPost(testUserId, {
        title: `페이지네이션 테스트 ${i}`,
        content: `내용 ${i}`,
        category: 'INFO' as Category,
      });
      createdPostIds.push(p.id);
      posts.push(p);
    }

    const page1 = await getPosts({
      sort: 'latest',
      category: 'INFO' as Category,
    });
    expect(page1.posts.length).toBeLessThanOrEqual(20);

    if (page1.nextCursor) {
      const page2 = await getPosts({
        sort: 'latest',
        cursor: page1.nextCursor,
        category: 'INFO' as Category,
      });
      expect(page2.posts.length).toBeGreaterThan(0);

      // Ensure no overlap between page 1 and page 2
      const page1Ids = new Set(page1.posts.map((p) => p.id));
      for (const p of page2.posts) {
        expect(page1Ids.has(p.id)).toBe(false);
      }
    }
  });
});

describe('post.service - isLiked', () => {
  it('returns isLiked true when user has liked a post', async () => {
    const post = await createPost(testUserId, {
      title: '좋아요 테스트',
      content: '좋아요 확인',
      category: 'FREE' as Category,
    });
    createdPostIds.push(post.id);

    // Create a like directly in DB
    const like = await prisma.like.create({
      data: {
        userId: testUserId,
        targetType: 'POST',
        targetId: post.id,
      },
    });

    const detail = await getPost(post.id, testUserId);
    expect(detail).not.toBeNull();
    expect(detail!.isLiked).toBe(true);

    // Cleanup like
    await prisma.like.delete({ where: { id: like.id } });
  });
});
