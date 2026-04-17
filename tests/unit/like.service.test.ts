import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Category } from '@prisma/client';
import { toggleLike } from '@/lib/services/like.service';
import { createPost } from '@/lib/services/post.service';

const prisma = new PrismaClient();

let testUserId: string;
let testUser2Id: string;
let testPostId: string;
let createdPostIds: string[] = [];

beforeAll(async () => {
  const user = await prisma.user.findFirstOrThrow({
    where: { email: 'test-user-1@test.com' },
  });
  testUserId = user.id;

  const user2 = await prisma.user.findFirstOrThrow({
    where: { email: 'test-user-2@test.com' },
  });
  testUser2Id = user2.id;

  const post = await createPost(testUserId, {
    title: '좋아요 테스트용 게시글',
    content: '좋아요 기능을 테스트합니다',
    category: 'FREE' as Category,
  });
  testPostId = post.id;
  createdPostIds.push(post.id);
});

afterAll(async () => {
  // Clean up likes
  await prisma.like.deleteMany({
    where: { targetId: { in: createdPostIds } },
  });
  // Clean up posts
  await prisma.post.deleteMany({
    where: { id: { in: createdPostIds } },
  });
  await prisma.$disconnect();
});

describe('like.service - toggleLike', () => {
  it('liking a post increases its likeCount and returns liked=true', async () => {
    const result = await toggleLike(testUserId, 'POST', testPostId);

    expect(result.liked).toBe(true);
    expect(result.likeCount).toBe(1);

    // Verify in database
    const post = await prisma.post.findUnique({
      where: { id: testPostId },
      select: { likeCount: true },
    });
    expect(post?.likeCount).toBe(1);
  });

  it('unliking a post decreases its likeCount and returns liked=false', async () => {
    const result = await toggleLike(testUserId, 'POST', testPostId);

    expect(result.liked).toBe(false);
    expect(result.likeCount).toBe(0);

    const post = await prisma.post.findUnique({
      where: { id: testPostId },
      select: { likeCount: true },
    });
    expect(post?.likeCount).toBe(0);
  });

  it('multiple users can like the same post, each incrementing count', async () => {
    const r1 = await toggleLike(testUserId, 'POST', testPostId);
    expect(r1.liked).toBe(true);
    expect(r1.likeCount).toBe(1);

    const r2 = await toggleLike(testUser2Id, 'POST', testPostId);
    expect(r2.liked).toBe(true);
    expect(r2.likeCount).toBe(2);

    // Cleanup
    await toggleLike(testUserId, 'POST', testPostId);
    await toggleLike(testUser2Id, 'POST', testPostId);
  });

  it('toggling like twice returns to original state (count=0)', async () => {
    await toggleLike(testUserId, 'POST', testPostId);
    const result = await toggleLike(testUserId, 'POST', testPostId);

    expect(result.liked).toBe(false);
    expect(result.likeCount).toBe(0);
  });
});
