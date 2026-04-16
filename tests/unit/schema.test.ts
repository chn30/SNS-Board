import { describe, it, expect } from 'vitest';
import { PrismaClient, Role, Category } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Schema Validation', () => {
  it('should have all 6 models accessible via Prisma client', () => {
    expect(prisma.user).toBeDefined();
    expect(prisma.post).toBeDefined();
    expect(prisma.comment).toBeDefined();
    expect(prisma.like).toBeDefined();
    expect(prisma.report).toBeDefined();
    expect(prisma.adminLog).toBeDefined();
  });

  it('should have correct Role enum values', () => {
    expect(Role.USER).toBe('USER');
    expect(Role.ADMIN).toBe('ADMIN');
  });

  it('should have correct Category enum values', () => {
    expect(Category.FREE).toBe('FREE');
    expect(Category.QUESTION).toBe('QUESTION');
    expect(Category.INFO).toBe('INFO');
  });
});

describe('Database Seed Data', () => {
  it('should have seeded 5 regular users with correct emails', async () => {
    const users = await prisma.user.findMany({
      where: { role: Role.USER },
      orderBy: { email: 'asc' },
    });
    expect(users.length).toBe(5);
    for (let i = 1; i <= 5; i++) {
      expect(users[i - 1].email).toBe(`test-user-${i}@test.com`);
    }
  });

  it('should have seeded 1 admin user with correct email', async () => {
    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN },
    });
    expect(admins.length).toBe(1);
    expect(admins[0].email).toBe('test-admin-1@test.com');
  });

  it('should have seeded posts with titles, content, and categories', async () => {
    const posts = await prisma.post.findMany();
    expect(posts.length).toBeGreaterThanOrEqual(5);
    for (const post of posts) {
      expect(post.title.length).toBeGreaterThan(0);
      expect(post.content.length).toBeGreaterThan(0);
      expect(['FREE', 'QUESTION', 'INFO']).toContain(post.category);
    }
  });

  it('should have seeded comments linked to posts', async () => {
    const comments = await prisma.comment.findMany({
      include: { post: true },
    });
    expect(comments.length).toBeGreaterThan(0);
    for (const comment of comments) {
      expect(comment.postId).toBeTruthy();
      expect(comment.post).toBeTruthy();
      expect(comment.content.length).toBeGreaterThan(0);
    }
  });

  it('should have users with hashed passwords (not plaintext)', async () => {
    const user = await prisma.user.findFirst({
      where: { email: 'test-user-1@test.com' },
    });
    expect(user).toBeTruthy();
    expect(user!.password).not.toBe('password');
    expect(user!.password.startsWith('$2')).toBe(true); // bcrypt hash prefix
  });

  it('should have posts with accurate commentCount', async () => {
    const posts = await prisma.post.findMany({
      include: { _count: { select: { comments: true } } },
    });
    for (const post of posts) {
      expect(post.commentCount).toBe(post._count.comments);
    }
  });
});

describe('Database Constraints', () => {
  it('should enforce unique email constraint on User', async () => {
    await expect(
      prisma.user.create({
        data: {
          ssoId: 'duplicate-sso',
          email: 'test-user-1@test.com',
          password: 'hash',
          role: Role.USER,
        },
      }),
    ).rejects.toThrow();
  });

  it('should enforce unique ssoId constraint on User', async () => {
    await expect(
      prisma.user.create({
        data: {
          ssoId: 'sso-test-user-1',
          email: 'unique-email@test.com',
          password: 'hash',
          role: Role.USER,
        },
      }),
    ).rejects.toThrow();
  });

  it('should enforce unique Like constraint (userId + targetType + targetId)', async () => {
    const user = await prisma.user.findFirst({
      where: { email: 'test-user-1@test.com' },
    });
    const post = await prisma.post.findFirst();

    // Create first like
    const like = await prisma.like.create({
      data: {
        userId: user!.id,
        targetType: 'POST',
        targetId: post!.id,
      },
    });

    // Duplicate should fail
    await expect(
      prisma.like.create({
        data: {
          userId: user!.id,
          targetType: 'POST',
          targetId: post!.id,
        },
      }),
    ).rejects.toThrow();

    // Cleanup
    await prisma.like.delete({ where: { id: like.id } });
  });

  it('should set default values correctly on Post creation', async () => {
    const user = await prisma.user.findFirst();
    const post = await prisma.post.create({
      data: {
        authorId: user!.id,
        title: 'Default test',
        content: 'Testing defaults',
        category: Category.FREE,
      },
    });

    expect(post.isDeleted).toBe(false);
    expect(post.isHidden).toBe(false);
    expect(post.likeCount).toBe(0);
    expect(post.commentCount).toBe(0);
    expect(post.viewCount).toBe(0);
    expect(post.createdAt).toBeInstanceOf(Date);

    // Cleanup
    await prisma.post.delete({ where: { id: post.id } });
  });
});
